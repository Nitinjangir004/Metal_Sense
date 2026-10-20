import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children }: { children?: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page text-forest-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-forest-900" />
          <p className="text-sm font-medium text-body">Loading secure session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
