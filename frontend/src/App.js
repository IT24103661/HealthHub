import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import AppointmentManagement from './pages/appointment/AppointmentManagement';
import DietitianDashboard from './pages/DietitianDashboard';
import AuditLogs from './pages/AuditLogs';
import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorAppointments from './pages/doctor/Appointments';
import DoctorPatients from './pages/doctor/Patients';
import DoctorPrescriptions from './pages/doctor/Prescriptions';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useApp();
  const location = useLocation();

  // Show loading state while checking auth
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If trying to access a role-restricted route without permission
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on role
    const redirectPath = user?.role === 'admin' ? '/admin/dashboard' : 
                        user?.role === 'receptionist' ? '/receptionist/dashboard' :
                        user?.role === 'dietitian' ? '/dietitian/dashboard' :
                        user?.role === 'doctor' ? '/doctor/dashboard' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
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
        path="/doctor/dashboard"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/appointments"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorAppointments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/patients"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorPatients />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/prescriptions"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorPrescriptions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/prescriptions/new"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorPrescriptions isNew={true} />
          </ProtectedRoute>
        }
      />
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
        path="/receptionist/dashboard"
        element={
          <ProtectedRoute allowedRoles={['receptionist']}>
            <ReceptionistDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/receptionist/appointments"
        element={
          <ProtectedRoute allowedRoles={['receptionist']}>
            <AppointmentManagement />
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