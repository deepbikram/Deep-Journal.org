import {
  useState,
  createContext,
  useContext,
  useEffect,
  useCallback,
} from 'react';
import { useLocation } from 'react-router-dom';
import { useDeepJournalsContext } from './DeepJournalsContext';

export const IndexContext = createContext();

export const IndexContextProvider = ({ children }) => {
  const { currentDeepJournal, getCurrentDeepJournalPath } = useDeepJournalsContext();
  const [filters, setFilters] = useState();
  const [searchOpen, setSearchOpen] = useState(false);
  const [index, setIndex] = useState(new Map());
  const [latestThreads, setLatestThreads] = useState([]);

  const loadIndex = useCallback(async (deepJournalPath) => {
    if (!window.electron?.ipc?.invoke) {
      console.warn('Electron IPC not available, skipping index load');
      return;
    }
    const newIndex = await window.electron.ipc.invoke('index-load', deepJournalPath);
    const newMap = new Map(newIndex);
    setIndex(newMap);
  }, []);

  const refreshIndex = useCallback(async () => {
    if (!window.electron?.ipc?.invoke) {
      console.warn('Electron IPC not available, skipping index refresh');
      return;
    }
    const newIndex = await window.electron.ipc.invoke('index-get');
    const newMap = new Map(newIndex);
    setIndex(newMap);
  }, []);

  const prependIndex = useCallback((key, value) => {
    console.log('prepend index', key, value)
    setIndex((prevIndex) => {
      const newIndex = new Map([[key, value], ...prevIndex]);
      return newIndex;
    });
  }, []);

  const regenerateEmbeddings = () => {
    if (window.electron?.ipc?.invoke) {
      window.electron.ipc.invoke('index-regenerate-embeddings');
    }
  };

  const getThreadsAsText = useCallback(async (filePaths) => {
    if (!window.electron?.ipc?.invoke) {
      console.warn('Electron IPC not available');
      return [];
    }
    return window.electron.ipc.invoke('index-get-threads-as-text', filePaths);
  }, []);

  const search = useCallback(async (query) => {
    if (!window.electron?.ipc?.invoke) {
      console.warn('Electron IPC not available');
      return [];
    }
    return window.electron.ipc.invoke('index-search', query);
  }, []);

  const vectorSearch = useCallback(async (query, topN = 50) => {
    if (!window.electron?.ipc?.invoke) {
      console.warn('Electron IPC not available');
      return [];
    }
    return window.electron.ipc.invoke('index-vector-search', query, topN);
  }, []);

  const loadLatestThreads = useCallback(async (count = 25) => {
    const items = await search('');
    const latest = items.slice(0, count);

    const entryFilePaths = latest.map((entry) => entry.ref);
    const latestThreadsAsText = await getThreadsAsText(entryFilePaths);

    setLatestThreads(latestThreadsAsText);
  }, [search, getThreadsAsText]);

  const addIndex = useCallback(
    async (newEntryPath, parentPath = null) => {
      if (!window.electron?.ipc?.invoke) {
        console.warn('Electron IPC not available, skipping index add');
        return;
      }
      console.time('index-add-time');
      const deepJournalPath = getCurrentDeepJournalPath();

      await window.electron.ipc
      .invoke('index-add', newEntryPath)
      .then((index) => {
        // setIndex(index);
        loadLatestThreads();
      });
      console.timeEnd('index-add-time');
    },
    [currentDeepJournal, loadLatestThreads]
  );

  const updateIndex = useCallback(async (filePath, data) => {
    if (window.electron?.ipc?.invoke) {
      window.electron.ipc.invoke('index-update', filePath, data).then((index) => {
        setIndex(index);
        loadLatestThreads();
      });
    }
  }, [loadLatestThreads]);

  const removeIndex = useCallback(async (filePath) => {
    if (window.electron?.ipc?.invoke) {
      window.electron.ipc.invoke('index-remove', filePath).then((index) => {
        setIndex(index);
      });
    }
  }, []);

  // Effect to load data when currentDeepJournal changes
  useEffect(() => {
    if (currentDeepJournal) {
      loadIndex(getCurrentDeepJournalPath());
      loadLatestThreads();
    }
  }, [currentDeepJournal, loadIndex, loadLatestThreads, getCurrentDeepJournalPath]);

  const indexContextValue = {
    index,
    refreshIndex,
    addIndex,
    removeIndex,
    updateIndex,
    search,
    searchOpen,
    setSearchOpen,
    vectorSearch,
    getThreadsAsText,
    latestThreads,
    regenerateEmbeddings,
    prependIndex
  };

  return (
    <IndexContext.Provider value={indexContextValue}>
      {children}
    </IndexContext.Provider>
  );
};

export const useIndexContext = () => useContext(IndexContext);
