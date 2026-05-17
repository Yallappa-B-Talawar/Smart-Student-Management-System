import { useState, useEffect } from 'react';
import { HiOutlineCheck, HiOutlineX, HiOutlineClock } from 'react-icons/hi';
import { attendanceAPI } from '../services/api';
import '../components/ui/Components.css';

export default function MyAttendance() {
  const [data, setData] = useState({ records: [], stats: { present: 0, absent: 0, late: 0, total: 0, rate: 0 } });
  const [loading, setLoading] = useState(true);

  const fetchMyAttendance = async () => {
    try {
      const res = await attendanceAPI.myAttendance();
      setData(res.data.data);
    } catch {
      setData({ records: [], stats: { present: 0, absent: 0, late: 0, total: 0, rate: 0 } });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAttendance();
    // Auto-refresh every 30 seconds for live updates
    const interval = setInterval(fetchMyAttendance, 30000);
    return () => clearInterval(interval);
  }, []);

  const { stats, records } = data;

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">My Attendance</h2>
          <p className="section-subtitle">View your attendance history and statistics</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-stats section" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-card-icon accent"><HiOutlineCheck /></div>
          <div className="stat-card-info"><div className="stat-card-label">Present</div><div className="stat-card-value">{stats.present}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon danger"><HiOutlineX /></div>
          <div className="stat-card-info"><div className="stat-card-label">Absent</div><div className="stat-card-value">{stats.absent}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon primary"><HiOutlineClock /></div>
          <div className="stat-card-info"><div className="stat-card-label">Late</div><div className="stat-card-value">{stats.late}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon teal">📊</div>
          <div className="stat-card-info"><div className="stat-card-label">Attendance Rate</div><div className="stat-card-value">{stats.rate}%</div></div>
        </div>
      </div>

      {/* Progress Bar */}
      {stats.total > 0 && (
        <div className="section" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="progress-bar-wrapper" style={{ flex: 1 }}>
            <div className="progress-bar-fill" style={{ width: `${stats.rate}%` }} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-muted)' }}>{stats.rate}% Present</span>
        </div>
      )}

      {/* Records Table */}
      {loading ? (
        <div className="spinner-wrapper"><div className="spinner" /><span className="spinner-text">Loading attendance...</span></div>
      ) : (
        <div className="table-wrapper">
          <table className="table table-responsive">
            <thead>
              <tr><th>Date</th><th>Class</th><th>Status</th></tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan="3">
                  <div className="empty-state">
                    <div className="empty-state-icon">📝</div>
                    <div className="empty-state-title">No attendance records yet</div>
                    <p className="empty-state-text">Your teacher hasn't marked attendance for you yet. Check back later.</p>
                  </div>
                </td></tr>
              ) : records.map(r => (
                <tr key={r._id}>
                  <td data-label="Date"><strong>{new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</strong></td>
                  <td data-label="Class"><span className="badge badge-outline">{r.class}</span></td>
                  <td data-label="Status">
                    <span className={`badge ${r.status === 'present' ? 'badge-accent' : r.status === 'absent' ? 'badge-danger' : 'badge-primary'}`}>
                      {r.status === 'present' && <HiOutlineCheck style={{ marginRight: '4px' }} />}
                      {r.status === 'absent' && <HiOutlineX style={{ marginRight: '4px' }} />}
                      {r.status === 'late' && <HiOutlineClock style={{ marginRight: '4px' }} />}
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
