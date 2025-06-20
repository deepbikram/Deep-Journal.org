import settings from 'electron-settings';
import { safeStorage } from 'electron';

// Check if encryption is available, fallback to plain text storage if not
const ENCRYPTION_AVAILABLE = safeStorage.isEncryptionAvailable();

if (!ENCRYPTION_AVAILABLE) {
  console.warn('Encryption is not available on this system. Using fallback storage (less secure).');
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
