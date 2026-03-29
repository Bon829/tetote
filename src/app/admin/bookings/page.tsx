"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import "../admin.css";

export default function AdminBookingsPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const isAdmin = (user?.publicMetadata?.role === "admin") || ((user as any)?.metadata?.role === "admin");

    const bookings = useQuery(api.bookings.listAllBookings);
    const cancelBooking = useMutation(api.bookings.cancelBooking);

    const [filter, setFilter] = useState<"all"|"confirmed"|"cancelled">("all");

    useEffect(() => {
        if (isLoaded && !isAdmin) {
            router.push("/");
        }
    }, [isLoaded, isAdmin, router]);

    if (!isLoaded || !isAdmin) {
        return <div className="admin-outer"><p className="text-center admin-loading">読み込み中...</p></div>;
    }

    const filteredBookings = bookings?.filter(b => {
        if (filter === "all") return true;
        return b.status === filter;
    });

    const statusLabel: Record<string, string> = {
        confirmed: "確定",
        cancelled: "取消済み",
        pending: "確認中"
    };

    return (
        <div className="admin-outer">
            <div className="admin-header">
                <span className="admin-subtitle">MANAGEMENT</span>
                <h1 className="admin-title">予約一覧・管理</h1>
            </div>

            <div className="admin-sections">
                <div className="admin-card glass-panel" style={{ marginBottom: "2rem" }}>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                        <span>表示フィルター:</span>
                        <button 
                            className={`btn-outline ${filter === "all" ? "active" : ""}`}
                            onClick={() => setFilter("all")}
                        >
                            すべて
                        </button>
                        <button 
                            className={`btn-outline ${filter === "confirmed" ? "active" : ""}`}
                            onClick={() => setFilter("confirmed")}
                        >
                            確定のみ
                        </button>
                        <button 
                            className={`btn-outline ${filter === "cancelled" ? "active" : ""}`}
                            onClick={() => setFilter("cancelled")}
                        >
                            キャンセルのみ
                        </button>
                    </div>
                </div>

                {!bookings && <p className="admin-loading">データを読み込み中...</p>}

                {bookings && filteredBookings?.length === 0 && (
                    <div className="admin-card text-center py-20">
                        <p className="text-muted">該当する予約が見つかりませんでした。</p>
                    </div>
                )}

                <div className="admin-booking-grid">
                    {filteredBookings?.map((b) => (
                        <div key={b._id} className={`admin-booking-card glass-panel status-${b.status}`}>
                            <div className="abc-header">
                                <div className="abc-user">
                                    <span className="abc-name">{b.user?.name} 様</span>
                                    <span className="abc-email">{b.user?.email}</span>
                                </div>
                                <span className={`abc-status-badge status-${b.status}`}>
                                    {statusLabel[b.status] || b.status}
                                </span>
                            </div>

                            <div className="abc-details">
                                <div className="abc-row">
                                    <span className="label">施術内容:</span>
                                    <span className="value">{b.menu?.title}</span>
                                </div>
                                <div className="abc-row">
                                    <span className="label">予約日時:</span>
                                    <span className="value" style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                                        {b.date} {b.time}〜
                                    </span>
                                </div>
                                <div className="abc-row">
                                    <span className="label">所要時間:</span>
                                    <span className="value">{b.totalDuration}分</span>
                                </div>
                                <div className="abc-row">
                                    <span className="label">合計金額:</span>
                                    <span className="value">¥{b.totalPrice?.toLocaleString()}</span>
                                </div>
                                {b.addons && b.addons.length > 0 && (
                                    <div className="abc-addons">
                                        追加: {b.addons.map((a: any) => a.title).join(", ")}
                                    </div>
                                )}
                            </div>

                            <div className="abc-footer">
                                <span className="abc-created">申込日: {new Date(b._creationTime).toLocaleDateString()}</span>
                                {b.status === "confirmed" && (
                                    <button 
                                        className="btn-danger-sm"
                                        onClick={async () => {
                                            if (window.confirm("この予約を管理者権限でキャンセルしますか？")) {
                                                await cancelBooking({ bookingId: b._id });
                                            }
                                        }}
                                    >
                                        キャンセル
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .admin-booking-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
                    gap: 1.5rem;
                }
                .admin-booking-card {
                    padding: 1.5rem;
                    border-left: 4px solid #ccc;
                    transition: all 0.3s ease;
                }
                .admin-booking-card.status-confirmed { border-left-color: #B89B8A; }
                .admin-booking-card.status-cancelled { border-left-color: #d94848; opacity: 0.8; }
                
                .abc-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1rem;
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                    padding-bottom: 0.8rem;
                }
                .abc-user { display: flex; flex-direction: column; }
                .abc-name { font-weight: bold; font-size: 1.1rem; }
                .abc-email { font-size: 0.8rem; color: #888; }
                
                .abc-status-badge {
                    font-size: 0.75rem;
                    padding: 0.25rem 0.6rem;
                    border-radius: 4px;
                    background: #eee;
                }
                .abc-status-badge.status-confirmed { background: #efeae6; color: #B89B8A; }
                .abc-status-badge.status-cancelled { background: #fee2e2; color: #ef4444; }

                .abc-details { margin-bottom: 1.2rem; }
                .abc-row { display: flex; justify-content: space-between; margin-bottom: 0.3rem; }
                .abc-row .label { color: #888; font-size: 0.9rem; }
                
                .abc-addons {
                    margin-top: 0.5rem;
                    font-size: 0.85rem;
                    color: #9E9088;
                    font-style: italic;
                }

                .abc-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.8rem;
                    color: #aaa;
                }

                .btn-danger-sm {
                   background: #fee2e2;
                   color: #ef4444;
                   border: none;
                   padding: 0.3rem 0.8rem;
                   border-radius: 4px;
                   cursor: pointer;
                   font-size: 0.85rem;
                }
                .btn-danger-sm:hover { background: #fecaca; }

                .btn-outline.active {
                    background: var(--color-primary);
                    color: white;
                    border-color: var(--color-primary);
                }
            `}</style>
        </div>
    );
}
