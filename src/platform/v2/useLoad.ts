"use client";

import { useCallback, useEffect, useState } from "react";

import { errorText } from "./format";

/**
 * Load data for a page: `const { data, error, loading, reload } = useLoad(() => api.get(...).then(r => r.data), [id])`.
 * `reload()` refetches after a save without flashing the loading state.
 */
export function useLoad<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // The caller lists what the fetch depends on, like useEffect.
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/use-memo
  const run = useCallback(fetcher, deps);

  const reload = useCallback(async () => {
    try {
      setData(await run());
      setError("");
    } catch (e) {
      setError(errorText(e, "Could not load this page. Check your connection and try again."));
    } finally {
      setLoading(false);
    }
  }, [run]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    reload();
  }, [reload]);

  return { data, error, loading, reload, setData };
}

/** Lists from the API come either as an array or as a paginated {results}. */
export const listOf = <T,>(data: unknown): T[] =>
  Array.isArray(data) ? (data as T[]) : ((data as { results?: T[] })?.results ?? []);
