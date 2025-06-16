import { useState, useEffect } from 'react';

const useIPCListener = (channel, initialData) => {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    const handler = (newData) => {
      setData(newData);
    };

    if (window.electron?.ipc?.on) {
      const cleanup = window.electron.ipc.on(channel, handler);
      return cleanup;
    }

    return () => {}; // Return empty cleanup function if electron not ready
  }, [channel]);

  return data;
};

export default useIPCListener;
