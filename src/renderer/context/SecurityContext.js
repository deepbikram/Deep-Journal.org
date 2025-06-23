import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

/**
 * Security Context for managing app security state
 */
const SecurityContext = createContext({});

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

export const SecurityProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [securitySettings, setSecuritySettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpiry, setSessionExpiry] = useState(null);

  // Load security settings
  const loadSecuritySettings = useCallback(async () => {
    try {
      if (window.electron?.ipc?.invoke) {
        const settings = await window.electron.ipc.invoke('get-security-settings');
        setSecuritySettings(settings);

        // If security is enabled, check session validity
        if (settings?.enabled) {
          const isValidSession = await window.electron.ipc.invoke('is-session-valid');
          if (isValidSession) {
            setIsAuthenticated(true);
            // Set up session expiry timer
            if (settings.sessionTimeout > 0) {
              const expiryTime = Date.now() + (settings.sessionTimeout * 60 * 1000);
              setSessionExpiry(expiryTime);
            }
          } else {
            setIsLocked(true);
          }
        } else {
          // No security enabled, allow access
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
      // Default to authenticated if there's an error
      setIsAuthenticated(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize security on mount
  useEffect(() => {
    loadSecuritySettings();
  }, [loadSecuritySettings]);

  // Session timeout handler
  useEffect(() => {
    if (!sessionExpiry || !securitySettings?.sessionTimeout) return;

    const checkSessionExpiry = () => {
      if (Date.now() >= sessionExpiry) {
        handleLockApp();
      }
    };

    // Check every minute
    const interval = setInterval(checkSessionExpiry, 60000);

    return () => clearInterval(interval);
  }, [sessionExpiry, securitySettings]);

  // Reset session expiry on user activity
  const resetSessionExpiry = useCallback(() => {
    if (securitySettings?.sessionTimeout > 0 && isAuthenticated) {
      const expiryTime = Date.now() + (securitySettings.sessionTimeout * 60 * 1000);
      setSessionExpiry(expiryTime);
    }
  }, [securitySettings, isAuthenticated]);

  // Set up activity listeners to reset session
  useEffect(() => {
    if (!isAuthenticated || !securitySettings?.sessionTimeout) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    const handleActivity = () => {
      resetSessionExpiry();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [isAuthenticated, securitySettings, resetSessionExpiry]);

  // Authentication methods
  const authenticateWithPin = async (pin) => {
    try {
      if (window.electron?.ipc?.invoke) {
        const isValid = await window.electron.ipc.invoke('verify-pin', pin);
        if (isValid) {
          setIsAuthenticated(true);
          setIsLocked(false);
          resetSessionExpiry();
          return { success: true };
        } else {
          return { success: false, error: 'Invalid PIN' };
        }
      }
      return { success: false, error: 'Authentication service unavailable' };
    } catch (error) {
      console.error('PIN authentication error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  };

  const authenticateWithPassword = async (password) => {
    try {
      if (window.electron?.ipc?.invoke) {
        const isValid = await window.electron.ipc.invoke('verify-password', password);
        if (isValid) {
          setIsAuthenticated(true);
          setIsLocked(false);
          resetSessionExpiry();
          return { success: true };
        } else {
          return { success: false, error: 'Invalid password' };
        }
      }
      return { success: false, error: 'Authentication service unavailable' };
    } catch (error) {
      console.error('Password authentication error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  };

  const authenticateWithBiometric = async () => {
    try {
      if (window.electron?.ipc?.invoke && securitySettings?.biometricType) {
        const isValid = await window.electron.ipc.invoke('verify-biometric', securitySettings.biometricType);
        if (isValid) {
          setIsAuthenticated(true);
          setIsLocked(false);
          resetSessionExpiry();
          return { success: true };
        } else {
          return { success: false, error: 'Biometric authentication failed' };
        }
      }
      return { success: false, error: 'Biometric authentication unavailable' };
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  };

  const handleLockApp = useCallback(() => {
    setIsAuthenticated(false);
    setIsLocked(true);
    setSessionExpiry(null);
  }, []);

  const handleUnlockApp = useCallback(() => {
    setIsLocked(false);
    resetSessionExpiry();
  }, [resetSessionExpiry]);

  const refreshSecuritySettings = useCallback(async () => {
    await loadSecuritySettings();
  }, [loadSecuritySettings]);

  // Security question verification and password reset
  const verifySecurityAnswers = async (answer1, answer2) => {
    try {
      if (window.electron?.ipc?.invoke) {
        const isValid = await window.electron.ipc.invoke('verify-security-answers', answer1, answer2);
        return { success: isValid, error: isValid ? null : 'Security answers are incorrect' };
      }
      return { success: false, error: 'Security service unavailable' };
    } catch (error) {
      console.error('Security answers verification error:', error);
      return { success: false, error: 'Verification failed' };
    }
  };

  const resetAuthWithSecurity = async (newPin, newPassword) => {
    try {
      if (window.electron?.ipc?.invoke) {
        const result = await window.electron.ipc.invoke('reset-auth-with-security', newPin, newPassword);
        if (result) {
          // Refresh security settings after reset
          await loadSecuritySettings();
          return { success: true };
        } else {
          return { success: false, error: 'Failed to reset authentication' };
        }
      }
      return { success: false, error: 'Security service unavailable' };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: 'Reset failed' };
    }
  };

  const value = {
    // State
    isAuthenticated,
    isLocked,
    securitySettings,
    loading,
    sessionExpiry,

    // Methods
    authenticateWithPin,
    authenticateWithPassword,
    authenticateWithBiometric,
    handleLockApp,
    handleUnlockApp,
    refreshSecuritySettings,
    resetSessionExpiry,
    verifySecurityAnswers,
    resetAuthWithSecurity,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};

export default SecurityContext;
