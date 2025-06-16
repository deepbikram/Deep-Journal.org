import { useEffect } from 'react';

const LoadingScreen = ({ onComplete }) => {
  // Immediately call onComplete without showing any UI
  useEffect(() => {
    // Call onComplete immediately
    onComplete();
  }, [onComplete]);

  // Return null (render nothing)
  return null;
};

export default LoadingScreen;
