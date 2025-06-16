import { useState, useCallback, useEffect } from 'react';

export function useElectronStore(key, initialValue) {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [isElectronReady, setIsElectronReady] = useState(false);

  // Check if electron is available
  useEffect(() => {
    const checkElectron = () => {
      if (window.electron?.settingsGet) {
        setIsElectronReady(true);
        return true;
      }
      return false;
    };

    if (!checkElectron()) {
      // If electron is not ready, check periodically
      const interval = setInterval(() => {
        if (checkElectron()) {
          clearInterval(interval);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    if (isElectronReady && window.electron?.settingsGet) {
      window.electron.settingsGet(key).then((value) => {
        if (value !== undefined) setStoredValue(value);
      }).catch(console.error);
    }
  }, [key, isElectronReady]);

  const setValue = useCallback(
    (value) => {
      const newValue = value instanceof Function ? value(storedValue) : value;
      setStoredValue(newValue);
      if (window.electron?.settingsSet) {
        window.electron.settingsSet(key, newValue).catch(console.error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}
