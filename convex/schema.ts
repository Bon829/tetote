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
        date: v.string(), // ISO String (YYYY-MM-DD)
        time: v.string(), // HH:mm
        status: v.union(v.literal("pending"), v.literal("confirmed"), v.literal("cancelled")),
    }).index("by_user", ["userId"])
        .index("by_date", ["date"])
        .index("by_date_time", ["date", "time"]),

    // Admin settings for availability management
    availability_settings: defineTable({
        // Weekly blocked days (0=Sun, 1=Mon, ..., 6=Sat)
        blockedDaysOfWeek: v.array(v.number()),
        // Individual blocked dates (YYYY-MM-DD)
        blockedDates: v.array(v.string()),
        // Individually blocked time slots on specific dates
        blockedSlots: v.array(v.object({
            date: v.string(),
            time: v.string(),
        })),
        // Lead time: cannot book within X hours of the appointment
        leadTimeHours: v.number(),
        // Lead time: cannot book within X days in advance
        leadTimeDays: v.number(),
        // Max days in advance a booking can be made
        maxAdvanceDays: v.number(),
    }),
});
