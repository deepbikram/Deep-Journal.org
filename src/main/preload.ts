// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent, shell } from 'electron';
import fs from 'fs';
import path from 'path';

export type Channels = 'ipc-example';

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
  // Environment variables access for renderer process
  env: {
    SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL || 'https://pldjgkcisnddmzndyqbb.supabase.co',
    SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsZGpna2Npc25kZG16bmR5cWJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MzM1OTYsImV4cCI6MjA2NTMwOTU5Nn0.8NxJrqyFwW6CNyB8z-70B42-NcTOwVJOii7sN1L9uj4',
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
