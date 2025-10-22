import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { format, parseISO } from 'date-fns';
import { Search, Calendar, Clock, User, Phone, Mail, Filter, Plus, Edit, Trash2, Check, X, RefreshCw, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Card from '../../components/Card';
import Button from '../../components/Button';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import Input from '../../components/Input';

const AppointmentManagement = () => {
  const { user } = useApp();
  // State for managing appointments, filters, and UI
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch appointments from the backend
  const fetchAppointments = useCallback(async () => {
    console.log('Fetching appointments...');
    setLoading(true);
    setError(null);
    
    try {
      // First, fetch the appointments
      const response = await fetch('http://localhost:8080/api/appointments', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Appointments data:', data);
      
      // Handle the response based on its structure
      let appointmentsList = [];
      if (Array.isArray(data)) {
        appointmentsList = data;
      } else if (data && Array.isArray(data.appointments)) {
        appointmentsList = data.appointments;
      } else if (data) {
        appointmentsList = [data];
      }
      
      setAppointments(appointmentsList);
      console.log(`Successfully loaded ${appointmentsList.length} appointments`);
      
      // Now fetch users to get patient and doctor information
      const usersResponse = await fetch('http://localhost:8080/api/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('Raw users data:', usersData);
        
        // Extract patients and doctors from users
        let usersList = [];
        if (Array.isArray(usersData)) {
          usersList = usersData;
        } else if (usersData && Array.isArray(usersData.users)) {
          usersList = usersData.users;
        }
        
        console.log('Processed users list:', usersList);
        console.log('First user in list:', usersList[0]);
        
        // Include both 'user' and 'patient' roles for patients
        const patientsList = usersList.filter(u => 
          ['user', 'patient', 'USER', 'PATIENT'].includes(u.role)
        );
        const doctorsList = usersList.filter(u => 
          ['doctor', 'DOCTOR'].includes(u.role)
        );
        
        setPatients(patientsList);
        setDoctors(doctorsList);
      } else {
        console.warn('Failed to fetch users, continuing without user data');
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchAppointments();
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError(err.message);
        toast.error('Failed to load data. Please try again.');
      }
    };
    
    fetchData();
  }, [user?.id]); // Only depend on user.id
  
  // Create a new appointment
  const createAppointment = async (appointmentData) => {
    try {
      const token = localStorage.getItem('token');
      
      // Create a copy of the appointment data to avoid mutating the original
      const requestData = { ...appointmentData };
      
      // Format the dateTime to match backend expectations (yyyy-MM-dd HH:mm)
      if (requestData.dateTime) {
        const date = new Date(requestData.dateTime);
        if (!isNaN(date.getTime())) {
          // Format as yyyy-MM-dd HH:mm
          const pad = num => num.toString().padStart(2, '0');
          requestData.dateTime = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
        }
      }
      
      console.log('Creating appointment with data:', requestData);
      
      const response = await fetch('http://localhost:8080/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(requestData, (key, value) => {
          // Log the data being sent to the server
          console.log(`Sending ${key}:`, value);
          return value;
        })
      });

      console.log('Response status:', response.status);
      
      let responseData;
      try {
        responseData = await response.json();
        console.log('Response data:', responseData);
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        const text = await response.text();
        console.error('Raw response:', text);
        throw new Error(`Failed to parse server response: ${text}`);
      }
      
      if (!response.ok) {
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        });
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }

      if (!responseData) {
        throw new Error('No data returned from server');
      }

      // Update local state with the new appointment
      setAppointments(prev => [...prev, responseData]);
      console.log('Appointment created successfully:', responseData);
      return responseData;
    } catch (error) {
      console.error('Error in createAppointment:', {
        error,
        errorMessage: error.message,
        stack: error.stack
      });
      throw error;
    }
  };

  // Update appointment function
  const updateAppointment = async (id, updates) => {
    try {
      const token = localStorage.getItem('token');
      
      // Create a copy of the updates to avoid mutating the original
      const requestData = { ...updates };
      
      // Format the dateTime to match backend expectations (yyyy-MM-dd HH:mm)
      if (requestData.dateTime) {
        const date = new Date(requestData.dateTime);
        if (!isNaN(date.getTime())) {
          // Format as yyyy-MM-dd HH:mm
          const pad = num => num.toString().padStart(2, '0');
          requestData.dateTime = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
        }
      }
      
      console.log('Updating appointment with data:', requestData);
      
      const response = await fetch(`http://localhost:8080/api/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(requestData, (key, value) => {
          console.log(`Sending ${key}:`, value);
          return value;
        })
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('API Error Response:', responseData);
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }

      // Update local state with the updated appointment
      setAppointments(prev => 
        prev.map(appt => (appt.id === id || appt._id === id) ? responseData : appt)
      );
      return responseData;
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  };

  // Delete appointment function
  const deleteAppointment = async (id) => {
    try {
      const response = await fetch(`http://localhost:8080/api/appointments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete appointment');
      }
      
      setAppointments(appointments.filter(apt => 
        String(apt.id) !== String(id) && 
        String(apt._id) !== String(id)
      ));
      toast.success('Appointment deleted successfully');
      
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error('Failed to delete appointment');
      throw error;
    }
  };

  // Format appointment data for the table
  const formattedAppointments = useMemo(() => {
    return appointments.map(appt => {
      // Find the full patient and doctor objects from the state
      const patientObj = patients.find(p => p.id === appt.patientId) || 
                        (typeof appt.patient === 'object' ? appt.patient : { name: 'Unknown Patient' });
      
      const doctorObj = doctors.find(d => d.id === appt.doctorId) || 
                       (typeof appt.doctor === 'object' ? appt.doctor : { name: 'Unknown Doctor' });
      
      // Ensure we have the required fields
      const patient = {
        id: patientObj.id || appt.patientId || 0,
        name: patientObj.name || 'Unknown Patient',
        phone: patientObj.phone || 'N/A',
        email: patientObj.email || 'N/A'
      };
      
      const doctor = {
        id: doctorObj.id || appt.doctorId || 0,
        name: doctorObj.name || 'Unknown Doctor',
        specialization: doctorObj.specialization || 'General Practitioner'
      };
      
      // Format status to uppercase for consistency
      const status = (appt.status || 'scheduled').toUpperCase();
      const type = appt.type || 'checkup';
      const notes = appt.notes || appt.description || '';
      
      // Format date if it exists
      let formattedDate = 'N/A';
      if (appt.appointmentDate) {
        try {
          const date = new Date(appt.appointmentDate);
          if (!isNaN(date.getTime())) {
            formattedDate = format(date, 'MMM d, yyyy');
          }
        } catch (e) {
          console.error('Error formatting date:', e);
        }
      }
      
      return {
        ...appt,
        patient,
        doctor,
        status,
        type,
        notes,
        formattedDate
      };
    });
  }, [appointments, patients, doctors]);

  // Process and filter appointments data
  const processedAppointments = useMemo(() => {
    if (!appointments || !Array.isArray(appointments)) return [];
    
    return appointments.map(appt => {
      try {
        // Safely extract patient and doctor data
        let patient = {};
        let doctor = {};
        
        // Handle different possible data structures
        if (appt.patientId && Array.isArray(patients)) {
          patient = patients.find(p => p.id === appt.patientId) || appt.patient || {};
        } else if (appt.patient) {
          patient = typeof appt.patient === 'object' ? appt.patient : { name: appt.patient };
        }
        
        if (appt.doctorId && Array.isArray(doctors)) {
          doctor = doctors.find(d => d.id === appt.doctorId) || appt.doctor || {};
        } else if (appt.doctor) {
          doctor = typeof appt.doctor === 'object' ? appt.doctor : { name: appt.doctor };
        }
        
        // Format appointment date
        let appointmentDate = new Date();
        let formattedDate = 'N/A';
        let formattedTime = 'N/A';
        
        if (appt.appointmentDate || appt.date) {
          try {
            appointmentDate = new Date(appt.appointmentDate || appt.date);
            if (!isNaN(appointmentDate.getTime())) {
              formattedDate = format(appointmentDate, 'MMM d, yyyy');
              formattedTime = format(appointmentDate, 'h:mm a');
            }
          } catch (e) {
            console.error('Error formatting date:', e);
          }
        }
        
        // Ensure we have all required fields with defaults
        return {
          id: appt.id || Math.random().toString(36).substr(2, 9),
          patient: {
            id: patient.id || 0,
            name: patient.name || patient.fullName || 'Unknown Patient',
            phone: patient.phone || patient.phoneNumber || 'N/A',
            email: patient.email || 'N/A'
          },
          doctor: {
            id: doctor.id || 0,
            name: doctor.name || doctor.fullName || 'Unknown Doctor',
            specialization: doctor.specialization || 'General Practitioner'
          },
          appointmentDate: appointmentDate,
          formattedDate: formattedDate,
          formattedTime: formattedTime,
          status: (appt.status || 'PENDING').toUpperCase(),
          type: appt.type || 'General Checkup',
          notes: appt.notes || appt.description || ''
        };
      } catch (error) {
        console.error('Error processing appointment:', appt, error);
        return null;
      }
    }).filter(Boolean); // Remove any null entries from processing errors
  }, [appointments, patients, doctors]);

  // Filter and sort appointments
  const filteredAppointments = useMemo(() => {
    if (!processedAppointments || !Array.isArray(processedAppointments)) return [];
    
    let result = [...processedAppointments];
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(appt => {
        if (!appt) return false;
        
        return (
          (appt.patient?.name?.toLowerCase().includes(searchLower)) ||
          (appt.doctor?.name?.toLowerCase().includes(searchLower)) ||
          (appt.patient?.phone?.includes(searchTerm)) ||
          (appt.id?.toString().includes(searchTerm)) ||
          (appt.notes && appt.notes.toLowerCase().includes(searchLower)) ||
          (appt.type && appt.type.toLowerCase().includes(searchLower))
        );
      });
    }
    
    // Sort by appointment date by default (newest first)
    result.sort((a, b) => {
      if (!a || !b) return 0;
      return new Date(b.appointmentDate) - new Date(a.appointmentDate);
    });
    
    return result;
  }, [processedAppointments, searchTerm]);
  
  // Handle table sorting
  const [sortConfig, setSortConfig] = useState({ key: 'appointmentDate', direction: 'asc' });
  
  // Refresh data function
  const refreshData = () => {
    setSearchTerm('');
    fetchAppointments();
  };
  
  const sortedAppointments = useMemo(() => {
    const sortableItems = [...filteredAppointments];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Handle date comparison
        if (sortConfig.key === 'appointmentDate') {
          aValue = aValue ? new Date(aValue).getTime() : 0;
          bValue = bValue ? new Date(bValue).getTime() : 0;
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredAppointments, sortConfig]);
  
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading appointments...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-6 max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Data</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Handle appointment actions
  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await updateAppointment(appointmentId, { status: newStatus });
      toast.success(`Appointment ${newStatus} successfully`);
    } catch (error) {
      toast.error(`Failed to update appointment status`);
      console.error(error);
    }
  };

  const handleEditAppointment = (appointment) => {
    console.log('Editing appointment:', appointment);
    
    // Find the full patient object from the patients state
    const patient = patients.find(p => {
      // Check all possible ID fields
      const patientId = appointment.patientId || appointment.patient?.id || appointment.patient?._id;
      return (
        p.id?.toString() === patientId?.toString() || 
        p._id?.toString() === patientId?.toString()
      );
    }) || appointment.patient || null;
    
    console.log('Found patient:', patient);
    
    // Ensure patient has a name
    const getPatientName = (patient) => {
      if (!patient) return 'Unknown Patient';
      return patient.fullName || 
             (patient.firstName && patient.lastName 
               ? `${patient.firstName} ${patient.lastName}`.trim() 
               : patient.email || `Patient ${patient.id || patient._id || ''}`);
    };
    
    // Create a properly formatted patient object
    const patientWithName = patient ? {
      ...patient,
      id: patient.id || patient._id,
      name: getPatientName(patient),
      email: patient.email || '',
      phone: patient.phone || ''
    } : null;
    
    // Find the doctor
    const doctor = doctors.find(d => {
      const doctorId = appointment.doctorId || appointment.doctor?.id || appointment.doctor?._id;
      return (
        d.id?.toString() === doctorId?.toString() || 
        d._id?.toString() === doctorId?.toString()
      );
    }) || appointment.doctor || null;
    
    // Parse the appointment date
    const appointmentDate = appointment.appointmentDate ? new Date(appointment.appointmentDate) : new Date();
    
    // Format time for the time input (HH:MM)
    let timeValue = '09:00';
    if (appointment.formattedTime) {
      // If we have a formatted time, convert it to 24-hour format if needed
      const timeParts = appointment.formattedTime.match(/(\d+):(\d+)(?::\d+)?(?:\s*([ap]m))?/i);
      if (timeParts) {
        let hours = parseInt(timeParts[1], 10);
        const minutes = timeParts[2];
        const period = timeParts[3] ? timeParts[3].toLowerCase() : null;
        
        // Convert 12-hour to 24-hour format if needed
        if (period === 'pm' && hours < 12) hours += 12;
        if (period === 'am' && hours === 12) hours = 0;
        
        // Format as HH:MM
        timeValue = `${hours.toString().padStart(2, '0')}:${minutes}`;
      } else {
        timeValue = appointment.formattedTime; // Fallback to original if parsing fails
      }
    } else if (appointment.appointmentDate) {
      // Otherwise, format the time from the appointment date
      timeValue = format(appointmentDate, 'HH:mm');
    }
    
    const updatedAppointment = {
      ...appointment,
      patient: patientWithName,
      doctor,
      patientId: appointment.patientId || appointment.patient?._id || appointment.patient?.id,
      doctorId: appointment.doctorId || appointment.doctor?._id || appointment.doctor?.id,
      date: format(appointmentDate, 'yyyy-MM-dd'),
      time: timeValue,
      name: getPatientName(patientWithName || appointment.patient)
    };
    
    console.log('Setting selected appointment:', updatedAppointment);
    setSelectedAppointment(updatedAppointment);
    setIsEditing(true);
    setShowAppointmentModal(true);
  };

  // Generate time slots from 8:00 AM to 5:00 PM in 30-minute intervals
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 17; hour++) {
      for (let minute of ['00', '30']) {
        if (hour === 17 && minute === '30') break; // Skip 17:30
        const time = `${hour.toString().padStart(2, '0')}:${minute}`;
        slots.push({ value: time, label: `${hour > 12 ? hour - 12 : hour}:${minute} ${hour >= 12 ? 'PM' : 'AM'}` });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Handle new appointment button click
  const handleNewAppointment = () => {
    const now = new Date();
    // Round up to nearest 30 minutes
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 30) * 30;
    const time = new Date(now);
    
    if (roundedMinutes === 60) {
      time.setHours(now.getHours() + 1);
      time.setMinutes(0);
    } else {
      time.setMinutes(roundedMinutes);
    }
    
    // Format time as HH:MM
    const formattedTime = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
    
    setSelectedAppointment({
      patientId: '',
      doctorId: '',
      date: format(now, 'yyyy-MM-dd'),
      time: formattedTime,
      type: 'checkup',
      notes: '',
      status: 'scheduled'
    });
    setIsEditing(false);
    setShowAppointmentModal(true);
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (isDeleting) return; // Prevent multiple clicks
    
    const confirmDelete = window.confirm('Are you sure you want to delete this appointment?');
    if (!confirmDelete) {
      return;
    }
    
    setIsDeleting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete appointment');
      }
      
      // Update the local state to remove the deleted appointment
      setAppointments(prevAppointments => 
        prevAppointments.filter(appt => 
          String(appt.id) !== String(appointmentId) && 
          String(appt._id) !== String(appointmentId)
        )
      );
      
      toast.success('Appointment deleted successfully');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error(error.message || 'Failed to delete appointment');
    } finally {
      setIsDeleting(false);
    }
  };

  // Format appointment date for display
  const formatAppointmentDate = (dateString) => {
    try {
      // Parse the date string to a Date object
      let date = new Date(dateString);
      
      // If the date is invalid, try parsing it with date-fns
      if (isNaN(date.getTime())) {
        date = parseISO(dateString);
      }
      
      // Format the date and time using date-fns for consistency
      const formattedDate = format(date, 'MMM d, yyyy');
      const formattedTime = format(date, 'h:mm a');
      
      return {
        date: formattedDate,
        time: formattedTime,
        fullDate: date.toISOString()
      };
    } catch (e) {
      console.error('Error formatting date:', e);
      return { date: 'N/A', time: 'N/A', fullDate: '' };
    }
  };

  // Table columns with enhanced styling and functionality
  const columns = [
    {
      header: 'ID',
      accessor: 'id',
      render: (row) => (
        <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
          #{String(row.id).padStart(4, '0')}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const value = row.status;
        if (!value) return null;
        
        const statusConfig = {
          SCHEDULED: { 
            label: 'Scheduled', 
            icon: '🕒',
            color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
          },
          COMPLETED: { 
            label: 'Completed', 
            icon: '✅',
            color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
          },
          CANCELLED: { 
            label: 'Cancelled', 
            icon: '❌',
            color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
          },
          NOSHOW: { 
            label: 'No Show', 
            icon: '⏰',
            color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' 
          },
          PENDING: {
            label: 'Pending',
            icon: '⏳',
            color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
          }
        };
        
        const statusValue = typeof value === 'string' ? value.toUpperCase() : 'PENDING';
        const config = statusConfig[statusValue] || { 
          label: statusValue, 
          icon: 'ℹ️',
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' 
        };
        
        return (
          <div className="flex items-center">
            <span className="mr-2">{config.icon}</span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Patient',
      accessor: 'patient',
      render: (row) => {
        const value = row.patient;
        if (!value) return <div className="text-gray-500">No patient</div>;
        
        const patient = typeof value === 'object' ? value : { name: String(value) };
        const displayName = patient.name || 'Unknown Patient';
        const displayPhone = patient.phone || patient.phoneNumber || 'N/A';
        
        return (
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium mr-3 flex-shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-medium text-gray-900 dark:text-white truncate" title={displayName}>
                {displayName}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 truncate" title={displayPhone}>
                {displayPhone}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Doctor',
      accessor: 'doctor',
      render: (row) => {
        const value = row.doctor;
        if (!value) return <div className="text-gray-500">No doctor</div>;
        
        const doctor = typeof value === 'object' ? value : { name: String(value) };
        const displayName = doctor.name || 'Unknown Doctor';
        const displaySpecialization = doctor.specialization || 'General Practitioner';
        
        return (
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 font-medium mr-3 flex-shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-medium text-gray-900 dark:text-white truncate" title={`Dr. ${displayName}`}>
                Dr. {displayName}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 truncate" title={displaySpecialization}>
                {displaySpecialization}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Date & Time',
      accessor: 'appointmentDate',
      render: (row) => {
        try {
          // First try to get the formatted time if it exists
          if (row.formattedTime) {
            const date = row.appointmentDate ? format(new Date(row.appointmentDate), 'MMM d, yyyy') : 'N/A';
            return (
              <div className="space-y-1 min-w-[140px]">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-900 dark:text-white font-medium">
                    {date}
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300">
                    {row.formattedTime}
                  </span>
                </div>
              </div>
            );
          }
          
          // Fallback to parsing the date if formattedTime doesn't exist
          if (row.appointmentDate) {
            const date = new Date(row.appointmentDate);
            return (
              <div className="space-y-1 min-w-[140px]">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-900 dark:text-white font-medium">
                    {format(date, 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300">
                    {format(date, 'h:mm a')}
                  </span>
                </div>
              </div>
            );
          }
          
          return <div className="text-gray-500">No date/time set</div>;
          
        } catch (e) {
          console.error('Error formatting appointment time:', e);
          return (
            <div className="text-gray-500">
              {row.appointmentDate ? 'Invalid date' : 'No date'}
            </div>
          );
        }
      },
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (row) => {
        const status = row.status;
        const isUpcoming = status === 'scheduled' || status === 'confirmed';
        
        return (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setSelectedAppointment(row);
                setShowViewModal(true);
              }}
              className="p-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 hover:text-blue-700 dark:text-blue-400"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleEditAppointment(row)}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
            
            {isUpcoming && (
              <>
                <button
                  onClick={() => handleStatusChange(row.id, 'completed')}
                  className="p-1.5 rounded-full hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 hover:text-green-700 dark:text-green-400"
                  title="Mark as Completed"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleStatusChange(row.id, 'cancelled')}
                  className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 hover:text-red-700 dark:text-red-400"
                  title="Cancel Appointment"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
            
            <button
              onClick={() => handleDeleteAppointment(row.id)}
              className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 hover:text-red-700 dark:text-red-400"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedAppointment) {
      console.error('No selected appointment');
      return;
    }
    
    // Basic validation
    if (!selectedAppointment.patientId) {
      toast.error('Please select a patient');
      return;
    }
    
    if (!selectedAppointment.doctorId) {
      toast.error('Please select a doctor');
      return;
    }
    
    if (!selectedAppointment.date || !selectedAppointment.time) {
      toast.error('Please select both date and time');
      return;
    }
    
    try {
      console.log('Form submission started');
      
      // Ensure we have valid date and time strings
      if (!selectedAppointment.date || !selectedAppointment.time) {
        throw new Error('Date and time are required');
      }
      
      // Get date and time from the form
      const dateStr = selectedAppointment.date;
      const timeStr = selectedAppointment.time;
      
      if (!dateStr || !timeStr) {
        throw new Error('Both date and time are required');
      }
      
      // Parse the date and time components
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hours, minutes] = timeStr.split(':').map(Number);
      
      // Create a date object in local time
      const date = new Date(year, month - 1, day, hours, minutes);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date or time format');
      }
      
      // Format as ISO string (this will include timezone offset)
      const formattedDateTime = date.toISOString();
      
      console.log('Formatted dateTime for backend:', {
        inputDate: dateStr,
        inputTime: timeStr,
        jsDate: date.toString(),
        formattedDateTime,
        timestamp: date.getTime(),
        isoString: date.toISOString()
      });
      
      // Convert string IDs to numbers
      const patientId = Number(selectedAppointment.patientId);
      const doctorId = Number(selectedAppointment.doctorId);
      
      // Validate that IDs are valid numbers
      if (isNaN(patientId) || isNaN(doctorId)) {
        throw new Error('Invalid patient or doctor ID format');
      }
      
      // Format the request to match backend DTO
      const appointmentData = {
        patientId: patientId,
        doctorId: doctorId,
        appointmentDate: formattedDateTime, // Full ISO-8601 formatted date
        type: selectedAppointment.type || 'checkup',
        notes: selectedAppointment.notes || '',
        status: (selectedAppointment.status || 'scheduled').toUpperCase()
      };
      
      console.log('Sending to backend:', JSON.stringify(appointmentData, null, 2));

      console.log('Prepared appointment data:', JSON.stringify(appointmentData, null, 2));
      
      if (isEditing && selectedAppointment.id) {
        console.log('Updating existing appointment');
        await updateAppointment(selectedAppointment.id, appointmentData);
        toast.success('Appointment updated successfully');
      } else {
        console.log('Creating new appointment');
        await createAppointment(appointmentData);
        toast.success('Appointment created successfully');
      }
      
      // Close the modal and refresh the appointments list
      setShowAppointmentModal(false);
      setSelectedAppointment(null);
      await fetchAppointments();
      
    } catch (error) {
      console.error('Error in handleSubmit:', {
        error,
        errorMessage: error.message,
        stack: error.stack
      });
      
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Failed to save appointment. Please check the console for details.';
      toast.error(`Error: ${errorMessage}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Appointment Management</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {filteredAppointments.length} {filteredAppointments.length === 1 ? 'appointment' : 'appointments'} found
          </p>
        </div>

        {/* Appointments Table */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:max-w-md">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search by patient, doctor, or notes..."
                  className="pl-10 pr-10 w-full transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Button
                onClick={refreshData}
                variant="outline"
                className="px-3 py-2 text-sm"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
              
              <Button
                onClick={handleNewAppointment}
                className="px-4 py-2 text-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Appointment
              </Button>
            </div>
          </div>
          
          {filteredAppointments.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-blue-500 dark:text-blue-400 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Appointments Yet</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                {searchTerm 
                  ? 'No appointments match your search. Try different keywords.'
                  : 'You don\'t have any appointments scheduled yet. Schedule your first appointment to get started.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => {
                    setSelectedAppointment(null);
                    setIsEditing(false);
                    setSearchTerm('');
                    setShowAppointmentModal(true);
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Schedule New Appointment
                </Button>
                
                {searchTerm && (
                  <Button
                    onClick={() => setSearchTerm('')}
                    variant="outline"
                    className="px-6 py-3 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table
                columns={columns}
                data={filteredAppointments}
                defaultPageSize={10}
                className="min-w-full"
                pagination
                showPageSizeOptions={true}
                showPaginationBottom={true}
                pageSizeOptions={[5, 10, 20, 50, 100]}
                noDataText="No appointments found matching your criteria"
              />
            </div>
          )}
        </Card>
      </div>

      {/* Appointment Modal */}
      <Modal
        isOpen={showAppointmentModal}
        onClose={() => {
          setShowAppointmentModal(false);
          setSelectedAppointment(null);
        }}
        title={isEditing ? 'Edit Appointment' : 'New Appointment'}
      >
        {selectedAppointment && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select Patient *
                  </label>
                  <Select
                    value={selectedAppointment.patientId || ''}
                    onChange={(e) => {
                      const patientId = e.target.value;
                      const selectedPatient = patients.find(p => 
                        p.id === patientId || p._id === patientId
                      );
                      setSelectedAppointment(prev => ({
                        ...prev,
                        patientId,
                        patient: selectedPatient || null
                      }));
                    }}
                    options={[
                      { value: '', label: 'Select a patient', disabled: true },
                      ...patients.map(patient => ({
                        value: patient.id || patient._id,
                        label: patient.name || patient.fullName || 
                              (patient.firstName || patient.lastName 
                                ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() 
                                : patient.email || `Patient ${patient.id || patient._id}`)
                      }))
                    ]}
                    className="w-full"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Doctor
                </label>
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 font-medium flex-shrink-0">
                    {selectedAppointment.doctor?.name?.charAt(0) || 'D'}
                  </div>
                  <div className="flex-1">
                    <Select
                      value={selectedAppointment.doctorId || ''}
                      onChange={(e) => {
                        const doctorId = e.target.value;
                        const selectedDoctor = doctors.find(d => 
                          d.id === doctorId || d._id === doctorId
                        );
                        setSelectedAppointment(prev => ({
                          ...prev,
                          doctorId,
                          doctor: selectedDoctor || null
                        }));
                      }}
                      options={[
                        { value: '', label: 'Select a doctor', disabled: true },
                        ...doctors.map(doctor => ({
                          value: doctor.id || doctor._id,
                          label: doctor.name || doctor.fullName || 
                                (doctor.firstName || doctor.lastName 
                                  ? `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() 
                                  : doctor.email || `Doctor ${doctor.id}`)
                        }))
                      ]}
                      className="w-full"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <Input
                  type="date"
                  value={selectedAppointment.date || ''}
                  onChange={(e) => setSelectedAppointment(prev => ({
                    ...prev,
                    date: e.target.value
                  }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time *
                </label>
                <Select
                  value={selectedAppointment.time || ''}
                  onChange={(e) => setSelectedAppointment(prev => ({
                    ...prev,
                    time: e.target.value
                  }))}
                  options={[
                    { value: '', label: 'Select a time', disabled: true },
                    ...timeSlots.map(slot => ({
                      value: slot.value,
                      label: slot.label
                    }))
                  ]}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <Select
                  value={selectedAppointment.status || 'SCHEDULED'}
                  onChange={(e) => setSelectedAppointment(prev => ({
                    ...prev,
                    status: e.target.value
                  }))}
                  options={[
                    { value: 'SCHEDULED', label: 'Scheduled' },
                    { value: 'CONFIRMED', label: 'Confirmed' },
                    { value: 'COMPLETED', label: 'Completed' },
                    { value: 'CANCELLED', label: 'Cancelled' },
                    { value: 'PENDING', label: 'Pending' }
                  ]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <Select
                  value={selectedAppointment.type || 'follow-up'}
                  onChange={(e) => setSelectedAppointment(prev => ({
                    ...prev,
                    type: e.target.value
                  }))}
                  options={[
                    { value: 'general', label: 'General Health Checkup' },
                    { value: 'nutrition', label: 'Nutrition Consultation' },
                    { value: 'followup', label: 'Follow-up Visit' },
                    { value: 'diet-review', label: 'Diet Plan Review' },
                    { value: 'emergency', label: 'Emergency' },
                    { value: 'other', label: 'Other' }
                  ]}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows={3}
                value={selectedAppointment.notes || ''}
                onChange={(e) => setSelectedAppointment(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
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
                type="submit"
                onClick={handleSubmit}
                className="w-full sm:w-auto"
              >
                {isEditing ? 'Update' : 'Create'} Appointment
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Appointment Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedAppointment(null);
        }}
        title="Appointment Details"
        size="lg"
      >
        {selectedAppointment && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Patient Information</h3>
                  <div className="mt-1">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 text-lg font-medium">
                        {selectedAppointment.patient?.name?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                          {selectedAppointment.patient?.name || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {selectedAppointment.patient?.phone || 'No phone number'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Doctor Information</h3>
                  <div className="mt-1">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 text-lg font-medium">
                        {selectedAppointment.doctor?.name?.charAt(0) || 'D'}
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                          Dr. {selectedAppointment.doctor?.name || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {selectedAppointment.doctor?.specialization || 'No specialization'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Appointment Details</h3>
                  <dl className="mt-2 space-y-2">
                    <div className="flex items-start">
                      <dt className="w-28 flex-shrink-0 text-sm text-gray-500 dark:text-gray-400">Date & Time:</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">
                        {selectedAppointment.formattedDate || 'N/A'}
                      </dd>
                    </div>
                    <div className="flex items-start">
                      <dt className="w-28 flex-shrink-0 text-sm text-gray-500 dark:text-gray-400">Status:</dt>
                      <dd>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedAppointment.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          selectedAppointment.status === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                          selectedAppointment.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {selectedAppointment.status || 'PENDING'}
                        </span>
                      </dd>
                    </div>
                    <div className="flex items-start">
                      <dt className="w-28 flex-shrink-0 text-sm text-gray-500 dark:text-gray-400">Type:</dt>
                      <dd className="text-sm text-gray-900 dark:text-white capitalize">
                        {selectedAppointment.type || 'General Checkup'}
                      </dd>
                    </div>
                    {selectedAppointment.notes && (
                      <div className="flex items-start">
                        <dt className="w-28 flex-shrink-0 text-sm text-gray-500 dark:text-gray-400">Notes:</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">
                          {selectedAppointment.notes}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-3">
              <Button
                onClick={() => {
                  setShowViewModal(false);
                  handleEditAppointment(selectedAppointment);
                }}
                variant="outline"
                className="px-4 py-2 text-sm"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Appointment
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AppointmentManagement;
