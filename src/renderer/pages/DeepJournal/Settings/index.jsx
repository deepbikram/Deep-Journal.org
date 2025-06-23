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
  HelpIcon,
  FingerprintIcon,
  CameraIcon,
  LockIcon
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

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    enabled: false,
    authType: null, // 'pin' | 'password' | null
    biometricEnabled: false,
    biometricType: null,
    sessionTimeout: 30
  });
  const [biometricAvailability, setBiometricAvailability] = useState(null);
  const [showSecuritySetup, setShowSecuritySetup] = useState(false);
  const [setupStep, setSetupStep] = useState('choose'); // 'choose' | 'pin' | 'password' | 'biometric' | 'questions'
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [securityErrors, setSecurityErrors] = useState({});

  // Security questions state
  const [securityQuestion1, setSecurityQuestion1] = useState('');
  const [securityAnswer1, setSecurityAnswer1] = useState('');
  const [securityQuestion2, setSecurityQuestion2] = useState('');
  const [securityAnswer2, setSecurityAnswer2] = useState('');

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotAnswer1, setForgotAnswer1] = useState('');
  const [forgotAnswer2, setForgotAnswer2] = useState('');
  const [newCredential, setNewCredential] = useState('');
  const [confirmNewCredential, setConfirmNewCredential] = useState('');
  const [forgotStep, setForgotStep] = useState('questions'); // 'questions' | 'reset'

  // Predefined security questions
  const securityQuestionOptions = [
    "What was the name of your first pet?",
    "What city were you born in?",
    "What was your mother's maiden name?",
    "What was the name of your elementary school?",
    "What was your childhood nickname?",
    "What is your favorite movie?",
    "What was the make of your first car?",
    "What street did you grow up on?",
    "What was your favorite teacher's name?",
    "What is your favorite book?"
  ];

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
    setHasUnsavedChanges(true);
    triggerAutoSave();
  };

  const handleOnChangePrompt = (e) => {
    const p = e.target.value ?? '';
    setPrompt(p);
    setHasUnsavedChanges(true);
    triggerAutoSave();
  };

  // Enhanced form validation - separated critical vs. optional validation
  const validateForm = useCallback((criticalOnly = false) => {
    const errors = {};

    // Critical validation - only for essential fields
    if (formData.website && !isValidUrl(formData.website)) {
      errors.website = 'Please enter a valid URL';
    }

    // Optional validation - for better UX but won't prevent saving
    if (!criticalOnly) {
      if (!formData.firstName?.trim()) {
        errors.firstName = 'First name is recommended for a complete profile';
      }

      if (!formData.lastName?.trim()) {
        errors.lastName = 'Last name is recommended for a complete profile';
      }
    }

    setFormErrors(errors);

    // For saving purposes, only return false if there are critical errors
    const criticalErrors = formData.website && !isValidUrl(formData.website);
    return !criticalErrors;
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
      if (hasUnsavedChanges && validateForm(true) && handleSaveRef.current) { // Use critical validation only
        const success = await handleSaveRef.current(true); // Auto-save flag
        if (success) {
          // Show auto-save toast notification
          setShowAutoSaveToast(true);
          setTimeout(() => setShowAutoSaveToast(false), 3000);
        }
      }
    }, 1000); // Reduced auto-save delay to 1 second for better responsiveness
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
    // Use critical validation for auto-save, full validation for manual save
    if (!validateForm(isAutoSave)) {
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

  // Keyboard shortcuts for auto-save system
  useEffect(() => {
    const handleKeydown = (e) => {
      // Escape to close (no need to check for unsaved changes with auto-save)
      if (e.key === 'Escape') {
        // Close settings dialog
        const closeButton = document.querySelector('[data-settings-close]');
        if (closeButton) {
          closeButton.click();
        }
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, []);

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
    setHasUnsavedChanges(true);
    triggerAutoSave();

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
            setHasUnsavedChanges(true);
            triggerAutoSave();
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
      id: 'security',
      label: 'Security',
      icon: ShieldIcon,
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
                  className={styles.formInput}
                  value={formData.firstName}
                  onChange={(e) => handleFormChange('firstName', e.target.value)}
                  placeholder="Enter your first name"
                />
                {formErrors.firstName && (
                  <div className={styles.validationHint}>
                    {formErrors.firstName}
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Last Name</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={formData.lastName}
                  onChange={(e) => handleFormChange('lastName', e.target.value)}
                  placeholder="Enter your last name"
                />
                {formErrors.lastName && (
                  <div className={styles.validationHint}>
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

      case 'security':
        return (
          <div className={styles.contentSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Security</h3>
              <p className={styles.sectionDescription}>
                Protect your journal with PIN, password, or biometric authentication.
              </p>
            </div>

            {!securitySettings.enabled ? (
              // Security setup section
              <div className={styles.securitySetup}>
                <div className={styles.securityCard}>
                  <div className={styles.securityIcon}>
                    <ShieldIcon />
                  </div>
                  <div className={styles.securityContent}>
                    <h4>Enable Security</h4>
                    <p>Protect your private thoughts with secure authentication. Choose from PIN, password, or biometric options.</p>
                  </div>
                </div>

                {!showSecuritySetup ? (
                  <button
                    className={styles.enableSecurityButton}
                    onClick={() => setShowSecuritySetup(true)}
                  >
                    <LockIcon />
                    Set Up Security
                  </button>
                ) : (
                  <div className={styles.securitySetupFlow}>
                    {setupStep === 'choose' && (
                      <div className={styles.setupStep}>
                        <h4>Choose Authentication Method</h4>
                        <div className={styles.authOptions}>
                          <button
                            className={styles.authOption}
                            onClick={() => setSetupStep('pin')}
                          >
                            <div className={styles.authIcon}>
                              <LockIcon />
                            </div>
                            <div className={styles.authContent}>
                              <h5>PIN</h5>
                              <p>Quick 4-6 digit access</p>
                            </div>
                          </button>

                          <button
                            className={styles.authOption}
                            onClick={() => setSetupStep('password')}
                          >
                            <div className={styles.authIcon}>
                              <KeyIcon />
                            </div>
                            <div className={styles.authContent}>
                              <h5>Password</h5>
                              <p>Strong password protection</p>
                            </div>
                          </button>
                        </div>

                        <button
                          className={styles.cancelButton}
                          onClick={() => setShowSecuritySetup(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {setupStep === 'pin' && (
                      <div className={styles.setupStep}>
                        <h4>Set Up PIN</h4>
                        <div className={styles.pinSetup}>
                          <div className={styles.formGroup}>
                            <label>Enter PIN (4-6 digits)</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              autoComplete="off"
                              maxLength="6"
                              pattern="[0-9]*"
                              value={pinInput}
                              onChange={(e) => {
                                setPinInput(e.target.value.replace(/\D/g, ''));
                                setSecurityErrors({});
                              }}
                              className={styles.pinInput}
                              placeholder="Enter PIN"
                              autoFocus
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Confirm PIN</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              autoComplete="off"
                              maxLength="6"
                              pattern="[0-9]*"
                              value={confirmPinInput}
                              onChange={(e) => {
                                setConfirmPinInput(e.target.value.replace(/\D/g, ''));
                                setSecurityErrors({});
                              }}
                              className={styles.pinInput}
                              placeholder="Confirm PIN"
                            />
                          </div>
                          {securityErrors.pin && (
                            <div className={styles.errorMessage}>
                              {securityErrors.pin}
                            </div>
                          )}
                        </div>
                        <div className={styles.setupActions}>
                          <button
                            className={styles.cancelButton}
                            onClick={() => setSetupStep('choose')}
                          >
                            Back
                          </button>
                          <button
                            className={styles.confirmButton}
                            onClick={handleSecuritySetup}
                          >
                            Enable PIN
                          </button>
                        </div>
                      </div>
                    )}

                    {setupStep === 'password' && (
                      <div className={styles.setupStep}>
                        <h4>Set Up Password</h4>
                        <div className={styles.passwordSetup}>
                          <div className={styles.formGroup}>
                            <label>Enter Password (minimum 6 characters)</label>
                            <input
                              type="password"
                              autoComplete="new-password"
                              value={passwordInput}
                              onChange={(e) => {
                                setPasswordInput(e.target.value);
                                setSecurityErrors({});
                              }}
                              className={styles.passwordInput}
                              placeholder="Enter password"
                              autoFocus
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Confirm Password</label>
                            <input
                              type="password"
                              autoComplete="new-password"
                              value={confirmPasswordInput}
                              onChange={(e) => {
                                setConfirmPasswordInput(e.target.value);
                                setSecurityErrors({});
                              }}
                              className={styles.passwordInput}
                              placeholder="Confirm password"
                            />
                          </div>
                          {securityErrors.password && (
                            <div className={styles.errorMessage}>
                              {securityErrors.password}
                            </div>
                          )}
                        </div>
                        <div className={styles.setupActions}>
                          <button
                            className={styles.cancelButton}
                            onClick={() => setSetupStep('choose')}
                          >
                            Back
                          </button>
                          <button
                            className={styles.confirmButton}
                            onClick={handleSecuritySetup}
                          >
                            Enable Password
                          </button>
                        </div>
                      </div>
                    )}

                    {setupStep === 'questions' && (
                      <div className={styles.setupStep}>
                        <h4>Set Up Security Questions</h4>
                        <p className={styles.setupDescription}>
                          These questions will help you recover your {pinInput ? 'PIN' : 'password'} if you forget it.
                        </p>

                        <div className={styles.questionsSetup}>
                          <div className={styles.formGroup}>
                            <label>Security Question 1</label>
                            <select
                              value={securityQuestion1}
                              onChange={(e) => {
                                setSecurityQuestion1(e.target.value);
                                setSecurityErrors({});
                              }}
                              className={styles.questionSelect}
                            >
                              <option value="">Select a question...</option>
                              {securityQuestionOptions.map((question, index) => (
                                <option key={index} value={question} disabled={question === securityQuestion2}>
                                  {question}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className={styles.formGroup}>
                            <label>Answer 1</label>
                            <input
                              type="text"
                              value={securityAnswer1}
                              onChange={(e) => {
                                setSecurityAnswer1(e.target.value);
                                setSecurityErrors({});
                              }}
                              className={styles.answerInput}
                              placeholder="Enter your answer"
                            />
                          </div>

                          <div className={styles.formGroup}>
                            <label>Security Question 2</label>
                            <select
                              value={securityQuestion2}
                              onChange={(e) => {
                                setSecurityQuestion2(e.target.value);
                                setSecurityErrors({});
                              }}
                              className={styles.questionSelect}
                            >
                              <option value="">Select a question...</option>
                              {securityQuestionOptions.map((question, index) => (
                                <option key={index} value={question} disabled={question === securityQuestion1}>
                                  {question}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className={styles.formGroup}>
                            <label>Answer 2</label>
                            <input
                              type="text"
                              value={securityAnswer2}
                              onChange={(e) => {
                                setSecurityAnswer2(e.target.value);
                                setSecurityErrors({});
                              }}
                              className={styles.answerInput}
                              placeholder="Enter your answer"
                            />
                          </div>

                          {securityErrors.questions && (
                            <div className={styles.errorMessage}>
                              {securityErrors.questions}
                            </div>
                          )}
                        </div>

                        <div className={styles.setupActions}>
                          <button
                            className={styles.cancelButton}
                            onClick={() => setSetupStep(pinInput ? 'pin' : 'password')}
                          >
                            Back
                          </button>
                          <button
                            className={styles.confirmButton}
                            onClick={handleSecuritySetup}
                          >
                            Complete Setup
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // Security management section
              <div className={styles.securityManagement}>
                <div className={styles.securityStatus}>
                  <div className={styles.statusCard}>
                    <div className={styles.statusIcon}>
                      <ShieldIcon className={styles.activeShield} />
                    </div>
                    <div className={styles.statusContent}>
                      <h4>Security Enabled</h4>
                      <p>Your journal is protected with {securitySettings.authType === 'pin' ? 'PIN' : 'password'} authentication</p>
                    </div>
                  </div>
                </div>

                <div className={styles.securityOptions}>
                  <div className={styles.optionGroup}>
                    <h5>Authentication Method</h5>
                    <div className={styles.currentMethod}>
                      <div className={styles.methodIcon}>
                        {securitySettings.authType === 'pin' ? <LockIcon /> : <KeyIcon />}
                      </div>
                      <div className={styles.methodContent}>
                        <span className={styles.methodName}>
                          {securitySettings.authType === 'pin' ? 'PIN Protection' : 'Password Protection'}
                        </span>
                        <span className={styles.methodDescription}>
                          {securitySettings.authType === 'pin'
                            ? 'Quick numeric access'
                            : 'Strong password security'
                          }
                        </span>
                      </div>
                      <button
                        className={styles.changeMethodButton}
                        onClick={() => {
                          setShowSecuritySetup(true);
                          setSetupStep('choose');
                        }}
                      >
                        Change
                      </button>
                    </div>

                    {/* Forgot Password/PIN section */}
                    <div className={styles.forgotSection}>
                      <button
                        className={styles.forgotButton}
                        onClick={() => setShowForgotPassword(true)}
                      >
                        Forgot {securitySettings.authType === 'pin' ? 'PIN' : 'Password'}?
                      </button>
                    </div>
                  </div>

                  {biometricAvailability?.available && (
                    <div className={styles.optionGroup}>
                      <h5>Biometric Authentication</h5>
                      <div className={styles.biometricOptions}>
                        {biometricAvailability.types.map((type) => (
                          <div key={type} className={styles.biometricOption}>
                            <div className={styles.biometricContent}>
                              <div className={styles.biometricIcon}>
                                {type === 'fingerprint' && <FingerprintIcon />}
                                {(type === 'face' || type === 'faceid') && <CameraIcon />}
                                {type === 'touchid' && <FingerprintIcon />}
                                {type === 'biometric' && <FingerprintIcon />}
                              </div>
                              <div className={styles.biometricInfo}>
                                <span className={styles.biometricName}>
                                  {type === 'fingerprint' && 'Fingerprint'}
                                  {type === 'face' && 'Face Recognition'}
                                  {type === 'faceid' && 'Face ID'}
                                  {type === 'touchid' && 'Touch ID'}
                                  {type === 'biometric' && 'Biometric Authentication'}
                                </span>
                                <span className={styles.biometricDescription}>
                                  {type === 'biometric'
                                    ? 'Uses system biometric authentication (Touch ID, Face ID, etc.)'
                                    : 'Quick access with biometric authentication'
                                  }
                                </span>
                              </div>
                            </div>
                            <div className={styles.toggleSwitch}>
                              <input
                                type="checkbox"
                                id={`biometric-${type}`}
                                className={styles.toggleInput}
                                checked={securitySettings.biometricEnabled && securitySettings.biometricType === type}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handleEnableBiometric(type);
                                  } else {
                                    handleDisableBiometric();
                                  }
                                }}
                              />
                              <label htmlFor={`biometric-${type}`} className={styles.toggleSlider}>
                                <span className={styles.toggleThumb}></span>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={styles.optionGroup}>
                    <h5>Session Settings</h5>
                    <div className={styles.sessionOption}>
                      <div className={styles.sessionContent}>
                        <span className={styles.sessionLabel}>Session Timeout</span>
                        <span className={styles.sessionDescription}>
                          How long to stay signed in when inactive
                        </span>
                      </div>
                      <select
                        className={styles.sessionSelect}
                        value={securitySettings.sessionTimeout}
                        onChange={async (e) => {
                          const timeout = parseInt(e.target.value);
                          try {
                            if (window.electron?.ipc?.invoke) {
                              const success = await window.electron.ipc.invoke('set-security-settings', {
                                sessionTimeout: timeout
                              });
                              if (success) {
                                setSecuritySettings(prev => ({
                                  ...prev,
                                  sessionTimeout: timeout
                                }));
                              }
                            }
                          } catch (error) {
                            console.error('Error updating session timeout:', error);
                          }
                        }}
                      >
                        <option value={5}>5 minutes</option>
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={120}>2 hours</option>
                        <option value={0}>Never</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.dangerZone}>
                    <h5>Danger Zone</h5>
                    <div className={styles.dangerAction}>
                      <div className={styles.dangerContent}>
                        <span className={styles.dangerLabel}>Disable Security</span>
                        <span className={styles.dangerDescription}>
                          Remove all security protection from your journal
                        </span>
                      </div>
                      <button
                        className={styles.dangerButton}
                        onClick={handleDisableSecurity}
                      >
                        Disable
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {securityErrors.general && (
              <div className={styles.errorMessage}>
                {securityErrors.general}
              </div>
            )}
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

  // Enhanced auto-save status component
  const AutoSaveStatusIndicator = () => {
    if (isSaving) {
      return (
        <div className={styles.saveStatus}>
          <span className={styles.savingIndicator}>
            <div className={styles.spinner}></div>
            Auto-saving...
          </span>
        </div>
      );
    }

    if (lastSaved && !hasUnsavedChanges) {
      return (
        <div className={styles.saveStatus}>
          <span className={styles.savedIndicator}>
            ✓ Settings saved {formatSaveTime(lastSaved)}
          </span>
        </div>
      );
    }

    if (hasUnsavedChanges) {
      return (
        <div className={styles.saveStatus}>
          <span className={styles.unsavedIndicator}>
            ● All changes will be saved automatically
          </span>
        </div>
      );
    }

    return (
      <div className={styles.saveStatus}>
        <span>Auto-save enabled • Changes save as you type</span>
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

  // Security functions
  const loadSecuritySettings = useCallback(async () => {
    try {
      if (window.electron?.ipc?.invoke) {
        const settings = await window.electron.ipc.invoke('get-security-settings');
        if (settings) {
          setSecuritySettings(settings);
        }
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
    }
  }, []);

  const checkBiometricAvailability = useCallback(async () => {
    try {
      if (window.electron?.ipc?.invoke) {
        const availability = await window.electron.ipc.invoke('check-biometric-availability');
        setBiometricAvailability(availability);
      }
    } catch (error) {
      console.error('Error checking biometric availability:', error);
    }
  }, []);

  const handleSecuritySetup = async () => {
    try {
      let newSettings = { ...securitySettings };

      if (setupStep === 'pin') {
        if (!pinInput || pinInput.length < 4) {
          setSecurityErrors({ pin: 'PIN must be at least 4 digits' });
          return;
        }
        if (pinInput !== confirmPinInput) {
          setSecurityErrors({ pin: 'PINs do not match' });
          return;
        }

        // Move to security questions step
        setSetupStep('questions');
        setSecurityErrors({});
        return;
      } else if (setupStep === 'password') {
        if (!passwordInput || passwordInput.length < 6) {
          setSecurityErrors({ password: 'Password must be at least 6 characters' });
          return;
        }
        if (passwordInput !== confirmPasswordInput) {
          setSecurityErrors({ password: 'Passwords do not match' });
          return;
        }

        // Move to security questions step
        setSetupStep('questions');
        setSecurityErrors({});
        return;
      } else if (setupStep === 'questions') {
        // Validate security questions
        if (!securityQuestion1 || !securityAnswer1.trim()) {
          setSecurityErrors({ questions: 'Please select and answer the first security question' });
          return;
        }
        if (!securityQuestion2 || !securityAnswer2.trim()) {
          setSecurityErrors({ questions: 'Please select and answer the second security question' });
          return;
        }
        if (securityQuestion1 === securityQuestion2) {
          setSecurityErrors({ questions: 'Please select different security questions' });
          return;
        }
        if (securityAnswer1.trim().length < 2) {
          setSecurityErrors({ questions: 'Security answers must be at least 2 characters long' });
          return;
        }
        if (securityAnswer2.trim().length < 2) {
          setSecurityErrors({ questions: 'Security answers must be at least 2 characters long' });
          return;
        }

        // Complete setup with all data
        if (pinInput) {
          newSettings = {
            ...newSettings,
            enabled: true,
            authType: 'pin',
            pinHash: pinInput,
            pinLength: pinInput.length,
            securityQuestions: {
              question1: securityQuestion1,
              answer1Hash: securityAnswer1,
              question2: securityQuestion2,
              answer2Hash: securityAnswer2
            }
          };
        } else if (passwordInput) {
          newSettings = {
            ...newSettings,
            enabled: true,
            authType: 'password',
            passwordHash: passwordInput,
            securityQuestions: {
              question1: securityQuestion1,
              answer1Hash: securityAnswer1,
              question2: securityQuestion2,
              answer2Hash: securityAnswer2
            }
          };
        }
      }

      if (window.electron?.ipc?.invoke) {
        const success = await window.electron.ipc.invoke('set-security-settings', newSettings);
        if (success) {
          setSecuritySettings(newSettings);
          setShowSecuritySetup(false);
          setSetupStep('choose');
          resetSecurityForm();
        }
      }
    } catch (error) {
      console.error('Error setting up security:', error);
      setSecurityErrors({ general: 'Failed to setup security. Please try again.' });
    }
  };

  const handleDisableSecurity = async () => {
    if (window.confirm('Are you sure you want to disable security? Your journal will no longer be protected.')) {
      try {
        const newSettings = {
          enabled: false,
          authType: null,
          biometricEnabled: false,
          biometricType: null,
          sessionTimeout: 30
        };

        if (window.electron?.ipc?.invoke) {
          const success = await window.electron.ipc.invoke('set-security-settings', newSettings);
          if (success) {
            setSecuritySettings(newSettings);
          }
        }
      } catch (error) {
        console.error('Error disabling security:', error);
      }
    }
  };

  // Reset security form helper
  const resetSecurityForm = () => {
    setPinInput('');
    setConfirmPinInput('');
    setPasswordInput('');
    setConfirmPasswordInput('');
    setSecurityQuestion1('');
    setSecurityAnswer1('');
    setSecurityQuestion2('');
    setSecurityAnswer2('');
    setSecurityErrors({});
  };

  // Forgot password functions
  const handleForgotPassword = async () => {
    try {
      if (forgotStep === 'questions') {
        if (!forgotAnswer1.trim() || !forgotAnswer2.trim()) {
          setSecurityErrors({ forgot: 'Please answer both security questions' });
          return;
        }

        if (window.electron?.ipc?.invoke) {
          const isValid = await window.electron.ipc.invoke('verify-security-answers', forgotAnswer1, forgotAnswer2);
          if (isValid) {
            setForgotStep('reset');
            setSecurityErrors({});
          } else {
            setSecurityErrors({ forgot: 'Incorrect answers. Please try again.' });
          }
        }
      } else if (forgotStep === 'reset') {
        const isPin = securitySettings.authType === 'pin';

        if (isPin) {
          if (!newCredential || newCredential.length < 4) {
            setSecurityErrors({ forgot: 'PIN must be at least 4 digits' });
            return;
          }
          if (newCredential !== confirmNewCredential) {
            setSecurityErrors({ forgot: 'PINs do not match' });
            return;
          }
        } else {
          if (!newCredential || newCredential.length < 6) {
            setSecurityErrors({ forgot: 'Password must be at least 6 characters' });
            return;
          }
          if (newCredential !== confirmNewCredential) {
            setSecurityErrors({ forgot: 'Passwords do not match' });
            return;
          }
        }

        if (window.electron?.ipc?.invoke) {
          const success = await window.electron.ipc.invoke('reset-auth-with-security',
            isPin ? newCredential : undefined,
            !isPin ? newCredential : undefined
          );

          if (success) {
            setShowForgotPassword(false);
            setForgotStep('questions');
            setForgotAnswer1('');
            setForgotAnswer2('');
            setNewCredential('');
            setConfirmNewCredential('');
            setSecurityErrors({});
            // Show success message
            alert(`${isPin ? 'PIN' : 'Password'} has been reset successfully!`);
          } else {
            setSecurityErrors({ forgot: 'Failed to reset. Please try again.' });
          }
        }
      }
    } catch (error) {
      console.error('Error in forgot password:', error);
      setSecurityErrors({ forgot: 'An error occurred. Please try again.' });
    }
  };

  const handleEnableBiometric = async (type) => {
    try {
      if (window.electron?.ipc?.invoke) {
        const success = await window.electron.ipc.invoke('enable-biometric', type);
        if (success) {
          setSecuritySettings(prev => ({
            ...prev,
            biometricEnabled: true,
            biometricType: type
          }));
        }
      }
    } catch (error) {
      console.error('Error enabling biometric:', error);
    }
  };

  const handleDisableBiometric = async () => {
    try {
      if (window.electron?.ipc?.invoke) {
        const success = await window.electron.ipc.invoke('set-security-settings', {
          biometricEnabled: false,
          biometricType: null
        });
        if (success) {
          setSecuritySettings(prev => ({
            ...prev,
            biometricEnabled: false,
            biometricType: null
          }));
        }
      }
    } catch (error) {
      console.error('Error disabling biometric:', error);
    }
  };

  // Load security settings on mount
  useEffect(() => {
    loadSecuritySettings();
    checkBiometricAvailability();
  }, [loadSecuritySettings, checkBiometricAvailability]);

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

          {/* Forgot Password/PIN Modal */}
          {showForgotPassword && (
            <div className={styles.modalOverlay}>
              <div className={styles.forgotModal}>
                <div className={styles.modalHeader}>
                  <h3>Reset {securitySettings.authType === 'pin' ? 'PIN' : 'Password'}</h3>
                  <button
                    className={styles.modalCloseButton}
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotStep('questions');
                      setForgotAnswer1('');
                      setForgotAnswer2('');
                      setNewCredential('');
                      setConfirmNewCredential('');
                      setSecurityErrors({});
                    }}
                  >
                    ×
                  </button>
                </div>

                <div className={styles.modalContent}>
                  {forgotStep === 'questions' ? (
                    <div className={styles.forgotStep}>
                      <p className={styles.forgotDescription}>
                        Answer your security questions to reset your {securitySettings.authType === 'pin' ? 'PIN' : 'password'}.
                      </p>

                      <div className={styles.formGroup}>
                        <label>{securitySettings.securityQuestions?.question1}</label>
                        <input
                          type="text"
                          value={forgotAnswer1}
                          onChange={(e) => {
                            setForgotAnswer1(e.target.value);
                            setSecurityErrors({});
                          }}
                          className={styles.answerInput}
                          placeholder="Enter your answer"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>{securitySettings.securityQuestions?.question2}</label>
                        <input
                          type="text"
                          value={forgotAnswer2}
                          onChange={(e) => {
                            setForgotAnswer2(e.target.value);
                            setSecurityErrors({});
                          }}
                          className={styles.answerInput}
                          placeholder="Enter your answer"
                        />
                      </div>

                      {securityErrors.forgot && (
                        <div className={styles.errorMessage}>
                          {securityErrors.forgot}
                        </div>
                      )}

                      <div className={styles.modalActions}>
                        <button
                          className={styles.cancelButton}
                          onClick={() => {
                            setShowForgotPassword(false);
                            setForgotStep('questions');
                            setForgotAnswer1('');
                            setForgotAnswer2('');
                            setSecurityErrors({});
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          className={styles.confirmButton}
                          onClick={handleForgotPassword}
                        >
                          Verify Answers
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.forgotStep}>
                      <p className={styles.forgotDescription}>
                        Security questions verified! Set your new {securitySettings.authType === 'pin' ? 'PIN' : 'password'}.
                      </p>

                      <div className={styles.formGroup}>
                        <label>New {securitySettings.authType === 'pin' ? 'PIN' : 'Password'}</label>
                        <input
                          type={securitySettings.authType === 'pin' ? 'text' : 'password'}
                          inputMode={securitySettings.authType === 'pin' ? 'numeric' : undefined}
                          autoComplete="new-password"
                          value={newCredential}
                          onChange={(e) => {
                            const value = securitySettings.authType === 'pin'
                              ? e.target.value.replace(/\D/g, '')
                              : e.target.value;
                            setNewCredential(value);
                            setSecurityErrors({});
                          }}
                          className={styles.pinInput}
                          placeholder={`Enter new ${securitySettings.authType === 'pin' ? 'PIN' : 'password'}`}
                          maxLength={securitySettings.authType === 'pin' ? '6' : undefined}
                          autoFocus
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Confirm {securitySettings.authType === 'pin' ? 'PIN' : 'Password'}</label>
                        <input
                          type={securitySettings.authType === 'pin' ? 'text' : 'password'}
                          inputMode={securitySettings.authType === 'pin' ? 'numeric' : undefined}
                          autoComplete="new-password"
                          value={confirmNewCredential}
                          onChange={(e) => {
                            const value = securitySettings.authType === 'pin'
                              ? e.target.value.replace(/\D/g, '')
                              : e.target.value;
                            setConfirmNewCredential(value);
                            setSecurityErrors({});
                          }}
                          className={styles.pinInput}
                          placeholder={`Confirm new ${securitySettings.authType === 'pin' ? 'PIN' : 'password'}`}
                          maxLength={securitySettings.authType === 'pin' ? '6' : undefined}
                        />
                      </div>

                      {securityErrors.forgot && (
                        <div className={styles.errorMessage}>
                          {securityErrors.forgot}
                        </div>
                      )}

                      <div className={styles.modalActions}>
                        <button
                          className={styles.cancelButton}
                          onClick={() => setForgotStep('questions')}
                        >
                          Back
                        </button>
                        <button
                          className={styles.confirmButton}
                          onClick={handleForgotPassword}
                        >
                          Reset {securitySettings.authType === 'pin' ? 'PIN' : 'Password'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className={styles.footer}>
            <div className={styles.footerLeft}>
              {/* Auto-save status indicator */}
              <AutoSaveStatusIndicator />
            </div>

            <div className={styles.footerActions}>
              <Dialog.Close asChild>
                <button
                  className={`${styles.footerButton} ${styles.closeButton}`}
                  data-settings-close
                >
                  Close
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Enhanced auto-save toast notification */}
          {showAutoSaveToast && (
            <div className={`${styles.autoSaveToast} ${showAutoSaveToast ? styles.show : ''}`}>
              <span className={styles.toastIcon}>💾</span>
              <span>Changes saved automatically</span>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
