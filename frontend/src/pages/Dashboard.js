import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Table from '../components/Table';
import { Activity, Calendar, FileText, Users, TrendingUp, Clock } from 'lucide-react';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const { user, users, notifications, appointments, dietPlans, reports } = useApp();
  const navigate = useNavigate();
  const [healthData, setHealthData] = useState([]);

  // Calculate derived health data
  const latestHealthData = healthData.length > 0 ? healthData[healthData.length - 1] : null;
  const previousHealthData = healthData.length > 1 ? healthData[healthData.length - 2] : null;
  
  // Calculate weight difference if we have at least 2 entries
  const weightDifference = latestHealthData && previousHealthData 
    ? (latestHealthData.weight - previousHealthData.weight).toFixed(1)
    : null;
  
  // Count reports for the current user
  const userReports = reports.filter(report => report.userId === user?.id);

  // Fetch health data for the logged-in user
  useEffect(() => {
    const fetchHealthData = async () => {
      if (user && user.id) {
        try {
          const response = await fetch('http://localhost:8080/healthdata');
          const data = await response.json();
          // Filter and sort data for current user by date (newest first)
          const userHealthData = data
            .filter(item => item.userId === user.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
          setHealthData(userHealthData);
        } catch (error) {
          console.error('Error fetching health data:', error);
          toast.error('Failed to load health data');
        }
      }
    };
    fetchHealthData();
  }, [user]);

  const handleDeleteHealthData = async (id) => {
    if (window.confirm('Are you sure you want to delete this health data?')) {
      try {
        await fetch(`http://localhost:8080/healthdata/${id}`, {
          method: 'DELETE',
        });
        setHealthData(healthData.filter(item => item.id !== id));
        toast.success('Health data deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete health data');
      }
    }
  };

  const healthDataColumns = [
    {
      header: 'Date',
      render: (row) => new Date().toLocaleDateString(),
    },
    {
      header: 'Age',
      accessor: 'age',
    },
    {
      header: 'Weight (kg)',
      accessor: 'weight',
    },
    {
      header: 'Height (cm)',
      accessor: 'height',
    },
    {
      header: 'BMI',
      render: (row) => (
        <Badge variant={row.bmi < 18.5 ? 'warning' : row.bmi < 25 ? 'success' : 'danger'}>
          {row.bmi ? row.bmi.toFixed(1) : 'N/A'}
        </Badge>
      ),
    },
    {
      header: 'Activity Level',
      render: (row) => (
        <span className="capitalize">{row.activityLevel || 'N/A'}</span>
      ),
    },
    {
      header: 'Health Goal',
      render: (row) => (
        <span className="capitalize">{row.healthGoal || 'N/A'}</span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => navigate('/health-data', { state: { editData: row } })}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteHealthData(row.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const userDashboard = () => (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
        <p className="text-gray-600 mt-2">Here's your health overview</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Activity className="text-primary-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Current Weight</p>
              <p className="text-2xl font-bold text-gray-900">
                {latestHealthData ? `${latestHealthData.weight} kg` : 'N/A'}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Progress</p>
              <p className={`text-2xl font-bold ${weightDifference ? (weightDifference > 0 ? 'text-green-600' : 'text-red-600') : 'text-gray-900'}`}>
                {weightDifference ? `${weightDifference > 0 ? '+' : ''}${weightDifference} kg` : 'N/A'}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Calendar className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Reports</p>
              <p className="text-2xl font-bold text-gray-900">{userReports.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card title="Quick Actions" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="primary"
            onClick={() => navigate('/health-data')}
            className="w-full"
          >
            Update Health Data
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/schedule-checkup')}
            className="w-full"
          >
            Schedule Checkup
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/reports')}
            className="w-full"
          >
            View Reports
          </Button>
        </div>
      </Card>

      {/* Health Data Table */}
      <Card title="My Health Data" className="mb-6">
        {healthData.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500 mb-4">No health data recorded yet</p>
            <Button
              variant="primary"
              onClick={() => navigate('/health-data')}
            >
              Add Health Data
            </Button>
          </div>
        ) : (
          <Table columns={healthDataColumns} data={healthData} />
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Notifications */}
        <Card title="Recent Notifications">
          <div className="space-y-3">
            {notifications.slice(0, 5).map((notif) => (
              <div key={notif.id} className="p-3 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-900">{notif.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notif.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming Appointments */}
        <Card title="Upcoming Appointments">
          <div className="space-y-3">
            {appointments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No appointments scheduled</p>
            ) : (
              appointments.slice(0, 3).map((apt) => (
                <div key={apt.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(apt.date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">{apt.time}</p>
                    </div>
                    <Badge variant={apt.status === 'confirmed' ? 'success' : 'warning'}>
                      {apt.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );

  const doctorDashboard = () => (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your patients and diet plans</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Users className="text-primary-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900">24</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Diet Plans</p>
              <p className="text-2xl font-bold text-gray-900">{dietPlans.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Calendar className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Appointments</p>
              <p className="text-2xl font-bold text-gray-900">8</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Quick Actions" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="primary"
            onClick={() => navigate('/diet-plans')}
            className="w-full"
          >
            Create Diet Plan
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/appointments')}
            className="w-full"
          >
            View Appointments
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/patients')}
            className="w-full"
          >
            Manage Patients
          </Button>
        </div>
      </Card>
    </div>
  );

  const adminDashboard = () => (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">System overview and management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Users className="text-primary-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">156</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Activity className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">142</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FileText className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Diet Plans</p>
              <p className="text-2xl font-bold text-gray-900">89</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Appointments</p>
              <p className="text-2xl font-bold text-gray-900">45</p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Quick Actions" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="primary"
            onClick={() => navigate('/admin/users')}
            className="w-full"
          >
            Manage Users
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/admin/logs')}
            className="w-full"
          >
            View System Logs
          </Button>
          <Button
            variant="outline"
            className="w-full"
          >
            System Settings
          </Button>
        </div>
      </Card>
    </div>
  );

  const receptionistDashboard = () => (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Receptionist Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage appointments and patient schedules</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Calendar className="text-primary-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {appointments.filter(a => a.status === 'pending').length}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Activity className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-gray-900">
                {appointments.filter(a => a.status === 'confirmed').length}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Patients</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'user').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Quick Actions" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="primary"
            onClick={() => navigate('/receptionist/appointments')}
            className="w-full"
          >
            Manage Appointments
          </Button>
          <Button
            variant="secondary"
            className="w-full"
          >
            View Schedule
          </Button>
        </div>
      </Card>
    </div>
  );

  const dietitianDashboard = () => (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dietitian Assistant Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage diet plans and support patients</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <FileText className="text-primary-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Diet Plans</p>
              <p className="text-2xl font-bold text-gray-900">{dietPlans.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Patients</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'user').length}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Activity className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Plans</p>
              <p className="text-2xl font-bold text-gray-900">
                {dietPlans.filter(p => !p.updatedAt || 
                  (new Date() - new Date(p.createdAt)) < 30 * 24 * 60 * 60 * 1000).length}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <TrendingUp className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">87%</p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Quick Actions" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="primary"
            onClick={() => navigate('/dietitian/diet-plans')}
            className="w-full"
          >
            Manage Diet Plans
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/dietitian/patients')}
            className="w-full"
          >
            View Patients
          </Button>
        </div>
      </Card>
    </div>
  );

  return (
    <div>
      {user?.role === 'user' && userDashboard()}
      {user?.role === 'doctor' && doctorDashboard()}
      {user?.role === 'dietitian' && dietitianDashboard()}
      {user?.role === 'receptionist' && receptionistDashboard()}
      {user?.role === 'admin' && adminDashboard()}
    </div>
  );
};

export default Dashboard;
