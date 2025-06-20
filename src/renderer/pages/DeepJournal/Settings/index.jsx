import styles from './Settings.module.scss';
import {
  SettingsIcon,
  CrossIcon,
  PersonIcon,
  LogoutIcon,
  InfoIcon,
  ColorsIcon,
  DownloadIcon,
  AIIcon,
  RefreshIcon,
  ShieldIcon,
  BellIcon,
  KeyIcon,
  EyeIcon,
  DatabaseIcon,
  HelpIcon
} from 'renderer/icons';
import { useEffect, useState, useRef, useCallback } from 'react';
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

  // Enhanced state management
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isDragOver, setIsDragOver] = useState(false);
  const autoSaveTimeoutRef = useRef(null);

  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    about: '',
    website: '',
    username: '',
    pronouns: [],
    avatar: null
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Auto-save toast notification state
  const [showAutoSaveToast, setShowAutoSaveToast] = useState(false);

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
        pronouns: [],
        avatar: null
      });
    }

    // Load auto-update preference
    const loadAutoUpdatePreference = async () => {
      try {
        if (window.electron?.getAutoUpdatePreference) {
          const result = await window.electron.getAutoUpdatePreference();
          if (result.success) {
            setAutoUpdateEnabled(result.enabled);
          }
        }
      } catch (error) {
        console.warn('Could not load auto-update preference:', error);
      }
    };

    loadAutoUpdatePreference();
  }, [user]);

  // Cleanup avatar preview URL on unmount
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

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

  // Enhanced form validation
  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.firstName?.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName?.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (formData.website && !isValidUrl(formData.website)) {
      errors.website = 'Please enter a valid URL';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // URL validation helper
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Auto-save functionality - we'll use a ref to avoid circular dependencies
  const handleSaveRef = useRef(null);

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (hasUnsavedChanges && validateForm() && handleSaveRef.current) {
        const success = await handleSaveRef.current(true); // Auto-save flag
        if (success) {
          // Show auto-save toast
          setShowAutoSaveToast(true);
          setTimeout(() => setShowAutoSaveToast(false), 2000);
        }
      }
    }, 2000); // Auto-save after 2 seconds of inactivity
  }, [hasUnsavedChanges, validateForm]);

  // Enhanced form data change handler
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);

    // Clear specific field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }

    triggerAutoSave();
  };

  // Enhanced avatar validation
  const validateImage = (file) => {
    const errors = [];

    if (!file.type.startsWith('image/')) {
      errors.push('Please select an image file');
    }

    if (file.size > 5 * 1024 * 1024) {
      errors.push('File size must be less than 5MB');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      errors.push('Only JPEG, PNG, WebP, and GIF files are supported');
    }

    return errors;
  };

  // Enhanced avatar change handler with drag-and-drop support
  const handleAvatarChange = (file) => {
    if (!file) return;

    const validationErrors = validateImage(file);
    if (validationErrors.length > 0) {
      setFormErrors(prev => ({
        ...prev,
        avatar: validationErrors[0]
      }));
      return;
    }

    // Clear any previous avatar errors
    setFormErrors(prev => ({
      ...prev,
      avatar: undefined
    }));

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    // Update form data
    setFormData(prev => ({
      ...prev,
      avatar: file
    }));

    setHasUnsavedChanges(true);
    triggerAutoSave();
  };

  // Handle file input change
  const handleAvatarInputChange = (event) => {
    const file = event.target.files[0];
    handleAvatarChange(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      handleAvatarChange(imageFile);
    }
  };

  // Trigger file input
  const handleChangePhotoClick = () => {
    fileInputRef.current?.click();
  };

  // Remove avatar
  const handleRemoveAvatar = () => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
    setFormData(prev => ({
      ...prev,
      avatar: null
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

  // Load saved settings from localStorage
  const loadSavedSettings = useCallback(() => {
    try {
      const savedSettings = localStorage.getItem('deepJournalSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        console.log('Loading saved settings:', settings);

        // Merge saved settings with form data
        setFormData(prev => ({
          ...prev,
          ...settings.profile,
          ...settings.preferences,
        }));

        console.log('Settings loaded successfully');
      }
    } catch (error) {
      console.error('Error loading saved settings:', error);
    }
  }, []);

  // Load saved avatar from localStorage
  const loadSavedAvatar = useCallback(() => {
    try {
      const savedAvatar = localStorage.getItem('userAvatar');
      if (savedAvatar) {
        setAvatarPreview(savedAvatar);
        console.log('Avatar loaded from localStorage');
      }
    } catch (error) {
      console.error('Error loading saved avatar:', error);
    }
  }, []);

  useEffect(() => {
    loadSavedSettings();
    loadSavedAvatar();
  }, [loadSavedSettings, loadSavedAvatar]);

  const handleSave = useCallback(async (isAutoSave = false) => {
    if (!validateForm()) {
      console.warn('Form validation failed, cannot save');
      return false;
    }

    setIsSaving(true);

    try {
      // Save AI settings
      if (!APIkey || APIkey === '') {
        await deleteKey();
      } else {
        console.log('Saving API key');
        await setKey(APIkey);
      }

      // Save AI prompt settings
      await updateSettings(prompt);

      // Handle avatar upload if there's a new file
      if (formData.avatar) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const avatarData = e.target.result;
          console.log('Avatar data ready for upload');

          // TODO: Implement actual avatar upload to your backend/storage
          // For now, we'll save it to localStorage as a demo
          try {
            localStorage.setItem('userAvatar', avatarData);
            console.log('Avatar saved to localStorage');
          } catch (avatarError) {
            console.error('Failed to save avatar:', avatarError);
          }
        };
        reader.readAsDataURL(formData.avatar);
      }

      // Save form data to localStorage (implement proper backend later)
      const settingsData = {
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          about: formData.about,
          website: formData.website,
          pronouns: formData.pronouns,
        },
        preferences: {
          compactMode: formData.compactMode || false,
          highContrast: formData.highContrast || false,
          reducedMotion: formData.reducedMotion || false,
          dailyReminders: formData.dailyReminders !== undefined ? formData.dailyReminders : true,
          reminderTime: formData.reminderTime || '20:00',
          weeklyPrompts: formData.weeklyPrompts || false,
          milestones: formData.milestones !== undefined ? formData.milestones : true,
          smartSuggestions: formData.smartSuggestions || false,
        },
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem('deepJournalSettings', JSON.stringify(settingsData));
      console.log('Settings saved successfully:', settingsData);

      setHasUnsavedChanges(false);
      setLastSaved(new Date());

      if (!isAutoSave) {
        console.log('Manual save completed successfully!');
      }

      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      // Show error feedback to user
      setFormErrors(prev => ({
        ...prev,
        save: 'Failed to save settings. Please try again.'
      }));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [validateForm, APIkey, deleteKey, setKey, updateSettings, prompt, formData]);

  // Assign handleSave to ref for auto-save functionality
  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  // Legacy save handler for compatibility
  const handleSaveChanges = useCallback(() => {
    handleSave();
  }, [handleSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e) => {
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (hasUnsavedChanges) {
          handleSave();
        }
      }

      // Escape to close if no unsaved changes
      if (e.key === 'Escape' && !hasUnsavedChanges) {
        // Close settings dialog
        const closeButton = document.querySelector('[data-settings-close]');
        if (closeButton) {
          closeButton.click();
        }
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [hasUnsavedChanges]);

  // Cleanup auto-save timeout
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const handleAutoUpdateToggle = async (e) => {
    const enabled = e.target.checked;
    setAutoUpdateEnabled(enabled);

    try {
      if (window.electron?.setAutoUpdatePreference) {
        const result = await window.electron.setAutoUpdatePreference(enabled);
        if (!result.success) {
          console.error('Failed to save auto-update preference:', result.error);
          // Revert the toggle if save failed
          setAutoUpdateEnabled(!enabled);
        }
      }
    } catch (error) {
      console.error('Error saving auto-update preference:', error);
      // Revert the toggle if save failed
      setAutoUpdateEnabled(!enabled);
    }
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

  const tabItems = [
    {
      id: 'profile',
      label: 'Profile',
      icon: PersonIcon,
    },
    {
      id: 'account',
      label: 'Account',
      icon: KeyIcon,
    },
    {
      id: 'appearance',
      label: 'Appearance',
      icon: ColorsIcon,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: BellIcon,
    },
    {
      id: 'privacy',
      label: 'Privacy',
      icon: EyeIcon,
    },
    {
      id: 'updates',
      label: 'Updates',
      icon: DownloadIcon,
    },
    {
      id: 'ai',
      label: 'AI Assistant',
      icon: AIIcon,
    },
    {
      id: 'data',
      label: 'Data & Storage',
      icon: DatabaseIcon,
    },
  ];

  const renderTabNavigation = () => {
    return (
      <div className={styles.tabNavigation}>
        {tabItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`${styles.tabItem} ${activeSection === item.id ? styles.active : ''}`}
              onClick={() => setActiveSection(item.id)}
            >
              <Icon className={styles.tabIcon} />
              <span className={styles.tabLabel}>{item.label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className={styles.contentSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Profile</h3>
              <p className={styles.sectionDescription}>
                Manage your personal information and profile settings.
              </p>
            </div>

            <div
              className={`${styles.photoSection} ${isDragOver ? styles.dragOver : ''} ${formErrors.avatar ? styles.error : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className={styles.photoPreview}>
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className={styles.avatarImage}
                  />
                ) : (
                  <PersonIcon className={styles.photoIcon} />
                )}
                {isDragOver && (
                  <div className={styles.dragOverlay}>
                    <span>Drop image here</span>
                  </div>
                )}
              </div>
              <div className={styles.photoActions}>
                <button
                  type="button"
                  className={styles.changePhotoBtn}
                  onClick={handleChangePhotoClick}
                >
                  {avatarPreview ? 'Change' : 'Upload'}
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    className={styles.removePhotoBtn}
                    onClick={handleRemoveAvatar}
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className={styles.photoHelp}>
                <span>JPG, PNG, GIF up to 5MB • Drag & drop or click to upload</span>
              </div>
              {formErrors.avatar && (
                <div className={styles.errorMessage}>
                  {formErrors.avatar}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarInputChange}
                className={styles.hiddenFileInput}
              />
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>First Name</label>
                <input
                  type="text"
                  className={`${styles.formInput} ${formErrors.firstName ? styles.error : ''}`}
                  value={formData.firstName}
                  onChange={(e) => handleFormChange('firstName', e.target.value)}
                  placeholder="Enter your first name"
                />
                {formErrors.firstName && (
                  <div className={styles.errorMessage}>
                    {formErrors.firstName}
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Last Name</label>
                <input
                  type="text"
                  className={`${styles.formInput} ${formErrors.lastName ? styles.error : ''}`}
                  value={formData.lastName}
                  onChange={(e) => handleFormChange('lastName', e.target.value)}
                  placeholder="Enter your last name"
                />
                {formErrors.lastName && (
                  <div className={styles.errorMessage}>
                    {formErrors.lastName}
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>About</label>
                <textarea
                  className={styles.formTextarea}
                  value={formData.about}
                  onChange={(e) => handleFormChange('about', e.target.value)}
                  placeholder="Tell us about yourself..."
                />
                <div className={styles.inputHint}>
                  Share a brief description about yourself and your interests.
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Website</label>
                <input
                  type="url"
                  className={`${styles.formInput} ${formErrors.website ? styles.error : ''}`}
                  value={formData.website}
                  onChange={(e) => handleFormChange('website', e.target.value)}
                  placeholder="https://your-website.com"
                />
                {formErrors.website && (
                  <div className={styles.errorMessage}>
                    {formErrors.website}
                  </div>
                )}
                <div className={styles.inputHint}>
                  Optional: Your personal or professional website.
                </div>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className={styles.contentSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Appearance</h3>
              <p className={styles.sectionDescription}>
                Customize the look and feel of Deep Journal to match your style.
              </p>
            </div>

            <div className={styles.themeSelector}>
              <label className={styles.formLabel}>Theme Selection</label>
              <div className={styles.themeGrid}>
                {renderThemes()}
              </div>
              <div className={styles.themeInfo}>
                <div className={styles.currentThemeInfo}>
                  <span className={styles.themeLabel}>Current Theme:</span>
                  <span className={styles.themeName}>{currentTheme}</span>
                </div>
                <div className={styles.themeDescription}>
                  Choose a theme that matches your preference and reduces eye strain.
                </div>
              </div>
            </div>

            <div className={styles.toggleGroup}>
              <div className={styles.toggleContainer}>
                <div>
                  <div className={styles.toggleTitle}>Compact Mode</div>
                  <div className={styles.toggleDescription}>Show more content in less space for better productivity</div>
                </div>
                <div className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    id="compact-mode"
                    className={styles.toggleInput}
                    onChange={(e) => handleFormChange('compactMode', e.target.checked)}
                  />
                  <label htmlFor="compact-mode" className={styles.toggleSlider}>
                    <span className={styles.toggleThumb}></span>
                  </label>
                </div>
              </div>

              <div className={styles.toggleContainer}>
                <div>
                  <div className={styles.toggleTitle}>High Contrast</div>
                  <div className={styles.toggleDescription}>Increase contrast for better accessibility</div>
                </div>
                <div className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    id="high-contrast"
                    className={styles.toggleInput}
                    onChange={(e) => handleFormChange('highContrast', e.target.checked)}
                  />
                  <label htmlFor="high-contrast" className={styles.toggleSlider}>
                    <span className={styles.toggleThumb}></span>
                  </label>
                </div>
              </div>

              <div className={styles.toggleContainer}>
                <div>
                  <div className={styles.toggleTitle}>Reduced Motion</div>
                  <div className={styles.toggleDescription}>Minimize animations and transitions</div>
                </div>
                <div className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    id="reduced-motion"
                    className={styles.toggleInput}
                    onChange={(e) => handleFormChange('reducedMotion', e.target.checked)}
                  />
                  <label htmlFor="reduced-motion" className={styles.toggleSlider}>
                    <span className={styles.toggleThumb}></span>
                  </label>
                </div>
              </div>

              <div className={styles.toggleContainer}>
                <div>
                  <div className={styles.toggleTitle}>Smooth Animations</div>
                  <div className={styles.toggleDescription}>Enable interface transitions</div>
                </div>
                <div className={styles.toggleSwitch}>
                  <input type="checkbox" id="animations" className={styles.toggleInput} defaultChecked />
                  <label htmlFor="animations" className={styles.toggleSlider}>
                    <span className={styles.toggleThumb}></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className={styles.contentSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>AI Assistant</h3>
              <p className={styles.sectionDescription}>
                Configure your AI provider and customize responses.
              </p>
            </div>

            <AISettingTabs APIkey={APIkey} setCurrentKey={setCurrentKey} />

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>AI Personality</label>
              <textarea
                className={styles.formTextarea}
                placeholder="Describe how you want the AI to analyze and respond to your journal entries..."
                value={prompt}
                onChange={handleOnChangePrompt}
                style={{ minHeight: '120px' }}
              />
              <div className={styles.inputHint}>
                Customize how AI responds to your journal entries.
              </div>
            </div>
          </div>
        );

      case 'updates':
        return (
          <div className={styles.contentSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Updates</h3>
              <p className={styles.sectionDescription}>
                Keep Deep Journal up to date with the latest features.
              </p>
            </div>

            <div className={styles.toggleContainer}>
              <div>
                <div className={styles.toggleTitle}>Auto Updates</div>
                <div className={styles.toggleDescription}>Automatically download and install updates</div>
              </div>
              <div className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  id="auto-update"
                  className={styles.toggleInput}
                  checked={autoUpdateEnabled}
                  onChange={handleAutoUpdateToggle}
                />
                <label htmlFor="auto-update" className={styles.toggleSlider}>
                  <span className={styles.toggleThumb}></span>
                </label>
              </div>
            </div>

            <UpdateStatusPanel />
          </div>
        );

      case 'notifications':
        return (
          <div className={styles.contentSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Notifications & Reminders</h3>
              <p className={styles.sectionDescription}>
                Set up personalized reminders to maintain your journaling habit.
              </p>
            </div>

            <div className={styles.toggleGroup}>
              <div className={styles.toggleContainer}>
                <div>
                  <div className={styles.toggleTitle}>Daily Writing Reminders</div>
                  <div className={styles.toggleDescription}>Get gentle reminders to journal each day</div>
                </div>
                <div className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    id="daily-reminders"
                    className={styles.toggleInput}
                    defaultChecked
                    onChange={(e) => handleFormChange('dailyReminders', e.target.checked)}
                  />
                  <label htmlFor="daily-reminders" className={styles.toggleSlider}>
                    <span className={styles.toggleThumb}></span>
                  </label>
                </div>
              </div>

              {/* Reminder time setting */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Reminder Time</label>
                <input
                  type="time"
                  className={styles.formInput}
                  defaultValue="20:00"
                  onChange={(e) => handleFormChange('reminderTime', e.target.value)}
                />
                <div className={styles.inputHint}>
                  Choose the best time for your daily writing reminder.
                </div>
              </div>

              <div className={styles.toggleContainer}>
                <div>
                  <div className={styles.toggleTitle}>Weekly Reflection Prompts</div>
                  <div className={styles.toggleDescription}>Receive thoughtful prompts for deeper reflection</div>
                </div>
                <div className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    id="weekly-prompts"
                    className={styles.toggleInput}
                    onChange={(e) => handleFormChange('weeklyPrompts', e.target.checked)}
                  />
                  <label htmlFor="weekly-prompts" className={styles.toggleSlider}>
                    <span className={styles.toggleThumb}></span>
                  </label>
                </div>
              </div>

              <div className={styles.toggleContainer}>
                <div>
                  <div className={styles.toggleTitle}>Milestone Celebrations</div>
                  <div className={styles.toggleDescription}>Get notified when you reach journaling milestones</div>
                </div>
                <div className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    id="milestones"
                    className={styles.toggleInput}
                    defaultChecked
                    onChange={(e) => handleFormChange('milestones', e.target.checked)}
                  />
                  <label htmlFor="milestones" className={styles.toggleSlider}>
                    <span className={styles.toggleThumb}></span>
                  </label>
                </div>
              </div>

              <div className={styles.toggleContainer}>
                <div>
                  <div className={styles.toggleTitle}>Smart Suggestions</div>
                  <div className={styles.toggleDescription}>Receive AI-powered writing suggestions and insights</div>
                </div>
                <div className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    id="smart-suggestions"
                    className={styles.toggleInput}
                    onChange={(e) => handleFormChange('smartSuggestions', e.target.checked)}
                  />
                  <label htmlFor="smart-suggestions" className={styles.toggleSlider}>
                    <span className={styles.toggleThumb}></span>
                  </label>
                </div>
              </div>

              <div className={styles.toggleContainer}>
                <div>
                  <div className={styles.toggleTitle}>AI Insights</div>
                  <div className={styles.toggleDescription}>Notify when AI finds insights</div>
                </div>
                <div className={styles.toggleSwitch}>
                  <input type="checkbox" id="ai-insights" className={styles.toggleInput} defaultChecked />
                  <label htmlFor="ai-insights" className={styles.toggleSlider}>
                    <span className={styles.toggleThumb}></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className={styles.contentSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Privacy</h3>
              <p className={styles.sectionDescription}>
                Control your privacy and data settings.
              </p>
            </div>

            <div className={styles.toggleGroup}>
              <div className={styles.toggleContainer}>
                <div>
                  <div className={styles.toggleTitle}>Analytics</div>
                  <div className={styles.toggleDescription}>Help improve Deep Journal with usage data</div>
                </div>
                <div className={styles.toggleSwitch}>
                  <input type="checkbox" id="analytics" className={styles.toggleInput} />
                  <label htmlFor="analytics" className={styles.toggleSlider}>
                    <span className={styles.toggleThumb}></span>
                  </label>
                </div>
              </div>

              <div className={styles.toggleContainer}>
                <div>
                  <div className={styles.toggleTitle}>AI Processing</div>
                  <div className={styles.toggleDescription}>Allow AI to analyze journals</div>
                </div>
                <div className={styles.toggleSwitch}>
                  <input type="checkbox" id="ai-processing" className={styles.toggleInput} defaultChecked />
                  <label htmlFor="ai-processing" className={styles.toggleSlider}>
                    <span className={styles.toggleThumb}></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'account':
        return (
          <div className={styles.contentSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Account</h3>
              <p className={styles.sectionDescription}>
                Manage your account information and settings.
              </p>
            </div>

            {user && (
              <div className={styles.accountCard}>
                <div className={styles.accountRow}>
                  <span className={styles.accountLabel}>Email</span>
                  <span className={styles.accountValue}>{user.email}</span>
                </div>
                <div className={styles.accountRow}>
                  <span className={styles.accountLabel}>Member since</span>
                  <span className={styles.accountValue}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}

            <div className={styles.actionsList}>
              <div className={styles.actionItem}>
                <div className={styles.actionContent}>
                  <div className={styles.actionLabel}>Change Password</div>
                  <div className={styles.actionDescription}>Update your account password</div>
                </div>
                <button className={styles.actionButton}>Change</button>
              </div>

              <div className={styles.actionItem}>
                <div className={styles.actionContent}>
                  <div className={styles.actionLabel}>Download Data</div>
                  <div className={styles.actionDescription}>Export your account information</div>
                </div>
                <button className={styles.actionButton}>Download</button>
              </div>

              <div className={styles.actionItem}>
                <div className={styles.actionContent}>
                  <div className={styles.actionLabel}>Sign Out</div>
                  <div className={styles.actionDescription}>Sign out from this device</div>
                </div>
                <button
                  className={styles.logoutButton}
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <LogoutIcon className={styles.logoutIcon} />
                  {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className={styles.contentSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Data & Storage</h3>
              <p className={styles.sectionDescription}>
                Manage your data and storage preferences.
              </p>
            </div>

            <div className={styles.actionItem}>
              <div className={styles.actionContent}>
                <div className={styles.actionLabel}>Regenerate Index</div>
                <div className={styles.actionDescription}>Rebuild the search index for all entries</div>
              </div>
              <button
                className={styles.actionButton}
                onClick={() => {
                  regenerateEmbeddings();
                }}
              >
                <RefreshIcon className={styles.actionIcon} />
                Regenerate
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className={styles.contentSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Settings</h3>
              <p className={styles.sectionDescription}>
                Select a section from the navigation above to get started.
              </p>
            </div>
          </div>
        );
    }
  };

  // Enhanced save status component
  const SaveStatusIndicator = () => {
    if (isSaving) {
      return (
        <div className={styles.saveStatus}>
          <span className={styles.savingIndicator}>
            <div className={styles.spinner}></div>
            Saving...
          </span>
        </div>
      );
    }

    if (lastSaved && !hasUnsavedChanges) {
      return (
        <div className={styles.saveStatus}>
          <span className={styles.savedIndicator}>
            ✓ Saved {formatSaveTime(lastSaved)}
          </span>
        </div>
      );
    }

    if (hasUnsavedChanges) {
      return (
        <div className={styles.saveStatus}>
          <span className={styles.unsavedIndicator}>
            ● Unsaved changes (⌘+S to save)
          </span>
        </div>
      );
    }

    return (
      <div className={styles.saveStatus}>
        <span>Ready to edit</span>
      </div>
    );
  };

  // Utility function for formatting save time
  const formatSaveTime = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffMins > 60) {
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours}h ago`;
    } else if (diffMins > 0) {
      return `${diffMins}m ago`;
    } else if (diffSecs > 5) {
      return `${diffSecs}s ago`;
    } else {
      return 'just now';
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

          <div className={styles.settingsHeader}>
            <Dialog.Title className={styles.settingsTitle}>Settings</Dialog.Title>
            <Dialog.Description className={styles.settingsSubtitle}>
              Customize your Deep Journal experience
            </Dialog.Description>
          </div>

          <div className={styles.settingsContainer}>
            <div className={styles.navigationSidebar}>
              {renderTabNavigation()}
            </div>

            <div className={styles.contentArea}>
              {renderContent()}
            </div>
          </div>

          <div className={styles.footer}>
            <div className={styles.footerLeft}>
              {/* Save status indicator */}
              <SaveStatusIndicator />
            </div>

            <div className={styles.footerActions}>
              <button
                className={`${styles.footerButton} ${styles.resetButton}`}
                onClick={() => {
                  if (hasUnsavedChanges) {
                    if (confirm('Are you sure you want to reset? All unsaved changes will be lost.')) {
                      // Reset form to initial state
                      setFormData({
                        firstName: user?.displayName?.split(' ')[0] || '',
                        lastName: user?.displayName?.split(' ').slice(1).join(' ') || '',
                        about: '',
                        website: '',
                        pronouns: [],
                        avatar: null,
                      });
                      setAvatarPreview(user?.photoURL || null);
                      setHasUnsavedChanges(false);
                      setFormErrors({});
                    }
                  }
                }}
                disabled={isSaving}
              >
                Reset
              </button>

              <button
                className={`${styles.footerButton} ${styles.saveButton}`}
                onClick={handleSaveChanges}
                disabled={isSaving || !hasUnsavedChanges || Object.keys(formErrors).length > 0}
                title="Save changes (⌘+S)"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>

              <Dialog.Close asChild>
                <button
                  className={`${styles.footerButton} ${styles.closeButton}`}
                  data-settings-close
                  onClick={() => {
                    if (hasUnsavedChanges) {
                      if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
                        // Prevent closing
                        return false;
                      }
                    }
                  }}
                >
                  Close
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Auto-save toast notification */}
          {showAutoSaveToast && (
            <div className={`${styles.autoSaveToast} ${showAutoSaveToast ? styles.show : ''}`}>
              <span className={styles.toastIcon}>✓</span>
              <span>Auto-saved</span>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
