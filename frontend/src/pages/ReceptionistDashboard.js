import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Select from '../components/Select';
import Input from '../components/Input';
import { Calendar, Clock, CheckCircle, XCircle, Edit, Search } from 'lucide-react';
import { toast } from 'react-toastify';

const ReceptionistDashboard = () => {
  const { appointments, users, updateAppointmentStatus, updateAppointment, deleteAppointment } = useApp();
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editForm, setEditForm] = useState({
    date: '',
    time: '',
    status: '',
  });

  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setEditForm({
      date: new Date(appointment.date).toISOString().split('T')[0],
      time: appointment.time,
      status: appointment.status,
    });
    setShowEditModal(true);
  };

  const confirmEdit = async () => {
    try {
      await updateAppointment(selectedAppointment.id, {
        date: new Date(editForm.date),
        time: editForm.time,
        status: editForm.status,
      });
      toast.success('Appointment updated successfully');
      setShowEditModal(false);
    } catch (error) {
      toast.error('Failed to update appointment');
    }
  };

  const handleConfirm = (id) => {
    updateAppointmentStatus(id, 'confirmed');
    toast.success('Appointment confirmed!');
  };

  const handleCancel = (id) => {
    updateAppointmentStatus(id, 'cancelled');
    toast.warning('Appointment cancelled');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      await deleteAppointment(id);
      toast.success('Appointment deleted');
    }
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(apt => {
    const user = users.find(u => u.id === apt.userId);
    const matchesSearch = user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user?.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      header: 'Patient',
      render: (row) => {
        const user = users.find(u => u.id === row.userId);
        return (
          <div>
            <p className="font-medium text-gray-900">{user?.name || 'Unknown'}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        );
      },
    },
    {
      header: 'Date',
      render: (row) => new Date(row.date).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    },
    {
      header: 'Time',
      accessor: 'time',
    },
    {
      header: 'Type',
      accessor: 'type',
      render: (row) => (
        <span className="capitalize">{row.type?.replace('-', ' ')}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <Badge
          variant={
            row.status === 'confirmed'
              ? 'success'
              : row.status === 'pending'
              ? 'warning'
              : 'danger'
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
          {row.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="success"
                icon={CheckCircle}
                onClick={() => handleConfirm(row.id)}
              >
                Confirm
              </Button>
              <Button
                size="sm"
                variant="danger"
                icon={XCircle}
                onClick={() => handleCancel(row.id)}
              >
                Cancel
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            icon={Edit}
            onClick={() => handleEditAppointment(row)}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];

  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Appointment Management</h1>
        <p className="text-gray-600 mt-2">Manage patient appointments and schedules</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Calendar className="text-primary-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by patient name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            className="w-48"
          />
        </div>
      </Card>

      {/* Appointments Table */}
      <Card title={`Appointments (${filteredAppointments.length})`}>
        <Table columns={columns} data={filteredAppointments} />
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Appointment"
        size="md"
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-900">
                {users.find(u => u.id === selectedAppointment.userId)?.name}
              </p>
              <p className="text-sm text-gray-600">
                {users.find(u => u.id === selectedAppointment.userId)?.email}
              </p>
            </div>

            <Input
              label="Date"
              type="date"
              value={editForm.date}
              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
            />

            <Input
              label="Time"
              type="time"
              value={editForm.time}
              onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
            />

            <Select
              label="Status"
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />

            <div className="flex gap-4 mt-6">
              <Button variant="primary" onClick={confirmEdit} className="flex-1">
                Save Changes
              </Button>
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReceptionistDashboard;
