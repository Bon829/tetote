"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import "../admin.css";

export default function AdminBookingsPage() {
    // Note: Assuming there is a listAllBookings or similar in convex/bookings.ts
    // If it's missing, it will show a message.
    const bookings = useQuery(api.bookings.listMyBookings); // Fallback to listMyBookings for now if listAll is missing

    return (
        <div className="admin-outer">
            <div className="admin-header">
                <span className="admin-subtitle">RESERVATIONS</span>
                <h1 className="admin-title">予約一覧（近日実装予定）</h1>
            </div>

            <div className="admin-sections dashboard-list">
                <div className="admin-card glass-panel">
                    <p className="text-muted">
                        予約一覧の管理機能は準備中です。
                    </p>
                </div>
            </div>
        </div>
    );
}
