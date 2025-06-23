import settings from 'electron-settings';
import { safeStorage } from 'electron';
import * as crypto from 'crypto';

// Check if encryption is available, fallback to plain text storage if not
const ENCRYPTION_AVAILABLE = safeStorage.isEncryptionAvailable();

if (!ENCRYPTION_AVAILABLE) {
  console.warn('Encryption is not available on this system. Using fallback storage (less secure).');
}

// Security Settings Functions

interface SecuritySettings {
  enabled: boolean;
  authType: 'pin' | 'password' | null;
  pinHash?: string;
  pinLength?: number; // Store PIN length for UI purposes
  passwordHash?: string;
  biometricEnabled: boolean;
  biometricType?: 'fingerprint' | 'face' | 'touchid' | 'faceid' | 'biometric' | null;
  lastAuthTime?: number;
  sessionTimeout: number; // in minutes
  // Security questions for password recovery
  securityQuestions?: {
    question1: string;
    answer1Hash: string;
    question2: string;
    answer2Hash: string;
  };
}

// Hash function for PIN/password
function hashCredential(credential: string): string {
  const salt = 'deep_journal_security_salt_2024';
  return crypto.pbkdf2Sync(credential, salt, 10000, 64, 'sha512').toString('hex');
}

export async function getSecuritySettings(): Promise<SecuritySettings | null> {
  try {
    let securityData: any = null;

    if (ENCRYPTION_AVAILABLE) {
      const encryptedData = await settings.get('securitySettings') as string | null;
      if (encryptedData) {
        try {
          const decryptedData = safeStorage.decryptString(Buffer.from(encryptedData, 'base64'));
          securityData = JSON.parse(decryptedData);
        } catch (decryptError) {
          console.warn('Failed to decrypt security settings, falling back to plain text:', decryptError);
          securityData = await settings.get('securitySettingsPlain') as SecuritySettings | null;
        }
      }
    } else {
      securityData = await settings.get('securitySettingsPlain') as SecuritySettings | null;
    }

    if (!securityData) {
      return {
        enabled: false,
        authType: null,
        biometricEnabled: false,
        sessionTimeout: 30 // default 30 minutes
      };
    }

    return securityData;
  } catch (error) {
    console.error('Error getting security settings:', error);
    return {
      enabled: false,
      authType: null,
      biometricEnabled: false,
      sessionTimeout: 30
    };
  }
}

export async function setSecuritySettings(securitySettings: Partial<SecuritySettings>): Promise<boolean> {
  try {
    const currentSettings = await getSecuritySettings() || {
      enabled: false,
      authType: null,
      biometricEnabled: false,
      sessionTimeout: 30
    };

    // Create a copy of the new settings
    const newSettings = { ...securitySettings };

    // Hash PIN or password if provided (they come unhashed from the frontend)
    if (newSettings.authType === 'pin' && 'pinHash' in newSettings && newSettings.pinHash) {
      // Store the PIN length before hashing (only if not already set)
      if (!newSettings.pinLength) {
        newSettings.pinLength = newSettings.pinHash.length;
      }
      newSettings.pinHash = hashCredential(newSettings.pinHash);
    }

    if (newSettings.authType === 'password' && 'passwordHash' in newSettings && newSettings.passwordHash) {
      newSettings.passwordHash = hashCredential(newSettings.passwordHash);
    }

    // Hash security question answers if provided
    if (newSettings.securityQuestions) {
      newSettings.securityQuestions = {
        question1: newSettings.securityQuestions.question1,
        answer1Hash: hashCredential(newSettings.securityQuestions.answer1Hash.toLowerCase().trim()),
        question2: newSettings.securityQuestions.question2,
        answer2Hash: hashCredential(newSettings.securityQuestions.answer2Hash.toLowerCase().trim())
      };
    }

    const updatedSettings = {
      ...currentSettings,
      ...newSettings,
      lastAuthTime: Date.now()
    };

    if (ENCRYPTION_AVAILABLE) {
      const encryptedSettings = safeStorage.encryptString(JSON.stringify(updatedSettings));
      await settings.set('securitySettings', encryptedSettings.toString('base64'));
      // Clear plain text version
      await settings.unset('securitySettingsPlain');
    } else {
      await settings.set('securitySettingsPlain', updatedSettings);
      // Clear encrypted version
      await settings.unset('securitySettings');
    }

    return true;
  } catch (error) {
    console.error('Error setting security settings:', error);
    return false;
  }
}

export async function verifyPin(pin: string): Promise<boolean> {
  try {
    const securitySettings = await getSecuritySettings();

    if (!securitySettings || !securitySettings.enabled || securitySettings.authType !== 'pin') {
      return false;
    }

    const hashedPin = hashCredential(pin);
    const isValid = hashedPin === securitySettings.pinHash;

    if (isValid) {
      // Update last auth time
      await setSecuritySettings({ lastAuthTime: Date.now() });
    }

    return isValid;
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return false;
  }
}

export async function verifyPassword(password: string): Promise<boolean> {
  try {
    const securitySettings = await getSecuritySettings();

    if (!securitySettings || !securitySettings.enabled || securitySettings.authType !== 'password') {
      return false;
    }

    const hashedPassword = hashCredential(password);
    const isValid = hashedPassword === securitySettings.passwordHash;

    if (isValid) {
      // Update last auth time
      await setSecuritySettings({ lastAuthTime: Date.now() });
    }

    return isValid;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

export async function enableBiometric(type: 'fingerprint' | 'face' | 'touchid' | 'faceid' | 'biometric'): Promise<boolean> {
  try {
    const securitySettings = await getSecuritySettings();

    if (!securitySettings) {
      return false;
    }

    await setSecuritySettings({
      biometricEnabled: true,
      biometricType: type
    });

    return true;
  } catch (error) {
    console.error('Error enabling biometric:', error);
    return false;
  }
}

export async function verifyBiometric(type: 'fingerprint' | 'face' | 'touchid' | 'faceid' | 'biometric'): Promise<boolean> {
  try {
    const securitySettings = await getSecuritySettings();

    if (!securitySettings || !securitySettings.biometricEnabled || securitySettings.biometricType !== type) {
      return false;
    }

    // For macOS biometric authentication (Touch ID, Face ID, Apple Watch, etc.)
    if (process.platform === 'darwin' && (type === 'touchid' || type === 'faceid' || type === 'biometric')) {
      try {
        const { systemPreferences } = require('electron');
        if (systemPreferences && systemPreferences.promptTouchID) {
          // Use a more generic message since the system will show the appropriate method
          await systemPreferences.promptTouchID('Authenticate to access Deep Journal');

          // Update last auth time
          await setSecuritySettings({ lastAuthTime: Date.now() });
          return true;
        }
      } catch (touchIdError) {
        console.error('Biometric authentication failed:', touchIdError);
        return false;
      }
    }

    // For other platforms, this would require additional native modules
    // For now, return false as not implemented
    return false;
  } catch (error) {
    console.error('Error verifying biometric:', error);
    return false;
  }
}

export async function isSessionValid(): Promise<boolean> {
  try {
    const securitySettings = await getSecuritySettings();

    if (!securitySettings || !securitySettings.enabled || !securitySettings.lastAuthTime) {
      return false;
    }

    const now = Date.now();
    const sessionTimeoutMs = securitySettings.sessionTimeout * 60 * 1000; // convert to milliseconds
    const timeSinceAuth = now - securitySettings.lastAuthTime;

    return timeSinceAuth < sessionTimeoutMs;
  } catch (error) {
    console.error('Error checking session validity:', error);
    return false;
  }
}

export async function getKey(): Promise<string | null> {
  try {
    if (ENCRYPTION_AVAILABLE) {
      const encryptedKey = await settings.get('aiKey');
      if (!encryptedKey || typeof encryptedKey !== 'string') return null;
      return safeStorage.decryptString(Buffer.from(encryptedKey, 'base64'));
    } else {
      // Fallback: store as plain text (less secure but functional)
      const plainKey = await settings.get('aiKeyPlain');
      return typeof plainKey === 'string' ? plainKey : null;
    }
  } catch (error) {
    console.error('Error retrieving AI key:', error);
    return null;
  }
}

export async function setKey(secretKey: string): Promise<boolean> {
  try {
    if (ENCRYPTION_AVAILABLE) {
      const encryptedKey = safeStorage.encryptString(secretKey);
      await settings.set('aiKey', encryptedKey.toString('base64'));
      // Clear any plain text key
      await settings.unset('aiKeyPlain');
    } else {
      // Fallback: store as plain text (less secure but functional)
      await settings.set('aiKeyPlain', secretKey);
      // Clear any encrypted key
      await settings.unset('aiKey');
    }
    return true;
  } catch (error) {
    console.error('Error setting AI key:', error);
    return false;
  }
}

export async function deleteKey(): Promise<boolean> {
  try {
    if (ENCRYPTION_AVAILABLE) {
      await settings.unset('aiKey');
    } else {
      await settings.unset('aiKeyPlain');
    }
    return true;
  } catch (error) {
    console.error('Error deleting AI key:', error);
    return false;
  }
}

// Security Questions Functions
export async function verifySecurityAnswers(answer1: string, answer2: string): Promise<boolean> {
  try {
    const securitySettings = await getSecuritySettings();

    if (!securitySettings || !securitySettings.securityQuestions) {
      return false;
    }

    const hashedAnswer1 = hashCredential(answer1.toLowerCase().trim());
    const hashedAnswer2 = hashCredential(answer2.toLowerCase().trim());

    return hashedAnswer1 === securitySettings.securityQuestions.answer1Hash &&
           hashedAnswer2 === securitySettings.securityQuestions.answer2Hash;
  } catch (error) {
    console.error('Error verifying security answers:', error);
    return false;
  }
}

export async function resetAuthWithSecurityQuestions(newPin?: string, newPassword?: string): Promise<boolean> {
  try {
    const securitySettings = await getSecuritySettings();

    if (!securitySettings) {
      return false;
    }

    const updates: Partial<SecuritySettings> = {
      lastAuthTime: Date.now()
    };

    if (newPin && securitySettings.authType === 'pin') {
      updates.pinHash = newPin; // Will be hashed in setSecuritySettings
      updates.pinLength = newPin.length; // Store the new PIN length
    } else if (newPassword && securitySettings.authType === 'password') {
      updates.passwordHash = newPassword; // Will be hashed in setSecuritySettings
    } else {
      return false;
    }

    return await setSecuritySettings(updates);
  } catch (error) {
    console.error('Error resetting auth with security questions:', error);
    return false;
  }
}
