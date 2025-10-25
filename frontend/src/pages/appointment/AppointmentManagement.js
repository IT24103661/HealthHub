import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { format, parseISO } from 'date-fns';
import { Search, Calendar, Clock, User, Phone, Mail, Filter, Plus, Edit, Trash2, Check, X, RefreshCw, Eye, Download } from 'lucide-react';
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
  const [generatingReport, setGeneratingReport] = useState(false);
  const [users, setUsers] = useState(new Map()); // Map of all users by ID
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
      try {
        const token = localStorage.getItem('token');
        const usersResponse = await fetch('http://localhost:8080/api/users', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });
        
        if (!usersResponse.ok) {
          const errorText = await usersResponse.text();
          console.error('Failed to fetch users:', usersResponse.status, errorText);
          throw new Error(`Failed to fetch users: ${usersResponse.status} ${errorText}`);
        }
        
        const responseData = await usersResponse.json();
        console.log('Users data:', responseData);
        
        // Handle the response format from the backend
        const usersList = responseData.users || [];
        
        // Map of user IDs to user objects for quick lookup
        const usersMap = new Map();
        usersList.forEach(user => {
          if (user && user.id) {
            usersMap.set(String(user.id), user);
          }
        });
        
        // Filter users by role
        const patientsList = usersList.filter(u => 
          u.role && ['user', 'patient', 'USER', 'PATIENT'].includes(u.role)
        );
        
        const doctorsList = usersList.filter(u => 
          u.role && ['doctor', 'DOCTOR'].includes(u.role)
        );
        
        setUsers(usersMap);
        setPatients(patientsList);
        setDoctors(doctorsList);
      } catch (error) {
        console.error('Error fetching users:', error);
        // Continue with empty lists if there's an error
        setUsers(new Map());
        setPatients([]);
        setDoctors([]);
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
      
      // Remove any undefined or null values
      Object.keys(requestData).forEach(key => {
        if (requestData[key] === undefined || requestData[key] === null || requestData[key] === '') {
          delete requestData[key];
        }
      });

      // Handle date and time
      if (requestData.date && requestData.time) {
        // Combine date and time from form inputs
        const [year, month, day] = requestData.date.split('-').map(Number);
        const [hours, minutes] = requestData.time.split(':').map(Number);
        const date = new Date(year, month - 1, day, hours, minutes);
        
        // Format as ISO string without timezone offset (Z)
        const pad = num => num.toString().padStart(2, '0');
        const isoString = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
        
        requestData.appointmentDate = isoString;
        
        // Remove the separate date and time fields as they're not needed in the backend
        delete requestData.date;
        delete requestData.time;
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

  // Process and format appointments data
  const processedAppointments = useMemo(() => {
    console.log('Processing appointments...');
    if (!appointments || !Array.isArray(appointments)) {
      console.log('No appointments data or invalid format');
      return [];
    }
    
    return appointments.map(appt => {
      try {
        // Safely extract patient and doctor information with fallbacks
        let patientName = 'Unknown Patient';
        let patientId = '';
        let patientPhone = '';
        let patientEmail = '';
        
        let doctorName = 'Unknown Doctor';
        let doctorId = '';
        let doctorSpecialization = 'General Practitioner';

        // Get patient information - check all possible ID fields
        const patientIdToFind = 
          appt.patientId || 
          (typeof appt.patient === 'object' ? (appt.patient?.id || appt.patient?._id) : appt.patient) ||
          (appt.patientId ? String(appt.patientId) : null);
          
        if (patientIdToFind) {
          // First try to find in patients array
          const foundPatient = patients?.find(p => {
            return (p.id && String(p.id) === String(patientIdToFind)) || 
                   (p._id && String(p._id) === String(patientIdToFind));
          });
          
          if (foundPatient) {
            patientName = foundPatient.fullName || foundPatient.name || 'Unknown Patient';
            patientId = String(foundPatient.id || foundPatient._id || '');
            patientPhone = foundPatient.phone || foundPatient.phoneNumber || '';
            patientEmail = foundPatient.email || '';
          } 
          // Check for embedded patient object
          else if (appt.patient && typeof appt.patient === 'object') {
            const embeddedPatient = appt.patient;
            patientName = embeddedPatient.fullName || embeddedPatient.name || 'Unknown Patient';
            patientId = String(embeddedPatient.id || embeddedPatient._id || patientIdToFind);
            patientPhone = embeddedPatient.phone || embeddedPatient.phoneNumber || '';
            patientEmail = embeddedPatient.email || '';
          } else {
            patientId = String(patientIdToFind);
          }
        }

        // Get doctor information - check all possible ID fields
        const doctorIdToFind = 
          appt.doctorId || 
          (typeof appt.doctor === 'object' ? (appt.doctor?.id || appt.doctor?._id) : appt.doctor) ||
          (appt.doctorId ? String(appt.doctorId) : null);
          
        if (doctorIdToFind) {
          // First try to find in doctors array
          const foundDoctor = doctors?.find(d => 
            (d.id && String(d.id) === String(doctorIdToFind)) || 
            (d._id && String(d._id) === String(doctorIdToFind))
          );
          
          if (foundDoctor) {
            doctorName = foundDoctor.fullName || foundDoctor.name || 'Unknown Doctor';
            doctorId = String(foundDoctor.id || foundDoctor._id || '');
            doctorSpecialization = foundDoctor.specialization || 'General Practitioner';
          } 
          // Check for embedded doctor object
          else if (appt.doctor && typeof appt.doctor === 'object') {
            const embeddedDoctor = appt.doctor;
            doctorName = embeddedDoctor.fullName || embeddedDoctor.name || 'Unknown Doctor';
            doctorId = String(embeddedDoctor.id || embeddedDoctor._id || doctorIdToFind);
            doctorSpecialization = embeddedDoctor.specialization || 'General Practitioner';
          } else {
            doctorId = String(doctorIdToFind);
          }
        }

        // Parse and format the date
        let appointmentDate = new Date();
        let formattedDate = 'N/A';
        let formattedTime = 'N/A';
        
        const dateValue = appt.appointmentDate || appt.dateTime || appt.date;
        if (dateValue) {
          try {
            appointmentDate = new Date(dateValue);
            if (!isNaN(appointmentDate.getTime())) {
              formattedDate = format(appointmentDate, 'MMM d, yyyy');
              formattedTime = format(appointmentDate, 'h:mm a');
            }
          } catch (e) {
            console.error('Error formatting date:', e);
          }
        }

        // Create the formatted appointment object
        return {
          id: String(appt.id || appt._id || ''),
          patient: {
            id: patientId,
            name: patientName,
            phone: patientPhone || 'N/A',
            email: patientEmail || 'N/A'
          },
          doctor: {
            id: doctorId,
            name: doctorName,
            specialization: doctorSpecialization
          },
          appointmentDate: appointmentDate,
          formattedDate: formattedDate,
          formattedTime: formattedTime,
          type: String(appt.type || 'Checkup'),
          status: String(appt.status || 'scheduled').toUpperCase(),
          notes: String(appt.notes || appt.description || ''),
          rawData: appt // Keep the raw data for reference
        };
      } catch (error) {
        console.error('Error processing appointment:', error, appt);
        // Return a safe default object if there's an error
        return {
          id: String(appt.id || appt._id || 'error'),
          patient: { id: '0', name: 'Error loading patient', phone: 'N/A', email: 'N/A' },
          doctor: { id: '0', name: 'Error loading doctor' },
          appointmentDate: new Date(),
          formattedDate: 'N/A',
          formattedTime: 'N/A',
          type: 'Error',
          status: 'ERROR',
          notes: 'Error loading appointment data',
          rawData: appt
        };
      }
    }).filter(Boolean); // Remove any null entries from processing errors
  }, [appointments, patients, doctors]);

  // Filter and sort appointments
  const filteredAppointments = useMemo(() => {
    console.log('Filtering appointments...');
    if (!processedAppointments || !Array.isArray(processedAppointments)) {
      console.log('No processed appointments to filter');
      return [];
    }
    
    let result = [...processedAppointments];
    
    // Apply search filter if search term exists
    if (searchTerm && searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase().trim();
      result = result.filter(appt => {
        if (!appt) return false;
        
        return (
          (appt.patient?.name?.toLowerCase().includes(searchLower)) ||
          (appt.doctor?.name?.toLowerCase().includes(searchLower)) ||
          (appt.patient?.phone?.includes(searchTerm)) ||
          (appt.id?.toString().includes(searchTerm)) ||
          (appt.notes && appt.notes.toLowerCase().includes(searchLower)) ||
          (appt.type && appt.type.toLowerCase().includes(searchLower)) ||
          (appt.status && appt.status.toLowerCase().includes(searchLower))
        );
      });
    }
    
    console.log(`Filtered to ${result.length} appointments`);
    return result;
  }, [processedAppointments, searchTerm]);
  
  // Handle table sorting
  const [sortConfig, setSortConfig] = useState({ key: 'appointmentDate', direction: 'desc' });
  
  // Refresh data function
  const refreshData = useCallback(() => {
    console.log('Refreshing data...');
    setSearchTerm('');
    fetchAppointments();
  }, [fetchAppointments]);
  
  const sortedAppointments = useMemo(() => {
    console.log('Sorting appointments...');
    if (!filteredAppointments || !Array.isArray(filteredAppointments)) {
      console.log('No appointments to sort');
      return [];
    }
    
    const sortableItems = [...filteredAppointments];
    
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue, bValue;
        
        // Handle nested properties (e.g., patient.name)
        if (sortConfig.key.includes('.')) {
          const keys = sortConfig.key.split('.');
          aValue = keys.reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : '', a);
          bValue = keys.reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : '', b);
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }
        
        // Handle date comparison
        if (sortConfig.key === 'appointmentDate' || sortConfig.key.includes('Date')) {
          aValue = aValue ? new Date(aValue).getTime() : 0;
          bValue = bValue ? new Date(bValue).getTime() : 0;
        } else if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue?.toLowerCase?.() || '';
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
    
    console.log(`Sorted ${sortableItems.length} appointments by ${sortConfig.key} ${sortConfig.direction}`);
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
    let appointmentDate;
    let timeValue = '09:00';
    
    // Handle different date formats from the backend
    if (appointment.appointmentDate) {
      // Handle ISO string with or without timezone
      appointmentDate = new Date(appointment.appointmentDate);
      
      // If the date is invalid, try parsing it as a local date string
      if (isNaN(appointmentDate.getTime())) {
        // Try parsing as 'yyyy-MM-dd HH:mm' format
        const dateParts = appointment.appointmentDate.split(/[-T: ]/);
        if (dateParts.length >= 5) {
          appointmentDate = new Date(
            parseInt(dateParts[0]),
            parseInt(dateParts[1]) - 1,
            parseInt(dateParts[2]),
            parseInt(dateParts[3] || 0),
            parseInt(dateParts[4] || 0)
          );
        }
      }
      
      // If we still don't have a valid date, use current date
      if (isNaN(appointmentDate.getTime())) {
        appointmentDate = new Date();
      }
      
      // Format time as HH:mm
      timeValue = `${appointmentDate.getHours().toString().padStart(2, '0')}:${appointmentDate.getMinutes().toString().padStart(2, '0')}`;
    } else {
      appointmentDate = new Date();
    }
    
    // Override with explicit time if provided
    if (appointment.time) {
      timeValue = appointment.time;
    } else if (appointment.formattedTime) {
      // Handle 12-hour format if present
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
      }
    }
    
    const updatedAppointment = {
      ...appointment,
      id: appointment.id || appointment._id, // Ensure we have the correct ID field
      patient: patientWithName,
      doctor,
      patientId: appointment.patientId || appointment.patient?._id || appointment.patient?.id,
      doctorId: appointment.doctorId || appointment.doctor?._id || appointment.doctor?.id,
      date: format(appointmentDate, 'yyyy-MM-dd'),
      time: timeValue,
      name: getPatientName(patientWithName || appointment.patient),
      // Preserve the original appointment date for reference
      originalAppointmentDate: appointment.appointmentDate || appointment.date
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
        const displayName = String(patient.name || 'Unknown Patient');
        const displayPhone = String(patient.phone || patient.phoneNumber || 'N/A');
        const initials = displayName && typeof displayName === 'string' && displayName.length > 0 
          ? displayName.charAt(0).toUpperCase() 
          : '?';
        
        return (
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium mr-3 flex-shrink-0">
              {initials}
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
        const displayName = String(doctor.name || 'Unknown Doctor');
        const displaySpecialization = String(doctor.specialization || 'General Practitioner');
        const initials = displayName && typeof displayName === 'string' && displayName.length > 0 
          ? displayName.charAt(0).toUpperCase() 
          : '?';
        
        return (
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 font-medium mr-3 flex-shrink-0">
              {initials}
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
        date: dateStr, // Used for form handling
        time: timeStr, // Used for form handling
        appointmentDate: formattedDateTime, // Will be formatted in updateAppointment
        type: selectedAppointment.type || 'checkup',
        notes: selectedAppointment.notes || '',
        status: (selectedAppointment.status || 'scheduled').toUpperCase()
      };
      
      // Remove any undefined or empty values
      Object.keys(appointmentData).forEach(key => {
        if (appointmentData[key] === undefined || appointmentData[key] === null || appointmentData[key] === '') {
          delete appointmentData[key];
        }
      });
      
      console.log('Prepared appointment data:', JSON.stringify(appointmentData, null, 2));
      
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

  const generateAppointmentReport = async () => {
    try {
      setGeneratingReport(true);
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      
      // Initialize PDF with professional settings
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Colors
      const primaryColor = [63, 81, 181];
      const secondaryColor = [33, 150, 243];
      const lightGray = [248, 249, 250];
      const darkGray = [52, 58, 64];
      
      // Document dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;
      const headerHeight = 50;
      const tableStartY = 65;

      // Add header with gradient
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, headerHeight, 'F');
      
      // Add logo and title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.text('HEALTHHUB', pageWidth / 2, 25, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('APPOINTMENT REPORT', pageWidth / 2, 33, { align: 'center' });
      
      // Add report info
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, margin, 45);
      
      doc.text(`Total Appointments: ${filteredAppointments.length}`, margin, 50);
      
      // Prepare data for the table
      const tableData = filteredAppointments.map((appt, index) => {
        const date = appt.appointmentDate ? new Date(appt.appointmentDate) : null;
        return {
          id: index + 1,
          patient: appt.patient?.name || 'N/A',
          doctor: appt.doctor?.name || 'N/A',
          date: date ? date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : 'N/A',
          time: date ? date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }) : 'N/A',
          type: appt.type ? appt.type.charAt(0).toUpperCase() + appt.type.slice(1) : 'N/A',
          status: appt.status ? appt.status.charAt(0).toUpperCase() + appt.status.slice(1) : 'N/A',
          notes: appt.notes || 'N/A'
        };
      });

      // Add table using autoTable with enhanced styling
      autoTable(doc, {
        startY: tableStartY,
        head: [
          [
            { content: '#', styles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' } },
            { content: 'Patient', styles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' } },
            { content: 'Doctor', styles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' } },
            { content: 'Date', styles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' } },
            { content: 'Time', styles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' } },
            { content: 'Type', styles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' } },
            { content: 'Status', styles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' } },
            { content: 'Notes', styles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' } }
          ]
        ],
        body: tableData.map(row => [
          { content: row.id.toString(), styles: { fontStyle: 'bold' } },
          row.patient,
          row.doctor,
          row.date,
          row.time,
          row.type,
          { 
            content: row.status,
            styles: { 
              textColor: row.status === 'Completed' ? [40, 167, 69] :
                        row.status === 'Cancelled' ? [220, 53, 69] :
                        row.status === 'Scheduled' ? [255, 193, 7] :
                        [0, 0, 0]
            }
          },
          row.notes.length > 40 ? row.notes.substring(0, 40) + '...' : row.notes
        ]),
        theme: 'grid',
        headStyles: {
          fillColor: primaryColor,
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 35, halign: 'center' },   // ID
          1: { cellWidth: 35, halign: 'left' },     // Patient
          2: { cellWidth: 35, halign: 'left' },     // Doctor
          3: { cellWidth: 35, halign: 'center' },   // Date
          4: { cellWidth: 35, halign: 'center' },   // Time
          5: { cellWidth: 35, halign: 'center' },   // Type
          6: { cellWidth: 35, halign: 'center' },   // Status
          7: { cellWidth: 35, halign: 'left',       // Notes
              cellPadding: { left: 5, right: 2, top: 2, bottom: 2 } }
        },
        styles: {
          fontSize: 9,
          cellPadding: 4,
          lineColor: [221, 221, 221],
          lineWidth: 0.2,
          overflow: 'linebreak',
          valign: 'middle'
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        margin: { 
          top: 10,
          right: margin,
          bottom: 20,
          left: margin 
        },
        didDrawPage: (data) => {
          // Footer
          const pageCount = doc.internal.getNumberOfPages();
          const currentPage = data.pageNumber;
          
          doc.setFontSize(8);
          doc.setTextColor(100);
          doc.text(
            `Page ${currentPage} of ${pageCount} • Generated by HealthHub • ${new Date().toLocaleDateString()}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
          );
        }
      });
      
      // Add watermark
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(80);
        doc.setTextColor(230, 230, 230);
        doc.setFont('helvetica', 'bold');
        doc.setGState(new doc.GState({ opacity: 0.1 }));
        doc.text('HEALTHHUB', 
          pageWidth / 2, 
          doc.internal.pageSize.getHeight() / 2, 
          { angle: 45, align: 'center' }
        );
        doc.setGState(new doc.GState({ opacity: 1 }));
      }
      
      // Save the PDF with a timestamp in the filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      doc.save(`HealthHub_Appointments_${timestamp}.pdf`);
      
      toast.success('Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report. Please try again.');
    } finally {
      setGeneratingReport(false);
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
              
              <div className="flex space-x-2">
                <Button
                  onClick={handleNewAppointment}
                  className="px-4 py-2 text-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Appointment
                </Button>
                <Button
                  variant="outline"
                  onClick={generateAppointmentReport}
                  disabled={generatingReport || appointments.length === 0}
                  className="px-4 py-2 text-sm border-gray-300 hover:bg-gray-50"
                >
                  {generatingReport ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {generatingReport ? 'Generating...' : 'Download Report'}
                </Button>
              </div>
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
                data={sortedAppointments}
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
                    {selectedAppointment.doctor?.name && typeof selectedAppointment.doctor.name === 'string' && selectedAppointment.doctor.name.length > 0 
                      ? selectedAppointment.doctor.name.charAt(0).toUpperCase() 
                      : 'D'}
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
                        {selectedAppointment.patient?.name && typeof selectedAppointment.patient.name === 'string' && selectedAppointment.patient.name.length > 0 
                          ? selectedAppointment.patient.name.charAt(0).toUpperCase() 
                          : 'P'}
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
                        {selectedAppointment.doctor?.name && typeof selectedAppointment.doctor.name === 'string' && selectedAppointment.doctor.name.length > 0 
                          ? selectedAppointment.doctor.name.charAt(0).toUpperCase() 
                          : 'D'}
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
