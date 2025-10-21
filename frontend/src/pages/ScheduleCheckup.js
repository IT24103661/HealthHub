import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import Select from '../components/Select';
import Textarea from '../components/Textarea';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

const ScheduleCheckup = () => {
  const { scheduleAppointment, appointments, user } = useApp();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [checkupType, setCheckupType] = useState('');
  const [notes, setNotes] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [doctorList, setDoctorList] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');

  // Define checkup types
  const checkupTypes = [
    { value: 'general', label: 'General Health Checkup' },
    { value: 'nutrition', label: 'Nutrition Consultation' },
    { value: 'followup', label: 'Follow-up Visit' },
    { value: 'diet-review', label: 'Diet Plan Review' },
  ];

  // Fetch all users and filter for doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/users');
        const data = await response.json();
        if (data.success) {
          // Filter users to only include those with role 'doctor'
          const doctors = Array.isArray(data.users) 
            ? data.users.filter(user => user.role === 'doctor')
            : [];
            
          if (doctors.length === 0) {
            console.warn('No doctors found in the system');
            toast.info('No doctors are currently available');
          }
          
          setDoctorList(doctors.map(doctor => ({
            value: doctor.id,
            label: doctor.name || doctor.fullName || 'Doctor',
            specialization: doctor.specialization || 'General Practitioner'
          })));
        } else {
          throw new Error(data.message || 'Failed to load doctors');
        }
      } catch (error) {
        console.error('Error fetching doctors:', error);
        toast.error(error.message || 'Failed to load doctors');
      }
    };
    fetchDoctors();
  }, []);

  // Generate time slots based on business hours and availability
  const generateTimeSlots = () => {
    const slots = [];
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    const lunchStart = 12; // 12 PM
    const lunchEnd = 13; // 1 PM
    
    // Convert selectedDate to start of day for comparison
    const selectedDayStart = new Date(selectedDate);
    selectedDayStart.setHours(0, 0, 0, 0);
    
    // Get current time for today's date comparison
    const now = new Date();
    const currentDayStart = new Date(now);
    currentDayStart.setHours(0, 0, 0, 0);
       
    for (let hour = startHour; hour < endHour; hour++) {
      // Skip lunch time
      if (hour === lunchStart) continue;
      
      // For the current day, only show future time slots
      if (selectedDayStart.getTime() === currentDayStart.getTime()) {
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        
        // Skip past hours for current day
        if (hour < currentHour || (hour === currentHour && 0 < currentMinutes)) {
          continue;
        }
      }
      
      // Add two slots per hour (e.g., 9:00 and 9:30)
      [0, 30].forEach(minutes => {
        // Skip 12:30 PM (lunch time)
        if (hour === lunchStart - 1 && minutes === 30) return;
        
        const time = new Date(selectedDate);
        time.setHours(hour, minutes, 0, 0);
        
        const timeString = time.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        
        // Check if this slot is already booked
        const isBooked = appointments.some(apt => {
          const aptDate = new Date(apt.appointmentDate || apt.date);
          return (
            aptDate.getDate() === time.getDate() &&
            aptDate.getMonth() === time.getMonth() &&
            aptDate.getFullYear() === time.getFullYear() &&
            aptDate.getHours() === hour &&
            aptDate.getMinutes() === minutes &&
            apt.status !== 'cancelled'
          );
        });
        
        slots.push({
          time: timeString,
          value: timeString,
          isAvailable: !isBooked,
          isLunch: hour === lunchStart
        });
      });
    }
    
    return slots;
  };
  
  // Update available slots when date or doctor changes
  useEffect(() => {
    if (!selectedDate || !selectedDoctor) {
      setAvailableSlots([]);
      return;
    }
    
    setIsFetchingSlots(true);
    
    // Simulate API call with timeout
    const timer = setTimeout(() => {
      try {
        const slots = generateTimeSlots();
        setAvailableSlots(slots);
      } catch (error) {
        console.error('Error generating time slots:', error);
        toast.error('Failed to load available time slots');
      } finally {
        setIsFetchingSlots(false);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [selectedDate, selectedDoctor, appointments]);

  // Use the generated time slots
  const timeSlots = availableSlots;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime || !checkupType || !selectedDoctor) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    
    try {
      // Format the date and time for the backend
      const appointmentDate = new Date(selectedDate);
      const [time, modifier] = selectedTime.split(' ');
      let [hours, minutes] = time.split(':');
      
      if (modifier === 'PM' && hours < 12) hours = parseInt(hours) + 12;
      if (modifier === 'AM' && hours === '12') hours = '00';
      
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const appointment = {
        patientId: user.id,
        doctorId: Number(selectedDoctor), // Convert to number
        appointmentDate: appointmentDate.toISOString(),
        type: checkupType,
        status: 'scheduled',
        notes: notes || undefined,
      };

      console.log('Sending appointment request:', JSON.stringify(appointment, null, 2));
      
      const response = await fetch('http://localhost:8080/api/appointments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(appointment),
      });

      let data;
      try {
        data = await response.json();
        console.log('Server response:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        const errorText = await response.text();
        console.error('Raw response:', errorText);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      if (response.ok && data.success) {
        setShowSuccess(true);
        toast.success('Appointment scheduled successfully!');
        setTimeout(() => {
          navigate('/appointments');
        }, 2000);
      } else {
        // Handle different types of error responses
        const errorMessage = data.message || 
                           (data.error ? `${data.error}: ${data.message || 'Unknown error'}` : 'Failed to schedule appointment');
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      toast.error(error.message || 'Failed to schedule appointment');
    } finally {
      setIsLoading(false);
    }
  };

  const isDateDisabled = ({ date }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Disable past dates, Sundays, and dates more than 30 days in the future
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    
    return (
      date < today || 
      date > maxDate ||
      date.getDay() === 0 // Disable Sundays
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Schedule Health Checkup</h1>
        <p className="text-gray-600 mt-2">
          Book an appointment with our healthcare professionals
        </p>
      </div>

      {showSuccess && (
        <Alert
          type="success"
          message="Your appointment request has been submitted! Our staff will confirm shortly."
          className="mb-6"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar and Form */}
        <div className="lg:col-span-2">
          <Card>
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CalendarIcon size={20} />
                  Select Date
                </h3>
                <div className="flex justify-center">
                  <Calendar
                    onChange={setSelectedDate}
                    value={selectedDate}
                    minDate={new Date()}
                    maxDate={(() => {
                      const date = new Date();
                      date.setDate(date.getDate() + 30);
                      return date;
                    })()}
                    tileDisabled={isDateDisabled}
                    className="border-0 shadow-none"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Appointments can be scheduled up to 30 days in advance
                </p>
              </div>
              
              <div className="mb-6">
                <Select
                  label="Select Doctor"
                  name="doctor"
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  options={[
                    { value: '', label: '-- Select a Doctor --', disabled: true },
                    ...doctorList.map(doctor => ({
                      value: doctor.value,
                      label: `${doctor.label} (${doctor.specialization || 'General'})`
                    }))
                  ]}
                  required
                />
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock size={20} />
                  Select Time Slot
                  {isFetchingSlots && (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  )}
                </h3>
                {!selectedDoctor ? (
                  <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                    Please select a doctor to see available time slots
                  </div>
                ) : availableSlots.length === 0 && !isFetchingSlots ? (
                  <div className="p-4 bg-red-50 text-red-800 rounded-lg text-sm">
                    No available time slots for the selected date. Please choose another date.
                  </div>
                ) : (
                  <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.isAvailable}
                        onClick={() => setSelectedTime(slot.value)}
                        className={`p-3 border-2 rounded-lg text-sm font-medium transition-all flex flex-col items-center justify-center ${
                          selectedTime === slot.value
                            ? 'border-primary-600 bg-primary-50 text-primary-700'
                            : !slot.isAvailable
                            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                            : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                        }`}
                        title={!slot.isAvailable ? 'This slot is not available' : ''}
                      >
                        <span>{slot.time}</span>
                        {!slot.isAvailable && (
                          <span className="text-xs mt-1 text-red-500">Booked</span>
                        )}
                      </button>
                    ))}
                  </div>
                  
                  {timeSlots.length === 0 && !isFetchingSlots && (
                    <div className="text-center py-4 text-gray-500">
                      No more available time slots for this day. Please select another date.
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-4">
                    <p className="flex items-center justify-center gap-2">
                      <span className="inline-block w-3 h-3 bg-primary-100 border-2 border-primary-500 rounded"></span>
                      Available
                    </p>
                    <p className="flex items-center justify-center gap-2 mt-1">
                      <span className="inline-block w-3 h-3 bg-gray-100 border-2 border-gray-300 rounded"></span>
                      Booked
                    </p>
                  </div>
                </div>
                )}
              </div>

              <Select
                label="Checkup Type"
                name="checkupType"
                value={checkupType}
                onChange={(e) => setCheckupType(e.target.value)}
                options={[
                  { value: '', label: '-- Select Checkup Type --', disabled: true },
                  ...checkupTypes
                ]}
                required
              />

              <Textarea
                label="Additional Notes"
                name="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific concerns or requirements..."
                rows={3}
              />

              <div className="flex gap-4 mt-6">
                <Button 
                  type="submit" 
                  variant="primary" 
                  size="lg" 
                  className="flex-1"
                  disabled={isLoading || !selectedDoctor || !selectedTime || !checkupType}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    'Schedule Appointment'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate('/appointments')}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Appointment Summary & History */}
        <div className="space-y-6">
          {/* Selected Appointment Summary */}
          <Card title="Appointment Summary">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-semibold">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              
              {selectedTime && (
                <div>
                  <p className="text-sm text-gray-600">Time</p>
                  <p className="font-semibold flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    {selectedTime}
                  </p>
                </div>
              )}
              
              {checkupType && (
                <div>
                  <p className="text-sm text-gray-600">Appointment Type</p>
                  <p className="font-semibold">
                    {checkupTypes.find(t => t.value === checkupType)?.label}
                  </p>
                </div>
              )}
              
              {selectedDoctor && (
                <div>
                  <p className="text-sm text-gray-600">Doctor</p>
                  <p className="font-semibold">
                    {doctorList.find(d => d.value === selectedDoctor)?.label}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {doctorList.find(d => d.value === selectedDoctor)?.specialization || 'General Practitioner'}
                  </p>
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">Estimated Duration</p>
                <p className="font-medium">30 minutes</p>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-700">
                  Please arrive 10 minutes before your scheduled time.
                </p>
              </div>
            </div>
          </Card>

          {/* Recent Appointments */}
          <Card title="Recent Appointments">
            <div className="space-y-3">
              {appointments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No appointments yet
                </p>
              ) : (
                appointments.slice(0, 5).map((apt) => (
                  <div
                    key={apt.id}
                    className="p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-medium">
                        {new Date(apt.date).toLocaleDateString()}
                      </p>
                      <Badge
                        variant={
                          apt.status === 'confirmed'
                            ? 'success'
                            : apt.status === 'pending'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {apt.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">{apt.time}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {checkupTypes.find(t => t.value === apt.type)?.label}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Info Card */}
          <Card>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-600 mt-0.5" />
                <p className="text-gray-700">
                  Appointments are typically confirmed within 2 hours
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-600 mt-0.5" />
                <p className="text-gray-700">
                  You'll receive a notification once confirmed
                </p>
              </div>
              <div className="flex items-start gap-2">
                <XCircle size={16} className="text-red-600 mt-0.5" />
                <p className="text-gray-700">
                  Sundays are closed for appointments
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ScheduleCheckup;
