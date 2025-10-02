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
import { Plus, Edit, Eye, Send } from 'lucide-react';
import { toast } from 'react-toastify';

const DietPlans = () => {
  const { users, dietPlans, addDietPlan, updateDietPlan, addNotification } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState({
    userId: '',
    planName: '',
    duration: '',
    calories: '',
    breakfast: '',
    lunch: '',
    dinner: '',
    snacks: '',
    notes: '',
  });

  const patients = users.filter(u => u.role === 'user');

  const handleUserSelect = (userId) => {
    const user = patients.find(u => u.id === parseInt(userId));
    setSelectedUser(user);
    setFormData({ ...formData, userId });
  };

  const generateDietPlan = () => {
    if (!selectedUser) return;

    // Simple algorithm based on user data
    const bmr = selectedUser.weight * 22; // Simplified BMR calculation
    const calories = Math.round(bmr * 1.2); // Adjust based on activity

    const samplePlan = {
      breakfast: 'Oatmeal with fruits and nuts (400 cal)\nGreen tea',
      lunch: 'Grilled chicken salad with olive oil (500 cal)\nWhole grain bread',
      dinner: 'Baked fish with vegetables (450 cal)\nBrown rice',
      snacks: 'Greek yogurt, almonds, apple (250 cal)',
    };

    setFormData({
      ...formData,
      calories: calories.toString(),
      planName: `Personalized Plan for ${selectedUser.name}`,
      duration: '30',
      ...samplePlan,
    });

    toast.info('Diet plan generated! You can now edit and save it.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDietPlan(formData);
      toast.success('Diet plan created and sent to patient!');
      setShowCreateModal(false);
      setFormData({
        userId: '',
        planName: '',
        duration: '',
        calories: '',
        breakfast: '',
        lunch: '',
        dinner: '',
        snacks: '',
        notes: '',
      });
      setSelectedUser(null);
    } catch (error) {
      toast.error('Failed to create diet plan');
    }
  };

  const columns = [
    {
      header: 'Patient',
      accessor: 'userId',
      render: (row) => {
        const user = users.find(u => u.id === row.userId);
        return user?.name || 'Unknown';
      },
    },
    {
      header: 'Plan Name',
      accessor: 'planName',
    },
    {
      header: 'Duration',
      accessor: 'duration',
      render: (row) => `${row.duration} days`,
    },
    {
      header: 'Calories',
      accessor: 'calories',
      render: (row) => `${row.calories} kcal`,
    },
    {
      header: 'Created',
      accessor: 'createdAt',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={Eye}
            onClick={() => {
              setSelectedPlan(row);
              setShowViewModal(true);
            }}
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Diet Plans</h1>
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

      <Card>
        <Table columns={columns} data={dietPlans} />
      </Card>

      {/* Create Diet Plan Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedUser(null);
        }}
        title="Create Diet Plan"
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Select
              label="Select Patient"
              name="userId"
              value={formData.userId}
              onChange={(e) => handleUserSelect(e.target.value)}
              options={patients.map(p => ({ value: p.id, label: `${p.name} (${p.age}y, ${p.weight}kg)` }))}
              required
            />

            {selectedUser && (
              <Card className="bg-blue-50">
                <h4 className="font-semibold text-gray-900 mb-2">Patient Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Age:</span> {selectedUser.age} years
                  </div>
                  <div>
                    <span className="text-gray-600">Weight:</span> {selectedUser.weight} kg
                  </div>
                  <div>
                    <span className="text-gray-600">Height:</span> {selectedUser.height} cm
                  </div>
                  <div>
                    <span className="text-gray-600">BMI:</span>{' '}
                    {(selectedUser.weight / Math.pow(selectedUser.height / 100, 2)).toFixed(1)}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={generateDietPlan}
                  className="mt-4"
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
                label="Daily Calories"
                type="number"
                name="calories"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                placeholder="2000"
                required
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
              label="Additional Notes"
              name="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any special instructions or notes..."
              rows={2}
            />
          </div>

          <div className="flex gap-4 mt-6">
            <Button type="submit" variant="primary" icon={Send} className="flex-1">
              Create & Send to Patient
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Patient</p>
                <p className="font-semibold">
                  {users.find(u => u.id === selectedPlan.userId)?.name}
                </p>
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
                <p className="font-semibold">
                  {new Date(selectedPlan.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

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

export default DietPlans;
