// src/hooks/useMetrics.js
import { useEffect, useState, useCallback } from "react";
import * as api from "../api/metrics";

// Hook sencillo para consumir métricas: carga, estado de carga, error y refetch
export function useMetrics(initial = null, { include_curves = true, pollInterval = 0 } = {}) {
  // By default this hook fetches the latest metrics document
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getLatestMetrics({ include_curves });
      // Some backends wrap the payload inside a `data` field. Normalize here.
      setData(res && typeof res === "object" && "data" in res ? res.data : res);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [include_curves]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Optional polling to refresh metrics periodically (useful in dashboards)
  useEffect(() => {
    if (!pollInterval || typeof pollInterval !== "number" || pollInterval <= 0) return undefined;
    const id = setInterval(() => {
      fetchData();
    }, pollInterval);
    return () => clearInterval(id);
  }, [pollInterval, fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Hook para obtener la lista paginada de runs
export function useMetricsList({ limit = 10, page = 1, include_curves = false } = {}) {
  const [data, setData] = useState({ items: [], total: 0, page, limit });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listMetrics({ limit, page, include_curves });
      setData(res);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [limit, page, include_curves]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export default useMetrics;
