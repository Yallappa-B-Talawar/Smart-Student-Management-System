import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineMenu,
  HiOutlineSearch,
  HiOutlineBell,
  HiOutlineSun,
  HiOutlineMoon,
} from 'react-icons/hi';
import './Header.css';

export default function Header({ onMenuToggle, pageTitle }) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <header className="header" role="banner">
      <div className="header-left">
        <button
          className="header-menu-btn"
          onClick={onMenuToggle}
          aria-label="Toggle navigation menu"
        >
          <HiOutlineMenu />
        </button>
        <h1 className="header-title">{pageTitle || 'Dashboard'}</h1>
      </div>

      <div className="header-search">
        <HiOutlineSearch className="header-search-icon" />
        <input
          className="header-search-input"
          type="search"
          placeholder="Search students, teachers, classes..."
          aria-label="Search"
        />
      </div>

      <div className="header-actions">
        <button
          className="header-btn theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <HiOutlineMoon /> : <HiOutlineSun />}
        </button>

        <button className="header-btn" aria-label="Notifications">
          <HiOutlineBell />
          <span className="notification-dot" aria-hidden="true" />
        </button>

        <div className="header-avatar" role="button" tabIndex={0} aria-label="User profile">
          {initials}
        </div>
      </div>
    </header>
  );
}
