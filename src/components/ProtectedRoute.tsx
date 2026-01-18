import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../hooks';
import { UserType } from '../reducers/user.reducer';
import { Storage } from '../utils/storage-util';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: UserType;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const { isAuthenticated, currentUser, loading } = useAppSelector((state) => state.user);
  const location = useLocation();
  const token = Storage.session.get('TimeSheet-authenticationToken');

  // If we are still loading the initial auth state, we might want to show a loader
  // but for now, we'll rely on the checked state
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // 1. Check if authenticated
  if (!isAuthenticated || !token) {
    // Redirect to landing page, but save the current location they were trying to go to
    return <Navigate to="/landing" state={{ from: location }} replace />;
  }

  // 2. Check Role if specified
  if (allowedRole && currentUser?.userType !== allowedRole) {
    // If they are logged in but don't have the right role, send to landing
    // Or we could send them to their respective dashboard
    return <Navigate to="/landing" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
