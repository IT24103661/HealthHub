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
  XCircle,
  Loader2
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format, parseISO, isToday, isAfter, isBefore } from 'date-fns';

// API base URL
const API_URL = 'http://localhost:8080/api';

// Helper function to format prescription status
const getPrescriptionStatus = (validUntil) => {
  if (!validUntil) return 'active';
  const today = new Date();
  const validDate = new Date(validUntil);
  return isAfter(validDate, today) ? 'active' : 'expired';
};

const Prescriptions = () => {
  // State hooks must be called at the top level
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const prescriptionsPerPage = 8;
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Fetch prescriptions from API
  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const response = await fetch(`${API_URL}/prescriptions`);
        if (!response.ok) {
          throw new Error('Failed to fetch prescriptions');
        }
        const data = await response.json();
        
        // Format prescriptions data
        const formattedPrescriptions = data.map(prescription => ({
          ...prescription,
          status: getPrescriptionStatus(prescription.validUntil),
          date: format(new Date(prescription.prescriptionDate), 'yyyy-MM-dd'),
          // The backend already provides patientName directly
          patientName: prescription.patientName || 'Unknown Patient'
        }));
        
        setPrescriptions(formattedPrescriptions);
      } catch (err) {
        console.error('Error fetching prescriptions:', err);
        setError('Failed to load prescriptions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  const filteredPrescriptions = prescriptions.filter(prescription => {
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

  const generatePrescriptionPdf = (prescription, action = 'print') => {
    setIsGeneratingPdf(true);
    
    // Create a new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Add header with logo and clinic info
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235); // Blue color
    doc.text('HealthHub Medical Center', pageWidth / 2, 25, { align: 'center' });
    
    // Add address and contact info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('123 Medical Drive, City, Country • Phone: (123) 456-7890 • Email: info@healthhub.com', 
      pageWidth / 2, 32, { align: 'center' });
    
    // Add title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PRESCRIPTION', pageWidth / 2, 50, { align: 'center' });
    
    // Add date and prescription ID
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${new Date(prescription.prescriptionDate).toLocaleDateString()}`, 20, 65);
    doc.text(`Prescription #: ${prescription.id}`, pageWidth - 20, 65, { align: 'right' });
    
    // Add doctor and patient info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Doctor:', 20, 85);
    doc.text('Patient:', pageWidth / 2 + 10, 85);
    
    doc.setFont('helvetica', 'normal');
    doc.text(prescription.doctorName, 40, 85);
    doc.text(prescription.patientName, pageWidth / 2 + 30, 85);
    
    // Add diagnosis
    if (prescription.diagnosis) {
      doc.setFont('helvetica', 'bold');
      doc.text('Diagnosis:', 20, 100);
      doc.setFont('helvetica', 'normal');
      doc.text(prescription.diagnosis, 45, 100);
    }
    
    // Add medications section
    if (prescription.medications && prescription.medications.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Medications:', 20, 120);
      doc.setFont('helvetica', 'normal');
      
      let yPos = 130;
      prescription.medications.forEach((med, index) => {
        // Add medication details
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${med.name}`, 25, yPos);
        doc.setFont('helvetica', 'normal');
        
        // Add dosage if available
        if (med.dosage) {
          doc.text(`   Dosage: ${med.dosage}`, 30, yPos + 7);
          yPos += 7;
        }
        
        // Add frequency if available
        if (med.frequency) {
          doc.text(`   Frequency: ${med.frequency}`, 30, yPos + 7);
          yPos += 7;
        }
        
        // Add instructions if available
        if (med.instructions) {
          const instructions = doc.splitTextToSize(`   Instructions: ${med.instructions}`, pageWidth - 50);
          doc.text(instructions, 30, yPos + 7);
          yPos += instructions.length * 7; // Approximate line height
        }
        
        yPos += 10; // Space between medications
        
        // Add a new page if we're near the bottom
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = 20;
        }
      });
    }
    
    // Add notes if available
    let notesYPos = 130; // Default Y position for notes if no medications
    
    // If we have medications, position notes after them
    if (prescription.medications && prescription.medications.length > 0) {
      // Position notes after the last medication
      notesYPos = 130 + (prescription.medications.length * 30); // Approximate height per medication
    }
    
    if (prescription.notes) {
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 20, notesYPos);
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(prescription.notes, pageWidth - 40);
      doc.text(splitNotes, 25, notesYPos + 10);
      
      // Update notesYPos for footer calculation
      notesYPos += 20 + (splitNotes.length * 7);
    }
    
    // Add footer
    let footerY = pageHeight - 20;
    
    // Use notesYPos or current position for footer placement
    const currentY = notesYPos || (doc.lastTextPos ? doc.lastTextPos().y : pageHeight - 40);
    if (currentY > footerY - 10) {
      doc.addPage();
      footerY = 20;
    } else {
      footerY = currentY + 20;
    }
    
    doc.setFontSize(8);
    doc.text('This is a computer-generated prescription. No signature required.', 
      pageWidth / 2, footerY, { align: 'center' });
    
    // Add validity if available
    if (prescription.validUntil) {
      doc.text(`Valid until: ${new Date(prescription.validUntil).toLocaleDateString()}`, 
        pageWidth / 2, footerY + 5, { align: 'center' });
    }
    
    // Save or print the PDF
    if (action === 'download') {
      doc.save(`prescription-${prescription.id}.pdf`);
    } else {
      // For printing, we need to create a blob and open it in a new window
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl);
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    
    setIsGeneratingPdf(false);
  };
  
  const handlePrintPrescription = (e, id) => {
    e.stopPropagation();
    const prescription = prescriptions.find(p => p.id === id);
    if (prescription) {
      generatePrescriptionPdf(prescription, 'print');
    }
  };
  
  const handleDownloadPdf = (e, id) => {
    e.stopPropagation();
    const prescription = prescriptions.find(p => p.id === id);
    if (prescription) {
      generatePrescriptionPdf(prescription, 'download');
    }
  };

  const handleDownloadPrescription = (e, id) => {
    e.stopPropagation();
    console.log('Download prescription', id);
    // Implement download functionality
  };

  const handleSharePrescription = (e, id) => {
    e.stopPropagation();
    const prescription = prescriptions.find(p => p.id === id);
    if (!prescription) return;

    // Create share text
    let shareText = `Prescription for ${prescription.patientName}\n`;
    shareText += `Date: ${new Date(prescription.prescriptionDate).toLocaleDateString()}\n`;
    shareText += `Doctor: ${prescription.doctorName}\n\n`;
    
    shareText += 'Medications:\n';
    if (prescription.medications && prescription.medications.length > 0) {
      prescription.medications.forEach(med => {
        shareText += `- ${med.name}`;
        if (med.dosage) shareText += ` (${med.dosage})`;
        if (med.frequency) shareText += `, ${med.frequency}`;
        shareText += '\n';
      });
    } else {
      shareText += 'No medications\n';
    }
    
    if (prescription.notes) {
      shareText += `\nNotes: ${prescription.notes}\n\n`;
    }
    
    shareText += 'Generated by HealthHub - Your trusted healthcare partner';

    // Simple copy to clipboard with fallback
    const textArea = document.createElement('textarea');
    textArea.value = shareText;
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        alert('Prescription details copied to clipboard!');
      } else {
        // Fallback if execCommand doesn't work
        window.prompt('Copy to clipboard: Ctrl+C, Enter', shareText);
      }
    } catch (err) {
      // Final fallback
      window.prompt('Copy to clipboard: Ctrl+C, Enter', shareText);
    }
    
    document.body.removeChild(textArea);
  };
  
  // Handle new prescription button click
  const handleNewPrescription = () => {
    navigate('/doctor/prescriptions/new');
  };

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
                          {prescription.medications && prescription.medications.length > 0 ? (
                            prescription.medications.map((med, idx) => (
                              <span key={idx} className="mr-2">
                                {med.name} {med.dosage} {med.frequency?.toLowerCase() || ''}
                                {idx < prescription.medications.length - 1 ? ', ' : ''}
                              </span>
                            ))
                          ) : (
                            <span>No medications listed</span>
                          )}
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
                          className="p-1 text-gray-400 hover:text-blue-600 focus:outline-none transition-colors"
                          title="Print"
                          disabled={isGeneratingPdf}
                        >
                          {isGeneratingPdf ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Printer className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={(e) => handleDownloadPdf(e, prescription.id)}
                          className="p-1 text-gray-400 hover:text-green-600 focus:outline-none transition-colors"
                          title="Download PDF"
                          disabled={isGeneratingPdf}
                        >
                          {isGeneratingPdf ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Download className="h-5 w-5" />
                          )}
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
