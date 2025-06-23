import React, { useState, useEffect } from 'react';
import { useSecurity } from '../../context/SecurityContext';
import { LockIcon, FingerprintIcon, CameraIcon, ShieldIcon } from '../../icons';
import PasswordRecovery from '../PasswordRecovery';
import styles from './SecurityLockScreen.module.scss';

const SecurityLockScreen = () => {
  const {
    securitySettings,
    authenticateWithPin,
    authenticateWithPassword,
    authenticateWithBiometric,
  } = useSecurity();

  const [pinInput, setPinInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);

  // Get PIN length, with intelligent fallback for existing PINs
  const getPinLength = () => {
    if (securitySettings?.pinLength) {
      return securitySettings.pinLength;
    }
    // For existing users without stored pinLength, try to detect from common lengths
    // Default to 4 as it's most common
    return 4;
  };

  const pinLength = getPinLength();

  // Clear error when user starts typing
  useEffect(() => {
    if (error) {
      setError('');
    }
  }, [pinInput, passwordInput]);

  // Auto-trigger biometric authentication if enabled, otherwise auto-focus appropriate input
  useEffect(() => {
    const initializeAuth = async () => {
      // Priority 1: Biometric authentication if enabled
      if (securitySettings?.biometricEnabled && securitySettings?.biometricType) {
        // Small delay to ensure UI is ready
        setTimeout(async () => {
          try {
            await handleBiometricAuth();
          } catch (error) {
            console.warn('Auto biometric auth failed, falling back to manual input:', error);
            // Fall back to focusing the appropriate input
            focusManualInput();
          }
        }, 300);
      } else {
        // Priority 2: Focus manual input (PIN or password)
        setTimeout(focusManualInput, 100);
      }
    };

    const focusManualInput = () => {
      if (securitySettings?.authType === 'pin') {
        document.getElementById('pin-input')?.focus();
      } else if (securitySettings?.authType === 'password') {
        document.getElementById('password-input')?.focus();
      }
    };

    if (securitySettings) {
      initializeAuth();
    }
  }, [securitySettings]);

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (pinInput.length === pinLength && !loading) {
      handlePinAuth();
    }
  }, [pinInput, pinLength, loading]);

  // Auto-submit password on Enter key
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && passwordInput && !loading && securitySettings?.authType === 'password') {
        handlePasswordAuth();
      }
    };

    document.addEventListener('keypress', handleKeyPress);
    return () => document.removeEventListener('keypress', handleKeyPress);
  }, [passwordInput, loading, securitySettings?.authType]);

  const handlePinAuth = async () => {
    if (!pinInput || pinInput.length < pinLength) {
      setError(`PIN must be ${pinLength} digits`);
      return;
    }

    setLoading(true);
    setError(''); // Clear any existing errors

    try {
      const result = await authenticateWithPin(pinInput);
      if (!result.success) {
        setError('Incorrect PIN. Please try again.');
        setAttempts(prev => prev + 1);
        setPinInput('');
        // Auto-focus input after error
        setTimeout(() => {
          document.getElementById('pin-input')?.focus();
        }, 100);
      }
    } catch (error) {
      setError('Authentication failed. Please try again.');
      setAttempts(prev => prev + 1);
      setPinInput('');
      setTimeout(() => {
        document.getElementById('pin-input')?.focus();
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordAuth = async () => {
    if (!passwordInput.trim()) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError(''); // Clear any existing errors

    try {
      const result = await authenticateWithPassword(passwordInput);
      if (!result.success) {
        setError('Incorrect password. Please try again.');
        setAttempts(prev => prev + 1);
        setPasswordInput('');
        // Auto-focus input after error
        setTimeout(() => {
          document.getElementById('password-input')?.focus();
        }, 100);
      }
    } catch (error) {
      setError('Authentication failed. Please try again.');
      setAttempts(prev => prev + 1);
      setPasswordInput('');
      setTimeout(() => {
        document.getElementById('password-input')?.focus();
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    setLoading(true);
    setError(''); // Clear any existing errors
    
    try {
      const result = await authenticateWithBiometric();
      if (!result.success) {
        // Don't show error immediately on auto-trigger, let user try manual input
        if (result.error && !result.error.includes('cancelled') && !result.error.includes('user cancel')) {
          setError('Biometric authentication failed. Please use your PIN or password.');
        }
        setAttempts(prev => prev + 1);
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      // Only show error if it's not a user cancellation
      if (!error.message?.includes('cancelled') && !error.message?.includes('user cancel')) {
        setError('Biometric authentication failed. Please use your PIN or password.');
      }
      setAttempts(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= pinLength) {
      setPinInput(value);
    }
  };

  const handlePinAreaClick = () => {
    // Focus the hidden input when clicking on the PIN dots area
    document.getElementById('pin-input')?.focus();
  };

  const handleForgotAuth = () => {
    setShowRecovery(true);
    setError('');
  };

  const handleRecoveryBack = () => {
    setShowRecovery(false);
    setError('');
  };

  const handleRecoverySuccess = () => {
    setShowRecovery(false);
    setError('');
    setPinInput('');
    setPasswordInput('');
    // The security settings will be refreshed automatically
  };

  const renderBiometricIcon = () => {
    if (!securitySettings?.biometricType) return null;

    switch (securitySettings.biometricType) {
      case 'fingerprint':
      case 'touchid':
      case 'biometric':
        return <FingerprintIcon />;
      case 'face':
      case 'faceid':
        return <CameraIcon />;
      default:
        return <FingerprintIcon />;
    }
  };

  const getBiometricLabel = () => {
    if (!securitySettings?.biometricType) return '';

    switch (securitySettings.biometricType) {
      case 'fingerprint':
        return 'Use Fingerprint';
      case 'touchid':
        return 'Use Touch ID';
      case 'face':
        return 'Use Face Recognition';
      case 'faceid':
        return 'Use Face ID';
      case 'biometric':
        return 'Use Biometric Authentication';
      default:
        return 'Use Biometric';
    }
  };  if (!securitySettings) {
    return (
      <div className={styles.lockScreen}>
        <div className={styles.container}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading security settings...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show password recovery screen if requested
  if (showRecovery) {
    return (
      <PasswordRecovery
        onBack={handleRecoveryBack}
        onSuccess={handleRecoverySuccess}
      />
    );
  }

  return (
    <div className={styles.lockScreen}>
      <div className={styles.container}>
        <div className={styles.welcomeCard}>
          <div className={styles.iconContainer}>
            <div className={styles.lockIconWrapper}>
              <ShieldIcon />
            </div>
          </div>

          <div className={styles.welcomeContent}>
            <h1 className={styles.title}>Welcome back!</h1>
            <p className={styles.subtitle}>
              {securitySettings.biometricEnabled 
                ? `Use ${getBiometricLabel().replace('Use ', '')} or enter your ${securitySettings.authType === 'pin' ? `${pinLength}-digit PIN` : 'password'}`
                : securitySettings.authType === 'pin'
                  ? `Enter your ${pinLength}-digit PIN`
                  : 'Enter your password'
              }
            </p>
          </div>

          <div className={styles.authContainer}>
            {/* Show biometric authentication first if enabled */}
            {securitySettings.biometricEnabled && (
              <div className={styles.biometricSection}>
                <button
                  type="button"
                  className={styles.biometricButton}
                  onClick={handleBiometricAuth}
                  disabled={loading}
                >
                  {renderBiometricIcon()}
                  {getBiometricLabel()}
                </button>
                
                {securitySettings.authType && (
                  <div className={styles.divider}>
                    <span>or</span>
                  </div>
                )}
              </div>
            )}
            {securitySettings.authType === 'pin' && (
              <div className={styles.authForm}>
                <div className={styles.pinSection} onClick={handlePinAreaClick}>
                  <input
                    id="pin-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={pinInput}
                    onChange={handlePinChange}
                    placeholder=""
                    className={styles.hiddenInput}
                    maxLength={pinLength}
                    disabled={loading}
                    autoComplete="off"
                    autoFocus
                  />
                  <div className={styles.pinDots}>
                    {Array.from({ length: pinLength }, (_, i) => (
                      <div
                        key={i}
                        className={`${styles.pinDot} ${
                          i < pinInput.length ? styles.filled : ''
                        } ${loading ? styles.loading : ''}`}
                      />
                    ))}
                  </div>
                  {loading && (
                    <div className={styles.loadingText}>
                      Verifying...
                    </div>
                  )}
                </div>

                {error && (
                  <div className={styles.errorMessage}>
                    {error}
                  </div>
                )}

                {securitySettings?.securityQuestions && (
                  <button
                    type="button"
                    className={styles.forgotButton}
                    onClick={handleForgotAuth}
                    disabled={loading}
                  >
                    Forgot PIN?
                  </button>
                )}
              </div>
            )}

            {securitySettings.authType === 'password' && (
              <div className={styles.authForm}>
                <div className={styles.passwordSection}>
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter your password"
                    className={styles.passwordInput}
                    disabled={loading}
                    autoComplete="current-password"
                    autoFocus
                  />
                  <button
                    type="button"
                    className={styles.showPasswordButton}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    disabled={loading}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                  {loading && (
                    <div className={styles.loadingIndicator}>
                      <div className={styles.spinner}></div>
                      <span>Verifying...</span>
                    </div>
                  )}
                </div>

                {error && (
                  <div className={styles.errorMessage}>
                    {error}
                  </div>
                )}

                {securitySettings?.securityQuestions && (
                  <button
                    type="button"
                    className={styles.forgotButton}
                    onClick={handleForgotAuth}
                    disabled={loading}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
            )}
          </div>

          {attempts >= 3 && (
            <div className={styles.helpText}>
              Having trouble? Please check your {securitySettings.authType} and try again.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityLockScreen;
