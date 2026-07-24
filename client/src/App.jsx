import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleGuard from './components/auth/RoleGuard';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Attendance from './pages/Attendance';
import MyAttendance from './pages/MyAttendance';
import Organizations from './pages/Organizations';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

/* Ensure all core CSS modules are explicitly imported in entry bundle */
import './index.css';
import './components/ui/Components.css';
import './components/layout/Layout.css';
import './components/layout/Sidebar.css';
import './components/layout/Header.css';
import './pages/Auth.css';
import './pages/Dashboard.css';

function ScrollHandler() {
  const { pathname } = useLocation();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
      infinite: false,
    });

    let frameId;
    function raf(time) {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    }
    frameId = requestAnimationFrame(raf);

    window.lenis = lenis;

    return () => {
      lenis.destroy();
      cancelAnimationFrame(frameId);
      window.lenis = null;
    };
  }, []);

  useEffect(() => {
    if (window.lenis) {
      window.lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Router>
              <ScrollHandler />
              <a href="#main-content" className="skip-link">
                Skip to main content
              </a>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected routes — all require login */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  {/* Dashboard — everyone */}
                  <Route index element={<Dashboard />} />

                  {/* Students — admin and teacher only */}
                  <Route
                    path="students"
                    element={
                      <RoleGuard allowed={['admin', 'teacher']}>
                        <Students />
                      </RoleGuard>
                    }
                  />

                  {/* Teachers — admin, teacher, and student (read-only for teacher/student) */}
                  <Route
                    path="teachers"
                    element={
                      <RoleGuard allowed={['admin', 'teacher', 'student']}>
                        <Teachers />
                      </RoleGuard>
                    }
                  />

                  {/* Attendance (mark) — admin and teacher only */}
                  <Route
                    path="attendance"
                    element={
                      <RoleGuard allowed={['admin', 'teacher']}>
                        <Attendance />
                      </RoleGuard>
                    }
                  />

                  {/* My Attendance — student only */}
                  <Route
                    path="my-attendance"
                    element={
                      <RoleGuard allowed={['student']}>
                        <MyAttendance />
                      </RoleGuard>
                    }
                  />

                  {/* Organizations — admin only */}
                  <Route
                    path="organizations"
                    element={
                      <RoleGuard allowed={['admin']}>
                        <Organizations />
                      </RoleGuard>
                    }
                  />

                  {/* Settings — everyone */}
                  <Route path="settings" element={<Settings />} />
                </Route>

                {/* Catch-all 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
