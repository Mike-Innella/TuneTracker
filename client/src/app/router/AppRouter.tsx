import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "../../features/auth/state/useAuth";
import RouteLoadingState from "../../shared/ui/RouteLoadingState";

import AuthScreen from "../../features/auth/pages/AuthScreen";
import MyProjects from "../../features/projects/pages/MyProjects";
import ProjectBoard from "../../features/projects/pages/ProjectBoard";
import TrackDetail from "../../features/projects/pages/TrackDetail";
import PublicProjectView from "../../features/social/pages/PublicProjectView";
import FeedPage from "../../features/social/pages/FeedPage";
import PostDetailPage from "../../features/social/pages/PostDetailPage";
import ProfilePage from "../../features/profile/pages/ProfilePage";
import UserDashboard from "../../features/dashboard/pages/UserDashboard";

// main router for the app
export default function AppRouter() {
  const { user, loading } = useAuth();

  return (
    <Routes>

      {/* root redirect based on auth state */}
      <Route
        path="/"
        element={
          loading ? (
            <RouteLoadingState />
          ) : user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/auth" replace />
          )
        }
      />

      {/* public routes */}
      <Route
        path="/auth"
        element={
          loading ? (
            <RouteLoadingState />
          ) : user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AuthScreen />
          )
        }
      />
      <Route path="/public/:projectId" element={<PublicProjectView />} />
      <Route path="/feed" element={<FeedPage />} />
      <Route path="/feed/:postId" element={<PostDetailPage />} />

      {/* protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <MyProjects />
          </ProtectedRoute>
        }
      />

      <Route
        path="/projects/:projectId"
        element={
          <ProtectedRoute>
            <ProjectBoard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/projects/:projectId/tracks/:trackId"
        element={
          <ProtectedRoute>
            <TrackDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}
