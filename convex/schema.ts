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
        .index("by_date", ["date"]),
});
