import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../../features/auth/state/useAuth";
import RouteLoadingState from "../../shared/ui/RouteLoadingState";

// wrapper for routes that require login
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  // prevent redirect flicker while checking session
  if (loading) return <RouteLoadingState />;

  // redirect if not authenticated
  if (!user) return <Navigate to="/auth" replace />;

  return <>{children}</>;
}
