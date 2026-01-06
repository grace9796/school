import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Calendar, BookOpen, Users, Package, Settings as SettingsIcon } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ScheduleManager from './components/ScheduleManager';
import BookingManager from './components/BookingManager';
import StudentManager from './components/StudentManager';
import CourseManager from './components/CourseManager';
import CoachManager from './components/CoachManager';

function Navigation() {
    const location = useLocation();

    const navItems = [
        { path: '/', icon: Home, label: '首頁' },
        { path: '/schedule', icon: Calendar, label: '時段管理' },
        { path: '/bookings', icon: BookOpen, label: '課程安排' },
        { path: '/students', icon: Users, label: '學生管理' },
        { path: '/courses', icon: Package, label: '課程管理' },
        { path: '/coaches', icon: Users, label: '教練管理' },
    ];

    return (
        <nav style={styles.nav}>
            <div style={styles.navBrand}>
                <div style={styles.logo}>🛹</div>
                <h2 style={styles.brandText}>Board School</h2>
            </div>
            <div style={styles.navLinks}>
                {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            style={{
                                ...styles.navLink,
                                ...(isActive ? styles.navLinkActive : {})
                            }}
                        >
                            <Icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

function App() {
    return (
        <Router>
            <div style={styles.app}>
                <Navigation />
                <main style={styles.main}>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/schedule" element={<ScheduleManager />} />
                        <Route path="/bookings" element={<BookingManager />} />
                        <Route path="/students" element={<StudentManager />} />
                        <Route path="/courses" element={<CourseManager />} />
                        <Route path="/coaches" element={<CoachManager />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

const styles = {
    app: {
        display: 'flex',
        minHeight: '100vh',
    },
    nav: {
        width: '280px',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        padding: 'var(--spacing-xl)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-xl)',
    },
    navBrand: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-md)',
        paddingBottom: 'var(--spacing-lg)',
        borderBottom: '1px solid var(--border)',
    },
    logo: {
        fontSize: '2rem',
        width: '48px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--gradient-primary)',
        borderRadius: 'var(--radius-md)',
    },
    brandText: {
        fontSize: '1.5rem',
        fontWeight: '800',
        margin: 0,
        background: 'var(--gradient-primary)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    navLinks: {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-sm)',
    },
    navLink: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-md)',
        padding: 'var(--spacing-md)',
        color: 'var(--text-secondary)',
        textDecoration: 'none',
        borderRadius: 'var(--radius-md)',
        transition: 'all var(--transition-normal)',
        fontWeight: '600',
    },
    navLinkActive: {
        background: 'rgba(108, 92, 231, 0.15)',
        color: 'var(--primary-light)',
    },
    main: {
        flex: 1,
        padding: 'var(--spacing-2xl)',
        overflowY: 'auto',
    },
};

export default App;
