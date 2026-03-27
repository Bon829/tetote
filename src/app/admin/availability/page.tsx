"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import "../admin.css";

const TIME_SLOTS = [
    "10:00", "11:00", "12:00", "13:00", "14:00",
    "15:00", "16:00", "17:00", "18:00", "19:00",
];

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];
const GRID_DAYS = 14;

function getDateRange(days: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: days }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        return d.toISOString().split("T")[0];
    });
}

export default function AvailabilityAdminPage() {
    const settings = useQuery(api.availability.getSettings);
    const upsertSettings = useMutation(api.availability.upsertSettings);
    const toggleSlot = useMutation(api.availability.toggleBlockedSlot);

    const [leadTimeValue, setLeadTimeValue] = useState<number | null>(null);
    const [leadTimeUnit, setLeadTimeUnit] = useState<"hours" | "days" | null>(null);
    const [maxAdvanceDays, setMaxAdvanceDays] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState("");

    const dates = useMemo(() => getDateRange(GRID_DAYS), []);

    // Use settings values as defaults for form
    // Map stored values to unified form state
    const effectiveUnit = leadTimeUnit ?? (settings?.leadTimeHours && settings.leadTimeHours > 0 ? "hours" : "days");
    const effectiveValue = leadTimeValue ?? (effectiveUnit === "hours" ? (settings?.leadTimeHours ?? 2) : (settings?.leadTimeDays ?? 1));
    const currentMaxDays = maxAdvanceDays ?? settings?.maxAdvanceDays ?? 30;

    const blockedDaysOfWeek = settings?.blockedDaysOfWeek ?? [];
    const blockedDates = settings?.blockedDates ?? [];
    const blockedSlots = settings?.blockedSlots ?? [];

    const toggleDayOfWeek = async (dow: number) => {
        if (!settings) return;
        const current = blockedDaysOfWeek.includes(dow)
            ? blockedDaysOfWeek.filter((d: number) => d !== dow)
            : [...blockedDaysOfWeek, dow];
        await upsertSettings({ ...settings, blockedDaysOfWeek: current });
    };

    const toggleBlockedDate = async (dateStr: string) => {
        if (!settings) return;
        const current = blockedDates.includes(dateStr)
            ? blockedDates.filter((d: string) => d !== dateStr)
            : [...blockedDates, dateStr];
        await upsertSettings({ ...settings, blockedDates: current });
    };

    const handleSaveLeadTime = async () => {
        if (!settings) return;
        setSaving(true);
        setSaveMsg("");
        try {
            await upsertSettings({
                ...settings,
                leadTimeHours: effectiveUnit === "hours" ? effectiveValue : 0,
                leadTimeDays: effectiveUnit === "days" ? effectiveValue : 0,
                maxAdvanceDays: currentMaxDays,
            });
            setSaveMsg("保存しました");
            setTimeout(() => setSaveMsg(""), 2000);
        } finally {
            setSaving(false);
        }
    };

    const isSlotBlocked = (date: string, time: string) =>
        blockedSlots.some((s: { date: string; time: string }) => s.date === date && s.time === time);

    const isDateBlocked = (dateStr: string) => {
        const d = new Date(dateStr + "T00:00:00");
        return blockedDates.includes(dateStr) || blockedDaysOfWeek.includes(d.getDay());
    };

    return (
        <div className="admin-outer">
            <div className="admin-header">
                <p className="admin-subtitle">ADMIN</p>
                <h1 className="admin-title">予約可否の管理</h1>
            </div>

            {!settings && (
                <p className="admin-loading">設定を読み込み中...</p>
            )}

            {settings && (
                <div className="admin-sections">
                    {/* Lead time / booking deadline settings */}
                    <section className="admin-card">
                        <h2 className="admin-section-title">予約期限</h2>
                        <p className="admin-section-desc">何日前 / 何時間前まで予約を受け付けるか設定します。</p>

                        <div className="admin-form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.2rem" }}>
                            <div className="admin-form-group">
                                <label className="admin-label">予約期限</label>
                                <div className="admin-number-input">
                                    <input
                                        type="number"
                                        min={0}
                                        value={effectiveValue}
                                        onChange={(e) => setLeadTimeValue(parseInt(e.target.value) || 0)}
                                    />
                                    <select
                                        className="admin-unit-select"
                                        value={effectiveUnit}
                                        onChange={(e) => setLeadTimeUnit(e.target.value as "hours" | "days")}
                                    >
                                        <option value="days">日前</option>
                                        <option value="hours">時間前</option>
                                    </select>
                                </div>
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label">最大〇日先まで予約可能</label>
                                <div className="admin-number-input">
                                    <input
                                        type="number"
                                        min={1}
                                        value={currentMaxDays}
                                        onChange={(e) => setMaxAdvanceDays(parseInt(e.target.value))}
                                    />
                                    <span>日先</span>
                                </div>
                            </div>
                        </div>

                        <button
                            className="admin-btn-primary"
                            onClick={handleSaveLeadTime}
                            disabled={saving}
                        >
                            {saving ? "保存中..." : "保存する"}
                        </button>
                        {saveMsg && <span className="admin-save-msg">{saveMsg}</span>}
                    </section>

                    {/* Blocked days of week */}
                    <section className="admin-card">
                        <h2 className="admin-section-title">定期休業曜日</h2>
                        <p className="admin-section-desc">選択した曜日は毎週×になります。</p>
                        <div className="admin-dow-grid">
                            {DAY_LABELS.map((label, dow) => (
                                <button
                                    key={dow}
                                    onClick={() => toggleDayOfWeek(dow)}
                                    className={`admin-dow-btn ${blockedDaysOfWeek.includes(dow) ? "blocked" : "open"} ${dow === 0 ? "sunday" : ""} ${dow === 6 ? "saturday" : ""}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Availability grid */}
                    <section className="admin-card">
                        <h2 className="admin-section-title">日別・時間別の予約可否設定</h2>
                        <p className="admin-section-desc">
                            セルをクリックして×（予約不可）に切り替えられます。日付ヘッダーをクリックすると1日まるごとブロックできます。
                        </p>
                        <div className="admin-grid-legend">
                            <span><span className="ag-open">○</span> 予約可</span>
                            <span><span className="ag-blocked">×</span> 予約不可（個別）</span>
                            <span><span className="ag-day-blocked">×</span> 非営業日</span>
                        </div>

                        <div className="admin-grid-wrap">
                            <table className="admin-grid">
                                <thead>
                                    <tr>
                                        <th className="ag-time-header"></th>
                                        {dates.map((d) => {
                                            const dateObj = new Date(d + "T00:00:00");
                                            const m = dateObj.getMonth() + 1;
                                            const day = dateObj.getDate();
                                            const dow = dateObj.getDay();
                                            const dayBlocked = isDateBlocked(d);
                                            return (
                                                <th
                                                    key={d}
                                                    className={`ag-date-header ${dayBlocked ? "day-blocked" : ""} ${dow === 6 ? "saturday" : ""} ${dow === 0 ? "sunday" : ""}`}
                                                    onClick={() => toggleBlockedDate(d)}
                                                    title="クリックで休業日のトグル"
                                                >
                                                    <span className="ag-date-mon">{m}/{day}</span>
                                                    <span className="ag-date-dow">{DAY_LABELS[dow]}</span>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {TIME_SLOTS.map((time) => (
                                        <tr key={time}>
                                            <td className="ag-time-label">{time}</td>
                                            {dates.map((date) => {
                                                const dayBlocked = isDateBlocked(date);
                                                const slotBlocked = isSlotBlocked(date, time);
                                                return (
                                                    <td
                                                        key={date}
                                                        className={`ag-cell ${dayBlocked ? "day-blocked" : slotBlocked ? "slot-blocked" : "open"}`}
                                                        onClick={() => !dayBlocked && toggleSlot({ date, time })}
                                                        title={dayBlocked ? "非営業日" : "クリックでトグル"}
                                                    >
                                                        {dayBlocked ? "×" : slotBlocked ? "×" : "○"}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
