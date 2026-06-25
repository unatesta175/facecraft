'use client';

import { useCallback, useEffect, useState } from 'react';

export function useAdminData<T>(fetcher: () => Promise<T>, deps: unknown[] = [], defaultValue?: T) {
  const [data, setData] = useState<T | null>(defaultValue ?? null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result ?? defaultValue ?? null);
    } catch {
      setError('Failed to load data.');
      if (defaultValue !== undefined) {
        setData(defaultValue);
      }
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  const resolvedData = defaultValue !== undefined ? (data ?? defaultValue) : data;

  return { data: resolvedData, isLoading, error, reload };
}
