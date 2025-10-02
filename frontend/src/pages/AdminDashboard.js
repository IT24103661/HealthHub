import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Select from '../components/Select';
import { Users, Shield, Trash2, Edit, Ban, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const { users, updateUserStatus, updateUserRole, deleteUser } = useApp();
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState({ role: '', status: '' });

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
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-2">
          Manage user accounts, roles, and permissions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-primary-100 rounded-lg mb-2">
              <Users className="text-primary-600" size={24} />
            </div>
            <p className="text-xs text-gray-600">Total Users</p>
            <p className="text-xl font-bold text-gray-900">{stats.totalUsers}</p>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-green-100 rounded-lg mb-2">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <p className="text-xs text-gray-600">Active</p>
            <p className="text-xl font-bold text-gray-900">{stats.activeUsers}</p>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-blue-100 rounded-lg mb-2">
              <Shield className="text-blue-600" size={24} />
            </div>
            <p className="text-xs text-gray-600">Doctors</p>
            <p className="text-xl font-bold text-gray-900">{stats.doctors}</p>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-purple-100 rounded-lg mb-2">
              <Shield className="text-purple-600" size={24} />
            </div>
            <p className="text-xs text-gray-600">Dietitians</p>
            <p className="text-xl font-bold text-gray-900">{stats.dietitians}</p>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-yellow-100 rounded-lg mb-2">
              <Shield className="text-yellow-600" size={24} />
            </div>
            <p className="text-xs text-gray-600">Receptionists</p>
            <p className="text-xl font-bold text-gray-900">{stats.receptionists}</p>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-red-100 rounded-lg mb-2">
              <Shield className="text-red-600" size={24} />
            </div>
            <p className="text-xs text-gray-600">Admins</p>
            <p className="text-xl font-bold text-gray-900">{stats.admins}</p>
          </div>
        </Card>
      </div>

      {/* Users Table */}
      <Card title="All Users">
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
