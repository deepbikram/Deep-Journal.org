import styles from './Settings.module.scss';
import { SettingsIcon, CrossIcon, PersonIcon, LogoutIcon, InfoIcon, ColorsIcon, DownloadIcon, AIIcon, RefreshIcon } from 'renderer/icons';
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
import UpdateStatusPanel from 'renderer/components/UpdateStatusPanel';

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
  const [activeSection, setActiveSection] = useState('profile');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    about: '',
    website: '',
    username: '',
    pronouns: []
  });

  const retrieveKey = async () => {
    const k = await getKey();
    setCurrentKey(k);
  };

  useEffect(() => {
    retrieveKey();
    if (user) {
      const fullName = user.user_metadata?.full_name || '';
      const nameParts = fullName.split(' ');
      setFormData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        about: 'Deep Journal enthusiast • Thoughtful reflection through AI-powered insights',
        website: '',
        username: user.email?.split('@')[0] || '',
        pronouns: []
      });
    }
  }, [user]);

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

  // Form data change handler
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddPronoun = (pronoun) => {
    if (formData.pronouns.length < 2 && !formData.pronouns.includes(pronoun)) {
      setFormData(prev => ({
        ...prev,
        pronouns: [...prev.pronouns, pronoun]
      }));
    }
  };

  const handleRemovePronoun = (pronoun) => {
    setFormData(prev => ({
      ...prev,
      pronouns: prev.pronouns.filter(p => p !== pronoun)
    }));
  };

  const handleSaveChanges = () => {
    if (!APIkey || APIkey == '') {
      deleteKey();
    } else {
      console.log('save key', APIkey);
      setKey(APIkey);
    }

    updateSettings(prompt);
    // Save form data here if needed
    console.log('Saving form data:', formData);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const result = await signOut();
      if (result.success) {
        console.log('Successfully logged out');
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

  const sidebarItems = [
    { id: 'profile', label: 'Edit profile', icon: PersonIcon },
    { id: 'account', label: 'Account management', icon: PersonIcon },
    { id: 'visibility', label: 'Profile visibility', icon: InfoIcon },
    { id: 'appearance', label: 'Tune your appearance', icon: ColorsIcon },
    { id: 'updates', label: 'App updates', icon: DownloadIcon },
    { id: 'ai', label: 'AI Configuration', icon: AIIcon },
    { id: 'security', label: 'Security', icon: LogoutIcon },
  ];

  const renderSidebar = () => (
    <div className={styles.sidebar}>
      {sidebarItems.map(item => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            className={`${styles.sidebarItem} ${activeSection === item.id ? styles.active : ''}`}
            onClick={() => setActiveSection(item.id)}
          >
            <Icon className={styles.sidebarIcon} />
            {item.label}
          </button>
        );
      })}
    </div>
  );

  const renderMainContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className={styles.mainContent}>
            <div className={styles.contentHeader}>
              <h1 className={styles.contentTitle}>Edit profile</h1>
              <p className={styles.contentSubtitle}>
                Keep your personal details private. Information you add here is visible to anyone who can view your profile.
              </p>
            </div>

            <div className={styles.formSection}>
              <div className={styles.photoSection}>
                <label className={styles.fieldLabel}>Photo</label>
                <div className={styles.photoContainer}>
                  <div className={styles.photoPreview}>
                    <PersonIcon className={styles.photoIcon} />
                  </div>
                  <button className={styles.changePhotoBtn}>Change</button>
                </div>
              </div>

              <div className={styles.nameFields}>
                <div className={styles.inputGroup}>
                  <label className={styles.fieldLabel}>First name</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.firstName}
                    onChange={(e) => handleFormChange('firstName', e.target.value)}
                    placeholder="First name"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.fieldLabel}>Last name</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.lastName}
                    onChange={(e) => handleFormChange('lastName', e.target.value)}
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.fieldLabel}>About</label>
                <textarea
                  className={styles.textarea}
                  value={formData.about}
                  onChange={(e) => handleFormChange('about', e.target.value)}
                  placeholder="Tell your story"
                  rows={3}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.fieldLabel}>Pronouns</label>
                <div className={styles.pronounsContainer}>
                  <div className={styles.pronounsList}>
                    {formData.pronouns.map((pronoun, index) => (
                      <div key={index} className={styles.pronounTag}>
                        {pronoun}
                        <button
                          className={styles.removePronoun}
                          onClick={() => handleRemovePronoun(pronoun)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {formData.pronouns.length < 2 && (
                      <select
                        className={styles.pronounSelect}
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddPronoun(e.target.value);
                            e.target.value = '';
                          }
                        }}
                      >
                        <option value="">Add pronoun</option>
                        <option value="he/him">he/him</option>
                        <option value="she/her">she/her</option>
                        <option value="they/them">they/them</option>
                        <option value="xe/xir">xe/xir</option>
                      </select>
                    )}
                  </div>
                  <p className={styles.pronounsHelp}>
                    Choose up to 2 sets of pronouns to appear on your profile so others know how to refer to you. You can edit or remove these any time.
                  </p>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.fieldLabel}>Website</label>
                <input
                  type="url"
                  className={styles.input}
                  value={formData.website}
                  onChange={(e) => handleFormChange('website', e.target.value)}
                  placeholder="https://"
                />
                <p className={styles.fieldHelp}>Add a link to drive traffic to your site</p>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.fieldLabel}>Username</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.username}
                  onChange={(e) => handleFormChange('username', e.target.value)}
                  placeholder="Username"
                />
                <p className={styles.fieldHelp}>www.deepjournal.app/{formData.username}</p>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className={styles.mainContent}>
            <div className={styles.contentHeader}>
              <h1 className={styles.contentTitle}>Tune your appearance</h1>
              <p className={styles.contentSubtitle}>
                Choose how Deep Journal looks to you. These settings only affect your experience.
              </p>
            </div>

            <div className={styles.formSection}>
              <div className={styles.inputGroup}>
                <label className={styles.fieldLabel}>Theme</label>
                <div className={styles.themeGrid}>
                  {renderThemes()}
                </div>
              </div>
            </div>
          </div>
        );

      case 'updates':
        return (
          <div className={styles.mainContent}>
            <div className={styles.contentHeader}>
              <h1 className={styles.contentTitle}>App updates</h1>
              <p className={styles.contentSubtitle}>
                Stay up to date with the latest features and improvements.
              </p>
            </div>

            <div className={styles.formSection}>
              <UpdateStatusPanel variant="settings" />
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className={styles.mainContent}>
            <div className={styles.contentHeader}>
              <h1 className={styles.contentTitle}>AI Configuration</h1>
              <p className={styles.contentSubtitle}>
                Configure your AI provider and customize how AI responds to your journal entries.
              </p>
            </div>

            <div className={styles.formSection}>
              <div className={styles.aiConfigSection}>
                <AISettingTabs APIkey={APIkey} setCurrentKey={setCurrentKey} />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.fieldLabel}>AI Personality</label>
                <textarea
                  className={styles.textarea}
                  placeholder="Enter your own prompt for AI reflections..."
                  value={prompt}
                  onChange={handleOnChangePrompt}
                  rows={6}
                />
                <p className={styles.fieldHelp}>
                  Customize how the AI analyzes and responds to your journal entries. Be specific about the tone, focus areas, and type of insights you'd like.
                </p>
              </div>
            </div>
          </div>
        );

      case 'account':
        return (
          <div className={styles.mainContent}>
            <div className={styles.contentHeader}>
              <h1 className={styles.contentTitle}>Account management</h1>
              <p className={styles.contentSubtitle}>
                Manage your account settings and preferences.
              </p>
            </div>

            <div className={styles.formSection}>
              {user && (
                <div className={styles.accountInfo}>
                  <div className={styles.accountDetail}>
                    <span className={styles.accountLabel}>Email</span>
                    <span className={styles.accountValue}>{user.email}</span>
                  </div>
                  <div className={styles.accountDetail}>
                    <span className={styles.accountLabel}>Account Type</span>
                    <span className={styles.accountValue}>Personal</span>
                  </div>
                  <div className={styles.accountDetail}>
                    <span className={styles.accountLabel}>Member since</span>
                    <span className={styles.accountValue}>
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}

              <div className={styles.dangerZone}>
                <h3 className={styles.dangerTitle}>Danger Zone</h3>
                <button
                  className={styles.logoutButton}
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <LogoutIcon className={styles.logoutIcon} />
                  {isLoggingOut ? 'Signing out...' : 'Sign out'}
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className={styles.mainContent}>
            <div className={styles.contentHeader}>
              <h1 className={styles.contentTitle}>Coming Soon</h1>
              <p className={styles.contentSubtitle}>
                This section is under development.
              </p>
            </div>
          </div>
        );
    }
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
          <Dialog.Close asChild>
            <button className={styles.closeButton} aria-label="Close">
              <CrossIcon />
            </button>
          </Dialog.Close>

          <div className={styles.settingsContainer}>
            {renderSidebar()}
            {renderMainContent()}
          </div>

          <div className={styles.footer}>
            <button className={styles.resetButton}>Reset</button>
            <Dialog.Close asChild>
              <button className={styles.saveButton} onClick={handleSaveChanges}>
                Save
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
