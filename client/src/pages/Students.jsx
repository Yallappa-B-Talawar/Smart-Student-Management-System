import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
} from 'react-icons/hi';
import { studentsAPI, organizationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import '../components/ui/Components.css';

const emptyForm = { name: '', email: '', rollNo: '', class: '', phone: '', address: '', section: '', parentName: '', parentPhone: '', gender: '', organizationId: '', organizationCode: '' };

export default function Students() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canEdit = user?.role === 'admin' || user?.role === 'teacher';
  const location = useLocation();
  const [search, setSearch] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('q') || '';
  });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterOrg, setFilterOrg] = useState('');
  const [classes, setClasses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const { showToast } = useToast();
  const [viewStudent, setViewStudent] = useState(null);
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

  const fetchStudents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterClass) params.class = filterClass;
      if (filterPeriod !== 'all') params.period = filterPeriod;
      if (filterOrg) params.organization = filterOrg;
      const res = await studentsAPI.getAll(params);
      setStudents(res.data.data.students || []);
    } catch {
      setStudents([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [search, filterClass, filterPeriod, filterOrg]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // Auto-refresh every 30 seconds for live updates (silent & visibility-aware)
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchStudents(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchStudents]);

  const fetchStats = useCallback(() => {
    studentsAPI.getStats().then(res => {
      setClasses(res.data.data.classes || []);
    }).catch(() => {});
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);


  const openCreateForm = () => {
    setEditingId(null);
    setFormData({ ...emptyForm });
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (student) => {
    setEditingId(student._id);
    const orgId = student.organization?._id || student.organization || '';
    const matchedOrg = orgs.find(o => o._id === orgId);
    const orgCode = matchedOrg?.code || '';

    setFormData({
      name: student.name || '',
      email: student.email || '',
      rollNo: student.rollNo || '',
      class: student.class || '',
      phone: student.phone || '',
      address: student.address || '',
      section: student.section || '',
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
      gender: student.gender || '',
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
    
    if (isAdmin) {
      if (!formData.organizationId) {
        setFormError('Organization selection is required.');
        return;
      }
      if (formData.organizationCode.trim().length !== 5) {
        setFormError('Organization code must be exactly 5 characters.');
        return;
      }
    }

    setFormLoading(true);
    try {
      if (editingId) {
        await studentsAPI.update(editingId, formData);
        showToast('Student updated successfully');
      } else {
        await studentsAPI.create(formData);
        showToast('Student created successfully');
      }
      closeForm();
      fetchStudents();
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors?.length) {
        setFormError(data.errors.map(e => e.message).join(' • '));
      } else {
        setFormError(data?.message || 'Operation failed');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete student "${name}"? This cannot be undone.`)) return;
    try {
      await studentsAPI.delete(id);
      showToast('Student deleted');
      fetchStudents();
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  const f = (key, val) => setFormData(p => ({ ...p, [key]: val }));

  const orgOptions = Array.from(
    new Set([
      ...orgs.map(o => o.name),
      ...students.map(s => typeof s.organization === 'object' ? s.organization?.name : s.organization).filter(Boolean)
    ])
  ).sort();

  const classOptions = Array.from(
    new Set([
      ...classes,
      ...students.map(s => s.class).filter(Boolean)
    ])
  ).sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }));

  const displayStudents = students.filter(s => {
    if (!filterOrg) return true;
    const orgName = typeof s.organization === 'object' ? s.organization?.name || '' : (s.organization || '');
    const orgId = typeof s.organization === 'object' ? s.organization?._id || '' : (s.organization || '');
    return orgName === filterOrg || orgId === filterOrg;
  });

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">
            Students
            <span className="badge badge-outline" style={{ marginLeft: '10px', fontSize: '14px', verticalAlign: 'middle' }}>
              {displayStudents.length}
            </span>
          </h2>
          <p className="section-subtitle">
            {filterPeriod === 'today' ? 'Students added today' :
             filterPeriod === 'week'  ? 'Students added this week' :
             filterPeriod === 'month' ? 'Students added this month' :
             filterClass ? `Class ${filterClass} students` : 'All student records'}
          </p>
        </div>
        {canEdit && (
          <button className="btn btn-accent" onClick={openCreateForm}>
            <HiOutlinePlus /> Add Student
          </button>
        )}
      </div>

      {/* ── Create / Edit Form ── */}
      {showForm && (
        <div className="card section">
          <div className="card-header">
            <h3 className="card-header-title">{editingId ? 'Edit Student' : 'New Student'}</h3>
            <button className="btn btn-sm btn-outline" onClick={closeForm}>Cancel</button>
          </div>
          <div className="card-body">
            {formError && <div className="auth-error" style={{ marginBottom: '16px' }}>{formError}</div>}
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                {isAdmin && (
                  <>
                    <div className="form-group">
                      <label className="form-label" htmlFor="s-org">School / Organization *</label>
                      <select className="form-select" id="s-org" value={formData.organizationId} onChange={e => {
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
                      <label className="form-label" htmlFor="s-code">Organization Code *</label>
                      <input className="form-input" id="s-code" type="text" placeholder="e.g. SCHOL" value={formData.organizationCode} onChange={e => f('organizationCode', e.target.value.toUpperCase().slice(0, 5))} required maxLength={5} style={{ letterSpacing: '4px', fontWeight: 700, textTransform: 'uppercase' }} />
                    </div>
                  </>
                )}
                <div className="form-group">
                  <label className="form-label" htmlFor="s-name">Full Name *</label>
                  <input className="form-input" id="s-name" type="text" required value={formData.name} onChange={e => f('name', e.target.value)} placeholder="Student name" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="s-rollno">Roll Number *</label>
                  <input className="form-input" id="s-rollno" type="text" required value={formData.rollNo} onChange={e => f('rollNo', e.target.value)} placeholder="e.g. STU-001" disabled={!!editingId} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="s-email">Email *</label>
                  <input className="form-input" id="s-email" type="email" required value={formData.email} onChange={e => f('email', e.target.value)} placeholder="student@example.com" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="s-class">Class *</label>
                  <input className="form-input" id="s-class" type="text" required value={formData.class} onChange={e => f('class', e.target.value)} placeholder="e.g. 10-A" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="s-section">Section</label>
                  <input className="form-input" id="s-section" type="text" value={formData.section} onChange={e => f('section', e.target.value)} placeholder="e.g. A" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="s-gender">Gender</label>
                  <select className="form-select" id="s-gender" value={formData.gender} onChange={e => f('gender', e.target.value)}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="s-phone">Phone</label>
                  <input className="form-input" id="s-phone" type="tel" value={formData.phone} onChange={e => f('phone', e.target.value)} placeholder="Phone number" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="s-addr">Address</label>
                  <input className="form-input" id="s-addr" type="text" value={formData.address} onChange={e => f('address', e.target.value)} placeholder="Address" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="s-parent">Parent Name</label>
                  <input className="form-input" id="s-parent" type="text" value={formData.parentName} onChange={e => f('parentName', e.target.value)} placeholder="Parent name" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="s-parentph">Parent Phone</label>
                  <input className="form-input" id="s-parentph" type="tel" value={formData.parentPhone} onChange={e => f('parentPhone', e.target.value)} placeholder="Parent phone" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button className="btn btn-primary" type="submit" disabled={formLoading}>
                  {formLoading ? 'Saving...' : editingId ? 'Update Student' : 'Save Student'}
                </button>
                <button className="btn btn-outline" type="button" onClick={closeForm}>Discard</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Search + Filter ── */}
      <div className="section" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', maxWidth: '320px' }}>
          <HiOutlineSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input className="form-input" type="search" placeholder="Search by name or roll no..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} aria-label="Search students" />
        </div>

        {/* Organization Filter Dropdown */}
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

        {/* Class Filter Dropdown */}
        <select
          className="form-select"
          value={filterClass}
          onChange={e => setFilterClass(e.target.value)}
          style={{ width: 'auto', minWidth: '150px' }}
          aria-label="Filter by class"
        >
          <option value="">📚 All Classes</option>
          {classOptions.map(cls => (
            <option key={cls} value={cls}>Class {cls}</option>
          ))}
        </select>

        {/* Period Filter Dropdown */}
        <select
          className="form-select"
          value={filterPeriod}
          onChange={e => setFilterPeriod(e.target.value)}
          style={{ width: 'auto', minWidth: '140px' }}
          aria-label="Filter by time period"
        >
          <option value="all">📅 All Time</option>
          <option value="today">⚡ Today</option>
          <option value="week">🗓️ This Week</option>
          <option value="month">📆 This Month</option>
        </select>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="spinner-wrapper"><div className="spinner" /><span className="spinner-text">Loading students...</span></div>
      ) : (
        <div className="table-wrapper">
          <table className="table table-responsive">
            <thead>
              <tr><th>Roll No</th><th>Name</th><th>School</th><th>Class</th><th>Email</th><th>Phone</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {displayStudents.length === 0 ? (
                <tr><td colSpan="8">
                  <div className="empty-state">
                    <div className="empty-state-icon">👩‍🎓</div>
                    <div className="empty-state-title">No students found</div>
                    <p className="empty-state-text">{filterOrg ? `No student records found for "${filterOrg}".` : 'Click "Add Student" to create the first record.'}</p>
                  </div>
                </td></tr>
              ) : displayStudents.map(s => (
                <tr key={s._id}>
                  <td data-label="Roll No"><strong>{s.rollNo}</strong></td>
                  <td data-label="Name">{s.name}</td>
                  <td data-label="School">{s.organization?.name || '—'}</td>
                  <td data-label="Class"><span className="badge badge-outline">{s.class}</span></td>
                  <td data-label="Email">{s.email}</td>
                  <td data-label="Phone">{s.phone || '-'}</td>
                  <td data-label="Status"><span className={`badge ${s.status === 'active' ? 'badge-accent' : 'badge-danger'}`}>{s.status}</span></td>
                  <td data-label="Actions">
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn btn-sm btn-ghost" aria-label={`View ${s.name}`} onClick={() => setViewStudent(s)}>👁</button>
                      {canEdit && <button className="btn btn-sm btn-ghost" aria-label={`Edit ${s.name}`} onClick={() => openEditForm(s)}><HiOutlinePencil /></button>}
                      {isAdmin && <button className="btn btn-sm btn-ghost" style={{ color: 'var(--color-danger)' }} aria-label={`Delete ${s.name}`} onClick={() => handleDelete(s._id, s.name)}><HiOutlineTrash /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── View Detail Modal ── */}
      {viewStudent && (
        <div className="modal-overlay" onClick={() => setViewStudent(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <h3 className="card-header-title">Student Details</h3>
              <button className="btn btn-sm btn-outline" onClick={() => setViewStudent(null)}><HiOutlineX /></button>
            </div>
            <div className="card-body">
              <div className="detail-grid">
                <div className="detail-item"><span className="detail-label">Roll No</span><span className="detail-value">{viewStudent.rollNo}</span></div>
                <div className="detail-item"><span className="detail-label">Name</span><span className="detail-value">{viewStudent.name}</span></div>
                <div className="detail-item"><span className="detail-label">School</span><span className="detail-value">{viewStudent.organization?.name || '—'}</span></div>
                <div className="detail-item"><span className="detail-label">Email</span><span className="detail-value">{viewStudent.email}</span></div>
                <div className="detail-item"><span className="detail-label">Class</span><span className="detail-value">{viewStudent.class} {viewStudent.section && `- ${viewStudent.section}`}</span></div>
                <div className="detail-item"><span className="detail-label">Gender</span><span className="detail-value">{viewStudent.gender || '-'}</span></div>
                <div className="detail-item"><span className="detail-label">Phone</span><span className="detail-value">{viewStudent.phone || '-'}</span></div>
                <div className="detail-item"><span className="detail-label">Address</span><span className="detail-value">{viewStudent.address || '-'}</span></div>
                <div className="detail-item"><span className="detail-label">Parent Name</span><span className="detail-value">{viewStudent.parentName || '-'}</span></div>
                <div className="detail-item"><span className="detail-label">Parent Phone</span><span className="detail-value">{viewStudent.parentPhone || '-'}</span></div>
                <div className="detail-item"><span className="detail-label">Status</span><span className="detail-value"><span className={`badge ${viewStudent.status === 'active' ? 'badge-accent' : 'badge-danger'}`}>{viewStudent.status}</span></span></div>
                <div className="detail-item"><span className="detail-label">Admission Date</span><span className="detail-value">{new Date(viewStudent.admissionDate).toLocaleDateString('en-IN')}</span></div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                {canEdit && <button className="btn btn-primary" onClick={() => { setViewStudent(null); openEditForm(viewStudent); }}>Edit Student</button>}
                <button className="btn btn-outline" onClick={() => setViewStudent(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
