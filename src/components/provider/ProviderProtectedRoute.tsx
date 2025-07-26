// Protected route component for provider authentication
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useProviderAuth } from '../../context/ProviderAuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface ProviderProtectedRouteProps {
  children: React.ReactNode;
}

export function ProviderProtectedRoute({ children }: ProviderProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useProviderAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Save the attempted location for redirecting after login
    return <Navigate to="/provider/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default ProviderProtectedRoute;