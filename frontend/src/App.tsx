import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Deals from './pages/Deals';
import Users from './pages/Users';
import Analytics from './pages/Analytics';

const AppContent: React.FC = () => {
  const { user, isLoading, isAuthenticated, error } = useAuth();

  console.log('🔥 App render state:', {
    isAuthenticated,
    isLoading,
    hasUser: !!user,
    error
  });

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem'
      }}>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: 'red'
      }}>
        Error: {error}
        <button
          onClick={() => window.location.reload()}
          style={{ marginLeft: '1rem' }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/dashboard"
        element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
      />
      {/* NEW ROUTES - These were missing! */}
      <Route
        path="/deals"
        element={isAuthenticated ? <Deals /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/users"
        element={isAuthenticated ? <Users /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/analytics"
        element={isAuthenticated ? <Analytics /> : <Navigate to="/login" replace />}
      />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
      />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;