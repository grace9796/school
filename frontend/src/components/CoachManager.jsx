import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2, Users } from 'lucide-react';

function CoachManager() {
    const [coaches, setCoaches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        coach_name: ''
    });

    useEffect(() => {
        loadCoaches();
    }, []);

    const loadCoaches = async () => {
        try {
            const response = await fetch('/api/coaches');
            const data = await response.json();
            setCoaches(data);
            setLoading(false);
        } catch (error) {
            console.error('Error loading coaches:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/coaches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                await loadCoaches();
                setShowModal(false);
                setFormData({ coach_name: '' });
            }
        } catch (error) {
            console.error('Error creating coach:', error);
        }
    };

    const handleDelete = async (coachId) => {
        if (!confirm('確定要刪除此教練嗎？')) return;

        try {
            const response = await fetch(`/api/coaches/${coachId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await loadCoaches();
            }
        } catch (error) {
            console.error('Error deleting coach:', error);
        }
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>教練管理</h1>
                    <p style={styles.subtitle}>管理所有教練資訊</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={20} />
                    新增教練
                </button>
            </div>

            <div className="card">
                {coaches.length === 0 ? (
                    <div style={styles.emptyState}>
                        <Users size={64} style={{ opacity: 0.3 }} />
                        <p style={styles.emptyText}>尚未新增任何教練</p>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            <Plus size={20} />
                            新增第一位教練
                        </button>
                    </div>
                ) : (
                    <div style={styles.coachGrid}>
                        {coaches.map(coach => (
                            <div key={coach.coach_id} className="card" style={styles.coachCard}>
                                <div style={styles.coachHeader}>
                                    <div style={styles.coachIcon}>👨‍🏫</div>
                                    <button
                                        className="btn btn-danger"
                                        style={styles.deleteBtn}
                                        onClick={() => handleDelete(coach.coach_id)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div style={styles.coachBody}>
                                    <h3 style={styles.coachName}>{coach.coach_name}</h3>
                                    <div style={styles.coachMeta}>
                                        <span className="badge badge-success">啟用中</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">新增教練</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">教練姓名 *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.coach_name}
                                    onChange={(e) => setFormData({ ...formData, coach_name: e.target.value })}
                                    placeholder="請輸入教練姓名"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div style={styles.modalFooter}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                                    取消
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    新增教練
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
    emptyState: {
        textAlign: 'center',
        padding: 'var(--spacing-2xl) var(--spacing-xl)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--spacing-lg)',
    },
    emptyText: {
        color: 'var(--text-muted)',
        fontSize: '1.1rem',
    },
    coachGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: 'var(--spacing-lg)',
        padding: 'var(--spacing-lg)',
    },
    coachCard: {
        padding: 'var(--spacing-lg)',
        transition: 'all var(--transition-normal)',
        cursor: 'default',
    },
    coachHeader: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 'var(--spacing-md)',
    },
    coachIcon: {
        fontSize: '3rem',
        lineHeight: 1,
    },
    deleteBtn: {
        padding: 'var(--spacing-xs)',
        minWidth: 'auto',
    },
    coachBody: {
        textAlign: 'center',
    },
    coachName: {
        fontSize: '1.25rem',
        fontWeight: '700',
        margin: '0 0 var(--spacing-md) 0',
        color: 'var(--text-primary)',
    },
    coachMeta: {
        display: 'flex',
        justifyContent: 'center',
        gap: 'var(--spacing-sm)',
    },
    modalFooter: {
        display: 'flex',
        gap: 'var(--spacing-md)',
        justifyContent: 'flex-end',
        marginTop: 'var(--spacing-xl)',
    },
};

export default CoachManager;
