"use client";

import { useState, useMemo, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import "../admin.css";

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
    const padded = i.toString().padStart(2, "0");
    return `${padded}:00`;
});

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];
const GRID_DAYS_TO_SHOW = 7; // Show 7 days at a time for better UX on mobile/admin
const ADMIN_MAX_DAYS = 90; // Allow admins to look up to 90 days ahead

function getDateRange(startDate: string, days: number) {
    const start = new Date(startDate + "T00:00:00");
    return Array.from({ length: days }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d.toISOString().split("T")[0];
    });
}

function cleanArgs(settings: any) {
    const s = settings || {};
    return {
        blockedDaysOfWeek: s.blockedDaysOfWeek ?? [],
        blockedDates: s.blockedDates ?? [],
        blockedSlots: s.blockedSlots ?? [],
        leadTimeHours: s.leadTimeHours ?? 2,
        leadTimeDays: s.leadTimeDays ?? 0,
        maxAdvanceDays: s.maxAdvanceDays ?? 30,
        cancelLeadTimeHours: s.cancelLeadTimeHours ?? 24,
        cancelLeadTimeDays: s.cancelLeadTimeDays ?? 0,
        businessHours: s.businessHours ?? [],
    };
}

export default function AvailabilityAdminPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    // Improved admin check
    const isAdmin = useMemo(() => {
        if (!user) return false;
        return (user.publicMetadata?.role === "admin") || ((user as any)?.metadata?.role === "admin");
    }, [user]);

    useEffect(() => {
        if (isLoaded) {
            console.log("Admin Check:", { isAdmin, role: user?.publicMetadata?.role });
            if (!isAdmin) {
                console.warn("Unauthorized access redirecting to home");
                router.push("/");
            }
        }
    }, [isLoaded, isAdmin, router, user]);

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

    const [currentGridStartDate, setCurrentGridStartDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    });

    const [localBlockedSlots, setLocalBlockedSlots] = useState<{ date: string; time: string }[] | null>(null);
    const [savingSlots, setSavingSlots] = useState(false);
    const [saveMsgSlots, setSaveMsgSlots] = useState("");

    const dates = useMemo(() => getDateRange(currentGridStartDate, GRID_DAYS_TO_SHOW), [currentGridStartDate]);

    // const availabilityGrid = useQuery(api.availability.getAvailabilityGrid, {
    //     startDate: currentGridStartDate,
    //     days: GRID_DAYS_TO_SHOW,
    //     timeSlots: TIME_SLOTS,
    //     isAdmin: true,
    // });
    // Not using the heavy grid query in this screen, it's rendered manually from settings below.

    const upsertBlockedSlots = useMutation(api.availability.upsertBlockedSlots);

    const effectiveUnit = leadTimeUnit ?? (settings?.leadTimeHours && settings.leadTimeHours > 0 ? "hours" : "days");
    const effectiveValue = leadTimeValue ?? (effectiveUnit === "hours" ? (settings?.leadTimeHours ?? 2) : (settings?.leadTimeDays ?? 1));
    
    const effectiveCancelUnit = cancelLeadTimeUnit ?? (settings?.cancelLeadTimeHours && settings.cancelLeadTimeHours > 0 ? "hours" : "days");
    const effectiveCancelValue = cancelLeadTimeValue ?? (effectiveCancelUnit === "hours" ? (settings?.cancelLeadTimeHours ?? 24) : (settings?.cancelLeadTimeDays ?? 1));
    
    const currentMaxDays = maxAdvanceDays ?? settings?.maxAdvanceDays ?? 30;

    const blockedDaysOfWeek = settings?.blockedDaysOfWeek ?? [];
    const blockedDates = settings?.blockedDates ?? [];
    const blockedSlots = localBlockedSlots ?? settings?.blockedSlots ?? [];
    
    const defaultBH = useMemo(() => Array.from({ length: 7 }, (_, i) => ({
        dayOfWeek: i,
        isClosed: false,
        startTime: "10:00",
        endTime: "19:00",
    })), []);

    const effectiveBH = useMemo(() => {
        if (localBH) return localBH;
        if (settings?.businessHours && Array.isArray(settings.businessHours)) return settings.businessHours;
        return defaultBH;
    }, [localBH, settings, defaultBH]);
    
    // Safety check: Render nothing if not admin or not loaded
    if (!isLoaded || (isLoaded && !isAdmin)) {
        return (
            <div className="admin-outer">
                 <div className="admin-header">
                    <p className="admin-subtitle">ADMIN</p>
                    <h1 className="admin-title">読み込み中...</h1>
                </div>
            </div>
        );
    }

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

    const toggleLocalSlot = (date: string, time: string) => {
        const current = [...blockedSlots];
        const idx = current.findIndex(s => s.date === date && s.time === time);
        if (idx >= 0) {
            setLocalBlockedSlots(current.filter((_, i) => i !== idx));
        } else {
            setLocalBlockedSlots([...current, { date, time }]);
        }
    };

    const handleSaveSlots = async () => {
        if (!localBlockedSlots) {
            console.warn("No changes to save in localBlockedSlots");
            return;
        }
        setSavingSlots(true);
        setSaveMsgSlots("");
        try {
            console.log("Saving blocked slots:", localBlockedSlots);
            await upsertBlockedSlots({ blockedSlots: localBlockedSlots });
            setSaveMsgSlots("設定を保存しました");
            setTimeout(() => setSaveMsgSlots(""), 2000);
        } catch (err: any) {
            console.error("Failed to save blocked slots:", err);
            setSaveMsgSlots(`エラーが発生しました: ${err.message || ""}`);
        } finally {
            setSavingSlots(false);
        }
    };

    const handleNextWeek = () => {
        const d = new Date(currentGridStartDate + "T00:00:00");
        d.setDate(d.getDate() + 7);
        setCurrentGridStartDate(d.toISOString().split("T")[0]);
    };

    const handlePrevWeek = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split("T")[0];
        
        const current = new Date(currentGridStartDate + "T00:00:00");
        current.setDate(current.getDate() - 7);
        const prevStr = current.toISOString().split("T")[0];
        
        if (prevStr >= todayStr) {
            setCurrentGridStartDate(prevStr);
        } else {
            // Force it to today if going back would cross into the past
            setCurrentGridStartDate(todayStr);
        }
    };


    const isPast = (dateStr: string, timeStr: string) => {
        const now = new Date();
        const [hours, minutes] = timeStr.split(":").map(Number);
        const slotDateTime = new Date(dateStr + "T00:00:00");
        slotDateTime.setHours(hours, minutes, 0, 0);
        return slotDateTime < now;
    };

    const isDateBlocked = (dateStr: string) => {
        try {
            const d = new Date(dateStr + "T00:00:00");
            const dow = d.getDay();
            const bh = effectiveBH.find((b: any) => b.dayOfWeek === dow) || defaultBH[dow];
            if (!bh) return true;
            return (blockedDates?.includes(dateStr)) || (blockedDaysOfWeek?.includes(dow)) || bh.isClosed;
        } catch (e) {
            console.error("isDateBlocked error:", e);
            return false;
        }
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
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                            <div>
                                <h2 className="admin-section-title">日別・時間別の予約可否設定</h2>
                                <p className="admin-section-desc">
                                    セルをクリックして×（予約不可）に切り替えられます。ヘッダーで1日ブロック。
                                </p>
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button className="btn-outline" onClick={handlePrevWeek}>前へ</button>
                                <button className="btn-outline" onClick={handleNextWeek}>次へ</button>
                            </div>
                        </div>

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

                                                const past = isPast(date, time);
                                                
                                                return (
                                                    <td
                                                        key={date}
                                                        className={`ag-cell ${dayBlocked || outOfBounds || past ? "day-blocked" : slotBlocked ? "slot-blocked" : "open"}`}
                                                        onClick={() => !(dayBlocked || outOfBounds || past) && toggleLocalSlot(date, time)}
                                                        title={dayBlocked || outOfBounds ? "非予約枠" : past ? "過去の日付" : "クリックでトグル"}
                                                    >
                                                        {dayBlocked || outOfBounds || past ? "×" : slotBlocked ? "×" : "○"}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                            <button 
                                className="admin-btn-primary" 
                                onClick={handleSaveSlots}
                                disabled={savingSlots || !localBlockedSlots}
                            >
                                {savingSlots ? "保存中..." : "日別設定を保存する"}
                            </button>
                            {saveMsgSlots && <span className="admin-save-msg">{saveMsgSlots}</span>}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
