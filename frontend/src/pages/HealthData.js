import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Select from '../components/Select';
import Textarea from '../components/Textarea';
import Button from '../components/Button';
import Alert from '../components/Alert';
import { User, Scale, Ruler, Calendar, Activity } from 'lucide-react';
import { toast } from 'react-toastify';

const HealthData = () => {
  const { addHealthData, updateHealthData } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;
  
  const [formData, setFormData] = useState({
    age: '',
    weight: '',
    height: '',
    gender: '',
    activityLevel: '',
    medicalConditions: '',
    allergies: '',
    dietaryPreferences: '',
    goals: '',
  });
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (editData) {
      setIsEditMode(true);
      setFormData({
        age: editData.age || '',
        weight: editData.weight || '',
        height: editData.height || '',
        gender: editData.gender || '',
        activityLevel: editData.activityLevel || '',
        medicalConditions: editData.medicalHistory || '',
        allergies: editData.allergies || '',
        dietaryPreferences: editData.dietaryPreferences || '',
        goals: editData.healthGoal || '',
      });
    }
  }, [editData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.age || formData.age < 1 || formData.age > 120) {
      newErrors.age = 'Please enter a valid age (1-120)';
    }
    if (!formData.weight || formData.weight < 20 || formData.weight > 300) {
      newErrors.weight = 'Please enter a valid weight (20-300 kg)';
    }
    if (!formData.height || formData.height < 50 || formData.height > 250) {
      newErrors.height = 'Please enter a valid height (50-250 cm)';
    }
    if (!formData.gender) {
      newErrors.gender = 'Please select your gender';
    }
    if (!formData.activityLevel) {
      newErrors.activityLevel = 'Please select your activity level';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      if (isEditMode && editData) {
        await updateHealthData(editData.id, formData);
        toast.success('Health data updated successfully!');
      } else {
        await addHealthData(formData);
        toast.success('Health data submitted successfully!');
      }
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      toast.error(isEditMode ? 'Failed to update health data' : 'Failed to submit health data');
    }
  };

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
    { value: 'light', label: 'Lightly Active (1-3 days/week)' },
    { value: 'moderate', label: 'Moderately Active (3-5 days/week)' },
    { value: 'very', label: 'Very Active (6-7 days/week)' },
    { value: 'extra', label: 'Extra Active (physical job + exercise)' },
  ];

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Edit Health Data' : 'Health Data Input'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isEditMode 
            ? 'Update your health information' 
            : 'Please provide your health information to help us create a personalized diet plan'}
        </p>
      </div>

      {showSuccess && (
        <Alert
          type="success"
          message="Your health data has been submitted successfully! Redirecting to dashboard..."
          className="mb-6"
        />
      )}

      <Card>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User size={20} />
                Basic Information
              </h3>
            </div>

            <Input
              label="Age"
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="Enter your age"
              error={errors.age}
              required
              icon={Calendar}
            />

            <Select
              label="Gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              options={genderOptions}
              error={errors.gender}
              required
            />

            <Input
              label="Weight (kg)"
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              placeholder="Enter your weight"
              error={errors.weight}
              required
              icon={Scale}
            />

            <Input
              label="Height (cm)"
              type="number"
              name="height"
              value={formData.height}
              onChange={handleChange}
              placeholder="Enter your height"
              error={errors.height}
              required
              icon={Ruler}
            />

            {/* Activity Level */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-4 flex items-center gap-2">
                <Activity size={20} />
                Lifestyle Information
              </h3>
            </div>

            <div className="md:col-span-2">
              <Select
                label="Activity Level"
                name="activityLevel"
                value={formData.activityLevel}
                onChange={handleChange}
                options={activityLevels}
                error={errors.activityLevel}
                required
              />
            </div>

            <div className="md:col-span-2">
              <Textarea
                label="Medical Conditions"
                name="medicalConditions"
                value={formData.medicalConditions}
                onChange={handleChange}
                placeholder="List any medical conditions (e.g., diabetes, hypertension)"
                rows={3}
              />
            </div>

            <div className="md:col-span-2">
              <Textarea
                label="Allergies"
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                placeholder="List any food allergies or intolerances"
                rows={2}
              />
            </div>

            <div className="md:col-span-2">
              <Textarea
                label="Dietary Preferences"
                name="dietaryPreferences"
                value={formData.dietaryPreferences}
                onChange={handleChange}
                placeholder="Vegetarian, vegan, keto, etc."
                rows={2}
              />
            </div>

            <div className="md:col-span-2">
              <Textarea
                label="Health Goals"
                name="goals"
                value={formData.goals}
                onChange={handleChange}
                placeholder="What are your health and fitness goals? (e.g., weight loss, muscle gain, maintenance)"
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <Button type="submit" variant="primary" size="lg" className="flex-1">
              {isEditMode ? 'Update Health Data' : 'Submit Health Data'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>

      {/* BMI Calculator Info */}
      {formData.weight && formData.height && (
        <Card className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your BMI</h3>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-primary-600">
              {(formData.weight / Math.pow(formData.height / 100, 2)).toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">
              <p>Body Mass Index</p>
              <p className="mt-1">
                {(() => {
                  const bmi = formData.weight / Math.pow(formData.height / 100, 2);
                  if (bmi < 18.5) return 'Underweight';
                  if (bmi < 25) return 'Normal weight';
                  if (bmi < 30) return 'Overweight';
                  return 'Obese';
                })()}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default HealthData;
