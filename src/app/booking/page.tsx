"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import "./booking.css";

const TIME_SLOTS = [
    "10:00", "11:00", "12:00", "13:00", "14:00",
    "15:00", "16:00", "17:00", "18:00", "19:00",
];

const GRID_DAYS = 7;

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

type Step = 1 | 2 | 3 | 4;

function getDateRange(startDate: Date, days: number) {
    return Array.from({ length: days }, (_, i) => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        return d.toISOString().split("T")[0];
    });
}

function formatDisplayDate(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const dow = DAY_LABELS[d.getDay()];
    return { short: `${m}/${day}`, dow };
}

export default function BookingPage() {
    const menus = useQuery(api.menus.listMenus);
    const createBooking = useMutation(api.bookings.createBooking);

    const [step, setStep] = useState<Step>(1);
    const [selectedMenu, setSelectedMenu] = useState<Id<"menus"> | null>(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDone, setIsDone] = useState(false);
    const [bookingError, setBookingError] = useState<string | null>(null);

    // Grid start date - today, adjustable by "previous/next week" buttons
    const [weekOffset, setWeekOffset] = useState(0);
    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const gridStartDate = useMemo(() => {
        const d = new Date(today);
        d.setDate(d.getDate() + weekOffset * GRID_DAYS);
        return d.toISOString().split("T")[0];
    }, [today, weekOffset]);

    const dates = useMemo(() => getDateRange(new Date(gridStartDate), GRID_DAYS), [gridStartDate]);

    const availabilityGrid = useQuery(api.availability.getAvailabilityGrid, {
        startDate: gridStartDate,
        days: GRID_DAYS,
        timeSlots: TIME_SLOTS,
    });

    const handleSlotClick = (date: string, time: string) => {
        const status = availabilityGrid?.[date]?.[time];
        if (status !== "available") return;
        setSelectedDate(date);
        setSelectedTime(time);
    };

    const handleSubmit = async () => {
        if (!selectedMenu || !selectedDate || !selectedTime) return;
        setIsSubmitting(true);
        setBookingError(null);
        try {
            await createBooking({ menuId: selectedMenu, date: selectedDate, time: selectedTime });
            setIsDone(true);
            setStep(4);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "予約に失敗しました";
            setBookingError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedMenuData = menus?.find((m) => m._id === selectedMenu);

    if (isDone) {
        return (
            <div className="booking-outer">
                <div className="booking-card glass-panel text-center animate-slide-up">
                    <div className="booking-done-icon">✓</div>
                    <h2 className="booking-done-title">ご予約が完了しました</h2>
                    <p className="text-muted">
                        <span style={{ display: "inline-block" }}>{selectedDate}</span>{" "}
                        <span style={{ display: "inline-block" }}>{selectedTime}〜</span>
                        <br />
                        {selectedMenuData?.title}
                    </p>
                    <a href="/mypage" className="btn-primary mt-8" style={{ display: "inline-block" }}>
                        予約を確認する
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="booking-outer">
            <div className="text-center mb-8 animate-fade-in">
                <p className="section-title" style={{ marginTop: 0 }}>RESERVATION</p>
                <h1 className="section-subtitle text-serif">ご予約</h1>
            </div>

            {/* Step Indicator */}
            <div className="booking-steps animate-fade-in">
                {[1, 2, 3].map((s) => (
                    <div key={s} className={`step-dot ${step >= s ? "active" : ""}`}>
                        <span>{s}</span>
                    </div>
                ))}
            </div>

            <div className="booking-card glass-panel animate-slide-up">
                {/* Step 1: Select Menu */}
                {step === 1 && (
                    <div>
                        <h2 className="booking-step-title text-serif">メニューを選択</h2>
                        {!menus && <p className="text-muted">Loading...</p>}
                        {menus?.length === 0 && (
                            <div className="booking-demo-menus">
                                {demoMenus.map((m) => (
                                    <div
                                        key={m.id}
                                        className={`menu-card ${selectedMenu === m.id as unknown as Id<"menus"> ? "selected" : ""}`}
                                        onClick={() => setSelectedMenu(m.id as unknown as Id<"menus">)}
                                    >
                                        <h3>{m.title}</h3>
                                        <p className="text-muted">{m.description}</p>
                                        <p className="menu-price">¥{m.price.toLocaleString()} / {m.durationMinutes}分</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        {menus && menus.length > 0 && (
                            <div className="booking-demo-menus">
                                {menus.map((m) => (
                                    <div
                                        key={m._id}
                                        className={`menu-card ${selectedMenu === m._id ? "selected" : ""}`}
                                        onClick={() => setSelectedMenu(m._id)}
                                    >
                                        <h3>{m.title}</h3>
                                        <p className="text-muted">{m.description}</p>
                                        <p className="menu-price">¥{m.price.toLocaleString()} / {m.durationMinutes}分</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button
                            className="btn-primary"
                            style={{ marginTop: "2rem" }}
                            disabled={!selectedMenu}
                            onClick={() => setStep(2)}
                        >
                            次へ
                        </button>
                    </div>
                )}

                {/* Step 2: Calendar Grid */}
                {step === 2 && (
                    <div>
                        <h2 className="booking-step-title text-serif">日時を選択</h2>

                        {/* Week navigation */}
                        <div className="calendar-nav">
                            <button
                                className="calendar-nav-btn"
                                onClick={() => setWeekOffset((o) => o - 1)}
                                disabled={weekOffset <= 0}
                            >
                                ← 前の週
                            </button>
                            <span className="calendar-nav-label">
                                {dates[0]} 〜 {dates[dates.length - 1]}
                            </span>
                            <button
                                className="calendar-nav-btn"
                                onClick={() => setWeekOffset((o) => o + 1)}
                            >
                                次の週 →
                            </button>
                        </div>

                        {/* Availability grid */}
                        <div className="availability-grid-wrap">
                            <table className="availability-grid">
                                <thead>
                                    <tr>
                                        <th className="grid-time-header"></th>
                                        {dates.map((d) => {
                                            const { short, dow } = formatDisplayDate(d);
                                            const isSat = new Date(d + "T00:00:00").getDay() === 6;
                                            const isSun = new Date(d + "T00:00:00").getDay() === 0;
                                            return (
                                                <th key={d} className={`grid-date-header ${isSat ? "saturday" : ""} ${isSun ? "sunday" : ""}`}>
                                                    <span className="grid-date-day">{short}</span>
                                                    <span className="grid-date-dow">{dow}</span>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {TIME_SLOTS.map((time) => (
                                        <tr key={time}>
                                            <td className="grid-time-label">{time}</td>
                                            {dates.map((date) => {
                                                const status = availabilityGrid?.[date]?.[time];
                                                const isSelected = selectedDate === date && selectedTime === time;
                                                const isLoading = !availabilityGrid;

                                                let cellClass = "grid-cell";
                                                let cellContent = "";

                                                if (isLoading) {
                                                    cellClass += " loading";
                                                    cellContent = "…";
                                                } else if (isSelected) {
                                                    cellClass += " selected";
                                                    cellContent = "◎";
                                                } else if (status === "available") {
                                                    cellClass += " available";
                                                    cellContent = "○";
                                                } else if (status === "booked") {
                                                    cellClass += " booked";
                                                    cellContent = "×";
                                                } else {
                                                    cellClass += " blocked";
                                                    cellContent = "×";
                                                }

                                                return (
                                                    <td
                                                        key={date}
                                                        className={cellClass}
                                                        onClick={() => handleSlotClick(date, time)}
                                                    >
                                                        {cellContent}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Legend */}
                        <div className="grid-legend">
                            <span className="legend-item"><span className="legend-mark available">○</span>予約可</span>
                            <span className="legend-item"><span className="legend-mark selected">◎</span>選択中</span>
                            <span className="legend-item"><span className="legend-mark booked">×</span>予約不可</span>
                        </div>

                        {selectedDate && selectedTime && (
                            <p className="selected-slot-info animate-fade-in">
                                選択中: <strong>{selectedDate}</strong> <strong>{selectedTime}</strong>
                            </p>
                        )}

                        <div className="booking-nav">
                            <button className="btn-outline" onClick={() => setStep(1)}>戻る</button>
                            <button
                                className="btn-primary"
                                disabled={!selectedDate || !selectedTime}
                                onClick={() => setStep(3)}
                            >
                                次へ
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Confirm */}
                {step === 3 && (
                    <div>
                        <h2 className="booking-step-title text-serif">予約内容の確認</h2>
                        <div className="confirm-table">
                            <div className="confirm-row">
                                <span>メニュー</span>
                                <span>{selectedMenuData?.title ?? "選択済み"}</span>
                            </div>
                            <div className="confirm-row">
                                <span>日付</span>
                                <span>{selectedDate}</span>
                            </div>
                            <div className="confirm-row">
                                <span>時間</span>
                                <span>{selectedTime}〜</span>
                            </div>
                        </div>
                        {bookingError && (
                            <p className="booking-error animate-fade-in">{bookingError}</p>
                        )}
                        <p className="text-muted" style={{ marginTop: "1.5rem", fontSize: "0.9rem" }}>
                            ※キャンセルはマイページから行えます。
                        </p>
                        <div className="booking-nav">
                            <button className="btn-outline" onClick={() => { setStep(2); setBookingError(null); }}>戻る</button>
                            <button
                                className="btn-primary"
                                disabled={isSubmitting}
                                onClick={handleSubmit}
                            >
                                {isSubmitting ? "送信中..." : "予約を確定する"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Demo menus used when Convex hasn't seeded data yet
const demoMenus = [
    { id: "demo-1", title: "しっかりケアコース", description: "当店1番人気のコースです☺ 全身をしっかりケアして、むくみ・疲れをすっきり流します。", price: 5000, durationMinutes: 90 },
    { id: "demo-2", title: "ベーシックコース", description: "はじめての方にも安心。リンパの流れを整えて、軽やかな体に。", price: 4000, durationMinutes: 60 },
    { id: "demo-3", title: "肩頭すっきりコース", description: "服の着脱なしで施術できます。肩こり・頭の重さが気になる方におすすめ。", price: 3500, durationMinutes: 60 },
];
