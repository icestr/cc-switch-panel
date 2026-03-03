import { useState, useEffect, useCallback } from 'react';

export function useRpc(method, params, refreshKey = 0, interval = 30000) {
  const [data, setData] = useState(null);
  const key = JSON.stringify(params);

  const doFetch = useCallback(async () => {
    const res = await fetch('/rpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, params })
    });
    const json = await res.json();
    if (json.result) setData(json.result);
  }, [method, key]);

  useEffect(() => {
    doFetch();
  }, [doFetch, refreshKey]);

  useEffect(() => {
    if (interval > 0) {
      const id = setInterval(doFetch, interval);
      return () => clearInterval(id);
    }
  }, [doFetch, interval]);

  return { data, refresh: doFetch };
}
