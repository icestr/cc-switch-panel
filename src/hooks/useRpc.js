import { useState, useEffect, useCallback } from 'react';

export function useRpc(method, params, refreshKey = 0, interval = 30000) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const key = JSON.stringify(params);

  useEffect(() => {
    setData(null);
    setError(null);
  }, [key]);

  const doFetch = useCallback(async () => {
    try {
      const res = await fetch('/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, params })
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error.message || 'RPC error');
      } else if (json.result !== undefined) {
        setData(json.result);
        setError(null);
      }
    } catch (e) {
      setError(e.message);
    }
  }, [method, key]);

  useEffect(() => {
    doFetch();
  }, [doFetch, refreshKey]);

  useEffect(() => {
    if (interval <= 0) return;
    const id = setInterval(() => {
      if (!document.hidden) doFetch();
    }, interval);
    const onVisible = () => { if (!document.hidden) doFetch(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [doFetch, interval]);

  return { data, error, refresh: doFetch };
}
