import { ipcMain } from 'electron';
import { getSecuritySettings, setSecuritySettings, verifyPin, verifyPassword, enableBiometric, verifyBiometric, isSessionValid, verifySecurityAnswers, resetAuthWithSecurityQuestions } from '../utils/store';

// Get security settings
ipcMain.handle('get-security-settings', async () => {
  return getSecuritySettings();
});

// Set security settings (PIN, password, biometric)
ipcMain.handle('set-security-settings', async (_, settings) => {
  return setSecuritySettings(settings);
});

// Verify PIN
ipcMain.handle('verify-pin', async (_, pin) => {
  return verifyPin(pin);
});

// Verify password
ipcMain.handle('verify-password', async (_, password) => {
  return verifyPassword(password);
});

// Enable biometric authentication
ipcMain.handle('enable-biometric', async (_, type) => {
  return enableBiometric(type);
});

// Verify biometric authentication
ipcMain.handle('verify-biometric', async (_, type) => {
  return verifyBiometric(type);
});

// Check if current session is valid
ipcMain.handle('is-session-valid', async () => {
  return isSessionValid();
});

// Verify security questions answers
ipcMain.handle('verify-security-answers', async (_, answer1, answer2) => {
  return verifySecurityAnswers(answer1, answer2);
});

// Reset PIN/password using security questions
ipcMain.handle('reset-auth-with-security', async (_, newPin, newPassword) => {
  return resetAuthWithSecurityQuestions(newPin, newPassword);
});

// Check if biometric is available
ipcMain.handle('check-biometric-availability', async () => {
  // Check if platform supports biometric authentication
  const platform = process.platform;

  if (platform === 'darwin') {
    // macOS - check for biometric authentication (Touch ID, Face ID, etc.)
    try {
      const { systemPreferences } = require('electron');
      const canPromptTouchID = systemPreferences && systemPreferences.canPromptTouchID();

      if (canPromptTouchID) {
        // On macOS, we use a single 'biometric' type since the system handles the specific method
        // The actual method (Touch ID, Face ID, Apple Watch, etc.) is determined by the system
        return {
          available: true,
          types: ['biometric'], // Unified biometric type for macOS
          platform: 'darwin',
          note: 'Uses system biometric authentication (Touch ID, Face ID, or Apple Watch)'
        };
      } else {
        return {
          available: false,
          types: [],
          platform: 'darwin'
        };
      }
    } catch (error) {
      return { available: false, types: [], platform: 'darwin', error: error instanceof Error ? error.message : String(error) };
    }
  } else if (platform === 'win32') {
    // Windows - check for Windows Hello
    try {
      // This would require additional native modules for Windows Hello
      // For now, we'll return basic capability check
      return {
        available: false, // Will be implemented with native modules
        types: ['face', 'fingerprint'],
        platform: 'win32',
        note: 'Windows Hello support requires additional native modules'
      };
    } catch (error) {
      return { available: false, types: [], platform: 'win32', error: error instanceof Error ? error.message : String(error) };
    }
  } else {
    // Other platforms
    return { available: false, types: [], platform };
  }
});
