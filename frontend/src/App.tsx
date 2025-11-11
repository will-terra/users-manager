import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { UserEditPage } from "./pages/admin/UserEditPage";
import { UserNewPage } from "./pages/admin/UserNewPage";
import { UsersPage } from "./pages/admin/UsersPage";
import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";
import { Profile } from "./pages/profile/Profile";

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="profile" element={<Profile />} />

          {/* Admin Routes */}
          <Route path="admin">
            <Route
              path="dashboard"
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="users"
              element={
                <ProtectedRoute adminOnly>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="users/new"
              element={
                <ProtectedRoute adminOnly>
                  <UserNewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="users/:id/edit"
              element={
                <ProtectedRoute adminOnly>
                  <UserEditPage />
                </ProtectedRoute>
              }
            />
            {/* <Route path="imports" element={
              <ProtectedRoute adminOnly>
                <ImportPage />
              </ProtectedRoute>
            } /> */}
          </Route>

          {/* Redirect root to appropriate dashboard */}
          <Route index element={<Navigate to="/profile" replace />} />
        </Route>

        {/* 404 Page */}
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </Router>
  );
}

function App() {
  return <AppRoutes />;
}

export default App;
