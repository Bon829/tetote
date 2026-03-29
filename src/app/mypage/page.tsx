"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { UserButton, useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import "./mypage.css";

export default function MyPage() {
    const { user, isLoaded } = useUser();
    const bookings = useQuery(api.bookings.listMyBookings);
    
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const cancelBooking = useMutation(api.bookings.cancelBooking);
    const settings = useQuery(api.availability.getSettings);

    useEffect(() => {
        if (user) {
            setNewName(user.firstName || user.fullName || "");
        }
    }, [user]);

    const handleUpdateName = async () => {
        if (!user || !newName.trim() || isSaving) return;
        setIsSaving(true);
        try {
            await user.update({
                firstName: newName.trim(),
            });
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to update name:", err);
            alert("名前の更新に失敗しました。");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isLoaded) return <div className="mypage-outer"><p className="text-center">読み込み中...</p></div>;

    const userName = user?.firstName || user?.fullName || "お客様";

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
                    {isEditing ? (
                        <div className="mypage-edit-form">
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="mypage-name-input"
                                autoFocus
                            />
                            <div className="mypage-edit-actions">
                                <button onClick={handleUpdateName} disabled={isSaving} className="btn-save">
                                    {isSaving ? "保存中..." : "保存"}
                                </button>
                                <button onClick={() => setIsEditing(false)} className="btn-cancel">取消</button>
                            </div>
                        </div>
                    ) : (
                        <div className="mypage-user-info">
                            <h1 className="mypage-title">{userName} 様</h1>
                            <button onClick={() => setIsEditing(true)} className="btn-edit-name">✎ 変更</button>
                        </div>
                    )}
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
                                <span>🕒 {b.totalDuration ?? b.menu?.durationMinutes}分</span>
                                <span>¥{(b.totalPrice ?? b.menu?.price)?.toLocaleString()}</span>
                            </div>
                            {b.addons && b.addons.length > 0 && (
                                <div className="booking-item-addons" style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                                    追加: {b.addons.map((a: any) => a.title).join("・")}
                                </div>
                            )}
                            {b.status === "confirmed" && (
                                <div className="booking-item-actions" style={{ marginTop: "1rem" }}>
                                    <button 
                                        className="btn-outline-danger"
                                        onClick={async () => {
                                            if (window.confirm("この予約をキャンセルしてもよろしいですか？")) {
                                                try {
                                                    await cancelBooking({ bookingId: b._id });
                                                    alert("キャンセルが完了しました。");
                                                } catch (err: any) {
                                                    alert(err.message || "キャンセルの実行に失敗しました。");
                                                }
                                            }
                                        }}
                                    >
                                        キャンセルする
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
