import { useState, useEffect } from 'react';
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { organizationsAPI } from '../services/api';
import '../components/ui/Components.css';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', organizationId: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [orgs, setOrgs] = useState([]);
  const [orgsLoading, setOrgsLoading] = useState(true);

  // Fetch all active organizations for the dropdown
  useEffect(() => {
    organizationsAPI.getAll()
      .then(res => setOrgs(res.data.data || []))
      .catch(() => setOrgs([]))
      .finally(() => setOrgsLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password, form.organizationId || undefined);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">S</div>
          <h1>SSMS</h1>
          <p>Smart Student Management System</p>
        </div>

        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Sign in to your account</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Organization selector */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-org">
              School / Organization
              <span style={{ color: 'var(--color-text-muted)', fontWeight: 400, marginLeft: '6px' }}>(optional for admins)</span>
            </label>
            <select
              className="form-select"
              id="login-org"
              value={form.organizationId}
              onChange={e => setForm({ ...form, organizationId: e.target.value })}
              disabled={orgsLoading}
            >
              <option value="">
                {orgsLoading ? 'Loading schools...' : orgs.length === 0 ? 'No schools registered yet' : '— Select your school —'}
              </option>
              {orgs.map(org => (
                <option key={org._id} value={org._id}>{org.name}</option>
              ))}
            </select>
            {form.organizationId && (
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                ✅ {orgs.find(o => o._id === form.organizationId)?.name}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <input
              className="form-input"
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div className="password-input-wrapper">
              <input
                className="form-input"
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
              </button>
            </div>
          </div>

          <button className="btn btn-primary btn-lg auth-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
