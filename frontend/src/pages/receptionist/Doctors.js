import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Mail, Phone, Stethoscope, Clock, Search, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useApp();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8080/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch doctors');
        }

        const data = await response.json();
        // Filter users with role 'doctor' (case-insensitive)
        const doctorList = data.users.filter(user => 
          user.role && user.role.toLowerCase() === 'doctor'
        );
        
        setDoctors(doctorList);
      } catch (error) {
        console.error('Error fetching doctors:', error);
        toast.error('Failed to load doctors. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Filter doctors based on search term
  const filteredDoctors = doctors.filter(doctor => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (doctor.fullName && doctor.fullName.toLowerCase().includes(searchLower)) ||
      (doctor.email && doctor.email.toLowerCase().includes(searchLower)) ||
      (doctor.specialization && doctor.specialization.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const generateReport = () => {
    // Create a new PDF document with landscape orientation
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Set document properties
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const tableStartY = 50;
    
    // Add header
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, pageWidth, 30, 'F');
    
    // Add title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('HEALTHCARE PROVIDERS DIRECTORY', pageWidth / 2, 20, { align: 'center' });
    
    // Add subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Authorized Personnel Only - Confidential', pageWidth / 2, 27, { align: 'center' });
    
    // Add report info
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 40);
    doc.text(`Total Doctors: ${filteredDoctors.length}`, pageWidth - margin, 40, { align: 'right' });
    
    // Add table
    const tableColumn = [
      { header: 'DOCTOR NAME', dataKey: 'name' },
      { header: 'SPECIALIZATION', dataKey: 'specialization' },
      { header: 'CONTACT', dataKey: 'contact' },
      { header: 'STATUS', dataKey: 'status' },
      { header: 'LAST UPDATED', dataKey: 'updated' }
    ];
    
    const tableRows = filteredDoctors.map(doctor => ({
      name: doctor.fullName || 'N/A',
      specialization: doctor.specialization || 'General Practitioner',
      contact: [
        doctor.email || 'No email',
        doctor.phone ? `Tel: ${doctor.phone}` : ''
      ].filter(Boolean).join('\n'),
      status: doctor.status 
        ? doctor.status.charAt(0).toUpperCase() + doctor.status.slice(1)
        : 'N/A',
      updated: doctor.updatedAt 
        ? new Date(doctor.updatedAt).toLocaleDateString() 
        : 'N/A'
    }));
    
    // Generate table
    autoTable(doc, {
      head: [tableColumn.map(col => col.header)],
      body: tableRows.map(row => tableColumn.map(col => row[col.dataKey])),
      startY: tableStartY,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        lineColor: [221, 221, 221],
        lineWidth: 0.5,
        valign: 'middle',
        overflow: 'linebreak',
        minCellHeight: 15
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10,
        cellPadding: 5
      },
      columnStyles: {
        0: { cellWidth: 'auto', fontStyle: 'bold' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 'auto' }
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      },
      didDrawPage: function(data) {
        // Footer on each page
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${data.pageNumber} of ${data.pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
        
        // Add confidentiality notice
        doc.setFontSize(7);
        doc.text(
          'CONFIDENTIAL - This document contains privileged and confidential information. Unauthorized disclosure is prohibited.',
          pageWidth / 2,
          pageHeight - 5,
          { align: 'center' }
        );
      }
    });
    
    // Add watermark
    const pageCount = doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Set watermark text properties
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(40);
      doc.setTextColor(230, 230, 230);
      
      // Calculate center position
      const text = 'CONFIDENTIAL';
      const textWidth = doc.getTextWidth(text);
      const x = (pageWidth - textWidth) / 2;
      const y = pageHeight / 2;
      
      // Draw watermark text
      doc.text(text, x, y, { opacity: 0.1 });
    }
    
    // Save the PDF with a professional filename
    const formattedDate = new Date().toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .slice(0, 19);
    
    doc.save(`Doctors_Directory_${formattedDate}.pdf`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Doctors</h1>
          <p className="text-gray-600 dark:text-gray-300">
            View and manage all doctors in the system
          </p>
        </div>
        <button
          onClick={generateReport}
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search doctors by name, email, or specialization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Doctors Grid */}
      {filteredDoctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDoctors.map((doctor) => (
            <div 
              key={doctor.id || doctor._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl font-medium">
                    {doctor.fullName ? doctor.fullName.charAt(0).toUpperCase() : 'D'}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {doctor.fullName || 'Unnamed Doctor'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {doctor.specialization || 'General Practitioner'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {doctor.email || 'No email provided'}
                    </span>
                  </div>
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {doctor.phone || 'No phone number'}
                    </span>
                  </div>
                  {doctor.availability && (
                    <div className="flex items-start">
                      <Clock className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {doctor.availability}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 flex justify-end">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  doctor.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                  doctor.status === 'on leave' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {doctor.status ? doctor.status.charAt(0).toUpperCase() + doctor.status.slice(1) : 'Unknown'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <Stethoscope className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No doctors found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm ? 'Try adjusting your search or filter to find what you\'re looking for.' : 'There are no doctors registered in the system yet.'}
          </p>
        </div>
      )}
    </div>
  );
}
