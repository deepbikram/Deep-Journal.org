import React, { useState } from 'react';
import { useSecurity } from '../../context/SecurityContext';
import styles from './PasswordRecovery.module.scss';

const PasswordRecovery = ({ onBack, onSuccess }) => {
  const { securitySettings, verifySecurityAnswers, resetAuthWithSecurity } = useSecurity();
  const [step, setStep] = useState('questions'); // 'questions' or 'reset'
  const [answers, setAnswers] = useState({ answer1: '', answer2: '' });
  const [newAuth, setNewAuth] = useState({ pin: '', password: '', confirmPin: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    if (!answers.answer1.trim() || !answers.answer2.trim()) {
      setError('Please answer both security questions');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await verifySecurityAnswers(answers.answer1.trim(), answers.answer2.trim());
      if (result.success) {
        setStep('reset');
      } else {
        setError(result.error || 'Security answers are incorrect');
      }
    } catch (error) {
      setError('Failed to verify security answers');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (securitySettings.authType === 'pin') {
      if (!newAuth.pin || newAuth.pin.length < 4) {
        setError('PIN must be at least 4 digits');
        return;
      }
      if (newAuth.pin !== newAuth.confirmPin) {
        setError('PINs do not match');
        return;
      }
    } else if (securitySettings.authType === 'password') {
      if (!newAuth.password || newAuth.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (newAuth.password !== newAuth.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setLoading(true);

    try {
      const resetPin = securitySettings.authType === 'pin' ? newAuth.pin : null;
      const resetPassword = securitySettings.authType === 'password' ? newAuth.password : null;

      const result = await resetAuthWithSecurity(resetPin, resetPassword);
      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Failed to reset authentication');
      }
    } catch (error) {
      setError('Failed to reset authentication');
    } finally {
      setLoading(false);
    }
  };

  if (!securitySettings?.securityQuestions) {
    return (
      <div className={styles.recoveryContainer}>
        <div className={styles.recoveryCard}>
          <h2 className={styles.title}>Recovery Not Available</h2>
          <p className={styles.message}>
            No security questions have been set up for account recovery.
          </p>
          <button onClick={onBack} className={styles.backButton}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.recoveryContainer}>
      <div className={styles.recoveryCard}>
        {step === 'questions' && (
          <>
            <h2 className={styles.title}>Account Recovery</h2>
            <p className={styles.subtitle}>
              Please answer your security questions to reset your {securitySettings.authType === 'pin' ? 'PIN' : 'password'}
            </p>

            <form onSubmit={handleAnswerSubmit} className={styles.form}>
              <div className={styles.questionGroup}>
                <label className={styles.questionLabel}>
                  {securitySettings.securityQuestions.question1}
                </label>
                <input
                  type="text"
                  value={answers.answer1}
                  onChange={(e) => setAnswers({ ...answers, answer1: e.target.value })}
                  className={styles.answerInput}
                  placeholder="Enter your answer"
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div className={styles.questionGroup}>
                <label className={styles.questionLabel}>
                  {securitySettings.securityQuestions.question2}
                </label>
                <input
                  type="text"
                  value={answers.answer2}
                  onChange={(e) => setAnswers({ ...answers, answer2: e.target.value })}
                  className={styles.answerInput}
                  placeholder="Enter your answer"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}

              <div className={styles.buttonGroup}>
                <button type="button" onClick={onBack} className={styles.backButton} disabled={loading}>
                  Back
                </button>
                <button type="submit" className={styles.submitButton} disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify Answers'}
                </button>
              </div>
            </form>
          </>
        )}

        {step === 'reset' && (
          <>
            <h2 className={styles.title}>Reset {securitySettings.authType === 'pin' ? 'PIN' : 'Password'}</h2>
            <p className={styles.subtitle}>
              Enter your new {securitySettings.authType === 'pin' ? 'PIN' : 'password'}
            </p>

            <form onSubmit={handleResetSubmit} className={styles.form}>
              {securitySettings.authType === 'pin' ? (
                <>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>New PIN</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={newAuth.pin}
                      onChange={(e) => setNewAuth({ ...newAuth, pin: e.target.value.replace(/\D/g, '') })}
                      className={styles.authInput}
                      placeholder="Enter new PIN"
                      maxLength="6"
                      disabled={loading}
                      autoFocus
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Confirm PIN</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={newAuth.confirmPin}
                      onChange={(e) => setNewAuth({ ...newAuth, confirmPin: e.target.value.replace(/\D/g, '') })}
                      className={styles.authInput}
                      placeholder="Confirm new PIN"
                      maxLength="6"
                      disabled={loading}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>New Password</label>
                    <input
                      type="password"
                      value={newAuth.password}
                      onChange={(e) => setNewAuth({ ...newAuth, password: e.target.value })}
                      className={styles.authInput}
                      placeholder="Enter new password"
                      disabled={loading}
                      autoFocus
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Confirm Password</label>
                    <input
                      type="password"
                      value={newAuth.confirmPassword}
                      onChange={(e) => setNewAuth({ ...newAuth, confirmPassword: e.target.value })}
                      className={styles.authInput}
                      placeholder="Confirm new password"
                      disabled={loading}
                    />
                  </div>
                </>
              )}

              {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}

              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={() => setStep('questions')}
                  className={styles.backButton}
                  disabled={loading}
                >
                  Back
                </button>
                <button type="submit" className={styles.submitButton} disabled={loading}>
                  {loading ? 'Resetting...' : `Reset ${securitySettings.authType === 'pin' ? 'PIN' : 'Password'}`}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default PasswordRecovery;
