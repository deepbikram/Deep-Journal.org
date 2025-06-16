import {
  useState,
  createContext,
  useContext,
  useEffect,
  useCallback,
} from 'react';
import { useLocation } from 'react-router-dom';
import { usePilesContext } from './PilesContext';

export const HighlightsContext = createContext();

export const HighlightsContextProvider = ({ children }) => {
  const { currentPile, getCurrentPilePath } = usePilesContext();
  const [open, setOpen] = useState(false);
  const [highlights, setHighlights] = useState(new Map());

  const openHighlights = (e) => {
    setOpen(true);
  };

  const onOpenChange = (open) => {
    setOpen(open);
  };

  useEffect(() => {
    if (currentPile) {
      loadHighlights(getCurrentPilePath());
    }
  }, [currentPile]);

  const loadHighlights = useCallback(async (pilePath) => {
    if (!window.electron?.ipc?.invoke) {
      console.warn('Electron IPC not available, skipping highlights load');
      return;
    }
    const newHighlights = await window.electron.ipc.invoke(
      'highlights-load',
      pilePath
    );
    const newMap = new Map(newHighlights);
    setHighlights(newMap);
  }, []);

  const refreshHighlights = useCallback(async () => {
    if (!window.electron?.ipc?.invoke) {
      console.warn('Electron IPC not available, skipping highlights refresh');
      return;
    }
    const newHighlights = await window.electron.ipc.invoke('highlights-get');
    const newMap = new Map(newHighlights);
    setTags(newMap);
  }, []);

  const createHighlight = useCallback(async (highlight) => {
    if (window.electron?.ipc?.invoke) {
      window.electron.ipc
        .invoke('highlights-create', highlight)
        .then((highlights) => {
          setHighlights(highlights);
        });
    }
  }, []);

  const deleteHighlight = useCallback(async (highlight) => {
    if (window.electron?.ipc?.invoke) {
      window.electron.ipc
        .invoke('highlights-delete', highlight)
        .then((highlights) => {
          setHighlights(highlights);
        });
    }
  }, []);

  const updateHighlight = (highlight, content) => {};

  const highlightsContextValue = {
    open,
    openHighlights,
    onOpenChange,
    highlights,
    refreshHighlights,
    createHighlight,
    deleteHighlight,
  };

  return (
    <HighlightsContext.Provider value={highlightsContextValue}>
      {children}
    </HighlightsContext.Provider>
  );
};

export const useHighlightsContext = () => useContext(HighlightsContext);
