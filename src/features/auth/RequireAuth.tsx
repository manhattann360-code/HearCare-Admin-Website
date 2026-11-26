import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { LoadingBlock } from '@/components/ui/Spinner';

export function RequireAuth() {
  const { admin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingBlock label="Signing you in…" />;
  if (!admin) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}
