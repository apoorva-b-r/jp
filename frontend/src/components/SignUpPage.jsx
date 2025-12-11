import { useState } from 'react';
import { Activity, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../services/api';

export function SignUpPage({ onNavigate, onSignUp }) {
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    gender: '',
    pincode: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    const newErrors = {};

    // Full Name
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full Name is required';
    }

    // Age
    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else if (formData.age < 1 || formData.age > 120) {
      newErrors.age = 'Enter a valid age';
    }

    // Gender
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    // Username
    if (!formData.username) {
      newErrors.username = 'Username is required';
    }

    // Email
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Pincode (required on frontend)
    if (!formData.pincode) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^[0-9]{6}$/.test(String(formData.pincode))) {
      newErrors.pincode = 'Pincode must be a 6 digit number';
    }

    // Confirm Password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      // Call backend API
      const result = await authAPI.signup({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        fullName: formData.fullName,
          age: parseInt(formData.age),
          pincode: formData.pincode ? String(formData.pincode) : null,
        gender: formData.gender
      });

      if (result.success) {
        // Store token and user data
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('user', JSON.stringify(result.data.user));

        // Inform parent App about successful signup so it can
        // update global auth state and user profile
        if (onSignUp) {
          onSignUp(result.data.user, result.data.token);
        }

        // Show success message
        alert('✅ Account created successfully!');

        // Navigate to medical history page
        onNavigate('medical-history');
      } else {
        // Show error from backend
        setApiError(result.error);
      }
    } catch (error) {
      console.error('Signup error:', error);
      setApiError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-black relative overflow-hidden text-primary">
      {/* Subtle decorative marks on dark background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <Activity className="absolute top-20 left-10 w-16 h-16 text-[rgba(208,230,253,0.06)]" />
        <Activity className="absolute bottom-20 right-10 w-20 h-20 text-[rgba(241,228,209,0.04)]" />
        <Activity className="absolute top-1/2 right-1/4 w-12 h-12 text-[rgba(22,34,102,0.04)]" />
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-surface rounded-xl shadow-md p-8 border border-transparent">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Activity className="w-12 h-12 text-secondary" />
            </div>
            <h2 className="text-primary text-2xl font-bold tracking-tight">Create Your Account</h2>
            <p className="text-muted mt-2">Join Jiggly Puffs today</p>
          </div>

          {/* API Error Message */}
          {apiError && (
            <div className="mb-4 p-3 bg-[#2f0f0f] border border-transparent rounded-lg">
              <p className="text-red-400 text-sm">{apiError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Full Name */}
            <div>
              <label className="block text-muted mb-2 font-medium">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg bg-input border border-[rgba(208,230,253,0.18)] focus:outline-none focus:ring-2 focus:ring-secondary text-primary`}
                placeholder="Enter your full name"
                disabled={loading}
              />
              {errors.fullName && <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>}
            </div>

            {/* Age */}
            <div>
              <label className="block text-muted mb-2 font-medium">Age</label>
              <input
                type="number"
                min="1"
                max="120"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg bg-input border border-[rgba(208,230,253,0.18)] focus:outline-none focus:ring-2 focus:ring-secondary text-primary`}
                placeholder="Enter your age"
                disabled={loading}
              />
              {errors.age && <p className="text-red-400 text-sm mt-1">{errors.age}</p>}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-muted mb-2 font-medium">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg bg-input border border-[rgba(208,230,253,0.18)] focus:outline-none focus:ring-2 focus:ring-secondary text-primary`}
                disabled={loading}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <p className="text-red-400 text-sm mt-1">{errors.gender}</p>}
            </div>

            {/* Pincode (required) */}
            <div>
              <label className="block text-muted mb-2 font-medium">Pincode (6 digits) <span className="text-red-400">*</span></label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/[^0-9]/g, '') })}
                className={`w-full px-4 py-3 rounded-lg bg-input border border-[rgba(208,230,253,0.18)] focus:outline-none focus:ring-2 focus:ring-secondary text-primary`}
                placeholder="Enter your 6-digit pincode"
                required
                disabled={loading}
              />
              {errors.pincode && <p className="text-red-400 text-sm mt-1">{errors.pincode}</p>}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-muted mb-2 font-medium">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                <input
                  type="text"
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg bg-input border border-[rgba(208,230,253,0.18)] focus:outline-none focus:ring-2 focus:ring-secondary text-primary`}
                  placeholder="Enter your username"
                  disabled={loading}
                />
              </div>
              {errors.username && <p className="text-red-400 text-sm mt-1">{errors.username}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-muted mb-2 font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg bg-input border border-[rgba(208,230,253,0.18)] focus:outline-none focus:ring-2 focus:ring-secondary text-primary`}
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>
              {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-muted mb-2 font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full pl-10 pr-12 py-3 rounded-lg bg-input border border-[rgba(208,230,253,0.18)] focus:outline-none focus:ring-2 focus:ring-secondary text-primary`}
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:opacity-80"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-muted mb-2 font-medium">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={`w-full pl-10 pr-12 py-3 rounded-lg bg-input border border-[rgba(208,230,253,0.18)] focus:outline-none focus:ring-2 focus:ring-secondary text-primary`}
                  placeholder="Confirm your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:opacity-80"
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className={`w-full py-3 rounded-xl font-semibold ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={loading}
              style={{ boxShadow: '0 8px 24px rgba(22,34,102,0.12)', backgroundColor: 'var(--color-primary)', color: 'var(--text-primary)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Switch to Sign In */}
          <div className="mt-6 text-center">
            <p className="text-muted">
              Already have an account?{' '}
              <button
                onClick={() => onNavigate('signin')}
                className="text-secondary hover:opacity-90 transition-colors font-semibold"
                disabled={loading}
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}