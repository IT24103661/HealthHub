import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Input from '../components/Input';
import Select from '../components/Select';
import { FileText, Search, Filter } from 'lucide-react';

const AuditLogs = () => {
  const { auditLogs } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterEntity, setFilterEntity] = useState('all');

  // Filter logs
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.userName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesEntity = filterEntity === 'all' || log.entity === filterEntity;
    return matchesSearch && matchesAction && matchesEntity;
  });

  const columns = [
    {
      header: 'Timestamp',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-gray-900">
            {new Date(row.timestamp).toLocaleDateString()}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(row.timestamp).toLocaleTimeString()}
          </p>
        </div>
      ),
    },
    {
      header: 'User',
      accessor: 'userName',
      render: (row) => row.userName || 'System',
    },
    {
      header: 'Action',
      accessor: 'action',
      render: (row) => (
        <Badge
          variant={
            row.action === 'create'
              ? 'success'
              : row.action === 'update'
              ? 'primary'
              : row.action === 'delete'
              ? 'danger'
              : 'default'
          }
        >
          {row.action.toUpperCase()}
        </Badge>
      ),
    },
    {
      header: 'Entity',
      accessor: 'entity',
      render: (row) => (
        <span className="capitalize">{row.entity.replace('_', ' ')}</span>
      ),
    },
    {
      header: 'Description',
      accessor: 'description',
      render: (row) => (
        <p className="text-sm text-gray-700">{row.description}</p>
      ),
    },
  ];

  const stats = {
    total: auditLogs.length,
    creates: auditLogs.filter(l => l.action === 'create').length,
    updates: auditLogs.filter(l => l.action === 'update').length,
    deletes: auditLogs.filter(l => l.action === 'delete').length,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">System Audit Logs</h1>
        <p className="text-gray-600 mt-2">
          Track all system activities and administrative actions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <FileText className="text-primary-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Creates</p>
              <p className="text-2xl font-bold text-gray-900">{stats.creates}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Updates</p>
              <p className="text-2xl font-bold text-gray-900">{stats.updates}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <FileText className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Deletes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.deletes}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
          />
          <Select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            options={[
              { value: 'all', label: 'All Actions' },
              { value: 'create', label: 'Create' },
              { value: 'update', label: 'Update' },
              { value: 'delete', label: 'Delete' },
            ]}
          />
          <Select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            options={[
              { value: 'all', label: 'All Entities' },
              { value: 'user', label: 'Users' },
              { value: 'health_data', label: 'Health Data' },
              { value: 'diet_plan', label: 'Diet Plans' },
              { value: 'appointment', label: 'Appointments' },
              { value: 'report', label: 'Reports' },
            ]}
          />
        </div>
      </Card>

      {/* Logs Table */}
      <Card title={`Audit Logs (${filteredLogs.length})`}>
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">No audit logs found</p>
          </div>
        ) : (
          <Table columns={columns} data={filteredLogs} />
        )}
      </Card>
    </div>
  );
};

export default AuditLogs;
