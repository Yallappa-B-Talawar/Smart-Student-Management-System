import { useState, useEffect } from 'react';
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
} from 'react-icons/hi';
import { studentsAPI, teachersAPI, attendanceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../components/ui/Components.css';
import './Dashboard.css';

const statIcons = [HiOutlineUserGroup, HiOutlineClipboardCheck, HiOutlineAcademicCap, HiOutlineChartBar];
const statVariants = ['primary', 'accent', 'teal', 'danger'];

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ students: 0, attendance: 0, teachers: 0, classes: [] });
  // Student-specific state
  const [studentProfile, setStudentProfile] = useState(null);
  const [myTeacher, setMyTeacher] = useState(null);
  const [myAttendance, setMyAttendance] = useState({ present: 0, absent: 0, late: 0, total: 0, rate: 0 });

  const fetchDashboardData = async () => {
    try {
      if (role === 'student') {
        // Student dashboard — fetch their profile + teacher info + attendance
        const [profileRes, attRes] = await Promise.all([
          studentsAPI.myProfile(),
          attendanceAPI.myAttendance(),
        ]);
        setStudentProfile(profileRes.data.data.student);
        setMyTeacher(profileRes.data.data.teacher);
        setMyAttendance(attRes.data.data.stats || { present: 0, absent: 0, late: 0, total: 0, rate: 0 });
      } else {
        // Admin/Teacher dashboard
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
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [role]);

  // ── STUDENT DASHBOARD ──
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

        <div className="grid-2 section">
          {/* My Teacher Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-header-title">My Teacher</h3>
            </div>
            <div className="card-body">
              {myTeacher ? (
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Name</span>
                    <span className="detail-value">{myTeacher.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Subject</span>
                    <span className="detail-value">{myTeacher.subject}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email</span>
                    <span className="detail-value">{myTeacher.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Phone</span>
                    <span className="detail-value">{myTeacher.phone}</span>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">👨‍🏫</div>
                  <div className="empty-state-title">Not assigned yet</div>
                  <p className="empty-state-text">Your teacher hasn't added you to their class yet. Once they do, their info will appear here.</p>
                </div>
              )}
            </div>
          </div>

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
        </div>

        {/* Quick Links */}
        <div className="section" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/my-attendance" className="btn btn-accent"><HiOutlineClipboardCheck /> View Full Attendance</Link>
          <Link to="/teachers" className="btn btn-primary"><HiOutlineAcademicCap /> View Teachers</Link>
          <Link to="/settings" className="btn btn-outline"><HiOutlineCog /> Settings</Link>
        </div>
      </div>
    );
  }

  // ── ADMIN / TEACHER DASHBOARD ──
  const statCards = [
    { label: 'Total Students', value: loading ? '...' : String(stats.students), show: role === 'admin' || role === 'teacher' },
    { label: 'Attendance Rate', value: loading ? '...' : `${stats.attendance}%`, show: true },
    { label: 'Total Teachers', value: loading ? '...' : String(stats.teachers), show: role === 'admin' },
    { label: 'Total Classes', value: loading ? '...' : String(stats.classes.length), show: role === 'admin' || role === 'teacher' },
  ].filter(s => s.show);

  const quickActions = [];
  if (role === 'admin') {
    quickActions.push({ label: 'Add Student', to: '/students', icon: HiOutlinePlus, color: 'accent' });
    quickActions.push({ label: 'Add Teacher', to: '/teachers', icon: HiOutlinePlus, color: 'primary' });
    quickActions.push({ label: 'Mark Attendance', to: '/attendance', icon: HiOutlineClipboardCheck, color: 'teal' });
  } else if (role === 'teacher') {
    quickActions.push({ label: 'My Students', to: '/students', icon: HiOutlineUserGroup, color: 'accent' });
    quickActions.push({ label: 'Mark Attendance', to: '/attendance', icon: HiOutlineClipboardCheck, color: 'primary' });
  }
  quickActions.push({ label: 'Settings', to: '/settings', icon: HiOutlineCog, color: 'danger' });

  return (
    <div className="dashboard">
      <div className="welcome-banner section">
        <div className="welcome-text">
          <h2>Welcome back, {user?.name || 'User'}! 👋</h2>
          <p>Here's what's happening in your school today.</p>
        </div>
        <div className="welcome-date">
          <HiOutlineCalendar />
          <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      <div className="grid-stats section" style={{ gridTemplateColumns: `repeat(${statCards.length}, 1fr)` }}>
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
          <div className="card-header">
            <h3 className="card-header-title">Quick Actions</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {quickActions.map((action, i) => {
                const Icon = action.icon;
                return (
                  <Link key={i} to={action.to} className={`btn btn-${action.color}`} style={{ justifyContent: 'flex-start' }}>
                    <Icon /> {action.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-header-title">System Info</h3>
          </div>
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
