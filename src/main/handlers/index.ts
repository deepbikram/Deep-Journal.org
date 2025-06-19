import { ipcMain } from 'electron';
import deepJournalIndex from '../utils/deep-journal-index';

ipcMain.handle('index-load', async (event, deepJournalPath) => {
  const index = await deepJournalIndex.load(deepJournalPath);
  return index;
});

ipcMain.handle('index-get', (event) => {
  const index = deepJournalIndex.get();
  return index;
});

ipcMain.handle('index-regenerate-embeddings', (event) => {
  const index = deepJournalIndex.regenerateEmbeddings();
  return index;
});

ipcMain.handle('index-add', (event, filePath) => {
  const index = deepJournalIndex.add(filePath);
  return index;
});

ipcMain.handle('index-update', (event, filePath, data) => {
  const index = deepJournalIndex.update(filePath, data);
  return index;
});

ipcMain.handle('index-search', (event, query) => {
  const results = deepJournalIndex.search(query);
  return results;
});

ipcMain.handle('index-vector-search', (event, query, topN = 50) => {
  const results = deepJournalIndex.vectorSearch(query);
  return results;
});

ipcMain.handle('index-get-threads-as-text', (event, filePaths = []) => {
  const results = [];

  for (const filePath of filePaths) {
    const entry = deepJournalIndex.getThreadAsText(filePath);
    results.push(entry);
  }
  return results;
});

ipcMain.handle('index-remove', (event, filePath) => {
  const index = deepJournalIndex.remove(filePath);
  return index;
});
