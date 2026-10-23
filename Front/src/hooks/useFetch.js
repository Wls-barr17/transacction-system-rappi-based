import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

// Carga datos de un endpoint. `interval` (ms) activa polling silencioso.
export function useFetch(path, { interval = 0, enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!path || !enabled) return;
    if (!silent) setLoading(true);
    try {
      setData(await api.get(path));
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [path, enabled]);

  useEffect(() => {
    load();
    if (!interval) return undefined;
    const t = setInterval(() => load(true), interval);
    return () => clearInterval(t);
  }, [load, interval]);

  return { data, loading, error, reload: () => load(true), setData };
}
