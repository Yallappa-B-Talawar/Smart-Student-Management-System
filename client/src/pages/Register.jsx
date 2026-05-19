import { useState, useEffect } from 'react';
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { organizationsAPI } from '../services/api';
import '../components/ui/Components.css';
import './Auth.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'student',
    organizationId: '', organizationCode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [orgs, setOrgs] = useState([]);
  const [orgsLoading, setOrgsLoading] = useState(true);

  // Fetch active orgs live — updates every 15s so newly created orgs appear without reload
  const fetchOrgs = () => {
    organizationsAPI.getAll()
      .then(res => setOrgs(res.data.data || []))
      .catch(() => setOrgs([]))
      .finally(() => setOrgsLoading(false));
  };
  useEffect(() => {
    fetchOrgs();
    const interval = setInterval(fetchOrgs, 15000);
    return () => clearInterval(interval);
  }, []);

  const needsOrg = form.role === 'teacher' || form.role === 'student';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (needsOrg && !form.organizationId) {
      setError('Please select your school/organization');
      return;
    }
    if (needsOrg && form.organizationCode.trim().length !== 5) {
      setError('Organization code must be exactly 5 characters');
      return;
    }
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        organizationId: needsOrg ? form.organizationId : undefined,
        organizationCode: needsOrg ? form.organizationCode.trim().toUpperCase() : undefined,
      });
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors?.length) {
        setError(data.errors.map(e => e.message).join(' • '));
      } else {
        setError(data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedOrg = orgs.find(o => o._id === form.organizationId);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">S</div>
          <h1>SSMS</h1>
          <p>Smart Student Management System</p>
        </div>

        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Sign up to get started</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Full Name</label>
            <input
              className="form-input" id="reg-name" type="text"
              placeholder="Your full name" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email Address</label>
            <input
              className="form-input" id="reg-email" type="email"
              placeholder="you@example.com" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <div className="password-input-wrapper">
              <input
                className="form-input" id="reg-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 8 characters" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required minLength={8} autoComplete="new-password"
              />
              <button type="button" className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-role">Role</label>
            <select className="form-select" id="reg-role" value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value, organizationId: '', organizationCode: '' })}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Organization fields — only for teacher and student */}
          {needsOrg && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-org">
                  School / Organization <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <select
                  className="form-select" id="reg-org"
                  value={form.organizationId}
                  onChange={e => setForm({ ...form, organizationId: e.target.value })}
                  required={needsOrg}
                  disabled={orgsLoading}
                >
                  <option value="">
                    {orgsLoading ? 'Loading schools...' :
                     orgs.length === 0 ? 'No schools registered yet — contact your admin' :
                     '— Select your school —'}
                  </option>
                  {orgs.map(org => (
                    <option key={org._id} value={org._id}>{org.name}</option>
                  ))}
                </select>
                {selectedOrg?.description && (
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    {selectedOrg.description}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-code">
                  Organization Code <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  className="form-input" id="reg-code"
                  type="text"
                  placeholder="5-letter code from your admin (e.g. SCHOL)"
                  value={form.organizationCode}
                  onChange={e => setForm({ ...form, organizationCode: e.target.value.toUpperCase().slice(0, 5) })}
                  required={needsOrg}
                  maxLength={5}
                  style={{ letterSpacing: '4px', fontWeight: 700, textTransform: 'uppercase' }}
                />
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Ask your school admin for the 5-letter join code
                </div>
              </div>
            </>
          )}

          <button className="btn btn-accent btn-lg auth-submit" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
