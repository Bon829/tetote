import { mutation } from "./_generated/server";

const demoMenus = [
    { title: "しっかりケアコース", description: "当店1番人気のコースです☺ 全身をしっかりケアして、むくみ・疲れをすっきり流します。", price: 5000, durationMinutes: 90 },
    { title: "ベーシックコース", description: "はじめての方にも安心。リンパの流れを整えて、軽やかな体に。", price: 4000, durationMinutes: 60 },
    { title: "肩頭すっきりコース", description: "服の着脱なしで施術できます。肩こり・頭の重さが気になる方におすすめ。", price: 3500, durationMinutes: 60 },
];

export const populateMenus = mutation({
    args: {},
    handler: async (ctx) => {
        const existing = await ctx.db.query("menus").collect();
        if (existing.length === 0) {
            for (const menu of demoMenus) {
                await ctx.db.insert("menus", menu);
            }
        }
    }
});
