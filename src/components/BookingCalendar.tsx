"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { format, addDays, isSameDay, startOfDay, addMinutes, parseISO, isWithinInterval, differenceInMinutes } from "date-fns";
import { hr } from "date-fns/locale";
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Clock,
    Lock,
    Loader2,
    User,
    X,
    Trash2,
    PlusCircle
} from "lucide-react";

const DEFAULT_START_HOUR = 7;
const DEFAULT_END_HOUR = 24;
const SLOT_STEP = 30;

export default function BookingCalendar() {
    const { data: session } = useSession();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Resource Selection State
    const [coaches, setCoaches] = useState<any[]>([]);
    const [selectedCoachId, setSelectedCoachId] = useState<string>("cmknufbbk0000pkog6tq6kowi"); // Ante Mikolčević default

    // Modal State
    const [bookingType, setBookingType] = useState<'COACH' | 'SOKAZ'>('COACH');
    const [bookingModal, setBookingModal] = useState<{ time: string, date: Date, maxDuration: number } | null>(null);
    const [form, setForm] = useState({
        duration: 60,
        notes: "",
        participantCount: 1,
        tableCount: 1
    });

    const days = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

    useEffect(() => {
        const init = async () => {
            const cRes = await fetch("/api/coaches");
            if (cRes.ok) {
                const data = await cRes.json();
                setCoaches(data);
                // Ensure default is set to a valid coach from the list if current default is missing
                if (data.length > 0 && !data.find((c: any) => c.id === selectedCoachId)) {
                    setSelectedCoachId(data[0].id);
                }
            }
        };
        init();
    }, []);

    useEffect(() => {
        fetchDayData();
    }, [selectedDate, selectedCoachId]);

    const fetchDayData = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                date: format(selectedDate, "yyyy-MM-dd"),
                coachId: selectedCoachId,
            });

            const res = await fetch(`/api/bookings/calendar-data?${query.toString()}`);
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

    const handleBooking = async () => {
        if (!bookingModal) return;
        setSaving(true);
        try {
            const startStr = `${format(bookingModal.date, "yyyy-MM-dd")}T${bookingModal.time}:00`;

            const res = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    startTime: startStr,
                    duration: form.duration,
                    notes: form.notes,
                    coachId: bookingType === 'COACH' ? selectedCoachId : null,
                    locationId: "bakarić",
                    isSokaz: bookingType === 'SOKAZ',
                    participantCount: form.participantCount,
                    tableCount: 1
                }),
            });

            if (res.ok) {
                setBookingModal(null);
                fetchDayData();
            } else {
                const err = await res.text();
                alert(err || "Greška pri rezervaciji.");
            }
        } catch (error) {
            alert("Došlo je do greške.");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = async (id: string) => {
        if (!confirm("Sigurno želite otkazati ovaj termin?")) return;
        try {
            const res = await fetch(`/api/bookings?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchDayData();
            } else {
                const msg = await res.text();
                alert(msg);
            }
        } catch (error) {
            alert("Greška pri otkazivanju.");
        }
    };

    const isPast = (date: Date, timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const slotDate = new Date(date);
        slotDate.setHours(hours, minutes, 0, 0);
        return slotDate < new Date();
    };

    const generateTimeline = () => {
        const slots: any[] = [];
        let current = startOfDay(selectedDate);
        current.setHours(DEFAULT_START_HOUR, 0, 0, 0);
        const endDay = startOfDay(selectedDate);
        endDay.setHours(DEFAULT_END_HOUR, 0, 0, 0);

        while (current < endDay) {
            const timeStr = format(current, "HH:mm");
            // Match ANY activity in this hall/location or for this coach
            const activity = activities.find(b => {
                const bStart = parseISO(b.startDateTime);
                const bEnd = parseISO(b.endDateTime);
                return isWithinInterval(current, { start: bStart, end: addMinutes(bEnd, -1) });
            });

            slots.push({
                time: timeStr,
                date: new Date(current),
                activity: activity || null,
                isPast: isPast(current, timeStr)
            });
            current = addMinutes(current, SLOT_STEP);
        }

        // --- GAP AND SOKAZ LOGIC ---
        return slots.map((slot, idx) => {
            if (slot.activity) return slot;

            let gapMinutes = 0;
            let blockedLater = false;
            for (let j = idx; j < slots.length; j++) {
                if (slots[j].activity) {
                    blockedLater = true;
                    break;
                }
                gapMinutes += SLOT_STEP;
            }

            // SOKAZ logic: Only available if hall is free till end of day
            const [hours] = slot.time.split(':').map(Number);
            const canSokaz = hours >= 18 && !blockedLater;

            if (gapMinutes === 30 && !canSokaz) {
                return { ...slot, isLocked: true, lockReason: "Premala rupa (30min)" };
            }

            return { ...slot, maxDuration: gapMinutes, canSokaz };
        });
    };

    const timeline = generateTimeline();

    return (
        <div className="booking-timeline">
            {/* RESOURCE SELECTOR - COACH ONLY NOW */}
            <div className="resource-selector glass card">
                <div className="selector-content">
                    <div className="select-group">
                        <label>Izaberi trenera:</label>
                        <select
                            value={selectedCoachId}
                            onChange={(e) => setSelectedCoachId(e.target.value)}
                        >
                            {coaches.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* DATE STRIP */}
            <div className="date-strip glass">
                <button className="nav-btn" onClick={() => setSelectedDate(addDays(selectedDate, -1))}><ChevronLeft size={20} /></button>
                <div className="scroll-area">
                    {days.map((day) => {
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
                    })}
                </div>
                <button className="nav-btn" onClick={() => setSelectedDate(addDays(selectedDate, 1))}><ChevronRight size={20} /></button>
            </div>

            {/* TIMELINE GRID */}
            <div className="timeline-container card glass">
                <div className="timeline-header">
                    <CalendarIcon size={18} color="var(--primary)" />
                    <h3>{format(selectedDate, "EEEE, d. MMMM", { locale: hr })}</h3>
                    <div className="header-badge">
                        {coaches.find(c => c.id === selectedCoachId)?.name}
                    </div>
                </div>

                <div className="timeline-grid">
                    {loading ? (
                        <div className="loader"><Loader2 className="animate-spin" size={32} /></div>
                    ) : (
                        timeline.filter(slot => !slot.isPast).map((slot, idx) => {
                            const isNewActivity = idx === 0 || (slot.activity && timeline.filter(s => !s.isPast)[idx - 1].activity?.id !== slot.activity.id);
                            const isMine = slot.activity?.userId === (session?.user as any)?.id;

                            let slotsCount = 1;
                            if (slot.activity && isNewActivity) {
                                const duration = differenceInMinutes(parseISO(slot.activity.endDateTime), parseISO(slot.activity.startDateTime));
                                slotsCount = Math.ceil(duration / SLOT_STEP);
                            }

                            // Using pre-calculated slot properties for SOKAZ and locking logic


                            return (
                                <div key={idx} className={`slot-row ${slot.activity ? 'occupied' : 'free'} ${slot.isPast ? 'past' : ''}`}>
                                    <div className="time-col">{slot.time}</div>
                                    <div className="action-col">
                                        {slot.activity ? (
                                            isNewActivity ? (
                                                <div
                                                    className={`activity-block ${slot.activity.status} ${isMine ? 'mine' : ''}`}
                                                    style={{ height: `${slotsCount * 60 - 8}px`, zIndex: 20 }}
                                                >
                                                    <div className="activity-info">
                                                        <span className="type-badge">
                                                            {slot.activity.status === 'BLOCKED' ? <Lock size={12} /> : <User size={12} />}
                                                            {isMine ? 'MOJA REZERVACIJA' : slot.activity.status === 'BLOCKED' ? 'ZAUZETO' : 'RESERVIRANO'}
                                                            {slot.activity.notes?.startsWith('SOKAZ') && ' (SOKAZ)'}
                                                        </span>
                                                        <span className="title">
                                                            {slot.activity.user?.name || (slot.activity.status === 'BLOCKED' ? 'Blokirano' : 'Rezervirano')}
                                                        </span>
                                                        <span className="time-range">
                                                            {format(parseISO(slot.activity.startDateTime), "HH:mm")} - {format(parseISO(slot.activity.endDateTime), "HH:mm")}
                                                            {slot.activity.participantCount > 1 && ` • ${slot.activity.participantCount} osobe`}
                                                        </span>
                                                    </div>

                                                    {isMine && (
                                                        <button className="cancel-btn" onClick={() => handleCancel(slot.activity.id)}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            ) : null
                                        ) : slot.isLocked ? (
                                            <div className="locked-slot">
                                                <Lock size={14} /> <span>Zaključano</span>
                                            </div>
                                        ) : slot.isPast ? (
                                            <div className="past-slot">
                                                <span>Termin prošao</span>
                                            </div>
                                        ) : (
                                            <div className="booking-actions">
                                                <button
                                                    className="add-booking-btn"
                                                    onClick={() => {
                                                        setBookingType('COACH');
                                                        setBookingModal({ time: slot.time, date: slot.date, maxDuration: slot.maxDuration });
                                                        setForm({ ...form, duration: Math.min(60, slot.maxDuration) });
                                                    }}
                                                >
                                                    <PlusCircle size={18} className="icon" />
                                                    <span>Trening s trenerom</span>
                                                </button>
                                                {slot.canSokaz && (
                                                    <button
                                                        className="add-booking-btn sokaz-btn"
                                                        onClick={() => {
                                                            setBookingType('SOKAZ');
                                                            setBookingModal({ time: slot.time, date: slot.date, maxDuration: slot.maxDuration });
                                                            setForm({ ...form, duration: Math.min(60, slot.maxDuration) });
                                                        }}
                                                    >
                                                        <CalendarIcon size={18} className="icon" />
                                                        <span>Rezerviraj dvoranu (SOKAZ)</span>
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* BOOKING MODAL */}
            {bookingModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass card">
                        <div className="modal-header">
                            <div>
                                <h2>Rezervacija Termina</h2>
                                <p>{bookingType === 'COACH' ? 'Trening s trenerom' : 'Rezervacija dvorane (SOKAZ)'}</p>
                                <p>{format(bookingModal.date, "dd.MM.")} u <strong className="highlight">{bookingModal.time}</strong>h</p>
                            </div>
                            <button className="close-btn" onClick={() => setBookingModal(null)}><X /></button>
                        </div>

                        <div className="modal-body">
                            <div className="form-row">
                                {bookingType === 'COACH' && (
                                    <div className="form-group flex-1">
                                        <label>Trajanje</label>
                                        <select
                                            value={form.duration}
                                            onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
                                        >
                                            {[60, 90, 120].filter(d => d <= bookingModal.maxDuration).map(d => (
                                                <option key={d} value={d}>{d} min ({d / 60}h)</option>
                                            ))}
                                            {bookingModal.maxDuration < 60 && <option value={bookingModal.maxDuration}>{bookingModal.maxDuration} min</option>}
                                        </select>
                                    </div>
                                )}

                                {bookingType === 'COACH' && (
                                    <div className="form-group flex-1">
                                        <label>Broj osoba</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={form.participantCount}
                                            onChange={(e) => setForm({ ...form, participantCount: parseInt(e.target.value) || 1 })}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Napomena (opcionalno)</label>
                                <input
                                    placeholder="Dodatne informacije..."
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                />
                            </div>

                            <button
                                className="btn btn-primary full-width"
                                onClick={handleBooking}
                                disabled={saving}
                            >
                                {saving ? <Loader2 className="animate-spin" /> : "Potvrdi Rezervaciju"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .booking-timeline { padding: 1rem 0; animation: fadeIn 0.4s ease; }
                .highlight { color: var(--primary); }

                /* Resource Selector */
                .resource-selector { padding: 1.5rem; border-radius: 24px; margin-bottom: 2rem; border: 1px solid rgba(255,255,255,0.08); }
                .selector-content { display: flex; flex-direction: column; gap: 10px; }
                .select-group { display: flex; flex-direction: column; gap: 8px; }
                .select-group label { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }
                .select-group select { padding: 0.75rem 1rem; border-radius: 12px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: #fff; outline: none; cursor: pointer; }

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
                .timeline-header h3 { margin: 0; font-size: 1.1rem; flex: 1; }
                .header-badge { background: rgba(227, 6, 19, 0.1); color: var(--primary); padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; border: 1px solid rgba(227, 6, 19, 0.2); }
                
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
                .activity-block.BLOCKED { background: rgba(227, 6, 19, 0.15); border: 1px solid rgba(227, 6, 19, 0.3); border-left: 4px solid var(--primary); }
                .activity-block.CONFIRMED { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-left: 4px solid var(--border); }
                .activity-block.PENDING { background: rgba(255, 255, 255, 0.05); border: 1px dotted rgba(255, 255, 255, 0.2); border-left: 4px solid #fff; }
                .activity-block.mine { background: linear-gradient(to right, rgba(0, 75, 147, 0.25), rgba(0, 75, 147, 0.1)); border: 1px solid var(--secondary); border-left: 4px solid var(--secondary); }
                
                .slot-row.past { opacity: 0.4; pointer-events: none; filter: grayscale(0.8); }

                .activity-info { display: flex; flex-direction: column; gap: 2px; }
                .type-badge { font-size: 0.6rem; font-weight: 900; letter-spacing: 1px; display: flex; align-items: center; gap: 4px; color: rgba(255,255,255,0.5); }
                .activity-info .title { font-size: 0.95rem; font-weight: 700; color: #fff; }
                .activity-info .time-range { font-size: 0.75rem; color: rgba(255,255,255,0.4); }

                .cancel-btn { background: rgba(255,68,68,0.1); border: none; color: #ff4444; padding: 8px; border-radius: 8px; cursor: pointer; transition: 0.2s; }
                .cancel-btn:hover { background: #ff4444; color: #fff; transform: scale(1.1); }

                /* Free Slots */
                .booking-actions { display: flex; gap: 10px; width: 100%; height: 100%; }
                .add-booking-btn { 
                    flex: 1; height: 100%; border: 1px dashed rgba(255,255,255,0.05); 
                    background: none; border-radius: 10px; cursor: pointer;
                    display: flex; align-items: center; gap: 10px; padding: 0 15px;
                    color: rgba(255,255,255,0.15); transition: all 0.2s; font-size: 0.8rem;
                }
                .add-booking-btn:hover { background: rgba(227, 6, 19, 0.03); border-color: var(--primary); color: var(--primary); }
                .add-booking-btn .icon { opacity: 0.3; }
                .sokaz-btn { border-style: solid; border-color: rgba(0, 150, 255, 0.2); color: rgba(0, 150, 255, 0.6); }
                .sokaz-btn:hover { background: rgba(0, 150, 255, 0.05); border-color: #0096ff; color: #0096ff; }

                .past-slot { 
                    width: 100%; height: 100%; display: flex; align-items: center; gap: 8px; 
                    color: rgba(255,255,255,0.1); font-size: 0.8rem; padding: 0 15px; 
                }

                .locked-slot { 
                    width: 100%; height: 100%; display: flex; align-items: center; gap: 8px; 
                    color: rgba(255,255,255,0.05); font-size: 0.8rem; padding: 0 15px; 
                }

                /* Modal */
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1.5rem; }
                .modal-content { width: 100%; max-width: 450px; padding: 2.5rem; }
                .modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
                .modal-header h2 { font-size: 1.6rem; margin: 0; }
                .close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; }
                
                .form-row { display: flex; gap: 20px; margin-bottom: 1.5rem; }
                .flex-1 { flex: 1; }
                .form-group { margin-bottom: 1.5rem; }
                .form-group label { display: block; font-size: 0.8rem; margin-bottom: 0.5rem; color: var(--text-muted); }
                .form-group select, .form-group input { width: 100%; padding: 0.75rem 1rem; border-radius: 12px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: #fff; outline: none; }
                .limit-hint { font-size: 0.75rem; color: var(--primary); margin-top: 0.5rem; opacity: 0.8; }

                .full-width { width: 100%; height: 50px; border-radius: 12px; font-weight: 800; font-size: 1rem; }
                .loader { display: flex; align-items: center; justify-content: center; padding: 5rem; color: var(--primary); }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
