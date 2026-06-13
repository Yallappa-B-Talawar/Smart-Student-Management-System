import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineClipboardCheck,
  HiOutlineChartBar,
  HiOutlineCalendar,
  HiOutlinePlus,
  HiOutlineCog,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlinePencil,
  HiOutlineSave,
  HiOutlineOfficeBuilding,
  HiOutlineRefresh,
  HiOutlineClock,
} from 'react-icons/hi';
import { studentsAPI, teachersAPI, attendanceAPI, organizationsAPI } from '../services/api';
import OrganizationDetailModal from '../components/ui/OrganizationDetailModal';
import { useAuth } from '../context/AuthContext';
import '../components/ui/Components.css';
import './Dashboard.css';

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, iconVariant, label, value, loading }) {
  return (
    <div className="stat-card">
      <div className={`stat-card-icon ${iconVariant}`}><Icon /></div>
      <div className="stat-card-info">
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value">{loading ? '...' : value}</div>
      </div>
    </div>
  );
}

function LiveIndicator() {
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Teacher expandable card list (used in Student dashboard)
// ─────────────────────────────────────────────────────────────────────────────
function TeacherCardList({ teachers }) {
  const [expandedIdx, setExpandedIdx] = useState(null);
  const toggle = (i) => setExpandedIdx(prev => prev === i ? null : i);

  if (!teachers.length) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="empty-state">
            <div className="empty-state-icon">👨‍🏫</div>
            <div className="empty-state-title">No teachers assigned yet</div>
            <p className="empty-state-text">Once a teacher adds your class, they'll appear here.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {teachers.map((t, i) => {
        const isOpen = expandedIdx === i;
        return (
          <div key={i} className="card" style={{ overflow: 'hidden', cursor: 'pointer' }}>
            <div onClick={() => toggle(i)} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', userSelect: 'none' }}>
              <div style={{
                width: '42px', height: '42px', flexShrink: 0, background: 'var(--color-primary)',
                color: 'var(--color-text-on-primary)', border: '2px solid var(--border-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '18px',
              }}>
                {t.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 'var(--font-size-base)' }}>{t.name}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                  {isOpen ? 'Click to collapse' : 'Click to view details'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                {t.subject && t.subject !== 'Not set' && (
                  <span className="badge badge-primary" style={{ fontSize: '12px' }}>{t.subject}</span>
                )}
                <span style={{
                  fontSize: '18px', color: 'var(--color-text-muted)',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s', display: 'inline-block', lineHeight: 1,
                }}>▾</span>
              </div>
            </div>
            {isOpen && (
              <div style={{ borderTop: '2px solid var(--border-color)', padding: '16px 18px', background: 'var(--color-surface)' }}>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Subject</span>
                    <span className="detail-value"><span className="badge badge-primary">{t.subject || '—'}</span></span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email</span>
                    <span className="detail-value" style={{ fontSize: 'var(--font-size-xs)', wordBreak: 'break-all' }}>{t.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Phone</span>
                    <span className="detail-value">{t.phone && t.phone !== 'N/A' ? t.phone : '—'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Qualification</span>
                    <span className="detail-value">{t.qualification && t.qualification !== 'N/A' ? t.qualification : '—'}</span>
                  </div>
                  {t.classes?.length > 0 && (
                    <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                      <span className="detail-label">Classes Taught</span>
                      <span className="detail-value" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {t.classes.map((cls, j) => <span key={j} className="badge badge-outline">{cls}</span>)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Teacher profile section (My Classes + My Info) — Teacher dashboard only
// ─────────────────────────────────────────────────────────────────────────────
function TeacherProfileSection() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [newClass, setNewClass] = useState('');
  const [form, setForm] = useState({ subject: '', phone: '', qualification: '', experience: '' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProfile = useCallback(async () => {
    try {
      const res = await teachersAPI.myProfile();
      const t = res.data.data;
      setProfile(t);
      setForm({ subject: t.subject || '', phone: t.phone || '', qualification: t.qualification || '', experience: t.experience || '' });
    } catch { setProfile(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchProfile();
    const interval = setInterval(fetchProfile, 30000);
    return () => clearInterval(interval);
  }, [fetchProfile]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await teachersAPI.updateMyProfile({ ...form, classes: profile?.classes || [] });
      await fetchProfile();
      setEditing(false);
      showToast('Profile updated!');
    } catch { showToast('Failed to save profile', 'error'); }
    finally { setSaving(false); }
  };

  const addClass = async () => {
    const cls = newClass.trim();
    if (!cls) return;
    const current = profile?.classes || [];
    if (current.map(c => c.toLowerCase()).includes(cls.toLowerCase())) {
      showToast('Class already added', 'error'); return;
    }
    try {
      await teachersAPI.updateMyProfile({ classes: [...current, cls] });
      await fetchProfile();
      setNewClass('');
      showToast(`Class "${cls}" added!`);
    } catch { showToast('Failed to add class', 'error'); }
  };

  const removeClass = async (cls) => {
    try {
      await teachersAPI.updateMyProfile({ classes: (profile?.classes || []).filter(c => c !== cls) });
      await fetchProfile();
      showToast(`Class "${cls}" removed`);
    } catch { showToast('Failed to remove class', 'error'); }
  };

  if (loading) return <div className="spinner-wrapper"><div className="spinner" /><span className="spinner-text">Loading profile...</span></div>;

  return (
    <div className="section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', margin: 0 }}>My Profile</h3>
        <LiveIndicator />
      </div>
      <div className="grid-2">
        {/* My Classes */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-header-title">My Classes</h3>
            <span className="badge badge-primary">{profile?.classes?.length || 0} classes</span>
          </div>
          <div className="card-body">
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              Students in these classes will see you on their dashboard.
            </p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input className="form-input" style={{ flex: 1, marginBottom: 0 }}
                placeholder="Add class (e.g. 10-A)" value={newClass}
                onChange={e => setNewClass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addClass()} />
              <button className="btn btn-accent" onClick={addClass} style={{ flexShrink: 0 }}>
                <HiOutlinePlus /> Add
              </button>
            </div>
            {profile?.classes?.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {profile.classes.map((cls, i) => (
                  <span key={i} className="badge badge-outline"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '14px' }}>
                    {cls}
                    <button onClick={() => removeClass(cls)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 0, display: 'flex', lineHeight: 1 }}>
                      <HiOutlineX style={{ fontSize: '14px' }} />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '16px 0' }}>
                <div className="empty-state-icon" style={{ fontSize: '28px' }}>📚</div>
                <div className="empty-state-title" style={{ fontSize: '14px' }}>No classes yet</div>
                <p className="empty-state-text" style={{ fontSize: '12px' }}>Add your classes above.</p>
              </div>
            )}
          </div>
        </div>

        {/* My Info */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-header-title">My Info</h3>
            {!editing ? (
              <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}><HiOutlinePencil /> Edit</button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-accent btn-sm" onClick={saveProfile} disabled={saving}>
                  <HiOutlineSave /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            )}
          </div>
          <div className="card-body">
            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Subject', key: 'subject', placeholder: 'e.g. Mathematics' },
                  { label: 'Phone', key: 'phone', placeholder: 'Your phone number' },
                  { label: 'Qualification', key: 'qualification', placeholder: 'e.g. M.Sc, B.Ed' },
                  { label: 'Experience (years)', key: 'experience', placeholder: 'Years of experience', type: 'number' },
                ].map(field => (
                  <div key={field.key} className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">{field.label}</label>
                    <input className="form-input" type={field.type || 'text'}
                      value={form[field.key]}
                      onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={field.placeholder} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Subject</span>
                  <span className="detail-value">
                    {profile?.subject && profile.subject !== 'Not set'
                      ? <span className="badge badge-primary">{profile.subject}</span>
                      : <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Not set — click Edit</span>}
                  </span>
                </div>
                <div className="detail-item"><span className="detail-label">Phone</span><span className="detail-value">{profile?.phone || '—'}</span></div>
                <div className="detail-item"><span className="detail-label">Qualification</span><span className="detail-value">{profile?.qualification || '—'}</span></div>
                <div className="detail-item"><span className="detail-label">Experience</span><span className="detail-value">{profile?.experience ? `${profile.experience} yrs` : '—'}</span></div>
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span className="detail-value">
                    <span className={`badge ${profile?.status === 'active' ? 'badge-accent' : 'badge-danger'}`}>{profile?.status || 'active'}</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard — renders correct view per role
// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role;

  // ── Shared state ──
  const [loading, setLoading] = useState(true);

  // Admin/Teacher stats
  const [stats, setStats] = useState({ students: 0, attendance: 0, teachers: 0, classes: [] });

  // Student-specific state
  const [studentProfile, setStudentProfile] = useState(null);
  const [myTeachers, setMyTeachers] = useState([]);
  const [myAttendance, setMyAttendance] = useState({ present: 0, absent: 0, late: 0, total: 0, rate: 0 });

  // Admin org info
  const [orgInfo, setOrgInfo] = useState(null);
  const [orgStats, setOrgStats] = useState({ total: 0, active: 0 });
  const [orgsList, setOrgsList] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const fetchData = useCallback(async () => {
    try {
      if (role === 'student') {
        const [profileRes, attRes] = await Promise.all([
          studentsAPI.myProfile(),
          attendanceAPI.myAttendance(),
        ]);
        setStudentProfile(profileRes.data.data.student);
        setMyTeachers(profileRes.data.data.teachers || []);
        setMyAttendance(attRes.data.data.stats || { present: 0, absent: 0, late: 0, total: 0, rate: 0 });

      } else if (role === 'teacher') {
        const [studentRes] = await Promise.all([
          studentsAPI.getStats(),
        ]);
        let attendanceRate = 0;
        try {
          const attRes = await attendanceAPI.getStats(null, new Date().toISOString());
          attendanceRate = attRes.data.data.rate || 0;
        } catch {}
        setStats({
          students: studentRes.data.data.total || 0,
          attendance: attendanceRate,
          teachers: 0,
          classes: studentRes.data.data.classes || [],
        });

      } else if (role === 'admin') {
        const [studentRes, teacherRes] = await Promise.all([
          studentsAPI.getStats(),
          teachersAPI.getStats(),
        ]);
        let attendanceRate = 0;
        try {
          const attRes = await attendanceAPI.getStats(null, new Date().toISOString());
          attendanceRate = attRes.data.data.rate || 0;
        } catch {}
        setStats({
          students: studentRes.data.data.total || 0,
          attendance: attendanceRate,
          teachers: teacherRes.data.data.total || 0,
          classes: studentRes.data.data.classes || [],
        });
        // Fetch org stats for admin
        try {
          const orgStatsRes = await organizationsAPI.getStats();
          setOrgStats(orgStatsRes.data.data);
          const orgListRes = await organizationsAPI.getAll();
          setOrgsList(orgListRes.data.data || []);
        } catch {}
      }
    } catch {}
    finally { setLoading(false); }
  }, [role]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ────────────────────────────────────────────────────────────
  // ── STUDENT DASHBOARD
  // ────────────────────────────────────────────────────────────
  if (role === 'student') {
    return (
      <div className="dashboard">
        {/* Welcome Banner */}
        <div className="welcome-banner section">
          <div className="welcome-text">
            <h2>Welcome, {user?.name || 'Student'}! 👋</h2>
            <p>{studentProfile
              ? `Class ${studentProfile.class}${studentProfile.section ? ` — Section ${studentProfile.section}` : ''}`
              : 'Your academic profile is being set up by your teacher.'}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <div className="welcome-date"><HiOutlineCalendar /><span>{today}</span></div>
            <LiveIndicator />
          </div>
        </div>

        {/* ── Attendance Stats Row ── */}
        <div className="section">
          <h3 className="section-group-title">My Attendance Overview</h3>
          <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <StatCard icon={HiOutlineCheck} iconVariant="accent" label="Present" value={myAttendance.present} loading={loading} />
            <StatCard icon={HiOutlineX} iconVariant="danger" label="Absent" value={myAttendance.absent} loading={loading} />
            <StatCard icon={HiOutlineClock} iconVariant="primary" label="Late" value={myAttendance.late} loading={loading} />
            <StatCard icon={HiOutlineChartBar} iconVariant="teal" label="Attendance %" value={`${myAttendance.rate}%`} loading={loading} />
          </div>
          {myAttendance.total > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
              <div className="progress-bar-wrapper" style={{ flex: 1 }}>
                <div className="progress-bar-fill" style={{ width: `${myAttendance.rate}%` }} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                {myAttendance.present}/{myAttendance.total} days present
              </span>
            </div>
          )}
        </div>

        {/* ── My Teachers ── */}
        <div className="section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', margin: 0 }}>
              My Teachers
              {myTeachers.length > 0 && (
                <span className="badge badge-outline" style={{ marginLeft: '10px', fontSize: '13px', verticalAlign: 'middle' }}>
                  {myTeachers.length}
                </span>
              )}
            </h3>
            <LiveIndicator />
          </div>
          <TeacherCardList teachers={myTeachers} />
        </div>

        {/* ── My Profile + Quick Links ── */}
        <div className="grid-2 section">
          {/* My Academic Profile */}
          <div className="card">
            <div className="card-header"><h3 className="card-header-title">My Academic Profile</h3></div>
            <div className="card-body">
              {studentProfile ? (
                <div className="detail-grid">
                  <div className="detail-item"><span className="detail-label">Roll No</span><span className="detail-value"><strong>{studentProfile.rollNo}</strong></span></div>
                  <div className="detail-item">
                    <span className="detail-label">Class</span>
                    <span className="detail-value">
                      <span className="badge badge-outline">{studentProfile.class}{studentProfile.section ? ` - ${studentProfile.section}` : ''}</span>
                    </span>
                  </div>
                  <div className="detail-item"><span className="detail-label">School</span><span className="detail-value"><strong>{studentProfile.organization?.name || '—'}</strong></span></div>
                  <div className="detail-item"><span className="detail-label">Email</span><span className="detail-value" style={{ fontSize: 'var(--font-size-xs)' }}>{studentProfile.email}</span></div>
                  <div className="detail-item"><span className="detail-label">Phone</span><span className="detail-value">{studentProfile.phone || '—'}</span></div>
                  <div className="detail-item"><span className="detail-label">Parent</span><span className="detail-value">{studentProfile.parentName || '—'}</span></div>
                  <div className="detail-item">
                    <span className="detail-label">Status</span>
                    <span className="detail-value">
                      <span className={`badge ${studentProfile.status === 'active' ? 'badge-accent' : 'badge-danger'}`}>{studentProfile.status}</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <div className="empty-state-title">Profile not created yet</div>
                  <p className="empty-state-text">Your teacher or admin will add your academic details here.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="card">
            <div className="card-header"><h3 className="card-header-title">Quick Links</h3></div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Link to="/my-attendance" className="btn btn-accent" style={{ justifyContent: 'flex-start' }}>
                  <HiOutlineClipboardCheck /> View Full Attendance
                </Link>
                <Link to="/teachers" className="btn btn-primary" style={{ justifyContent: 'flex-start' }}>
                  <HiOutlineAcademicCap /> View Teachers Directory
                </Link>
                <Link to="/settings" className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>
                  <HiOutlineCog /> Settings &amp; Password
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────
  // ── TEACHER DASHBOARD
  // ────────────────────────────────────────────────────────────
  if (role === 'teacher') {
    return (
      <div className="dashboard">
        {/* Welcome Banner */}
        <div className="welcome-banner section">
          <div className="welcome-text">
            <h2>Welcome back, {user?.name || 'Teacher'}! 👋</h2>
            <p>Manage your classes, track attendance, and update your profile.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <div className="welcome-date"><HiOutlineCalendar /><span>{today}</span></div>
            <LiveIndicator />
          </div>
        </div>

        {/* ── Overview Stats ── */}
        <div className="section">
          <h3 className="section-group-title">Overview</h3>
          <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <StatCard icon={HiOutlineUserGroup} iconVariant="primary" label="Total Students" value={stats.students} loading={loading} />
            <StatCard icon={HiOutlineClipboardCheck} iconVariant="accent" label="Today's Attendance %" value={`${stats.attendance}%`} loading={loading} />
            <StatCard icon={HiOutlineAcademicCap} iconVariant="teal" label="Active Classes" value={stats.classes.length} loading={loading} />
          </div>
        </div>

        {/* ── My Profile (My Classes + My Info) ── */}
        <TeacherProfileSection />

        {/* ── Quick Actions ── */}
        <div className="section">
          <h3 className="section-group-title">Quick Actions</h3>
          <div className="card">
            <div className="card-body">
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link to="/students" className="btn btn-accent"><HiOutlineUserGroup /> My Students</Link>
                <Link to="/attendance" className="btn btn-primary"><HiOutlineClipboardCheck /> Mark Attendance</Link>
                <Link to="/settings" className="btn btn-outline"><HiOutlineCog /> Settings</Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Class List ── */}
        {stats.classes.length > 0 && (
          <div className="section">
            <h3 className="section-group-title">All Classes in System</h3>
            <div className="card">
              <div className="card-body">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {stats.classes.map((cls, i) => (
                    <span key={i} className="badge badge-outline" style={{ fontSize: '14px', padding: '8px 14px' }}>{cls}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────
  // ── ADMIN DASHBOARD
  // ────────────────────────────────────────────────────────────
  return (
    <div className="dashboard">
      {/* Welcome Banner */}
      <div className="welcome-banner section">
        <div className="welcome-text">
          <h2>Welcome back, {user?.name || 'Admin'}! 👋</h2>
          <p>Full system overview — manage students, teachers, attendance and organizations.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <div className="welcome-date"><HiOutlineCalendar /><span>{today}</span></div>
          <LiveIndicator />
        </div>
      </div>

      {/* ── Key Metrics ── */}
      <div className="section">
        <h3 className="section-group-title">System Overview</h3>
        <div className="grid-stats">
          <StatCard icon={HiOutlineUserGroup} iconVariant="primary" label="Total Students" value={stats.students} loading={loading} />
          <StatCard icon={HiOutlineAcademicCap} iconVariant="teal" label="Total Teachers" value={stats.teachers} loading={loading} />
          <StatCard icon={HiOutlineClipboardCheck} iconVariant="accent" label="Attendance Rate" value={`${stats.attendance}%`} loading={loading} />
          <StatCard icon={HiOutlineChartBar} iconVariant="danger" label="Active Classes" value={stats.classes.length} loading={loading} />
        </div>
      </div>

      {/* ── Dashboard Columns ── */}
      <div className="admin-dashboard-layout section">
        {/* Left column — Main data */}
        <div className="admin-main" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Organizations card */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-header-title">Organizations Summary</h3>
              <Link to="/organizations" className="btn btn-sm btn-outline"><HiOutlineOfficeBuilding /> Manage</Link>
            </div>
            <div className="card-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Total Orgs</span>
                  <span className="detail-value"><strong>{loading ? '...' : orgStats.total}</strong></span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Active Orgs</span>
                  <span className="detail-value"><span className="badge badge-accent">{loading ? '...' : orgStats.active}</span></span>
                </div>
              </div>
              
              {/* Organization List Section */}
              <div style={{ marginTop: '16px', borderTop: '2px solid var(--border-color)', paddingTop: '16px' }}>
                <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Active Organizations ({orgsList.filter(o => o.status === 'active').length})
                </div>
                {orgsList.length === 0 ? (
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                    No organizations created yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                    {orgsList.filter(o => o.status === 'active').map(org => (
                      <div
                        key={org._id}
                        onClick={() => setSelectedOrg(org)}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '8px 12px', background: 'var(--color-surface)',
                          border: '2px solid var(--border-color)', cursor: 'pointer',
                          transition: 'transform 0.1s, border-color 0.1s'
                        }}
                        className="hover-card-minor"
                      >
                        <span style={{ fontWeight: 700, fontSize: '13px' }}>🏫 {org.name}</span>
                        <span className="badge badge-outline" style={{ fontSize: '11px', textTransform: 'none', letterSpacing: 'normal' }}>
                          Code: <strong>{org.code}</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '12px', marginBottom: 0 }}>
                Click on any school name above to view its registered students and teachers roster.
              </p>
            </div>
          </div>

          {/* Active Classes card */}
          {stats.classes.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-header-title">Active Classes ({stats.classes.length})</h3>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {stats.classes.map((cls, i) => (
                    <span key={i} className="badge badge-outline" style={{ fontSize: '13px', padding: '6px 12px' }}>{cls}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column — Quick tools and profile */}
        <div className="admin-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Quick Actions */}
          <div className="card">
            <div className="card-header"><h3 className="card-header-title">Quick Actions</h3></div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Link to="/students" state={{ openAdd: true }} className="btn btn-accent" style={{ justifyContent: 'flex-start' }}>
                  <HiOutlinePlus /> Add Student
                </Link>
                <Link to="/teachers" state={{ openAdd: true }} className="btn btn-primary" style={{ justifyContent: 'flex-start' }}>
                  <HiOutlinePlus /> Add Teacher
                </Link>
                <Link to="/attendance" className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>
                  <HiOutlineClipboardCheck /> Mark Attendance
                </Link>
                <Link to="/organizations" className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>
                  <HiOutlineOfficeBuilding /> Manage Organizations
                </Link>
                <Link to="/settings" className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>
                  <HiOutlineCog /> Settings
                </Link>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="card">
            <div className="card-header"><h3 className="card-header-title">Admin Account Profile</h3></div>
            <div className="card-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Name</span>
                  <span className="detail-value"><strong>{user?.name}</strong></span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Role</span>
                  <span className="detail-value"><span className="badge badge-primary">{user?.role}</span></span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span className="detail-value"><span className="badge badge-accent">{user?.isActive ? 'Active' : 'Inactive'}</span></span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email</span>
                  <span className="detail-value" style={{ fontSize: 'var(--font-size-xs)' }}>{user?.email}</span>
                </div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="detail-label">Last Login</span>
                  <span className="detail-value">{user?.lastLogin ? new Date(user.lastLogin).toLocaleString('en-IN') : 'First session'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {selectedOrg && (
        <OrganizationDetailModal
          organization={selectedOrg}
          onClose={() => setSelectedOrg(null)}
        />
      )}
    </div>
  );
}
