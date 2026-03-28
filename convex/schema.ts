import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(),
        clerkId: v.string(),
    }).index("by_clerk_id", ["clerkId"]),

    menus: defineTable({
        title: v.string(),
        description: v.string(),
        price: v.number(),
        durationMinutes: v.number(),
        imageUrl: v.optional(v.string()),
    }),

    bookings: defineTable({
        userId: v.id("users"),
        menuId: v.id("menus"),
        addons: v.optional(v.array(v.object({
            title: v.string(),
            price: v.number(),
            duration: v.number(),
        }))),
        date: v.string(), // ISO String (YYYY-MM-DD)
        time: v.string(), // HH:mm
        totalDuration: v.optional(v.number()),
        totalPrice: v.optional(v.number()),
        status: v.union(v.literal("pending"), v.literal("confirmed"), v.literal("cancelled")),
    }).index("by_user", ["userId"])
        .index("by_date", ["date"])
        .index("by_date_time", ["date", "time"]),

    // Admin settings for availability management
    availability_settings: defineTable({
        // Weekly blocked days (0=Sun, 1=Mon, ..., 6=Sat) - Legacy, keeping for backwards compatibility or simple configs
        blockedDaysOfWeek: v.array(v.number()),
        // Individual blocked dates (YYYY-MM-DD)
        blockedDates: v.array(v.string()),
        // Individually blocked time slots on specific dates
        blockedSlots: v.array(v.object({
            date: v.string(),
            time: v.string(),
        })),
        // Booking lead time: cannot book within X hours of the appointment
        leadTimeHours: v.number(),
        // Booking lead time: cannot book within X days in advance
        leadTimeDays: v.number(),
        // Max days in advance a booking can be made
        maxAdvanceDays: v.number(),

        // Cancel lead time: cannot cancel within X hours of appointment
        cancelLeadTimeHours: v.optional(v.number()),
        // Cancel lead time: cannot cancel within X days of appointment
        cancelLeadTimeDays: v.optional(v.number()),
        // Business Hours per day of week (0=Sun...6=Sat)
        businessHours: v.optional(v.array(v.object({
            dayOfWeek: v.number(),
            isClosed: v.boolean(),
            startTime: v.string(),
            endTime: v.string(),
        }))),
    }),
});
