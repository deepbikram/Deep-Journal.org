import {
  useState,
  createContext,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useLocation } from 'react-router-dom';
import debounce from 'renderer/utils/debounce';
import { useWindowState } from 'renderer/hooks/useWindowState';

export const TimelineContext = createContext();

export const TimelineContextProvider = ({ children }) => {
  const [visibleIndex, _setVisibleIndex] = useState(0);
  const [closestDate, setClosestDate] = useState(new Date());
  const [isTimelineMinimized, setIsTimelineMinimized] = useState(false);
  const [manualToggle, setManualToggle] = useState(false); // Track manual overrides
  const virtualListRef = useRef(null);
  const { isMaximized } = useWindowState();

  const setVisibleIndex = debounce((index) => {
    _setVisibleIndex(index);
  }, 15);

  const scrollToIndex = useCallback((index = 0) => {
    if (!virtualListRef.current) return;
    if (index == -1) return;
    virtualListRef.current.scrollToIndex({
      index,
      align: 'end',
      behavior: 'auto',
    });
  }, []);

  const toggleTimelineMinimized = useCallback(() => {
    setIsTimelineMinimized(prev => !prev);
    setManualToggle(true); // Mark as manually toggled
  }, []);

  // Auto-adjust timeline based on window state, but respect manual overrides
  useEffect(() => {
    if (!manualToggle) {
      // Only auto-adjust if user hasn't manually toggled
      setIsTimelineMinimized(!isMaximized);
    }
  }, [isMaximized, manualToggle]);

  // Reset manual toggle flag when window state changes after some time
  // This allows auto-behavior to resume after a period of no manual interaction
  useEffect(() => {
    if (manualToggle) {
      const timer = setTimeout(() => {
        setManualToggle(false);
      }, 30000); // Reset after 30 seconds

      return () => clearTimeout(timer);
    }
  }, [manualToggle]);

  const timelineContextValue = {
    virtualListRef,
    visibleIndex,
    closestDate,
    setClosestDate,
    scrollToIndex,
    setVisibleIndex,
    isTimelineMinimized,
    setIsTimelineMinimized,
    toggleTimelineMinimized,
    isMaximized, // Expose window state
    manualToggle, // Expose manual toggle state
  };

  return (
    <TimelineContext.Provider value={timelineContextValue}>
      {children}
    </TimelineContext.Provider>
  );
};

export const useTimelineContext = () => useContext(TimelineContext);
