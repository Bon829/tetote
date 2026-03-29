import { action } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendBookingConfirmation = action({
    args: {
        to: v.string(),
        userName: v.string(),
        menuTitle: v.string(),
        date: v.string(),
        time: v.string(),
        totalPrice: v.number(),
    },
    handler: async (ctx, args) => {
        try {
            await resend.emails.send({
                from: "tetote <onboarding@resend.dev>", // Replace with your domain when ready
                to: args.to,
                subject: "【tetote】ご予約ありがとうございます",
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #B89B8A;">ご予約ありがとうございます</h2>
                        <p>${args.userName} 様</p>
                        <p>tetoteへのご予約を承りました。内容をご確認ください。</p>
                        <hr style="border: 1px solid #eee; margin: 20px 0;" />
                        <p><strong>メニュー:</strong> ${args.menuTitle}</p>
                        <p><strong>日時:</strong> ${args.date} ${args.time}〜</p>
                        <p><strong>金額:</strong> ¥${args.totalPrice.toLocaleString()}</p>
                        <hr style="border: 1px solid #eee; margin: 20px 0;" />
                        <p style="font-size: 14px; color: #666;">
                            ※キャンセルの場合は、予約期限内であればマイページからお手続きいただけます。<br />
                            期限を過ぎた場合は直接店舗へご連絡ください。
                        </p>
                    </div>
                `,
            });
            return { success: true };
        } catch (error) {
            console.error("Resend error:", error);
            return { success: false, error };
        }
    },
});

export const sendCancellationNoticeToAdmin = action({
    args: {
        userName: v.string(),
        menuTitle: v.string(),
        date: v.string(),
        time: v.string(),
    },
    handler: async (ctx, args) => {
        try {
            await resend.emails.send({
                from: "tetote <onboarding@resend.dev>",
                to: "tkn12369@gmail.com", // Temporary admin email from previous logs
                subject: "【tetote】予約キャンセル通知",
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #d94848;">予約キャンセル通知</h2>
                        <p>管理者様</p>
                        <p>以下の予約がユーザーによってキャンセルされました。</p>
                        <hr style="border: 1px solid #eee; margin: 20px 0;" />
                        <p><strong>お客様名:</strong> ${args.userName} 様</p>
                        <p><strong>メニュー:</strong> ${args.menuTitle}</p>
                        <p><strong>日時:</strong> ${args.date} ${args.time}〜</p>
                    </div>
                `,
            });
            return { success: true };
        } catch (error) {
            console.error("Resend error:", error);
            return { success: false, error };
        }
    },
});
