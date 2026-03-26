"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import "./booking.css";

const TIME_SLOTS = [
    "10:00", "11:00", "12:00", "13:00", "14:00",
    "15:00", "16:00", "17:00", "18:00", "19:00",
];

type Step = 1 | 2 | 3 | 4;

export default function BookingPage() {
    const menus = useQuery(api.menus.listMenus);
    const createBooking = useMutation(api.bookings.createBooking);

    const [step, setStep] = useState<Step>(1);
    const [selectedMenu, setSelectedMenu] = useState<Id<"menus"> | null>(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDone, setIsDone] = useState(false);

    const today = new Date().toISOString().split("T")[0];

    const handleSubmit = async () => {
        if (!selectedMenu || !selectedDate || !selectedTime) return;
        setIsSubmitting(true);
        try {
            await createBooking({ menuId: selectedMenu, date: selectedDate, time: selectedTime });
            setIsDone(true);
            setStep(4);
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
                        {selectedDate} {selectedTime}〜<br />
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
                        <h2 className="booking-step-title">メニューを選択</h2>
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

                {/* Step 2: Select Date & Time */}
                {step === 2 && (
                    <div>
                        <h2 className="booking-step-title">日時を選択</h2>
                        <label className="form-label">日付</label>
                        <input
                            type="date"
                            className="form-input"
                            min={today}
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                        <label className="form-label" style={{ marginTop: "1.5rem" }}>時間帯</label>
                        <div className="time-grid">
                            {TIME_SLOTS.map((t) => (
                                <div
                                    key={t}
                                    className={`time-slot ${selectedTime === t ? "selected" : ""}`}
                                    onClick={() => setSelectedTime(t)}
                                >
                                    {t}
                                </div>
                            ))}
                        </div>
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
                        <h2 className="booking-step-title">予約内容の確認</h2>
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
                        <p className="text-muted" style={{ marginTop: "1.5rem", fontSize: "0.9rem" }}>
                            ※キャンセルはマイページから行えます。
                        </p>
                        <div className="booking-nav">
                            <button className="btn-outline" onClick={() => setStep(2)}>戻る</button>
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
    { id: "demo-1", title: "ライトドレナージュ", description: "全身の軽い滞りをすっきり流す、初めての方にもおすすめのコース。", price: 8800, durationMinutes: 60 },
    { id: "demo-2", title: "スタンダードコース", description: "頭部から足先まで丁寧にアプローチ。定番の人気コースです。", price: 13200, durationMinutes: 90 },
    { id: "demo-3", title: "プレミアムリラクゼーション", description: "アロマオイルを用いた最高峰のリンパドレナージュ体験をどうぞ。", price: 19800, durationMinutes: 120 },
];
