import { useEffect, useState } from 'react';
import { requestOrders } from '../data/ordersApi.js';

export default function useOrderData(user, path = '') {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const requestKey = `${user.uid}:${path}:${attempt}`;

  useEffect(() => {
    const controller = new AbortController();
    requestOrders(user, path, { signal: controller.signal }).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ requestKey, data });
      },
      (error) => {
        if (!controller.signal.aborted) setResult({ requestKey, error });
      },
    );
    return () => controller.abort();
  }, [user, path, requestKey]);

  const retry = () => setAttempt((count) => count + 1);
  return result?.requestKey === requestKey ? { ...result, retry } : { retry };
}
