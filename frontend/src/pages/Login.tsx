// frontend/src/pages/Login.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/Login/LoginForm'; // ✅ Import the actual component

const Login = () => {
  const navigate = useNavigate();

  // ✅ This is the missing onSuccess handler!
  const handleLoginSuccess = () => {
    console.log('Login successful! Redirecting to dashboard...');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your admin dashboard
          </p>
        </div>
        <div className="mt-8 space-y-6">
          {/* ✅ NOW we're passing onSuccess properly! */}
          <LoginForm onSuccess={handleLoginSuccess} />
        </div>
      </div>
    </div>
  );
};

export default Login;