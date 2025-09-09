// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: JSX.Element;
  requireAdmin?: boolean;
}) {
  const { user, isLoading, isAuthenticated, error } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }
  
  if (error) {
    return <div className="min-h-screen flex items-center justify-center">Error: {error}</div>;
  }
  
  // Session error handling
  if (!user && isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center">Session error. Please login again.</div>;
  }
  
  if (!user) return <Navigate to="/login" replace />;

  // 🛡 Admin check (from Supabase metadata or upserted data)
  if (requireAdmin) {
    const isAdmin = user?.user_metadata?.is_admin ?? user?.name?.includes('Admin') ?? false; // Fallback to name check
    if (!isAdmin) return <Navigate to="/login" replace />;
  }

  return children;
}