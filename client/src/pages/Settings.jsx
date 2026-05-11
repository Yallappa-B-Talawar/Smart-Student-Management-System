import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import '../components/ui/Components.css';
import './Auth.css';

export default function Settings() {
  const { user } = useAuth();
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setSuccess('Password updated successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors?.length) {
        setError(data.errors.map(e => e.message).join(' • '));
      } else {
        setError(data?.message || 'Failed to change password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Settings</h2>
          <p className="section-subtitle">Manage your profile and preferences</p>
        </div>
      </div>

      {/* ── Profile Card ── */}
      <div className="card section">
        <div className="card-header">
          <h3 className="card-header-title">Profile Information</h3>
        </div>
        <div className="card-body">
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Name</span>
              <span className="detail-value">{user?.name || '-'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Email</span>
              <span className="detail-value">{user?.email || '-'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Role</span>
              <span className="detail-value">
                <span className="badge badge-primary">{user?.role || '-'}</span>
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Account Status</span>
              <span className="detail-value">
                <span className="badge badge-accent">{user?.isActive ? 'Active' : 'Inactive'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Change Password ── */}
      <div className="card section">
        <div className="card-header">
          <h3 className="card-header-title">Change Password</h3>
        </div>
        <div className="card-body">
          {error && <div className="auth-error" style={{ marginBottom: '16px' }}>{error}</div>}
          {success && <div style={{ background: 'var(--color-accent)', color: '#000', padding: '12px 16px', border: 'var(--border-width) solid var(--border-color)', fontWeight: 700, fontSize: '14px', marginBottom: '16px' }}>{success}</div>}

          <form onSubmit={handleChangePassword}>
            <div style={{ maxWidth: '440px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="current-pw">Current Password</label>
                <div className="password-input-wrapper">
                  <input
                    className="form-input"
                    id="current-pw"
                    type={showCurrent ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                    placeholder="Enter current password"
                  />
                  <button type="button" className="password-toggle-btn" onClick={() => setShowCurrent(!showCurrent)} aria-label="Toggle visibility">
                    {showCurrent ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="new-pw">New Password</label>
                <div className="password-input-wrapper">
                  <input
                    className="form-input"
                    id="new-pw"
                    type={showNew ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    minLength={8}
                    placeholder="Min 8 characters, uppercase + number"
                  />
                  <button type="button" className="password-toggle-btn" onClick={() => setShowNew(!showNew)} aria-label="Toggle visibility">
                    {showNew ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="confirm-pw">Confirm New Password</label>
                <input
                  className="form-input"
                  id="confirm-pw"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                  placeholder="Re-enter new password"
                />
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
