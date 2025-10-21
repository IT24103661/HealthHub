import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { format, isToday, isAfter, isBefore, addDays, parseISO, formatDistanceToNow, addHours } from 'date-fns';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { 
  Calendar, Clock, CheckCircle, XCircle, Edit, Search, Filter, 
  User, Phone, Mail, ChevronDown, Sun, Moon, Bell, 
  Plus, Calendar as CalendarIcon, UserCheck, UserX, 
  Clock as ClockIcon, MoreVertical, ArrowRight, CalendarCheck, 
  CalendarClock, CalendarX, UserPlus, CalendarPlus, List 
} from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Card from '../components/Card';
import Button from '../components/Button';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Select from '../components/Select';
import Input from '../components/Input';
import Tabs from '../components/Tabs';

// Initialize moment localizer
const localizer = momentLocalizer(moment);

const ReceptionistDashboard = () => {
  const { user, appointments = [], patients = [], doctors = [], updateAppointment, deleteAppointment } = useApp();
  
  // State
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [darkMode, setDarkMode] = useState(false);
  const [view, setView] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showQuickContact, setShowQuickContact] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return {
      today: appointments.filter(a => isToday(parseISO(a.date))).length,
      pending: appointments.filter(a => a.status === 'pending').length,
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
      completed: appointments.filter(a => a.status === 'completed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
      upcoming: appointments.filter(a => 
        parseISO(a.date) > today && a.status === 'confirmed'
      ).length,
    };
  }, [appointments]);

  // Filter appointments based on search and filters
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appt => {
      const matchesSearch = 
        appt.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appt.doctorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appt.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || appt.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [appointments, searchTerm, filterStatus]);

  // Handle appointment actions
  const handleAppointmentAction = async (appointmentId, action) => {
    try {
      let status = action;
      let message = '';
      
      switch(action) {
        case 'confirm':
          status = 'confirmed';
          message = 'Appointment confirmed successfully';
          break;
        case 'cancel':
          status = 'cancelled';
          message = 'Appointment cancelled';
          break;
        case 'complete':
          status = 'completed';
          message = 'Appointment marked as completed';
          break;
        default:
          break;
      }
      
      await updateAppointment(appointmentId, { status });
      toast.success(message);
      
      // Add notification
      setNotifications(prev => [
        {
          id: Date.now(),
          type: 'success',
          message: `${message}: ${appointmentId}`,
          timestamp: new Date()
        },
        ...prev
      ].slice(0, 10)); // Keep only last 10 notifications
      
    } catch (error) {
      toast.error(`Failed to ${action} appointment`);
      console.error(error);
    }
  };

  // Handle drag and drop
  const handleEventDrop = async ({ event, start, end }) => {
    try {
      await updateAppointment(event.id, {
        date: start,
        endTime: end
      });
      toast.success('Appointment rescheduled successfully');
    } catch (error) {
      toast.error('Failed to reschedule appointment');
      console.error(error);
    }
  };

  // Format events for calendar
  const events = useMemo(() => {
    return filteredAppointments.map(appt => ({
      id: appt.id,
      title: `${appt.patientName} - ${appt.doctorName}`,
      start: new Date(appt.date),
      end: appt.endTime ? new Date(appt.endTime) : addHours(new Date(appt.date), 1),
      status: appt.status,
      ...appt
    }));
  }, [filteredAppointments]);

  // Event style based on status
  const eventStyleGetter = (event) => {
    let backgroundColor = '';
    
    switch(event.status) {
      case 'confirmed':
        backgroundColor = '#10B981'; // green-500
        break;
      case 'pending':
        backgroundColor = '#F59E0B'; // amber-500
        break;
      case 'cancelled':
        backgroundColor = '#EF4444'; // red-500
        break;
      case 'completed':
        backgroundColor = '#3B82F6'; // blue-500
        break;
      default:
        backgroundColor = '#6B7280'; // gray-500
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
        padding: '2px 5px',
      },
    };
  };

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Render the component
  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Page Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Receptionist Dashboard</h1>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="p-4">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <CalendarCheck className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Today's Appointments</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{summaryStats.today}</p>
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="p-4">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                  <Clock className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Confirmations</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{summaryStats.pending}</p>
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="p-4">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Upcoming</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{summaryStats.upcoming}</p>
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="p-4">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                  <XCircle className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cancelled</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{summaryStats.cancelled}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Appointment Calendar</h2>
              <div className="flex space-x-1 border border-gray-200 dark:border-gray-700 rounded-md p-1">
                {['day', 'week', 'month', 'agenda'].map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      view === v 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search appointments..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' }
                ]}
                className="w-full sm:w-40"
              />
            </div>
          </div>
          
          <div className="p-4">
            <div className="h-[600px]">
              <BigCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                view={view}
                onView={setView}
                date={currentDate}
                onNavigate={setCurrentDate}
                onSelectEvent={(event) => {
                  setSelectedAppointment(event);
                  setShowAppointmentModal(true);
                }}
                onEventDrop={handleEventDrop}
                eventPropGetter={eventStyleGetter}
                selectable
                onSelectSlot={({ start, end }) => {
                  setSelectedAppointment({
                    start,
                    end,
                    status: 'pending'
                  });
                  setShowAppointmentModal(true);
                }}
                messages={{
                  next: 'Next',
                  previous: 'Prev',
                  today: 'Today',
                  month: 'Month',
                  week: 'Week',
                  day: 'Day',
                  agenda: 'Agenda',
                  date: 'Date',
                  time: 'Time',
                  event: 'Event',
                  noEventsInRange: 'No appointments in this range.'
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Appointment List View (for smaller screens) */}
        <div className="mt-6 md:hidden">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Upcoming Appointments</h2>
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAppointments
                .filter(appt => isAfter(parseISO(appt.date), new Date()))
                .slice(0, 5)
                .map((appointment) => (
                  <li key={appointment.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">
                          {appointment.patientName}
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <Badge 
                            status={appointment.status}
                            className="text-xs" 
                          />
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            {format(parseISO(appointment.date), 'MMM d, yyyy')}
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0 sm:ml-6">
                            <ClockIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            {format(parseISO(appointment.date), 'h:mm a')}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                          <User className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          Dr. {appointment.doctorName}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              {filteredAppointments.length === 0 && (
                <li className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                  No upcoming appointments
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
      
      {/* Appointment Modal */}
      <Modal
        isOpen={showAppointmentModal}
        onClose={() => {
          setShowAppointmentModal(false);
          setSelectedAppointment(null);
        }}
        title={selectedAppointment?.id ? 'Edit Appointment' : 'New Appointment'}
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Patient
                </label>
                <Select
                  value={selectedAppointment.patientId || ''}
                  onChange={(e) => setSelectedAppointment({
                    ...selectedAppointment,
                    patientId: e.target.value,
                    patientName: patients.find(p => p.id === e.target.value)?.name || ''
                  })}
                  options={[
                    { value: '', label: 'Select Patient' },
                    ...patients.map(patient => ({
                      value: patient.id,
                      label: patient.name
                    }))
                  ]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Doctor
                </label>
                <Select
                  value={selectedAppointment.doctorId || ''}
                  onChange={(e) => setSelectedAppointment({
                    ...selectedAppointment,
                    doctorId: e.target.value,
                    doctorName: doctors.find(d => d.id === e.target.value)?.name || ''
                  })}
                  options={[
                    { value: '', label: 'Select Doctor' },
                    ...doctors.map(doctor => ({
                      value: doctor.id,
                      label: doctor.name
                    }))
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <Input
                  type="date"
                  value={selectedAppointment.date ? format(new Date(selectedAppointment.date), 'yyyy-MM-dd') : ''}
                  onChange={(e) => setSelectedAppointment({
                    ...selectedAppointment,
                    date: e.target.value
                  })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time
                </label>
                <Input
                  type="time"
                  value={selectedAppointment.time || ''}
                  onChange={(e) => setSelectedAppointment({
                    ...selectedAppointment,
                    time: e.target.value
                  })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <Select
                value={selectedAppointment.status || 'pending'}
                onChange={(e) => setSelectedAppointment({
                  ...selectedAppointment,
                  status: e.target.value
                })}
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' }
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows={3}
                value={selectedAppointment.notes || ''}
                onChange={(e) => setSelectedAppointment({
                  ...selectedAppointment,
                  notes: e.target.value
                })}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAppointmentModal(false);
                  setSelectedAppointment(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  try {
                    if (selectedAppointment.id) {
                      await updateAppointment(selectedAppointment.id, selectedAppointment);
                      toast.success('Appointment updated successfully');
                    } else {
                      // Create new appointment
                      await updateAppointment(
                        `appt-${Date.now()}`,
                        {
                          ...selectedAppointment,
                          id: `appt-${Date.now()}`,
                          createdAt: new Date().toISOString()
                        }
                      );
                      toast.success('Appointment created successfully');
                    }
                    setShowAppointmentModal(false);
                    setSelectedAppointment(null);
                  } catch (error) {
                    toast.error('Failed to save appointment');
                    console.error(error);
                  }
                }}
              >
                {selectedAppointment.id ? 'Update' : 'Create'} Appointment
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReceptionistDashboard;
