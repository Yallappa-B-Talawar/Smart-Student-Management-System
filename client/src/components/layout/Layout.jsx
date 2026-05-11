import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

const pageTitles = {
  '/': 'Dashboard',
  '/students': 'Students',
  '/teachers': 'Teachers',
  '/attendance': 'Attendance',
  '/settings': 'Settings',
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const pageTitle = pageTitles[location.pathname] || 'Dashboard';

  return (
    <div className="layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="layout-main">
        <Header
          onMenuToggle={() => setSidebarOpen(prev => !prev)}
          pageTitle={pageTitle}
        />
        <main id="main-content" className="layout-content" role="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
