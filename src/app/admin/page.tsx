"use client";

import Link from "next/link";
import "./admin.css";

export default function AdminDashboard() {
    return (
        <div className="admin-outer">
            <div className="admin-header">
                <span className="admin-subtitle">MANAGEMENT</span>
                <h1 className="admin-title">管理メニュートップ</h1>
            </div>

            <div className="admin-sections">
                <div className="admin-grid-layout">
                    <Link href="/admin/availability" className="admin-menu-card glass-panel">
                        <div className="admin-menu-icon">📅</div>
                        <div className="admin-menu-info">
                            <h2 className="admin-section-title">予約枠・制限設定</h2>
                            <p className="admin-section-desc">営業時間、店休日、予約締切時間などの設定</p>
                        </div>
                    </Link>

                    <Link href="/admin/bookings" className="admin-menu-card glass-panel">
                        <div className="admin-menu-icon">📋</div>
                        <div className="admin-menu-info">
                            <h2 className="admin-section-title">予約一覧・確認</h2>
                            <p className="admin-section-desc">お客様からの予約状況の確認と管理</p>
                        </div>
                    </Link>
                </div>
            </div>

            <style jsx>{`
                .admin-grid-layout {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 2rem;
                    margin-top: 1rem;
                }
                .admin-menu-card {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    padding: 2.5rem;
                    text-decoration: none;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    cursor: pointer;
                }
                .admin-menu-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 15px 35px rgba(0,0,0,0.1);
                }
                .admin-menu-icon {
                    font-size: 3rem;
                }
                .admin-menu-info {
                    flex: 1;
                }
            `}</style>
        </div>
    );
}
