import React from 'react';
import { 
  FaUtensils, 
  FaBreadSlice, 
  FaEgg, 
  FaCalendarAlt, 
  FaUser, 
  FaFilePdf,
  FaPrint,
  FaArrowLeft
} from 'react-icons/fa';

const getMealIcon = (mealType) => {
  switch (mealType.toLowerCase()) {
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

const ViewDietPlan = ({ plan, onClose }) => {
  if (!plan) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{plan.title}</h2>
            <div className="flex items-center mt-1 text-sm text-gray-500">
              <FaUser className="mr-1" />
              <span>{plan.patient}</span>
              <span className="mx-2">•</span>
              <FaCalendarAlt className="mr-1" />
              <span>Created on {new Date(plan.created).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => window.print()}
              className="p-2 text-gray-600 hover:text-gray-800"
              title="Print"
            >
              <FaPrint className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800"
              title="Close"
            >
              <FaArrowLeft className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Nutrition Summary */}
        <div className="mb-8 bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Nutrition Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded shadow">
              <div className="text-sm text-gray-500">Calories</div>
              <div className="text-xl font-bold">{plan.calories} <span className="text-sm font-normal">kcal</span></div>
            </div>
            <div className="bg-white p-3 rounded shadow">
              <div className="text-sm text-gray-500">Protein</div>
              <div className="text-xl font-bold">{plan.protein} <span className="text-sm font-normal">g</span></div>
            </div>
            <div className="bg-white p-3 rounded shadow">
              <div className="text-sm text-gray-500">Carbs</div>
              <div className="text-xl font-bold">{plan.carbs} <span className="text-sm font-normal">g</span></div>
            </div>
            <div className="bg-white p-3 rounded shadow">
              <div className="text-sm text-gray-500">Fat</div>
              <div className="text-xl font-bold">{plan.fat} <span className="text-sm font-normal">g</span></div>
            </div>
          </div>
        </div>

        {/* Meals */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Meal Plan</h3>
          <div className="space-y-4">
            {plan.meals && plan.meals.length > 0 ? (
              plan.meals.map((meal, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b flex items-center">
                    {getMealIcon(meal.mealType)}
                    <span className="font-medium capitalize">{meal.mealType}</span>
                    {meal.calories && (
                      <span className="ml-auto text-sm text-gray-500">
                        {meal.calories} kcal
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="whitespace-pre-line">{meal.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No meal plans available
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {plan.notes && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Additional Notes</h3>
            <div className="bg-yellow-50 p-4 rounded border border-yellow-100">
              <p className="whitespace-pre-line">{plan.notes}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <span className="text-sm text-gray-500">
            Status: <span className="font-medium">{plan.status}</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Back to Plans
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewDietPlan;
