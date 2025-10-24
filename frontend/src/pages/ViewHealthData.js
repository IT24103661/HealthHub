import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { ArrowLeft } from 'lucide-react';

const ViewHealthData = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { healthData } = useApp();
  
  // Find the health data with the matching ID
  const data = healthData.find(item => item.id === parseInt(id));

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <Card>
          <div className="p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Health Data Not Found</h2>
            <p className="text-gray-600 mb-6">The requested health data could not be found.</p>
            <Button onClick={() => navigate(-1)} variant="secondary">
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mr-4"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Health Data Details</h1>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Age</p>
                <p className="mt-1">{data.age} years</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Weight</p>
                <p className="mt-1">{data.weight} kg</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Height</p>
                <p className="mt-1">{data.height} cm</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">BMI</p>
                <p className="mt-1">{data.bmi || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lifestyle Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Activity Level</p>
                <p className="mt-1 capitalize">{data.activityLevel}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Allergies</p>
                <p className="mt-1">{data.allergies || 'None'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Medical History</p>
                <p className="mt-1">{data.medicalHistory || 'None'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Dietary Preferences</p>
                <p className="mt-1">{data.dietaryPreferences || 'None'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Health Goal</p>
                <p className="mt-1">{data.healthGoal || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <Button 
            variant="secondary"
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Button 
            variant="primary"
            onClick={() => navigate(`/health-data/edit/${data.id}`, { state: { editData: data } })}
          >
            Edit
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ViewHealthData;
