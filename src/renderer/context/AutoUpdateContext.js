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

  const handleUpdateChecking = () => {
    console.log('Update check started - setting checking state');
    setIsChecking(true);
    setUpdateError(null);
    setUpdateNotAvailable(false);
    removeNotification('update-check-failed');
    
    // Show comprehensive initial status
    addNotification({
      id: 'update-checking',
      type: 'info',
      message: 'Update Check Started: Checking GitHub for the latest version...',
      dismissTime: 15000, // Longer timeout for checking phase
    });
  };

  const handleUpdateAvailable = async (info) => {
    console.log('Update available:', info);
    setIsChecking(false);
    setUpdateAvailable(true);
    setUpdateInfo(info);
    removeNotification('update-checking');

    // Get current version for clear display
    let currentVersion = '1.2.0';
    try {
      if (window.electron?.getCurrentVersion) {
        currentVersion = await window.electron.getCurrentVersion();
      }
    } catch (error) {
      console.warn('Could not get current version:', error);
    }
    
    const newVersion = info.version;

    // Show comprehensive update available status
    addNotification({
      id: 'update-available-details',
      type: 'success',
      message: `🎉 New Update Available!
📱 Current Version: v${currentVersion}
🆕 New Version: v${newVersion}
📊 Status: Update ready to download
📅 Release Date: ${info.releaseDate ? new Date(info.releaseDate).toLocaleDateString() : 'Unknown'}
🔄 Action Required: Click 'Download Update' button`,
      dismissTime: 12000, // Show for 12 seconds
    });
  };

  const handleUpdateDownloaded = (info) => {
    console.log('Update downloaded:', info);
    removeNotification('update-downloading');
    setUpdateDownloaded(true);
    setUpdateInfo(info);

    addNotification({
      id: 'update-downloaded-ready',
      type: 'success',
      message: `📥 Update Downloaded Successfully!
📱 Current Version: Will update from v1.2.0
🆕 New Version: v${info.version}
📊 Status: Ready to install
🔄 Action Required: Click 'Restart to Update' to complete installation
⚠️ Note: App will restart to apply the update`,
      dismissTime: 15000, // Longer time for important action
    });
  };

  const handleUpdateError = (error) => {
    console.log('Update error:', error);
    setIsChecking(false);
    removeNotification('update-downloading');
    removeNotification('update-checking');

    addNotification({
      id: 'update-error-details',
      type: 'failed',
      message: `❌ Update Check Failed!
📱 Current Version: v1.2.0 (unchanged)
🌐 GitHub Status: Connection failed
📊 Status: Update check unsuccessful
🔄 Error: ${error.message || 'Unknown error occurred'}
💡 Suggestion: Check internet connection and try again`,
      dismissTime: 10000,
    });

    setUpdateError(error);
  };

  const handleUpdateNotAvailable = (info) => {
    console.log('No updates available:', info);
    setIsChecking(false);
    setUpdateNotAvailable(true);
    removeNotification('update-checking');

    const currentVersion = info.currentVersion || '1.2.0';
    const latestVersion = info.version || currentVersion;
    
    // Show comprehensive completion status
    addNotification({
      id: 'update-status-complete',
      message: `✅ Update Check Complete!
📱 Current Version: v${currentVersion}
🌐 Latest Available: v${latestVersion}
📊 Status: You're running the latest version
🔄 Last Check: ${new Date().toLocaleTimeString()}`,
      type: 'success',
      dismissTime: 10000, // Show for 10 seconds
    });
  };

  const handleDownloadProgress = (progress) => {
    setDownloadProgress(progress);
    
    // Show detailed download progress
    addNotification({
      id: 'download-progress-status',
      type: 'info',
      message: `📥 Downloading Update...
📊 Progress: ${Math.round(progress.percent)}%
📱 Size: ${Math.round(progress.transferred / 1024 / 1024)}MB / ${Math.round(progress.total / 1024 / 1024)}MB
🌐 Speed: ${Math.round(progress.bytesPerSecond / 1024)}KB/s
⏱️ Please keep the app open while downloading...`,
      dismissTime: 2000, // Short time, will be updated frequently
    });
  };

  // Manual update check function
  const checkForUpdates = useCallback(async () => {
    if (!window.electron?.checkForUpdates) {
      console.warn('Update check not available');
      addNotification({
        id: 'update-check-unavailable-details',
        type: 'failed',
        message: `⚠️ Update Check Unavailable!
📱 Current Version: v1.2.0 (unchanged)
🌐 GitHub Status: API not accessible
📊 Status: Update functionality disabled
🔄 Reason: Update check functionality not available
💡 Note: This may occur in development mode or restricted environments`,
        dismissTime: 8000,
      });
      return;
    }

    try {
      console.log('Starting update check...');
      setIsChecking(true);
      setUpdateError(null);
      setUpdateNotAvailable(false);

      // Show initial checking notification with comprehensive info
      addNotification({
        id: 'update-checking-manual',
        type: 'info',
        message: `🔍 Manual Update Check Started...
📱 Current Version: Detecting...
🌐 Checking: GitHub Releases API
📊 Status: Connecting to update server
⏱️ Please wait while we check for updates...`,
        dismissTime: 15000,
      });

      const result = await window.electron.checkForUpdates();
      console.log('Update check result:', result);

      // Remove checking notification
      removeNotification('update-checking');
      removeNotification('update-checking-manual');

      if (result.success) {
        // Success case is handled by the IPC event listeners
        // (update_available, update_not_available)
        console.log('Update check completed successfully:', result.message || 'Check completed');
      } else {
        addNotification({
          id: 'update-check-failed-details',
          type: 'failed',
          message: `❌ Update Check Failed!
📱 Current Version: v1.2.0 (unchanged)
🌐 GitHub Status: Request failed
📊 Status: Manual check unsuccessful
🔄 Error: ${result.message || 'Failed to check for updates'}
💡 Suggestion: Verify internet connection and try again`,
          dismissTime: 10000,
        });
        setUpdateError({ message: result.message || 'Update check failed' });
      }
    } catch (error) {
      console.error('Manual update check failed:', error);
      removeNotification('update-checking');
      removeNotification('update-checking-manual');
      
      addNotification({
        id: 'update-check-error-details',
        type: 'failed',
        message: `❌ Update Check Error!
📱 Current Version: v1.2.0 (unchanged)
🌐 GitHub Status: Connection error
📊 Status: Network or server issue
🔄 Error: ${error.message || 'Unknown error occurred'}
💡 Suggestion: Check internet connection and try again later`,
        dismissTime: 10000,
      });
      setUpdateError(error);
    } finally {
      // The isChecking state will be reset by IPC event handlers
      // or after a timeout to ensure it doesn't get stuck
      setTimeout(() => {
        setIsChecking(false);
      }, 500);
    }
  }, [addNotification, removeNotification]);

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
📱 Current Version: v1.2.0 (unchanged)
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
📱 Current Version: v1.2.0 (unchanged)
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
