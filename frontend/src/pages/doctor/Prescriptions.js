import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Filter, 
  FileText, 
  User, 
  Calendar, 
  Clock, 
  Pill,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Printer,
  Download,
  Share2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format, parseISO, isToday, isAfter, isBefore } from 'date-fns';

// Mock data - replace with real API calls
const mockPrescriptions = Array.from({ length: 15 }, (_, i) => ({
  id: `rx-${i + 1}`,
  patientId: `pat-${i + 1}`,
  patientName: `Patient ${i + 1}`,
  date: `2025-${String(10 - Math.floor(i / 5)).padStart(2, '0')}-${String(15 + (i % 10)).padStart(2, '0')}`,
  medications: [
    { 
      name: ['Amoxicillin', 'Ibuprofen', 'Lisinopril', 'Metformin', 'Atorvastatin'][i % 5],
      dosage: ['500mg', '200mg', '10mg', '1000mg', '20mg'][i % 5],
      frequency: ['Once daily', 'Twice daily', 'Three times daily', 'As needed', 'At bedtime'][i % 5],
      duration: ['7 days', '30 days', '14 days', '90 days', 'Until finished'][i % 5],
      instructions: ['Take with food', 'Take on empty stomach', 'May cause drowsiness', 'Avoid alcohol', ''][i % 5]
    },
    ...(i % 3 === 0 ? [
      {
        name: ['Acetaminophen', 'Omeprazole', 'Albuterol', 'Sertraline', 'Metoprolol'][(i + 2) % 5],
        dosage: ['325mg', '20mg', '90mcg', '50mg', '25mg'][(i + 2) % 5],
        frequency: ['As needed', 'Once daily', 'Every 4-6 hours', 'Twice daily', 'Once daily'][(i + 2) % 5],
        duration: ['30 days', '90 days', '14 days', '30 days', '30 days'][(i + 2) % 5],
        instructions: ['Take for pain', 'Take before breakfast', 'Use with inhaler', 'Take in the morning', 'Take with food'][(i + 2) % 5]
      }
    ] : [])
  ],
  status: ['active', 'expired', 'completed', 'cancelled'][i % 4],
  refills: i % 3,
  notes: i % 4 === 0 ? 'Patient has allergy to penicillin' : '',
  doctorName: 'Dr. Smith',
  doctorSpecialty: 'Cardiology',
  licenseNumber: 'MD-123456',
  signature: 'Dr. Smith',
  practiceName: 'City Medical Center',
  practiceAddress: '123 Healthcare Blvd, City, State 12345',
  practicePhone: '(555) 123-4567',
  practiceEmail: 'info@citymedical.com'
}));

const Prescriptions = ({ isNew = false }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const prescriptionsPerPage = 8;

  const filteredPrescriptions = mockPrescriptions.filter(prescription => {
    const matchesSearch = prescription.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.medications.some(med => 
                           med.name.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    
    const matchesStatus = statusFilter === 'all' || prescription.status === statusFilter;
    
    const prescriptionDate = new Date(prescription.date);
    const today = new Date();
    let matchesDate = true;
    
    if (dateFilter === 'today') {
      matchesDate = isToday(prescriptionDate);
    } else if (dateFilter === 'upcoming') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      matchesDate = isAfter(prescriptionDate, today) && isBefore(prescriptionDate, thirtyDaysFromNow);
    } else if (dateFilter === 'past') {
      matchesDate = isBefore(prescriptionDate, today) && !isToday(prescriptionDate);
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Pagination
  const indexOfLastPrescription = currentPage * prescriptionsPerPage;
  const indexOfFirstPrescription = indexOfLastPrescription - prescriptionsPerPage;
  const currentPrescriptions = filteredPrescriptions.slice(indexOfFirstPrescription, indexOfLastPrescription);
  const totalPages = Math.ceil(filteredPrescriptions.length / prescriptionsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-800',
      expired: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    
    const statusIcons = {
      active: <CheckCircle className="h-4 w-4 mr-1" />,
      expired: <Clock className="h-4 w-4 mr-1" />,
      completed: <CheckCircle className="h-4 w-4 mr-1" />,
      cancelled: <XCircle className="h-4 w-4 mr-1" />,
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status]}`}>
        {statusIcons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleViewPrescription = (id) => {
    navigate(`/doctor/prescriptions/view/${id}`);
  };
  
  const handleNewPrescription = () => {
    navigate('/doctor/prescriptions/new');
  };

  const handlePrintPrescription = (e, id) => {
    e.stopPropagation();
    console.log('Print prescription', id);
    // Implement print functionality
  };

  const handleDownloadPrescription = (e, id) => {
    e.stopPropagation();
    console.log('Download prescription', id);
    // Implement download functionality
  };

  const handleSharePrescription = (e, id) => {
    e.stopPropagation();
    console.log('Share prescription', id);
    // Implement share functionality
  };

  // New prescription form state
  const [newPrescription, setNewPrescription] = useState({
    patientId: '',
    patientName: '',
    medications: [{
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    }],
    notes: ''
  });

  const handleAddMedication = () => {
    setNewPrescription(prev => ({
      ...prev,
      medications: [
        ...prev.medications,
        { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
      ]
    }));
  };

  const handleMedicationChange = (index, field, value) => {
    const updatedMedications = [...newPrescription.medications];
    updatedMedications[index] = {
      ...updatedMedications[index],
      [field]: value
    };
    setNewPrescription({
      ...newPrescription,
      medications: updatedMedications
    });
  };

  const handleRemoveMedication = (index) => {
    if (newPrescription.medications.length > 1) {
      const updatedMedications = [...newPrescription.medications];
      updatedMedications.splice(index, 1);
      setNewPrescription({
        ...newPrescription,
        medications: updatedMedications
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement API call to save the new prescription
    console.log('New prescription:', newPrescription);
    // After successful save, redirect to prescriptions list
    navigate('/doctor/prescriptions');
  };

  if (isNew) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">New Prescription</h1>
              <p className="mt-1 text-sm text-gray-500">Create a new prescription for a patient</p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                type="button"
                onClick={() => navigate('/doctor/prescriptions')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ChevronLeft className="-ml-1 mr-2 h-5 w-5" />
                Back to Prescriptions
              </button>
              <button
                type="submit"
                form="new-prescription-form"
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Save Prescription
              </button>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <form id="new-prescription-form" onSubmit={handleSubmit} className="p-6 space-y-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="patientId" className="block text-sm font-medium text-gray-700">
                    Patient ID
                  </label>
                  <input
                    type="text"
                    id="patientId"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={newPrescription.patientId}
                    onChange={(e) => setNewPrescription({...newPrescription, patientId: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="patientName" className="block text-sm font-medium text-gray-700">
                    Patient Name
                  </label>
                  <input
                    type="text"
                    id="patientName"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={newPrescription.patientName}
                    onChange={(e) => setNewPrescription({...newPrescription, patientName: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium text-gray-900">Medications</h3>
                  <button
                    type="button"
                    onClick={handleAddMedication}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="-ml-0.5 mr-2 h-4 w-4" />
                    Add Medication
                  </button>
                </div>

                {newPrescription.medications.map((med, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4 relative">
                    {newPrescription.medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(index)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                        title="Remove medication"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    )}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Medication</label>
                        <input
                          type="text"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={med.name}
                          onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Dosage</label>
                        <input
                          type="text"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={med.dosage}
                          onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Frequency</label>
                        <select
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={med.frequency}
                          onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                          required
                        >
                          <option value="">Select frequency</option>
                          <option value="Once daily">Once daily</option>
                          <option value="Twice daily">Twice daily</option>
                          <option value="Three times daily">Three times daily</option>
                          <option value="Four times daily">Four times daily</option>
                          <option value="Every 4-6 hours">Every 4-6 hours</option>
                          <option value="As needed">As needed</option>
                          <option value="At bedtime">At bedtime</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Duration</label>
                        <input
                          type="text"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="e.g., 7 days, 1 month"
                          value={med.duration}
                          onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Instructions</label>
                        <input
                          type="text"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="e.g., Take with food"
                          value={med.instructions}
                          onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={newPrescription.notes}
                  onChange={(e) => setNewPrescription({...newPrescription, notes: e.target.value})}
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">Prescription Management</h1>
            <p className="mt-1 text-sm text-gray-500">Manage and track all patient prescriptions</p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              type="button"
              onClick={handleNewPrescription}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              New Prescription
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
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
                  placeholder="Search by patient or medication..."
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
                <option value="completed">Completed</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <select
                id="date"
                name="date"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="upcoming">Next 30 Days</option>
                <option value="past">Past</option>
              </select>
            </div>
          </div>
        </div>

        {/* Prescriptions List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {currentPrescriptions.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {currentPrescriptions.map((prescription) => (
                <li 
                  key={prescription.id}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleViewPrescription(prescription.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Pill className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {prescription.patientName}
                          <span className="ml-2 text-sm text-gray-500">
                            • {format(parseISO(prescription.date), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {prescription.medications.map((med, idx) => (
                            <span key={idx} className="mr-2">
                              {med.name} {med.dosage} {med.frequency.toLowerCase()}
                              {idx < prescription.medications.length - 1 ? ',' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-4">
                        {getStatusBadge(prescription.status)}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => handlePrintPrescription(e, prescription.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                          title="Print"
                        >
                          <Printer className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => handleDownloadPrescription(e, prescription.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                          title="Download"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => handleSharePrescription(e, prescription.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                          title="Share"
                        >
                          <Share2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No prescriptions found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search or filter to find what you\'re looking for.' : 'Get started by creating a new prescription.'}
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => navigate('/doctor/prescriptions/new')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="-ml-1 mr-2 h-4 w-4" />
                  New Prescription
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredPrescriptions.length > 0 && (
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
                  Showing <span className="font-medium">{indexOfFirstPrescription + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(indexOfLastPrescription, filteredPrescriptions.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredPrescriptions.length}</span> prescriptions
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
    </div>
  );
};

export default Prescriptions;
