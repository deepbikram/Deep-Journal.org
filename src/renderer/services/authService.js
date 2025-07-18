import { supabase, OAUTH_REDIRECT_URL } from '../config/supabase.js';

/**
 * Authentication service for handling Supabase auth in Electron
 * Supports Email/Password, Google OAuth, and Apple OAuth
 */
class AuthService {
  constructor() {
    this.serverPort = 3001;
  }

  /**
   * Initialize the auth service and set up session listener
   */
  init() {
    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);

      if (event === 'SIGNED_IN') {
        console.log('User signed in:', session.user);
        // Emit custom event for UI to handle
        window.dispatchEvent(new CustomEvent('supabase-auth-signin', {
          detail: { user: session.user, session }
        }));
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        // Emit custom event for UI to handle
        window.dispatchEvent(new CustomEvent('supabase-auth-signout'));
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed:', session);
      }
    });

    // Listen for OAuth callbacks from main process
    if (window.electron?.ipc?.on) {
      window.electron.ipc.on('oauth-callback', (callbackUrl) => {
        this.handleOAuthCallback(callbackUrl);
      });

      // Listen for OAuth tokens from main process (new method)
      window.electron.ipc.on('oauth-tokens', (tokens) => {
        this.handleOAuthTokens(tokens);
      });
    }

    // Check for existing session on init
    this.getSession();
  }

  /**
   * Handle OAuth tokens directly from main process
   */
  async handleOAuthTokens(tokens) {
    try {
      console.log('Handling OAuth tokens:', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        tokenType: tokens.token_type
      });

      if (tokens.access_token) {
        // Set the session with the received tokens
        const { data, error } = await supabase.auth.setSession({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || '',
        });

        if (error) {
          console.error('OAuth token processing error:', error);
          return { success: false, error: error.message };
        }

        console.log('OAuth authentication successful:', data);
        return { success: true, data };
      } else {
        console.error('No access token found in OAuth tokens');
        return { success: false, error: 'No access token received' };
      }
    } catch (error) {
      console.error('OAuth token handling error:', error);
      return { success: false, error: error.message || 'OAuth token processing failed' };
    }
  }

  /**
   * Handle OAuth callback from external browser (legacy method)
   */
  async handleOAuthCallback(callbackUrl) {
    try {
      console.log('Handling OAuth callback:', callbackUrl);

      // Parse the callback URL to extract fragments/query params
      const url = new URL(callbackUrl);
      const hashParams = new URLSearchParams(url.hash.slice(1)); // Remove the '#'
      const queryParams = new URLSearchParams(url.search);

      // Check for tokens in hash (Supabase typically sends them in fragments)
      const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
      const tokenType = hashParams.get('token_type') || queryParams.get('token_type');

      if (accessToken) {
        // Set the session with the received tokens
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });

        if (error) {
          console.error('OAuth callback error:', error);
          return { success: false, error: error.message };
        }

        console.log('OAuth authentication successful:', data);
        return { success: true, data };
      } else {
        console.error('No access token found in OAuth callback');
        return { success: false, error: 'No access token received' };
      }
    } catch (error) {
      console.error('OAuth callback handling error:', error);
      return { success: false, error: error.message || 'OAuth callback failed' };
    }
  }

  /**
   * Get current session
   */
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Get current user
   */
  async getUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  /**
   * Sign up with email and password
   */
  async signUpWithEmail(email, password, options = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          ...options,
          // Add any additional user metadata here
        }
      });

      if (error) throw error;

      console.log('Sign up successful:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: error.message || 'Sign up failed'
      };
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log('Sign in successful:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: error.message || 'Sign in failed'
      };
    }
  }  /**
   * Sign in with Google OAuth using PKCE flow
   */
  async signInWithGoogle() {
    try {
      // Get OAuth URL from Supabase with PKCE
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3001/auth/callback',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) throw error;

      // Open OAuth URL in external browser
      console.log('Opening Google OAuth URL:', data.url);

      // For Electron, use window.electron.openExternal if available, otherwise fallback to window.open
      if (window.electron && window.electron.openExternal) {
        window.electron.openExternal(data.url);
      } else {
        // Fallback for development or if electron is not available
        window.open(data.url, '_blank');
      }

      return { success: true, message: 'OAuth process started. Please complete authentication in your browser and return to the app.' };
    } catch (error) {
      console.error('Google OAuth error:', error);
      return {
        success: false,
        error: error.message || 'Google OAuth failed'
      };
    }
  }

  /**
   * Sign in with Apple OAuth using PKCE flow
   */
  async signInWithApple() {
    try {
      // Get OAuth URL from Supabase with PKCE
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: 'http://localhost:3001/auth/callback',
        }
      });

      if (error) throw error;

      // Open OAuth URL in external browser
      console.log('Opening Apple OAuth URL:', data.url);

      // For Electron, use window.electron.openExternal if available, otherwise fallback to window.open
      if (window.electron && window.electron.openExternal) {
        window.electron.openExternal(data.url);
      } else {
        // Fallback for development or if electron is not available
        window.open(data.url, '_blank');
      }

      return { success: true, message: 'OAuth process started. Please complete authentication in your browser and return to the app.' };
    } catch (error) {
      console.error('Apple OAuth error:', error);
      return {
        success: false,
        error: error.message || 'Apple OAuth failed'
      };
    }
  }

  /**
   * Sign out user
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      console.log('Sign out successful');
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: error.message || 'Sign out failed'
      };
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      console.log('Password reset email sent:', data);
      return { success: true, message: 'Password reset email sent. Please check your inbox.' };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: error.message || 'Password reset failed'
      };
    }
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      console.log('Password updated successfully:', data);
      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      console.error('Password update error:', error);
      return {
        success: false,
        error: error.message || 'Password update failed'
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      });

      if (error) throw error;

      console.log('Profile updated successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        error: error.message || 'Profile update failed'
      };
    }
  }
}

// Create and export singleton instance
export const authService = new AuthService();
export default authService;
