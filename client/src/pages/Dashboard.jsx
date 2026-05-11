import { useState, useEffect } from 'react';
import {
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineClipboardCheck,
  HiOutlineChartBar,
  HiOutlineCalendar,
} from 'react-icons/hi';
import { studentsAPI, teachersAPI, attendanceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../components/ui/Components.css';
import './Dashboard.css';

const statIcons = [HiOutlineUserGroup, HiOutlineClipboardCheck, HiOutlineAcademicCap, HiOutlineChartBar];
const statVariants = ['primary', 'accent', 'teal', 'danger'];

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ students: 0, attendance: 0, teachers: 0, classes: [] });

  useEffect(() => {
    const fetchStats = async () => {
      try {
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
      } catch {
        // API may not be running or user not logged in yet
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

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
          <h2>Welcome back, {user?.name || 'User'}! 👋</h2>
          <p>Here's what's happening in your school today.</p>
        </div>
        <div className="welcome-date">
          <HiOutlineCalendar />
          <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      <div className="grid-stats section">
        {statCards.map((stat, i) => {
          const Icon = statIcons[i];
          return (
            <div className="stat-card" key={i}>
              <div className={`stat-card-icon ${statVariants[i]}`}><Icon /></div>
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
            <h3 className="card-header-title">Recent Activity</h3>
            <button className="btn btn-sm btn-outline">View All</button>
          </div>
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">No activity yet</div>
              <p className="empty-state-text">Activity will appear here as you use the system.</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-header-title">Upcoming Events</h3>
            <button className="btn btn-sm btn-accent">+ Add</button>
          </div>
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <div className="empty-state-title">No events scheduled</div>
              <p className="empty-state-text">Upcoming exams and meetings will be listed here.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
