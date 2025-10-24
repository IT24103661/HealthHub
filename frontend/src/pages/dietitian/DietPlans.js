import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaPlus, 
  FaSearch, 
  FaFilter, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaFilePdf,
  FaUser,
  FaCalendarAlt,
  FaTimes,
  FaUtensils,
  FaBreadSlice,
  FaEgg,
  FaChevronDown,
  FaChevronUp,
  FaUserFriends,
  FaClipboardList,
  FaBell,
  FaUserMd,
  FaChartLine
} from 'react-icons/fa';
import ViewDietPlan from './components/ViewDietPlan';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DietPlans = () => {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    sortBy: 'newest'
  });
  
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    patientId: '',
    description: '',
    status: 'draft',
    dailyCalories: '',
    protein: '',
    carbs: '',
    fat: '',
    meals: [
      { mealType: 'breakfast', description: '', calories: '' },
      { mealType: 'lunch', description: '', calories: '' },
      { mealType: 'dinner', description: '', calories: '' },
      { mealType: 'snacks', description: '', calories: '' }
    ],
    notes: ''
  });

  // Fetch patients (users with role 'user') from API
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        // Fetch users from the backend API
        const response = await fetch('http://localhost:8080/api/users');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        
        // Check if the response has the expected structure
        if (!data || !data.users || !Array.isArray(data.users)) {
          throw new Error('Invalid response format from server');
        }
        
        // Filter for users with role 'user' and map to expected format
        const patientUsers = data.users
          .filter(user => {
            const role = user.role?.toLowerCase();
            const isUser = role === 'user';
            console.log(`User ${user.id} (${user.fullName}) has role: ${role}`, { isUser });
            return isUser;
          })
          .map(user => ({
            id: user.id,
            name: user.fullName || `User ${user.id}`,
            email: user.email || 'No email',
            phone: user.phone || ''
          }));
          
        console.log('Filtered patients:', patientUsers);
        setPatients(patientUsers);
      } catch (error) {
        console.error('Error fetching patients:', error);
        toast.error('Failed to load patients. Please try again later.');
        // For development, use mock data if API fails
        setPatients([
          { id: 1, name: 'John Doe', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
          { id: 3, name: 'Robert Johnson', email: 'robert@example.com' }
        ]);
      }
    };

    fetchPatients();
  }, []);

  const handleInputChange = (e) => {
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

  const handleCreateDietPlan = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Get the current user (dietitian) from localStorage
      const currentUser = JSON.parse(localStorage.getItem('user'));
      if (!currentUser || !currentUser.id) {
        throw new Error('User not authenticated');
      }

      // Prepare the payload with the correct structure expected by the backend
      const payload = {
        title: formData.title,
        patientId: parseInt(formData.patientId),
        dietitianId: currentUser.id, // Current user is the dietitian
        description: formData.description,
        status: formData.status || 'DRAFT',
        dailyCalories: formData.dailyCalories ? parseInt(formData.dailyCalories) : null,
        protein: formData.protein ? parseInt(formData.protein) : null,
        carbs: formData.carbs ? parseInt(formData.carbs) : null,
        fat: formData.fat ? parseInt(formData.fat) : null,
        meals: formData.meals
          .filter(meal => meal.description && meal.calories)
          .map(meal => ({
            mealType: meal.mealType.toUpperCase(),
            description: meal.description,
            calories: parseInt(meal.calories) || 0
          })),
        notes: formData.notes
      };

      // Call the backend API to create the diet plan
      const response = await fetch('http://localhost:8080/api/diet-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to create diet plan');
      }

      // Show success message
      toast.success('Diet plan created successfully!');
      
      // Reset form
      setFormData({
        title: '',
        patientId: '',
        description: '',
        status: 'draft',
        dailyCalories: '',
        protein: '',
        carbs: '',
        fat: '',
        meals: [
          { mealType: 'breakfast', description: '', calories: '' },
          { mealType: 'lunch', description: '', calories: '' },
          { mealType: 'dinner', description: '', calories: '' },
          { mealType: 'snacks', description: '', calories: '' }
        ],
        notes: ''
      });
      
      // Close the form
      setShowCreateForm(false);
      
      // TODO: Refresh the diet plans list
      
    } catch (error) {
      console.error('Error creating diet plan:', error);
      toast.error(error.message || 'Failed to create diet plan');
    } finally {
      setLoading(false);
    }
  };

  const getMealIcon = (mealType) => {
    switch (mealType) {
      case 'breakfast':
        return <FaBreadSlice className="mr-2" />;
      case 'lunch':
        return <FaUtensils className="mr-2" />;
      case 'dinner':
        return <FaEgg className="mr-2" />;
      default:
        return <FaUtensils className="mr-2" />;
    }
  };
  // State for managing diet plans
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const handleViewPlan = (plan) => {
    // Format the plan data to include a meals array if it doesn't exist
    const formattedPlan = {
      ...plan,
      meals: plan.meals || [{
        mealType: 'General',
        description: plan.description || 'No meal description available',
        calories: plan.calories
      }],
      patientName: plan.patient || 'Patient',
      dailyCalories: plan.calories,
      createdAt: plan.created
    };
    
    setSelectedPlan(formattedPlan);
    setViewMode(true);
  };

  const handleCloseView = () => {
    setViewMode(false);
    setSelectedPlan(null);
  };

  // Fetch diet plans from API
  useEffect(() => {
    const fetchDietPlans = async () => {
      try {
        // Get the current user (dietitian) from localStorage
        const currentUser = JSON.parse(localStorage.getItem('user'));
        if (!currentUser || !currentUser.id) {
          throw new Error('User not authenticated');
        }

        // Fetch plans for the current dietitian
        const response = await fetch(`http://localhost:8080/api/diet-plans/dietitian/${currentUser.id}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const data = result.data || []; // Extract data from the response
        
        // Transform the API response to match the expected format
        const formattedPlans = data.map(plan => ({
          id: plan.id,
          title: plan.title,
          patient: plan.patientName || `Patient ${plan.patientId}`,
          created: plan.createdAt || new Date().toISOString(),
          status: plan.status || 'Draft',
          calories: plan.dailyCalories || 0,
          protein: plan.protein || 0,
          carbs: plan.carbs || 0,
          fat: plan.fat || 0,
          description: plan.description || '',
          patientId: plan.patientId
        }));

        setPlans(formattedPlans);
        setError(null);
      } catch (err) {
        console.error('Error fetching diet plans:', err);
        setError('Failed to load diet plans. Please try again later.');
        toast.error('Failed to load diet plans');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDietPlans();
  }, []);


  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.patient.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || plan.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const exportToPDF = async (plan) => {
    try {
      // Show loading state
      toast.loading('Generating PDF...');
      
      // Import jsPDF and required plugins
      const { jsPDF } = await import('jspdf');
      
      // Create new document with custom fonts and styling
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Set default font
      doc.setFont('helvetica');
      
      // Add header with logo and title
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      
      // Add colored header
      doc.setFillColor(63, 81, 181);
      doc.rect(0, 0, pageWidth, 30, 'F');
      
      // Add logo and title
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text('HEALTHHUB', margin, 20);
      
      // Add document title
      doc.setFontSize(22);
      const title = plan.title || 'Diet Plan';
      doc.text(title.toUpperCase(), pageWidth / 2, 50, { align: 'center' });
      
      // Add divider line
      doc.setDrawColor(63, 81, 181);
      doc.setLineWidth(0.5);
      doc.line(margin, 55, pageWidth - margin, 55);
      
      // Reset text color for content
      doc.setTextColor(0, 0, 0);
      
      // Add plan details section
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('PLAN DETAILS', margin, 70);
      doc.setFont(undefined, 'normal');
      
      // Create detail rows with fallbacks
      const details = [
        { label: 'Patient', value: plan.patientName || plan.patient?.name || 'Not specified' },
        { label: 'Created', value: plan.created ? new Date(plan.created).toLocaleDateString() : 'N/A' },
        { label: 'Status', value: plan.status || 'Active' },
        { label: 'Dietitian', value: plan.dietitianName || plan.dietitian?.name || 'Not specified' }
      ];
      
      // Draw details table with error handling
      let yPos = 78;
      details.forEach((item, index) => {
        try {
          // Draw row background
          doc.setFillColor(index % 2 === 0 ? [245, 245, 245] : [255, 255, 255]);
          doc.rect(margin, yPos - 4, pageWidth - (margin * 2), 8, 'F');
          
          // Draw row border
          doc.setDrawColor(220, 220, 220);
          doc.rect(margin, yPos - 4, pageWidth - (margin * 2), 8);
          
          // Add text
          doc.setTextColor(0, 0, 0);
          doc.setFont(undefined, 'bold');
          doc.text(`${item.label}:`, margin + 5, yPos);
          doc.setFont(undefined, 'normal');
          doc.text(String(item.value), margin + 40, yPos);
          
          yPos += 8;
        } catch (err) {
          console.error(`Error drawing detail row for ${item.label}:`, err);
        }
      });
      
      // Add nutritional info section with error handling
      try {
        yPos += 10;
        doc.setFont(undefined, 'bold');
        doc.text('NUTRITIONAL INFORMATION', margin, yPos);
        yPos += 10;
        
        // Nutritional info boxes with fallback values
        const nutritionData = [
          { label: 'Calories', value: `${plan.calories || 0} kcal`, color: [76, 175, 80] },
          { label: 'Protein', value: `${plan.protein || 0}g`, color: [33, 150, 243] },
          { label: 'Carbs', value: `${plan.carbs || 0}g`, color: [255, 152, 0] },
          { label: 'Fat', value: `${plan.fat || 0}g`, color: [244, 67, 54] }
        ];
        
        // Draw nutrition cards
        const cardWidth = Math.min(40, (pageWidth - (margin * 2) - 15) / 4);
        nutritionData.forEach((item, index) => {
          try {
            const x = margin + (index * (cardWidth + 5));
            
            // Card background
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(200, 200, 200);
            doc.rect(x, yPos, cardWidth, 25, 'FD');
            
            // Label
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(item.label, x + 3, yPos + 8, { maxWidth: cardWidth - 6 });
            
            // Value
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(...item.color);
            doc.text(item.value, x + 3, yPos + 18, { maxWidth: cardWidth - 6 });
          } catch (err) {
            console.error(`Error drawing nutrition card ${item.label}:`, err);
          }
        });
        
        yPos += 35;
      } catch (err) {
        console.error('Error in nutritional info section:', err);
        yPos += 20; // Skip to next section if there's an error
      }
      
      // Add meals section if available
      if (plan.meals && Array.isArray(plan.meals) && plan.meals.length > 0) {
        try {
          doc.setFont(undefined, 'bold');
          doc.setFontSize(14);
          doc.text('MEAL PLAN', margin, yPos);
          yPos += 10;
          
          plan.meals.forEach((meal, index) => {
            try {
              // Check for page break
              if (yPos > 250) {
                doc.addPage();
                yPos = 30;
              }
              
              // Meal type header
              doc.setFillColor(63, 81, 181);
              doc.rect(margin, yPos - 5, pageWidth - (margin * 2), 8, 'F');
              doc.setTextColor(255, 255, 255);
              doc.setFontSize(12);
              doc.text((meal.mealType || 'Meal').toUpperCase(), margin + 5, yPos);
              
              // Meal content
              doc.setTextColor(0, 0, 0);
              doc.setFont(undefined, 'normal');
              
              // Description with proper wrapping
              const description = meal.description || 'No description provided.';
              const splitDesc = doc.splitTextToSize(description, pageWidth - (margin * 2) - 10);
              doc.text(splitDesc, margin + 5, yPos + 10);
              
              // Calculate height used by description
              const descHeight = splitDesc.length * 5;
              
              // Nutrition info
              doc.setFontSize(10);
              doc.setTextColor(100, 100, 100);
              doc.text(`Calories: ${meal.calories || 0} kcal`, margin + 5, yPos + 15 + descHeight);
              
              yPos += 25 + descHeight;
              
              // Add separator between meals
              if (index < plan.meals.length - 1) {
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.2);
                doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
                yPos += 8;
              }
            } catch (mealErr) {
              console.error('Error processing meal:', mealErr);
              yPos += 20; // Skip to next meal if there's an error
            }
          });
        } catch (mealsErr) {
          console.error('Error in meals section:', mealsErr);
        }
      }
      
      // Add footer to each page
      try {
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          
          // Page number
          doc.setFontSize(10);
          doc.setTextColor(150, 150, 150);
          doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, 287, { align: 'right' });
          
          // Footer line
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.3);
          doc.line(margin, 280, pageWidth - margin, 280);
          
          // Footer text
          doc.setTextColor(100, 100, 100);
          doc.setFontSize(9);
          doc.text(`Generated by HealthHub - ${new Date().toLocaleDateString()}`, margin, 287);
          doc.text('Confidential', pageWidth / 2, 287, { align: 'center' });
        }
      } catch (footerErr) {
        console.error('Error adding footer:', footerErr);
      }
      
      // Save the PDF
      const fileName = `HealthHub-DietPlan-${(plan.title || 'diet-plan').toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')}.pdf`;
      
      doc.save(fileName);
      toast.dismiss();
      toast.success('PDF generated successfully');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.dismiss();
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:8080/api/diet-plans/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update the local state to remove the deleted plan
      setPlans(plans.filter(plan => plan.id !== id));
      setShowDeleteModal(false);
      setSelectedPlan(null);
      toast.success('Diet plan deleted successfully');
    } catch (err) {
      console.error('Error deleting diet plan:', err);
      toast.error('Failed to delete diet plan');
    }
  };

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const renderCreateForm = () => (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Create New Diet Plan</h2>
        <button
          onClick={() => setShowCreateForm(false)}
          className="text-gray-400 hover:text-gray-500"
        >
          <FaTimes className="h-5 w-5" />
        </button>
      </div>
      
      <form onSubmit={handleCreateDietPlan} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Plan Title *
            </label>
            <input
              type="text"
              name="title"
              id="title"
              required
              value={formData.title}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="relative">
            <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-1">
              Select Patient *
            </label>
            <div className="relative">
              <select
                id="patientId"
                name="patientId"
                value={formData.patientId}
                onChange={handleInputChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white appearance-none"
              >
                <option value="">Select a patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} ({patient.email})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FaChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-md font-medium text-gray-900 mb-4">Nutritional Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label htmlFor="dailyCalories" className="block text-sm font-medium text-gray-700">
                Daily Calories (kcal)
              </label>
              <input
                type="number"
                name="dailyCalories"
                id="dailyCalories"
                value={formData.dailyCalories}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="protein" className="block text-sm font-medium text-gray-700">
                Protein (g)
              </label>
              <input
                type="number"
                name="protein"
                id="protein"
                value={formData.protein}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="carbs" className="block text-sm font-medium text-gray-700">
                Carbs (g)
              </label>
              <input
                type="number"
                name="carbs"
                id="carbs"
                value={formData.carbs}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="fat" className="block text-sm font-medium text-gray-700">
                Fat (g)
              </label>
              <input
                type="number"
                name="fat"
                id="fat"
                value={formData.fat}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">Meal Plan</h3>
          <div className="space-y-4">
            {formData.meals.map((meal, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                  <div className="flex items-center">
                    {getMealIcon(meal.mealType)}
                    <span className="capitalize font-medium">{meal.mealType}</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meal Description
                    </label>
                    <textarea
                      rows={2}
                      value={meal.description}
                      onChange={(e) => handleMealChange(index, 'description', e.target.value)}
                      className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="E.g., Oatmeal with fruits and nuts"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Calories (kcal)
                      </label>
                      <input
                        type="number"
                        value={meal.calories}
                        onChange={(e) => handleMealChange(index, 'calories', e.target.value)}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g. 350"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Additional Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={formData.notes}
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Any additional instructions or notes for this diet plan..."
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => setShowCreateForm(false)}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Diet Plan'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderDeleteModal = () => (
    <div className={`fixed z-50 inset-0 overflow-y-auto ${!showDeleteModal ? 'hidden' : ''}`} aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          aria-hidden="true"
          onClick={() => {
            setShowDeleteModal(false);
            setSelectedPlan(null);
          }}
        ></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <FaTrash className="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Delete Diet Plan
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete this diet plan? This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={() => {
                if (selectedPlan?.id) {
                  handleDelete(selectedPlan.id);
                }
              }}
            >
              Delete
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* View Diet Plan Modal */}
      {viewMode && selectedPlan && (
        <ViewDietPlan 
          plan={selectedPlan} 
          onClose={handleCloseView} 
        />
      )}
      
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      {renderDeleteModal()}
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Diet Plans</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage and create personalized diet plans for your patients
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaPlus className="-ml-1 mr-2 h-4 w-4" />
                Create New Plan
              </button>
            )}
          </div>
        </div>

        {showCreateForm && renderCreateForm()}

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search plans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="w-full sm:w-40">
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <FaFilter className="h-4 w-4 mr-1" />
                Filter
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : (
          /* Plans Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => {
            console.log('Plan data:', plan);
            return (
            <div key={plan.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
              <div className="px-4 py-5 sm:p-6 cursor-pointer" onClick={() => handleViewPlan(plan)}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">{plan.title}</h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(plan.status)}`}>
                    {plan.status}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <FaUser className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                    <span>{
                      (typeof plan.patient === 'string' && plan.patient.startsWith('Patient') ? 
                        plan.patient : 
                        (plan.patient?.name || plan.patient?.fullName || 
                         (plan.patientId ? `Patient ID: ${plan.patientId}` : 'No patient assigned'))
                      )
                    }</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <FaCalendarAlt className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                    <span>Created on {new Date(plan.created).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Calories</p>
                      <p className="text-lg font-semibold text-gray-900">{plan.calories} <span className="text-sm text-gray-500">kcal</span></p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Protein</p>
                      <p className="text-lg font-semibold text-gray-900">{plan.protein}g</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Carbs</p>
                      <p className="text-lg font-semibold text-gray-900">{plan.carbs}g</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Fat</p>
                      <p className="text-lg font-semibold text-gray-900">{plan.fat}g</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-between border-t border-gray-100">
                <div className="flex space-x-2">
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      className="p-1.5 border border-gray-300 shadow-sm rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      title="View plan"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewPlan(plan);
                      }}
                    >
                      <FaEye className="h-4 w-4" />
                    </button>
                    <Link
                      to={`/dietitian/plans/${plan.id}/edit`}
                      className="p-1.5 border border-gray-300 shadow-sm rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      title="Edit plan"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FaEdit className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      className="p-1.5 border border-red-300 shadow-sm rounded text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      title="Delete plan"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlan(plan);
                        setShowDeleteModal(true);
                      }}
                    >
                      <FaTrash className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      exportToPDF(plan);
                    }}
                    title="Export to PDF"
                  >
                    <FaFilePdf className="h-4 w-4 mr-1" />
                    Export
                  </button>
                </div>
              </div>
            </div>
          );
          })}
        </div>
        )}

        {/* Empty State */}
        {filteredPlans.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No plans found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'No plans match your search criteria. Try adjusting your filters.'
                : 'Get started by creating a new diet plan.'}
            </p>
            <div className="mt-6">
              <Link
                to="/dietitian/plans/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaPlus className="-ml-1 mr-2 h-4 w-4" />
                New Plan
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DietPlans;
