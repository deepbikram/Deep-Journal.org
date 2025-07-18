import { ipcMain, BrowserWindow } from 'electron';

// Window state handlers
ipcMain.handle('is-window-maximized', async () => {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow) {
    return focusedWindow.isMaximized();
  }

  // Fallback to first window if no focused window
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length > 0) {
    return allWindows[0].isMaximized();
  }

  return false;
});
