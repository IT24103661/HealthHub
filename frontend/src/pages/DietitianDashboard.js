import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import Textarea from '../components/Textarea';
import Table from '../components/Table';
import Badge from '../components/Badge';
import { Plus, Edit, Eye, Trash2, Users, FileText, TrendingUp, Activity, Search } from 'lucide-react';
import { toast } from 'react-toastify';

const DietitianDashboard = () => {
  const { 
    users, 
    dietPlans, 
    addDietPlan, 
    updateDietPlan, 
    deleteDietPlan,
    getHealthDataByUserId 
  } = useApp();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    userId: '',
    planName: '',
    duration: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    breakfast: '',
    lunch: '',
    dinner: '',
    snacks: '',
    notes: '',
    supplements: '',
  });

  const patients = users.filter(u => u.role === 'user');

  const resetForm = () => {
    setFormData({
      userId: '',
      planName: '',
      duration: '',
      calories: '',
      protein: '',
      carbs: '',
      fats: '',
      breakfast: '',
      lunch: '',
      dinner: '',
      snacks: '',
      notes: '',
      supplements: '',
    });
    setSelectedUser(null);
    setSelectedPlan(null);
  };

  const handleUserSelect = (userId) => {
    const user = patients.find(u => u.id === parseInt(userId));
    setSelectedUser(user);
    setFormData({ ...formData, userId });
  };

  const generateDietPlan = () => {
    if (!selectedUser) return;

    // Calculate BMR and calorie needs
    const bmr = selectedUser.weight * 22;
    const calories = Math.round(bmr * 1.2);
    const protein = Math.round(selectedUser.weight * 1.8);
    const carbs = Math.round((calories * 0.45) / 4);
    const fats = Math.round((calories * 0.25) / 9);

    const samplePlan = {
      breakfast: '• Oatmeal with berries and almonds (400 cal)\n• Protein shake\n• Green tea',
      lunch: '• Grilled chicken breast (200g)\n• Quinoa salad with vegetables\n• Olive oil dressing (500 cal)',
      dinner: '• Baked salmon with herbs (450 cal)\n• Steamed broccoli and carrots\n• Brown rice',
      snacks: '• Greek yogurt (150 cal)\n• Mixed nuts (100 cal)\n• Apple or banana',
      supplements: '• Multivitamin (morning)\n• Omega-3 (with dinner)\n• Vitamin D (morning)',
    };

    setFormData({
      ...formData,
      calories: calories.toString(),
      protein: protein.toString(),
      carbs: carbs.toString(),
      fats: fats.toString(),
      planName: `Personalized Plan for ${selectedUser.name}`,
      duration: '30',
      ...samplePlan,
    });

    toast.info('AI-suggested diet plan generated! Customize as needed.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDietPlan(formData);
      toast.success('Diet plan created and sent to patient!');
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to create diet plan');
    }
  };

  const handleEdit = (plan) => {
    setSelectedPlan(plan);
    const user = patients.find(u => u.id === plan.userId);
    setSelectedUser(user);
    setFormData({
      userId: plan.userId,
      planName: plan.planName,
      duration: plan.duration,
      calories: plan.calories,
      protein: plan.protein || '',
      carbs: plan.carbs || '',
      fats: plan.fats || '',
      breakfast: plan.breakfast,
      lunch: plan.lunch,
      dinner: plan.dinner,
      snacks: plan.snacks,
      notes: plan.notes || '',
      supplements: plan.supplements || '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateDietPlan(selectedPlan.id, formData);
      toast.success('Diet plan updated successfully!');
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to update diet plan');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this diet plan?')) {
      try {
        await deleteDietPlan(id);
        toast.success('Diet plan deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete diet plan');
      }
    }
  };

  const handleView = (plan) => {
    setSelectedPlan(plan);
    setShowViewModal(true);
  };

  // Filter diet plans
  const filteredPlans = dietPlans.filter(plan => {
    const user = users.find(u => u.id === plan.userId);
    const matchesSearch = user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.planName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
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
      header: 'Plan Name',
      accessor: 'planName',
    },
    {
      header: 'Duration',
      render: (row) => `${row.duration} days`,
    },
    {
      header: 'Calories',
      render: (row) => `${row.calories} kcal`,
    },
    {
      header: 'Created',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      header: 'Status',
      render: (row) => (
        <Badge variant={row.updatedAt ? 'primary' : 'success'}>
          {row.updatedAt ? 'Updated' : 'Active'}
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
            icon={Eye}
            onClick={() => handleView(row)}
          >
            View
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={Edit}
            onClick={() => handleEdit(row)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            icon={Trash2}
            onClick={() => handleDelete(row.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const stats = {
    totalPlans: dietPlans.length,
    totalPatients: patients.length,
    activePlans: dietPlans.filter(p => !p.updatedAt || 
      (new Date() - new Date(p.createdAt)) < 30 * 24 * 60 * 60 * 1000).length,
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dietitian Assistant Dashboard</h1>
          <p className="text-gray-600 mt-2">Create and manage personalized diet plans for patients</p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setShowCreateModal(true)}
        >
          Create New Plan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <FileText className="text-primary-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Plans</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPlans}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.activePlans}</p>
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

      {/* Search */}
      <Card className="mb-6">
        <Input
          placeholder="Search by patient name or plan name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={Search}
        />
      </Card>

      {/* Diet Plans Table */}
      <Card title={`Diet Plans (${filteredPlans.length})`}>
        <Table columns={columns} data={filteredPlans} />
      </Card>

      {/* Create Diet Plan Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create New Diet Plan"
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Select
              label="Select Patient"
              name="userId"
              value={formData.userId}
              onChange={(e) => handleUserSelect(e.target.value)}
              options={patients.map(p => ({ 
                value: p.id, 
                label: `${p.name} (${p.age}y, ${p.weight}kg, BMI: ${(p.weight / Math.pow(p.height / 100, 2)).toFixed(1)})` 
              }))}
              required
            />

            {selectedUser && (
              <Card className="bg-blue-50">
                <h4 className="font-semibold text-gray-900 mb-2">Patient Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div><span className="text-gray-600">Age:</span> {selectedUser.age} years</div>
                  <div><span className="text-gray-600">Weight:</span> {selectedUser.weight} kg</div>
                  <div><span className="text-gray-600">Height:</span> {selectedUser.height} cm</div>
                  <div><span className="text-gray-600">BMI:</span> {(selectedUser.weight / Math.pow(selectedUser.height / 100, 2)).toFixed(1)}</div>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={generateDietPlan}
                  className="w-full"
                >
                  Generate AI-Suggested Plan
                </Button>
              </Card>
            )}

            <Input
              label="Plan Name"
              name="planName"
              value={formData.planName}
              onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
              placeholder="e.g., Weight Loss Plan"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Duration (days)"
                type="number"
                name="duration"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="30"
                required
              />
              <Input
                label="Daily Calories (kcal)"
                type="number"
                name="calories"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                placeholder="2000"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Protein (g)"
                type="number"
                name="protein"
                value={formData.protein}
                onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                placeholder="150"
              />
              <Input
                label="Carbs (g)"
                type="number"
                name="carbs"
                value={formData.carbs}
                onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                placeholder="200"
              />
              <Input
                label="Fats (g)"
                type="number"
                name="fats"
                value={formData.fats}
                onChange={(e) => setFormData({ ...formData, fats: e.target.value })}
                placeholder="60"
              />
            </div>

            <Textarea
              label="Breakfast"
              name="breakfast"
              value={formData.breakfast}
              onChange={(e) => setFormData({ ...formData, breakfast: e.target.value })}
              placeholder="Describe breakfast meals..."
              rows={3}
              required
            />

            <Textarea
              label="Lunch"
              name="lunch"
              value={formData.lunch}
              onChange={(e) => setFormData({ ...formData, lunch: e.target.value })}
              placeholder="Describe lunch meals..."
              rows={3}
              required
            />

            <Textarea
              label="Dinner"
              name="dinner"
              value={formData.dinner}
              onChange={(e) => setFormData({ ...formData, dinner: e.target.value })}
              placeholder="Describe dinner meals..."
              rows={3}
              required
            />

            <Textarea
              label="Snacks"
              name="snacks"
              value={formData.snacks}
              onChange={(e) => setFormData({ ...formData, snacks: e.target.value })}
              placeholder="Healthy snack options..."
              rows={2}
            />

            <Textarea
              label="Supplements (Optional)"
              name="supplements"
              value={formData.supplements}
              onChange={(e) => setFormData({ ...formData, supplements: e.target.value })}
              placeholder="Recommended supplements..."
              rows={2}
            />

            <Textarea
              label="Additional Notes"
              name="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any special instructions or notes..."
              rows={2}
            />
          </div>

          <div className="flex gap-4 mt-6">
            <Button type="submit" variant="primary" className="flex-1">
              Create & Send to Patient
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Diet Plan Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        title="Edit Diet Plan"
        size="lg"
      >
        {selectedPlan && (
          <form onSubmit={handleUpdate}>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-900">
                  {users.find(u => u.id === selectedPlan.userId)?.name}
                </p>
                <p className="text-sm text-gray-600">
                  {users.find(u => u.id === selectedPlan.userId)?.email}
                </p>
              </div>

              <Input
                label="Plan Name"
                value={formData.planName}
                onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Duration (days)"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  required
                />
                <Input
                  label="Daily Calories"
                  type="number"
                  value={formData.calories}
                  onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Protein (g)"
                  type="number"
                  value={formData.protein}
                  onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                />
                <Input
                  label="Carbs (g)"
                  type="number"
                  value={formData.carbs}
                  onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                />
                <Input
                  label="Fats (g)"
                  type="number"
                  value={formData.fats}
                  onChange={(e) => setFormData({ ...formData, fats: e.target.value })}
                />
              </div>

              <Textarea
                label="Breakfast"
                value={formData.breakfast}
                onChange={(e) => setFormData({ ...formData, breakfast: e.target.value })}
                rows={3}
                required
              />

              <Textarea
                label="Lunch"
                value={formData.lunch}
                onChange={(e) => setFormData({ ...formData, lunch: e.target.value })}
                rows={3}
                required
              />

              <Textarea
                label="Dinner"
                value={formData.dinner}
                onChange={(e) => setFormData({ ...formData, dinner: e.target.value })}
                rows={3}
                required
              />

              <Textarea
                label="Snacks"
                value={formData.snacks}
                onChange={(e) => setFormData({ ...formData, snacks: e.target.value })}
                rows={2}
              />

              <Textarea
                label="Supplements"
                value={formData.supplements}
                onChange={(e) => setFormData({ ...formData, supplements: e.target.value })}
                rows={2}
              />

              <Textarea
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex gap-4 mt-6">
              <Button type="submit" variant="primary" className="flex-1">
                Update Plan
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* View Diet Plan Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Diet Plan Details"
        size="lg"
      >
        {selectedPlan && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b">
              <div>
                <p className="text-sm text-gray-600">Patient</p>
                <p className="font-semibold">{users.find(u => u.id === selectedPlan.userId)?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-semibold">{selectedPlan.duration} days</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Daily Calories</p>
                <p className="font-semibold">{selectedPlan.calories} kcal</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="font-semibold">{new Date(selectedPlan.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {(selectedPlan.protein || selectedPlan.carbs || selectedPlan.fats) && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">Macronutrients</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  {selectedPlan.protein && <div><span className="text-gray-600">Protein:</span> {selectedPlan.protein}g</div>}
                  {selectedPlan.carbs && <div><span className="text-gray-600">Carbs:</span> {selectedPlan.carbs}g</div>}
                  {selectedPlan.fats && <div><span className="text-gray-600">Fats:</span> {selectedPlan.fats}g</div>}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Breakfast</h4>
              <p className="text-gray-700 whitespace-pre-line">{selectedPlan.breakfast}</p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Lunch</h4>
              <p className="text-gray-700 whitespace-pre-line">{selectedPlan.lunch}</p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Dinner</h4>
              <p className="text-gray-700 whitespace-pre-line">{selectedPlan.dinner}</p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Snacks</h4>
              <p className="text-gray-700 whitespace-pre-line">{selectedPlan.snacks}</p>
            </div>

            {selectedPlan.supplements && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Supplements</h4>
                <p className="text-gray-700 whitespace-pre-line">{selectedPlan.supplements}</p>
              </div>
            )}

            {selectedPlan.notes && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Additional Notes</h4>
                <p className="text-gray-700 whitespace-pre-line">{selectedPlan.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DietitianDashboard;
