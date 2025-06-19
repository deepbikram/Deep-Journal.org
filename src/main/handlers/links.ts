import { ipcMain } from 'electron';
import deepJournalLinks from '../utils/deep-journal-links';
import { getLinkPreview, getLinkContent } from '../utils/linkPreview';

ipcMain.handle('links-get', (event, deepJournalPath, url) => {
  const data = deepJournalLinks.get(deepJournalPath, url);
  return data;
});

ipcMain.handle('links-set', (event, deepJournalPath, url, data) => {
  const status = deepJournalLinks.set(deepJournalPath, url, data);
  return status;
});

ipcMain.handle('get-link-preview', async (event, url) => {
  try {
    return await getLinkPreview(url);
  } catch {
    return null;
  }
});

ipcMain.handle('get-link-content', async (event, url) => {
  try {
    return await getLinkContent(url);
  } catch {
    return null;
  }
});
