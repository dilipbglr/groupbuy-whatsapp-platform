import { useState, useEffect, useContext, createContext } from 'react';
import { supabase } from '../services/auth';

interface User {
  id: string;
  email?: string;
  phone?: string;
  user_metadata?: any;
  name?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🚀 Starting auth initialization');
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          throw new Error('Session fetch failed');
        }

        if (!session?.user) {
          console.log('🔓 No session - showing login');
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        console.log('✅ Session found for user:', session.user.id);

        // Try to upsert to profiles table
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: session.user.id,
            email: session.user.email,
            phone_number: session.user.phone || '',
            name: session.user.user_metadata?.name || null,
            updated_at: new Date().toISOString(),
            is_admin: false
          }, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          });

        if (upsertError) {
          console.error('⚠️ Profile upsert failed:', upsertError);
          // Continue anyway - the auth session is valid
        } else {
          console.log('✅ Profile upsert successful');
        }

        setUser(session.user as User);
        setIsAuthenticated(true);
        setError(null);
        console.log('🎉 Auth initialization complete');

      } catch (error: any) {
        console.error('💀 Auth initialization failed:', error);
        setError(`Auth failed: ${error.message}`);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setIsAuthenticated(false);
          setError(null);
        } else if (session?.user) {
          setUser(session.user as User);
          setIsAuthenticated(true);
          setError(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (phone: string, password: string) => {
    console.log('🔐 Starting login for:', phone.slice(0, 3) + '***');
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        phone,
        password,
      });

      if (loginError) {
        console.error('❌ Login failed:', loginError);
        throw new Error(loginError.message || 'Login failed');
      }

      console.log('✅ Login successful for:', data.user?.email || phone);
      
      // The auth state change listener will handle the rest
      
    } catch (err: any) {
      const errorMsg = err.message || 'Login failed';
      setError(errorMsg);
      console.error('❌ Login error:', err);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🔐 Logging out user:', user?.id?.slice(0, 8));
      await supabase.auth.signOut();
      // Auth state change listener will handle cleanup
      console.log('✅ Logout successful');
    } catch (err: any) {
      console.error('❌ Logout error:', err);
      setError('Logout failed');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isAuthenticated, 
      error, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};