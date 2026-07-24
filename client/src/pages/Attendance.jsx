import { useState, useEffect, useCallback } from 'react';
import { HiOutlineCheck, HiOutlineX, HiOutlineClock } from 'react-icons/hi';
import { attendanceAPI, studentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import '../components/ui/Components.css';

export default function Attendance() {
  const { user } = useAuth();
  const canMark = user?.role === 'admin' || user?.role === 'teacher';
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0 });
  const { showToast } = useToast();

  // Fetch available classes
  useEffect(() => {
    studentsAPI.getStats().then(res => {
      const cls = res.data.data.classes || [];
      setClasses(cls);
      if (cls.length > 0 && !selectedClass) setSelectedClass(cls[0]);
    }).catch(() => {});
  }, []);

  const fetchAttendance = useCallback(async (silent = false) => {
    if (!selectedClass) return;
    if (!silent) setLoading(true);
    try {
      const res = await attendanceAPI.getByClass(selectedClass, selectedDate);
      setRecords(res.data.data || []);
    } catch { setRecords([]); }
    finally { if (!silent) setLoading(false); }
  }, [selectedClass, selectedDate]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  // Auto-refresh every 30 seconds for live updates (silent & visibility-aware)
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchAttendance(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchAttendance]);

  useEffect(() => {
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    setStats({ present, absent, late });
  }, [records]);

  const updateStatus = (id, status) => {
    setRecords(prev => prev.map(r => r._id === id ? { ...r, status } : r));
  };

  const markAllStatus = (status) => {
    setRecords(prev => prev.map(r => ({ ...r, status })));
  };

  const saveAttendance = async () => {
    const marked = records.filter(r => r.status !== 'unmarked');
    if (marked.length === 0) { showToast('No attendance marked', 'error'); return; }
    try {
      const payload = marked.map(r => ({
        student: r._id,
        date: selectedDate,
        status: r.status,
        class: selectedClass,
      }));
      await attendanceAPI.mark(payload);
      showToast('Attendance saved successfully');
    } catch {
      showToast('Failed to save attendance', 'error');
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Attendance</h2>
          <p className="section-subtitle">Mark and manage daily attendance</p>
        </div>
        {canMark && <button className="btn btn-primary" onClick={saveAttendance}>Save Attendance</button>}
      </div>

      <div className="grid-stats section" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
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
      </div>

      <div className="card section">
        <div className="card-header">
          <h3 className="card-header-title">Filter Attendance</h3>
          {canMark && records.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button className="btn btn-sm btn-accent" onClick={() => markAllStatus('present')}>Mark All Present</button>
              <button className="btn btn-sm btn-outline" style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} onClick={() => markAllStatus('absent')}>Mark All Absent</button>
            </div>
          )}
        </div>
        <div className="card-body" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0, minWidth: '160px' }}>
            <label className="form-label" htmlFor="att-class">Class</label>
            <select className="form-select" id="att-class" value={selectedClass} onChange={e => setSelectedClass(e.target.value)} aria-label="Select class">
              {classes.length === 0 && <option value="">No classes found</option>}
              {classes.map(cls => <option key={cls} value={cls}>{cls}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="att-date">Date</label>
            <input className="form-input" id="att-date" type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} aria-label="Attendance date" />
          </div>
          {records.length > 0 && (
            <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '160px' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Today's Rate
              </span>
              <div className="progress-bar-wrapper">
                <div className="progress-bar-fill" style={{ width: `${records.length > 0 ? (stats.present / records.length) * 100 : 0}%` }} />
              </div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                {records.length > 0 ? Math.round((stats.present / records.length) * 100) : 0}% Present ({stats.present}/{records.length})
              </span>
            </div>
          )}
        </div>
      </div>


      {loading ? (
        <div className="spinner-wrapper"><div className="spinner" /><span className="spinner-text">Loading students...</span></div>
      ) : (
        <div className="table-wrapper">
          <table className="table table-responsive">
            <thead><tr><th>Roll No</th><th>Student Name</th><th>Status</th><th>Mark Attendance</th></tr></thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan="4"><div className="empty-state"><div className="empty-state-icon">📝</div><div className="empty-state-title">No students in this class</div><p className="empty-state-text">Add students to this class first, then mark attendance.</p></div></td></tr>
              ) : records.map(s => (
                <tr key={s._id}>
                  <td data-label="Roll No"><strong>{s.rollNo}</strong></td>
                  <td data-label="Name">{s.name}</td>
                  <td data-label="Status">
                    <span className={`badge ${s.status === 'present' ? 'badge-accent' : s.status === 'absent' ? 'badge-danger' : s.status === 'late' ? 'badge-primary' : 'badge-outline'}`}>{s.status}</span>
                  </td>
                  <td data-label="Actions">
                    {canMark ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className={`btn btn-sm ${s.status === 'present' ? 'btn-accent' : 'btn-outline'}`} onClick={() => updateStatus(s._id, 'present')} aria-label={`Mark ${s.name} present`}><HiOutlineCheck /></button>
                        <button className={`btn btn-sm ${s.status === 'absent' ? 'btn-danger' : 'btn-outline'}`} onClick={() => updateStatus(s._id, 'absent')} aria-label={`Mark ${s.name} absent`}><HiOutlineX /></button>
                        <button className={`btn btn-sm ${s.status === 'late' ? 'btn-primary' : 'btn-outline'}`} onClick={() => updateStatus(s._id, 'late')} aria-label={`Mark ${s.name} late`}><HiOutlineClock /></button>
                      </div>
                    ) : (
                      <span className={`badge ${s.status === 'present' ? 'badge-accent' : s.status === 'absent' ? 'badge-danger' : s.status === 'late' ? 'badge-primary' : 'badge-outline'}`}>{s.status}</span>
                    )}
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
