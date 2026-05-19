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
} from 'react-icons/hi';
import { studentsAPI, teachersAPI, attendanceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../components/ui/Components.css';
import './Dashboard.css';

const statIcons = [HiOutlineUserGroup, HiOutlineClipboardCheck, HiOutlineAcademicCap, HiOutlineChartBar];
const statVariants = ['primary', 'accent', 'teal', 'danger'];

// ── TeacherCardList — Compact cards, click to expand details ─────────────────
function TeacherCardList({ teachers }) {
  const [expandedIdx, setExpandedIdx] = useState(null);

  const toggle = (i) => setExpandedIdx(prev => prev === i ? null : i);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {teachers.map((t, i) => {
        const isOpen = expandedIdx === i;
        return (
          <div
            key={i}
            className="card"
            style={{ overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
          >
            {/* Collapsed row — always visible */}
            <div
              onClick={() => toggle(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 18px',
                userSelect: 'none',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '42px', height: '42px', flexShrink: 0,
                background: 'var(--color-primary)', color: 'var(--color-text-on-primary)',
                border: '2px solid var(--border-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '18px',
              }}>
                {t.name.charAt(0).toUpperCase()}
              </div>

              {/* Name + hint */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 'var(--font-size-base)' }}>{t.name}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                  {isOpen ? 'Click to collapse' : 'Click to view details'}
                </div>
              </div>

              {/* Subject badge + chevron */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                {t.subject && t.subject !== 'Not set' && (
                  <span className="badge badge-primary" style={{ fontSize: '12px' }}>{t.subject}</span>
                )}
                <span style={{
                  fontSize: '18px', color: 'var(--color-text-muted)',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  display: 'inline-block', lineHeight: 1,
                }}>▾</span>
              </div>
            </div>

            {/* Expanded details panel */}
            {isOpen && (
              <div style={{
                borderTop: '2px solid var(--border-color)',
                padding: '16px 18px',
                background: 'var(--color-surface)',
                animation: 'fadeIn 0.15s ease',
              }}>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Subject</span>
                    <span className="detail-value">
                      <span className="badge badge-primary">{t.subject || '—'}</span>
                    </span>
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
                        {t.classes.map((cls, j) => (
                          <span key={j} className="badge badge-outline">{cls}</span>
                        ))}
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

// ── Teacher Profile Section (My Classes + My Info) ────────────────────────────
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
      setForm({
        subject: t.subject || '',
        phone: t.phone || '',
        qualification: t.qualification || '',
        experience: t.experience || '',
      });
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + 30s live refresh
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
      showToast('Profile updated successfully!');
    } catch {
      showToast('Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addClass = async () => {
    const cls = newClass.trim();
    if (!cls) return;
    const currentClasses = profile?.classes || [];
    if (currentClasses.map(c => c.toLowerCase()).includes(cls.toLowerCase())) {
      showToast('Class already exists', 'error');
      return;
    }
    const updatedClasses = [...currentClasses, cls];
    try {
      await teachersAPI.updateMyProfile({ classes: updatedClasses });
      await fetchProfile();
      setNewClass('');
      showToast(`Class "${cls}" added!`);
    } catch {
      showToast('Failed to add class', 'error');
    }
  };

  const removeClass = async (cls) => {
    const updatedClasses = (profile?.classes || []).filter(c => c !== cls);
    try {
      await teachersAPI.updateMyProfile({ classes: updatedClasses });
      await fetchProfile();
      showToast(`Class "${cls}" removed`);
    } catch {
      showToast('Failed to remove class', 'error');
    }
  };

  if (loading) return <div className="spinner-wrapper"><div className="spinner" /><span className="spinner-text">Loading profile...</span></div>;

  return (
    <div className="section">
      <div className="grid-2">
        {/* My Classes Card */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-header-title">My Classes</h3>
            <span className="badge badge-primary">{profile?.classes?.length || 0} classes</span>
          </div>
          <div className="card-body">
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              Students in these classes will see you on their dashboard.
            </p>

            {/* Add class input */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                className="form-input"
                style={{ flex: 1, marginBottom: 0 }}
                placeholder="Enter class (e.g. 10-A, 5, CS-1)"
                value={newClass}
                onChange={e => setNewClass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addClass()}
              />
              <button className="btn btn-accent" onClick={addClass} style={{ flexShrink: 0 }}>
                <HiOutlinePlus /> Add
              </button>
            </div>

            {/* Classes list */}
            {profile?.classes?.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {profile.classes.map((cls, i) => (
                  <span
                    key={i}
                    className="badge badge-outline"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '14px' }}
                  >
                    {cls}
                    <button
                      onClick={() => removeClass(cls)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: '0', display: 'flex', lineHeight: 1 }}
                      title={`Remove class ${cls}`}
                    >
                      <HiOutlineX style={{ fontSize: '14px' }} />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '16px 0' }}>
                <div className="empty-state-icon" style={{ fontSize: '28px' }}>📚</div>
                <div className="empty-state-title" style={{ fontSize: '14px' }}>No classes set</div>
                <p className="empty-state-text" style={{ fontSize: '12px' }}>Add your classes above so students can find you.</p>
              </div>
            )}
          </div>
        </div>

        {/* My Info Card */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-header-title">My Info</h3>
            {!editing ? (
              <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>
                <HiOutlinePencil /> Edit
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-accent btn-sm" onClick={saveProfile} disabled={saving}>
                  <HiOutlineSave /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </div>
            )}
          </div>
          <div className="card-body">
            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Subject</label>
                  <input className="form-input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Mathematics" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Your phone number" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Qualification</label>
                  <input className="form-input" value={form.qualification} onChange={e => setForm({ ...form, qualification: e.target.value })} placeholder="e.g. M.Sc, B.Ed" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Experience (years)</label>
                  <input className="form-input" type="number" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} placeholder="Years of experience" />
                </div>
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
                <div className="detail-item">
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">{profile?.phone || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Qualification</span>
                  <span className="detail-value">{profile?.qualification || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Experience</span>
                  <span className="detail-value">{profile?.experience ? `${profile.experience} years` : '—'}</span>
                </div>
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

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ students: 0, attendance: 0, teachers: 0, classes: [] });
  // Student-specific state
  const [studentProfile, setStudentProfile] = useState(null);
  const [myTeachers, setMyTeachers] = useState([]);
  const [myAttendance, setMyAttendance] = useState({ present: 0, absent: 0, late: 0, total: 0, rate: 0 });

  const fetchDashboardData = useCallback(async () => {
    try {
      if (role === 'student') {
        const [profileRes, attRes] = await Promise.all([
          studentsAPI.myProfile(),
          attendanceAPI.myAttendance(),
        ]);
        setStudentProfile(profileRes.data.data.student);
        setMyTeachers(profileRes.data.data.teachers || []);
        setMyAttendance(attRes.data.data.stats || { present: 0, absent: 0, late: 0, total: 0, rate: 0 });
      } else {
        const promises = [];
        if (role === 'admin' || role === 'teacher') {
          promises.push(studentsAPI.getStats());
        } else {
          promises.push(Promise.resolve({ data: { data: { total: 0, classes: [] } } }));
        }
        if (role === 'admin') {
          promises.push(teachersAPI.getStats());
        } else {
          promises.push(Promise.resolve({ data: { data: { total: 0 } } }));
        }
        const [studentRes, teacherRes] = await Promise.all(promises);
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
      }
    } catch {} finally { setLoading(false); }
  }, [role]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // ── STUDENT DASHBOARD ──────────────────────────────────────────────────────
  if (role === 'student') {
    return (
      <div className="dashboard">
        <div className="welcome-banner section">
          <div className="welcome-text">
            <h2>Welcome, {user?.name || 'Student'}! 👋</h2>
            <p>{studentProfile ? `Class ${studentProfile.class}${studentProfile.section ? ` — Section ${studentProfile.section}` : ''}` : 'Your profile is being set up by your teacher.'}</p>
          </div>
          <div className="welcome-date">
            <HiOutlineCalendar />
            <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Attendance Stats */}
        <div className="grid-stats section" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card">
            <div className="stat-card-icon accent"><HiOutlineCheck /></div>
            <div className="stat-card-info"><div className="stat-card-label">Present</div><div className="stat-card-value">{loading ? '...' : myAttendance.present}</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon danger"><HiOutlineX /></div>
            <div className="stat-card-info"><div className="stat-card-label">Absent</div><div className="stat-card-value">{loading ? '...' : myAttendance.absent}</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon primary"><HiOutlineClipboardCheck /></div>
            <div className="stat-card-info"><div className="stat-card-label">Total Days</div><div className="stat-card-value">{loading ? '...' : myAttendance.total}</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon teal"><HiOutlineChartBar /></div>
            <div className="stat-card-info"><div className="stat-card-label">Attendance %</div><div className="stat-card-value">{loading ? '...' : `${myAttendance.rate}%`}</div></div>
          </div>
        </div>

        {/* My Teachers Section */}
        <div className="section">
          <h3 style={{ marginBottom: '16px', fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)' }}>
            My Teachers
            {myTeachers.length > 0 && (
              <span className="badge badge-outline" style={{ marginLeft: '10px', fontSize: '13px', verticalAlign: 'middle' }}>
                {myTeachers.length}
              </span>
            )}
          </h3>

          {myTeachers.length > 0 ? (() => {
            // Inner component-like logic via IIFE to use useState per card
            // We pass selectedTeacher as state from parent scope
            return null; // replaced below
          })() || (
            <TeacherCardList teachers={myTeachers} />
          ) : (
            <div className="card">
              <div className="card-body">
                <div className="empty-state">
                  <div className="empty-state-icon">👨‍🏫</div>
                  <div className="empty-state-title">No teachers assigned yet</div>
                  <p className="empty-state-text">You haven't been added to any teacher's class list yet. Once a teacher adds your class, their info will appear here.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid-2 section">
          {/* My Profile Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-header-title">My Profile</h3>
            </div>
            <div className="card-body">
              {studentProfile ? (
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Roll No</span>
                    <span className="detail-value">{studentProfile.rollNo}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Class</span>
                    <span className="detail-value"><span className="badge badge-outline">{studentProfile.class}{studentProfile.section ? ` - ${studentProfile.section}` : ''}</span></span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email</span>
                    <span className="detail-value">{studentProfile.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status</span>
                    <span className="detail-value"><span className={`badge ${studentProfile.status === 'active' ? 'badge-accent' : 'badge-danger'}`}>{studentProfile.status}</span></span>
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
                <Link to="/my-attendance" className="btn btn-accent" style={{ justifyContent: 'flex-start' }}><HiOutlineClipboardCheck /> View Full Attendance</Link>
                <Link to="/teachers" className="btn btn-primary" style={{ justifyContent: 'flex-start' }}><HiOutlineAcademicCap /> View Teachers</Link>
                <Link to="/settings" className="btn btn-outline" style={{ justifyContent: 'flex-start' }}><HiOutlineCog /> Settings</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── TEACHER DASHBOARD ──────────────────────────────────────────────────────
  if (role === 'teacher') {
    const statCards = [
      { label: 'Total Students', value: loading ? '...' : String(stats.students) },
      { label: 'Attendance Rate', value: loading ? '...' : `${stats.attendance}%` },
      { label: 'Total Classes', value: loading ? '...' : String(stats.classes.length) },
    ];

    return (
      <div className="dashboard">
        <div className="welcome-banner section">
          <div className="welcome-text">
            <h2>Welcome back, {user?.name || 'Teacher'}! 👋</h2>
            <p>Manage your classes and track your students' progress.</p>
          </div>
          <div className="welcome-date">
            <HiOutlineCalendar />
            <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-stats section" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {statCards.map((stat, i) => {
            const Icon = statIcons[i % statIcons.length];
            return (
              <div className="stat-card" key={i}>
                <div className={`stat-card-icon ${statVariants[i % statVariants.length]}`}><Icon /></div>
                <div className="stat-card-info">
                  <div className="stat-card-label">{stat.label}</div>
                  <div className="stat-card-value">{stat.value}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Teacher Profile Section — My Classes + My Info */}
        <TeacherProfileSection />

        {/* Quick Actions */}
        <div className="section">
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link to="/students" className="btn btn-accent"><HiOutlineUserGroup /> My Students</Link>
            <Link to="/attendance" className="btn btn-primary"><HiOutlineClipboardCheck /> Mark Attendance</Link>
            <Link to="/settings" className="btn btn-outline"><HiOutlineCog /> Settings</Link>
          </div>
        </div>
      </div>
    );
  }

  // ── ADMIN DASHBOARD ────────────────────────────────────────────────────────
  const statCards = [
    { label: 'Total Students', value: loading ? '...' : String(stats.students) },
    { label: 'Attendance Rate', value: loading ? '...' : `${stats.attendance}%` },
    { label: 'Total Teachers', value: loading ? '...' : String(stats.teachers) },
    { label: 'Total Classes', value: loading ? '...' : String(stats.classes.length) },
  ];

  return (
    <div className="dashboard">
      <div className="welcome-banner section">
        <div className="welcome-text">
          <h2>Welcome back, {user?.name || 'Admin'}! 👋</h2>
          <p>Here's what's happening in your school today.</p>
        </div>
        <div className="welcome-date">
          <HiOutlineCalendar />
          <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      <div className="grid-stats section" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {statCards.map((stat, i) => {
          const Icon = statIcons[i % statIcons.length];
          return (
            <div className="stat-card" key={i}>
              <div className={`stat-card-icon ${statVariants[i % statVariants.length]}`}><Icon /></div>
              <div className="stat-card-info">
                <div className="stat-card-label">{stat.label}</div>
                <div className="stat-card-value">{stat.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid-2 section">
        <div className="card">
          <div className="card-header"><h3 className="card-header-title">Quick Actions</h3></div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link to="/students" className="btn btn-accent" style={{ justifyContent: 'flex-start' }}><HiOutlinePlus /> Add Student</Link>
              <Link to="/teachers" className="btn btn-primary" style={{ justifyContent: 'flex-start' }}><HiOutlinePlus /> Add Teacher</Link>
              <Link to="/attendance" className="btn btn-teal" style={{ justifyContent: 'flex-start' }}><HiOutlineClipboardCheck /> Mark Attendance</Link>
              <Link to="/settings" className="btn btn-outline" style={{ justifyContent: 'flex-start' }}><HiOutlineCog /> Settings</Link>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-header-title">System Info</h3></div>
          <div className="card-body">
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Your Role</span>
                <span className="detail-value"><span className="badge badge-primary">{user?.role}</span></span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span className="detail-value"><span className="badge badge-accent">{user?.isActive ? 'Active' : 'Inactive'}</span></span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email</span>
                <span className="detail-value">{user?.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Last Login</span>
                <span className="detail-value">{user?.lastLogin ? new Date(user.lastLogin).toLocaleString('en-IN') : 'First login'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
