import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const DEFAULT_SETTINGS = {
    blockedDaysOfWeek: [] as number[],
    blockedDates: [] as string[],
    blockedSlots: [] as { date: string; time: string }[],
    leadTimeHours: 2,
    leadTimeDays: 0,
    maxAdvanceDays: 30,
    cancelLeadTimeHours: 24,
    cancelLeadTimeDays: 0,
    businessHours: Array.from({ length: 7 }, (_, i) => ({
        dayOfWeek: i,
        isClosed: false,
        startTime: "10:00",
        endTime: "19:00",
    })),
};

export const getSettings = query({
    args: {},
    handler: async (ctx) => {
        const settings = await ctx.db.query("availability_settings").first();
        return settings ?? DEFAULT_SETTINGS;
    },
});

export const upsertSettings = mutation({
    args: {
        blockedDaysOfWeek: v.array(v.number()),
        blockedDates: v.array(v.string()),
        blockedSlots: v.array(v.object({
            date: v.string(),
            time: v.string(),
        })),
        leadTimeHours: v.number(),
        leadTimeDays: v.number(),
        maxAdvanceDays: v.number(),
        cancelLeadTimeHours: v.optional(v.number()),
        cancelLeadTimeDays: v.optional(v.number()),
        businessHours: v.optional(v.array(v.object({
            dayOfWeek: v.number(),
            isClosed: v.boolean(),
            startTime: v.string(),
            endTime: v.string(),
        }))),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db.query("availability_settings").first();
        if (existing) {
            await ctx.db.patch(existing._id, args);
        } else {
            await ctx.db.insert("availability_settings", args);
        }
    },
});

export const toggleBlockedSlot = mutation({
    args: {
        date: v.string(),
        time: v.string(),
    },
    handler: async (ctx, args) => {
        const settings = await ctx.db.query("availability_settings").first();
        const current = settings ?? { ...DEFAULT_SETTINGS };

        const existingIdx = current.blockedSlots.findIndex(
            (s) => s.date === args.date && s.time === args.time
        );

        let newSlots;
        if (existingIdx >= 0) {
            // Remove from blocked list
            newSlots = current.blockedSlots.filter((_, i) => i !== existingIdx);
        } else {
            // Add to blocked list
            newSlots = [...current.blockedSlots, { date: args.date, time: args.time }];
        }

        if (settings) {
            await ctx.db.patch(settings._id, { blockedSlots: newSlots });
        } else {
            await ctx.db.insert("availability_settings", { ...DEFAULT_SETTINGS, blockedSlots: newSlots });
        }
    },
});

// Returns a grid: { date: { time: "available" | "booked" | "blocked" } }
export const getAvailabilityGrid = query({
    args: {
        startDate: v.string(), // YYYY-MM-DD
        days: v.number(),      // how many days to show
        timeSlots: v.array(v.string()), // ["10:00", "11:00", ...]
        totalDuration: v.optional(v.number()), // Total duration in minutes (including addons)
    },
    handler: async (ctx, args) => {
        const settings = await ctx.db.query("availability_settings").first();
        const cfg = settings ?? DEFAULT_SETTINGS;

        const now = new Date();

        const grid: Record<string, Record<string, string>> = {};

        for (let d = 0; d < args.days; d++) {
            const dateObj = new Date(args.startDate);
            dateObj.setDate(dateObj.getDate() + d);
            const dateStr = dateObj.toISOString().split("T")[0];

            grid[dateStr] = {};

            const dayOfWeek = dateObj.getDay(); // 0=Sun
            const bh = cfg.businessHours?.find((b: any) => b.dayOfWeek === dayOfWeek);

            // Check if entire day is blocked
            const dayBlocked =
                cfg.blockedDaysOfWeek.includes(dayOfWeek) ||
                cfg.blockedDates.includes(dateStr) ||
                (bh && bh.isClosed);

            // Get all bookings for this date
            const dayBookings = await ctx.db
                .query("bookings")
                .withIndex("by_date", (q) => q.eq("date", dateStr))
                .collect();

            const bookedTimes = new Set();
            const blockedByDuration: Set<string> = new Set();

            for (const b of dayBookings) {
                if (b.status === "cancelled") continue;
                bookedTimes.add(b.time);

                // If booking spans multiple slots
                const duration = b.totalDuration ?? 60;
                if (duration > 60) {
                    const extraSlots = Math.ceil(duration / 60) - 1;
                    const startTimeIdx = args.timeSlots.indexOf(b.time);
                    if (startTimeIdx !== -1) {
                        for (let i = 1; i <= extraSlots; i++) {
                            const nextSlot = args.timeSlots[startTimeIdx + i];
                            if (nextSlot) blockedByDuration.add(nextSlot);
                        }
                    }
                }
            }

            for (const time of args.timeSlots) {
                if (dayBlocked) {
                    grid[dateStr][time] = "blocked";
                    continue;
                }

                // Honor business hours range
                if (bh && !bh.isClosed) {
                    const slotTimeNum = parseInt(time.replace(":", ""), 10);
                    const startNum = parseInt(bh.startTime.replace(":", ""), 10);
                    const endNum = parseInt(bh.endTime.replace(":", ""), 10);
                    if (slotTimeNum < startNum || slotTimeNum > endNum) {
                        grid[dateStr][time] = "blocked";
                        continue;
                    }
                }

                // Check individual slot block
                const slotBlocked = cfg.blockedSlots.some(
                    (s) => s.date === dateStr && s.time === time
                );
                if (slotBlocked) {
                    grid[dateStr][time] = "blocked";
                    continue;
                }

                // Check lead time
                const [hours, minutes] = time.split(":").map(Number);
                const slotDateTime = new Date(dateStr);
                slotDateTime.setHours(hours, minutes, 0, 0);

                const diffMs = slotDateTime.getTime() - now.getTime();
                const diffHours = diffMs / (1000 * 60 * 60);
                const diffDays = diffMs / (1000 * 60 * 60 * 24);

                if (diffHours < cfg.leadTimeHours || diffDays < cfg.leadTimeDays) {
                    grid[dateStr][time] = "blocked";
                    continue;
                }

                // Check maxAdvanceDays
                const maxDate = new Date(now);
                maxDate.setDate(maxDate.getDate() + cfg.maxAdvanceDays);
                if (slotDateTime > maxDate) {
                    grid[dateStr][time] = "blocked";
                    continue;
                }

                if (bookedTimes.has(time) || blockedByDuration.has(time)) {
                    grid[dateStr][time] = "booked";
                    continue;
                }

                // If we are looking for a specific duration, check if subsequent slots are also free
                if (args.totalDuration && args.totalDuration > 60) {
                    const neededSlots = Math.ceil(args.totalDuration / 60);
                    const timeIdx = args.timeSlots.indexOf(time);
                    let canFit = true;

                    for (let i = 0; i < neededSlots; i++) {
                        const checkTime = args.timeSlots[timeIdx + i];
                        if (!checkTime) {
                            canFit = false; // End of available hours
                            break;
                        }
                        
                        // Check if this specific slot would be blocked/booked
                        // (We need to re-run basic slot checks or ensure they are consistent)
                        // Simplified: check if checkTime is already in bookedTimes/blockedByDuration
                        if (bookedTimes.has(checkTime) || blockedByDuration.has(checkTime)) {
                            canFit = false;
                            break;
                        }

                        // Also check Business Hours and individual blocks for subsequent slots
                        const bhSlot = cfg.businessHours?.find((b: any) => b.dayOfWeek === dayOfWeek);
                        if (bhSlot && !bhSlot.isClosed) {
                            const tNum = parseInt(checkTime.replace(":", ""), 10);
                            const endNum = parseInt(bhSlot.endTime.replace(":", ""), 10);
                            if (tNum > endNum) {
                                canFit = false;
                                break;
                            }
                        }
                        if (cfg.blockedSlots.some(s => s.date === dateStr && s.time === checkTime)) {
                            canFit = false;
                            break;
                        }
                    }

                    if (!canFit) {
                        grid[dateStr][time] = "blocked";
                        continue;
                    }
                }

                grid[dateStr][time] = "available";
            }
        }

        return grid;
    },
});
