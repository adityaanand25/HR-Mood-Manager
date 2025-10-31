import React, { useState } from 'react';
import './Login.css';

interface LoginProps {
  onLogin: (userId: string, role: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'employee' | 'hr'>('employee');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!userId.trim()) {
      setError('Please enter your User ID');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your Password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!role) {
      setError('Please select your role');
      return;
    }

    setIsLoading(true);

    // Simulate API call - Replace with actual authentication logic
    setTimeout(() => {
      // For demo purposes, accept any valid credentials
      // In production, validate against your backend
      if (userId && password && role) {
        onLogin(userId, role);
      } else {
        setError('Invalid credentials');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">
            <svg
              width="60"
              height="60"
              viewBox="0 0 60 60"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="30" cy="30" r="28" fill="#4F46E5" opacity="0.1" />
              <path
                d="M30 15C21.716 15 15 21.716 15 30C15 38.284 21.716 45 30 45C38.284 45 45 38.284 45 30C45 21.716 38.284 15 30 15ZM30 18C36.627 18 42 23.373 42 30C42 36.627 36.627 42 30 42C23.373 42 18 36.627 18 30C18 23.373 23.373 18 30 18ZM25.5 25.5C24.672 25.5 24 26.172 24 27C24 27.828 24.672 28.5 25.5 28.5C26.328 28.5 27 27.828 27 27C27 26.172 26.328 25.5 25.5 25.5ZM34.5 25.5C33.672 25.5 33 26.172 33 27C33 27.828 33.672 28.5 34.5 28.5C35.328 28.5 36 27.828 36 27C36 26.172 35.328 25.5 34.5 25.5ZM30 31.5C26.686 31.5 23.932 33.558 22.875 36.375C23.997 38.463 26.316 39.75 30 39.75C33.684 39.75 36.003 38.463 37.125 36.375C36.068 33.558 33.314 31.5 30 31.5Z"
                fill="#4F46E5"
              />
            </svg>
          </div>
          <h1>HR Mood Manager</h1>
          <p>Welcome back! Please login to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="userId">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z"
                  fill="currentColor"
                />
                <path
                  d="M10 12C4.477 12 0 14.477 0 17.5V20H20V17.5C20 14.477 15.523 12 10 12Z"
                  fill="currentColor"
                />
              </svg>
              User ID
            </label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter your user ID"
              className={error && !userId ? 'error' : ''}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 7H14V5C14 2.24 11.76 0 9 0C6.24 0 4 2.24 4 5V7H3C1.9 7 1 7.9 1 9V18C1 19.1 1.9 20 3 20H15C16.1 20 17 19.1 17 18V9C17 7.9 16.1 7 15 7ZM9 15C7.9 15 7 14.1 7 13C7 11.9 7.9 11 9 11C10.1 11 11 11.9 11 13C11 14.1 10.1 15 9 15ZM6 7V5C6 3.34 7.34 2 9 2C10.66 2 12 3.34 12 5V7H6Z"
                  fill="currentColor"
                />
              </svg>
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={error && !password ? 'error' : ''}
              autoComplete="current-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 0C8.89543 0 8 0.89543 8 2C8 3.10457 8.89543 4 10 4C11.1046 4 12 3.10457 12 2C12 0.89543 11.1046 0 10 0Z"
                  fill="currentColor"
                />
                <path
                  d="M3 6C1.89543 6 1 6.89543 1 8C1 9.10457 1.89543 10 3 10C4.10457 10 5 9.10457 5 8C5 6.89543 4.10457 6 3 6Z"
                  fill="currentColor"
                />
                <path
                  d="M17 6C15.8954 6 15 6.89543 15 8C15 9.10457 15.8954 10 17 10C18.1046 10 19 9.10457 19 8C19 6.89543 18.1046 6 17 6Z"
                  fill="currentColor"
                />
                <path
                  d="M10 5C9.44772 5 9 5.44772 9 6V7C9 7.55228 9.44772 8 10 8C10.5523 8 11 7.55228 11 7V6C11 5.44772 10.5523 5 10 5Z"
                  fill="currentColor"
                />
                <path
                  d="M6.70711 7.29289C6.31658 6.90237 5.68342 6.90237 5.29289 7.29289L4.58579 8L3.87868 7.29289C3.48816 6.90237 2.85499 6.90237 2.46447 7.29289C2.07394 7.68342 2.07394 8.31658 2.46447 8.70711L3.17157 9.41421L2.46447 10.1213C2.07394 10.5118 2.07394 11.145 2.46447 11.5355C2.85499 11.9261 3.48816 11.9261 3.87868 11.5355L4.58579 10.8284L5.29289 11.5355C5.68342 11.9261 6.31658 11.9261 6.70711 11.5355C7.09763 11.145 7.09763 10.5118 6.70711 10.1213L6 9.41421L6.70711 8.70711C7.09763 8.31658 7.09763 7.68342 6.70711 7.29289Z"
                  fill="currentColor"
                />
                <path
                  d="M13.2929 7.29289C12.9024 6.90237 12.2692 6.90237 11.8787 7.29289C11.4882 7.68342 11.4882 8.31658 11.8787 8.70711L12.5858 9.41421L11.8787 10.1213C11.4882 10.5118 11.4882 11.145 11.8787 11.5355C12.2692 11.9261 12.9024 11.9261 13.2929 11.5355L14 10.8284L14.7071 11.5355C15.0976 11.9261 15.7308 11.9261 16.1213 11.5355C16.5118 11.145 16.5118 10.5118 16.1213 10.1213L15.4142 9.41421L16.1213 8.70711C16.5118 8.31658 16.5118 7.68342 16.1213 7.29289C15.7308 6.90237 15.0976 6.90237 14.7071 7.29289L14 8L13.2929 7.29289Z"
                  fill="currentColor"
                />
                <path
                  d="M10 12C6.68629 12 4 14.6863 4 18C4 19.1046 4.89543 20 6 20H14C15.1046 20 16 19.1046 16 18C16 14.6863 13.3137 12 10 12Z"
                  fill="currentColor"
                />
              </svg>
              Role
            </label>
            <div className="role-selector">
              <button
                type="button"
                className={`role-option ${role === 'employee' ? 'active' : ''}`}
                onClick={() => setRole('employee')}
              >
                <div className="role-icon">👤</div>
                <div className="role-info">
                  <div className="role-title">Employee</div>
                  <div className="role-description">Track your mood</div>
                </div>
              </button>
              <button
                type="button"
                className={`role-option ${role === 'hr' ? 'active' : ''}`}
                onClick={() => setRole('hr')}
              >
                <div className="role-icon">👔</div>
                <div className="role-info">
                  <div className="role-title">HR Manager</div>
                  <div className="role-description">View team insights</div>
                </div>
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 0C3.6 0 0 3.6 0 8C0 12.4 3.6 16 8 16C12.4 16 16 12.4 16 8C16 3.6 12.4 0 8 0ZM8.8 12H7.2V10.4H8.8V12ZM8.8 8.8H7.2V4H8.8V8.8Z"
                  fill="currentColor"
                />
              </svg>
              {error}
            </div>
          )}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>

          <div className="login-footer">
            <a href="#" className="forgot-password">
              Forgot password?
            </a>
          </div>
        </form>

        <div className="demo-credentials">
          <p>
            <strong>Demo:</strong> Use any User ID and password (min 6 characters)
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
