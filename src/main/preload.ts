// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent, shell } from 'electron';
import fs from 'fs';
import path from 'path';

export type Channels = 'ipc-example' | 'restart_app' | 'update_checking' | 'update_available' | 'update_not_available' | 'update_downloaded' | 'update_error' | 'update_download_progress' | 'window-maximized' | 'window-unmaximized' | 'window-resized' | 'oauth-callback' | 'oauth-tokens';

const electronHandler = {
  ipc: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
    invoke: ipcRenderer.invoke,
    removeAllListeners(channel: Channels) {
      ipcRenderer.removeAllListeners(channel);
    },
    removeListener(channel: Channels, func: any) {
      ipcRenderer.removeListener(channel, func);
    },
  },
  setupDeepJournalsFolder: (path: string) => {
    fs.existsSync(path);
  },
  getConfigPath: () => {
    return ipcRenderer.sendSync('get-config-file-path');
  },
  openFolder: (folderPath: string) => {
    if (folderPath.startsWith('/')) {
      shell.openPath(folderPath);
    }
  },
  openExternal: (url: string) => {
    shell.openExternal(url);
  },
  existsSync: (path: string) => fs.existsSync(path),
  readDir: (path: string, callback: any) => fs.readdir(path, callback),
  isDirEmpty: (path: string) =>
    fs.readdir(path, (err, files) => {
      if (err) throw err;
      if (files.length === 0) {
        return true;
      } else {
        return false;
      }
    }),
  readFile: (path: string, callback: any) =>
    fs.readFile(path, 'utf-8', callback),
  deleteFile: (path: string, callback: any) => fs.unlink(path, callback),
  writeFile: (path: string, data: any, callback: any) =>
    fs.writeFile(path, data, 'utf-8', callback),
  mkdir: (path: string) =>
    fs.promises.mkdir(path, {
      recursive: true,
    }),
  joinPath: (...args: any) => path.join(...args),
  isMac: process.platform === 'darwin',
  isWindows: process.platform === 'win32',
  pathSeparator: path.sep,
  settingsGet: (key: string) => ipcRenderer.invoke('electron-store-get', key),
  settingsSet: (key: string, value: string) =>
    ipcRenderer.invoke('electron-store-set', key, value),
  // Auto-updater methods
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  restartAndUpdate: () => ipcRenderer.send('restart_app'),
  getCurrentVersion: () => ipcRenderer.invoke('get-current-version'),
  setAutoUpdatePreference: (enabled: boolean) => ipcRenderer.invoke('set-auto-update-preference', enabled),
  getAutoUpdatePreference: () => ipcRenderer.invoke('get-auto-update-preference'),
  // Window state management
  isWindowMaximized: () => ipcRenderer.invoke('is-window-maximized'),
  onWindowStateChanged: (callback: (isMaximized: boolean) => void) => {
    const handleMaximize = () => callback(true);
    const handleUnmaximize = () => callback(false);
    const handleResize = () => {
      ipcRenderer.invoke('is-window-maximized').then(callback);
    };

    ipcRenderer.on('window-maximized', handleMaximize);
    ipcRenderer.on('window-unmaximized', handleUnmaximize);
    ipcRenderer.on('window-resized', handleResize);

    return () => {
      ipcRenderer.removeListener('window-maximized', handleMaximize);
      ipcRenderer.removeListener('window-unmaximized', handleUnmaximize);
      ipcRenderer.removeListener('window-resized', handleResize);
    };
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
