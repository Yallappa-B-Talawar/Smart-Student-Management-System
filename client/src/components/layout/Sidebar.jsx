import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineViewGrid,
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineClipboardCheck,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineOfficeBuilding,
} from 'react-icons/hi';
import './Sidebar.css';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const role = user?.role;

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  // Build nav items based on role — each item matches exactly what the role can access
  const navItems = [];

  // Dashboard — everyone
  navItems.push({ path: '/', label: 'Dashboard', icon: HiOutlineViewGrid });

  if (role === 'admin') {
    navItems.push({ path: '/students',      label: 'Students',       icon: HiOutlineUserGroup });
    navItems.push({ path: '/teachers',      label: 'Teachers',       icon: HiOutlineAcademicCap });
    navItems.push({ path: '/attendance',    label: 'Attendance',     icon: HiOutlineClipboardCheck });
    navItems.push({ path: '/organizations', label: 'Organizations',  icon: HiOutlineOfficeBuilding });
  }

  if (role === 'teacher') {
    // Teachers can view students, teachers directory, and mark attendance
    navItems.push({ path: '/students',   label: 'Students',       icon: HiOutlineUserGroup });
    navItems.push({ path: '/teachers',   label: 'Teachers',       icon: HiOutlineAcademicCap });
    navItems.push({ path: '/attendance', label: 'Attendance',     icon: HiOutlineClipboardCheck });
  }

  if (role === 'student') {
    // Students can view teachers (read-only directory) and their own attendance
    navItems.push({ path: '/teachers',      label: 'Teachers',        icon: HiOutlineAcademicCap });
    navItems.push({ path: '/my-attendance', label: 'My Attendance',   icon: HiOutlineClipboardCheck });
  }

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`sidebar ${isOpen ? 'open' : ''}`} role="navigation" aria-label="Main Navigation">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" aria-hidden="true">S</div>
          <div className="sidebar-logo-text">
            SSMS
            <span>Student Management</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main Menu</div>
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="sidebar-link-icon"><Icon /></span>
              {label}
            </NavLink>
          ))}

          <div className="sidebar-section-label" style={{ marginTop: 'auto' }}>Account</div>
          <NavLink to="/settings" className="sidebar-link" onClick={onClose}>
            <span className="sidebar-link-icon"><HiOutlineCog /></span>
            Settings
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">{user.name?.charAt(0) || 'U'}</div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user.name}</div>
                <div className="sidebar-user-role">{user.role}</div>
              </div>
            </div>
          )}
          <button className="sidebar-link" onClick={handleLogout} style={{ width: '100%', color: '#FF3E6C' }}>
            <span className="sidebar-link-icon"><HiOutlineLogout /></span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
