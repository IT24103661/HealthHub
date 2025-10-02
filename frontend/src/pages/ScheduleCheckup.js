import React, { useState } from 'react';
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
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const ScheduleCheckup = () => {
  const { scheduleAppointment, appointments } = useApp();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [checkupType, setCheckupType] = useState('');
  const [notes, setNotes] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  ];

  const checkupTypes = [
    { value: 'general', label: 'General Health Checkup' },
    { value: 'nutrition', label: 'Nutrition Consultation' },
    { value: 'followup', label: 'Follow-up Visit' },
    { value: 'diet-review', label: 'Diet Plan Review' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime || !checkupType) {
      toast.error('Please fill in all required fields');
      return;
    }

    const appointment = {
      date: selectedDate,
      time: selectedTime,
      type: checkupType,
      notes,
    };

    try {
      await scheduleAppointment(appointment);
      setShowSuccess(true);
      toast.success('Appointment request submitted successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      toast.error('Failed to schedule appointment');
    }
  };

  const isDateDisabled = ({ date }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || date.getDay() === 0; // Disable past dates and Sundays
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
                    tileDisabled={isDateDisabled}
                    className="border-0 shadow-none"
                  />
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock size={20} />
                  Select Time Slot
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                        selectedTime === time
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <Select
                label="Checkup Type"
                name="checkupType"
                value={checkupType}
                onChange={(e) => setCheckupType(e.target.value)}
                options={checkupTypes}
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
                <Button type="submit" variant="primary" size="lg" className="flex-1">
                  Submit Request
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate('/dashboard')}
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
            <div className="space-y-3">
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
                  <p className="font-semibold">{selectedTime}</p>
                </div>
              )}
              {checkupType && (
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-semibold">
                    {checkupTypes.find(t => t.value === checkupType)?.label}
                  </p>
                </div>
              )}
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
