import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Reports } from './pages/Reports';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Reports />} /> {/* Default to Reports for demo */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
