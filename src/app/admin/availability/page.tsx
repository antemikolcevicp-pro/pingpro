"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { format, addDays, isSameDay, startOfDay, addMinutes, parseISO, isWithinInterval, differenceInMinutes, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { hr } from "date-fns/locale";
import PendingBookingsBar from "@/components/PendingBookingsBar";
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Clock,
    Lock,
    Plus,
    Trash2,
    Loader2,
    CheckCircle,
    User,
    PlusCircle,
    X,
    Check,
    LayoutGrid,
    CalendarDays
} from "lucide-react";

// --- CONFIG ---
const DEFAULT_START_HOUR = 7;
const DEFAULT_END_HOUR = 24;
const SLOT_STEP = 30; // Minutes for the grid

export default function UnifiedCalendar() {
    const { data: session } = useSession();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Role check
    // @ts-ignore
    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'COACH';

    // UI states
    const [viewMode, setViewMode] = useState<'DAY' | 'WEEK'>('DAY');
    const [actionModal, setActionModal] = useState<{ time: string, date: Date } | null>(null);
    const [actionType, setActionType] = useState<'BLOCK' | 'BOOK' | null>(null);
    const [form, setForm] = useState({
        duration: 90,
        notes: "",
        playerName: "",
        isAllDay: false,
        recurrence: 'NONE' as 'NONE' | 'WEEKLY'
    });

    const days = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

    useEffect(() => {
        fetchData();
    }, [selectedDate, viewMode]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let res;
            if (viewMode === 'DAY') {
                res = await fetch(`/api/admin/blocks?date=${format(selectedDate, "yyyy-MM-dd")}`);
            } else {
                const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
                const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
                res = await fetch(`/api/admin/blocks?startDate=${start.toISOString()}&endDate=${end.toISOString()}`);
            }

            if (res.ok) {
                const data = await res.json();
                setActivities(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmAction = async () => {
        if (!actionModal) return;
        setSaving(true);
        try {
            const [h, m] = actionModal.time.split(':').map(Number);
            const d = new Date(actionModal.date);
            d.setHours(h, m, 0, 0);
            const startStr = d.toISOString();
            const endStr = new Date(d.getTime() + form.duration * 60000).toISOString();

            const endpoint = actionType === 'BLOCK' ? "/api/admin/blocks" : "/api/bookings";

            const body: any = {
                startTime: startStr,
                endTime: endStr,
                notes: actionType === 'BLOCK' ? form.notes : `Rezervacija: ${form.playerName || session?.user?.name}`,
                isAllDay: form.isAllDay,
                recurrence: form.recurrence
            };

            if (actionType === 'BOOK') {
                // For booking, we need coachId. Defaulting to first admin/coach found in prev steps or session.
                // @ts-ignore
                body.coachId = session?.user?.id;
                body.duration = form.duration;
            }

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                closeModal();
                fetchData();
            } else {
                const err = await res.text();
                alert(err || "Pogreška");
            }
        } catch (error) {
            alert("Greška pri spremanju.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Sigurno želite izbrisati ovaj termin?")) return;
        try {
            const res = await fetch(`/api/admin/blocks?id=${id}`, { method: "DELETE" });
            if (res.ok) fetchData();
        } catch (error) {
            alert("Greška.");
        }
    };

    const handleQuickAction = async (bookingId: string, action: 'CONFIRM' | 'CANCEL') => {
        try {
            const res = await fetch("/api/admin/confirm-booking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookingId, action })
            });

            if (res.ok) fetchData();
        } catch (error) {
            alert("Greška pri obradi.");
        }
    };

    const closeModal = () => {
        setActionModal(null);
        setActionType(null);
        setForm({ duration: 90, notes: "", playerName: "", isAllDay: false, recurrence: 'NONE' });
    };

    const generateTimeline = () => {
        const slots = [];
        let current = startOfDay(selectedDate);
        current.setHours(DEFAULT_START_HOUR, 0, 0, 0);
        const endDay = startOfDay(selectedDate);
        endDay.setHours(DEFAULT_END_HOUR, 0, 0, 0);

        while (current < endDay) {
            const timeStr = format(current, "HH:mm");
            const activity = activities.find(b => {
                const bStart = parseISO(b.startDateTime);
                const bEnd = parseISO(b.endDateTime);
                return isWithinInterval(current, { start: bStart, end: addMinutes(bEnd, -1) });
            });

            slots.push({
                time: timeStr,
                date: new Date(current),
                activity: activity || null
            });
            current = addMinutes(current, SLOT_STEP);
        }
        return slots;
    };

    const timeline = generateTimeline();

    return (
        <div className="calendar-page">
            {isAdmin && <PendingBookingsBar />}

            <header className="page-header">
                <div>
                    <h1>PingPro Kalendar 🏓</h1>
                    <p>{isAdmin ? "Upravljaj dvoranom i rezervacijama." : "Odaberi termin za svoj trening."}</p>
                </div>
                {isAdmin && (
                    <div className="view-toggle glass">
                        <button className={viewMode === 'DAY' ? 'active' : ''} onClick={() => setViewMode('DAY')}>
                            <CalendarIcon size={18} /> <span>Dan</span>
                        </button>
                        <button className={viewMode === 'WEEK' ? 'active' : ''} onClick={() => setViewMode('WEEK')}>
                            <LayoutGrid size={18} /> <span>Tjedan</span>
                        </button>
                    </div>
                )}
            </header>

            {/* DATE/WEEK NAV */}
            <div className="date-strip glass">
                <button className="nav-btn" onClick={() => setSelectedDate(addDays(selectedDate, viewMode === 'DAY' ? -1 : -7))}><ChevronLeft size={20} /></button>
                <div className="scroll-area">
                    {viewMode === 'DAY' ? (
                        days.map((day) => {
                            const isSelected = isSameDay(day, selectedDate);
                            return (
                                <button
                                    key={day.toString()}
                                    className={`date-card ${isSelected ? 'active' : ''}`}
                                    onClick={() => setSelectedDate(day)}
                                >
                                    <span className="day-text">{format(day, "EEE", { locale: hr })}</span>
                                    <span className="num-text">{format(day, "d.M.")}</span>
                                </button>
                            );
                        })
                    ) : (
                        <div className="week-label">
                            Tjedan od {format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "d. MMMM", { locale: hr })}
                        </div>
                    )}
                </div>
                <button className="nav-btn" onClick={() => setSelectedDate(addDays(selectedDate, viewMode === 'DAY' ? 1 : 7))}><ChevronRight size={20} /></button>
            </div>

            {/* TIMELINE / GRID */}
            <div className="timeline-container card glass">
                {viewMode === 'DAY' ? (
                    <>
                        <div className="timeline-header">
                            <CalendarIcon size={18} color="var(--primary)" />
                            <h3>{format(selectedDate, "EEEE, d. MMMM", { locale: hr })}</h3>
                        </div>

                        <div className="timeline-grid">
                            {loading ? (
                                <div className="loader"><Loader2 className="animate-spin" size={32} /></div>
                            ) : (
                                timeline.map((slot, idx) => {
                                    const isNewActivity = idx === 0 || (slot.activity && timeline[idx - 1].activity?.id !== slot.activity.id);

                                    let slotsCount = 1;
                                    if (slot.activity && isNewActivity) {
                                        const duration = differenceInMinutes(parseISO(slot.activity.endDateTime), parseISO(slot.activity.startDateTime));
                                        slotsCount = Math.ceil(duration / SLOT_STEP);
                                    }

                                    return (
                                        <div key={idx} className={`slot-row ${slot.activity ? 'occupied' : 'free'}`}>
                                            <div className="time-col">{slot.time}</div>
                                            <div className="action-col">
                                                {slot.activity ? (
                                                    isNewActivity ? (
                                                        <div
                                                            className={`activity-block ${slot.activity.status}`}
                                                            style={{ height: `${slotsCount * 60 - 8}px`, zIndex: 20 }}
                                                        >
                                                            <div className="activity-info">
                                                                <span className="type-badge">
                                                                    {slot.activity.status === 'BLOCKED' ? <Lock size={12} /> : <User size={12} />}
                                                                    {slot.activity.status === 'BLOCKED' ? 'ZAUZETO' : slot.activity.status === 'PENDING' ? 'NA ČEKANJU' : 'RESERVIRANO'}
                                                                </span>
                                                                <span className="title">{slot.activity.notes || slot.activity.user?.name || "Termin"}</span>
                                                                <span className="time-range">{format(parseISO(slot.activity.startDateTime), "HH:mm")} - {format(parseISO(slot.activity.endDateTime), "HH:mm")}</span>
                                                            </div>
                                                            <div className="activity-actions">
                                                                {slot.activity.status === 'PENDING' && isAdmin && (
                                                                    <>
                                                                        <button className="confirm-btn-inline" onClick={() => handleQuickAction(slot.activity.id, 'CONFIRM')}>
                                                                            <Check size={16} />
                                                                        </button>
                                                                        <button className="cancel-btn-inline" onClick={() => handleQuickAction(slot.activity.id, 'CANCEL')}>
                                                                            <X size={16} />
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {isAdmin && slot.activity.status !== 'PENDING' && (
                                                                    <button className="delete-btn" onClick={() => handleDelete(slot.activity.id)}>
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : null
                                                ) : (
                                                    <button
                                                        className="add-activity-btn"
                                                        onClick={() => setActionModal({ time: slot.time, date: slot.date })}
                                                    >
                                                        <PlusCircle size={18} className="icon" />
                                                        <span>Slobodno - Klikni za akciju</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>
                ) : (
                    <div className="week-grid">
                        <div className="grid-header">
                            <div className="time-col-spacer"></div>
                            {eachDayOfInterval({
                                start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
                                end: endOfWeek(selectedDate, { weekStartsOn: 1 })
                            }).map(day => (
                                <div key={day.toString()} className={`day-col-header ${isSameDay(day, new Date()) ? 'today' : ''}`}>
                                    <span className="day-name">{format(day, "EEE", { locale: hr })}</span>
                                    <span className="day-num">{format(day, "d.M.")}</span>
                                </div>
                            ))}
                        </div>
                        <div className="grid-body">
                            {Array.from({ length: DEFAULT_END_HOUR - DEFAULT_START_HOUR }, (_, i) => {
                                const hour = DEFAULT_START_HOUR + i;
                                return (
                                    <div key={hour} className="hour-row">
                                        <div className="time-col">{hour}:00</div>
                                        {eachDayOfInterval({
                                            start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
                                            end: endOfWeek(selectedDate, { weekStartsOn: 1 })
                                        }).map(day => {
                                            const current = new Date(day);
                                            current.setHours(hour, 0, 0, 0);
                                            const activity = activities.find(b => {
                                                const bStart = parseISO(b.startDateTime);
                                                const bEnd = parseISO(b.endDateTime);
                                                return isWithinInterval(current, { start: bStart, end: addMinutes(bEnd, -1) });
                                            });

                                            return (
                                                <div
                                                    key={day.toString()}
                                                    className={`day-cell ${activity ? 'occupied' : 'free'}`}
                                                    onClick={() => !activity && setActionModal({ time: `${hour}:00`, date: day })}
                                                >
                                                    {activity && (
                                                        <div className={`week-activity ${activity.status}`}>
                                                            {activity.status === 'BLOCKED' ? <Lock size={10} /> : <User size={10} />}
                                                            <span>{activity.notes || activity.user?.name || "Termin"}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL */}
            {actionModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass card">
                        <div className="modal-header">
                            <div>
                                <h2>Novi Termin</h2>
                                <p>{format(actionModal.date, "dd.MM.")} u <strong className="highlight">{actionModal.time}</strong>h</p>
                            </div>
                            <button className="close-btn" onClick={closeModal}><X /></button>
                        </div>

                        {!actionType && isAdmin ? (
                            <div className="action-selector">
                                <button className="select-btn book" onClick={() => setActionType('BOOK')}>
                                    <User size={24} />
                                    <span>Dodaj Rezervaciju</span>
                                </button>
                                <button className="select-btn block" onClick={() => setActionType('BLOCK')}>
                                    <Lock size={24} />
                                    <span>Blokiraj Dvoranu</span>
                                </button>
                            </div>
                        ) : (
                            <div className="modal-body">
                                {actionType === 'BLOCK' && (
                                    <div className="form-group-row">
                                        <div className="form-group flex-1">
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={form.isAllDay}
                                                    onChange={(e) => setForm({ ...form, isAllDay: e.target.checked })}
                                                />
                                                Cijeli dan
                                            </label>
                                        </div>
                                        <div className="form-group flex-1">
                                            <label>Ponavljanje</label>
                                            <select
                                                value={form.recurrence}
                                                onChange={(e) => setForm({ ...form, recurrence: e.target.value as any })}
                                            >
                                                <option value="NONE">Bez ponavljanja</option>
                                                <option value="WEEKLY">Svaki tjedan (4 tjedna)</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {!form.isAllDay && (
                                    <div className="form-group">
                                        <label>Trajanje (minuta)</label>
                                        <select value={form.duration} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}>
                                            <option value={30}>30 min</option>
                                            <option value={60}>60 min (1h)</option>
                                            <option value={90}>90 min (1.5h)</option>
                                            <option value={120}>120 min (2h)</option>
                                            <option value={180}>180 min (3h)</option>
                                        </select>
                                    </div>
                                )}

                                {isAdmin && actionType === 'BLOCK' && (
                                    <div className="form-group">
                                        <label>Razlog blokade</label>
                                        <input
                                            placeholder="Npr. Drugi klub ima trening"
                                            value={form.notes}
                                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                        />
                                    </div>
                                )}

                                {isAdmin && actionType === 'BOOK' && (
                                    <div className="form-group">
                                        <label>Ime Igrača</label>
                                        <input
                                            placeholder="Tko dolazi na trening?"
                                            value={form.playerName}
                                            onChange={(e) => setForm({ ...form, playerName: e.target.value })}
                                        />
                                    </div>
                                )}

                                <button
                                    className="btn btn-primary full-width"
                                    onClick={() => isAdmin ? handleConfirmAction() : (setActionType('BOOK'), handleConfirmAction())}
                                    disabled={saving}
                                >
                                    {saving ? <Loader2 className="animate-spin" /> : "Potvrdi"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                .calendar-page { padding: 1.5rem 0; animation: fadeIn 0.4s ease-out; }
                .page-header { margin-bottom: 2rem; }
                .page-header h1 { font-size: 2.2rem; margin: 0; background: linear-gradient(to right, #fff, var(--primary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                
                .highlight { color: var(--primary); }

                /* Date Strip */
                .date-strip { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; border-radius: 20px; margin-bottom: 2rem; border: 1px solid rgba(255,255,255,0.08); }
                .scroll-area { display: flex; gap: 0.75rem; overflow-x: auto; scrollbar-width: none; flex: 1; padding: 4px; }
                .scroll-area::-webkit-scrollbar { display: none; }
                .date-card { 
                    flex: 0 0 70px; display: flex; flex-direction: column; align-items: center; 
                    padding: 0.75rem; border-radius: 12px; background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05); color: var(--text-muted); cursor: pointer; transition: all 0.3s;
                }
                .date-card:hover { transform: translateY(-2px); background: rgba(255,255,255,0.08); }
                .date-card.active { background: var(--primary); color: #fff; border-color: var(--primary); box-shadow: 0 8px 20px rgba(227, 6, 19, 0.4); }
                .day-text { font-size: 0.7rem; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; }
                .num-text { font-size: 1.1rem; font-weight: 800; }
                .nav-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0.5rem; }

                /* Timeline */
                .timeline-container { padding: 0; overflow: hidden; border-radius: 24px; }
                .timeline-header { padding: 1.25rem 2rem; border-bottom: 1px solid var(--border); background: rgba(255,255,255,0.02); display: flex; align-items: center; gap: 0.75rem; }
                .timeline-header h3 { margin: 0; font-size: 1.1rem; }
                
                .timeline-grid { max-height: 650px; overflow-y: auto; scrollbar-width: thin; }
                .slot-row { display: flex; height: 60px; border-bottom: 1px solid rgba(255,255,255,0.03); }
                .time-col { 
                    width: 70px; display: flex; align-items: center; justify-content: center; 
                    font-size: 0.85rem; color: var(--text-muted); font-weight: 600;
                    border-right: 1px solid rgba(255,255,255,0.03); background: rgba(255,255,255,0.01);
                }
                .action-col { flex: 1; position: relative; padding: 8px 15px; display: flex; align-items: center; }

                /* Activity Blocks */
                .activity-block { 
                    position: absolute; left: 8px; right: 8px; top: 4px; z-index: 10;
                    border-radius: 12px; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center;
                    box-shadow: 4px 0 15px rgba(0,0,0,0.2); transition: all 0.3s ease;
                }
                .activity-block.BLOCKED { background: linear-gradient(to right, rgba(227, 6, 19, 0.2), rgba(227, 6, 19, 0.05)); border: 1px solid rgba(227, 6, 19, 0.3); border-left: 4px solid var(--primary); }
                .activity-block.CONFIRMED { background: linear-gradient(to right, rgba(0, 75, 147, 0.2), rgba(0, 75, 147, 0.05)); border: 1px solid rgba(0, 75, 147, 0.3); border-left: 4px solid var(--secondary); }
                .activity-block.PENDING { background: linear-gradient(to right, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05)); border: 1px solid rgba(255, 255, 255, 0.1); border-left: 4px solid #fff; }
                
                .activity-info { display: flex; flex-direction: column; gap: 2px; }
                .type-badge { font-size: 0.6rem; font-weight: 900; letter-spacing: 1px; display: flex; align-items: center; gap: 4px; color: rgba(255,255,255,0.6); }
                .activity-block.BLOCKED .type-badge { color: var(--primary); }
                .activity-block.CONFIRMED .type-badge { color: var(--secondary); }
                .activity-block.PENDING .type-badge { color: #fff; }

                .activity-actions { display: flex; gap: 6px; }
                .confirm-btn-inline { background: var(--secondary); border: none; color: #fff; padding: 6px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                .cancel-btn-inline { background: rgba(255,255,255,0.1); border: none; color: #fff; padding: 6px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                .confirm-btn-inline:hover { transform: scale(1.1); box-shadow: 0 0 10px var(--secondary); }
                .cancel-btn-inline:hover { background: #ff4444; transform: scale(1.1); }
                
                .activity-info .title { font-size: 1.05rem; font-weight: 700; color: #fff; }
                .activity-info .time-range { font-size: 0.8rem; color: rgba(255,255,255,0.5); }

                /* Free Slot Button */
                .add-activity-btn { 
                    width: 100%; height: 100%; border: 1px dashed rgba(255,255,255,0.05); 
                    background: none; border-radius: 10px; cursor: pointer;
                    display: flex; align-items: center; gap: 10px; padding: 0 15px;
                    color: rgba(255,255,255,0.1); transition: all 0.2s;
                }
                .add-activity-btn:hover { background: rgba(57, 255, 20, 0.03); border-color: var(--primary); color: var(--primary); }
                .add-activity-btn .icon { opacity: 0.2; transition: opacity 0.2s; }
                .add-activity-btn:hover .icon { opacity: 1; }

                /* Modal Styling */
                .modal-overlay { 
                    position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
                    display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1.5rem;
                }
                .modal-content { width: 100%; max-width: 480px; padding: 2.5rem; position: relative; }
                .modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
                .modal-header h2 { font-size: 1.8rem; margin: 0; }
                .close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; }

                .action-selector { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
                .select-btn { 
                    display: flex; flex-direction: column; align-items: center; gap: 1rem;
                    padding: 2rem 1rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);
                    background: rgba(255,255,255,0.03); color: #fff; cursor: pointer; transition: all 0.3s;
                }
                .select-btn:hover { border-color: #fff; background: rgba(255,255,255,0.08); transform: translateY(-5px); }
                .select-btn.book:hover { border-color: var(--primary); color: var(--primary); }
                .select-btn.block:hover { border-color: var(--secondary); color: var(--secondary); }
                .select-btn span { font-weight: 700; font-size: 0.9rem; }

                .form-group { margin-bottom: 1.5rem; }
                .form-group label { display: block; font-size: 0.8rem; margin-bottom: 0.5rem; color: var(--text-muted); }
                .form-group select, .form-group input { width: 100%; padding: 0.75rem 1rem; border-radius: 12px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: #fff; }
                
                .full-width { width: 100%; height: 50px; border-radius: 12px; font-weight: 800; font-size: 1rem; }

                .delete-btn { background: rgba(255,68,68,0.1); border: none; color: #ff4444; padding: 8px; border-radius: 8px; cursor: pointer; }

                .loader { display: flex; align-items: center; justify-content: center; padding: 5rem; color: var(--primary); }

                /* View Toggle */
                .view-toggle { display: flex; padding: 4px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
                .view-toggle button { 
                    display: flex; align-items: center; gap: 8px; padding: 6px 12px; 
                    border: none; background: none; color: var(--text-muted); cursor: pointer;
                    border-radius: 8px; transition: 0.3s; font-weight: 700; font-size: 0.8rem;
                }
                .view-toggle button.active { background: var(--primary); color: #fff; }

                .week-label { display: flex; align-items: center; justify-content: center; flex: 1; font-weight: 800; font-size: 1.1rem; color: #fff; }

                /* Week Grid Styles */
                .week-grid { display: flex; flex-direction: column; overflow: hidden; background: rgba(0,0,0,0.1); }
                .grid-header { display: flex; border-bottom: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.02); }
                .time-col-spacer { width: 60px; border-right: 1px solid rgba(255,255,255,0.05); }
                .day-col-header { flex: 1; padding: 1rem; display: flex; flex-direction: column; align-items: center; border-right: 1px solid rgba(255,255,255,0.05); }
                .day-col-header.today { background: rgba(227, 6, 19, 0.05); }
                .day-col-header.today .day-num { color: var(--primary); }
                .day-name { font-size: 0.7rem; font-weight: 900; text-transform: uppercase; color: var(--text-muted); }
                .day-num { font-size: 1rem; font-weight: 800; }

                .grid-body { max-height: 600px; overflow-y: auto; }
                .hour-row { display: flex; border-bottom: 1px solid rgba(255,255,255,0.03); height: 50px; }
                .hour-row .time-col { 
                    width: 60px; font-size: 0.75rem; color: var(--text-muted); 
                    display: flex; align-items: center; justify-content: center;
                    border-right: 1px solid rgba(255,255,255,0.05);
                }
                .day-cell { flex: 1; border-right: 1px solid rgba(255,255,255,0.03); cursor: pointer; position: relative; }
                .day-cell:hover { background: rgba(255,255,255,0.02); }
                .day-cell.occupied { background: rgba(255,255,255,0.03); cursor: default; }
                
                .week-activity { 
                    position: absolute; inset: 2px; border-radius: 4px; padding: 4px;
                    display: flex; align-items: center; gap: 4px; font-size: 0.65rem; font-weight: 700;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                .week-activity.BLOCKED { background: rgba(227, 6, 19, 0.2); border-left: 2px solid var(--primary); color: var(--primary); }
                .week-activity.CONFIRMED { background: rgba(0, 150, 255, 0.2); border-left: 2px solid #0096ff; color: #0096ff; }
                .week-activity.PENDING { background: rgba(255, 255, 255, 0.1); border-left: 2px solid #fff; color: #fff; }

                .form-group-row { display: flex; gap: 15px; align-items: flex-end; }
                .checkbox-label { display: flex; align-items: center; gap: 8px; font-weight: 700; cursor: pointer; }

                @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                @media (max-width: 600px) {
                    .slot-row { min-height: 80px; }
                    .action-selector { grid-template-columns: 1fr; }
                    .week-grid { overflow-x: auto; }
                    .grid-header, .hour-row { width: 1000px; }
                }
            `}</style>
        </div>
    );
}
