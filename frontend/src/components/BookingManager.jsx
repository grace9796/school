import React, { useState, useEffect } from 'react';
import { Filter, Calendar } from 'lucide-react';
import { format } from 'date-fns';

function BookingManager() {
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDate, setFilterDate] = useState('upcoming');

    useEffect(() => {
        loadBookings();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filterStatus, filterDate, bookings]);

    const loadBookings = async () => {
        try {
            const response = await fetch('/api/bookings');
            const data = await response.json();
            setBookings(data);
            setLoading(false);
        } catch (error) {
            console.error('Error loading bookings:', error);
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...bookings];

        // Filter by status
        if (filterStatus !== 'all') {
            filtered = filtered.filter(b => b.status === filterStatus);
        }

        // Filter by date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (filterDate === 'upcoming') {
            filtered = filtered.filter(b => new Date(b.date) >= today);
        } else if (filterDate === 'past') {
            filtered = filtered.filter(b => new Date(b.date) < today);
        } else if (filterDate === 'today') {
            const todayStr = format(today, 'yyyy-MM-dd');
            filtered = filtered.filter(b => b.date === todayStr);
        }

        // Sort by date
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

        setFilteredBookings(filtered);
    };

    const getStatusBadge = (status) => {
        const badges = {
            scheduled: { class: 'badge-info', text: '已預約' },
            completed: { class: 'badge-success', text: '已完成' },
            cancelled: { class: 'badge-danger', text: '已取消' }
        };
        const badge = badges[status] || { class: 'badge-info', text: status };
        return <span className={`badge ${badge.class}`}>{badge.text}</span>;
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>課程安排</h1>
                    <p style={styles.subtitle}>查看和管理所有預約課程</p>
                </div>
            </div>

            <div className="card">
                <div style={styles.filters}>
                    <div style={styles.filterGroup}>
                        <Filter size={18} style={{ color: 'var(--text-muted)' }} />
                        <span style={styles.filterLabel}>篩選:</span>

                        <select
                            className="form-select"
                            style={styles.filterSelect}
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                        >
                            <option value="all">所有時間</option>
                            <option value="today">今天</option>
                            <option value="upcoming">即將到來</option>
                            <option value="past">過去課程</option>
                        </select>

                        <select
                            className="form-select"
                            style={styles.filterSelect}
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">所有狀態</option>
                            <option value="scheduled">已預約</option>
                            <option value="completed">已完成</option>
                            <option value="cancelled">已取消</option>
                        </select>
                    </div>

                    <div style={styles.statsInfo}>
                        共 {filteredBookings.length} 筆課程
                    </div>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>日期</th>
                                <th>時段</th>
                                <th>學生</th>
                                <th>教練</th>
                                <th>狀態</th>
                                <th>預約時間</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                                        找不到符合條件的課程
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings.map(booking => (
                                    <tr key={booking.booking_id}>
                                        <td>
                                            <div style={styles.dateCell}>
                                                <Calendar size={16} style={{ color: 'var(--primary-light)' }} />
                                                <span>{booking.date}</span>
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                            {booking.time_slot}
                                        </td>
                                        <td>{booking.student_name}</td>
                                        <td>
                                            <span style={styles.coachBadge}>👨‍🏫 {booking.coach}</span>
                                        </td>
                                        <td>{getStatusBadge(booking.status)}</td>
                                        <td style={{ fontSize: '0.85rem' }}>
                                            {booking.created_at ? new Date(booking.created_at).toLocaleString('zh-TW') : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        maxWidth: '1400px',
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
    filters: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--spacing-lg)',
        borderBottom: '1px solid var(--border)',
    },
    filterGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-md)',
    },
    filterLabel: {
        color: 'var(--text-muted)',
        fontSize: '0.9rem',
        fontWeight: '600',
    },
    filterSelect: {
        minWidth: '150px',
    },
    statsInfo: {
        color: 'var(--text-muted)',
        fontSize: '0.9rem',
    },
    dateCell: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
    },
    coachBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--spacing-xs)',
        padding: 'var(--spacing-xs) var(--spacing-sm)',
        background: 'rgba(108, 92, 231, 0.15)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.85rem',
        color: 'var(--primary-light)',
    },
};

export default BookingManager;
