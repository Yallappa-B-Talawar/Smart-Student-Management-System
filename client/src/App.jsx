import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
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
import './index.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
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
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
