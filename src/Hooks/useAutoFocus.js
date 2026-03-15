import { useEffect, useRef } from 'react';

const useAutoFocus = () => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, [ref.current]);

  return ref;
};

export default useAutoFocus;
