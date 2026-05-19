import { useState, useEffect, useCallback } from 'react';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineRefresh, HiOutlineOfficeBuilding } from 'react-icons/hi';
import { organizationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../components/ui/Components.css';

const emptyForm = { name: '', code: '', description: '', address: '', status: 'active' };

export default function Organizations() {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchOrgs = useCallback(async () => {
    try {
      const res = await organizationsAPI.getAll();
      setOrgs(res.data.data || []);
    } catch {
      setOrgs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrgs();
    const interval = setInterval(fetchOrgs, 30000);
    return () => clearInterval(interval);
  }, [fetchOrgs]);

  const openCreate = () => {
    setEditingId(null);
    setFormData({ ...emptyForm });
    setFormError('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEdit = (org) => {
    setEditingId(org._id);
    setFormData({
      name: org.name || '',
      code: org.code || '',
      description: org.description || '',
      address: org.address || '',
      status: org.status || 'active',
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

    // Validate code: exactly 5 alphanumeric uppercase chars
    const code = formData.code.trim().toUpperCase();
    if (!editingId && !/^[A-Z0-9]{5}$/.test(code)) {
      setFormError('Code must be exactly 5 uppercase letters or digits (e.g. SCHOL, AB12C)');
      return;
    }

    setFormLoading(true);
    try {
      if (editingId) {
        await organizationsAPI.update(editingId, {
          name: formData.name,
          description: formData.description,
          address: formData.address,
          status: formData.status,
        });
        showToast('Organization updated successfully');
      } else {
        await organizationsAPI.create({ ...formData, code });
        showToast('Organization created! Share the code with your teachers and students.');
      }
      closeForm();
      fetchOrgs();
    } catch (err) {
      const data = err.response?.data;
      setFormError(data?.message || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete organization "${name}"? This cannot be undone. All users linked to this org will lose their organization.`)) return;
    try {
      await organizationsAPI.delete(id);
      showToast('Organization deleted');
      fetchOrgs();
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  const f = (key, val) => setFormData(p => ({ ...p, [key]: val }));

  return (
    <div>
      {/* Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            Organizations
            <span className="badge badge-outline" style={{ marginLeft: '10px', fontSize: '14px', verticalAlign: 'middle' }}>
              {orgs.length}
            </span>
          </h2>
          <p className="section-subtitle">Manage schools and their join codes</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={fetchOrgs} title="Refresh">
            <HiOutlineRefresh />
          </button>
          <button className="btn btn-accent" onClick={openCreate}>
            <HiOutlinePlus /> New Organization
          </button>
        </div>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="card section">
          <div className="card-header">
            <h3 className="card-header-title">
              {editingId ? 'Edit Organization' : 'New Organization'}
            </h3>
            <button className="btn btn-sm btn-outline" onClick={closeForm}>Cancel</button>
          </div>
          <div className="card-body">
            {formError && <div className="auth-error" style={{ marginBottom: '16px' }}>{formError}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Organization Name *</label>
                  <input className="form-input" value={formData.name}
                    onChange={e => f('name', e.target.value)}
                    placeholder="e.g. Springfield High School" required />
                </div>

                {/* Code — only settable at create time, immutable after */}
                {!editingId && (
                  <div className="form-group">
                    <label className="form-label">
                      Join Code * <span style={{ color: 'var(--color-text-muted)', fontSize: '12px', fontWeight: 400 }}>
                        (5 chars, e.g. SCHOL — cannot be changed later)
                      </span>
                    </label>
                    <input
                      className="form-input"
                      value={formData.code}
                      onChange={e => f('code', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))}
                      placeholder="ABCDE"
                      required
                      maxLength={5}
                      style={{ letterSpacing: '6px', fontWeight: 800, fontSize: '20px', textAlign: 'center', textTransform: 'uppercase' }}
                    />
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                      Share this code with your teachers and students during registration.
                    </div>
                  </div>
                )}

                {editingId && (
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={formData.status} onChange={e => f('status', e.target.value)}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Description</label>
                  <input className="form-input" value={formData.description}
                    onChange={e => f('description', e.target.value)}
                    placeholder="Short description of the school (optional)" />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Address</label>
                  <input className="form-input" value={formData.address}
                    onChange={e => f('address', e.target.value)}
                    placeholder="School address (optional)" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button className="btn btn-accent" type="submit" disabled={formLoading}>
                  {formLoading ? 'Saving...' : editingId ? 'Update Organization' : 'Create Organization'}
                </button>
                <button className="btn btn-outline" type="button" onClick={closeForm}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Organizations Grid */}
      {loading ? (
        <div className="spinner-wrapper"><div className="spinner" /><span className="spinner-text">Loading organizations...</span></div>
      ) : orgs.length === 0 ? (
        <div className="card section">
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-state-icon">🏫</div>
              <div className="empty-state-title">No organizations yet</div>
              <p className="empty-state-text">
                Create your first school organization. Teachers and students will use the join code to register under it.
              </p>
              <button className="btn btn-accent" onClick={openCreate} style={{ marginTop: '16px' }}>
                <HiOutlinePlus /> Create First Organization
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {orgs.map(org => (
            <div className="card" key={org._id}>
              <div className="card-body">
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px', height: '48px', flexShrink: 0,
                    background: 'var(--color-primary)', color: 'var(--color-text-on-primary)',
                    border: '3px solid var(--border-color)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '22px',
                  }}>
                    <HiOutlineOfficeBuilding />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 'var(--font-size-base)', wordBreak: 'break-word' }}>{org.name}</div>
                    {org.description && (
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>{org.description}</div>
                    )}
                  </div>
                  <span className={`badge ${org.status === 'active' ? 'badge-accent' : 'badge-danger'}`} style={{ flexShrink: 0 }}>
                    {org.status}
                  </span>
                </div>

                {/* Join code — prominently displayed */}
                <div style={{
                  background: 'var(--color-surface)', border: '3px solid var(--border-color)',
                  padding: '12px 16px', marginBottom: '16px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Join Code — Share with users
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '8px', color: 'var(--color-accent)', fontFamily: 'monospace' }}>
                    {org.code || '—'}
                  </div>
                </div>

                {org.address && (
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                    📍 {org.address}
                  </div>
                )}

                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                  Created {new Date(org.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-sm btn-outline" onClick={() => openEdit(org)} style={{ flex: 1 }}>
                    <HiOutlinePencil /> Edit
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(org._id, org.name)}>
                    <HiOutlineTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
