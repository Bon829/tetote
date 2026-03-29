"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import "../admin.css";

export default function AdminBookingsPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const isAdmin = (user?.publicMetadata?.role === "admin") || ((user as any)?.metadata?.role === "admin");

    useEffect(() => {
        if (isLoaded && !isAdmin) {
            router.push("/");
        }
    }, [isLoaded, isAdmin, router]);

    const bookings = useQuery(api.bookings.listMyBookings);

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
