'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, LoginRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { LogIn, User, Lock, AlertCircle, UserPlus, Mail, Building, Eye, EyeOff, Brain } from 'lucide-react';

interface SignupRequest {
  user_id: string;
  password: string;
  confirmPassword: string;
  role: string;
  full_name: string;
  email: string;
  department: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginData, setLoginData] = useState<LoginRequest>({
    user_id: '',
    password: ''
  });
  const [signupData, setSignupData] = useState<SignupRequest>({
    user_id: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
    full_name: '',
    email: '',
    department: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.login(loginData);
      if (response.success) {
        login(response.user);
        router.push('/dashboard');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Validation
    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (signupData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      const registrationData = {
        user_id: signupData.user_id,
        password: signupData.password,
        role: signupData.role,
        full_name: signupData.full_name,
        email: signupData.email,
        department: signupData.department || undefined
      };

      const response = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Account created successfully! You can now sign in.');
        setIsSignup(false);
        setLoginData({ user_id: signupData.user_id, password: '' });
        setSignupData({
          user_id: '',
          password: '',
          confirmPassword: '',
          role: 'employee',
          full_name: '',
          email: '',
          department: ''
        });
      } else {
        setError(data.detail || data.message || 'Registration failed');
      }
    } catch (err: any) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (role: 'employee' | 'hr') => {
    const demoCredentials = {
      employee: { user_id: 'EMP001', password: 'emp123' },
      hr: { user_id: 'HR001', password: 'hr123' }
    };
    
    setLoginData(demoCredentials[role]);
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Modern animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_40%,rgba(120,119,198,0.1),transparent_50%)]"></div>
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_60%,rgba(147,51,234,0.1),transparent_50%)]"></div>
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_40%_80%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      </div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      
      {/* Professional floating elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-40 right-32 w-1 h-1 bg-purple-400 rounded-full opacity-80 animate-ping"></div>
        <div className="absolute bottom-32 left-40 w-1.5 h-1.5 bg-indigo-400 rounded-full opacity-70 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 right-20 w-2 h-2 bg-pink-400 rounded-full opacity-50 animate-ping" style={{animationDelay: '2s'}}></div>
      </div>
      <div className="relative z-10 w-full max-w-md">
        {/* Professional header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Brain className="h-12 w-12 text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
            HR Mood
          </h1>
          <div className="text-2xl font-light text-white/90 mb-4">
            Manager
          </div>
          <p className="text-slate-400 text-sm font-medium max-w-xs mx-auto leading-relaxed">
            Advanced AI-powered employee wellness and sentiment analysis platform
          </p>
        </div>

        <Card className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-3xl overflow-hidden relative">
          {/* Card header */}
          <CardHeader className="text-center pb-6 pt-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              {isSignup ? (
                <UserPlus className="h-8 w-8 text-blue-400" />
              ) : (
                <LogIn className="h-8 w-8 text-blue-400" />
              )}
              <h2 className="text-2xl font-semibold text-white">
                {isSignup ? 'Create Account' : 'Welcome Back'}
              </h2>
            </div>
            <p className="text-slate-400 text-sm">
              {isSignup 
                ? 'Join thousands of companies using our platform' 
                : 'Enter your credentials to access the dashboard'
              }
            </p>
          </CardHeader>

        <CardContent className="px-8 pb-8">{/* Error and Success Messages moved to top */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-400/20 rounded-2xl text-red-300 text-sm font-medium relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent"></div>
              <div className="flex items-center gap-3 relative z-10">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-400/20 rounded-2xl text-green-300 text-sm font-medium relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent"></div>
              <div className="flex items-center gap-3 relative z-10">
                <UserPlus className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>{success}</span>
              </div>
            </div>
          )}
          {/* Login Form */}
          {!isSignup && (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="space-y-5">
                <div className="group">
                  <label htmlFor="user_id" className="block text-sm font-semibold text-slate-300 mb-3">
                    User ID
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors duration-300" />
                    <input
                      id="user_id"
                      type="text"
                      value={loginData.user_id}
                      onChange={(e) => setLoginData({ ...loginData, user_id: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/20"
                      placeholder="Enter your user ID"
                      required
                    />
                  </div>
                </div>

                <div className="group">
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-300 mb-3">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors duration-300" />
                    <input
                      id="password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/20"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full mt-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 group relative overflow-hidden"
                disabled={isLoading}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                {isLoading ? (
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 relative z-10">
                    <LogIn className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                    <span>Access Dashboard</span>
                  </div>
                )}
              </button>
            </form>
          )}

          {/* Signup Form */}
          {isSignup && (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div className="transform transition-all duration-300 hover:scale-105">
                <label htmlFor="signup_user_id" className="block text-sm font-medium text-purple-100 mb-2">
                  User ID
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-300 transition-colors group-focus-within:text-purple-100" />
                  <input
                    id="signup_user_id"
                    type="text"
                    value={signupData.user_id}
                    onChange={(e) => setSignupData({ ...signupData, user_id: e.target.value })}
                    className="pl-12 w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-white placeholder-white/60 backdrop-blur-sm transition-all duration-300"
                    placeholder="Choose a unique user ID"
                    required
                  />
                </div>
              </div>

              <div className="transform transition-all duration-300 hover:scale-105">
                <label htmlFor="full_name" className="block text-sm font-medium text-purple-100 mb-2">
                  Full Name
                </label>
                <input
                  id="full_name"
                  type="text"
                  value={signupData.full_name}
                  onChange={(e) => setSignupData({ ...signupData, full_name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-white placeholder-white/60 backdrop-blur-sm transition-all duration-300"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="transform transition-all duration-300 hover:scale-105">
                <label htmlFor="email" className="block text-sm font-medium text-purple-100 mb-2">
                  Email
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-300 transition-colors group-focus-within:text-purple-100" />
                  <input
                    id="email"
                    type="email"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    className="pl-12 w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-white placeholder-white/60 backdrop-blur-sm transition-all duration-300"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="transform transition-all duration-300 hover:scale-105">
                <label htmlFor="role" className="block text-sm font-medium text-purple-100 mb-2">
                  Role
                </label>
                <select
                  id="role"
                  value={signupData.role}
                  onChange={(e) => setSignupData({ ...signupData, role: e.target.value })}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-white backdrop-blur-sm transition-all duration-300"
                  required
                >
                  <option value="employee" className="text-gray-800">Employee</option>
                  <option value="hr" className="text-gray-800">HR Manager</option>
                </select>
              </div>

              <div className="transform transition-all duration-300 hover:scale-105">
                <label htmlFor="department" className="block text-sm font-medium text-purple-100 mb-2">
                  Department (Optional)
                </label>
                <div className="relative group">
                  <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-300 transition-colors group-focus-within:text-purple-100" />
                  <input
                    id="department"
                    type="text"
                    value={signupData.department}
                    onChange={(e) => setSignupData({ ...signupData, department: e.target.value })}
                    className="pl-12 w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-white placeholder-white/60 backdrop-blur-sm transition-all duration-300"
                    placeholder="Enter your department"
                  />
                </div>
              </div>

              <div className="transform transition-all duration-300 hover:scale-105">
                <label htmlFor="signup_password" className="block text-sm font-medium text-purple-100 mb-2">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-300 transition-colors group-focus-within:text-purple-100" />
                  <input
                    id="signup_password"
                    type={showPassword ? 'text' : 'password'}
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    className="pl-12 pr-12 w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-white placeholder-white/60 backdrop-blur-sm transition-all duration-300"
                    placeholder="Enter password (min 6 characters)"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-300 hover:text-purple-100 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="transform transition-all duration-300 hover:scale-105">
                <label htmlFor="confirm_password" className="block text-sm font-medium text-purple-100 mb-2">
                  Confirm Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-300 transition-colors group-focus-within:text-purple-100" />
                  <input
                    id="confirm_password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                    className="pl-12 pr-12 w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-white placeholder-white/60 backdrop-blur-sm transition-all duration-300"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-300 hover:text-purple-100 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 border-0 mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Creating account...
                  </div>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    Create Account
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Toggle between Login and Signup */}
          <div className="mt-8 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-900/50 text-slate-400 backdrop-blur-sm">
                  {isSignup ? 'Already have an account?' : 'New to the platform?'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleMode}
              className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors duration-300 inline-flex items-center gap-2 hover:gap-3"
            >
              <span>{isSignup ? 'Sign in here' : 'Create account'}</span>
              <span className="text-xs">→</span>
            </button>
          </div>

          {/* Demo accounts section - only show for login */}
          {!isSignup && (
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-sm text-slate-400 text-center mb-4 font-medium">Quick Demo Access</p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleDemoLogin('employee')}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-sm font-medium rounded-xl transition-all duration-300 hover:scale-[1.02] group"
                >
                  <User className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
                  Employee
                </button>
                <button 
                  onClick={() => handleDemoLogin('hr')}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-sm font-medium rounded-xl transition-all duration-300 hover:scale-[1.02] group"
                >
                  <Building className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
                  HR Manager
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-4 text-center leading-relaxed">
                Demo credentials are pre-filled for testing purposes
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}