import React, { useState, useRef, useEffect } from 'react';
import styles from './LoginScreen.module.scss';
import { GoogleIcon, AppleIcon, MetaMaskIcon, WalletConnectIcon } from './icons';
import { useAuth } from '../../context/AuthContext';

const LoginScreen = ({ onComplete = () => {} }) => {
  const handleComplete = () => {
    if (onComplete && typeof onComplete === 'function') {
      onComplete();
    }
  };

  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [emailFieldClass, setEmailFieldClass] = useState(styles.input);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const emailInputRef = useRef(null);
  const emailThreshold = 25; // Character threshold before expanding
  const [isAnimating, setIsAnimating] = useState(false);

  // Get auth methods from context
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
    resetPassword,
    loading: authLoading
  } = useAuth();

  useEffect(() => {
    // Check if email exceeds threshold and apply appropriate class
    if (email.length > emailThreshold && !emailFieldClass.includes(styles.expanding) && !isAnimating) {
      setEmailFieldClass(`${styles.input} ${styles.expanding}`);
      setIsAnimating(true);

      // After animation completes, reset animation flag
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 500); // Match the animation duration

      return () => clearTimeout(timer);
    } else if (email.length <= emailThreshold && emailFieldClass.includes(styles.expanding) && !isAnimating) {
      setEmailFieldClass(`${styles.input} ${styles.contracting}`);
      setIsAnimating(true);

      // After animation completes, reset to normal
      const timer = setTimeout(() => {
        setEmailFieldClass(styles.input);
        setIsAnimating(false);
      }, 500); // Match the animation duration

      return () => clearTimeout(timer);
    }
  }, [email, emailFieldClass, isAnimating]);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    try {
      const result = await resetPassword(email);

      if (result.success) {
        setSuccess('Password reset email sent! Please check your inbox.');
        setTimeout(() => {
          setIsForgotPassword(false);
          setSuccess('');
        }, 3000);
      } else {
        setError(result.error || 'Failed to send password reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Validate passwords match
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }

        // Sign up with email and password
        const result = await signUpWithEmail(email, password, {
          data: {
            full_name: fullName,
          }
        });

        if (result.success) {
          setSuccess('Account created successfully! Please check your email for verification.');
          // Note: User might need to verify email before they can sign in
          setTimeout(() => {
            handleComplete();
          }, 2000);
        } else {
          setError(result.error || 'Sign up failed');
        }
      } else {
        // Sign in with email and password
        const result = await signInWithEmail(email, password);

        if (result.success) {
          setSuccess('Sign in successful!');
          handleComplete();
        } else {
          setError(result.error || 'Sign in failed');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await signInWithGoogle();

      if (result.success) {
        setSuccess(result.message || 'Google sign in initiated. Please complete in your browser.');
        // onComplete will be called automatically when auth state changes
      } else {
        setError(result.error || 'Google sign in failed');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      setError('Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await signInWithApple();

      if (result.success) {
        setSuccess(result.message || 'Apple sign in initiated. Please complete in your browser.');
        // onComplete will be called automatically when auth state changes
      } else {
        setError(result.error || 'Apple sign in failed');
      }
    } catch (error) {
      console.error('Apple auth error:', error);
      setError('Apple sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setIsForgotPassword(false);
    setError('');
    setSuccess('');
  };

  const toggleForgotPassword = () => {
    setIsForgotPassword(!isForgotPassword);
    setIsSignUp(false);
    setError('');
    setSuccess('');
  };

  return (
    <div className={styles.loginScreen}>
      <div className={styles.backgroundWrapper}>
        <div className={styles.brandingText}>Deep Journal</div>
        <div className={styles.formContainer}>
          <div className={styles.glassBox}>
            <div className={styles.loginHeader}>
              <h1>
                {isForgotPassword
                  ? "Reset your password"
                  : isSignUp
                    ? "Create an account"
                    : "Welcome back"
                }
              </h1>
              <p>
                {isForgotPassword
                  ? "Enter your email address and we'll send you a link to reset your password"
                  : isSignUp
                    ? "Sign up to start your journaling journey"
                    : "Sign in to continue your journaling journey"
                }
              </p>
            </div>

            <form onSubmit={isForgotPassword ? handleForgotPassword : handleSubmit}>
              {/* Error Message */}
              {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className={styles.successMessage}>
                  {success}
                </div>
              )}

              <div className={styles.formGroup}>
                <input
                  type="email"
                  className={emailFieldClass}
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  ref={emailInputRef}
                />
              </div>

              {isSignUp && !isForgotPassword && (
                <div className={styles.formGroup}>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              )}

              {!isForgotPassword && (
                <div className={styles.formGroup}>
                  <input
                    type="password"
                    className={styles.input}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              {isSignUp && !isForgotPassword && (
                <div className={styles.formGroup}>
                  <input
                    type="password"
                    className={styles.input}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading || authLoading}
              >
                {loading || authLoading ? 'Loading...' : (
                  isForgotPassword
                    ? "Send reset link"
                    : isSignUp
                      ? "Sign up"
                      : "Sign in"
                )}
              </button>
            </form>

            {!isForgotPassword && (
              <>
                <div className={styles.separator}>
                  <span className={styles.separatorText}>or continue with</span>
                </div>

                <div className={styles.socialButtonsContainer}>
                  <button
                    className={styles.socialButtonWide}
                    onClick={handleGoogleSignIn}
                    disabled={loading || authLoading}
                    type="button"
                  >
                    <span className={styles.socialIcon}>
                      <GoogleIcon />
                    </span>
                    Continue with Google
                  </button>

                  <button
                    className={styles.socialButtonWide}
                    onClick={handleAppleSignIn}
                    disabled={loading || authLoading}
                    type="button"
                  >
                    <span className={styles.socialIcon}>
                      <AppleIcon />
                    </span>
                    Continue with Apple
                  </button>
                </div>
              </>
            )}

            <div className={styles.footer}>
              <div className={styles.accountLink}>
                {isForgotPassword ? (
                  <>
                    Remember your password?
                    <a href="#" onClick={toggleForgotPassword}> Sign in</a>
                  </>
                ) : isSignUp ? (
                  <>
                    Already have an account?
                    <a href="#" onClick={toggleMode}> Sign in</a>
                  </>
                ) : (
                  <>
                    Don't have an account?
                    <a href="#" onClick={toggleMode}> Sign up</a>
                  </>
                )}
              </div>

              {!isForgotPassword && !isSignUp && (
                <div className={styles.forgotLink}>
                  <a href="#" onClick={toggleForgotPassword}>Forgot your password?</a>
                </div>
              )}

              <div className={styles.legalLinks}>
                <a href="#">Terms</a>
                <a href="#">Privacy</a>
              </div>
            </div>
          </div>

          <div className={styles.lookAroundContainer}>
            <button
              className={styles.lookAroundButton}
              onClick={handleComplete}
            >
              Let me take a look around
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
