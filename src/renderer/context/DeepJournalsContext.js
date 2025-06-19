import {
  useState,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { useLocation } from 'react-router-dom';

export const availableThemes = {
  light: { primary: '#ddd', secondary: '#fff' },
  blue: { primary: '#a4d5ff', secondary: '#fff' },
  purple: { primary: '#d014e1', secondary: '#fff' },
  yellow: { primary: '#ff9634', secondary: '#fff' },
  green: { primary: '#22ff00', secondary: '#fff' },
};

export const DeepJournalsContext = createContext();

export const DeepJournalsContextProvider = ({ children }) => {
  const location = useLocation();
  const [currentDeepJournal, setCurrentDeepJournal] = useState(null);
  const [deepJournals, setDeepJournals] = useState([]);

  // Initialize config file
  useEffect(() => {
    getConfig();
  }, [location]);

  // Set the current deep journal based on the url
  useEffect(() => {
    if (!location.pathname) return;
    if (!location.pathname.startsWith('/deep-journal/')) return;

    const currentDeepJournalName = location.pathname.split(/[/\\]/).pop();

    changeCurrentDeepJournal(currentDeepJournalName);
  }, [location.pathname]);

  const getConfig = async () => {
    if (!window.electron?.getConfigPath) {
      console.warn('Electron not available, cannot get config');
      return;
    }
    const configFilePath = window.electron.getConfigPath();

    // Setup new deep-journals.json if doesn't exist,
    // or read in the existing
    if (!window.electron?.existsSync) {
      console.warn('Electron file system not available');
      return;
    }
    if (!window.electron.existsSync(configFilePath)) {
      if (!window.electron?.writeFile) {
        console.warn('Electron writeFile not available');
        return;
      }
      window.electron.writeFile(configFilePath, JSON.stringify([]), (err) => {
        if (err) return;
        setDeepJournals([]);
      });
    } else {
      if (!window.electron?.readFile) {
        console.warn('Electron readFile not available');
        return;
      }
      await window.electron.readFile(configFilePath, (err, data) => {
        if (err) return;
        const jsonData = JSON.parse(data);
        setDeepJournals(jsonData);
      });
    }
  };

  const getCurrentDeepJournalPath = (appendPath = '') => {
    if (!currentDeepJournal) return;
    const deepJournal = deepJournals.find((p) => p.name == currentDeepJournal.name);
    if (!window.electron?.joinPath) {
      // Fallback path join
      return appendPath ? `${deepJournal.path}/${appendPath}` : deepJournal.path;
    }
    const path = window.electron.joinPath(deepJournal.path, appendPath);
    return path;
  };

  const writeConfig = async (deepJournals) => {
    if (!deepJournals) return;
    if (!window.electron?.getConfigPath) {
      console.warn('Electron not available, cannot write config');
      return;
    }
    const configFilePath = window.electron.getConfigPath();
    if (!window.electron?.writeFile) {
      console.warn('Electron writeFile not available');
      return;
    }
    window.electron.writeFile(configFilePath, JSON.stringify(deepJournals), (err) => {
      if (err) {
        console.error('Error writing to config');
        return;
      }
    });
  };

  const createDeepJournal = (name = '', selectedPath = null) => {
    if (name == '' && selectedPath == null) return;

    let path = selectedPath;

    if (deepJournals.find((p) => p.name == name)) {
      return;
    }

    // If selected directory is not empty, create a new directory
    if (!window.electron?.isDirEmpty || !window.electron?.joinPath || !window.electron?.mkdir) {
      console.warn('Electron file system methods not available');
      // Fallback: just use the selected path
      path = selectedPath;
    } else if (!window.electron.isDirEmpty(selectedPath)) {
      path = window.electron.joinPath(selectedPath, name);
      window.electron.mkdir(path);
    }

    const newDeepJournals = [{ name, path }, ...deepJournals];
    setDeepJournals(newDeepJournals);
    writeConfig(newDeepJournals);

    return name;
  };

  const changeCurrentDeepJournal = (name) => {
    if (!deepJournals || deepJournals.length == 0) return;
    const deepJournal = deepJournals.find((p) => p.name == name);
    setCurrentDeepJournal(deepJournal);
  };

  // This does not delete the actual folder
  // User can do that if they actually want to.
  const deleteDeepJournal = (name) => {
    if (!deepJournals || deepJournals.length == 0) return;
    const newDeepJournals = deepJournals.filter((p) => p.name != name);
    setDeepJournals(newDeepJournals);
    writeConfig(newDeepJournals);
  };

  // Update current deep journal
  const updateCurrentDeepJournal = (newDeepJournal) => {
    const newDeepJournals = deepJournals.map((deepJournal) => {
      if (deepJournal.path === currentDeepJournal.path) {
        return newDeepJournal;
      }
      return deepJournal;
    });
    writeConfig(newDeepJournals);
    setCurrentDeepJournal(newDeepJournal);
  };

  // THEMES
  const currentTheme = useMemo(() => {
    return currentDeepJournal?.theme ?? 'light';
  }, [currentDeepJournal]);

  const setTheme = useCallback(
    (theme = 'light') => {
      const valid = Object.keys(availableThemes);
      if (!valid.includes(theme)) return;
      const _deepJournal = { ...currentDeepJournal, theme: theme };
      updateCurrentDeepJournal(_deepJournal);
    },
    [currentDeepJournal]
  );

  const deepJournalsContextValue = {
    deepJournals,
    getCurrentDeepJournalPath,
    createDeepJournal,
    currentDeepJournal,
    deleteDeepJournal,
    currentTheme,
    setTheme,
    updateCurrentDeepJournal,
  };

  return (
    <DeepJournalsContext.Provider value={deepJournalsContextValue}>
      {children}
    </DeepJournalsContext.Provider>
  );
};

export const useDeepJournalsContext = () => useContext(DeepJournalsContext);
