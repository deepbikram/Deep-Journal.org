import styles from './Settings.module.scss';
import { SettingsIcon, CrossIcon, OllamaIcon, LogoutIcon, PersonIcon } from 'renderer/icons';
import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useAIContext } from 'renderer/context/AIContext';
import {
  availableThemes,
  useDeepJournalsContext,
} from 'renderer/context/DeepJournalsContext';
import AISettingTabs from './AISettingsTabs';
import { useIndexContext } from 'renderer/context/IndexContext';
import { useAuth } from 'renderer/context/AuthContext';

export default function Settings() {
  const { regenerateEmbeddings } = useIndexContext();
  const {
    ai,
    prompt,
    setPrompt,
    updateSettings,
    setBaseUrl,
    getKey,
    setKey,
    deleteKey,
    model,
    setModel,
    ollama,
    baseUrl,
  } = useAIContext();
  const [APIkey, setCurrentKey] = useState('');
  const { currentTheme, setTheme } = useDeepJournalsContext();
  const { signOut, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const retrieveKey = async () => {
    const k = await getKey();
    setCurrentKey(k);
  };

  useEffect(() => {
    retrieveKey();
  }, []);

  const handleOnChangeBaseUrl = (e) => {
    setBaseUrl(e.target.value);
  };

  const handleOnChangeModel = (e) => {
    setModel(e.target.value);
  };

  const handleOnChangeKey = (e) => {
    setCurrentKey(e.target.value);
  };

  const handleOnChangePrompt = (e) => {
    const p = e.target.value ?? '';
    setPrompt(p);
  };

  const handleSaveChanges = () => {
    if (!APIkey || APIkey == '') {
      deleteKey();
    } else {
      console.log('save key', APIkey);
      setKey(APIkey);
    }

    updateSettings(prompt);
    // regenerateEmbeddings();
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const result = await signOut();
      if (result.success) {
        console.log('Successfully logged out');
        // The app will automatically redirect to login screen via AuthContext
      } else {
        console.error('Logout failed:', result.error);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const renderThemes = () => {
    return Object.keys(availableThemes).map((theme, index) => {
      const colors = availableThemes[theme];
      return (
        <button
          key={`theme-${theme}`}
          className={`${styles.theme} ${
            currentTheme == theme && styles.current
          }`}
          onClick={() => {
            setTheme(theme);
          }}
        >
          <div
            className={styles.color1}
            style={{ background: colors.primary }}
          ></div>
        </button>
      );
    });
  };
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <div className={styles.iconHolder}>
          <SettingsIcon className={styles.settingsIcon} />
        </div>
      </Dialog.Trigger>
      <Dialog.Portal container={document.getElementById('dialog')}>
        <Dialog.Overlay className={styles.DialogOverlay} />
        <Dialog.Content className={styles.DialogContent}>
          <Dialog.Title className={styles.DialogTitle}>Settings</Dialog.Title>

          {/* Account Section */}
          {user && (
            <fieldset className={styles.Fieldset}>
              <label className={styles.Label} htmlFor="account">
                Account
              </label>
              <div className={styles.accountSection}>
                <div className={styles.userInfo}>
                  <div className={styles.userAvatar}>
                    <PersonIcon className={styles.avatarIcon} />
                  </div>
                  <div className={styles.userDetails}>
                    <div className={styles.userEmail}>{user.email}</div>
                    <div className={styles.userMeta}>
                      {user.user_metadata?.full_name && (
                        <span className={styles.userName}>{user.user_metadata.full_name}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  className={styles.logoutButton}
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <LogoutIcon className={styles.logoutIcon} />
                  {isLoggingOut ? 'Signing out...' : 'Sign out'}
                </button>
              </div>
            </fieldset>
          )}

          <fieldset className={styles.Fieldset}>
            <label className={styles.Label} htmlFor="name">
              Appearance
            </label>
            <div className={styles.themes}>{renderThemes()}</div>
          </fieldset>

          <fieldset className={styles.Fieldset}>
            <label className={styles.Label} htmlFor="name">
              Select your AI provider
            </label>
            <AISettingTabs APIkey={APIkey} setCurrentKey={setCurrentKey} />
          </fieldset>

          <fieldset className={styles.Fieldset}>
            <label className={styles.Label} htmlFor="name">
              AI personality prompt
            </label>
            <textarea
              className={styles.Textarea}
              placeholder="Enter your own prompt for AI reflections"
              value={prompt}
              onChange={handleOnChangePrompt}
            />
          </fieldset>
          <div
            style={{
              display: 'flex',
              marginTop: 25,
              justifyContent: 'flex-end',
            }}
          >
            <Dialog.Close asChild>
              <button className={styles.Button} onClick={handleSaveChanges}>
                Save changes
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Close asChild>
            <button className={styles.IconButton} aria-label="Close">
              <CrossIcon />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
