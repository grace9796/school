import React, { useState, useEffect } from 'react';
import { Calendar, Users, Package, TrendingUp } from 'lucide-react';

function Dashboard() {
    const [stats, setStats] = useState({
        totalStudents: 0,
        activeCourses: 0,
        todayBookings: 0,
        upcomingBookings: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [studentsRes, coursesRes, bookingsRes] = await Promise.all([
                fetch('/api/students'),
                fetch('/api/courses'),
                fetch('/api/bookings')
            ]);

            const students = await studentsRes.json();
            const courses = await coursesRes.json();
            const bookings = await bookingsRes.json();

            const today = new Date().toISOString().split('T')[0];
            const todayBookings = bookings.filter(b => b.date === today && b.status === 'scheduled');

            const upcoming = bookings
                .filter(b => new Date(b.date) >= new Date() && b.status === 'scheduled')
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(0, 10);

            const activeCourses = courses.filter(c => c.status === 'active');

            setStats({
                totalStudents: students.length,
                activeCourses: activeCourses.length,
                todayBookings: todayBookings.length,
                upcomingBookings: upcoming
            });
            setLoading(false);
        } catch (error) {
            console.error('Error loading dashboard:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    const statCards = [
        {
            title: '總學生數',
            value: stats.totalStudents,
            icon: Users,
            gradient: 'var(--gradient-primary)'
        },
        {
            title: '活躍課程',
            value: stats.activeCourses,
            icon: Package,
            gradient: 'var(--gradient-secondary)'
        },
        {
            title: '今日課程',
            value: stats.todayBookings,
            icon: Calendar,
            gradient: 'var(--gradient-accent)'
        }
    ];

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>儀表板</h1>
                    <p style={styles.subtitle}>歡迎回到滑板課程管理系統</p>
                </div>
            </div>

            <div style={styles.statsGrid}>
                {statCards.map((stat, index) => (
                    <div key={index} className="card" style={styles.statCard}>
                        <div style={styles.statContent}>
                            <div>
                                <div style={styles.statLabel}>{stat.title}</div>
                                <div style={styles.statValue}>{stat.value}</div>
                            </div>
                            <div style={{
                                ...styles.statIcon,
                                background: stat.gradient
                            }}>
                                <stat.icon size={28} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card" style={styles.upcomingCard}>
                <div className="card-header">
                    <h3 className="card-title">即將到來的課程</h3>
                </div>
                <div className="card-body">
                    {stats.upcomingBookings.length === 0 ? (
                        <p style={styles.emptyText}>目前沒有即將到來的課程</p>
                    ) : (
                        <div style={styles.bookingsList}>
                            {stats.upcomingBookings.map(booking => (
                                <div key={booking.booking_id} style={styles.bookingItem}>
                                    <div style={styles.bookingDate}>
                                        <Calendar size={18} />
                                        <span>{booking.date}</span>
                                    </div>
                                    <div style={styles.bookingInfo}>
                                        <div style={styles.bookingTime}>{booking.time_slot}</div>
                                        <div style={styles.bookingDetails}>
                                            <span>👨‍🏫 {booking.coach}</span>
                                            <span>•</span>
                                            <span>👤 {booking.student_name}</span>
                                        </div>
                                    </div>
                                    <span className="badge badge-info">已預約</span>
                                </div>
                            ))}
                        </div>
                    )}
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
        background: 'var(--gradient-primary)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    subtitle: {
        color: 'var(--text-secondary)',
        marginTop: 'var(--spacing-sm)',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--spacing-lg)',
        marginBottom: 'var(--spacing-2xl)',
    },
    statCard: {
        background: 'var(--bg-card)',
    },
    statContent: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statLabel: {
        color: 'var(--text-secondary)',
        fontSize: '0.9rem',
        marginBottom: 'var(--spacing-sm)',
    },
    statValue: {
        fontSize: '2.5rem',
        fontWeight: '800',
        color: 'var(--text-primary)',
    },
    statIcon: {
        width: '64px',
        height: '64px',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
    },
    upcomingCard: {
        marginTop: 'var(--spacing-2xl)',
    },
    emptyText: {
        textAlign: 'center',
        color: 'var(--text-muted)',
        padding: 'var(--spacing-2xl)',
    },
    bookingsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-md)',
    },
    bookingItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-lg)',
        padding: 'var(--spacing-md)',
        background: 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-md)',
        transition: 'all var(--transition-normal)',
    },
    bookingDate: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
        color: 'var(--primary-light)',
        fontWeight: '600',
        minWidth: '120px',
    },
    bookingInfo: {
        flex: 1,
    },
    bookingTime: {
        fontWeight: '600',
        color: 'var(--text-primary)',
        marginBottom: 'var(--spacing-xs)',
    },
    bookingDetails: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
    },
};

export default Dashboard;
