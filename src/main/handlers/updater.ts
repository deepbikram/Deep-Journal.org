import { ipcMain, app } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';

// Set up auto-updater IPC handlers
export const setupAutoUpdaterIPC = (mainWindow: any) => {
  // Handle manual update check
  ipcMain.handle('check-for-updates', async () => {
    try {
      log.info('Manual update check requested');
      const result = await autoUpdater.checkForUpdatesAndNotify();
      return { success: true, result };
    } catch (error: any) {
      log.error('Manual update check failed:', error);
      return { success: false, error: error.message };
    }
  });

  // Handle download update request
  ipcMain.handle('download-update', async () => {
    try {
      log.info('Manual update download requested');
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (error: any) {
      log.error('Manual update download failed:', error);
      return { success: false, error: error.message };
    }
  });

  // Handle restart and install
  ipcMain.on('restart_app', () => {
    log.info('Restart and install requested');
    autoUpdater.quitAndInstall(false, true);
  });

  // Handle getting update info
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });
};
