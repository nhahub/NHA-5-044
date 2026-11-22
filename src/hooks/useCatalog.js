import { useEffect, useState } from 'react';
import { storeRequest } from '../data/api.js';

export default function useCatalog() {
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    storeRequest('/catalog', { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setCatalog(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });

    return () => controller.abort();
  }, [attempt]);

  function retry() {
    setError(false);
    setAttempt((current) => current + 1);
  }

  return { products: catalog?.products ?? null, categories: catalog?.categories ?? [], error, retry };
}
