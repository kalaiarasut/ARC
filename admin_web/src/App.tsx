import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { Layout } from './components/Layout';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CustomThemeProvider } from './contexts/ThemeContext';

const Dashboard = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const Reports = lazy(() => import('./pages/Reports').then((module) => ({ default: module.Reports })));
const Login = lazy(() => import('./pages/Login').then((module) => ({ default: module.Login })));
const MapView = lazy(() => import('./pages/MapView').then((module) => ({ default: module.MapView })));
const Advisories = lazy(() => import('./pages/Advisories').then((module) => ({ default: module.Advisories })));
const GeneratedZones = lazy(() => import('./pages/GeneratedZones').then((module) => ({ default: module.GeneratedZones })));
const AuditLogs = lazy(() => import('./pages/AuditLogs').then((module) => ({ default: module.AuditLogs })));
const ApiReference = lazy(() => import('./pages/ApiReference').then((module) => ({ default: module.ApiReference })));
const Users = lazy(() => import('./pages/Users').then((module) => ({ default: module.Users })));
const UserDetails = lazy(() => import('./pages/UserDetails').then((module) => ({ default: module.UserDetails })));
const UserForm = lazy(() => import('./pages/UserForm').then((module) => ({ default: module.UserForm })));
const Organizations = lazy(() => import('./pages/Organizations').then((module) => ({ default: module.Organizations })));
const Verifications = lazy(() => import('./pages/Verifications').then((module) => ({ default: module.Verifications })));
const VerificationCaseReview = lazy(() => import('./pages/VerificationCaseReview'));

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
            <Route path="*" element={<Login />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
    </CustomThemeProvider>
  );
}

export default App;
