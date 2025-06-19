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
    setIsChecking(true);
    setUpdateError(null);
    setUpdateNotAvailable(false);
  };

  const handleUpdateAvailable = (info) => {
    setIsChecking(false);
    setUpdateAvailable(true);
    setUpdateInfo(info);

    addNotification({
      id: 'update-available',
      type: 'success',
      message: `Update available: v${info.version}`,
      dismissTime: 3000,
    });

    addNotification({
      id: 'update-downloading',
      type: 'waiting',
      message: 'Downloading update...',
      dismissTime: 10000,
    });
  };

  const handleUpdateDownloaded = (info) => {
    removeNotification('update-downloading');
    setUpdateDownloaded(true);
    setUpdateInfo(info);

    addNotification({
      id: 'update-ready',
      type: 'success',
      message: 'Update ready to install',
      dismissTime: 5000,
    });
  };

  const handleUpdateError = (error) => {
    setIsChecking(false);
    removeNotification('update-downloading');

    addNotification({
      id: 'update-error',
      type: 'failed',
      message: 'Update failed: ' + error.message,
      dismissTime: 5000,
    });

    setUpdateError(error);
  };

  const handleUpdateNotAvailable = (info) => {
    setIsChecking(false);
    setUpdateNotAvailable(true);

    addNotification({
      id: 'update-not-available',
      message: 'Deep Journal is up-to-date',
      type: 'success',
      dismissTime: 3000,
    });
  };

  const handleDownloadProgress = (progress) => {
    setDownloadProgress(progress);
  };

  // Manual update check function
  const checkForUpdates = useCallback(async () => {
    if (!window.electron?.checkForUpdates) {
      console.warn('Update check not available');
      return;
    }

    try {
      setIsChecking(true);
      const result = await window.electron.checkForUpdates();

      if (!result.success) {
        addNotification({
          id: 'update-check-failed',
          type: 'failed',
          message: result.message || 'Failed to check for updates',
          dismissTime: 3000,
        });
        setIsChecking(false);
      }
    } catch (error) {
      console.error('Manual update check failed:', error);
      addNotification({
        id: 'update-check-failed',
        type: 'failed',
        message: 'Failed to check for updates',
        dismissTime: 3000,
      });
      setIsChecking(false);
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
          id: 'download-failed',
          type: 'failed',
          message: 'Failed to download update',
          dismissTime: 3000,
        });
      }
    } catch (error) {
      console.error('Manual download failed:', error);
      addNotification({
        id: 'download-failed',
        type: 'failed',
        message: 'Failed to download update',
        dismissTime: 3000,
      });
    }
  }, [addNotification]);

  useEffect(() => {
    if (!window.electron?.ipc) return;

    // Set up event listeners
    window.electron.ipc.on('update_checking', handleUpdateChecking);
    window.electron.ipc.on('update_available', handleUpdateAvailable);
    window.electron.ipc.on('update_downloaded', handleUpdateDownloaded);
    window.electron.ipc.on('update_error', handleUpdateError);
    window.electron.ipc.on('update_not_available', handleUpdateNotAvailable);
    window.electron.ipc.on('update_download_progress', handleDownloadProgress);

    return () => {
      // Clean up listeners
      window.electron.ipc.removeListener('update_checking', handleUpdateChecking);
      window.electron.ipc.removeListener('update_available', handleUpdateAvailable);
      window.electron.ipc.removeListener('update_downloaded', handleUpdateDownloaded);
      window.electron.ipc.removeListener('update_error', handleUpdateError);
      window.electron.ipc.removeListener('update_not_available', handleUpdateNotAvailable);
      window.electron.ipc.removeListener('update_download_progress', handleDownloadProgress);
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
