import {
  useState,
  createContext,
  useContext,
  useEffect,
  useCallback,
} from 'react';
import { useLocation } from 'react-router-dom';
import { useDeepJournalsContext } from './DeepJournalsContext';

export const TagsContext = createContext();

export const TagsContextProvider = ({ children }) => {
  const { currentDeepJournal, getCurrentDeepJournalPath } = useDeepJournalsContext();
  const [tags, setTags] = useState(new Map());

  useEffect(() => {
    if (currentDeepJournal) {
      const path = getCurrentDeepJournalPath();
      if (path) {
        loadTags(path);
      }
    }
  }, [currentDeepJournal]);

  const loadTags = useCallback(async (deepJournalPath) => {
    if (!window.electron?.ipc?.invoke) {
      console.warn('Electron IPC not available, skipping tags load');
      return;
    }
    const newTags = await window.electron.ipc.invoke('tags-load', deepJournalPath);
    const newMap = new Map(newTags);
    setTags(newMap);
  }, []);

  const refreshTags = useCallback(async () => {
    if (!window.electron?.ipc?.invoke) {
      console.warn('Electron IPC not available, skipping tags refresh');
      return;
    }
    const newTags = await window.electron.ipc.invoke('tags-get');
    const newMap = new Map(newTags);
    setTags(newMap);
  }, []);

  const syncTags = useCallback(async (filePath) => {
    if (window.electron?.ipc?.invoke) {
      window.electron.ipc.invoke('tags-sync', filePath).then((tags) => {
        setTags(tags);
      });
    }
  }, []);

  const addTag = useCallback(async (tag, filePath) => {
    if (window.electron?.ipc?.invoke) {
      window.electron.ipc.invoke('tags-add', { tag, filePath }).then((tags) => {
        setTags(tags);
      });
    }
  }, []);

  const removeTag = useCallback(async (tag, filePath) => {
    if (window.electron?.ipc?.invoke) {
      window.electron.ipc
        .invoke('tags-remove', { tag, filePath })
        .then((tags) => {
          setTags(tags);
        });
    }
  }, []);

  const tagsContextValue = { tags, refreshTags, addTag, removeTag };

  return (
    <TagsContext.Provider value={tagsContextValue}>
      {children}
    </TagsContext.Provider>
  );
};

export const useTagsContext = () => useContext(TagsContext);
