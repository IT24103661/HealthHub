import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FaSave, 
  FaTimes,
  FaPlus,
  FaTrash,
  FaUserFriends,
  FaClipboardList,
  FaCalendarAlt,
  FaBell,
  FaUserMd,
  FaChartLine,
  FaSearch,
  FaFilter,
  FaUser,
  FaFilePdf,
  FaEye,
  FaEdit,
  FaChevronDown,
  FaChevronUp,
  FaBreadSlice,
  FaEgg,
  FaUtensils
} from 'react-icons/fa';

const EditDietPlan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [patients, setPatients] = useState([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    patientId: '',
    dietitianId: '',
    status: 'draft',
    description: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    meals: [
      { mealType: 'breakfast', description: '', calories: '' },
      { mealType: 'lunch', description: '', calories: '' },
      { mealType: 'dinner', description: '', calories: '' }
    ]
  });

  // Fetch patients and plan data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch patients first
        console.log('Fetching patients...');
        const patientsResponse = await fetch('http://localhost:8080/api/users?role=user');
        if (!patientsResponse.ok) {
          const errorText = await patientsResponse.text();
          console.error('Failed to fetch patients:', patientsResponse.status, errorText);
          throw new Error(`Failed to fetch patients: ${patientsResponse.status} ${errorText}`);
        }
        const responseData = await patientsResponse.json();
        const allUsers = responseData.data || responseData.users || [];
        // Filter for users with role 'user' and ensure they have an ID
        const patientsData = allUsers.filter(user => user.role === 'user' && user.id);
        console.log('Filtered patients data:', patientsData);
        setPatients(patientsData);
        setIsLoadingPatients(false);
        
        if (!id) {
          setIsLoading(false);
          return;
        }
        
        // Then fetch plan data if editing
        const planResponse = await fetch(`http://localhost:8080/api/diet-plans/${id}`);
        if (!planResponse.ok) throw new Error('Failed to fetch plan');
        
        const planData = await planResponse.json();
        const plan = planData.data;
        
        // Get the current user (dietitian) ID from local storage or context
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const dietitianId = plan.dietitianId || (currentUser?.role === 'dietitian' ? currentUser.id : '');
        
        setFormData({
          title: plan.title || '',
          patientId: plan.patientId || '',
          dietitianId: dietitianId, // Set dietitianId from plan or current user
          status: plan.status || 'draft',
          description: plan.description || '',
          calories: plan.calories || '',
          protein: plan.protein || '',
          carbs: plan.carbs || '',
          fat: plan.fat || '',
          meals: plan.meals?.length > 0 
            ? plan.meals 
            : [
                { mealType: 'breakfast', description: plan.description || '', calories: '' },
                { mealType: 'lunch', description: '', calories: '' },
                { mealType: 'dinner', description: '', calories: '' }
              ]
        });
      } catch (err) {
        setError(err.message || 'Failed to load plan');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMealChange = (index, field, value) => {
    const updatedMeals = [...formData.meals];
    updatedMeals[index] = {
      ...updatedMeals[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      meals: updatedMeals
    }));
  };

  const addMeal = () => {
    setFormData(prev => ({
      ...prev,
      meals: [
        ...prev.meals,
        { mealType: 'snack', description: '', calories: '' }
      ]
    }));
  };

  const removeMeal = (index) => {
    if (formData.meals.length <= 1) return;
    
    const updatedMeals = formData.meals.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      meals: updatedMeals
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(''); // Clear previous errors
    
    try {
      const method = id ? 'PUT' : 'POST';
      const url = id 
        ? `http://localhost:8080/api/diet-plans/${id}`
        : 'http://localhost:8080/api/diet-plans';
      
      // Get current user data
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const dietitianId = formData.dietitianId || (currentUser?.role === 'dietitian' ? currentUser.id : null);
      
      if (!dietitianId) {
        throw new Error('You must be logged in as a dietitian to save a diet plan');
      }
      
      if (!formData.patientId) {
        throw new Error('Please select a patient for this diet plan');
      }
      
      const payload = {
        ...formData,
        patientId: Number(formData.patientId),
        dietitianId: Number(dietitianId),
        calories: formData.calories || formData.meals.reduce((sum, meal) => sum + (parseInt(meal.calories) || 0), 0)
      };
      
      console.log('Sending request to:', url);
      console.log('Request payload:', payload);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Add auth token if needed
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      console.log('Server response:', responseData);

      if (!response.ok) {
        throw new Error(
          responseData.message || 
          responseData.error || 
          `Failed to save plan: ${response.status} ${response.statusText}`
        );
      }

      // Redirect to plans list with success message
      navigate('/dietitian/plans', { 
        state: { success: true, message: id ? 'Plan updated successfully!' : 'Plan created successfully!' } 
      });
    } catch (err) {
      console.error('Error saving diet plan:', err);
      setError(err.message || 'Failed to save plan. Please check the console for more details.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            {id ? 'Edit Diet Plan' : 'Create New Diet Plan'}
          </h2>
          <button
            onClick={() => navigate('/dietitian/plans')}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 gap-6 mb-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Plan Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="e.g., Weight Loss Plan"
            />
          </div>

          <div>
            <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-1">
              Patient <span className="text-red-500">*</span>
            </label>
            <select
              id="patientId"
              name="patientId"
              required
              value={formData.patientId}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              disabled={isLoadingPatients}
            >
              <option value="">Select a patient</option>
              {patients && patients.length > 0 ? (
                patients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name || patient.fullName || patient.username || `Patient ${patient.id}`}
                  </option>
                ))
              ) : (
                <option value="" disabled>No patients available</option>
              )}
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meals
            </label>
            
            {formData.meals.map((meal, index) => (
              <div key={index} className="mb-4 p-4 border rounded-lg bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex-1 mr-2">
                    <select
                      value={meal.mealType}
                      onChange={(e) => handleMealChange(index, 'mealType', e.target.value)}
                      className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="snack">Snack</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMeal(index)}
                    disabled={formData.meals.length <= 1}
                    className={`p-2 rounded-full ${
                      formData.meals.length <= 1 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-red-500 hover:bg-red-50 hover:text-red-600'
                    }`}
                  >
                    <FaTrash className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="mb-2">
                  <label className="block text-sm text-gray-500 mb-1">Description</label>
                  <textarea
                    value={meal.description}
                    onChange={(e) => handleMealChange(index, 'description', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    rows="3"
                    placeholder="Describe the meal..."
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Calories</label>
                    <input
                      type="number"
                      value={meal.calories}
                      onChange={(e) => handleMealChange(index, 'calories', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addMeal}
              className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaPlus className="-ml-0.5 mr-1.5 h-3.5 w-3.5" />
              Add Meal
            </button>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows="3"
              value={formData.notes || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Any additional instructions or notes..."
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/dietitian/plans')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
              isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {isLoading ? (
              'Saving...'
            ) : id ? (
              <>
                <FaSave className="-ml-1 mr-2 h-5 w-5" />
                Update Plan
              </>
            ) : (
              <>
                <FaPlus className="-ml-1 mr-2 h-5 w-5" />
                Create Plan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditDietPlan;
