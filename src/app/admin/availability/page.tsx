"use client";

import { useState, useMemo, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
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

function cleanArgs(settings: any) {
    return {
        blockedDaysOfWeek: settings.blockedDaysOfWeek ?? [],
        blockedDates: settings.blockedDates ?? [],
        blockedSlots: settings.blockedSlots ?? [],
        leadTimeHours: settings.leadTimeHours ?? 2,
        leadTimeDays: settings.leadTimeDays ?? 0,
        maxAdvanceDays: settings.maxAdvanceDays ?? 30,
        cancelLeadTimeHours: settings.cancelLeadTimeHours,
        cancelLeadTimeDays: settings.cancelLeadTimeDays,
        businessHours: settings.businessHours,
    };
}

export default function AvailabilityAdminPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const isAdmin = (user?.publicMetadata?.role === "admin") || ((user as any)?.metadata?.role === "admin");

    useEffect(() => {
        if (isLoaded && !isAdmin) {
            router.push("/");
        }
    }, [isLoaded, isAdmin, router]);

    const settings = useQuery(api.availability.getSettings);
    const upsertSettings = useMutation(api.availability.upsertSettings);
    const toggleSlot = useMutation(api.availability.toggleBlockedSlot);

    const [leadTimeValue, setLeadTimeValue] = useState<number | null>(null);
    const [leadTimeUnit, setLeadTimeUnit] = useState<"hours" | "days" | null>(null);
    const [maxAdvanceDays, setMaxAdvanceDays] = useState<number | null>(null);
    
    const [cancelLeadTimeValue, setCancelLeadTimeValue] = useState<number | null>(null);
    const [cancelLeadTimeUnit, setCancelLeadTimeUnit] = useState<"hours" | "days" | null>(null);

    const [localBH, setLocalBH] = useState<any[] | null>(null);

    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState("");

    const [savingBH, setSavingBH] = useState(false);
    const [saveMsgBH, setSaveMsgBH] = useState("");

    const dates = useMemo(() => getDateRange(GRID_DAYS), []);

    const effectiveUnit = leadTimeUnit ?? (settings?.leadTimeHours && settings.leadTimeHours > 0 ? "hours" : "days");
    const effectiveValue = leadTimeValue ?? (effectiveUnit === "hours" ? (settings?.leadTimeHours ?? 2) : (settings?.leadTimeDays ?? 1));
    
    const effectiveCancelUnit = cancelLeadTimeUnit ?? (settings?.cancelLeadTimeHours && settings.cancelLeadTimeHours > 0 ? "hours" : "days");
    const effectiveCancelValue = cancelLeadTimeValue ?? (effectiveCancelUnit === "hours" ? (settings?.cancelLeadTimeHours ?? 24) : (settings?.cancelLeadTimeDays ?? 1));
    
    const currentMaxDays = maxAdvanceDays ?? settings?.maxAdvanceDays ?? 30;

    const blockedDaysOfWeek = settings?.blockedDaysOfWeek ?? [];
    const blockedDates = settings?.blockedDates ?? [];
    const blockedSlots = settings?.blockedSlots ?? [];
    
    const defaultBH = Array.from({ length: 7 }, (_, i) => ({
        dayOfWeek: i,
        isClosed: false,
        startTime: "10:00",
        endTime: "19:00",
    }));
    const effectiveBH = localBH ?? settings?.businessHours ?? defaultBH;

    const handleBHChange = (dow: number, field: string, value: any) => {
        const newBH = [...effectiveBH];
        const idx = newBH.findIndex((b: any) => b.dayOfWeek === dow);
        if (idx >= 0) {
            newBH[idx] = { ...newBH[idx], [field]: value };
        } else {
            newBH.push({ dayOfWeek: dow, isClosed: false, startTime: "10:00", endTime: "19:00", [field]: value });
        }
        setLocalBH(newBH);
    };

    const toggleBlockedDate = async (dateStr: string) => {
        if (!settings) return;
        const current = blockedDates.includes(dateStr)
            ? blockedDates.filter((d: string) => d !== dateStr)
            : [...blockedDates, dateStr];
        await upsertSettings({ ...cleanArgs(settings), blockedDates: current });
    };

    const handleSaveLeadTime = async () => {
        if (!settings) return;
        setSaving(true);
        setSaveMsg("");
        try {
            await upsertSettings({
                ...cleanArgs(settings),
                leadTimeHours: effectiveUnit === "hours" ? effectiveValue : 0,
                leadTimeDays: effectiveUnit === "days" ? effectiveValue : 0,
                maxAdvanceDays: currentMaxDays,
                cancelLeadTimeHours: effectiveCancelUnit === "hours" ? effectiveCancelValue : 0,
                cancelLeadTimeDays: effectiveCancelUnit === "days" ? effectiveCancelValue : 0,
            });
            setSaveMsg("保存しました");
            setTimeout(() => setSaveMsg(""), 2000);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveBusinessHours = async () => {
        if (!settings) return;
        setSavingBH(true);
        setSaveMsgBH("");
        try {
            await upsertSettings({
                ...cleanArgs(settings),
                businessHours: effectiveBH,
            });
            setSaveMsgBH("保存しました");
            setTimeout(() => setSaveMsgBH(""), 2000);
        } finally {
            setSavingBH(false);
        }
    };

    const isSlotBlocked = (date: string, time: string) =>
        blockedSlots.some((s: { date: string; time: string }) => s.date === date && s.time === time);

    const isDateBlocked = (dateStr: string) => {
        const d = new Date(dateStr + "T00:00:00");
        const dow = d.getDay();
        const bh = effectiveBH.find((b: any) => b.dayOfWeek === dow) || defaultBH[dow];
        return blockedDates.includes(dateStr) || blockedDaysOfWeek.includes(dow) || bh.isClosed;
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
                        <h2 className="admin-section-title">予約期限・キャンセル期限</h2>
                        <p className="admin-section-desc">予約を受け付ける期限と、マイページからキャンセルできる期限を設定します。</p>

                        <div className="admin-form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.2rem" }}>
                            <div className="admin-form-group">
                                <label className="admin-label">予約期限（受付開始）</label>
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
                                <label className="admin-label">キャンセル期限（受付終了）</label>
                                <div className="admin-number-input">
                                    <input
                                        type="number"
                                        min={0}
                                        value={effectiveCancelValue}
                                        onChange={(e) => setCancelLeadTimeValue(parseInt(e.target.value) || 0)}
                                    />
                                    <select
                                        className="admin-unit-select"
                                        value={effectiveCancelUnit}
                                        onChange={(e) => setCancelLeadTimeUnit(e.target.value as "hours" | "days")}
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

                    {/* Business Hours Settings */}
                    <section className="admin-card">
                        <h2 className="admin-section-title">営業時間・休業日設定</h2>
                        <p className="admin-section-desc">曜日ごとの休業日と、営業する時間帯を設定します。</p>
                        <div className="admin-bh-list" style={{ marginTop: "1rem" }}>
                            {DAY_LABELS.map((label, dow) => {
                                const bh = effectiveBH.find((b: any) => b.dayOfWeek === dow) || defaultBH[dow];
                                return (
                                    <div key={dow} className={`admin-bh-row ${bh.isClosed ? "closed" : ""}`} style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem", padding: "0.5rem", borderBottom: "1px solid #efeae6" }}>
                                        <div style={{ width: "40px", fontWeight: "bold", color: dow===0 ? "#d94848" : dow===6 ? "#4a86e8" : "inherit" }}>{label}</div>
                                        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                                            <input 
                                                type="checkbox" 
                                                checked={bh.isClosed} 
                                                onChange={(e) => handleBHChange(dow, "isClosed", e.target.checked)} 
                                            />
                                            休業
                                        </label>
                                        {!bh.isClosed && (
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                <select 
                                                    value={bh.startTime} 
                                                    onChange={(e) => handleBHChange(dow, "startTime", e.target.value)}
                                                    className="admin-unit-select"
                                                >
                                                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                                〜
                                                <select 
                                                    value={bh.endTime} 
                                                    onChange={(e) => handleBHChange(dow, "endTime", e.target.value)}
                                                    className="admin-unit-select"
                                                >
                                                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                        )}
                                        {bh.isClosed && <span className="text-muted" style={{ fontSize: "0.9rem" }}>お休み</span>}
                                    </div>
                                );
                            })}
                        </div>
                        <button
                            className="admin-btn-primary"
                            onClick={handleSaveBusinessHours}
                            disabled={savingBH}
                            style={{ marginTop: "1rem" }}
                        >
                            {savingBH ? "保存中..." : "営業時間設定を保存"}
                        </button>
                        {saveMsgBH && <span className="admin-save-msg">{saveMsgBH}</span>}
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
                                                    title="クリックで1日まるごとトグル"
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
                                                
                                                // Check if it's out of business hours bounds
                                                const dObj = new Date(date + "T00:00:00");
                                                const dow = dObj.getDay();
                                                const bh = effectiveBH.find((b: any) => b.dayOfWeek === dow) || defaultBH[dow];
                                                let outOfBounds = false;
                                                if (!bh.isClosed) {
                                                    const tNum = parseInt(time.replace(":", ""));
                                                    const startNum = parseInt(bh.startTime.replace(":", ""));
                                                    const endNum = parseInt(bh.endTime.replace(":", ""));
                                                    outOfBounds = tNum < startNum || tNum > endNum;
                                                }

                                                return (
                                                    <td
                                                        key={date}
                                                        className={`ag-cell ${dayBlocked || outOfBounds ? "day-blocked" : slotBlocked ? "slot-blocked" : "open"}`}
                                                        onClick={() => !(dayBlocked || outOfBounds) && toggleSlot({ date, time })}
                                                        title={dayBlocked || outOfBounds ? "非予約枠" : "クリックでトグル"}
                                                    >
                                                        {dayBlocked || outOfBounds ? "×" : slotBlocked ? "×" : "○"}
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
