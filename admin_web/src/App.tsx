import { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { Layout } from './components/Layout';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CustomThemeProvider } from './contexts/ThemeContext';
import {
  Advisories,
  ApiReference,
  AuditLogs,
  Dashboard,
  GeneratedZones,
  Login,
  MapView,
  MarineConditions,
  Organizations,
  Reports,
  UserDetails,
  UserForm,
  Users,
  VerificationCaseReview,
  Verifications,
  warmCommonRoutes,
} from './routes/routePrefetch';

const RouteFallback = () => (
  <Box
    sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a4d68 0%, #088395 50%, #05bfdb 100%)',
    }}
  >
    <CircularProgress sx={{ color: 'white' }} />
  </Box>
);

function App() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    warmCommonRoutes();
  }, []);

  return (
    <CustomThemeProvider>
      <AuthProvider>
      <Router>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Login route without Layout - Default landing page */}
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />

            {/* Protected routes with Layout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout><Dashboard /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <Layout><Users /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/create"
              element={
                <ProtectedRoute>
                  <Layout><UserForm /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/:id"
              element={
                <ProtectedRoute>
                  <Layout><UserDetails /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/:id/edit"
              element={
                <ProtectedRoute>
                  <Layout><UserForm /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/organizations"
              element={
                <ProtectedRoute>
                  <Layout><Organizations /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/verifications"
              element={
                <ProtectedRoute>
                  <Layout><Verifications /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/verifications/:caseId"
              element={
                <ProtectedRoute>
                  <Layout><VerificationCaseReview /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Layout><Reports /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/map"
              element={
                <ProtectedRoute>
                  <Layout><MapView /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/advisories"
              element={
                <ProtectedRoute>
                  <Layout><Advisories /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/generated-zones"
              element={
                <ProtectedRoute>
                  <Layout><GeneratedZones /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute>
                  <Layout><AuditLogs /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/api-reference"
              element={
                <ProtectedRoute>
                  <Layout><ApiReference /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/marine-conditions"
              element={
                <ProtectedRoute>
                  <Layout><MarineConditions /></Layout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Login />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
    </CustomThemeProvider>
  );
}

export default App;
