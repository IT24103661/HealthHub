import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, XCircle, ChevronLeft, Search, User } from 'lucide-react';
import { format } from 'date-fns';

// API base URL
const API_URL = 'http://localhost:8080/api';

const PrescriptionForm = ({ isEditing = false, initialData = null, onSave, onCancel }) => {
  const navigate = useNavigate();
  
  // Initialize form state with default values or existing data
  const [formData, setFormData] = useState({
    patientId: initialData?.patientId || '',
    patientName: initialData?.patientName || '',
    diagnosis: initialData?.diagnosis || '',
    notes: initialData?.notes || '',
    validUntil: initialData?.validUntil || '',
    medications: initialData?.medications?.length > 0 
      ? [...initialData.medications] 
      : [{
          name: '',
          dosage: '',
          frequency: 'Once daily',
          duration: '',
          instructions: ''
        }]
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for patient search and selection
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  
  // Fetch patients who have had appointments with the current doctor
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setIsLoadingPatients(true);
        // Get the current doctor's ID from the user context or local storage
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const doctorId = currentUser.id;
        
        if (!doctorId) {
          throw new Error('Doctor ID not found');
        }
        
        // Use the appointments endpoint which we know is working
        const response = await fetch(`${API_URL}/appointments/doctor/${doctorId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch appointments: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Extract unique patients from appointments
        const uniquePatients = [];
        const patientIds = new Set();
        
        if (Array.isArray(data)) {
          data.forEach(appointment => {
            if (appointment.patient && !patientIds.has(appointment.patient.id)) {
              patientIds.add(appointment.patient.id);
              uniquePatients.push({
                id: appointment.patient.id,
                ...appointment.patient,
                // Ensure we have all required fields with defaults
                firstName: appointment.patient.firstName || 'Unknown',
                lastName: appointment.patient.lastName || 'Patient',
                email: appointment.patient.email || '',
                phone: appointment.patient.phone || '',
                dob: appointment.patient.dob,
                gender: appointment.patient.gender,
                bloodGroup: appointment.patient.bloodGroup
              });
            }
          });
        }
        
        setPatients(uniquePatients);
        
      } catch (error) {
        console.error('Error fetching patients:', error);
        setErrors(prev => ({
          ...prev,
          patient: error.message.includes('Failed to fetch') 
            ? 'Unable to connect to the server. Please check your connection.'
            : 'Failed to load patients. Please try again.'
        }));
      } finally {
        setIsLoadingPatients(false);
      }
    };
    
    fetchPatients();
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (event.target.closest('.patient-search-container') === null) {
        setShowPatientDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Filter patients based on search term
  const filteredPatients = patients.filter(patient => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.firstName.toLowerCase().includes(searchLower) ||
      patient.lastName.toLowerCase().includes(searchLower) ||
      patient.email?.toLowerCase().includes(searchLower) ||
      patient.phone?.includes(searchTerm) ||
      patient.patientId?.toLowerCase().includes(searchLower)
    );
  });
  
  // Handle patient selection
  const handlePatientSelect = (patient) => {
    setFormData(prev => ({
      ...prev,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patient: { ...patient } // Store a copy of the patient data
    }));
    setSearchTerm(`${patient.firstName} ${patient.lastName}`);
    setShowPatientDropdown(false);
  };

  // Clear selected patient
  const handleClearPatient = () => {
    setFormData(prev => ({
      ...prev,
      patientId: '',
      patientName: '',
      patient: null
    }));
    setSearchTerm('');
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If patient search input changes, show dropdown
    if (name === 'patientSearch') {
      setSearchTerm(value);
      if (value.length > 0) {
        setShowPatientDropdown(true);
      } else {
        setShowPatientDropdown(false);
      }
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle medication changes
  const handleMedicationChange = (index, field, value) => {
    const updatedMedications = [...formData.medications];
    updatedMedications[index] = {
      ...updatedMedications[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      medications: updatedMedications
    }));
  };

  // Add a new medication field
  const addMedication = () => {
    setFormData(prev => ({
      ...prev,
      medications: [
        ...prev.medications,
        {
          name: '',
          dosage: '',
          frequency: 'Once daily',
          duration: '',
          instructions: ''
        }
      ]
    }));
  };

  // Remove a medication field
  const removeMedication = (index) => {
    if (formData.medications.length > 1) {
      const updatedMedications = formData.medications.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        medications: updatedMedications
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // Validate patient selection
    if (!formData.patientId) {
      newErrors.patientId = 'Please select a patient';
    }
    
    // Validate medications
    formData.medications.forEach((med, index) => {
      if (!med.name) newErrors[`medication-${index}-name`] = 'Medication name is required';
      if (!med.dosage) newErrors[`medication-${index}-dosage`] = 'Dosage is required';
      if (!med.duration) newErrors[`medication-${index}-duration`] = 'Duration is required';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const url = isEditing && initialData?.id 
        ? `${API_URL}/prescriptions/${initialData.id}`
        : `${API_URL}/prescriptions`;
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} prescription`);
      }

      const result = await response.json();
      
      if (onSave) {
        onSave(result);
      } else {
        // Default navigation if no onSave callback is provided
        navigate('/doctor/prescriptions');
      }
    } catch (error) {
      console.error('Error saving prescription:', error);
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Prescription' : 'New Prescription'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isEditing ? 'Update the prescription details' : 'Create a new prescription for a patient'}
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              type="button"
              onClick={onCancel || (() => navigate('/doctor/prescriptions'))}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ChevronLeft className="-ml-1 mr-2 h-5 w-5" />
              Back to Prescriptions
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? (
                'Saving...'
              ) : (
                <>
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  {isEditing ? 'Update Prescription' : 'Create Prescription'}
                </>
              )}
            </button>
          </div>
        </div>

        {errors.submit && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Patient Information</h3>
              <div className="mt-6 space-y-4">
                {/* Patient Selection */}
                <div>
                  <div className="flex justify-between items-center">
                    <label htmlFor="patientSearch" className="block text-sm font-medium text-gray-700">
                      Patient Information {formData.patient && <span className="text-green-600 ml-2">✓ Selected</span>}
                    </label>
                    {formData.patient && (
                      <button
                        type="button"
                        onClick={handleClearPatient}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Change Patient
                      </button>
                    )}
                  </div>
                  
                  {!formData.patient ? (
                    <div className="mt-1 relative patient-search-container">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="patientSearch"
                          id="patientSearch"
                          value={searchTerm}
                          onChange={handleChange}
                          onFocus={() => setShowPatientDropdown(true)}
                          placeholder="Search for a patient by name or ID..."
                          className="pl-10 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          autoComplete="off"
                        />
                        {isLoadingPatients && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                          </div>
                        )}
                      </div>
                      {showPatientDropdown && filteredPatients.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm min-w-[300px]">
                          {filteredPatients.map((patient) => (
                            <div
                              key={patient.id}
                              className="text-gray-900 cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-blue-50"
                              onClick={() => handlePatientSelect(patient)}
                            >
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <User className="h-6 w-6 text-gray-500" />
                                </div>
                                <div className="ml-3">
                                  <p className="font-medium">{patient.firstName} {patient.lastName}</p>
                                  <p className="text-xs text-gray-500">
                                    {patient.email} • {patient.phone || 'No phone'}
                                  </p>
                                  {patient.dob && (
                                    <p className="text-xs text-gray-500">
                                      DOB: {format(new Date(patient.dob), 'MM/dd/yyyy')}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Patient Information Card - Only show when a patient is selected */}
              {formData.patient && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900">
                        {formData.patient.firstName} {formData.patient.lastName}
                      </h4>
                      <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        {formData.patient.patientId && (
                          <div className="flex items-start">
                            <span className="text-gray-500 w-20 flex-shrink-0">Patient ID:</span>
                            <span className="font-medium break-all">{formData.patient.patientId}</span>
                          </div>
                        )}
                        {formData.patient.gender && (
                          <div className="flex items-start">
                            <span className="text-gray-500 w-20 flex-shrink-0">Gender:</span>
                            <span className="font-medium">
                              {formData.patient.gender.charAt(0).toUpperCase() + formData.patient.gender.slice(1)}
                            </span>
                          </div>
                        )}
                        {formData.patient.email && (
                          <div className="flex items-start">
                            <span className="text-gray-500 w-20 flex-shrink-0">Email:</span>
                            <span className="font-medium break-all">{formData.patient.email}</span>
                          </div>
                        )}
                        {formData.patient.phone && (
                          <div className="flex items-start">
                            <span className="text-gray-500 w-20 flex-shrink-0">Phone:</span>
                            <span className="font-medium">{formData.patient.phone}</span>
                          </div>
                        )}
                        {(formData.patient.dob || formData.patient.dateOfBirth) && (
                          <div className="flex items-start">
                            <span className="text-gray-500 w-20 flex-shrink-0">DOB:</span>
                            <span className="font-medium">
                              {format(new Date(formData.patient.dob || formData.patient.dateOfBirth), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}
                        {(formData.patient.dob || formData.patient.dateOfBirth) && (
                          <div className="flex items-start">
                            <span className="text-gray-500 w-20 flex-shrink-0">Age:</span>
                            <span className="font-medium">
                              {Math.floor(
                                (new Date() - new Date(formData.patient.dob || formData.patient.dateOfBirth)) / 
                                (365.25 * 24 * 60 * 60 * 1000)
                              )} years
                            </span>
                          </div>
                        )}
                      </div>
                      {formData.patient.bloodGroup && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Blood Group: {formData.patient.bloodGroup}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="sm:col-span-6">
                  <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700">
                    Diagnosis
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="diagnosis"
                      id="diagnosis"
                      value={formData.diagnosis}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="e.g., Hypertension, Type 2 Diabetes"
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700">
                    Valid Until
                  </label>
                  <div className="mt-1">
                    <input
                      type="date"
                      name="validUntil"
                      id="validUntil"
                      value={formData.validUntil}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Medications</h3>
                <button
                  type="button"
                  onClick={addMedication}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="-ml-1 mr-1 h-4 w-4" />
                  Add Medication
                </button>
              </div>

              <div className="mt-6 space-y-6">
                {formData.medications.map((medication, index) => (
                  <div key={index} className="relative bg-gray-50 p-4 rounded-lg border border-gray-200">
                    {formData.medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedication(index)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                        title="Remove medication"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    )}
                    
                    <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Medication Name *
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            value={medication.name}
                            onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                            className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                              errors[`medication-${index}-name`] ? 'border-red-300' : ''
                            }`}
                            placeholder="e.g., Amoxicillin, Ibuprofen"
                          />
                          {errors[`medication-${index}-name`] && (
                            <p className="mt-1 text-sm text-red-600">{errors[`medication-${index}-name`]}</p>
                          )}
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Dosage *
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            value={medication.dosage}
                            onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                            className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                              errors[`medication-${index}-dosage`] ? 'border-red-300' : ''
                            }`}
                            placeholder="e.g., 500mg, 1 tablet"
                          />
                          {errors[`medication-${index}-dosage`] && (
                            <p className="mt-1 text-sm text-red-600">{errors[`medication-${index}-dosage`]}</p>
                          )}
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Frequency
                        </label>
                        <div className="mt-1">
                          <select
                            value={medication.frequency}
                            onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          >
                            <option value="Once daily">Once daily</option>
                            <option value="Twice daily">Twice daily</option>
                            <option value="Three times daily">Three times daily</option>
                            <option value="Four times daily">Four times daily</option>
                            <option value="Every 4-6 hours">Every 4-6 hours</option>
                            <option value="As needed">As needed</option>
                            <option value="At bedtime">At bedtime</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Duration *
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            value={medication.duration}
                            onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                            className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                              errors[`medication-${index}-duration`] ? 'border-red-300' : ''
                            }`}
                            placeholder="e.g., 7 days, 1 month"
                          />
                          {errors[`medication-${index}-duration`] && (
                            <p className="mt-1 text-sm text-red-600">{errors[`medication-${index}-duration`]}</p>
                          )}
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Instructions
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            value={medication.instructions}
                            onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            placeholder="e.g., Take with food"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Additional Notes</h3>
              <div className="mt-4">
                <label htmlFor="notes" className="sr-only">
                  Additional notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                  placeholder="Any additional instructions or notes..."
                  value={formData.notes}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel || (() => navigate('/doctor/prescriptions'))}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Prescription' : 'Create Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PrescriptionForm;
