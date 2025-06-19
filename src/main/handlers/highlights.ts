import { ipcMain } from 'electron';
import deepJournalHighlights from '../utils/deep-journal-highlights';

ipcMain.handle('highlights-load', (event, deepJournalPath) => {
  const highlights = deepJournalHighlights.load(deepJournalPath);
  return highlights;
});

ipcMain.handle('highlights-get', (event) => {
  const highlights = deepJournalHighlights.get();
  return highlights;
});

ipcMain.handle('highlights-create', (event, highlight) => {
  deepJournalHighlights.create(highlight);
});

ipcMain.handle('highlights-delete', (event, highlight) => {
  deepJournalHighlights.delete(highlight);
});
