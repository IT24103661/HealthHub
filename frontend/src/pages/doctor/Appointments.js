import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Filter, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  CalendarDays,
  UserCheck,
  UserX,
  Stethoscope,
  Clock3,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronDown,
  SlidersHorizontal,
  Download,
  Printer,
  Mail,
  MessageSquare,
  List
} from 'lucide-react';
import { format, parseISO, isToday, isPast, isFuture, isThisWeek, isThisMonth, addDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { Bar, Doughnut } from 'react-chartjs-2';
import 'chart.js/auto';

// Enhanced mock data with more realistic information
const mockAppointments = Array.from({ length: 25 }, (_, i) => {
  const types = ['Consultation', 'Follow-up', 'Check-up', 'Procedure', 'Vaccination', 'Therapy'];
  const statuses = ['scheduled', 'completed', 'cancelled', 'no-show'];
  const reasons = [
    'Routine check-up',
    'Medication review',
    'Pain management',
    'Test results',
    'Post-operation follow-up',
    'New patient visit',
    'Annual physical',
    'Vaccination',
    'Therapy session'
  ];
  
  const date = new Date();
  date.setDate(date.getDate() + (i % 7) - 3); // Mix of past and future dates
  
  return {
    id: `appt-${1000 + i}`,
    patient: `Patient ${i + 1}`,
    patientId: `pat-${1000 + i}`,
    date: date.toISOString().split('T')[0],
    time: `${9 + (i % 8)}:${i % 2 === 0 ? '00' : '30'} ${i < 8 ? 'AM' : 'PM'}`,
    type: types[i % types.length],
    status: statuses[i % statuses.length],
    reason: reasons[i % reasons.length],
    duration: [30, 45, 60][i % 3],
    notes: i % 3 === 0 ? 'Patient has allergies to penicillin' : '',
    doctor: 'Dr. Smith',
    location: i % 2 === 0 ? 'Main Clinic' : 'Downtown Office',
    insurance: i % 4 === 0 ? 'Medicare' : ['Blue Cross', 'Aetna', 'Cigna', 'United Health'][i % 4],
    lastVisit: i % 5 === 0 ? null : new Date(Date.now() - (i * 2 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
  };
});

// Calculate appointment statistics
const calculateStats = (appointments) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekEnd = addDays(todayStart, 7);
  
  return {
    total: appointments.length,
    today: appointments.filter(a => isToday(parseISO(a.date))).length,
    upcoming: appointments.filter(a => 
      isFuture(parseISO(`${a.date}T${a.time}`)) && 
      isWithinInterval(parseISO(`${a.date}T${a.time}`), { start: now, end: weekEnd })
    ).length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
    noShow: appointments.filter(a => a.status === 'no-show').length,
    byType: appointments.reduce((acc, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + 1;
      return acc;
    }, {}),
    byStatus: appointments.reduce((acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {})
  };
};

const Appointments = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const appointmentsPerPage = 8;
  
  // Calculate statistics
  const stats = useMemo(() => calculateStats(mockAppointments), []);
  
  // Get unique types and locations for filters
  const appointmentTypes = useMemo(() => {
    const types = new Set(mockAppointments.map(a => a.type));
    return Array.from(types).sort();
  }, []);
  
  const locations = useMemo(() => {
    const locs = new Set(mockAppointments.map(a => a.location));
    return Array.from(locs).sort();
  }, []);

  const filteredAppointments = useMemo(() => {
    return mockAppointments.filter(appt => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        appt.patient.toLowerCase().includes(searchLower) ||
        appt.type.toLowerCase().includes(searchLower) ||
        appt.reason.toLowerCase().includes(searchLower) ||
        appt.insurance?.toLowerCase().includes(searchLower);
      
      const matchesStatus = statusFilter === 'all' || appt.status === statusFilter;
      const matchesType = typeFilter === 'all' || appt.type === typeFilter;
      const matchesLocation = locationFilter === 'all' || appt.location === locationFilter;
      
      const apptDateTime = parseISO(`${appt.date}T${appt.time}`);
      const now = new Date();
      let matchesDate = true;
      
      if (dateFilter === 'today') {
        matchesDate = isToday(parseISO(appt.date));
      } else if (dateFilter === 'week') {
        matchesDate = isThisWeek(parseISO(appt.date)) && isFuture(apptDateTime);
      } else if (dateFilter === 'month') {
        matchesDate = isThisMonth(parseISO(appt.date));
      } else if (dateFilter === 'past') {
        matchesDate = isPast(apptDateTime) && !isToday(parseISO(appt.date));
      } else if (dateFilter === 'upcoming') {
        matchesDate = isFuture(apptDateTime) || isToday(parseISO(appt.date));
      }
      
      return matchesSearch && matchesStatus && matchesDate && matchesType && matchesLocation;
    }).sort((a, b) => {
      // Sort by date and time
      const dateA = parseISO(`${a.date}T${a.time}`);
      const dateB = parseISO(`${b.date}T${b.time}`);
      return dateA - dateB;
    });
  }, [searchTerm, statusFilter, dateFilter, typeFilter, locationFilter]);
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage);
  
  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Handle view details
  const handleViewDetails = (appointment) => {
    navigate(`/doctor/appointments/${appointment.id}`, { state: { appointment } });
  };
  
  // Handle status update
  const handleStatusUpdate = (appointmentId, newStatus) => {
    // In a real app, this would be an API call
    console.log(`Updating appointment ${appointmentId} to ${newStatus}`);
    // Update UI optimistically
    // setAppointments(prev => prev.map(a => 
    //   a.id === appointmentId ? { ...a, status: newStatus } : a
    // ));
  };
  
  // Chart data for appointment statistics
  const statusChartData = {
    labels: Object.keys(stats.byStatus),
    datasets: [{
      data: Object.values(stats.byStatus),
      backgroundColor: [
        '#3b82f6', // blue-500
        '#10b981', // emerald-500
        '#ef4444', // red-500
        '#f59e0b'  // amber-500
      ],
      borderWidth: 0,
      cutout: '70%'
    }]
  };
  
  const typeChartData = {
    labels: Object.keys(stats.byType),
    datasets: [{
      label: 'Appointments by Type',
      data: Object.values(stats.byType),
      backgroundColor: [
        'rgba(99, 102, 241, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(139, 92, 246, 0.8)'
      ],
      borderColor: [
        'rgba(99, 102, 241, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(236, 72, 153, 1)',
        'rgba(139, 92, 246, 1)'
      ],
      borderWidth: 1
    }]
  };
  
  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      scheduled: { bg: 'bg-blue-100 text-blue-800', icon: <Clock3 className="h-4 w-4" /> },
      completed: { bg: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="h-4 w-4" /> },
      cancelled: { bg: 'bg-red-100 text-red-800', icon: <X className="h-4 w-4" /> },
      'no-show': { bg: 'bg-amber-100 text-amber-800', icon: <UserX className="h-4 w-4" /> },
    };
    
    const config = statusConfig[status] || { bg: 'bg-gray-100 text-gray-800', icon: <AlertCircle className="h-4 w-4" /> };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg}`}>
        {config.icon}
        <span className="ml-1 capitalize">{status}</span>
      </span>
    );
  };
  
  // Get paginated appointments
  const paginatedAppointments = useMemo(() => {
    const startIndex = (currentPage - 1) * appointmentsPerPage;
    return filteredAppointments.slice(startIndex, startIndex + appointmentsPerPage);
  }, [filteredAppointments, currentPage]);

  const getStatusBadge = (status) => {
    const statusClasses = {
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      'no-show': 'bg-yellow-100 text-yellow-800',
    };
    
    const statusText = {
      scheduled: 'Scheduled',
      completed: 'Completed',
      cancelled: 'Cancelled',
      'no-show': 'No Show',
    };
    
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status]}`}>
        {statusText[status]}
      </span>
    );
  };

  const handleViewAppointment = (id) => {
    navigate(`/doctor/appointments/${id}`);
  };

  const handleEditAppointment = (e, id) => {
    e.stopPropagation();
    navigate(`/doctor/appointments/${id}/edit`);
  };

  const handleDeleteAppointment = (e, id) => {
    e.stopPropagation();
    // Implement delete logic
    console.log('Delete appointment', id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and schedule patient appointments
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <select
                className="block w-full md:w-auto pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No Show</option>
              </select>
              
              <select
                className="block w-full md:w-auto pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>
              
              <select
                className="block w-full md:w-auto pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                {appointmentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              
              <select
                className="block w-full md:w-auto pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <option value="all">All Locations</option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
              
              <Link
                to="/doctor/appointments/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Appointment
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <CalendarDays className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Today's Appointments</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stats.today}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <UserCheck className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stats.completed}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <Clock3 className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Upcoming</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stats.upcoming}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                  <UserX className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">No Shows</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stats.noShow}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Appointments List */}
          <div className="flex-1">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Recent Appointments
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      className={`inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium ${
                        viewMode === 'list' 
                          ? 'bg-blue-50 border-blue-500 text-blue-700' 
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4 mr-1.5" />
                      List
                    </button>
                    <button
                      type="button"
                      className={`inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium ${
                        viewMode === 'calendar' 
                          ? 'bg-blue-50 border-blue-500 text-blue-700' 
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => setViewMode('calendar')}
                    >
                      <CalendarDays className="h-4 w-4 mr-1.5" />
                      Calendar
                    </button>
                  </div>
                </div>
              </div>
              
              {viewMode === 'list' ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Patient
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedAppointments.length > 0 ? (
                        paginatedAppointments.map((appointment) => (
                          <tr key={appointment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <User className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {appointment.patient}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {appointment.patientId}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {format(parseISO(appointment.date), 'MMM d, yyyy')}
                              </div>
                              <div className="text-sm text-gray-500">
                                {appointment.time}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {appointment.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusBadge status={appointment.status} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleViewDetails(appointment)}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                View
                              </button>
                              <button className="text-gray-600 hover:text-gray-900">
                                <MoreVertical className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                            No appointments found matching your criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                            currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                            currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{(currentPage - 1) * appointmentsPerPage + 1}</span> to{' '}
                            <span className="font-medium">
                              {Math.min(currentPage * appointmentsPerPage, filteredAppointments.length)}
                            </span>{' '}
                            of <span className="font-medium">{filteredAppointments.length}</span> results
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                              onClick={() => handlePageChange(1)}
                              disabled={currentPage === 1}
                              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                                currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              <span className="sr-only">First</span>
                              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                              <ChevronLeft className="h-5 w-5 -ml-2" aria-hidden="true" />
                            </button>
                            <button
                              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                                currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              <span className="sr-only">Previous</span>
                              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                            </button>
                            
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }
                              
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => handlePageChange(pageNum)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    currentPage === pageNum
                                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                            
                            <button
                              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                              disabled={currentPage === totalPages}
                              className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                                currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              <span className="sr-only">Next</span>
                              <ChevronRight className="h-5 w-5" aria-hidden="true" />
                            </button>
                            <button
                              onClick={() => handlePageChange(totalPages)}
                              disabled={currentPage === totalPages}
                              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                                currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              <span className="sr-only">Last</span>
                              <ChevronRight className="h-5 w-5" aria-hidden="true" />
                              <ChevronRight className="h-5 w-5 -ml-2" aria-hidden="true" />
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <CalendarDays className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Calendar View</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Calendar view is coming soon. For now, please use the list view.
                  </p>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <List className="h-4 w-4 mr-2" />
                      Switch to List View
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Sidebar with Stats */}
          <div className="lg:w-80 space-y-6">
            {/* Status Overview */}
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Appointment Status</h3>
              <div className="h-48">
                <Doughnut
                  data={statusChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          boxWidth: 12,
                          padding: 15,
                          usePointStyle: true,
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/doctor/appointments/new"
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Appointment
                </Link>
                <button
                  type="button"
                  onClick={() => setViewMode('calendar')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <CalendarDays className="h-4 w-4 mr-2" />
                  View Calendar
                </button>
                <button
                  type="button"
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </button>
              </div>
            </div>
            
            {/* Today's Schedule */}
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Schedule</h3>
              {mockAppointments
                .filter(appt => isToday(parseISO(appt.date)))
                .slice(0, 3)
                .map((appt) => (
                  <div key={appt.id} className="mb-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0 last:mb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{appt.patient}</p>
                        <p className="text-sm text-gray-500">{appt.time} • {appt.type}</p>
                      </div>
                      <StatusBadge status={appt.status} />
                    </div>
                  </div>
                ))}
              {mockAppointments.filter(appt => isToday(parseISO(appt.date))).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-2">No appointments scheduled for today.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appointments;
