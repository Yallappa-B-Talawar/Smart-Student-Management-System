import { useState, useEffect, useCallback } from 'react';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX, HiOutlineRefresh } from 'react-icons/hi';
import { teachersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../components/ui/Components.css';

const emptyForm = { name: '', email: '', subject: '', classes: '', phone: '', qualification: '', experience: '', address: '' };

export default function Teachers() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isStudent = user?.role === 'student';

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, onLeave: 0 });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [viewTeacher, setViewTeacher] = useState(null);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await teachersAPI.getAll();
      setTeachers(res.data.data.teachers || []);
    } catch { setTeachers([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

  // Auto-refresh every 30 seconds for live updates
  useEffect(() => {
    const interval = setInterval(fetchTeachers, 30000);
    return () => clearInterval(interval);
  }, [fetchTeachers]);

  useEffect(() => {
    teachersAPI.getStats().then(res => setStats(res.data.data)).catch(() => {});
  }, [teachers]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openCreateForm = () => {
    setEditingId(null);
    setFormData({ ...emptyForm });
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (teacher) => {
    setEditingId(teacher._id);
    setFormData({
      name: teacher.name || '',
      email: teacher.email || '',
      subject: teacher.subject || '',
      classes: (teacher.classes || []).join(', '),
      phone: teacher.phone || '',
      qualification: teacher.qualification || '',
      experience: teacher.experience || '',
      address: teacher.address || '',
    });
    setFormError('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ ...emptyForm });
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      const payload = {
        ...formData,
        classes: formData.classes.split(',').map(c => c.trim()).filter(Boolean),
        experience: formData.experience ? Number(formData.experience) : 0,
      };
      if (editingId) {
        await teachersAPI.update(editingId, payload);
        showToast('Teacher updated successfully');
      } else {
        await teachersAPI.create(payload);
        showToast('Teacher created successfully');
      }
      closeForm();
      fetchTeachers();
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors?.length) {
        setFormError(data.errors.map(e => e.message).join(' • '));
      } else {
        setFormError(data?.message || 'Operation failed');
      }
    } finally { setFormLoading(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete teacher "${name}"? This cannot be undone.`)) return;
    try { await teachersAPI.delete(id); showToast('Teacher deleted'); fetchTeachers(); }
    catch { showToast('Delete failed', 'error'); }
  };

  const f = (key, val) => setFormData(p => ({ ...p, [key]: val }));

  // ──────────────────────────────────────────────────────────────────
  // STUDENT VIEW — read-only teacher directory (card layout)
  // ──────────────────────────────────────────────────────────────────
  if (isStudent) {
    return (
      <div>
        <div className="section-header">
          <div>
            <h2 className="section-title">
              Teachers Directory
              <span className="badge badge-outline" style={{ marginLeft: '10px', fontSize: '14px', verticalAlign: 'middle' }}>
                {teachers.length}
              </span>
            </h2>
            <p className="section-subtitle">Browse your school's faculty</p>
          </div>
          <button className="btn btn-outline" onClick={fetchTeachers} title="Refresh">
            <HiOutlineRefresh />
          </button>
        </div>

        {/* Stats */}
        <div className="grid-stats section" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="stat-card">
            <div className="stat-card-icon primary">👥</div>
            <div className="stat-card-info"><div className="stat-card-label">Total Faculty</div><div className="stat-card-value">{stats.total}</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon accent">✅</div>
            <div className="stat-card-info"><div className="stat-card-label">Active</div><div className="stat-card-value">{stats.active}</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon danger">🏖️</div>
            <div className="stat-card-info"><div className="stat-card-label">On Leave</div><div className="stat-card-value">{stats.onLeave}</div></div>
          </div>
        </div>

        {loading ? (
          <div className="spinner-wrapper"><div className="spinner" /><span className="spinner-text">Loading teachers...</span></div>
        ) : teachers.length === 0 ? (
          <div className="card section">
            <div className="card-body">
              <div className="empty-state">
                <div className="empty-state-icon">👨‍🏫</div>
                <div className="empty-state-title">No teachers found</div>
                <p className="empty-state-text">Teachers will appear here once they are added by your admin.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {teachers.map(t => (
              <div className="card" key={t._id} style={{ cursor: 'pointer' }} onClick={() => setViewTeacher(t)}>
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                    <div style={{
                      width: '48px', height: '48px', flexShrink: 0,
                      background: 'var(--color-primary)', color: 'var(--color-text-on-primary)',
                      border: '3px solid var(--border-color)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '22px',
                    }}>
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 'var(--font-size-base)' }}>{t.name}</div>
                      {t.subject && (
                        <span className="badge badge-primary" style={{ fontSize: '11px', marginTop: '4px' }}>{t.subject}</span>
                      )}
                    </div>
                    <span className={`badge ${t.status === 'active' ? 'badge-accent' : 'badge-danger'}`} style={{ flexShrink: 0 }}>
                      {t.status}
                    </span>
                  </div>
                  <div className="detail-grid" style={{ gap: '8px' }}>
                    {t.qualification && (
                      <div className="detail-item">
                        <span className="detail-label">Qualification</span>
                        <span className="detail-value">{t.qualification}</span>
                      </div>
                    )}
                    {t.experience > 0 && (
                      <div className="detail-item">
                        <span className="detail-label">Experience</span>
                        <span className="detail-value">{t.experience} years</span>
                      </div>
                    )}
                    {t.classes?.length > 0 && (
                      <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                        <span className="detail-label">Classes</span>
                        <span className="detail-value" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {t.classes.map((cls, i) => <span key={i} className="badge badge-outline" style={{ fontSize: '11px' }}>{cls}</span>)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '10px' }}>Click to view details</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View Modal — read only */}
        {viewTeacher && (
          <div className="modal-overlay" onClick={() => setViewTeacher(null)}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
              <div className="card-header">
                <h3 className="card-header-title">Teacher Details</h3>
                <button className="btn btn-sm btn-outline" onClick={() => setViewTeacher(null)}><HiOutlineX /></button>
              </div>
              <div className="card-body">
                <div className="detail-grid">
                  <div className="detail-item"><span className="detail-label">Name</span><span className="detail-value">{viewTeacher.name}</span></div>
                  <div className="detail-item"><span className="detail-label">Subject</span><span className="detail-value">{viewTeacher.subject || '—'}</span></div>
                  <div className="detail-item"><span className="detail-label">Qualification</span><span className="detail-value">{viewTeacher.qualification || '—'}</span></div>
                  <div className="detail-item"><span className="detail-label">Experience</span><span className="detail-value">{viewTeacher.experience ? `${viewTeacher.experience} years` : '—'}</span></div>
                  <div className="detail-item"><span className="detail-label">Classes</span><span className="detail-value">{(viewTeacher.classes || []).join(', ') || '—'}</span></div>
                  <div className="detail-item">
                    <span className="detail-label">Status</span>
                    <span className="detail-value"><span className={`badge ${viewTeacher.status === 'active' ? 'badge-accent' : 'badge-danger'}`}>{viewTeacher.status}</span></span>
                  </div>
                </div>
                <button className="btn btn-outline" style={{ marginTop: '16px' }} onClick={() => setViewTeacher(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────
  // ADMIN VIEW — full management table
  // ──────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">
            Teachers
            <span className="badge badge-outline" style={{ marginLeft: '10px', fontSize: '14px', verticalAlign: 'middle' }}>
              {teachers.length}
            </span>
          </h2>
          <p className="section-subtitle">Manage faculty and class assignments</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={fetchTeachers} title="Refresh"><HiOutlineRefresh /></button>
          {isAdmin && <button className="btn btn-accent" onClick={openCreateForm}><HiOutlinePlus /> Add Teacher</button>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid-stats section" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-card-icon primary">👥</div>
          <div className="stat-card-info"><div className="stat-card-label">Total Faculty</div><div className="stat-card-value">{stats.total}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon accent">✅</div>
          <div className="stat-card-info"><div className="stat-card-label">Active</div><div className="stat-card-value">{stats.active}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon danger">🏖️</div>
          <div className="stat-card-info"><div className="stat-card-label">On Leave</div><div className="stat-card-value">{stats.onLeave}</div></div>
        </div>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="card section">
          <div className="card-header">
            <h3 className="card-header-title">{editingId ? 'Edit Teacher' : 'New Teacher'}</h3>
            <button className="btn btn-sm btn-outline" onClick={closeForm}>Cancel</button>
          </div>
          <div className="card-body">
            {formError && <div className="auth-error" style={{ marginBottom: '16px' }}>{formError}</div>}
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group"><label className="form-label" htmlFor="t-name">Name *</label><input className="form-input" id="t-name" required value={formData.name} onChange={e => f('name', e.target.value)} placeholder="Full name" /></div>
                <div className="form-group"><label className="form-label" htmlFor="t-email">Email *</label><input className="form-input" id="t-email" type="email" required value={formData.email} onChange={e => f('email', e.target.value)} placeholder="Email" /></div>
                <div className="form-group"><label className="form-label" htmlFor="t-subject">Subject *</label><input className="form-input" id="t-subject" required value={formData.subject} onChange={e => f('subject', e.target.value)} placeholder="e.g. Mathematics" /></div>
                <div className="form-group"><label className="form-label" htmlFor="t-classes">Classes (comma-separated)</label><input className="form-input" id="t-classes" value={formData.classes} onChange={e => f('classes', e.target.value)} placeholder="e.g. 10-A, 10-B" /></div>
                <div className="form-group"><label className="form-label" htmlFor="t-qual">Qualification</label><input className="form-input" id="t-qual" value={formData.qualification} onChange={e => f('qualification', e.target.value)} placeholder="e.g. M.Sc, B.Ed" /></div>
                <div className="form-group"><label className="form-label" htmlFor="t-exp">Experience (years)</label><input className="form-input" id="t-exp" type="number" min="0" value={formData.experience} onChange={e => f('experience', e.target.value)} placeholder="Years" /></div>
                <div className="form-group"><label className="form-label" htmlFor="t-phone">Phone</label><input className="form-input" id="t-phone" value={formData.phone} onChange={e => f('phone', e.target.value)} placeholder="Phone" /></div>
                <div className="form-group"><label className="form-label" htmlFor="t-addr">Address</label><input className="form-input" id="t-addr" value={formData.address} onChange={e => f('address', e.target.value)} placeholder="Address" /></div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button className="btn btn-primary" type="submit" disabled={formLoading}>
                  {formLoading ? 'Saving...' : editingId ? 'Update Teacher' : 'Save Teacher'}
                </button>
                <button className="btn btn-outline" type="button" onClick={closeForm}>Discard</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="spinner-wrapper"><div className="spinner" /><span className="spinner-text">Loading teachers...</span></div>
      ) : (
        <div className="table-wrapper">
          <table className="table table-responsive">
            <thead><tr><th>Name</th><th>Subject</th><th>Classes</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {teachers.length === 0 ? (
                <tr><td colSpan="6"><div className="empty-state"><div className="empty-state-icon">👨‍🏫</div><div className="empty-state-title">No teachers found</div><p className="empty-state-text">Click "Add Teacher" to add faculty.</p></div></td></tr>
              ) : teachers.map(t => (
                <tr key={t._id}>
                  <td data-label="Name"><strong>{t.name}</strong></td>
                  <td data-label="Subject">{t.subject}</td>
                  <td data-label="Classes"><span className="badge badge-outline">{(t.classes || []).join(', ') || '-'}</span></td>
                  <td data-label="Phone">{t.phone || '-'}</td>
                  <td data-label="Status"><span className={`badge ${t.status === 'active' ? 'badge-accent' : 'badge-danger'}`}>{t.status}</span></td>
                  <td data-label="Actions">
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn btn-sm btn-ghost" aria-label={`View ${t.name}`} onClick={() => setViewTeacher(t)}>👁</button>
                      {isAdmin && <button className="btn btn-sm btn-ghost" aria-label={`Edit ${t.name}`} onClick={() => openEditForm(t)}><HiOutlinePencil /></button>}
                      {isAdmin && <button className="btn btn-sm btn-ghost" style={{ color: 'var(--color-danger)' }} aria-label={`Delete ${t.name}`} onClick={() => handleDelete(t._id, t.name)}><HiOutlineTrash /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View Detail Modal */}
      {viewTeacher && (
        <div className="modal-overlay" onClick={() => setViewTeacher(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <h3 className="card-header-title">Teacher Details</h3>
              <button className="btn btn-sm btn-outline" onClick={() => setViewTeacher(null)}><HiOutlineX /></button>
            </div>
            <div className="card-body">
              <div className="detail-grid">
                <div className="detail-item"><span className="detail-label">Name</span><span className="detail-value">{viewTeacher.name}</span></div>
                <div className="detail-item"><span className="detail-label">Email</span><span className="detail-value">{viewTeacher.email}</span></div>
                <div className="detail-item"><span className="detail-label">Subject</span><span className="detail-value">{viewTeacher.subject}</span></div>
                <div className="detail-item"><span className="detail-label">Classes</span><span className="detail-value">{(viewTeacher.classes || []).join(', ') || '-'}</span></div>
                <div className="detail-item"><span className="detail-label">Qualification</span><span className="detail-value">{viewTeacher.qualification || '-'}</span></div>
                <div className="detail-item"><span className="detail-label">Experience</span><span className="detail-value">{viewTeacher.experience ? `${viewTeacher.experience} years` : '-'}</span></div>
                <div className="detail-item"><span className="detail-label">Phone</span><span className="detail-value">{viewTeacher.phone || '-'}</span></div>
                <div className="detail-item"><span className="detail-label">Address</span><span className="detail-value">{viewTeacher.address || '-'}</span></div>
                <div className="detail-item"><span className="detail-label">Status</span><span className="detail-value"><span className={`badge ${viewTeacher.status === 'active' ? 'badge-accent' : 'badge-danger'}`}>{viewTeacher.status}</span></span></div>
                <div className="detail-item"><span className="detail-label">Joined</span><span className="detail-value">{new Date(viewTeacher.joiningDate).toLocaleDateString('en-IN')}</span></div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                {isAdmin && <button className="btn btn-primary" onClick={() => { setViewTeacher(null); openEditForm(viewTeacher); }}>Edit Teacher</button>}
                <button className="btn btn-outline" onClick={() => setViewTeacher(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
