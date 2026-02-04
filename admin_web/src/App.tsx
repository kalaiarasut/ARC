import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Reports } from './pages/Reports';
import { Login } from './pages/Login';
import { MapView } from './pages/MapView';
import { Advisories } from './pages/Advisories';
import { GeneratedZones } from './pages/GeneratedZones';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
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
          <Route path="*" element={<Login />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
