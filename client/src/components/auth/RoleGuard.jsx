import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

/**
 * RoleGuard — Wraps a route and redirects unauthorized roles.
 *
 * Usage: <RoleGuard allowed={['admin', 'teacher']}><SomePage /></RoleGuard>
 *
 * If the user's role is not in `allowed`, redirects to "/" (dashboard).
 */
export default function RoleGuard({ allowed, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowed.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
