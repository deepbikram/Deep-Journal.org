import React from 'react';
import styles from './UpdateButton.module.scss';
import { RefreshIcon, DownloadIcon } from 'renderer/icons';
import { useAutoUpdateContext } from 'renderer/context/AutoUpdateContext';

const UpdateButton = () => {
  const {
    isChecking,
    updateAvailable,
    updateDownloaded,
    checkForUpdates,
    downloadUpdate,
    restartAndUpdate,
    downloadProgress
  } = useAutoUpdateContext();

  const handleClick = () => {
    if (updateDownloaded) {
      restartAndUpdate();
    } else if (updateAvailable) {
      downloadUpdate();
    } else {
      checkForUpdates();
    }
  };

  const getButtonText = () => {
    if (updateDownloaded) {
      return 'Restart to Update';
    } else if (updateAvailable) {
      if (downloadProgress) {
        return `Downloading... ${Math.round(downloadProgress.percent)}%`;
      }
      return 'Download Update';
    } else if (isChecking) {
      return 'Checking for Updates...';
    } else {
      return 'Check for Updates';
    }
  };

  const getIcon = () => {
    if (updateDownloaded || updateAvailable) {
      return <DownloadIcon className={styles.icon} />;
    }
    return <RefreshIcon className={styles.icon} />;
  };

  return (
    <button
      className={`${styles.updateButton} ${isChecking ? styles.checking : ''} ${updateAvailable ? styles.available : ''} ${updateDownloaded ? styles.ready : ''}`}
      onClick={handleClick}
      disabled={isChecking}
    >
      {getIcon()}
      {getButtonText()}
      {downloadProgress && updateAvailable && !updateDownloaded && (
        <div
          className={styles.progressBar}
          style={{ width: `${downloadProgress.percent}%` }}
        />
      )}
    </button>
  );
};

export default UpdateButton;
