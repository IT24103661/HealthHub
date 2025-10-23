import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // Authentication state
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);

  // Users data (fetched for admin)
  const [users, setUsers] = useState([]);

  // Audit logs
  const [auditLogs, setAuditLogs] = useState([]);

  // Health data
  const [healthData, setHealthData] = useState([]);

  // Diet plans
  const [dietPlans, setDietPlans] = useState([]);

  // Appointments/Checkups
  const [appointments, setAppointments] = useState([]);

  // Medical reports
  const [reports, setReports] = useState([]);

  // Add loading state
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  // Authentication functions
  const login = async (email, password, role) => {
    try {
      // Shortcut for hardcoded admin credentials
      if (email?.toLowerCase() === 'admin@example.com' && password === 'admin123') {
        const adminUser = {
          id: 0,
          name: 'Administrator',
          email: 'admin@example.com',
          role: 'admin',
          phone: null,
          age: null,
          status: 'active',
        };
        setUser(adminUser);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(adminUser));
        return Promise.resolve(adminUser);
      }

      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          role,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const userData = {
          id: data.user.id,
          name: data.user.fullName,
          email: data.user.email,
          role: data.user.role,
          phone: data.user.phone,
          age: data.user.age,
          status: data.user.status,
        };
        
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData));
        
        return Promise.resolve(userData);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  // Health data functions
  const addHealthData = async (data) => {
    try {
      const response = await fetch('http://localhost:8080/healthdata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          age: data.age,
          weight: data.weight,
          height: data.height,
          activityLevel: data.activityLevel,
          allergies: data.allergies,
          medicalHistory: data.medicalConditions || data.medicalHistory,
          dietaryPreferences: data.dietaryPreferences,
          healthGoal: data.goals || data.healthGoal,
        }),
      });

      const savedData = await response.json();
      setHealthData([...healthData, savedData]);
      addNotification('success', 'Health data submitted successfully');
      addAuditLog('create', 'health_data', `Health data created for user ${user.name}`);
      return Promise.resolve(savedData);
    } catch (error) {
      console.error('Add health data error:', error);
      throw error;
    }
  };

  const updateHealthData = async (id, updates) => {
    try {
      const response = await fetch(`http://localhost:8080/healthdata/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          age: updates.age,
          weight: updates.weight,
          height: updates.height,
          activityLevel: updates.activityLevel,
          allergies: updates.allergies,
          medicalHistory: updates.medicalConditions || updates.medicalHistory,
          dietaryPreferences: updates.dietaryPreferences,
          healthGoal: updates.goals || updates.healthGoal,
        }),
      });

      const updatedData = await response.json();
      setHealthData(healthData.map(data => 
        data.id === id ? updatedData : data
      ));
      addNotification('success', 'Health data updated successfully');
      addAuditLog('update', 'health_data', `Health data updated for user ${user.name}`);
      return Promise.resolve(updatedData);
    } catch (error) {
      console.error('Update health data error:', error);
      throw error;
    }
  };

  const deleteHealthData = async (id) => {
    try {
      await fetch(`http://localhost:8080/healthdata/${id}`, {
        method: 'DELETE',
      });

      setHealthData(healthData.filter(data => data.id !== id));
      addNotification('success', 'Health data deleted successfully');
      addAuditLog('delete', 'health_data', `Health data deleted for user ${user.name}`);
      return Promise.resolve();
    } catch (error) {
      console.error('Delete health data error:', error);
      throw error;
    }
  };

  const getHealthDataByUserId = (userId) => {
    return healthData.filter(data => data.userId === userId);
  };

  // Diet plan functions
  const addDietPlan = (plan) => {
    const newPlan = {
      id: Date.now(),
      ...plan,
      createdAt: new Date(),
    };
    setDietPlans([...dietPlans, newPlan]);
    addNotification('success', 'Diet plan created successfully');
    return Promise.resolve(newPlan);
  };

  const updateDietPlan = (id, updates) => {
    setDietPlans(dietPlans.map(plan => 
      plan.id === id ? { ...plan, ...updates, updatedAt: new Date() } : plan
    ));
    addNotification('success', 'Diet plan updated successfully');
    addAuditLog('update', 'diet_plan', `Diet plan ${id} updated`);
  };

  const deleteDietPlan = (id) => {
    setDietPlans(dietPlans.filter(plan => plan.id !== id));
    addNotification('success', 'Diet plan deleted successfully');
    addAuditLog('delete', 'diet_plan', `Diet plan ${id} deleted`);
    return Promise.resolve();
  };

  const getDietPlansByUserId = (userId) => {
    return dietPlans.filter(plan => plan.userId === userId);
  };

  // Appointment functions
  const scheduleAppointment = (appointment) => {
    const newAppointment = {
      id: Date.now(),
      userId: user.id,
      status: 'pending',
      ...appointment,
      createdAt: new Date(),
    };
    setAppointments([...appointments, newAppointment]);
    addNotification('info', 'Appointment request submitted');
    return Promise.resolve(newAppointment);
  };

  const updateAppointment = (id, updates) => {
    setAppointments(appointments.map(apt => 
      apt.id === id ? { ...apt, ...updates, updatedAt: new Date() } : apt
    ));
    addNotification('success', 'Appointment updated successfully');
    addAuditLog('update', 'appointment', `Appointment ${id} updated`);
    return Promise.resolve();
  };

  const updateAppointmentStatus = (id, status) => {
    setAppointments(appointments.map(apt => 
      apt.id === id ? { ...apt, status, updatedAt: new Date() } : apt
    ));
    addNotification('success', `Appointment ${status}`);
    addAuditLog('update', 'appointment', `Appointment ${id} status changed to ${status}`);
  };

  const deleteAppointment = (id) => {
    setAppointments(appointments.filter(apt => apt.id !== id));
    addNotification('success', 'Appointment deleted successfully');
    addAuditLog('delete', 'appointment', `Appointment ${id} deleted`);
    return Promise.resolve();
  };

  // Report functions
  const addReport = (report) => {
    const newReport = {
      id: Date.now(),
      userId: user?.id || report.userId,
      ...report,
      createdAt: new Date(),
    };
    setReports([...reports, newReport]);
    addNotification('info', 'New medical report available');
    addAuditLog('create', 'report', `Medical report created for user ${report.userId}`);
    return Promise.resolve(newReport);
  };

  const updateReport = (id, updates) => {
    setReports(reports.map(report => 
      report.id === id ? { ...report, ...updates, updatedAt: new Date() } : report
    ));
    addNotification('success', 'Report updated successfully');
    addAuditLog('update', 'report', `Report ${id} updated`);
    return Promise.resolve();
  };

  const deleteReport = (id) => {
    setReports(reports.filter(report => report.id !== id));
    addNotification('success', 'Report deleted successfully');
    addAuditLog('delete', 'report', `Report ${id} deleted`);
    return Promise.resolve();
  };

  // User management (admin)
  // Load all users (admin)
  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/users');
      const data = await res.json();
      if (data.success) {
        const mapped = (data.users || []).map(u => ({
          id: u.id,
          name: u.fullName,
          email: u.email,
          role: u.role,
          phone: u.phone,
          age: u.age,
          status: u.status,
          createdAt: u.createdAt ? new Date(u.createdAt) : null,
        }));
        setUsers(mapped);
        return mapped;
      } else {
        throw new Error(data.message || 'Failed to load users');
      }
    } catch (e) {
      console.error('Fetch users error:', e);
      throw e;
    }
  };

  // Auto-load users when an admin signs in
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchUsers().catch(() => {});
    }
  }, [isAuthenticated, user?.role]);

  const createUser = async (userData) => {
    try {
      const response = await fetch('http://localhost:8080/api/auth/signup', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: userData.name,
          email: userData.email,
          password: userData.password || 'defaultPassword123',
          role: userData.role,
          phone: userData.phone || null,
          age: userData.age || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Also update local state
        const newUser = {
          id: data.user.id,
          name: data.user.fullName,
          email: data.user.email,
          role: data.user.role,
          phone: data.user.phone,
          age: data.user.age,
          status: data.user.status,
          createdAt: new Date(data.user.createdAt),
        };
        setUsers([...users, newUser]);
        addNotification('success', 'User created successfully');
        addAuditLog('create', 'user', `User ${userData.name} created with role ${userData.role}`);
        return Promise.resolve(newUser);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  };

  const updateUser = async (userId, updates) => {
    try {
      const payload = {
        fullName: updates.name,
        email: updates.email,
        role: updates.role,
        phone: updates.phone,
        age: updates.age,
        status: updates.status,
        password: updates.password,
      };
      const res = await fetch(`http://localhost:8080/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        const updatedUser = {
          id: data.user.id,
          name: data.user.fullName,
          email: data.user.email,
          role: data.user.role,
          phone: data.user.phone,
          age: data.user.age,
          status: data.user.status,
          createdAt: data.user.createdAt ? new Date(data.user.createdAt) : null,
        };
        setUsers(users.map(u => u.id === userId ? updatedUser : u));
        addNotification('success', 'User updated successfully');
        addAuditLog('update', 'user', `User ${userId} updated`);
        return updatedUser;
      } else {
        throw new Error(data.message || 'Failed to update user');
      }
    } catch (e) {
      console.error('Update user error:', e);
      throw e;
    }
  };

  const updateUserStatus = async (userId, status) => {
    try {
      const res = await fetch(`http://localhost:8080/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, status: data.user.status } : u));
        addNotification('success', `User status updated to ${status}`);
        addAuditLog('update', 'user', `User ${userId} status changed to ${status}`);
      } else {
        throw new Error(data.message || 'Failed to update status');
      }
    } catch (e) {
      console.error('Update status error:', e);
      throw e;
    }
  };

  const updateUserRole = async (userId, role) => {
    try {
      const res = await fetch(`http://localhost:8080/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: data.user.role } : u));
        addNotification('success', `User role updated to ${role}`);
        addAuditLog('update', 'user', `User ${userId} role changed to ${role}`);
      } else {
        throw new Error(data.message || 'Failed to update role');
      }
    } catch (e) {
      console.error('Update role error:', e);
      throw e;
    }
  };

  const deleteUser = async (userId) => {
    try {
      const res = await fetch(`http://localhost:8080/api/users/${userId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const deletedUser = users.find(u => u.id === userId);
        setUsers(users.filter(u => u.id !== userId));
        addNotification('success', 'User deleted successfully');
        addAuditLog('delete', 'user', `User ${deletedUser?.name} deleted`);
        return true;
      } else {
        throw new Error((data && data.message) || 'Failed to delete user');
      }
    } catch (e) {
      console.error('Delete user error:', e);
      throw e;
    }
  };

  // Notification functions
  const addNotification = (type, message) => {
    const newNotification = {
      id: Date.now(),
      type,
      message,
      read: false,
      timestamp: new Date(),
    };
    setNotifications([newNotification, ...notifications]);
  };

  const markNotificationRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Audit log functions
  const addAuditLog = (action, entity, description) => {
    const log = {
      id: Date.now(),
      action,
      entity,
      description,
      userId: user?.id,
      userName: user?.name,
      timestamp: new Date(),
    };
    setAuditLogs([log, ...auditLogs]);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    notifications,
    users,
    auditLogs,
    healthData,
    dietPlans,
    appointments,
    scheduleAppointment,
    updateAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    
    // Reports
    reports,
    addReport,
    updateReport,
    deleteReport,
    
    // Users (admin)
    users,
    createUser,
    updateUser,
    updateUserStatus,
    updateUserRole,
    deleteUser,
    
    // Notifications
    notifications,
    addNotification,
    markNotificationRead,
    clearNotifications,

    // Audit Logs
    auditLogs,
    addAuditLog,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
