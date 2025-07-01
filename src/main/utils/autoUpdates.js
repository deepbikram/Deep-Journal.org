const { autoUpdater } = require('electron-updater');
const { ipcMain, app } = require('electron');
const log = require('electron-log');

// Configure logging for electron-updater
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

class AppUpdater {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.updateCheckInProgress = false;
    this.currentCheckPromise = null; // Track ongoing check promise

    log.info('Initializing AppUpdater...');
    log.info(`App is packaged: ${app.isPackaged}`);
    log.info(`NODE_ENV: ${process.env.NODE_ENV}`);

    // Set update server configuration
    this.setupAutoUpdater();

    // Set up IPC handlers
    this.setupIpcHandlers();

    // Set up auto-updater event handlers
    this.setupEventHandlers();

    // Only check for updates in production and if not in development
    // Check user preference for automatic updates
    if (app.isPackaged && process.env.AUTO_UPDATE_ON_START !== 'false') {
      // Delay startup check to allow settings to load
      setTimeout(async () => {
        try {
          // You could check user preferences here from electron-store
          // For now, we'll make it opt-in by checking an environment variable
          const shouldAutoCheck = process.env.ENABLE_AUTO_UPDATE_CHECK === 'true';

          if (shouldAutoCheck) {
            log.info('Starting automatic update check on app startup...');
            this.checkForUpdates();
          } else {
            log.info('Automatic update check disabled by user preference or default setting');
          }
        } catch (error) {
          log.error('Error checking auto-update preference:', error);
        }
      }, 3000);
    } else {
      log.info('Development mode or auto-update disabled - skipping automatic update check');
    }
  }

  setupAutoUpdater() {
    // Configure auto-updater
    autoUpdater.autoDownload = false; // Don't auto-download, let user choose
    autoUpdater.autoInstallOnAppQuit = true;

    // Force dev updates for testing in development mode
    autoUpdater.forceDevUpdateConfig = true;

    // Set update server (GitHub releases)
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'deepbikram',
      repo: 'Deep-Journal.org'
    });

    log.info('Auto-updater configured with forceDevUpdateConfig: true');
    // Enhanced version display update - comprehensive status system
  }

  setupIpcHandlers() {
    // Handle manual update check from renderer
    ipcMain.handle('check-for-updates', async () => {
      return this.checkForUpdates();
    });

    // Handle restart app request
    ipcMain.on('restart_app', () => {
      log.info('Restart app requested');
      autoUpdater.quitAndInstall(false, true);
    });

    // Handle download update request
    ipcMain.handle('download-update', async () => {
      try {
        await autoUpdater.downloadUpdate();
        return { success: true };
      } catch (error) {
        log.error('Download update error:', error);
        return { success: false, error: error.message };
      }
    });

    // Handle get current version request
    ipcMain.handle('get-current-version', () => {
      const version = app.getVersion();
      log.info(`Current app version requested: ${version}`);
      return version;
    });

    // Handle update check reset (for debugging)
    ipcMain.handle('reset-update-check', () => {
      log.info('Resetting update check flag');
      this.updateCheckInProgress = false;
      return { success: true };
    });

    // Handle auto-update preference
    ipcMain.handle('set-auto-update-preference', (event, enabled) => {
      log.info(`Setting auto-update preference to: ${enabled}`);
      // For now, we'll store in a simple variable, but this could be enhanced with electron-store
      global.autoUpdateEnabled = enabled;
      return { success: true, enabled };
    });

    ipcMain.handle('get-auto-update-preference', () => {
      // Return stored preference, default to false (opt-in)
      const enabled = global.autoUpdateEnabled !== undefined ? global.autoUpdateEnabled : false;
      return { success: true, enabled };
    });

    // Handle manual GitHub page opening for manual updates
    ipcMain.handle('open-releases-page', () => {
      const { shell } = require('electron');
      const repoUrl = 'https://github.com/deepbikram/Deep-Journal.org/releases';
      log.info(`Opening releases page: ${repoUrl}`);
      shell.openExternal(repoUrl);
      return { success: true };
    });
  }

  setupEventHandlers() {
    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for update...');
      this.mainWindow.webContents.send('update_checking');
    });

    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info);
      this.updateCheckInProgress = false;
      this.mainWindow.webContents.send('update_available', {
        version: info.version,
        releaseNotes: info.releaseNotes,
        releaseDate: info.releaseDate
      });
    });

    autoUpdater.on('update-not-available', (info) => {
      const currentVersion = app.getVersion();
      log.info(`Update not available - current version: ${currentVersion}, latest: ${info.version}`);
      this.updateCheckInProgress = false;
      this.mainWindow.webContents.send('update_not_available', {
        version: info.version || currentVersion,
        currentVersion: currentVersion
      });
    });

    autoUpdater.on('error', (error) => {
      log.error('Auto updater error:', error);
      this.updateCheckInProgress = false;
      
      // Check if it's the specific 404 error for missing latest-mac.yml
      if (error.message && error.message.includes('latest-mac.yml') && error.message.includes('404')) {
        // This is a known issue where the release files are missing
        this.mainWindow.webContents.send('update_error', {
          message: 'Unable to check for updates: Release metadata missing. Please check manually on GitHub.',
          type: 'MISSING_RELEASE_FILES',
          stack: error.stack
        });
      } else if (error.message && error.message.includes('HttpError: 404')) {
        // General 404 errors - likely network or repository issues
        this.mainWindow.webContents.send('update_error', {
          message: 'Unable to check for updates: Network or repository error. Please try again later.',
          type: 'NETWORK_ERROR',
          stack: error.stack
        });
      } else {
        // Other errors
        this.mainWindow.webContents.send('update_error', {
          message: error.message,
          type: 'UNKNOWN_ERROR',
          stack: error.stack
        });
      }
    });

    autoUpdater.on('download-progress', (progressObj) => {
      log.info('Download progress:', progressObj);
      this.mainWindow.webContents.send('update_download_progress', {
        bytesPerSecond: progressObj.bytesPerSecond,
        percent: progressObj.percent,
        transferred: progressObj.transferred,
        total: progressObj.total
      });
    });

    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info);
      this.mainWindow.webContents.send('update_downloaded', {
        version: info.version,
        releaseNotes: info.releaseNotes
      });
    });
  }

  async checkForUpdates() {
    const checkId = Date.now(); // Unique ID for this check
    log.info(`[${checkId}] Update check requested. Current state: ${this.updateCheckInProgress ? 'IN_PROGRESS' : 'IDLE'}`);

    // If a check is already in progress, wait for it to complete
    if (this.updateCheckInProgress && this.currentCheckPromise) {
      log.info(`[${checkId}] Update check already in progress, waiting for completion...`);

      try {
        const result = await this.currentCheckPromise;
        log.info(`[${checkId}] Previous check completed, returning result:`, result);
        return result;
      } catch (error) {
        log.error(`[${checkId}] Previous check failed:`, error);
        // Continue with new check if previous one failed
      }
    }

    // Start new check
    this.updateCheckInProgress = true;
    log.info(`[${checkId}] Starting new update check...`);

    // Create promise for this check
    this.currentCheckPromise = this._performUpdateCheck(checkId);

    try {
      const result = await this.currentCheckPromise;
      return result;
    } finally {
      // Always clean up state
      this.updateCheckInProgress = false;
      this.currentCheckPromise = null;
      log.info(`[${checkId}] Update check completed, state reset`);
    }
  }

  async _performUpdateCheck(checkId) {
    try {
      // Send checking event to renderer
      log.info(`[${checkId}] Sending 'update_checking' event to renderer`);
      this.mainWindow.webContents.send('update_checking');

      // Add a small delay for better UX (shows loading state)
      await new Promise(resolve => setTimeout(resolve, 1000));

      log.info(`[${checkId}] Calling autoUpdater.checkForUpdatesAndNotify()...`);
      const result = await autoUpdater.checkForUpdatesAndNotify();
      log.info(`[${checkId}] autoUpdater result:`, result);

      // Handle the result
      if (!result) {
        const currentVersion = app.getVersion();
        log.info(`[${checkId}] No updates available - current version: ${currentVersion}`);

        this.mainWindow.webContents.send('update_not_available', {
          version: currentVersion,
          currentVersion: currentVersion
        });

        return {
          success: true,
          message: `You're on the latest version (v${currentVersion})`,
          checkId: checkId
        };
      }

      log.info(`[${checkId}] Update check completed with result`);
      return {
        success: true,
        result,
        checkId: checkId
      };

    } catch (error) {
      log.error(`[${checkId}] Update check error:`, error);

      // Handle specific error types
      let errorMessage = error.message;
      let errorType = 'UNKNOWN_ERROR';

      if (error.message && error.message.includes('latest-mac.yml') && error.message.includes('404')) {
        errorMessage = 'Unable to check for updates: The release metadata is missing from GitHub. This is a temporary issue that will be resolved in the next release.';
        errorType = 'MISSING_RELEASE_FILES';
      } else if (error.message && error.message.includes('HttpError: 404')) {
        errorMessage = 'Unable to check for updates: Could not connect to update server. Please check your internet connection and try again.';
        errorType = 'NETWORK_ERROR';
      } else if (error.message && error.message.includes('ENOTFOUND')) {
        errorMessage = 'Unable to check for updates: No internet connection available.';
        errorType = 'NO_INTERNET';
      }

      this.mainWindow.webContents.send('update_error', {
        message: errorMessage,
        type: errorType,
        originalError: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: errorMessage,
        type: errorType,
        checkId: checkId
      };
    }
  }
}

export default AppUpdater;
