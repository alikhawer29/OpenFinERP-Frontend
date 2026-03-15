import { useState, useEffect } from 'react';
import { throttle } from 'lodash';

const useWindowWidth = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = throttle(() => {
      setWindowWidth(window.innerWidth);
    }, 250); // Adjust throttle delay as needed

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      handleResize.cancel(); // Cancel any pending throttled calls
    };
  }, []);
  return windowWidth;
};

export default useWindowWidth;
