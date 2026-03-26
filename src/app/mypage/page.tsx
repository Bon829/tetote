"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { UserButton } from "@clerk/nextjs";
import "./mypage.css";

export default function MyPage() {
    const bookings = useQuery(api.bookings.listMyBookings);

    const statusLabel = {
        pending: "確認中",
        confirmed: "確定済み",
        cancelled: "キャンセル済み",
    };

    const statusClass = {
        pending: "status-pending",
        confirmed: "status-confirmed",
        cancelled: "status-cancelled",
    };

    return (
        <div className="mypage-outer">
            <div className="mypage-header animate-slide-up">
                <div className="mypage-user">
                    <UserButton />
                    <h1 className="mypage-title">マイページ</h1>
                </div>
                <a href="/booking" className="btn-primary">新しく予約する</a>
            </div>

            <div className="mypage-content animate-slide-up delay-300">
                <h2 className="mypage-section-title">予約履歴</h2>

                {!bookings && (
                    <p className="text-muted">読み込み中...</p>
                )}

                {bookings && bookings.length === 0 && (
                    <div className="mypage-empty glass-panel text-center">
                        <p className="text-muted">まだご予約がありません。</p>
                        <a href="/booking" className="btn-outline mt-8" style={{ display: "inline-block" }}>
                            予約する
                        </a>
                    </div>
                )}

                <div className="booking-list">
                    {bookings?.map((b) => (
                        <div key={b._id} className="booking-item glass-panel">
                            <div className="booking-item-header">
                                <h3 className="booking-menu-name">{b.menu?.title ?? "メニュー"}</h3>
                                <span className={`status-badge ${statusClass[b.status]}`}>
                                    {statusLabel[b.status]}
                                </span>
                            </div>
                            <div className="booking-item-details">
                                <span>📅 {b.date}</span>
                                <span>🕐 {b.time}〜</span>
                                <span>¥{b.menu?.price?.toLocaleString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
