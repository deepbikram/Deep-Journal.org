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

    // Set update server configuration
    this.setupAutoUpdater();

    // Set up IPC handlers
    this.setupIpcHandlers();

    // Set up auto-updater event handlers
    this.setupEventHandlers();

    // Only check for updates in production and if not in development
    if (app.isPackaged) {
      // Check for updates on app start (with a delay to ensure app is ready)
      setTimeout(() => {
        this.checkForUpdates();
      }, 3000);
    }
  }

  setupAutoUpdater() {
    // Configure auto-updater
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    // Set update server (GitHub releases)
    if (process.env.NODE_ENV === 'production') {
      autoUpdater.setFeedURL({
        provider: 'github',
        owner: 'your-username-here',
        repo: 'deep-journal'
      });
    }
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
      log.info('Update not available:', info);
      this.updateCheckInProgress = false;
      this.mainWindow.webContents.send('update_not_available', {
        version: info.version
      });
    });

    autoUpdater.on('error', (error) => {
      log.error('Auto updater error:', error);
      this.updateCheckInProgress = false;
      this.mainWindow.webContents.send('update_error', {
        message: error.message,
        stack: error.stack
      });
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
    if (this.updateCheckInProgress) {
      log.info('Update check already in progress');
      return { success: false, message: 'Update check already in progress' };
    }

    if (!app.isPackaged) {
      log.info('App is not packaged, skipping update check');
      return { success: false, message: 'Update check only available in production builds' };
    }

    try {
      this.updateCheckInProgress = true;
      const result = await autoUpdater.checkForUpdatesAndNotify();
      log.info('Update check result:', result);
      return { success: true, result };
    } catch (error) {
      log.error('Update check error:', error);
      this.updateCheckInProgress = false;
      this.mainWindow.webContents.send('update_error', {
        message: error.message,
        stack: error.stack
      });
      return { success: false, error: error.message };
    }
  }
}

export default AppUpdater;
