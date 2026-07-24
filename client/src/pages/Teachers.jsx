import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX, HiOutlineRefresh, HiOutlineSearch } from 'react-icons/hi';
import { teachersAPI, organizationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import '../components/ui/Components.css';

const emptyForm = { name: '', email: '', subject: '', classes: '', phone: '', qualification: '', experience: '', address: '', organizationId: '', organizationCode: '' };

export default function Teachers() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isReadOnly = user?.role === 'student' || user?.role === 'teacher';

  const location = useLocation();
  const [search, setSearch] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('q') || '';
  });
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOrg, setFilterOrg] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0, onLeave: 0 });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const { showToast } = useToast();
  const [viewTeacher, setViewTeacher] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [orgsLoading, setOrgsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    setSearch(q);
  }, [location.search]);

  useEffect(() => {
    if (location.state?.openAdd) {
      openCreateForm();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    organizationsAPI.getAll()
      .then(res => setOrgs(res.data.data || []))
      .catch(() => setOrgs([]))
      .finally(() => setOrgsLoading(false));
  }, []);

  const fetchTeachers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterOrg) params.organization = filterOrg;
      const res = await teachersAPI.getAll(params);
      setTeachers(res.data.data.teachers || []);
    } catch { setTeachers([]); }
    finally { if (!silent) setLoading(false); }
  }, [search, filterOrg]);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

  // Auto-refresh every 30 seconds for live updates (silent & visibility-aware)
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchTeachers(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchTeachers]);

  useEffect(() => {
    teachersAPI.getStats().then(res => setStats(res.data.data)).catch(() => {});
  }, []);


  const openCreateForm = () => {
    setEditingId(null);
    setFormData({ ...emptyForm });
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (teacher) => {
    setEditingId(teacher._id);
    const orgId = teacher.organization?._id || teacher.organization || '';
    const matchedOrg = orgs.find(o => o._id === orgId);
    const orgCode = matchedOrg?.code || '';

    setFormData({
      name: teacher.name || '',
      email: teacher.email || '',
      subject: teacher.subject || '',
      classes: (teacher.classes || []).join(', '),
      phone: teacher.phone || '',
      qualification: teacher.qualification || '',
      experience: teacher.experience || '',
      address: teacher.address || '',
      organizationId: orgId,
      organizationCode: orgCode,
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
    
    if (!formData.organizationId) {
      setFormError('Organization selection is required.');
      return;
    }
    if (formData.organizationCode.trim().length !== 5) {
      setFormError('Organization code must be exactly 5 characters.');
      return;
    }

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

  const orgOptions = Array.from(
    new Set([
      ...orgs.map(o => o.name),
      ...teachers.map(t => typeof t.organization === 'object' ? t.organization?.name : t.organization).filter(Boolean)
    ])
  ).sort();

  const displayTeachers = teachers.filter(t => {
    if (!filterOrg) return true;
    const orgName = typeof t.organization === 'object' ? t.organization?.name || '' : (t.organization || '');
    const orgId = typeof t.organization === 'object' ? t.organization?._id || '' : (t.organization || '');
    return orgName === filterOrg || orgId === filterOrg;
  });

  // READ-ONLY VIEW (Students & Teachers) — teacher directory (card layout)
  // ──────────────────────────────────────────────────────────────────
  if (isReadOnly) {
    return (
      <div>
        <div className="section-header">
          <div>
            <h2 className="section-title">
              Teachers Directory
              <span className="badge badge-outline" style={{ marginLeft: '10px', fontSize: '14px', verticalAlign: 'middle' }}>
                {displayTeachers.length}
              </span>
            </h2>
            <p className="section-subtitle">Browse your school's faculty</p>
          </div>
          <button className="btn btn-outline" onClick={fetchTeachers} title="Refresh">
            <HiOutlineRefresh />
          </button>
        </div>

        {/* Stats */}
        <div className="grid-stats cols-3 section">
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

        {/* Search Bar + Org Filter */}
        <div className="section" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1', maxWidth: '320px' }}>
            <HiOutlineSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input className="form-input" type="search" placeholder="Search by name, email or subject..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} aria-label="Search teachers" />
          </div>

          <select
            className="form-select"
            value={filterOrg}
            onChange={e => setFilterOrg(e.target.value)}
            style={{ width: 'auto', minWidth: '180px' }}
            aria-label="Filter by organization"
          >
            <option value="">🏫 All Organizations</option>
            {orgOptions.map(orgName => (
              <option key={orgName} value={orgName}>{orgName}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="spinner-wrapper"><div className="spinner" /><span className="spinner-text">Loading teachers...</span></div>
        ) : displayTeachers.length === 0 ? (
          <div className="card section">
            <div className="card-body">
              <div className="empty-state">
                <div className="empty-state-icon">👨‍🏫</div>
                <div className="empty-state-title">No teachers found</div>
                <p className="empty-state-text">{filterOrg ? `No teacher records found for "${filterOrg}".` : 'Teachers will appear here once they are added by your admin.'}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid-cards section">
            {displayTeachers.map(t => (
              <div className="card" key={t._id} onClick={() => setViewTeacher(t)}>
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                    <div style={{
                      width: '40px', height: '40px', flexShrink: 0,
                      background: 'rgba(79, 70, 229, 0.1)', color: 'var(--color-primary)',
                      border: '1px solid rgba(79, 70, 229, 0.2)',
                      borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '18px',
                    }}>
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 'var(--font-size-base)' }}>{t.name}</div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px', alignItems: 'center' }}>
                        {t.subject && <span className="badge badge-primary" style={{ fontSize: '11px' }}>{t.subject}</span>}
                        {t.organization?.name && <span className="badge badge-outline" style={{ fontSize: '11px', textTransform: 'none', fontWeight: 600 }}>🏫 {t.organization.name}</span>}
                      </div>
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
                  <div className="detail-item"><span className="detail-label">School</span><span className="detail-value">{viewTeacher.organization?.name || '—'}</span></div>
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
              {displayTeachers.length}
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
      <div className="grid-stats cols-3 section">
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
                {isAdmin && (
                  <>
                    <div className="form-group">
                      <label className="form-label" htmlFor="t-org">School / Organization *</label>
                      <select className="form-select" id="t-org" value={formData.organizationId} onChange={e => {
                        const orgId = e.target.value;
                        const matchedOrg = orgs.find(o => o._id === orgId);
                        setFormData(p => ({
                          ...p,
                          organizationId: orgId,
                          organizationCode: matchedOrg?.code || ''
                        }));
                      }} required>
                        <option value="">{orgsLoading ? 'Loading schools...' : '— Select school —'}</option>
                        {orgs.map(org => (
                          <option key={org._id} value={org._id}>{org.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="t-code">Organization Code *</label>
                      <input className="form-input" id="t-code" type="text" placeholder="e.g. SCHOL" value={formData.organizationCode} onChange={e => f('organizationCode', e.target.value.toUpperCase().slice(0, 5))} required maxLength={5} style={{ letterSpacing: '4px', fontWeight: 700, textTransform: 'uppercase' }} />
                    </div>
                  </>
                )}
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

      {/* Search Bar + Org Filter */}
      <div className="section" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', maxWidth: '320px' }}>
          <HiOutlineSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input className="form-input" type="search" placeholder="Search by name, email or subject..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} aria-label="Search teachers" />
        </div>

        <select
          className="form-select"
          value={filterOrg}
          onChange={e => setFilterOrg(e.target.value)}
          style={{ width: 'auto', minWidth: '180px' }}
          aria-label="Filter by organization"
        >
          <option value="">🏫 All Organizations</option>
          {orgOptions.map(orgName => (
            <option key={orgName} value={orgName}>{orgName}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="spinner-wrapper"><div className="spinner" /><span className="spinner-text">Loading teachers...</span></div>
      ) : (
        <div className="table-wrapper">
          <table className="table table-responsive">
            <thead><tr><th>Name</th><th>School</th><th>Subject</th><th>Classes</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {displayTeachers.length === 0 ? (
                <tr><td colSpan="7"><div className="empty-state"><div className="empty-state-icon">👨‍🏫</div><div className="empty-state-title">No teachers found</div><p className="empty-state-text">{filterOrg ? `No teacher records found for "${filterOrg}".` : 'Click "Add Teacher" to add faculty.'}</p></div></td></tr>
              ) : displayTeachers.map(t => (
                <tr key={t._id}>
                  <td data-label="Name"><strong>{t.name}</strong></td>
                  <td data-label="School">{t.organization?.name || '—'}</td>
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
                <div className="detail-item"><span className="detail-label">School</span><span className="detail-value">{viewTeacher.organization?.name || '—'}</span></div>
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
    </div>
  );
}
