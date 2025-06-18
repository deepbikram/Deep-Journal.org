import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * AuthTest Component - For testing authentication flows
 * This component can be temporarily added to test all auth functions
 */
const AuthTest = () => {
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('testpassword123');
  const [message, setMessage] = useState('');

  const {
    user,
    loading,
    isAuthenticated,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
    signOut,
    resetPassword
  } = useAuth();

  const testSignUp = async () => {
    setMessage('Testing sign up...');
    const result = await signUpWithEmail(testEmail, testPassword, {
      data: { full_name: 'Test User' }
    });
    setMessage(result.success ? 'Sign up successful!' : `Sign up failed: ${result.error}`);
  };

  const testSignIn = async () => {
    setMessage('Testing sign in...');
    const result = await signInWithEmail(testEmail, testPassword);
    setMessage(result.success ? 'Sign in successful!' : `Sign in failed: ${result.error}`);
  };

  const testGoogleOAuth = async () => {
    setMessage('Testing Google OAuth...');
    const result = await signInWithGoogle();
    setMessage(result.success ? 'Google OAuth initiated!' : `Google OAuth failed: ${result.error}`);
  };

  const testAppleOAuth = async () => {
    setMessage('Testing Apple OAuth...');
    const result = await signInWithApple();
    setMessage(result.success ? 'Apple OAuth initiated!' : `Apple OAuth failed: ${result.error}`);
  };

  const testSignOut = async () => {
    setMessage('Testing sign out...');
    const result = await signOut();
    setMessage(result.success ? 'Sign out successful!' : `Sign out failed: ${result.error}`);
  };

  const testForgotPassword = async () => {
    setMessage('Testing forgot password...');
    const result = await resetPassword(testEmail);
    setMessage(result.success ? 'Password reset email sent!' : `Password reset failed: ${result.error}`);
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading auth...</div>;
  }

  return (
    <div style={{
      padding: '20px',
      border: '1px solid #ccc',
      margin: '20px',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>Authentication Test Panel</h3>

      <div style={{ marginBottom: '15px' }}>
        <strong>Status:</strong> {isAuthenticated ? 'Authenticated' : 'Not authenticated'}<br/>
        <strong>User:</strong> {user ? user.email : 'None'}<br/>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <input
          type="email"
          placeholder="Test email"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <input
          type="password"
          placeholder="Test password"
          value={testPassword}
          onChange={(e) => setTestPassword(e.target.value)}
          style={{ padding: '5px' }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <button onClick={testSignUp} style={{ marginRight: '10px', padding: '8px 12px' }}>
          Test Sign Up
        </button>
        <button onClick={testSignIn} style={{ marginRight: '10px', padding: '8px 12px' }}>
          Test Sign In
        </button>
        <button onClick={testForgotPassword} style={{ marginRight: '10px', padding: '8px 12px' }}>
          Test Forgot Password
        </button>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <button onClick={testGoogleOAuth} style={{ marginRight: '10px', padding: '8px 12px' }}>
          Test Google OAuth
        </button>
        <button onClick={testAppleOAuth} style={{ marginRight: '10px', padding: '8px 12px' }}>
          Test Apple OAuth
        </button>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <button onClick={testSignOut} style={{ padding: '8px 12px', backgroundColor: '#ff4444', color: 'white' }}>
          Test Sign Out
        </button>
      </div>

      {message && (
        <div style={{
          padding: '10px',
          backgroundColor: '#e7f3ff',
          border: '1px solid #b3d9ff',
          borderRadius: '4px',
          marginTop: '15px'
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default AuthTest;
