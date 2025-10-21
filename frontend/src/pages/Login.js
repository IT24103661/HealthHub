import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Select from '../components/Select';
import Alert from '../components/Alert';
import { Activity, Mail, Lock, User } from 'lucide-react';
import { toast } from 'react-toastify';

const Login = () => {
  const { login } = useApp();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user',
  });
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(''); // Clear previous errors
    
    try {
      const userData = await login(formData.email, formData.password, formData.role);
      toast.success('Login successful!');
      
      // Redirect based on role
      switch (userData.role) {
        case 'admin':
          navigate('/admin/users');
          break;
        case 'doctor':
          navigate('/doctor/dashboard');
          break;
        case 'dietitian':
          navigate('/dietitian/diet-plans');
          break;
        case 'receptionist':
          navigate('/receptionist/dashboard');
          break;
        case 'user':
        default:
          navigate('/dashboard');
          break;
      }
    } catch (error) {
      const message = error.message || 'Login failed. Please check your credentials.';
      setErrorMessage(message);
      toast.error(message);
    }
  };

  const roleOptions = [
    { value: 'user', label: 'Patient' },
    { value: 'doctor', label: 'Doctor/Nutritionist' },
    { value: 'dietitian', label: 'Dietitian Assistant' },
    { value: 'receptionist', label: 'Receptionist' },
    { value: 'admin', label: 'Administrator' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white rounded-full shadow-lg">
              <Activity className="text-primary-600" size={48} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">DietPlan Pro</h1>
          <p className="text-gray-600">Your Personal Health & Nutrition Platform</p>
        </div>

        {/* Login Card */}
        <Card>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Sign In to Your Account
          </h2>

          {errorMessage && (
            <Alert
              type="error"
              message={errorMessage}
              onClose={() => setErrorMessage('')}
              className="mb-4"
            />
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              icon={Mail}
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              icon={Lock}
            />

            <Select
              label="Login As"
              name="role"
              value={formData.role}
              onChange={handleChange}
              options={roleOptions}
              required
            />

            <Button type="submit" variant="primary" size="lg" className="w-full mt-6">
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
