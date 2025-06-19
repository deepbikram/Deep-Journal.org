import React from 'react';
import styles from './UpdateStatusPanel.module.scss';
import { useAutoUpdateContext } from 'renderer/context/AutoUpdateContext';
import { RefreshIcon, DownloadIcon, CheckboxIcon, CrossIcon, InfoIcon } from 'renderer/icons';

const UpdateStatusPanel = ({ variant = 'default' }) => {
  const {
    isChecking,
    updateAvailable,
    updateDownloaded,
    updateError,
    updateNotAvailable,
    updateInfo,
    downloadProgress,
    checkForUpdates,
    downloadUpdate,
    restartAndUpdate,
  } = useAutoUpdateContext();

  const getCurrentVersion = () => {
    try {
      return window.electron?.getCurrentVersion ? 'v1.2.0' : 'v1.2.0';
    } catch {
      return 'v1.2.0';
    }
  };

  const renderStatusIcon = () => {
    if (isChecking) return <RefreshIcon className={`${styles.icon} ${styles.spinning}`} />;
    if (updateError) return <CrossIcon className={`${styles.icon} ${styles.error}`} />;
    if (updateDownloaded) return <CheckboxIcon className={`${styles.icon} ${styles.success}`} />;
    if (updateAvailable) return <DownloadIcon className={`${styles.icon} ${styles.available}`} />;
    if (updateNotAvailable) return <CheckboxIcon className={`${styles.icon} ${styles.success}`} />;
    return <InfoIcon className={`${styles.icon} ${styles.default}`} />;
  };

  const renderMainStatus = () => {
    if (isChecking) return 'Checking for Updates...';
    if (updateError) return 'Update Check Failed';
    if (updateDownloaded) return 'Update Ready to Install';
    if (updateAvailable) return 'Update Available';
    if (updateNotAvailable) return 'Up to Date';
    return 'Check for Updates';
  };

  const renderDetailedInfo = () => {
    const currentVersion = getCurrentVersion();
    const latestVersion = updateInfo?.version ? `v${updateInfo.version}` : currentVersion;
    const releaseDate = updateInfo?.releaseDate 
      ? new Date(updateInfo.releaseDate).toLocaleDateString()
      : 'Unknown';

    return (
      <div className={styles.details}>
        <div className={styles.versionRow}>
          <span className={styles.label}>Current Version:</span>
          <span className={styles.value}>{currentVersion}</span>
        </div>
        
        <div className={styles.versionRow}>
          <span className={styles.label}>Latest Version:</span>
          <span className={styles.value}>{latestVersion}</span>
        </div>

        {updateAvailable && (
          <div className={styles.versionRow}>
            <span className={styles.label}>Release Date:</span>
            <span className={styles.value}>{releaseDate}</span>
          </div>
        )}

        <div className={styles.versionRow}>
          <span className={styles.label}>Status:</span>
          <span className={`${styles.value} ${styles.status}`}>
            {renderMainStatus()}
          </span>
        </div>

        {updateError && (
          <div className={styles.versionRow}>
            <span className={styles.label}>Error:</span>
            <span className={`${styles.value} ${styles.errorText}`}>
              {updateError.message || 'Unknown error occurred'}
            </span>
          </div>
        )}

        {downloadProgress && updateAvailable && !updateDownloaded && (
          <div className={styles.progressSection}>
            <div className={styles.progressLabel}>
              Download Progress: {Math.round(downloadProgress.percent)}%
            </div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${downloadProgress.percent}%` }}
              />
            </div>
            <div className={styles.progressDetails}>
              {Math.round(downloadProgress.transferred / 1024 / 1024)}MB / {Math.round(downloadProgress.total / 1024 / 1024)}MB 
              • {Math.round(downloadProgress.bytesPerSecond / 1024)}KB/s
            </div>
          </div>
        )}

        <div className={styles.versionRow}>
          <span className={styles.label}>Last Check:</span>
          <span className={styles.value}>{new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    );
  };

  const renderActionButton = () => {
    if (updateDownloaded) {
      return (
        <button 
          className={`${styles.actionBtn} ${styles.restart}`}
          onClick={restartAndUpdate}
        >
          <RefreshIcon className={styles.btnIcon} />
          Restart to Update
        </button>
      );
    }

    if (updateAvailable) {
      return (
        <button 
          className={`${styles.actionBtn} ${styles.download}`}
          onClick={downloadUpdate}
          disabled={!!downloadProgress}
        >
          <DownloadIcon className={styles.btnIcon} />
          {downloadProgress ? 'Downloading...' : 'Download Update'}
        </button>
      );
    }

    return (
      <button 
        className={`${styles.actionBtn} ${styles.check}`}
        onClick={checkForUpdates}
        disabled={isChecking}
      >
        <RefreshIcon className={styles.btnIcon} />
        {isChecking ? 'Checking...' : 'Check for Updates'}
      </button>
    );
  };

  return (
    <div className={`${styles.panel} ${variant === 'settings' ? styles.settings : ''}`}>
      <div className={styles.header}>
        {renderStatusIcon()}
        <div className={styles.headerText}>
          <h3 className={styles.title}>Update Status</h3>
          <p className={styles.subtitle}>{renderMainStatus()}</p>
        </div>
      </div>

      {renderDetailedInfo()}

      <div className={styles.actions}>
        {renderActionButton()}
      </div>
    </div>
  );
};

export default UpdateStatusPanel;
