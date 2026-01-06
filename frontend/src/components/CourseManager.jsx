import React, { useState, useEffect } from 'react';
import { Plus, X, Package } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function CourseManager() {
    const [courses, setCourses] = useState([]);
    const [students, setStudents] = useState([]);
    const [coaches, setCoaches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        student_id: '',
        course_type: '1對1',
        coach: '',
        total_sessions: '',
        purchase_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [coursesRes, studentsRes, coachesRes] = await Promise.all([
                fetch(`${API_URL}/api/courses`),
                fetch(`${API_URL}/api/students`),
                fetch(`${API_URL}/api/coaches`)
            ]);
            const coursesData = await coursesRes.json();
            const studentsData = await studentsRes.json();
            const coachesData = await coachesRes.json();

            setCourses(coursesData);
            setStudents(studentsData);
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
            const response = await fetch(`${API_URL}/api/courses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                await loadData();
                setShowModal(false);
                setFormData({
                    student_id: '',
                    course_type: '1對1',
                    coach: '',
                    total_sessions: '',
                    purchase_date: new Date().toISOString().split('T')[0]
                });
            }
        } catch (error) {
            console.error('Error creating course:', error);
        }
    };

    const getStatusBadge = (course) => {
        if (course.status === 'completed') {
            return <span className="badge badge-success">已完成</span>;
        }
        if (course.status === 'expired') {
            return <span className="badge badge-danger">已過期</span>;
        }
        if (course.remaining_sessions === 0) {
            return <span className="badge badge-warning">已用完</span>;
        }
        if (course.course_type === '1對1' && course.expiry_date) {
            const daysLeft = Math.ceil((new Date(course.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
            if (daysLeft < 0) {
                return <span className="badge badge-danger">已過期</span>;
            }
            if (daysLeft <= 14) {
                return <span className="badge badge-warning">即將到期 ({daysLeft}天)</span>;
            }
        }
        return <span className="badge badge-info">進行中</span>;
    };

    const getProgressBar = (total, remaining) => {
        const percentage = (remaining / total) * 100;
        let color = 'var(--success)';
        if (percentage < 25) color = 'var(--danger)';
        else if (percentage < 50) color = 'var(--warning)';

        return (
            <div style={styles.progressContainer}>
                <div style={{
                    ...styles.progressBar,
                    width: `${percentage}%`,
                    background: color
                }} />
            </div>
        );
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>課程管理</h1>
                    <p style={styles.subtitle}>管理學生的課程和堂數</p>
                </div>
                <button className="btn btn-secondary" onClick={() => setShowModal(true)}>
                    <Plus size={20} />
                    新增課程
                </button>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>學生姓名</th>
                                <th>課程類型</th>
                                <th>教練</th>
                                <th>總堂數</th>
                                <th>剩餘堂數</th>
                                <th>進度</th>
                                <th>購買日期</th>
                                <th>到期日期</th>
                                <th>狀態</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.length === 0 ? (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                                        尚未新增任何課程
                                    </td>
                                </tr>
                            ) : (
                                courses.map(course => (
                                    <tr key={course.course_id}>
                                        <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                            {course.student_name}
                                        </td>
                                        <td>
                                            <span className="badge badge-primary">{course.course_type}</span>
                                        </td>
                                        <td>👨‍🏫 {course.coach}</td>
                                        <td>{course.total_sessions}</td>
                                        <td style={{ fontWeight: '700', color: 'var(--secondary)' }}>
                                            {course.remaining_sessions}
                                        </td>
                                        <td style={{ minWidth: '120px' }}>
                                            {getProgressBar(course.total_sessions, course.remaining_sessions)}
                                            <div style={styles.progressText}>
                                                {course.total_sessions - course.remaining_sessions} / {course.total_sessions}
                                            </div>
                                        </td>
                                        <td>{course.purchase_date}</td>
                                        <td>{course.expiry_date || '-'}</td>
                                        <td>{getStatusBadge(course)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">新增課程</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">選擇學生 *</label>
                                <select
                                    className="form-select"
                                    value={formData.student_id}
                                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                                    required
                                >
                                    <option value="">請選擇學生</option>
                                    {students.map(student => (
                                        <option key={student.student_id} value={student.student_id}>
                                            {student.student_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">課程類型 *</label>
                                <select
                                    className="form-select"
                                    value={formData.course_type}
                                    onChange={(e) => setFormData({ ...formData, course_type: e.target.value })}
                                    required
                                >
                                    <option value="1對1">1對1</option>
                                    <option value="團課">團課</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">教練 *</label>
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
                                <label className="form-label">總堂數 *</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.total_sessions}
                                    onChange={(e) => setFormData({ ...formData, total_sessions: e.target.value })}
                                    placeholder="請輸入總堂數"
                                    min="1"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">購買日期 *</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.purchase_date}
                                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                                    required
                                />
                            </div>

                            {formData.course_type === '1對1' && (
                                <div style={styles.infoBox}>
                                    <Package size={18} />
                                    <div>
                                        <div style={styles.infoTitle}>1對1課程規則</div>
                                        <div style={styles.infoText}>此課程需在購買日起 100 天內使用完畢</div>
                                    </div>
                                </div>
                            )}

                            <div style={styles.modalFooter}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                                    取消
                                </button>
                                <button type="submit" className="btn btn-secondary">
                                    新增課程
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
    progressContainer: {
        width: '100%',
        height: '8px',
        background: 'var(--bg-tertiary)',
        borderRadius: '4px',
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        transition: 'width var(--transition-normal)',
        borderRadius: '4px',
    },
    progressText: {
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        marginTop: 'var(--spacing-xs)',
        textAlign: 'center',
    },
    infoBox: {
        display: 'flex',
        gap: 'var(--spacing-md)',
        padding: 'var(--spacing-md)',
        background: 'rgba(0, 184, 148, 0.1)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(0, 184, 148, 0.3)',
        color: 'var(--secondary)',
        marginTop: 'var(--spacing-lg)',
    },
    infoTitle: {
        fontWeight: '600',
        marginBottom: 'var(--spacing-xs)',
    },
    infoText: {
        fontSize: '0.85rem',
        opacity: 0.9,
    },
    modalFooter: {
        display: 'flex',
        gap: 'var(--spacing-md)',
        justifyContent: 'flex-end',
        marginTop: 'var(--spacing-xl)',
    },
};

export default CourseManager;
