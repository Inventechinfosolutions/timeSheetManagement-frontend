import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../hooks";
import { UserType } from "../enums";
import { Storage } from "../utils/storage-util";
import { WorksphereLogoLoader } from "./ApiLoadingSpinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Single role allowed (legacy). */
  allowedRole?: UserType;
  /** Multiple roles allowed (e.g. [ADMIN, RECEPTIONIST] for admin dashboard). */
  allowedRoles?: UserType[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRole,
  allowedRoles,
}) => {
  const { isAuthenticated, currentUser, loading } = useAppSelector(
    (state) => state.user,
  );
  const location = useLocation();
  const token = Storage.session.get("TimeSheet-authenticationToken");

  if (loading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center bg-white/75 backdrop-blur-[4px] z-[99999]"
        aria-busy="true"
        aria-label="Loading"
      >
        <WorksphereLogoLoader />
      </div>
    );
  }

  if (!isAuthenticated || !token) {
    return <Navigate to="/landing" state={{ from: location, skipSplash: true }} replace />;
  }

  const roles = allowedRoles ?? (allowedRole ? [allowedRole] : undefined);
  if (roles && roles.length > 0 && currentUser?.userType) {
    const allowed = roles.includes(currentUser.userType);
    if (!allowed) {
      return <Navigate to="/landing" state={{ skipSplash: true }} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
