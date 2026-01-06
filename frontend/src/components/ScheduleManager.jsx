import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, X } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { zhTW } from 'date-fns/locale';

function ScheduleManager() {
    const [schedules, setSchedules] = useState([]);
    const [coaches, setCoaches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [formData, setFormData] = useState({
        coach: '',
        dates: [],
        time_slots: []
    });

    const timeSlots = [
        '09:00-10:00', '10:00-11:00', '11:00-12:00',
        '13:00-14:00', '14:00-15:00', '15:00-16:00',
        '16:00-17:00', '17:00-18:00', '18:00-19:00', '19:00-20:00'
    ];

    useEffect(() => {
        loadSchedules();
    }, []);

    const loadSchedules = async () => {
        try {
            const [schedulesRes, coachesRes] = await Promise.all([
                fetch('/api/schedules'),
                fetch('/api/coaches')
            ]);
            const schedulesData = await schedulesRes.json();
            const coachesData = await coachesRes.json();
            setSchedules(schedulesData);
            setCoaches(coachesData);
            setLoading(false);
        } catch (error) {
            console.error('Error loading data:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/schedules/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                await loadSchedules();
                setShowModal(false);
                setFormData({ coach: '', dates: [], time_slots: [] });
            }
        } catch (error) {
            console.error('Error creating schedules:', error);
        }
    };

    const getWeekDays = () => {
        const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
        const end = endOfWeek(currentWeek, { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    };

    const getScheduleForDateAndTime = (date, timeSlot) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return schedules.filter(s => s.date === dateStr && s.time_slot === timeSlot);
    };

    const toggleDate = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        setFormData(prev => ({
            ...prev,
            dates: prev.dates.includes(dateStr)
                ? prev.dates.filter(d => d !== dateStr)
                : [...prev.dates, dateStr]
        }));
    };

    const toggleTimeSlot = (slot) => {
        setFormData(prev => ({
            ...prev,
            time_slots: prev.time_slots.includes(slot)
                ? prev.time_slots.filter(s => s !== slot)
                : [...prev.time_slots, slot]
        }));
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    const weekDays = getWeekDays();

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>教練時段管理</h1>
                    <p style={styles.subtitle}>設定教練可用的上課時段</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={20} />
                    新增時段
                </button>
            </div>

            <div className="card" style={styles.calendarCard}>
                <div style={styles.weekNav}>
                    <button
                        className="btn btn-outline"
                        onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
                    >
                        ← 上週
                    </button>
                    <h3 style={styles.weekTitle}>
                        {format(weekDays[0], 'yyyy/MM/dd', { locale: zhTW })} - {format(weekDays[6], 'yyyy/MM/dd', { locale: zhTW })}
                    </h3>
                    <button
                        className="btn btn-outline"
                        onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
                    >
                        下週 →
                    </button>
                </div>

                <div style={styles.scheduleGrid}>
                    <div style={styles.timeColumn}>
                        <div style={styles.cornerCell}></div>
                        {timeSlots.map(slot => (
                            <div key={slot} style={styles.timeCell}>{slot}</div>
                        ))}
                    </div>

                    {weekDays.map(day => (
                        <div key={day.toString()} style={styles.dayColumn}>
                            <div style={styles.dayHeader}>
                                <div style={styles.dayName}>{format(day, 'EEE', { locale: zhTW }).toUpperCase()}</div>
                                <div style={styles.dayDate}>{format(day, 'MM/dd')}</div>
                            </div>
                            {timeSlots.map(slot => {
                                const scheduleItems = getScheduleForDateAndTime(day, slot);
                                return (
                                    <div key={slot} style={styles.scheduleCell}>
                                        {scheduleItems.map(schedule => (
                                            <div
                                                key={schedule.schedule_id}
                                                style={{
                                                    ...styles.scheduleItem,
                                                    ...(schedule.is_available ? styles.scheduleAvailable : styles.scheduleBooked)
                                                }}
                                            >
                                                <div style={styles.coachName}>{schedule.coach}</div>
                                                {!schedule.is_available && (
                                                    <div style={styles.bookedBadge}>已預約</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">批次新增時段</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">教練名稱</label>
                                <select
                                    className="form-select"
                                    value={formData.coach}
                                    onChange={(e) => setFormData({ ...formData, coach: e.target.value })}
                                    required
                                >
                                    <option value="">請選擇教練</option>
                                    {coaches.map(coach => (
                                        <option key={coach.coach_id} value={coach.coach_name}>
                                            {coach.coach_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">選擇日期（可選未來一年內的日期）</label>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-sm)' }}>
                                    可以多次選擇日期，按住 Ctrl/Cmd 點擊日期按鈕來添加多個日期
                                </p>
                                <div style={styles.calendarInput}>
                                    <input
                                        type="date"
                                        className="form-input"
                                        min={new Date().toISOString().split('T')[0]}
                                        max={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                                        onChange={(e) => {
                                            const dateStr = e.target.value;
                                            if (dateStr && !formData.dates.includes(dateStr)) {
                                                setFormData({
                                                    ...formData,
                                                    dates: [...formData.dates, dateStr]
                                                });
                                            }
                                        }}
                                    />
                                </div>
                                {formData.dates.length > 0 && (
                                    <div style={styles.selectedDates}>
                                        <p style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: 'var(--spacing-sm)' }}>
                                            已選擇的日期：
                                        </p>
                                        <div style={styles.dateTagsContainer}>
                                            {formData.dates.map(date => (
                                                <div key={date} style={styles.dateTag}>
                                                    <span>{date}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({
                                                            ...formData,
                                                            dates: formData.dates.filter(d => d !== date)
                                                        })}
                                                        style={styles.dateTagRemove}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">選擇時段</label>
                                <div style={styles.timeGrid}>
                                    {timeSlots.map(slot => {
                                        const isSelected = formData.time_slots.includes(slot);
                                        return (
                                            <button
                                                key={slot}
                                                type="button"
                                                style={{
                                                    ...styles.timeButton,
                                                    ...(isSelected ? styles.timeButtonSelected : {})
                                                }}
                                                onClick={() => toggleTimeSlot(slot)}
                                            >
                                                {slot}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div style={styles.modalFooter}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={!formData.coach || formData.dates.length === 0 || formData.time_slots.length === 0}
                                >
                                    建立時段
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        maxWidth: '1600px',
        margin: '0 auto',
    },
    header: {
        marginBottom: 'var(--spacing-2xl)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: '2.5rem',
        fontWeight: '800',
        margin: 0,
    },
    subtitle: {
        color: 'var(--text-secondary)',
        marginTop: 'var(--spacing-sm)',
    },
    calendarCard: {
        padding: 0,
        overflow: 'hidden',
    },
    weekNav: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--spacing-lg)',
        borderBottom: '1px solid var(--border)',
    },
    weekTitle: {
        margin: 0,
        color: 'var(--text-primary)',
    },
    scheduleGrid: {
        display: 'flex',
        overflowX: 'auto',
    },
    timeColumn: {
        minWidth: '100px',
        borderRight: '1px solid var(--border)',
    },
    cornerCell: {
        height: '80px',
        borderBottom: '1px solid var(--border)',
    },
    timeCell: {
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
        borderBottom: '1px solid var(--border)',
    },
    dayColumn: {
        minWidth: '150px',
        flex: 1,
    },
    dayHeader: {
        height: '80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-tertiary)',
    },
    dayName: {
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        marginBottom: 'var(--spacing-xs)',
    },
    dayDate: {
        fontSize: '1.1rem',
        fontWeight: '700',
        color: 'var(--text-primary)',
    },
    scheduleCell: {
        height: '60px',
        padding: 'var(--spacing-xs)',
        borderBottom: '1px solid var(--border)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-xs)',
    },
    scheduleItem: {
        padding: 'var(--spacing-xs)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.75rem',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    scheduleAvailable: {
        background: 'rgba(0, 184, 148, 0.2)',
        color: 'var(--secondary)',
    },
    scheduleBooked: {
        background: 'rgba(255, 107, 107, 0.2)',
        color: 'var(--danger)',
    },
    coachName: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    bookedBadge: {
        fontSize: '0.65rem',
    },
    dateGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 'var(--spacing-sm)',
    },
    dateButton: {
        padding: 'var(--spacing-sm)',
        border: '2px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-tertiary)',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        transition: 'all var(--transition-normal)',
        textAlign: 'center',
    },
    dateButtonSelected: {
        borderColor: 'var(--primary)',
        background: 'rgba(108, 92, 231, 0.2)',
        color: 'var(--primary-light)',
    },
    dateName: {
        fontSize: '0.75rem',
        marginBottom: 'var(--spacing-xs)',
    },
    dateNum: {
        fontWeight: '700',
    },
    timeGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'var(--spacing-sm)',
    },
    timeButton: {
        padding: 'var(--spacing-sm)',
        border: '2px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-tertiary)',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        transition: 'all var(--transition-normal)',
        fontSize: '0.85rem',
    },
    timeButtonSelected: {
        borderColor: 'var(--secondary)',
        background: 'rgba(0, 184, 148, 0.2)',
        color: 'var(--secondary)',
    },
    modalFooter: {
        display: 'flex',
        gap: 'var(--spacing-md)',
        justifyContent: 'flex-end',
        marginTop: 'var(--spacing-xl)',
    },
    calendarInput: {
        marginBottom: 'var(--spacing-md)',
    },
    selectedDates: {
        marginTop: 'var(--spacing-md)',
        padding: 'var(--spacing-md)',
        background: 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-md)',
    },
    dateTagsContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--spacing-sm)',
    },
    dateTag: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--spacing-xs)',
        padding: 'var(--spacing-xs) var(--spacing-sm)',
        background: 'rgba(108, 92, 231, 0.2)',
        color: 'var(--primary-light)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.85rem',
        fontWeight: '600',
    },
    dateTagRemove: {
        background: 'none',
        border: 'none',
        color: 'var(--primary-light)',
        cursor: 'pointer',
        fontSize: '1.2rem',
        lineHeight: 1,
        padding: 0,
        width: '20px',
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
};

export default ScheduleManager;
