import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '@feedbackhub/ui';

interface RedirectIfAuthenticatedProps {
  children?: React.ReactNode;
}

export const RedirectIfAuthenticated: React.FC<RedirectIfAuthenticatedProps> = ({ children }) => {
  const { isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        className="flex min-h-[60vh] flex-col items-center justify-center p-8"
        aria-live="polite"
        aria-busy="true"
      >
        <Spinner size="lg" className="text-brand-primary mb-4" />
        <p className="text-sm text-content-secondary">Checking session...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    const from =
      (location.state as { from?: { pathname?: string } })?.from?.pathname || '/account';
    return <Navigate to={from} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
