import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Select from '../components/Select';
import Alert from '../components/Alert';
import { Activity, Mail, Lock, User, Phone, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';

const Signup = () => {
  const { createUser, users } = useApp();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    phone: '',
    age: '',
  });
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (users.some(u => u.email === formData.email)) {
      newErrors.email = 'Email already registered';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Phone validation (optional but if provided, must be valid)
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    // Age validation (optional but if provided, must be valid)
    if (formData.age && (formData.age < 1 || formData.age > 120)) {
      newErrors.age = 'Please enter a valid age (1-120)';
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
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        phone: formData.phone || undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
      };

      await createUser(userData);
      setShowSuccess(true);
      toast.success('Account created successfully! Redirecting to login...');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      toast.error(error.message || 'Failed to create account. Please try again.');
    }
  };

  const roleOptions = [
    { value: 'user', label: 'Patient' },
    { value: 'doctor', label: 'Doctor/Nutritionist' },
    { value: 'dietitian', label: 'Dietitian' },
    { value: 'receptionist', label: 'Receptionist' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white rounded-full shadow-lg">
              <Activity className="text-primary-600" size={48} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">DietPlan Pro</h1>
          <p className="text-gray-600">Create your account to get started</p>
        </div>

        {/* Signup Card */}
        <Card>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Sign Up
          </h2>

          {showSuccess && (
            <Alert
              type="success"
              message="Account created successfully! Redirecting to login..."
              className="mb-6"
            />
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
                error={errors.name}
                icon={User}
              />

              <Input
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                error={errors.email}
                icon={Mail}
              />

              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
                error={errors.password}
                icon={Lock}
              />

              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                error={errors.confirmPassword}
                icon={Lock}
              />

              <Input
                label="Phone Number (Optional)"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                error={errors.phone}
                icon={Phone}
              />

              <Input
                label="Age (Optional)"
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="Enter your age"
                error={errors.age}
                icon={Calendar}
              />
            </div>

            <div className="mt-4">
              <Select
                label="Register As"
                name="role"
                value={formData.role}
                onChange={handleChange}
                options={roleOptions}
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Note: Admin accounts can only be created by existing administrators
              </p>
            </div>

            <div className="mt-6">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                  I agree to the{' '}
                  <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                    Privacy Policy
                  </a>
                </label>
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full mt-6">
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50">
          <h3 className="font-semibold text-gray-900 mb-3">Why Join DietPlan Pro?</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-primary-600 font-bold">✓</span>
              <span>Personalized diet plans tailored to your health goals</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 font-bold">✓</span>
              <span>Track your health metrics and progress over time</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 font-bold">✓</span>
              <span>Schedule appointments with healthcare professionals</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 font-bold">✓</span>
              <span>Access medical reports and feedback anytime</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
