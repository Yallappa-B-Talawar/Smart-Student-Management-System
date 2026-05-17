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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const promises = [];
        // Students stats — admin & teacher only
        if (role === 'admin' || role === 'teacher') {
          promises.push(studentsAPI.getStats());
        } else {
          promises.push(Promise.resolve({ data: { data: { total: 0, classes: [] } } }));
        }
        // Teacher stats — admin only
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
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [role]);

  const statCards = [
    { label: 'Total Students', value: loading ? '...' : String(stats.students), show: role === 'admin' || role === 'teacher' },
    { label: 'Attendance Rate', value: loading ? '...' : `${stats.attendance}%`, show: true },
    { label: 'Total Teachers', value: loading ? '...' : String(stats.teachers), show: role === 'admin' },
    { label: 'Total Classes', value: loading ? '...' : String(stats.classes.length), show: role === 'admin' || role === 'teacher' },
  ].filter(s => s.show);

  // Build quick actions based on role
  const quickActions = [];
  if (role === 'admin') {
    quickActions.push({ label: 'Add Student', to: '/students', icon: HiOutlinePlus, color: 'accent' });
    quickActions.push({ label: 'Add Teacher', to: '/teachers', icon: HiOutlinePlus, color: 'primary' });
    quickActions.push({ label: 'Mark Attendance', to: '/attendance', icon: HiOutlineClipboardCheck, color: 'teal' });
  } else if (role === 'teacher') {
    quickActions.push({ label: 'My Students', to: '/students', icon: HiOutlineUserGroup, color: 'accent' });
    quickActions.push({ label: 'Mark Attendance', to: '/attendance', icon: HiOutlineClipboardCheck, color: 'primary' });
  } else {
    quickActions.push({ label: 'View Teachers', to: '/teachers', icon: HiOutlineAcademicCap, color: 'primary' });
    quickActions.push({ label: 'My Attendance', to: '/attendance', icon: HiOutlineClipboardCheck, color: 'accent' });
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
