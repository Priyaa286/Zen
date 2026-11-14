import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader } from '@/components/common/Loader';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Loader
        fullScreen
        label="Checking your Zen Global session..."
        sublabel="Verifying account preferences"
      />
    );
  }

  if (!isAuthenticated) {
    const redirectTarget = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(redirectTarget)}`}
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;

