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
    const [showPast, setShowPast] = useState(false);

    useEffect(() => {
        if (isLoaded && !isAdmin) {
            router.push("/");
        }
    }, [isLoaded, isAdmin, router]);

    if (!isLoaded || !isAdmin) {
        return <div className="admin-outer"><p className="text-center admin-loading">読み込み中...</p></div>;
    }

    const isPast = (b: any) => {
        const now = new Date();
        const [hours, minutes] = b.time.split(":").map(Number);
        const slotDateTime = new Date(b.date + "T00:00:00");
        slotDateTime.setHours(hours, minutes, 0, 0);
        return slotDateTime < now;
    };

    const filteredBookings = bookings?.filter(b => {
        // Status filter
        if (filter !== "all" && b.status !== filter) return false;
        // Past filter
        const past = isPast(b);
        if (showPast) return past; // Show only past
        return !past; // Show only future/today
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
                <div className="admin-card glass-panel" style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                        <span style={{ fontSize: "0.9rem", color: "#666" }}>ステータス:</span>
                        <div className="admin-filter-group">
                            <button className={`btn-outline-sm ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>すべて</button>
                            <button className={`btn-outline-sm ${filter === "confirmed" ? "active" : ""}`} onClick={() => setFilter("confirmed")}>確定</button>
                            <button className={`btn-outline-sm ${filter === "cancelled" ? "active" : ""}`} onClick={() => setFilter("cancelled")}>取消</button>
                        </div>
                    </div>
                    
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                        <button 
                            className={`btn-outline-sm ${showPast ? "active" : ""}`}
                            onClick={() => setShowPast(!showPast)}
                        >
                            {showPast ? "今後の予約を表示" : "過去の予約を表示"}
                        </button>
                    </div>
                </div>

                {!bookings && <p className="admin-loading">データを読み込み中...</p>}

                {bookings && filteredBookings?.length === 0 && (
                    <div className="admin-card text-center py-20">
                        <p className="text-muted">{showPast ? "過去の予約は見つかりませんでした。" : "該当する予約が見つかりませんでした。"}</p>
                    </div>
                )}

                {bookings && filteredBookings && filteredBookings.length > 0 && (
                    <div className="admin-card glass-panel" style={{ padding: 0, overflowX: "auto" }}>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>日時</th>
                                    <th>お客様名</th>
                                    <th>メニュー</th>
                                    <th>所要時間</th>
                                    <th>金額</th>
                                    <th>状態</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBookings.map((b) => (
                                    <tr key={b._id} className={`row-status-${b.status}`}>
                                        <td className="cell-datetime">
                                            <div style={{ fontWeight: "bold" }}>{b.date}</div>
                                            <div style={{ fontSize: "0.85rem", color: "#666" }}>{b.time}〜</div>
                                        </td>
                                        <td className="cell-user">
                                            <div style={{ fontWeight: "600" }}>{b.user?.name} 様</div>
                                            <div style={{ fontSize: "0.75rem", color: "#999" }}>{b.user?.email}</div>
                                        </td>
                                        <td className="cell-menu">
                                            <div style={{ fontSize: "0.9rem" }}>{b.menu?.title}</div>
                                            {b.addons && b.addons.length > 0 && (
                                                <div className="cell-addons">
                                                    +{b.addons.map((a: any) => a.title).join(", ")}
                                                </div>
                                            )}
                                        </td>
                                        <td className="cell-duration">{b.totalDuration}分</td>
                                        <td className="cell-price">¥{b.totalPrice?.toLocaleString()}</td>
                                        <td className="cell-status">
                                            <span className={`abc-status-badge status-${b.status}`}>
                                                {statusLabel[b.status] || b.status}
                                            </span>
                                        </td>
                                        <td className="cell-actions">
                                            {b.status === "confirmed" && !isPast(b) && (
                                                <button 
                                                    className="btn-danger-xs"
                                                    onClick={async () => {
                                                        if (window.confirm("この予約をキャンセルしますか？")) {
                                                            await cancelBooking({ bookingId: b._id });
                                                        }
                                                    }}
                                                >
                                                    取消
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style jsx>{`
                .admin-filter-group {
                    display: flex;
                    gap: 0.3rem;
                    background: #f5f0ed;
                    padding: 0.3rem;
                    border-radius: 8px;
                }
                
                .admin-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.9rem;
                }
                .admin-table th {
                    text-align: left;
                    padding: 1rem;
                    background: #f9f7f5;
                    color: #8a7b70;
                    font-weight: 600;
                    border-bottom: 2px solid #efeae6;
                }
                .admin-table td {
                    padding: 1rem;
                    border-bottom: 1px solid #efeae6;
                    vertical-align: middle;
                }
                
                .row-status-cancelled {
                    opacity: 0.6;
                    background: #fafafa;
                }
                
                .cell-addons {
                    font-size: 0.75rem;
                    color: #9E9088;
                    margin-top: 0.2rem;
                }
                
                .abc-status-badge {
                    font-size: 0.75rem;
                    padding: 0.2rem 0.5rem;
                    border-radius: 4px;
                    white-space: nowrap;
                }
                .abc-status-badge.status-confirmed { background: #efeae6; color: #B89B8A; }
                .abc-status-badge.status-cancelled { background: #fee2e2; color: #ef4444; }

                .btn-danger-xs {
                   background: #fee2e2;
                   color: #ef4444;
                   border: none;
                   padding: 0.2rem 0.5rem;
                   border-radius: 4px;
                   cursor: pointer;
                   font-size: 0.75rem;
                }
                .btn-danger-xs:hover { background: #fecaca; }

                .btn-outline-sm.active {
                    background: var(--color-primary);
                    color: white;
                    border-color: var(--color-primary);
                }
            `}</style>
        </div>
    );
}
