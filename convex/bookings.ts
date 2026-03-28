import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createBooking = mutation({
    args: {
        menuId: v.id("menus"),
        date: v.string(),
        time: v.string(),
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
            });
            user = await ctx.db.get(userId);
        }

        if (!user) throw new Error("ユーザーが見つかりません");

        // ★ Duplicate booking prevention: check if the same slot is already taken
        const existing = await ctx.db
            .query("bookings")
            .withIndex("by_date_time", (q) =>
                q.eq("date", args.date).eq("time", args.time)
            )
            .filter((q) => q.neq(q.field("status"), "cancelled"))
            .first();

        if (existing) {
            throw new Error("この時間帯はすでに予約が入っています。別の時間をお選びください。");
        }

        return await ctx.db.insert("bookings", {
            userId: user._id,
            menuId: args.menuId,
            date: args.date,
            time: args.time,
            status: "confirmed",
        });
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
    },
});
