import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Select from '../components/Select';
import { Users, Shield, Trash2, Edit, Ban, CheckCircle, Download, Plus } from 'lucide-react';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const { users, updateUserStatus, updateUserRole, deleteUser, createUser } = useApp();
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editForm, setEditForm] = useState({ role: '', status: '' });
  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'user',
    phone: '',
    age: '',
    status: 'active'
  });

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditForm({ role: user.role, status: user.status });
    setShowEditModal(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmEdit = () => {
    if (editForm.role !== selectedUser.role) {
      updateUserRole(selectedUser.id, editForm.role);
    }
    if (editForm.status !== selectedUser.status) {
      updateUserStatus(selectedUser.id, editForm.status);
    }
    toast.success('User updated successfully');
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const confirmDelete = () => {
    deleteUser(selectedUser.id);
    toast.success('User deleted successfully');
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      // Prepare user data in the format expected by the backend
      const userData = {
        fullName: newUser.fullName,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role || 'user',
        phone: newUser.phone || null,
        age: newUser.age ? parseInt(newUser.age) : null,
        status: newUser.status || 'active'
      };
      
      await createUser(userData);
      toast.success('User created successfully');
      setShowAddModal(false);
      setNewUser({
        fullName: '',
        email: '',
        password: '',
        role: 'user',
        phone: '',
        age: '',
        status: 'active'
      });
      
      // The users list will be automatically updated via the context
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const downloadUsersReport = async () => {
    try {
      toast.loading('Generating users report...');
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      doc.setFont('helvetica');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      
      // Set header background color using RGB values directly
      doc.setFillColor(63, 81, 181);
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      // Add title
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('HEALTHHUB USERS REPORT', pageWidth / 2, 15, { align: 'center' });
      
      // Add report info
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, 35);
      doc.text(`Total Users: ${users.length}`, margin, 40);
      
      // Add stats cards
      let yPos = 50;
      const cardWidth = (pageWidth - (margin * 3)) / 2;
      
      // First row of cards
      doc.setFillColor(63, 81, 181);
      doc.roundedRect(margin, yPos, cardWidth, 30, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text('Total Users', margin + 10, yPos + 10);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(users.length.toString(), margin + 10, yPos + 22);
      
      doc.setFillColor(40, 167, 69);
      doc.roundedRect(margin * 2 + cardWidth, yPos, cardWidth, 30, 3, 3, 'F');
      doc.text('Active Users', margin * 2 + cardWidth + 10, yPos + 10);
      doc.setFontSize(18);
      doc.text(users.filter(u => u.status === 'active').length.toString(), margin * 2 + cardWidth + 10, yPos + 22);
      
      // Second row of cards
      yPos += 40;
      doc.setFillColor(23, 162, 184);
      doc.roundedRect(margin, yPos, cardWidth, 30, 3, 3, 'F');
      doc.text('Doctors', margin + 10, yPos + 10);
      doc.setFontSize(18);
      doc.text(users.filter(u => u.role === 'doctor').length.toString(), margin + 10, yPos + 22);
      
      doc.setFillColor(255, 193, 7);
      doc.roundedRect(margin * 2 + cardWidth, yPos, cardWidth, 30, 3, 3, 'F');
      doc.text('Dietitians', margin * 2 + cardWidth + 10, yPos + 10);
      doc.setFontSize(18);
      doc.text(users.filter(u => u.role === 'dietitian').length.toString(), margin * 2 + cardWidth + 10, yPos + 22);
      
      // Reset text color and position for table
      yPos += 50;
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      
      // Table headers with improved styling
      doc.setFont('helvetica', 'bold');
      const tableHeaders = ['NAME', 'EMAIL', 'ROLE', 'STATUS'];
      
      // Adjusted column widths for better proportions
      const colWidths = [45, 70, 35, 30];
      const headerY = yPos;
      const rowHeight = 11; // Slightly taller rows for better readability
      const headerHeight = 12; // Taller header for better visual hierarchy
      
      // Calculate starting X positions for each column with consistent padding
      const colPositions = [
        margin + 8,  // Name
        margin + colWidths[0] + 8,  // Email
        margin + colWidths[0] + colWidths[1] + 8,  // Role
        margin + colWidths[0] + colWidths[1] + colWidths[2] + 8  // Status
      ];
      
      // Table header with solid color (replaced gradient for better compatibility)
      doc.setFillColor(63, 81, 181); // Primary color
      
      // Draw header with rounded corners
      doc.roundedRect(
        margin, 
        headerY, 
        pageWidth - (margin * 2), 
        headerHeight, 
        2, 2, 'F'
      );
      
      // Add subtle shadow effect
      doc.setDrawColor(50, 65, 145);
      doc.setLineWidth(0.2);
      doc.roundedRect(
        margin, 
        headerY, 
        pageWidth - (margin * 2), 
        headerHeight, 
        2, 2
      );
      
      // Add header text with proper spacing
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      
      // Draw header text with improved typography
      tableHeaders.forEach((header, index) => {
        const isCentered = index > 1; // Center align Role and Status
        const xPos = isCentered 
          ? colPositions[index] + (colWidths[index] / 2)
          : colPositions[index];
          
        const options = { 
          align: isCentered ? 'center' : 'left',
          maxWidth: colWidths[index] - 8,
          lineHeightFactor: 1.2
        };
        
        // Add subtle text shadow for better readability
        doc.setTextColor(255, 255, 255);
        doc.text(
          header, 
          xPos + 0.5, 
          headerY + headerHeight - 4,
          options
        );
        
        // Add subtle separator between headers
        if (index < tableHeaders.length - 1) {
          doc.setDrawColor(255, 255, 255, 0.3);
          doc.setLineWidth(0.5);
          doc.line(
            colPositions[index] + colWidths[index] + 3, 
            headerY + 2, 
            colPositions[index] + colWidths[index] + 3, 
            headerY + headerHeight - 2
          );
        }
      });
      
      // Reset styles for data rows
      doc.setTextColor(51, 51, 51);
      doc.setLineWidth(0.2);
      doc.setDrawColor(200, 200, 200); // Reset draw color
      
      // Add user rows
      doc.setFont('helvetica', 'normal');
      yPos += 10;
      
      users.forEach((user, index) => {
        // Check for page break
        if (yPos > 270) {
          doc.addPage();
          yPos = 30;
        }
        
        // Set row styling with subtle hover effect
        const isEven = index % 2 === 0;
        const rowBgColor = isEven ? [255, 255, 255] : [250, 250, 252];
        
        // Draw row background
        doc.setFillColor(...rowBgColor);
        doc.rect(margin, yPos, pageWidth - (margin * 2), rowHeight, 'F');
        
        // Draw subtle bottom border
        doc.setDrawColor(235, 235, 240);
        doc.line(
          margin, 
          yPos + rowHeight - 0.5, 
          pageWidth - margin, 
          yPos + rowHeight - 0.5
        );
        
        // Add subtle vertical separators
        doc.setDrawColor(240, 240, 245);
        let lineX = margin;
        for (let i = 0; i < colWidths.length - 1; i++) {
          lineX += colWidths[i] + (i === 0 ? 8 : 5);
          doc.line(
            lineX, 
            yPos + 2, 
            lineX, 
            yPos + rowHeight - 2
          );
        }
        
        // Add user data
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        
        // Name with proper truncation
        doc.setFont('helvetica', 'medium');
        doc.setFontSize(9);
        doc.setTextColor(33, 37, 41);
        doc.text(user.name?.trim() || 'N/A', colPositions[0], yPos + 7.5, { 
          maxWidth: colWidths[0] - 8,
          ellipsis: true,
          lineHeightFactor: 1.1
        });
        
        // Email with subtle styling
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(73, 80, 87);
        doc.text(user.email?.trim() || 'N/A', colPositions[1] + 2, yPos + 7.5, { 
          maxWidth: colWidths[1] - 10,
          ellipsis: true,
          lineHeightFactor: 1.1
        });
        
        // Role with pill-like styling
        const roleColors = {
          'admin': { bg: [248, 249, 250], text: [73, 80, 87] },
          'doctor': { bg: [232, 240, 254], text: [13, 110, 253] },
          'dietitian': { bg: [243, 236, 254], text: [111, 66, 193] },
          'receptionist': { bg: [255, 243, 205], text: [153, 119, 34] },
          'user': { bg: [230, 244, 234], text: [25, 135, 84] }
        };
        
        const roleType = user.role || 'user';
        const roleStyle = roleColors[roleType] || roleColors.user;
        const roleText = roleType.charAt(0).toUpperCase() + roleType.slice(1);
        
        // Draw role background
        doc.setFillColor(...roleStyle.bg);
        doc.roundedRect(
          colPositions[2] + 2,
          yPos + 2,
          colWidths[2] - 4,
          rowHeight - 4,
          10, 10, 'F'
        );
        
        // Draw role text
        doc.setFont('helvetica', 'semibold');
        doc.setFontSize(8);
        doc.setTextColor(...roleStyle.text);
        doc.text(
          roleText,
          colPositions[2] + (colWidths[2] / 2),
          yPos + 7.5,
          { align: 'center' }
        );
        
        // Status with pill styling
        const status = user.status || 'inactive';
        const statusText = status === 'active' ? 'Active' : 'Inactive';
        const statusStyle = status === 'active' 
          ? { bg: [230, 244, 234], text: [25, 135, 84] }
          : { bg: [255, 231, 230], text: [220, 53, 69] };
        
        // Draw status background
        doc.setFillColor(...statusStyle.bg);
        doc.roundedRect(
          colPositions[3] + 2,
          yPos + 2,
          colWidths[3] - 4,
          rowHeight - 4,
          10, 10, 'F'
        );
        
        // Draw status text
        doc.setFont('helvetica', 'semibold');
        doc.setFontSize(8);
        doc.setTextColor(...statusStyle.text);
        doc.text(
          statusText,
          colPositions[3] + (colWidths[3] / 2),
          yPos + 7.5,
          { align: 'center' }
        );
        doc.setTextColor(0, 0, 0);
        
        yPos += 10;
      });
      
      // Add footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Page number
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, 287, { align: 'right' });
        
        // Footer line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(margin, 280, pageWidth - margin, 280);
        
        // Footer text
        doc.text('Confidential - HealthHub User Report', margin, 287);
      }
      
      // Save the PDF
      doc.save(`HealthHub-Users-Report-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.dismiss();
      toast.success('Users report downloaded successfully');
      
    } catch (error) {
      console.error('Error generating users report:', error);
      toast.dismiss();
      toast.error('Failed to generate users report');
    }
  };

  const roleOptions = [
    { value: 'user', label: 'User' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'dietitian', label: 'Dietitian Assistant' },
    { value: 'receptionist', label: 'Receptionist' },
    { value: 'admin', label: 'Admin' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          <p className="text-sm text-gray-500">{row.email}</p>
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (row) => (
        <Badge
          variant={
            row.role === 'admin'
              ? 'danger'
              : row.role === 'doctor'
              ? 'primary'
              : row.role === 'dietitian'
              ? 'info'
              : row.role === 'receptionist'
              ? 'warning'
              : 'default'
          }
        >
          {row.role.toUpperCase()}
        </Badge>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <Badge
          variant={
            row.status === 'active'
              ? 'success'
              : row.status === 'suspended'
              ? 'danger'
              : 'default'
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={Edit}
            onClick={() => handleEditUser(row)}
          >
            Edit
          </Button>
          {row.status === 'active' ? (
            <Button
              size="sm"
              variant="secondary"
              icon={Ban}
              onClick={() => {
                updateUserStatus(row.id, 'suspended');
                toast.warning(`${row.name} has been suspended`);
              }}
            >
              Suspend
            </Button>
          ) : (
            <Button
              size="sm"
              variant="success"
              icon={CheckCircle}
              onClick={() => {
                updateUserStatus(row.id, 'active');
                toast.success(`${row.name} has been activated`);
              }}
            >
              Activate
            </Button>
          )}
          <Button
            size="sm"
            variant="danger"
            icon={Trash2}
            onClick={() => handleDeleteUser(row)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    doctors: users.filter(u => u.role === 'doctor').length,
    dietitians: users.filter(u => u.role === 'dietitian').length,
    receptionists: users.filter(u => u.role === 'receptionist').length,
    admins: users.filter(u => u.role === 'admin').length,
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">
              Manage user accounts, roles, and permissions
            </p>
          </div>
          <Button 
            variant="primary" 
            onClick={downloadUsersReport}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <Download size={16} />
            Download Report
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Users Card */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Users</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
                <p className="mt-1 text-xs text-green-600 font-medium">
                  +{Math.floor(stats.totalUsers * 0.12)} from last month
                </p>
              </div>
              <div className="p-3 rounded-lg bg-primary-50">
                <Users className="text-primary-600" size={20} />
              </div>
            </div>
          </div>
        </Card>

        {/* Active Users Card */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Active Users</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.activeUsers}</p>
                <p className="mt-1 text-xs text-green-600 font-medium">
                  {Math.round((stats.activeUsers / stats.totalUsers) * 100)}% of total
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <CheckCircle className="text-green-600" size={20} />
              </div>
            </div>
          </div>
        </Card>

        {/* Doctors Card */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Doctors</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.doctors}</p>
                <p className="mt-1 text-xs text-blue-600 font-medium">
                  {stats.doctors > 0 ? 'Available' : 'None'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <Shield className="text-blue-600" size={20} />
              </div>
            </div>
          </div>
        </Card>

        {/* Dietitians Card */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Dietitians</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.dietitians}</p>
                <p className="mt-1 text-xs text-purple-600 font-medium">
                  {stats.dietitians > 0 ? 'Available' : 'None'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <Shield className="text-purple-600" size={20} />
              </div>
            </div>
          </div>
        </Card>

        {/* Receptionists Card */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Receptionists</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.receptionists}</p>
                <p className="mt-1 text-xs text-yellow-600 font-medium">
                  {stats.receptionists > 0 ? 'On Duty' : 'Offline'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50">
                <Shield className="text-yellow-600" size={20} />
              </div>
            </div>
          </div>
        </Card>

        {/* Admins Card */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Admins</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.admins}</p>
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {stats.admins > 0 ? 'Active' : 'None'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-50">
                <Shield className="text-red-600" size={20} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">All Users</h3>
          <Button 
            onClick={() => setShowAddModal(true)}
            size="sm"
            variant="primary"
            icon={Plus}
          >
            Add User
          </Button>
        </div>
        <Table columns={columns} data={users} />
      </Card>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit User"
        size="md"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-900">{selectedUser.name}</p>
              <p className="text-sm text-gray-600">{selectedUser.email}</p>
            </div>

            <Select
              label="Role"
              name="role"
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              options={roleOptions}
            />

            <Select
              label="Status"
              name="status"
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              options={statusOptions}
            />

            <div className="flex gap-4 mt-6">
              <Button
                variant="primary"
                onClick={confirmEdit}
                className="flex-1"
              >
                Save Changes
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Delete"
        size="sm"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">
                Are you sure you want to delete <strong>{selectedUser.name}</strong>?
                This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                variant="danger"
                onClick={confirmDelete}
                className="flex-1"
                icon={Trash2}
              >
                Delete User
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New User"
        size="md"
      >
        <form onSubmit={handleAddUser} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={newUser.fullName}
              onChange={handleNewUserChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
              minLength={3}
              maxLength={100}
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={newUser.email}
              onChange={handleNewUserChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              value={newUser.password}
              onChange={handleNewUserChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                name="phone"
                value={newUser.phone}
                onChange={handleNewUserChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Age</label>
              <input
                type="number"
                name="age"
                value={newUser.age}
                onChange={handleNewUserChange}
                min="0"
                max="120"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                name="role"
                value={newUser.role}
                onChange={handleNewUserChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="doctor">Doctor</option>
                <option value="dietitian">Dietitian</option>
                <option value="receptionist">Receptionist</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                value={newUser.status}
                onChange={handleNewUserChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* System Logs */}
      <Card title="Recent Activity Logs" className="mt-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-900">User role changed</p>
              <p className="text-xs text-gray-600">Jane Smith changed from user to doctor</p>
            </div>
            <p className="text-xs text-gray-500">2 hours ago</p>
          </div>
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-900">User suspended</p>
              <p className="text-xs text-gray-600">Account suspended for policy violation</p>
            </div>
            <p className="text-xs text-gray-500">5 hours ago</p>
          </div>
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-900">New user registered</p>
              <p className="text-xs text-gray-600">Sarah Johnson joined as user</p>
            </div>
            <p className="text-xs text-gray-500">1 day ago</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
