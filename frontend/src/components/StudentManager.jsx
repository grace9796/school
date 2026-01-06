import React, { useState, useEffect } from 'react';
import { Plus, X, Search, Edit, UserPlus } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function StudentManager() {
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        line_user_id: '',
        student_name: '',
        contact_name: '',
        contact_phone: '',
        notes: ''
    });

    useEffect(() => {
        loadStudents();
    }, []);

    useEffect(() => {
        if (searchTerm) {
            const filtered = students.filter(student =>
                student.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.contact_phone?.includes(searchTerm)
            );
            setFilteredStudents(filtered);
        } else {
            setFilteredStudents(students);
        }
    }, [searchTerm, students]);

    const loadStudents = async () => {
        try {
            const response = await fetch(`${API_URL}/api/students`);
            const data = await response.json();
            setStudents(data);
            setFilteredStudents(data);
            setLoading(false);
        } catch (error) {
            console.error('Error loading students:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(`${API_URL}/api/students`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                await loadStudents();
                setShowModal(false);
                setFormData({
                    line_user_id: '',
                    student_name: '',
                    contact_name: '',
                    contact_phone: '',
                    notes: ''
                });
            }
        } catch (error) {
            console.error('Error creating student:', error);
        }
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>學生管理</h1>
                    <p style={styles.subtitle}>管理學生資料和聯絡資訊</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <UserPlus size={20} />
                    新增學生
                </button>
            </div>

            <div className="card">
                <div style={styles.searchBar}>
                    <Search size={20} style={{ color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="搜尋學生姓名、聯絡人或電話..."
                        style={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>學生姓名</th>
                                <th>LINE ID</th>
                                <th>聯絡人</th>
                                <th>聯絡電話</th>
                                <th>備註</th>
                                <th>建立日期</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                                        {searchTerm ? '找不到符合的學生' : '尚未新增任何學生'}
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map(student => (
                                    <tr key={student.student_id}>
                                        <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                            {student.student_name}
                                        </td>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                            {student.line_user_id ? `${student.line_user_id.substring(0, 12)}...` : '-'}
                                        </td>
                                        <td>{student.contact_name}</td>
                                        <td>{student.contact_phone}</td>
                                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {student.notes || '-'}
                                        </td>
                                        <td>{student.created_at ? new Date(student.created_at).toLocaleDateString('zh-TW') : '-'}</td>
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
                            <h3 className="modal-title">新增學生</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">LINE User ID（選填）</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.line_user_id}
                                    onChange={(e) => setFormData({ ...formData, line_user_id: e.target.value })}
                                    placeholder="如果學生透過 LINE Bot 報名，會自動填入"
                                />
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 'var(--spacing-xs)' }}>
                                    手動新增學生時可不填，學生透過 LINE 預約時會自動關聯
                                </p>
                            </div>

                            <div className="form-group">
                                <label className="form-label">學生姓名 *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.student_name}
                                    onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                                    placeholder="請輸入學生姓名"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">聯絡人姓名 *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.contact_name}
                                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                    placeholder="請輸入聯絡人姓名（家長或監護人）"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">聯絡電話 *</label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    value={formData.contact_phone}
                                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                                    placeholder="請輸入聯絡電話"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">備註</label>
                                <textarea
                                    className="form-textarea"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="其他備註資訊"
                                />
                            </div>

                            <div style={styles.modalFooter}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                                    取消
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    新增學生
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
    searchBar: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-md)',
        padding: 'var(--spacing-lg)',
        borderBottom: '1px solid var(--border)',
    },
    searchInput: {
        flex: 1,
        background: 'transparent',
        border: 'none',
        color: 'var(--text-primary)',
        fontSize: '1rem',
        outline: 'none',
    },
    modalFooter: {
        display: 'flex',
        gap: 'var(--spacing-md)',
        justifyContent: 'flex-end',
        marginTop: 'var(--spacing-xl)',
    },
};

export default StudentManager;
