import { useEffect, useState } from 'react';

export default function useStoredState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(key));
      return Array.isArray(stored) ? stored : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Keep the current visit usable when browser storage is unavailable.
    }
  }, [key, value]);

  return [value, setValue];
}
