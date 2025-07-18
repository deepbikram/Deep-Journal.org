import { useState, useEffect } from 'react';

export const useWindowState = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Check initial state
    const checkInitialState = async () => {
      if (window.electron?.isWindowMaximized) {
        try {
          const initialState = await window.electron.isWindowMaximized();
          setIsMaximized(initialState);
        } catch (error) {
          console.warn('Could not get initial window state:', error);
        }
      }
    };

    checkInitialState();

    // Set up listeners for window state changes
    if (window.electron?.onWindowStateChanged) {
      const cleanup = window.electron.onWindowStateChanged((maximized) => {
        setIsMaximized(maximized);
      });

      return cleanup;
    }

    return () => {}; // Return empty cleanup function if electron not ready
  }, []);

  return { isMaximized };
};
