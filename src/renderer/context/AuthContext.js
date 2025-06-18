import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService.js';

/**
 * Authentication Context for managing auth state in React components
 */
const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Initialize auth service
    if (!initialized) {
      authService.init();
      setInitialized(true);
    }

    // Check for existing session
    const checkSession = async () => {
      try {
        const currentSession = await authService.getSession();
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const handleSignIn = (event) => {
      const { user: authUser, session: authSession } = event.detail;
      setUser(authUser);
      setSession(authSession);
      setLoading(false);
    };

    const handleSignOut = () => {
      setUser(null);
      setSession(null);
      setLoading(false);
    };

    window.addEventListener('supabase-auth-signin', handleSignIn);
    window.addEventListener('supabase-auth-signout', handleSignOut);

    return () => {
      window.removeEventListener('supabase-auth-signin', handleSignIn);
      window.removeEventListener('supabase-auth-signout', handleSignOut);
    };
  }, [initialized]);

  // Auth methods
  const signUpWithEmail = async (email, password, options = {}) => {
    setLoading(true);
    try {
      const result = await authService.signUpWithEmail(email, password, options);
      if (result.success && result.data.user) {
        setUser(result.data.user);
        setSession(result.data.session);
      }
      return result;
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email, password) => {
    setLoading(true);
    try {
      const result = await authService.signInWithEmail(email, password);
      if (result.success && result.data.user) {
        setUser(result.data.user);
        setSession(result.data.session);
      }
      return result;
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await authService.signInWithGoogle();
      return result;
    } catch (error) {
      console.error('Google sign in error:', error);
      return { success: false, error: error.message };
    }
  };

  const signInWithApple = async () => {
    try {
      const result = await authService.signInWithApple();
      return result;
    } catch (error) {
      console.error('Apple sign in error:', error);
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const result = await authService.signOut();
      if (result.success) {
        setUser(null);
        setSession(null);
      }
      return result;
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    try {
      const result = await authService.resetPassword(email);
      return result;
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: error.message };
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      const result = await authService.updatePassword(newPassword);
      return result;
    } catch (error) {
      console.error('Password update error:', error);
      return { success: false, error: error.message };
    }
  };

  const updateProfile = async (updates) => {
    try {
      const result = await authService.updateProfile(updates);
      if (result.success && result.data.user) {
        setUser(result.data.user);
      }
      return result;
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    // State
    user,
    session,
    loading,
    isAuthenticated: !!user,

    // Methods
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signInWithApple,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
