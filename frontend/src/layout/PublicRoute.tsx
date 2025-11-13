import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (currentUser) {
    const redirectTo =
      currentUser.role === "admin" ? "/admin/dashboard" : "/profile";
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
