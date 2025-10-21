import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  Calendar, 
  Clock, 
  Users, 
  Stethoscope, 
  FileText, 
  Plus, 
  Search, 
  Bell, 
  User, 
  Clock as ClockIcon,
  Calendar as CalendarIcon,
  Activity,
  AlertCircle
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { Line, Bar } from 'react-chartjs-2';
import 'chart.js/auto';

// Mock data - replace with real API calls
const mockStats = {
  totalAppointments: 124,
  todayAppointments: 8,
  totalPatients: 42,
  pendingPrescriptions: 5,
};

const mockAppointments = [
  { id: 1, patient: 'John Doe', time: '09:30 AM', type: 'Follow-up', status: 'confirmed' },
  { id: 2, patient: 'Jane Smith', time: '10:15 AM', type: 'Consultation', status: 'confirmed' },
  { id: 3, patient: 'Robert Johnson', time: '11:00 AM', type: 'New Patient', status: 'pending' },
  { id: 4, patient: 'Emily Davis', time: '02:00 PM', type: 'Follow-up', status: 'confirmed' },
];

const mockPatients = [
  { id: 1, name: 'John Doe', lastVisit: '2025-10-15', nextAppointment: '2025-10-28' },
  { id: 2, name: 'Jane Smith', lastVisit: '2025-10-18', nextAppointment: '2025-11-02' },
  { id: 3, name: 'Michael Brown', lastVisit: '2025-10-19', nextAppointment: '2025-10-29' },
];

const Dashboard = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Chart data
  const weeklyStats = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Appointments',
        data: [12, 19, 8, 15, 10, 5, 2],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const patientAgeData = {
    labels: ['0-18', '19-30', '31-45', '46-60', '60+'],
    datasets: [
      {
        label: 'Patients by Age',
        data: [15, 35, 25, 15, 10],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(139, 92, 246, 0.7)',
          'rgba(239, 68, 68, 0.7)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const formatDate = (dateString) => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d, yyyy');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none">
              <Bell className="h-6 w-6" />
            </button>
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                {user?.name?.charAt(0) || 'D'}
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">
                {user?.name || 'Doctor'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-5 mt-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { 
              title: 'Total Appointments', 
              value: mockStats.totalAppointments, 
              icon: <Calendar className="h-6 w-6 text-blue-500" />,
              change: '+12% from last month',
              color: 'blue'
            },
            { 
              title: "Today's Appointments", 
              value: mockStats.todayAppointments, 
              icon: <Clock className="h-6 w-6 text-green-500" />,
              change: '+2 from yesterday',
              color: 'green'
            },
            { 
              title: 'Total Patients', 
              value: mockStats.totalPatients, 
              icon: <Users className="h-6 w-6 text-yellow-500" />,
              change: '+5 new this month',
              color: 'yellow'
            },
            { 
              title: 'Pending Prescriptions', 
              value: mockStats.pendingPrescriptions, 
              icon: <FileText className="h-6 w-6 text-red-500" />,
              change: '2 awaiting review',
              color: 'red'
            },
          ].map((stat, index) => (
            <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-md bg-${stat.color}-100`}>
                      {stat.icon}
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.title}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stat.value}
                        </div>
                      </dd>
                      <dt className="text-xs text-gray-500 mt-1">
                        {stat.change}
                      </dt>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">Today's Schedule</h2>
            <button 
              onClick={() => navigate('/doctor/appointments/new')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="-ml-1 mr-2 h-4 w-4" />
              New Appointment
            </button>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {format(new Date(), 'EEEE, MMMM d, yyyy')}
                </h3>
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  {mockAppointments.length} Appointments
                </span>
              </div>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {mockAppointments.map((appointment) => (
                  <li key={appointment.id} className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/doctor/appointments/${appointment.id}`)}>
                    <div className="flex items-center">
                      <div className="min-w-0 flex-1 flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1 px-4">
                          <div>
                            <p className="text-sm font-medium text-blue-600 truncate">
                              {appointment.patient}
                            </p>
                            <p className="mt-1 flex items-center text-sm text-gray-500">
                              <ClockIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              {appointment.time} • {appointment.type}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          appointment.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Patient Demographics */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Patient Demographics
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Age distribution of your patients
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="h-64">
                <Bar 
                  data={patientAgeData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Recent Patients */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Patients
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Patients with upcoming appointments
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <ul className="divide-y divide-gray-200">
                {mockPatients.map((patient) => (
                  <li key={patient.id} className="py-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/doctor/patients/${patient.id}`)}>
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {patient.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Last visit: {formatDate(patient.lastVisit)}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                          {formatDate(patient.nextAppointment)}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 text-center">
                <button
                  onClick={() => navigate('/doctor/patients')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  View All Patients
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: 'New Prescription',
                description: 'Create and send a new prescription',
                icon: <FileText className="h-6 w-6 text-white" />,
                color: 'bg-blue-500',
                onClick: () => navigate('/doctor/prescriptions/new'),
              },
              {
                title: 'View Appointments',
                description: 'Check your schedule',
                icon: <Calendar className="h-6 w-6 text-white" />,
                color: 'bg-green-500',
                onClick: () => navigate('/doctor/appointments'),
              },
              {
                title: 'Patient Records',
                description: 'Access patient medical history',
                icon: <Stethoscope className="h-6 w-6 text-white" />,
                color: 'bg-purple-500',
                onClick: () => navigate('/doctor/patients'),
              },
              {
                title: 'All Prescriptions',
                description: 'View and manage prescriptions',
                icon: <FileText className="h-6 w-6 text-white" />,
                color: 'bg-yellow-500',
                onClick: () => navigate('/doctor/prescriptions'),
              },
            ].map((action, index) => (
              <div 
                key={index} 
                className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200"
                onClick={action.onClick}
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 p-3 rounded-md ${action.color}`}>
                      {action.icon}
                    </div>
                    <div className="ml-5">
                      <h3 className="text-lg font-medium text-gray-900">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
