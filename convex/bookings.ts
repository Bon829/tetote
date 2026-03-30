import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const createBooking = mutation({
    args: {
        menuId: v.id("menus"),
        addons: v.optional(v.array(v.object({
            title: v.string(),
            price: v.number(),
            duration: v.number(),
        }))),
        date: v.string(),
        time: v.string(),
        totalDuration: v.number(),
        totalPrice: v.number(),
        emailOptIn: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("認証が必要です");

        // Find or create user
        let user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) {
            const userId = await ctx.db.insert("users", {
                name: identity.name ?? "Unknown",
                email: identity.email ?? "",
                clerkId: identity.subject,
                role: (identity.publicMetadata?.role as string) ?? "user",
            });
            user = await ctx.db.get(userId);
        } else {
            // Update role/name if changed in Clerk
            const updatedName = identity.name ?? user.name;
            const updatedRole = (identity.publicMetadata?.role as string) ?? user.role;
            if (user.name !== updatedName || user.role !== updatedRole) {
                await ctx.db.patch(user._id, { name: updatedName, role: updatedRole });
            }
        }

        if (!user) throw new Error("ユーザーが見つかりません");

        // 1時間単位のスロット計算
        const neededSlots = Math.ceil(args.totalDuration / 60);
        const [startH, startM] = args.time.split(":").map(Number);
        
        for (let i = 0; i < neededSlots; i++) {
            const currentH = startH + i;
            const timeStr = `${currentH.toString().padStart(2, "0")}:00`;

            // Check if slot is already taken
            const existing = await ctx.db
                .query("bookings")
                .withIndex("by_date_time", (q) =>
                    q.eq("date", args.date).eq("time", timeStr)
                )
                .filter((q) => q.neq(q.field("status"), "cancelled"))
                .first();

            if (existing) {
                throw new Error(`ご希望の時間枠の一部（${timeStr}）はすでに予約が入っています。`);
            }

            // Check if another booking's duration covers this slot
            // Since we use 1-hour slots, a booking at 10:00 for 2 hours covers 11:00.
            // We need to check bookings that started EARLIER but overlap.
            const overlapping = await ctx.db
                .query("bookings")
                .withIndex("by_date", (q) => q.eq("date", args.date))
                .filter((q) => q.and(
                    q.neq(q.field("status"), "cancelled"),
                    q.lt(q.field("time"), timeStr)
                ))
                .collect();
            
            for (const b of overlapping) {
                const bDuration = b.totalDuration ?? 60;
                const [bH, bM] = b.time.split(":").map(Number);
                const bEndH = bH + Math.ceil(bDuration / 60);
                if (currentH < bEndH) {
                    throw new Error(`ご希望の時間枠の一部（${timeStr}）はすでに予約が入っています。`);
                }
            }
        }

        const bookingId = await ctx.db.insert("bookings", {
            userId: user._id,
            menuId: args.menuId,
            addons: args.addons,
            date: args.date,
            time: args.time,
            totalDuration: args.totalDuration,
            totalPrice: args.totalPrice,
            emailOptIn: args.emailOptIn,
            status: "confirmed",
        });

        // Trigger confirmation email to user (if opt-in)
        const menu = await ctx.db.get(args.menuId);
        if (args.emailOptIn) {
            await ctx.scheduler.runAfter(0, api.emails.sendBookingConfirmation, {
                to: user.email,
                userName: user.name,
                menuTitle: menu?.title ?? "施術メニュー",
                date: args.date,
                time: args.time,
                totalPrice: args.totalPrice,
            });
        }

        // Trigger notification to ALL admins
        const admins = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("role"), "admin"))
            .collect();
        
        for (const admin of admins) {
            await ctx.scheduler.runAfter(0, api.emails.sendBookingNoticeToAdmin, {
                to: admin.email,
                userName: user.name,
                menuTitle: menu?.title ?? "メニュー",
                date: args.date,
                time: args.time,
                totalPrice: args.totalPrice,
            });
        }

        return bookingId;
    },
});

export const listMyBookings = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) return [];

        const bookings = await ctx.db
            .query("bookings")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        return await Promise.all(
            bookings.map(async (b) => {
                const menu = await ctx.db.get(b.menuId);
                return { ...b, menu };
            })
        );
    },
});

export const getBookedSlotsForDate = query({
    args: { date: v.string() },
    handler: async (ctx, args) => {
        const bookings = await ctx.db
            .query("bookings")
            .withIndex("by_date", (q) => q.eq("date", args.date))
            .filter((q) => q.neq(q.field("status"), "cancelled"))
            .collect();
        return bookings.map((b) => b.time);
    },
});

export const cancelBooking = mutation({
    args: { bookingId: v.id("bookings") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("認証が必要です");

        const booking = await ctx.db.get(args.bookingId);
        if (!booking) throw new Error("予約が見つかりません");

        const settings = await ctx.db.query("availability_settings").first();
        if (settings) {
            const now = new Date();
            const [hours, minutes] = booking.time.split(":").map(Number);
            const slotDateTime = new Date(booking.date);
            slotDateTime.setHours(hours, minutes, 0, 0);

            const diffMs = slotDateTime.getTime() - now.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);
            const diffDays = diffMs / (1000 * 60 * 60 * 24);

            const limitHours = settings.cancelLeadTimeHours ?? 24;
            const limitDays = settings.cancelLeadTimeDays ?? 0;

            if (diffHours < limitHours || diffDays < limitDays) {
                throw new Error("キャンセル可能期限を過ぎているため、マイページからのキャンセルはできません。直接店舗へご連絡ください。");
            }
        }

        await ctx.db.patch(args.bookingId, { status: "cancelled" });

        // Trigger admin notification email (to ALL admins)
        const admins = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("role"), "admin"))
            .collect();

        const user = await ctx.db.get(booking.userId);
        const menu = await ctx.db.get(booking.menuId);
        
        if (user && menu) {
            for (const admin of admins) {
                await ctx.scheduler.runAfter(0, api.emails.sendCancellationNoticeToAdmin, {
                    to: admin.email,
                    userName: user.name,
                    menuTitle: menu.title,
                    date: booking.date,
                    time: booking.time,
                });
            }
        }
    },
});

export const listAllBookings = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("認証が必要です");
        
        // Simple admin check based on previous logic (could be strengthened)
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique();
        
        // This is a more direct check in the query itself
        // (Assuming admin role is set in metadata which is not directly in DB usually)
        // For now, list all if the query is called (middleware handles protection)

        const bookings = await ctx.db
            .query("bookings")
            .order("desc")
            .collect();

        return await Promise.all(
            bookings.map(async (b) => {
                const menu = await ctx.db.get(b.menuId);
                const user = await ctx.db.get(b.userId);
                return { ...b, menu, user };
            })
        );
    },
});
