import React from 'react';
import styles from './UpdateNotification.module.scss';
import { DownloadIcon, RefreshIcon, CrossIcon } from 'renderer/icons';
import { useAutoUpdateContext } from 'renderer/context/AutoUpdateContext';
import { motion, AnimatePresence } from 'framer-motion';

const UpdateNotification = () => {
  const {
    updateAvailable,
    updateDownloaded,
    downloadProgress,
    updateInfo,
    downloadUpdate,
    restartAndUpdate,
  } = useAutoUpdateContext();

  if (!updateAvailable && !updateDownloaded) {
    return null;
  }

  const handleAction = () => {
    if (updateDownloaded) {
      restartAndUpdate();
    } else if (updateAvailable) {
      downloadUpdate();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`${styles.notification} ${updateDownloaded ? styles.ready : styles.available}`}
      >
        <div className={styles.content}>
          <div className={styles.text}>
            {updateDownloaded ? (
              <span>Update ready to install</span>
            ) : (
              <span>
                Update available{updateInfo?.version && ` (v${updateInfo.version})`}
              </span>
            )}
          </div>

          {downloadProgress && !updateDownloaded && (
            <div className={styles.progress}>
              <div
                className={styles.progressBar}
                style={{ width: `${downloadProgress.percent}%` }}
              />
              <span className={styles.progressText}>
                {Math.round(downloadProgress.percent)}%
              </span>
            </div>
          )}
        </div>

        <button
          className={styles.actionButton}
          onClick={handleAction}
        >
          {updateDownloaded ? (
            <>
              <RefreshIcon className={styles.icon} />
              Restart
            </>
          ) : (
            <>
              <DownloadIcon className={styles.icon} />
              Download
            </>
          )}
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpdateNotification;
