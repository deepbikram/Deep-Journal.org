import React, { useState, createContext, useEffect, useContext, useCallback } from 'react';
import { useToastsContext } from './ToastsContext';

export const AutoUpdateContext = createContext();

export const AutoUpdateContextProvider = ({ children }) => {
  const { addNotification, removeNotification } = useToastsContext();

  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateNotAvailable, setUpdateNotAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [currentVersion, setCurrentVersion] = useState('Unknown');

  // Get current version on load
  useEffect(() => {
    const fetchCurrentVersion = async () => {
      try {
        if (window.electron?.getCurrentVersion) {
          const version = await window.electron.getCurrentVersion();
          console.log('Fetched current version:', version);
          setCurrentVersion(version);
        } else {
          console.warn('getCurrentVersion not available');
        }
      } catch (error) {
        console.error('Could not get current version:', error);
        setCurrentVersion('Unknown');
      }
    };

    fetchCurrentVersion();
  }, []);

  const handleUpdateChecking = () => {
    console.log('Update check started - setting checking state');
    setIsChecking(true);
    setUpdateError(null);
    setUpdateNotAvailable(false);
    removeNotification('update-check-failed');

    // Only show notification for manual checks, not automatic ones
    // The UI components will show the checking state
  };

  const handleUpdateAvailable = async (info) => {
    console.log('Update available:', info);
    setIsChecking(false);
    setUpdateAvailable(true);
    setUpdateInfo(info);
    removeNotification('update-checking');

    // Get current version for clear display
    let displayCurrentVersion = currentVersion || 'Unknown';
    try {
      if (window.electron?.getCurrentVersion && (!currentVersion || currentVersion === 'Unknown')) {
        displayCurrentVersion = await window.electron.getCurrentVersion();
        setCurrentVersion(displayCurrentVersion);
      }
    } catch (error) {
      console.warn('Could not get current version:', error);
      displayCurrentVersion = 'Unknown';
    }

    // Only show notification for important updates - no excessive details
    addNotification({
      id: 'update-available',
      type: 'success',
      message: `🎉 Update Available (v${info.version})`,
      dismissTime: 8000,
    });
  };

  const handleUpdateDownloaded = (info) => {
    console.log('Update downloaded:', info);
    removeNotification('update-downloading');
    setUpdateDownloaded(true);
    setUpdateInfo(info);

    addNotification({
      id: 'update-ready',
      type: 'success',
      message: `✅ Update Ready - Restart to install v${info.version}`,
      dismissTime: 12000,
    });
  };

  const handleUpdateError = (error) => {
    console.log('Update error:', error);
    setIsChecking(false);
    removeNotification('update-downloading');
    removeNotification('update-checking');

    // Enhanced error handling based on error type
    let message = '❌ Update check failed: Unknown error';
    let dismissTime = 6000;
    let action = null;

    if (error.type === 'MISSING_RELEASE_FILES') {
      message = '⚠️ Update server temporarily unavailable';
      dismissTime = 8000;
      action = {
        label: 'Check GitHub',
        onClick: () => {
          if (window.electron?.openReleasesPage) {
            window.electron.openReleasesPage();
          }
        }
      };
    } else if (error.type === 'NETWORK_ERROR') {
      message = '🌐 Cannot connect to update server';
      dismissTime = 6000;
    } else if (error.type === 'NO_INTERNET') {
      message = '📡 No internet connection available';
      dismissTime = 5000;
    } else {
      message = `❌ Update check failed: ${error.message || 'Unknown error'}`;
    }

    // Only show error for manual checks, not automatic ones
    addNotification({
      id: 'update-error',
      type: 'failed',
      message,
      dismissTime,
      action
    });

    setUpdateError(error);
  };

  const handleUpdateNotAvailable = (info) => {
    console.log('No updates available:', info);
    setIsChecking(false);
    setUpdateNotAvailable(true);
    removeNotification('update-checking');

    // Only show notification for manual checks, not automatic startup checks
    // The UI components will reflect the up-to-date status
  };

  const handleDownloadProgress = (progress) => {
    setDownloadProgress(progress);
    // Progress is shown in UI components, no need for notifications
  };

  // Manual update check function
  const checkForUpdates = useCallback(async () => {
    if (!window.electron?.checkForUpdates) {
      console.warn('Update check not available');
      addNotification({
        id: 'update-unavailable',
        type: 'failed',
        message: '⚠️ Update check not available in development mode',
        dismissTime: 5000,
      });
      return;
    }

    try {
      console.log('Starting manual update check...');
      setIsChecking(true);
      setUpdateError(null);
      setUpdateNotAvailable(false);

      const result = await window.electron.checkForUpdates();
      console.log('Update check result:', result);

      if (result.success) {
        // Success case is handled by the IPC event listeners
        console.log('Update check completed successfully');

        // Show "up to date" notification only for manual checks
        if (!result.updateAvailable) {
          addNotification({
            id: 'up-to-date',
            type: 'success',
            message: '✅ You\'re running the latest version',
            dismissTime: 4000,
          });
        }
      } else {
        addNotification({
          id: 'update-check-failed',
          type: 'failed',
          message: `❌ Update check failed: ${result.message || 'Network error'}`,
          dismissTime: 6000,
        });
        setUpdateError({ message: result.message || 'Update check failed' });
      }
    } catch (error) {
      console.error('Manual update check failed:', error);

      addNotification({
        id: 'update-check-error',
        type: 'failed',
        message: `❌ Update check error: ${error.message || 'Network error'}`,
        dismissTime: 6000,
      });
      setUpdateError(error);
    } finally {
      setTimeout(() => {
        setIsChecking(false);
      }, 500);
    }
  }, [addNotification]);

  // Download update manually
  const downloadUpdate = useCallback(async () => {
    if (!window.electron?.downloadUpdate) {
      console.warn('Download update not available');
      return;
    }

    try {
      const result = await window.electron.downloadUpdate();
      if (!result.success) {
        addNotification({
          id: 'download-failed-details',
          type: 'failed',
          message: `❌ Download Failed!
📱 Current Version: Unknown (unchanged)
🆕 Target Version: ${updateInfo?.version || 'Unknown'}
📊 Status: Download unsuccessful
🔄 Error: Failed to download update files
💡 Suggestion: Check internet connection and try again`,
          dismissTime: 8000,
        });
      }
    } catch (error) {
      console.error('Manual download failed:', error);
      addNotification({
        id: 'download-error-details',
        type: 'failed',
        message: `❌ Download Error!
📱 Current Version: Unknown (unchanged)
🆕 Target Version: ${updateInfo?.version || 'Unknown'}
📊 Status: Download error occurred
🔄 Error: ${error.message || 'Unknown download error'}
💡 Suggestion: Retry download or check available storage space`,
        dismissTime: 8000,
      });
    }
  }, [addNotification]);

  useEffect(() => {
    if (!window.electron?.ipc) return;

    // Wrapper for async handleUpdateAvailable
    const handleUpdateAvailableWrapper = (info) => {
      handleUpdateAvailable(info).catch(console.error);
    };

    // Clean up any existing listeners first
    window.electron.ipc.removeAllListeners('update_checking');
    window.electron.ipc.removeAllListeners('update_available');
    window.electron.ipc.removeAllListeners('update_downloaded');
    window.electron.ipc.removeAllListeners('update_error');
    window.electron.ipc.removeAllListeners('update_not_available');
    window.electron.ipc.removeAllListeners('update_download_progress');

    // Set up event listeners
    window.electron.ipc.on('update_checking', handleUpdateChecking);
    window.electron.ipc.on('update_available', handleUpdateAvailableWrapper);
    window.electron.ipc.on('update_downloaded', handleUpdateDownloaded);
    window.electron.ipc.on('update_error', handleUpdateError);
    window.electron.ipc.on('update_not_available', handleUpdateNotAvailable);
    window.electron.ipc.on('update_download_progress', handleDownloadProgress);

    return () => {
      // Clean up listeners
      window.electron.ipc.removeAllListeners('update_checking');
      window.electron.ipc.removeAllListeners('update_available');
      window.electron.ipc.removeAllListeners('update_downloaded');
      window.electron.ipc.removeAllListeners('update_error');
      window.electron.ipc.removeAllListeners('update_not_available');
      window.electron.ipc.removeAllListeners('update_download_progress');
    };
  }, []);

  const restartAndUpdate = useCallback(() => {
    if (!window.electron?.restartAndUpdate) {
      console.warn('Restart and update not available');
      return;
    }
    window.electron.restartAndUpdate();
  }, []);

  const autoUpdateContextValue = {
    updateAvailable,
    updateDownloaded,
    updateError,
    updateNotAvailable,
    isChecking,
    downloadProgress,
    updateInfo,
    currentVersion,
    checkForUpdates,
    downloadUpdate,
    restartAndUpdate,
  };

  return (
    <AutoUpdateContext.Provider value={autoUpdateContextValue}>
      {children}
    </AutoUpdateContext.Provider>
  );
};

export const useAutoUpdateContext = () => useContext(AutoUpdateContext);
