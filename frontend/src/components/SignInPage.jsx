import { useState } from 'react';
import { Activity, User, Lock, Eye, EyeOff } from 'lucide-react';

export function SignInPage({ onNavigate, onSignIn }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    const newErrors = {};

    if (!formData.username) {
      newErrors.username = 'Username is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setApiError('');

    if (!onSignIn) return;

    setLoading(true);
    try {
      const result = await onSignIn(formData.username, formData.password);

      if (!result?.success) {
        setApiError(result?.error || 'Invalid username or password.');
      }
      // On success, App will navigate away from this page.
    } catch (err) {
      console.error('Sign in error:', err);
      setApiError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-black relative overflow-hidden text-secondary">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <Activity className="absolute top-20 right-10 w-16 h-16 text-[#10B981]" />
        <Activity className="absolute bottom-20 left-10 w-20 h-20 text-[#0EA5E9]" />
        <Activity className="absolute top-1/2 left-1/4 w-12 h-12 text-[#10B981]" />
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="card rounded-2xl shadow-xl p-8 backdrop-blur-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Activity className="w-12 h-12 text-secondary" />
            </div>
            <h2 className="text-highlight">Welcome Back</h2>
            <p className="text-secondary/90 mt-2">Sign in to your account</p>
          </div>

          {/* API Error */}
          {apiError && (
            <div className="mb-4 p-3 bg-[#2f0f0f] border border-transparent rounded-lg">
              <p className="text-highlight text-sm">{apiError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-secondary/90 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/80" />
                <input
                  type="text"
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-input border border-[#D0E6FD]/20 focus:outline-none focus:ring-2 focus:ring-[#162266] focus:border-transparent placeholder:text-[rgba(208,230,253,0.7)]`}
                  placeholder="Enter your username"
                  disabled={loading}
                />
              </div>
              {errors.username && <p className="text-highlight mt-1">{errors.username}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-secondary/90 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/80" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full pl-10 pr-12 py-3 rounded-2xl bg-input border border-[#D0E6FD]/20 focus:outline-none focus:ring-2 focus:ring-[#162266] focus:border-transparent placeholder:text-[rgba(208,230,253,0.7)]`}
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/80 hover:opacity-90"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-highlight mt-1">{errors.password}</p>}
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => alert('Password reset functionality would be implemented here')}
                className="text-secondary hover:text-highlight transition-all duration-300"
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`w-full py-3 rounded-2xl transition-all duration-300 shadow-[0_8px_24px_rgba(22,34,102,0.12)] ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={loading}
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--text-primary)' }}
            >
              {loading ? 'Logging In...' : 'Log In'}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-secondary/90">
              Don&apos;t have an account?{' '}
              <button
                onClick={() => onNavigate('signup')}
                className="text-secondary hover:text-highlight transition-all duration-300"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}