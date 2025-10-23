import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  Search, 
  Plus, 
  User, 
  Mail, 
  Phone, 
  ChevronLeft, 
  ChevronRight, 
  Filter,
  FileText,
  Stethoscope,
  Activity,
  UserPlus
} from 'lucide-react';
import AssignDietitianModal from './components/AssignDietitianModal';
import { format, parseISO } from 'date-fns';

// API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const API_URL = `${API_BASE_URL}/api`;

// Status badge component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    ACTIVE: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      label: 'Active'
    },
    INACTIVE: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      label: 'Inactive'
    },
    PENDING: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      label: 'Pending'
    },
    COMPLETED: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      label: 'Completed'
    }
  };

  const config = statusConfig[status] || statusConfig.INACTIVE;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

const Patients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePatientId, setDeletePatientId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentError, setAssignmentError] = useState('');
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 8;

  // Fetch patients with prescriptions
  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching patients from:', `${API_URL}/prescriptions/all-patients`);
      const response = await fetch(`${API_URL}/prescriptions/all-patients`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch patients with prescriptions: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched patients:', data);
      setPatients(data);
      setFilteredPatients(data);
      setError(null);
    } catch (err) {
      console.error('Error in fetchPatients:', err);
      setError(err.message || 'Failed to load patients');
      toast.error('Failed to load patients. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchPatients();
  }, []);

  // Filter patients based on search term and status
  useEffect(() => {
    let result = [...patients];
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(patient => 
        (patient.fullName || '').toLowerCase().includes(searchLower) ||
        (patient.email || '').toLowerCase().includes(searchLower) ||
        (patient.phone || '').includes(searchTerm)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(patient => 
        (patient.status || '').toLowerCase() === statusFilter.toLowerCase()
      );
    }
    
    setFilteredPatients(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [patients, searchTerm, statusFilter]);

  const handleEditPrescription = (e, patientId, prescriptionId) => {
    e.stopPropagation();
    navigate(`/doctor/prescriptions/edit/${prescriptionId}`);
  };

  const handleDeletePrescription = async (e, patientId, prescriptionId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this prescription? This action cannot be undone.')) {
      try {
        setIsDeleting(prescriptionId);
        const response = await fetch(`${API_BASE_URL}/api/prescriptions/${prescriptionId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to delete prescription');
        }

        // Update the UI by removing the deleted prescription
        setPatients(prevPatients => {
          if (!prevPatients) return [];
          
          return prevPatients
            .map(patient => {
              if (patient.id === patientId) {
                // Filter out the deleted prescription
                const updatedPrescriptions = (patient.prescriptions || []).filter(
                  p => p.id !== prescriptionId
                );
                
                // Return null to filter out this patient if no prescriptions left
                if (updatedPrescriptions.length === 0) {
                  return null;
                }
                
                // Return updated patient with filtered prescriptions
                return {
                  ...patient,
                  prescriptions: updatedPrescriptions
                };
              }
              return patient;
            })
            .filter(Boolean); // Remove any null entries (patients with no prescriptions)
        });
        
        // Show success message
        alert('Prescription deleted successfully');
      } catch (err) {
        console.error('Error deleting prescription:', err);
        alert(err.message || 'Failed to delete prescription. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleOpenAssignModal = (e, patient) => {
    e.stopPropagation();
    setSelectedPatient(patient);
    setAssignmentError('');
    setAssignModalOpen(true);
  };

  const handleAssignDietitian = async (patientId, dietitianId) => {
    try {
      console.log('Assigning dietitian:', { patientId, dietitianId });
      setIsAssigning(true);
      setAssignmentError('');
      
      const url = `http://localhost:8080/api/patients/${patientId}/assign-dietitian`;
      console.log('Making request to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dietitianId }),
        credentials: 'include' // Include credentials for authentication
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = `Failed to assign dietitian. Status: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.text();
          console.error('Error response text:', errorData);
          
          // Check for specific error messages
          if (errorData.includes('is not a patient')) {
            errorMessage = 'The selected user is not registered as a patient. Please select a valid patient to assign a dietitian.';
          } else {
            // Try to parse as JSON if possible
            try {
              const jsonError = JSON.parse(errorData);
              errorMessage = jsonError.message || errorMessage;
            } catch (e) {
              // If not JSON, use the text as is
              errorMessage = errorData || errorMessage;
            }
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        throw new Error(errorMessage);
      }
      
      // Refresh the patients list to show the updated assignment
      await fetchPatients();
      
      // Show success message
      toast.success('Dietitian assigned successfully!');

      // Update the patient in the local state with the assigned dietitian
      setPatients(prevPatients => 
        prevPatients.map(patient => {
          if (patient.id === patientId) {
            const dietitian = { id: dietitianId, name: '' }; // The name will be updated in the next fetch
            return { ...patient, assignedDietitian: dietitian };
          }
          return patient;
        })
      );

      return true;
    } catch (err) {
      console.error('Error assigning dietitian:', err);
      setAssignmentError(err.message || 'Failed to assign dietitian. Please try again.');
      throw err;
    } finally {
      setIsAssigning(false);
    }
  };

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
  
  if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>;

  if (filteredPatients.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
          <User className="h-6 w-6 text-blue-600" />
        </div>
        <h3 className="mt-2 text-lg font-medium text-gray-900">No patients found</h3>
        <p className="mt-1 text-sm text-gray-500">
          {searchTerm || statusFilter !== 'all' 
            ? 'No patients match your search criteria.' 
            : 'There are currently no patients with prescriptions.'}
        </p>
      </div>
    );
  }
  
  // Calculate pagination
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
    };
    
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleViewPatient = (id) => {
    navigate(`/doctor/patients/${id}`);
  };

  const handleViewRecords = (e, id) => {
    e.stopPropagation();
    navigate(`/doctor/patients/${id}/records`);
  };

  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Patients
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage your patients and their medical records
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Filter className="-ml-1 mr-2 h-4 w-4 text-gray-500" />
              Filter
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Patients
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="search"
                  id="search"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Patients Grid */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {currentPatients.length > 0 ? (
            currentPatients.map((patient) => (
              <div 
                key={patient.id} 
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200 cursor-pointer"
                onClick={() => handleViewPatient(patient.id)}
              >
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {patient.fullName || 'Unknown Patient'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {patient.dob ? `${calculateAge(patient.dob)} years` : ''} {patient.gender ? `• ${patient.gender}` : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Mail className="flex-shrink-0 mr-2 h-4 w-4 text-gray-400" />
                      <span className="truncate">{patient.email}</span>
                    </div>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <Phone className="flex-shrink-0 mr-2 h-4 w-4 text-gray-400" />
                      {patient.phone || 'N/A'}
                    </div>
                    {patient.prescriptionDate && (
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <span className="font-medium">Last Prescription: </span>
                        <span className="ml-1">
                          {(() => {
                            try {
                              const date = new Date(patient.prescriptionDate);
                              return isNaN(date.getTime()) ? 'N/A' : format(date, 'MMM d, yyyy');
                            } catch (e) {
                              return 'N/A';
                            }
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Prescription Status:</span>
                      <StatusBadge status={patient.status} />
                    </div>
                    {patient.diagnosis && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">Diagnosis</p>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {patient.diagnosis}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Medications</p>
                    <div className="space-y-2">
                      {patient.medications && patient.medications.length > 0 ? (
                        patient.medications.slice(0, 2).map((med, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="font-medium">{med.name}</span>
                            <span className="text-gray-600">{med.dosage} - {med.frequency}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No medications recorded</p>
                      )}
                      {patient.medications && patient.medications.length > 2 && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            // Navigate to full prescription details
                            navigate(`/doctor/prescriptions/prescription/${patient.prescriptionId}`);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          + {patient.medications.length - 2} more medications
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between space-x-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => patient.prescriptionId && handleEditPrescription(e, patient.id, patient.prescriptionId)}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        title="Edit Prescription"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={(e) => patient.prescriptionId && handleDeletePrescription(e, patient.id, patient.prescriptionId)}
                        disabled={isDeleting === patient.prescriptionId}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        title="Delete Prescription"
                      >
                        {isDeleting === patient.prescriptionId ? (
                          <svg className="animate-spin -ml-1 mr-1 h-3.5 w-3.5 text-red-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                        {isDeleting === patient.prescriptionId ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                    <button
                      onClick={(e) => handleOpenAssignModal(e, patient)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      title="Assign Dietitian"
                      disabled={isAssigning}
                    >
                      <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                      {patient.assignedDietitian ? 'Change Dietitian' : 'Assign Dietitian'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                <User className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No patients found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search or filter to find what you\'re looking for.' : 'Get started by adding a new patient.'}
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => navigate('/doctor/patients/new')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="-ml-1 mr-2 h-4 w-4" />
                  New Patient
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredPatients.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-b-lg">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstPatient + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(indexOfLastPatient, filteredPatients.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredPatients.length}</span> patients
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
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
                        onClick={() => paginate(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border ${
                          currentPage === pageNum 
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' 
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        } text-sm font-medium`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Assign Dietitian Modal */}
      <AssignDietitianModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        patientId={selectedPatient?.id}
        patientName={selectedPatient?.fullName || 'this patient'}
        onAssign={handleAssignDietitian}
        isAssigning={isAssigning}
      />
    </div>
  );
};

export default Patients;
