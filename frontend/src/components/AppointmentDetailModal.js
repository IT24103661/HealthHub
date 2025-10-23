import React from 'react';
import { X, Calendar, Clock, User, Stethoscope, MapPin, AlertCircle, CheckCircle, XCircle, Clock as ClockIcon, FileText, Phone, Mail, RefreshCw } from 'lucide-react';

const AppointmentDetailModal = ({ 
  isOpen, 
  onClose, 
  appointment,
  onAccept,
  onReschedule,
  onCancel
}) => {
  if (!isOpen || !appointment) return null;

  const getStatusBadge = (status) => {
    const statusConfig = {
      scheduled: {
        label: 'Scheduled',
        icon: <ClockIcon className="w-4 h-4 mr-1" />,
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      },
      completed: {
        label: 'Completed',
        icon: <CheckCircle className="w-4 h-4 mr-1" />,
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      },
      cancelled: {
        label: 'Cancelled',
        icon: <XCircle className="w-4 h-4 mr-1" />,
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      },
      'no-show': {
        label: 'No Show',
        icon: <AlertCircle className="w-4 h-4 mr-1" />,
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      },
      pending: {
        label: 'Pending',
        icon: <ClockIcon className="w-4 h-4 mr-1" />,
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      }
    };

    const config = statusConfig[status?.toLowerCase()] || {
      label: status || 'Unknown',
      icon: <AlertCircle className="w-4 h-4 mr-1" />,
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minutes} ${ampm}`;
    } catch (e) {
      return 'Invalid time';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white dark:bg-gray-700 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Appointment Details
              </h3>
              
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Patient Information
                    </h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-900 dark:text-white font-medium">
                        {appointment.patient || 'N/A'}
                      </p>
                      {appointment.patientId && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {appointment.patientId}
                        </p>
                      )}
                      {appointment.patientPhone && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                          <Phone className="mr-2 h-4 w-4" />
                          {appointment.patientPhone}
                        </p>
                      )}
                      {appointment.patientEmail && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                          <Mail className="mr-2 h-4 w-4" />
                          {appointment.patientEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      Appointment Details
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-900 dark:text-white">
                        <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                        {formatDate(appointment.date)}
                      </div>
                      <div className="flex items-center text-sm text-gray-900 dark:text-white">
                        <Clock className="mr-2 h-4 w-4 text-gray-500" />
                        {formatTime(appointment.time)}
                      </div>
                      <div className="flex items-center text-sm text-gray-900 dark:text-white">
                        <Stethoscope className="mr-2 h-4 w-4 text-gray-500" />
                        {appointment.type || 'N/A'}
                      </div>
                      <div className="flex items-center">
                        {getStatusBadge(appointment.status)}
                      </div>
                    </div>
                  </div>
                </div>

                {(appointment.notes || appointment.reason) && (
                  <div className="mt-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      {appointment.notes ? 'Notes' : 'Reason for Visit'}
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {appointment.notes || appointment.reason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-3 sm:gap-3 sm:grid-flow-row-dense">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
              onClick={() => {
                onClose();
              }}
            >
              Close
            </button>
            
            {appointment.status === 'scheduled' && (
              <>
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm"
                  onClick={() => {
                    console.log('Appointment object in modal:', appointment);
                    console.log('Appointment ID in modal:', appointment.id);
                    console.log('Appointment _id in modal:', appointment._id);
                    onAccept(appointment.id || appointment._id);
                  }}
                >
                  <CheckCircle className="-ml-1 mr-2 h-5 w-5" />
                  Accept
                </button>
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  onClick={() => {
                    onReschedule(appointment.id);
                  }}
                >
                  <RefreshCw className="-ml-1 mr-2 h-5 w-5" />
                  Reschedule
                </button>
              </>
            )}
            
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-span-3 sm:text-sm"
              onClick={() => {
                onCancel(appointment.id);
              }}
            >
              Cancel Appointment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailModal;
