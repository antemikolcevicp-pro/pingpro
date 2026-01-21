"use client";

import { useState, useEffect } from "react";
import { format, addDays, isSameDay, addMinutes, parseISO } from "date-fns";
import { hr } from "date-fns/locale";
import { Check, Loader2, AlertCircle, Clock, Send, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BookingCalendar() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [duration, setDuration] = useState(90); // Default 90 min
    const [availableSlots, setAvailableSlots] = useState<any[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [bookingInProgress, setBookingInProgress] = useState(false);
    const router = useRouter();

    const days = Array.from({ length: 30 }, (_, i) => addDays(new Date(), i));

    useEffect(() => {
        fetchSlots(selectedDate, duration);
    }, [selectedDate, duration]);

    const fetchSlots = async (date: Date, dur: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/bookings/available-slots?date=${date.toISOString()}&duration=${dur}`);
            if (res.ok) {
                const data = await res.json();
                setAvailableSlots(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleBooking = async () => {
        if (!selectedSlot) return;
        setBookingInProgress(true);

        try {
            const [hours, minutes] = selectedSlot.time.split(':');
            const startTime = new Date(selectedDate);
            startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const res = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    startTime: startTime.toISOString(),
                    coachId: selectedSlot.coachId,
                    duration: duration
                }),
            });

            if (res.ok) {
                router.push("/dashboard?success=true");
            } else {
                alert("Rezervacija nije uspjela. Termin je možda upravo zauzet.");
                fetchSlots(selectedDate, duration);
            }
        } catch (error) {
            alert("Došlo je do greške.");
        } finally {
            setBookingInProgress(false);
        }
    };

    return (
        <div className="booking-container">
            {/* DURATION SELECTION */}
            <div className="section-header">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Clock size={20} color="var(--primary)" />
                    Trajanje Treninga
                </h3>
            </div>
            <div className="duration-toggle">
                {[60, 90, 120].map((d) => (
                    <button
                        key={d}
                        className={`dur-btn ${duration === d ? 'active' : ''}`}
                        onClick={() => {
                            setDuration(d);
                            setSelectedSlot(null);
                        }}
                    >
                        {d} min <span className="small">({d / 60}h)</span>
                    </button>
                ))}
            </div>

            {/* DATE SELECTION */}
            <div className="section-header" style={{ marginTop: '2.5rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="icon-pulse"><div className="dot"></div></div>
                    Odaberite Datum
                </h3>
            </div>

            <div className="date-strip">
                {days.map((day) => {
                    const isSelected = isSameDay(day, selectedDate);
                    return (
                        <button
                            key={day.toString()}
                            onClick={() => {
                                setSelectedDate(day);
                                setSelectedSlot(null);
                            }}
                            className={`date-card ${isSelected ? 'active' : ''}`}
                        >
                            <span className="day-name">{format(day, "EEE", { locale: hr })}</span>
                            <span className="day-number">{format(day, "d")}</span>
                            {isSelected && <div className="active-dot"></div>}
                        </button>
                    );
                })}
            </div>

            {/* SLOTS SELECTION */}
            <div className="section-header" style={{ marginTop: '2.5rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Clock size={20} color="var(--primary)" />
                    Slobodni Termini
                </h3>
            </div>

            <div className="slots-scroll-container glass">
                {loading ? (
                    <div className="loading-area">
                        <Loader2 className="animate-spin" size={32} color="var(--primary)" />
                        <p>Tražim slobodne termine...</p>
                    </div>
                ) : availableSlots.length === 0 ? (
                    <div className="empty-state">
                        <AlertCircle size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                        <p>Nema slobodnih termina za odabrano trajanje.</p>
                    </div>
                ) : (
                    <div className="slots-list">
                        {availableSlots.map((slot) => {
                            const isSelected = selectedSlot?.time === slot.time;
                            return (
                                <button
                                    key={slot.time}
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`slot-row-item ${isSelected ? 'active' : ''}`}
                                >
                                    <div className="time-info">
                                        <span className="time">{slot.time}</span>
                                        <span className="end-time">do {format(addMinutes(parseISO(`${format(selectedDate, "yyyy-MM-dd")}T${slot.time}:00`), duration), "HH:mm")}</span>
                                    </div>
                                    <div className="coach-info">
                                        <span className="badge">PRO</span>
                                        <span className="name">{slot.coachName}</span>
                                    </div>
                                    <div className={`check-mark ${isSelected ? 'visible' : ''}`}>
                                        <Check size={16} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
                {availableSlots.length > 5 && (
                    <div className="scroll-hint">
                        <ChevronDown size={14} /> Skrolaj za više termina
                    </div>
                )}
            </div>

            {/* SUMMARY */}
            {selectedSlot && (
                <div className="booking-summary glass">
                    <div className="summary-content">
                        <div className="summary-info">
                            <h4>Pregled Rezervacije</h4>
                            <p>
                                <span>{format(selectedDate, "d. MMMM", { locale: hr })}</span> u
                                <span className="highlight"> {selectedSlot.time}h</span>
                            </p>
                            <p className="sub-info">Trajanje: <strong>{duration} min</strong> | Trener: <strong>{selectedSlot.coachName}</strong></p>
                        </div>
                        <button
                            className="btn btn-primary btn-confirm"
                            onClick={handleBooking}
                            disabled={bookingInProgress}
                        >
                            {bookingInProgress ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Potvrdi Rezervaciju</>}
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                .booking-container { animation: fadeIn 0.5s ease; padding-bottom: 2rem; }
                .section-header { margin-bottom: 1rem; }
                .section-header h3 { font-size: 1.1rem; color: #fff; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
                
                /* Duration Toggle */
                .duration-toggle { display: flex; gap: 1rem; margin-bottom: 1rem; }
                .dur-btn { 
                    flex: 1; padding: 0.8rem; border-radius: 14px; background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08); color: #fff; cursor: pointer; transition: all 0.3s;
                    font-weight: 600; font-size: 0.95rem;
                }
                .dur-btn.active { 
                    background: var(--secondary); color: #000; border-color: var(--secondary); 
                    box-shadow: 0 0 20px rgba(255, 126, 33, 0.2); 
                }
                .dur-btn .small { font-size: 0.75rem; opacity: 0.7; }

                /* Date Strip */
                .date-strip { display: flex; gap: 0.6rem; overflow-x: auto; padding: 0.5rem 2px 1.5rem; scrollbar-width: none; }
                .date-strip::-webkit-scrollbar { display: none; }
                .date-card { 
                    flex: 0 0 65px; height: 90px; display: flex; flex-direction: column; align-items: center; justify-content: center;
                    border-radius: 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
                    color: var(--text-muted); cursor: pointer; transition: all 0.2s; position: relative;
                }
                .date-card.active { background: var(--primary); color: #000; border-color: var(--primary); box-shadow: 0 5px 15px rgba(57, 255, 20, 0.2); }
                .day-name { font-size: 0.65rem; text-transform: uppercase; margin-bottom: 4px; }
                .day-number { font-size: 1.4rem; font-weight: 800; }
                .active-dot { position: absolute; bottom: 8px; width: 4px; height: 4px; background: #000; border-radius: 50%; }

                /* Slots List - Limited Height */
                .slots-scroll-container { 
                    border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); 
                    background: rgba(0,0,0,0.2); overflow: hidden; position: relative;
                }
                .slots-list { max-height: 400px; overflow-y: auto; padding: 1rem; scrollbar-width: thin; }
                .loading-area, .empty-state { padding: 4rem 2rem; text-align: center; color: var(--text-muted); }
                
                .slot-row-item { 
                    width: 100%; display: flex; align-items: center; justify-content: space-between;
                    padding: 1rem 1.5rem; margin-bottom: 0.75rem; border-radius: 12px;
                    background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
                    color: #fff; cursor: pointer; transition: all 0.2s;
                }
                .slot-row-item:hover { background: rgba(255,255,255,0.06); border-color: var(--secondary); }
                .slot-row-item.active { background: rgba(255, 126, 33, 0.1); border-color: var(--secondary); }
                
                .time-info { display: flex; flex-direction: column; align-items: flex-start; }
                .time-info .time { font-size: 1.3rem; font-weight: 800; }
                .time-info .end-time { font-size: 0.8rem; color: var(--text-muted); }
                
                .coach-info { display: flex; align-items: center; gap: 0.5rem; }
                .coach-info .badge { font-size: 0.6rem; padding: 2px 5px; background: var(--secondary); color: #000; border-radius: 4px; font-weight: 900; }
                .coach-info .name { font-size: 0.9rem; color: var(--text-muted); }
                
                .check-mark { color: var(--secondary); opacity: 0; transform: scale(0.5); transition: all 0.2s; }
                .check-mark.visible { opacity: 1; transform: scale(1); }

                .scroll-hint { padding: 0.5rem; text-align: center; font-size: 0.7rem; color: var(--text-muted); background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; gap: 4px; }

                /* Summary */
                .booking-summary { margin-top: 2rem; padding: 1.5rem 2rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); animation: slideUp 0.4s ease; }
                .summary-content { display: flex; justify-content: space-between; align-items: center; gap: 2rem; }
                .summary-info h4 { font-size: 0.75rem; text-transform: uppercase; color: var(--secondary); margin-bottom: 0.4rem; letter-spacing: 1px; }
                .summary-info p { font-size: 1.4rem; font-weight: 700; color: #fff; }
                .highlight { color: var(--primary); }
                .sub-info { font-size: 0.85rem !important; color: var(--text-muted); font-weight: 400 !important; margin-top: 0.3rem; }
                
                .btn-confirm { height: 54px; padding: 0 2rem; border-radius: 12px; font-weight: 800; box-shadow: 0 4px 15px rgba(57, 255, 20, 0.2); }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                @media (max-width: 700px) {
                    .summary-content { flex-direction: column; text-align: center; gap: 1rem; }
                    .btn-confirm { width: 100%; }
                }
            `}</style>
        </div>
    );
}
