import { ipcMain } from 'electron';
import deepJournalTags from '../utils/deep-journal-tags';

ipcMain.handle('tags-load', (event, deepJournalPath) => {
  const tags = deepJournalTags.load(deepJournalPath);
  return tags;
});

ipcMain.handle('tags-get', (event) => {
  const tags = deepJournalTags.get();
  return tags;
});

ipcMain.handle('tags-sync', (event, filePath) => {
  deepJournalTags.sync(filePath);
});

ipcMain.handle('tags-add', (event, { tag, filePath }) => {
  deepJournalTags.add(tag, filePath);
});

ipcMain.handle('tags-remove', (event, { tag, filePath }) => {
  deepJournalTags.remove(tag, filePath);
});
