import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Table from '../components/Table';
import { Activity, Calendar, FileText, Users, TrendingUp, Clock, Eye, Edit, Trash2, Search, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const { user, users, notifications, appointments, dietPlans, reports } = useApp();
  const navigate = useNavigate();
  const [healthData, setHealthData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  // Filter health data based on search term
  const filteredHealthData = useMemo(() => {
    if (!searchTerm) return healthData;
    
    const term = searchTerm.toLowerCase();
    return healthData.filter(item => {
      return (
        String(item.age || '').toLowerCase().includes(term) ||
        String(item.weight || '').toLowerCase().includes(term) ||
        String(item.height || '').toLowerCase().includes(term) ||
        String(item.activityLevel || '').toLowerCase().includes(term) ||
        String(item.healthGoal || '').toLowerCase().includes(term) ||
        new Date(item.date).toLocaleDateString().toLowerCase().includes(term)
      );
    });
  }, [healthData, searchTerm]);

  // Calculate derived health data from filtered data
  const latestHealthData = filteredHealthData.length > 0 ? filteredHealthData[filteredHealthData.length - 1] : null;
  const previousHealthData = healthData.length > 1 ? healthData[healthData.length - 2] : null;
  
  // Calculate weight difference if we have at least 2 entries
  const weightDifference = latestHealthData && previousHealthData 
    ? (latestHealthData.weight - previousHealthData.weight).toFixed(1)
    : null;
  
  // Count reports for the current user
  const userReports = reports.filter(report => report.userId === user?.id);

  // Fetch health data for the logged-in user
  useEffect(() => {
    const fetchHealthData = async () => {
      if (user && user.id) {
        try {
          const response = await fetch(`http://localhost:8080/healthdata/user/${user.id}`);
          const data = await response.json();
          console.log('Fetched health data:', data);
          
          // Process and sort data by date (newest first)
          const processedData = data.map(item => ({
            ...item,
            // Ensure date is in a consistent format
            date: item.date || item.createdAt || new Date().toISOString()
          })).sort((a, b) => new Date(b.date) - new Date(a.date));
          
          setHealthData(processedData);
        } catch (error) {
          console.error('Error fetching health data:', error);
          toast.error('Failed to load health data');
        }
      }
    };
    fetchHealthData();
  }, [user]);

  const handleDownloadReport = () => {
    if (filteredHealthData.length === 0) return;
    
    setIsDownloading(true);
    
    // Initialize PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Add header
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.setFont('helvetica', 'bold');
    doc.text('Health Data Report', pageWidth / 2, 20, { align: 'center' });
    
    // Add date and user info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 35);
    if (user) {
      doc.text(`Patient: ${user.name || 'N/A'}`, 14, 42);
    }
    
    // Add line under header
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 50, pageWidth - 14, 50);
    
    // Prepare data for the table
    const tableColumn = ['Date', 'Age', 'Weight (kg)', 'Height (cm)', 'Activity Level', 'Health Goal'];
    const tableRows = [];
    
    filteredHealthData.forEach(item => {
      const data = [
        new Date(item.date).toLocaleDateString(),
        item.age || 'N/A',
        item.weight ? `${item.weight} kg` : 'N/A',
        item.height ? `${item.height} cm` : 'N/A',
        item.activityLevel || 'N/A',
        item.healthGoal || 'N/A'
      ];
      tableRows.push(data);
    });
    
    // Add table to PDF
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 60,
      margin: { left: 15, right: 15 },
      styles: { 
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak',
        lineWidth: 0.1,
        lineColor: 200,
        fillColor: [255, 255, 255],
        textColor: [40, 40, 40],
        font: 'helvetica',
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        lineWidth: 0.1,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      didDrawPage: function(data) {
        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
    });
    
    // Add summary section if there's data
    if (filteredHealthData.length > 0) {
      const latest = filteredHealthData[0];
      const startY = doc.lastAutoTable.finalY + 15;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Latest Health Summary', 14, startY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      const summary = [
        `Age: ${latest.age || 'N/A'}`,
        `Weight: ${latest.weight ? `${latest.weight} kg` : 'N/A'}`,
        `Height: ${latest.height ? `${latest.height} cm` : 'N/A'}`,
        `BMI: ${latest.weight && latest.height ? (latest.weight / ((latest.height / 100) ** 2)).toFixed(1) : 'N/A'}`,
        `Activity Level: ${latest.activityLevel || 'N/A'}`,
        `Health Goal: ${latest.healthGoal || 'N/A'}`
      ];
      
      summary.forEach((line, index) => {
        doc.text(line, 20, startY + 10 + (index * 6));
      });
    }
    
    // Save the PDF
    doc.save(`health-report-${new Date().toISOString().split('T')[0]}.pdf`);
    
    setIsDownloading(false);
    toast.success('PDF report downloaded successfully!');
  };

  const handleDeleteHealthData = async (id) => {
    if (window.confirm('Are you sure you want to delete this health data?')) {
      try {
        await fetch(`http://localhost:8080/healthdata/${id}`, {
          method: 'DELETE',
        });
        setHealthData(healthData.filter(item => item.id !== id));
        toast.success('Health data deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete health data');
      }
    }
  };

  const healthDataColumns = [
    {
      header: 'Date',
      render: (row) => {
        try {
          const dateValue = row.date || row.createdAt;
          if (!dateValue) return 'N/A';
          
          // Handle different date formats
          let date;
          if (typeof dateValue === 'string') {
            date = new Date(dateValue);
          } else if (dateValue.seconds) {
            // Handle Firebase timestamp format
            date = new Date(dateValue.seconds * 1000);
          } else if (dateValue._seconds) {
            // Handle another possible Firebase timestamp format
            date = new Date(dateValue._seconds * 1000);
          } else {
            date = new Date(dateValue);
          }
          
          return !isNaN(date.getTime()) ? date.toLocaleDateString() : 'N/A';
        } catch (error) {
          console.error('Error formatting date:', error, 'Row data:', row);
          return 'N/A';
        }
      },
    },
    {
      header: 'Age',
      accessor: 'age',
    },
    {
      header: 'Weight (kg)',
      accessor: 'weight',
    },
    {
      header: 'Height (cm)',
      accessor: 'height',
    },
    {
      header: 'BMI',
      render: (row) => (
        <Badge variant={row.bmi < 18.5 ? 'warning' : row.bmi < 25 ? 'success' : 'danger'}>
          {row.bmi ? row.bmi.toFixed(1) : 'N/A'}
        </Badge>
      ),
    },
    {
      header: 'Activity Level',
      render: (row) => (
        <span className="capitalize">{row.activityLevel || 'N/A'}</span>
      ),
    },
    {
      header: 'Health Goal',
      render: (row) => (
        <span className="capitalize">{row.healthGoal || 'N/A'}</span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/health-data/view/${row.id}`)}
            title="View Details"
            className="p-1"
          >
            <Eye size={16} />
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => navigate(`/health-data/edit/${row.id}`)}
            title="Edit"
            className="p-1"
          >
            <Edit size={16} />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteHealthData(row.id)}
            title="Delete"
            className="p-1"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  const userDashboard = () => (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
        <p className="text-gray-600 mt-2">Here's your health overview</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Activity className="text-primary-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Current Weight</p>
              <p className="text-2xl font-bold text-gray-900">
                {latestHealthData ? `${latestHealthData.weight} kg` : 'N/A'}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Progress</p>
              <p className={`text-2xl font-bold ${weightDifference ? (weightDifference > 0 ? 'text-green-600' : 'text-red-600') : 'text-gray-900'}`}>
                {weightDifference ? `${weightDifference > 0 ? '+' : ''}${weightDifference} kg` : 'N/A'}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Calendar className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Reports</p>
              <p className="text-2xl font-bold text-gray-900">{userReports.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card title="Quick Actions" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="primary"
            onClick={() => navigate('/health-data')}
            className="w-full"
          >
            Update Health Data
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/schedule-checkup')}
            className="w-full"
          >
            Schedule Checkup
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/reports')}
            className="w-full"
          >
            View Reports
          </Button>
        </div>
      </Card>

      {/* Health Data Table */}
      <Card title="My Health Data" className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
          <h2 className="text-lg font-medium text-gray-900">Health Data History</h2>
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search records..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={handleDownloadReport}
            disabled={isDownloading || filteredHealthData.length === 0}
            className={`ml-2 p-2 rounded-md flex items-center ${isDownloading || filteredHealthData.length === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
            title={filteredHealthData.length === 0 ? 'No data to download' : 'Download report as CSV'}
          >
            <Download className="h-5 w-5" />
            <span className="ml-1 text-sm hidden sm:inline">Download</span>
          </button>
        </div>
        <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
          {filteredHealthData.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {searchTerm ? 'No matching records found' : 'No health data available'}
            </div>
          ) : (
            <Table
              columns={healthDataColumns}
              data={filteredHealthData}
              onRowClick={(row) => navigate(`/health-data/view/${row.id}`)}
            />
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Notifications */}
        <Card title="Recent Notifications">
          <div className="space-y-3">
            {notifications.slice(0, 5).map((notif) => (
              <div key={notif.id} className="p-3 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-900">{notif.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notif.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming Appointments */}
        <Card title="Upcoming Appointments">
          <div className="space-y-3">
            {appointments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No appointments scheduled</p>
            ) : (
              appointments.slice(0, 3).map((apt) => (
                <div key={apt.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(apt.date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">{apt.time}</p>
                    </div>
                    <Badge variant={apt.status === 'confirmed' ? 'success' : 'warning'}>
                      {apt.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );

  const doctorDashboard = () => (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your patients and diet plans</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Users className="text-primary-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900">24</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Diet Plans</p>
              <p className="text-2xl font-bold text-gray-900">{dietPlans.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Calendar className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Appointments</p>
              <p className="text-2xl font-bold text-gray-900">8</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Quick Actions" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="primary"
            onClick={() => navigate('/diet-plans')}
            className="w-full"
          >
            Create Diet Plan
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/appointments')}
            className="w-full"
          >
            View Appointments
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/patients')}
            className="w-full"
          >
            Manage Patients
          </Button>
        </div>
      </Card>
    </div>
  );

  const adminDashboard = () => (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">System overview and management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Users className="text-primary-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">156</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Activity className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">142</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FileText className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Diet Plans</p>
              <p className="text-2xl font-bold text-gray-900">89</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Appointments</p>
              <p className="text-2xl font-bold text-gray-900">45</p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Quick Actions" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="primary"
            onClick={() => navigate('/admin/users')}
            className="w-full"
          >
            Manage Users
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/admin/logs')}
            className="w-full"
          >
            View System Logs
          </Button>
          <Button
            variant="outline"
            className="w-full"
          >
            System Settings
          </Button>
        </div>
      </Card>
    </div>
  );

  const receptionistDashboard = () => (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Receptionist Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage appointments and patient schedules</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Calendar className="text-primary-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {appointments.filter(a => a.status === 'pending').length}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Activity className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-gray-900">
                {appointments.filter(a => a.status === 'confirmed').length}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Patients</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'user').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Quick Actions" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="primary"
            onClick={() => navigate('/receptionist/appointments')}
            className="w-full"
          >
            Manage Appointments
          </Button>
          <Button
            variant="secondary"
            className="w-full"
          >
            View Schedule
          </Button>
        </div>
      </Card>
    </div>
  );

  const dietitianDashboard = () => (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dietitian Assistant Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage diet plans and support patients</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <FileText className="text-primary-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Diet Plans</p>
              <p className="text-2xl font-bold text-gray-900">{dietPlans.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Patients</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'user').length}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Activity className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Plans</p>
              <p className="text-2xl font-bold text-gray-900">
                {dietPlans.filter(p => !p.updatedAt || 
                  (new Date() - new Date(p.createdAt)) < 30 * 24 * 60 * 60 * 1000).length}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <TrendingUp className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">87%</p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Quick Actions" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="primary"
            onClick={() => navigate('/dietitian/diet-plans')}
            className="w-full"
          >
            Manage Diet Plans
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/dietitian/patients')}
            className="w-full"
          >
            View Patients
          </Button>
        </div>
      </Card>
    </div>
  );

  return (
    <div>
      {user?.role === 'user' && userDashboard()}
      {user?.role === 'doctor' && doctorDashboard()}
      {user?.role === 'dietitian' && dietitianDashboard()}
      {user?.role === 'receptionist' && receptionistDashboard()}
      {user?.role === 'admin' && adminDashboard()}
    </div>
  );
};

export default Dashboard;
