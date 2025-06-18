import { useEffect } from 'react';

const LoadingScreen = ({ onComplete }) => {
  // Immediately call onComplete without showing any UI
  useEffect(() => {
    // Call onComplete immediately with safety check
    if (typeof onComplete === 'function') {
      onComplete();
    }
  }, [onComplete]);

  // Return null (render nothing)
  return null;
};

export default LoadingScreen;
