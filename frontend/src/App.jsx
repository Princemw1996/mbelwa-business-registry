import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BusinessList from './pages/BusinessList';
import RegisterBusiness from './pages/RegisterBusiness';
import WardManagement from './pages/WardManagement';
import Reports from './pages/Reports';
import AuditLogs from './pages/AuditLogs';
import UserManagement from './pages/UserManagement';


const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="businesses" element={<BusinessList />} />
        <Route path="businesses/register" element={<RegisterBusiness />} />
        <Route path="wards" element={<BusinessList />} />
        <Route path="reports" element={<Reports />} />
        
        {/* Admin-only routes */}
        {user?.role === 'admin' && (
          <>
            <Route path="wards/manage" element={<WardManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="audit" element={<AuditLogs />} />
          </>
        )}
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;