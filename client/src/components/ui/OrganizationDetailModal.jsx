import { useState, useEffect, useCallback } from 'react';
import {
  HiOutlineX,
  HiOutlineRefresh,
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineOfficeBuilding,
} from 'react-icons/hi';
import { teachersAPI, studentsAPI } from '../../services/api';
import './Components.css';

export default function OrganizationDetailModal({ organization, onClose }) {
  const [activeTab, setActiveTab] = useState('teachers'); // 'teachers' or 'students'
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Selected detail item (for split view)
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchRoster = useCallback(async () => {
    if (!organization?._id) return;
    setError('');
    try {
      const [teachersRes, studentsRes] = await Promise.all([
        teachersAPI.getAll({ organization: organization._id }),
        studentsAPI.getAll({ organization: organization._id })
      ]);
      setTeachers(teachersRes.data.data.teachers || []);
      setStudents(studentsRes.data.data.students || []);
    } catch (err) {
      setError('Failed to fetch roster. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [organization?._id]);

  // Fetch when organization changes
  useEffect(() => {
    setLoading(true);
    fetchRoster();
    setSelectedTeacher(null);
    setSelectedStudent(null);
  }, [organization?._id, fetchRoster]);

  // Clear details selection when tab changes
  useEffect(() => {
    setSelectedTeacher(null);
    setSelectedStudent(null);
  }, [activeTab]);

  // Live polling every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchRoster, 30000);
    return () => clearInterval(interval);
  }, [fetchRoster]);

  // Sync selected details with live fetched data
  useEffect(() => {
    if (selectedTeacher) {
      const updatedTeacher = teachers.find(t => t._id === selectedTeacher._id);
      if (updatedTeacher) {
        setSelectedTeacher(updatedTeacher);
      }
    }
  }, [teachers, selectedTeacher]);

  useEffect(() => {
    if (selectedStudent) {
      const updatedStudent = students.find(s => s._id === selectedStudent._id);
      if (updatedStudent) {
        setSelectedStudent(updatedStudent);
      }
    }
  }, [students, selectedStudent]);

  if (!organization) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '95%', maxWidth: '1000px', height: '85vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', background: 'var(--color-primary)',
              color: 'var(--color-text-on-primary)', border: '2px solid var(--border-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
            }}>
              <HiOutlineOfficeBuilding />
            </div>
            <div>
              <h3 className="card-header-title" style={{ margin: 0 }}>{organization.name}</h3>
              <div style={{ display: 'flex', gap: '8px', marginTop: '2px', alignItems: 'center' }}>
                <span className="badge badge-accent" style={{ fontSize: '11px' }}>{organization.status}</span>
                <span className="badge badge-outline" style={{ fontSize: '11px', textTransform: 'none', letterSpacing: 'normal' }}>
                  Code: <strong>{organization.code}</strong>
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-sm btn-outline" onClick={fetchRoster} title="Refresh Live Data" disabled={loading}>
              <HiOutlineRefresh className={loading ? 'spin' : ''} />
            </button>
            <button className="btn btn-sm btn-outline" onClick={onClose}><HiOutlineX /></button>
          </div>
        </div>

        {/* Info summary */}
        {(organization.description || organization.address) && (
          <div style={{ padding: '12px 20px', background: 'var(--color-surface)', borderBottom: '2px solid var(--border-color)', fontSize: '13px', color: 'var(--color-text-muted)', flexShrink: 0 }}>
            {organization.description && <div style={{ marginBottom: organization.address ? '4px' : 0 }}>📝 {organization.description}</div>}
            {organization.address && <div>📍 {organization.address}</div>}
          </div>
        )}

        {/* Tabs selector */}
        <div className="section" style={{ display: 'flex', borderBottom: '2px solid var(--border-color)', margin: 0, padding: '12px 20px', flexShrink: 0 }}>
          <div className="tabs" style={{ marginBottom: 0 }}>
            <button
              className={`tab-btn ${activeTab === 'teachers' ? 'active' : ''}`}
              onClick={() => setActiveTab('teachers')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <HiOutlineAcademicCap /> Teachers
            </button>
            <button
              className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <HiOutlineUserGroup /> Students
            </button>
          </div>
          {loading && <div className="spinner" style={{ marginLeft: '12px', width: '20px', height: '20px', borderWidth: '2px' }} />}
        </div>

        {/* Content Body - Split View Layout */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Roster List Pane */}
          <div style={{
            flex: (selectedTeacher || selectedStudent) ? '1.2' : '1',
            overflowY: 'auto',
            padding: '20px',
            borderRight: (selectedTeacher || selectedStudent) ? '2px solid var(--border-color)' : 'none',
            background: 'var(--color-bg)'
          }}>
            {error && <div className="auth-error" style={{ marginBottom: '16px' }}>{error}</div>}
            
            {/* Teachers Tab */}
            {activeTab === 'teachers' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {teachers.length === 0 && !loading && (
                  <div className="empty-state">
                    <div className="empty-state-icon">👨‍🏫</div>
                    <div className="empty-state-title">No teachers in this school</div>
                  </div>
                )}
                {teachers.map(t => (
                  <div
                    key={t._id}
                    className={`card ${selectedTeacher?._id === t._id ? 'active-card' : ''}`}
                    onClick={() => { setSelectedTeacher(t); setSelectedStudent(null); }}
                    style={{
                      cursor: 'pointer',
                      borderWidth: selectedTeacher?._id === t._id ? '3px' : '2px',
                      borderColor: selectedTeacher?._id === t._id ? 'var(--color-primary)' : 'var(--border-color)'
                    }}
                  >
                    <div className="card-body" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '15px' }}>{t.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{t.email}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {t.subject && <span className="badge badge-outline" style={{ fontSize: '10px' }}>{t.subject}</span>}
                          <span className={`badge ${t.status === 'active' ? 'badge-accent' : 'badge-danger'}`} style={{ fontSize: '10px' }}>{t.status}</span>
                        </div>
                        <span className={`badge ${t.user ? (t.user.isActive ? 'badge-accent' : 'badge-danger') : 'badge-outline'}`} style={{ fontSize: '9px', textTransform: 'none', padding: '2px 6px', letterSpacing: 'normal' }}>
                          {t.user ? (t.user.isActive ? 'Registered' : 'Deactivated') : 'Unregistered'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {students.length === 0 && !loading && (
                  <div className="empty-state">
                    <div className="empty-state-icon">👩‍🎓</div>
                    <div className="empty-state-title">No students in this school</div>
                  </div>
                )}
                {students.map(s => (
                  <div
                    key={s._id}
                    className={`card ${selectedStudent?._id === s._id ? 'active-card' : ''}`}
                    onClick={() => { setSelectedStudent(s); setSelectedTeacher(null); }}
                    style={{
                      cursor: 'pointer',
                      borderWidth: selectedStudent?._id === s._id ? '3px' : '2px',
                      borderColor: selectedStudent?._id === s._id ? 'var(--color-primary)' : 'var(--border-color)'
                    }}
                  >
                    <div className="card-body" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '15px' }}>{s.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          Roll No: <strong>{s.rollNo}</strong> | Class: {s.class}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span className={`badge ${s.status === 'active' ? 'badge-accent' : 'badge-danger'}`} style={{ fontSize: '10px' }}>{s.status}</span>
                        <span className={`badge ${s.user ? (s.user.isActive ? 'badge-accent' : 'badge-danger') : 'badge-outline'}`} style={{ fontSize: '9px', textTransform: 'none', padding: '2px 6px', letterSpacing: 'normal' }}>
                          {s.user ? (s.user.isActive ? 'Registered' : 'Deactivated') : 'Unregistered'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details Pane (Shows when a student or teacher is clicked) */}
          {(selectedTeacher || selectedStudent) && (
            <div style={{
              flex: '1',
              overflowY: 'auto',
              padding: '20px',
              background: 'var(--color-surface)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              
              {/* Teacher Details */}
              {selectedTeacher && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '2px solid var(--border-color)', paddingBottom: '12px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{selectedTeacher.name}</h4>
                      <span className="badge badge-primary" style={{ marginTop: '4px', display: 'inline-block' }}>{selectedTeacher.subject}</span>
                    </div>
                    <button className="btn btn-sm btn-outline" onClick={() => setSelectedTeacher(null)}><HiOutlineX /></button>
                  </div>
                  <div className="detail-grid" style={{ gridTemplateColumns: '1fr' }}>
                    <div className="detail-item"><span className="detail-label">Email</span><span className="detail-value">{selectedTeacher.email}</span></div>
                    <div className="detail-item"><span className="detail-label">Phone</span><span className="detail-value">{selectedTeacher.phone || '—'}</span></div>
                    <div className="detail-item"><span className="detail-label">Qualification</span><span className="detail-value">{selectedTeacher.qualification || '—'}</span></div>
                    <div className="detail-item"><span className="detail-label">Experience</span><span className="detail-value">{selectedTeacher.experience ? `${selectedTeacher.experience} years` : '—'}</span></div>
                    <div className="detail-item"><span className="detail-label">Classes</span><span className="detail-value">{(selectedTeacher.classes || []).join(', ') || '—'}</span></div>
                    <div className="detail-item"><span className="detail-label">Status</span><span className="detail-value"><span className={`badge ${selectedTeacher.status === 'active' ? 'badge-accent' : 'badge-danger'}`}>{selectedTeacher.status}</span></span></div>
                    <div className="detail-item">
                      <span className="detail-label">Account Status</span>
                      <span className="detail-value">
                        {selectedTeacher.user ? (
                          <span className={`badge ${selectedTeacher.user.isActive ? 'badge-accent' : 'badge-danger'}`}>
                            {selectedTeacher.user.isActive ? 'Registered & Active' : 'Registered & Deactivated'}
                          </span>
                        ) : (
                          <span className="badge badge-outline" style={{ color: 'var(--color-text-muted)' }}>
                            Profile only (Unregistered)
                          </span>
                        )}
                      </span>
                    </div>
                    {selectedTeacher.user?.lastLogin && (
                      <div className="detail-item">
                        <span className="detail-label">Last Login</span>
                        <span className="detail-value">
                          {new Date(selectedTeacher.user.lastLogin).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                    <div className="detail-item"><span className="detail-label">Address</span><span className="detail-value">{selectedTeacher.address || '—'}</span></div>
                    {selectedTeacher.joiningDate && (
                      <div className="detail-item">
                        <span className="detail-label">Joining Date</span>
                        <span className="detail-value">{new Date(selectedTeacher.joiningDate).toLocaleDateString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Student Details */}
              {selectedStudent && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '2px solid var(--border-color)', paddingBottom: '12px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{selectedStudent.name}</h4>
                      <span className="badge badge-outline" style={{ marginTop: '4px', display: 'inline-block' }}>
                        Roll: <strong>{selectedStudent.rollNo}</strong> | Class: {selectedStudent.class} {selectedStudent.section && `- ${selectedStudent.section}`}
                      </span>
                    </div>
                    <button className="btn btn-sm btn-outline" onClick={() => setSelectedStudent(null)}><HiOutlineX /></button>
                  </div>
                  <div className="detail-grid" style={{ gridTemplateColumns: '1fr' }}>
                    <div className="detail-item"><span className="detail-label">Email</span><span className="detail-value">{selectedStudent.email}</span></div>
                    <div className="detail-item"><span className="detail-label">Phone</span><span className="detail-value">{selectedStudent.phone || '—'}</span></div>
                    <div className="detail-item"><span className="detail-label">Gender</span><span className="detail-value">{selectedStudent.gender || '—'}</span></div>
                    <div className="detail-item"><span className="detail-label">Parent Name</span><span className="detail-value">{selectedStudent.parentName || '—'}</span></div>
                    <div className="detail-item"><span className="detail-label">Parent Phone</span><span className="detail-value">{selectedStudent.parentPhone || '—'}</span></div>
                    <div className="detail-item"><span className="detail-label">Status</span><span className="detail-value"><span className={`badge ${selectedStudent.status === 'active' ? 'badge-accent' : 'badge-danger'}`}>{selectedStudent.status}</span></span></div>
                    <div className="detail-item">
                      <span className="detail-label">Account Status</span>
                      <span className="detail-value">
                        {selectedStudent.user ? (
                          <span className={`badge ${selectedStudent.user.isActive ? 'badge-accent' : 'badge-danger'}`}>
                            {selectedStudent.user.isActive ? 'Registered & Active' : 'Registered & Deactivated'}
                          </span>
                        ) : (
                          <span className="badge badge-outline" style={{ color: 'var(--color-text-muted)' }}>
                            Profile only (Unregistered)
                          </span>
                        )}
                      </span>
                    </div>
                    {selectedStudent.user?.lastLogin && (
                      <div className="detail-item">
                        <span className="detail-label">Last Login</span>
                        <span className="detail-value">
                          {new Date(selectedStudent.user.lastLogin).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                    <div className="detail-item"><span className="detail-label">Address</span><span className="detail-value">{selectedStudent.address || '—'}</span></div>
                    {selectedStudent.admissionDate && (
                      <div className="detail-item">
                        <span className="detail-label">Admission Date</span>
                        <span className="detail-value">{new Date(selectedStudent.admissionDate).toLocaleDateString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
