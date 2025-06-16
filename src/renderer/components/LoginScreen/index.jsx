import React, { useState, useRef, useEffect } from 'react';
import styles from './LoginScreen.module.scss';
import { GoogleIcon, AppleIcon, MetaMaskIcon, WalletConnectIcon } from './icons';

const LoginScreen = ({ onComplete }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFieldClass, setEmailFieldClass] = useState(styles.input);
  const emailInputRef = useRef(null);
  const emailThreshold = 25; // Character threshold before expanding
  const [isAnimating, setIsAnimating] = useState(false);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSignUp) {
      // Here you would implement the signup logic
      console.log("Sign up with:", email, password);
      // Typically would involve creating a new account, then proceeding
      onComplete();
    } else {
      // Here you would implement the login logic
      console.log("Sign in with:", email, password);
      // For now, we'll just call onComplete to proceed
      onComplete();
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
  };

  return (
    <div className={styles.loginScreen}>
      <div className={styles.backgroundWrapper}>
        <div className={styles.brandingText}>Deep Journal</div>
        <div className={styles.formContainer}>
          <div className={styles.glassBox}>
            <div className={styles.loginHeader}>
              <h1>{isSignUp ? "Create an account" : "Welcome back"}</h1>
              <p>{isSignUp ? "Sign up to start your journaling journey" : "Sign in to continue your journaling journey"}</p>
            </div>

            <form onSubmit={handleSubmit}>
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

              {isSignUp && (
                <div className={styles.formGroup}>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Full name"
                    required
                  />
                </div>
              )}

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

              {isSignUp && (
                <div className={styles.formGroup}>
                  <input
                    type="password"
                    className={styles.input}
                    placeholder="Confirm password"
                    required
                  />
                </div>
              )}

              <button type="submit" className={styles.submitButton}>
                {isSignUp ? "Sign up" : "Sign in"}
              </button>
            </form>

            <div className={styles.separator}>
              <span className={styles.separatorText}>or continue with</span>
            </div>

            <div className={styles.socialButtonsContainer}>
              <button className={styles.socialButtonWide}>
                <span className={styles.socialIcon}>
                  <GoogleIcon />
                </span>
                Continue with Google
              </button>

              <button className={styles.socialButtonWide}>
                <span className={styles.socialIcon}>
                  <AppleIcon />
                </span>
                Continue with Apple
              </button>
            </div>

            <div className={styles.footer}>
              <div className={styles.accountLink}>
                {isSignUp ? "Already have an account?" : "Don't have an account?"}
                <a href="#" onClick={toggleMode}>{isSignUp ? " Sign in" : " Sign up"}</a>
              </div>
              <div className={styles.legalLinks}>
                <a href="#">Terms</a>
                <a href="#">Privacy</a>
              </div>
            </div>
          </div>

          <div className={styles.lookAroundContainer}>
            <button
              className={styles.lookAroundButton}
              onClick={onComplete}
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
