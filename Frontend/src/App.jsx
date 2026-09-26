import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

import AuthPage from './pages/AuthPage';
import DriverDashboard from './pages/driver/DriverDashboard';
import DriverRequests from './pages/driver/DriverRequests';
import PostTripModal from './pages/driver/PostTripModal';
import TripSearch from './pages/merchant/TripSearch';
import MerchantBookings from './pages/merchant/MerchantBookings';
import ProfilePage from './pages/shared/ProfilePage';

// Helper component to route "/" to the role-specific dashboard or /auth
function RootRedirect() {
  const { isAuthenticated, isDriver, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <Navigate to={isDriver ? '/driver/trips' : '/merchant/search'} replace />;
}

// Shell wrapper that gives authenticated routes the canonical 3-column LoadSwift layout
function AuthenticatedShell({ children }) {
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  return (
    <AppLayout onOpenPostTrip={() => setIsPostModalOpen(true)}>
      {React.cloneElement(children, {
        onOpenPostModal: () => setIsPostModalOpen(true),
      })}
      <PostTripModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onTripCreated={(newTrip) => {
          // Trigger reload if dashboard is active
          window.location.reload();
        }}
      />
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Route (Reference 1 Voyger layout) */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Root Redirector */}
          <Route path="/" element={<RootRedirect />} />

          {/* DRIVER ROUTES (Protected, role = driver) */}
          <Route
            path="/driver/trips"
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <AuthenticatedShell>
                  <DriverDashboard />
                </AuthenticatedShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/trips/new"
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <AuthenticatedShell>
                  <DriverDashboard />
                </AuthenticatedShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/requests"
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <AuthenticatedShell>
                  <DriverRequests />
                </AuthenticatedShell>
              </ProtectedRoute>
            }
          />

          {/* MERCHANT ROUTES (Protected, role = merchant) */}
          <Route
            path="/merchant/search"
            element={
              <ProtectedRoute allowedRoles={['merchant']}>
                <AuthenticatedShell>
                  <TripSearch />
                </AuthenticatedShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/bookings"
            element={
              <ProtectedRoute allowedRoles={['merchant']}>
                <AuthenticatedShell>
                  <MerchantBookings />
                </AuthenticatedShell>
              </ProtectedRoute>
            }
          />

          {/* SHARED ROUTES (Protected, any role) */}
          <Route
            path="/profile/:userId"
            element={
              <ProtectedRoute>
                <AuthenticatedShell>
                  <ProfilePage />
                </AuthenticatedShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AuthenticatedShell>
                  <ProfilePage />
                </AuthenticatedShell>
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
