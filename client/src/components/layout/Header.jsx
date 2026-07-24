import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineMenu,
  HiOutlineSearch,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineUser,
  HiOutlineCog,
  HiOutlineLogout,
} from 'react-icons/hi';
import './Header.css';

export default function Header({ onMenuToggle, pageTitle }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Parse initial search query if present in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    setSearchQuery(q);
  }, [location.search]);

  // Click outside to close avatar dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      const targetPage = user?.role === 'student' ? '/teachers' : '/students';
      navigate(`${targetPage}?q=${encodeURIComponent(searchQuery)}`, {
        state: { search: searchQuery }
      });
    }
  };

  const handleDropdownNavigate = (path) => {
    navigate(path);
    setDropdownOpen(false);
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
  };

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
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
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

        {/* Avatar Dropdown */}
        <div className="avatar-container" ref={dropdownRef}>
          <div
            className="header-avatar"
            role="button"
            tabIndex={0}
            aria-label="User profile"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            onKeyDown={(e) => e.key === 'Enter' && setDropdownOpen(!dropdownOpen)}
          >
            {initials}
          </div>

          {dropdownOpen && (
            <div className="avatar-dropdown">
              <div className="avatar-dropdown-header">
                <div className="avatar-dropdown-name">{user?.name}</div>
                <div className="avatar-dropdown-email">{user?.email}</div>
                <div className="avatar-dropdown-role">
                  <span className="badge badge-primary">{user?.role}</span>
                </div>
              </div>

              <button
                className="avatar-dropdown-link"
                onClick={() => handleDropdownNavigate('/')}
              >
                <HiOutlineUser /> Dashboard
              </button>
              <button
                className="avatar-dropdown-link"
                onClick={() => handleDropdownNavigate('/settings')}
              >
                <HiOutlineCog /> Settings
              </button>
              <button className="avatar-dropdown-link" onClick={handleLogout}>
                <HiOutlineLogout /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
