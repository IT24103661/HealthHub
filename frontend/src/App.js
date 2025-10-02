import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import HealthData from './pages/HealthData';
import DietPlans from './pages/DietPlans';
import ScheduleCheckup from './pages/ScheduleCheckup';
import Reports from './pages/Reports';
import AdminDashboard from './pages/AdminDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import DietitianDashboard from './pages/DietitianDashboard';
import AuditLogs from './pages/AuditLogs';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useApp();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
};

function AppRoutes() {
  const { isAuthenticated } = useApp();

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />}
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* User Routes */}
      <Route
        path="/health-data"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <HealthData />
          </ProtectedRoute>
        }
      />
      <Route
        path="/schedule-checkup"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <ScheduleCheckup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <Reports />
          </ProtectedRoute>
        }
      />

      {/* Doctor Routes */}
      <Route
        path="/diet-plans"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DietPlans />
          </ProtectedRoute>
        }
      />

      {/* Receptionist Routes */}
      <Route
        path="/receptionist/appointments"
        element={
          <ProtectedRoute allowedRoles={['receptionist']}>
            <ReceptionistDashboard />
          </ProtectedRoute>
        }
      />

      {/* Dietitian Routes */}
      <Route
        path="/dietitian/diet-plans"
        element={
          <ProtectedRoute allowedRoles={['dietitian']}>
            <DietitianDashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/logs"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AuditLogs />
          </ProtectedRoute>
        }
      />

      {/* Default Route */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AppProvider>
  );
}

export default App;