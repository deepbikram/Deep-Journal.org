/* eslint global-require: off, no-console: off, promise/always-return: off */
import {
  app,
  BrowserWindow,
  shell,
  protocol,
  net,
  Menu,
  nativeTheme,
  session,
} from 'electron';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import fs from 'fs';
import path from 'path';
import './ipc';
import './handlers/window';
import AppUpdater from './utils/autoUpdates';
import { setupOAuthHandler } from './utils/oauthHandler';

Menu.setApplicationMenu(null);

let mainWindow: BrowserWindow | null = null;

// Single instance lock to handle OAuth redirects properly
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window instead.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const setupDeepJournalsFolder = () => {
  const userHomeDirectoryPath = app.getPath('home');
  const deepJournalsFolder = path.join(userHomeDirectoryPath, 'Deep Journals');

  if (!fs.existsSync(deepJournalsFolder)) {
    fs.mkdirSync(deepJournalsFolder);
  }
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 960,
    height: 800,
    minWidth: 660,
    minHeight: 660,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
    frame: false,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 18, y: 16 },
    transparent: process.platform === 'darwin',
    vibrancy: 'sidebar',
    titleBarOverlay: {
      color: '#00000000',
      symbolColor: nativeTheme.shouldUseDarkColors ? 'white' : 'black',
      height: 50,
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Add window state event listeners for timeline behavior
  mainWindow.on('maximize', () => {
    if (mainWindow) {
      mainWindow.webContents.send('window-maximized');
    }
  });

  mainWindow.on('unmaximize', () => {
    if (mainWindow) {
      mainWindow.webContents.send('window-unmaximized');
    }
  });

  mainWindow.on('resize', () => {
    if (mainWindow) {
      mainWindow.webContents.send('window-resized');
    }
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // setupAutoUpdater(mainWindow);
  new AppUpdater(mainWindow);

  // Setup OAuth callback handling
  setupOAuthHandler(mainWindow);
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    protocol.handle('local', async (request) => {
      try {
        const filePath = request.url.slice('local://'.length);
        // Decode URI components to handle special characters
        const decodedPath = decodeURIComponent(filePath);

        // Check if file exists
        if (!fs.existsSync(decodedPath)) {
          console.error('Local protocol - File not found:', decodedPath);
          throw new Error(`File not found: ${decodedPath}`);
        }

        // Read file and return as Response
        const fileBuffer = fs.readFileSync(decodedPath);
        const ext = path.extname(decodedPath).toLowerCase();

        // Get appropriate MIME type
        let mimeType = 'application/octet-stream';
        const mimeTypes: { [key: string]: string } = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.svg': 'image/svg+xml',
          '.webp': 'image/webp'
        };

        if (mimeTypes[ext]) {
          mimeType = mimeTypes[ext];
        }

        return new Response(fileBuffer, {
          headers: {
            'Content-Type': mimeType,
            'Content-Length': fileBuffer.length.toString()
          }
        });
      } catch (error) {
        console.error('Error handling local protocol:', error);
        return new Response('File not found', { status: 404 });
      }
    });

    setupDeepJournalsFolder();
    createWindow();

    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
