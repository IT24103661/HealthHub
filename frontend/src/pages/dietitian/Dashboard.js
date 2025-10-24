import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import { 
  FaUserFriends, 
  FaClipboardList, 
  FaCalendarAlt, 
  FaBell,
  FaChartLine,
  FaUserMd,
  FaSearch,
  FaPlus,
  FaTimes,
  FaTrash,
  FaSave,
  FaFilter
} from 'react-icons/fa';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { useApp } from '../../context/AppContext';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const DietitianDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useApp();
  const [stats, setStats] = useState({
    assignedPatients: 0,
    totalPlans: 0,
    upcomingAppointments: 0,
    newMessages: 0
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - replace with actual API calls
  useEffect(() => {
    // Simulate API call
    const fetchDashboardData = async () => {
      // In a real app, you would fetch this data from your backend
      setTimeout(() => {
        setStats({
          assignedPatients: 24,
          totalPlans: 45,
          upcomingAppointments: 7,
          newMessages: 3
        });

        setRecentActivities([
          { id: 1, type: 'appointment', message: 'New appointment with John Doe', time: '10 mins ago' },
          { id: 2, type: 'patient', message: 'Sarah Johnson updated her health data', time: '2 hours ago' },
          { id: 3, type: 'plan', message: 'Diet plan for Michael Brown is due for review', time: '1 day ago' },
          { id: 4, type: 'message', message: 'New message from Robert Wilson', time: '2 days ago' },
        ]);
      }, 500);
    };

    fetchDashboardData();
  }, []);

  // Chart data
  const patientData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Active Patients',
        data: [12, 19, 15, 17, 20, 18, 22],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  const planData = {
    labels: ['Weight Loss', 'Muscle Gain', 'Diabetic', 'Vegan', 'Other'],
    datasets: [
      {
        data: [12, 19, 5, 7, 3],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(139, 92, 246, 0.7)',
          'rgba(239, 68, 68, 0.7)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const StatCard = ({ icon, title, value, color }) => (
    <div className="bg-white rounded-lg shadow p-6 flex items-center">
      <div className={`p-3 rounded-full ${color} bg-opacity-10 text-${color.split('-')[1]}`}>
        {icon}
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );

  const ActivityItem = ({ activity }) => {
    const getIcon = () => {
      switch (activity.type) {
        case 'appointment':
          return <FaCalendarAlt className="text-blue-500" />;
        case 'patient':
          return <FaUserFriends className="text-green-500" />;
        case 'plan':
          return <FaClipboardList className="text-yellow-500" />;
        case 'message':
          return <FaBell className="text-purple-500" />;
        default:
          return <FaBell className="text-gray-400" />;
      }
    };

    return (
      <div className="flex items-start py-3 border-b border-gray-100 last:border-0">
        <div className="flex-shrink-0 mt-1">
          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
            {getIcon()}
          </div>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900">{activity.message}</p>
          <p className="text-xs text-gray-500">{activity.time}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Dietitian Dashboard</h1>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <nav className="mt-4 flex space-x-8 border-b border-gray-200">
            <NavLink
              to="/dietitian/dashboard"
              className={({ isActive }) => 
                `whitespace-nowrap py-4 px-1 border-b-2 text-sm font-medium ${
                  isActive 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/dietitian/diet-plans"
              className={({ isActive }) => 
                `whitespace-nowrap py-4 px-1 border-b-2 text-sm font-medium ${
                  isActive 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }
            >
              Diet Plans
            </NavLink>
            <NavLink
              to="/dietitian/patients"
              className={({ isActive }) => 
                `whitespace-nowrap py-4 px-1 border-b-2 text-sm font-medium ${
                  isActive 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }
            >
              Patients
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            icon={<FaUserFriends className="h-6 w-6" />} 
            title="Assigned Patients" 
            value={stats.assignedPatients}
            color="bg-blue-100 text-blue-600"
          />
          <StatCard 
            icon={<FaClipboardList className="h-6 w-6" />} 
            title="Total Diet Plans" 
            value={stats.totalPlans}
            color="bg-green-100 text-green-600"
          />
          <StatCard 
            icon={<FaCalendarAlt className="h-6 w-6" />} 
            title="Upcoming Appointments" 
            value={stats.upcomingAppointments}
            color="bg-yellow-100 text-yellow-600"
          />
          <StatCard 
            icon={<FaBell className="h-6 w-6" />} 
            title="New Messages" 
            value={stats.newMessages}
            color="bg-purple-100 text-purple-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Patient Activity Chart */}
          <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Patient Activity</h2>
              <select className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                <option>This Week</option>
                <option>Last Week</option>
                <option>This Month</option>
              </select>
            </div>
            <div className="h-64">
              <Bar 
                data={patientData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      display: false
                    }
                  }
                }} 
              />
            </div>
          </div>

          {/* Plan Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Plan Distribution</h2>
            <div className="h-64">
              <Pie 
                data={planData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                    }
                  }
                }} 
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activities */}
          <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activities</h2>
            <div className="space-y-2">
              {recentActivities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
              <button 
                className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-800"
                onClick={() => navigate('/activities')}
              >
                View all activities
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button 
                  className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  onClick={() => navigate('/dietitian/patients')}
                >
                  <span className="text-sm font-medium">View All Patients</span>
                  <FaUserFriends className="h-4 w-4 text-gray-400" />
                </button>
                <button 
                  className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  onClick={() => navigate('/dietitian/plans')}
                >
                  <span className="text-sm font-medium">Manage Diet Plans</span>
                  <FaClipboardList className="h-4 w-4 text-gray-400" />
                </button>
                <button 
                  className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  onClick={() => navigate('/dietitian/plans/new')}
                >
                  <span className="text-sm font-medium">Create New Diet Plan</span>
                  <FaClipboardList className="h-4 w-4 text-gray-400" />
                </button>
                <button 
                  className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  onClick={() => navigate('/dietitian/appointments')}
                >
                  <span className="text-sm font-medium">Schedule Appointment</span>
                  <FaCalendarAlt className="h-4 w-4 text-gray-400" />
                </button>
                <button 
                  className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  onClick={() => navigate('/dietitian/reports')}
                >
                  <span className="text-sm font-medium">Generate Report</span>
                  <FaChartLine className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Upcoming Appointments</h2>
              <div className="space-y-4">
                {[1, 2].map((item) => (
                  <div key={item} className="flex items-start">
                    <div className="flex-shrink-0 bg-blue-100 rounded-lg p-2">
                      <FaUserMd className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {item === 1 ? 'John Doe' : 'Sarah Johnson'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item === 1 ? 'Today, 2:30 PM' : 'Tomorrow, 10:00 AM'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item === 1 ? 'Follow-up consultation' : 'Initial consultation'}
                      </p>
                    </div>
                  </div>
                ))}
                <button 
                  className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                  onClick={() => navigate('/dietitian/appointments')}
                >
                  View all appointments
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DietitianDashboard;
