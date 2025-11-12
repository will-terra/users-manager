/**
 * Hook: useAdminStats
 * - Fetches administrative statistics from the API
 * - Subscribes to real-time updates via ActionCable
 *
 * Inputs:
 * - token: authentication token used to connect the websocket
 *
 * Returns an object with:
 * - stats: the latest AdminStats or null while loading
 * - loading: boolean flag while fetching
 * - error: Error instance if the fetch failed
 * - refreshStats: function to manually re-fetch stats
 * - lastUpdated: Date of the most recent update (fetch or websocket)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { adminApi } from "../services/api";
import { cableService } from "../services/cable";
import type { AdminStats } from "../types/api";

interface StatsUpdate {
  type: "stats_update";
  data: AdminStats;
}

export const useAdminStats = (token: string) => {
  // current stats, null until loaded
  const [stats, setStats] = useState<AdminStats | null>(null);
  // loading state for initial/explicit fetches
  const [loading, setLoading] = useState(true);
  // store any fetch error
  const [error, setError] = useState<Error | null>(null);
  // timestamp of the last successful update (either fetch or websocket)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // track mount status to avoid state updates on unmounted component
  const isMountedRef = useRef(false);

  // fetch latest stats from the REST API
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminApi.getStats();

      if (isMountedRef.current) {
        setStats(response.stats);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (isMountedRef.current) {
        const error =
          err instanceof Error ? err : new Error("Failed to fetch stats");
        setError(error);
        console.error("Error fetching stats:", error);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // on mount: mark mounted, fetch, and subscribe to AdminStatsChannel
  useEffect(() => {
    isMountedRef.current = true;
    fetchStats();

    // connect ActionCable consumer using provided token
    const consumer = cableService.connect(token);
    const subscription = consumer.subscriptions.create("AdminStatsChannel", {
      // when data arrives over the websocket, update state
      received: (data: unknown) => {
        const typedData = data as StatsUpdate;
        if (typedData.type === "stats_update" && isMountedRef.current) {
          setStats(typedData.data);
          setLastUpdated(new Date());
        }
      },
      connected: () => { },
      disconnected: () => { },
    });

    return () => {
      // cleanup on unmount: prevent state updates and unsubscribe
      isMountedRef.current = false;
      try {
        subscription.unsubscribe();
      } catch (err) {
        console.debug("AdminStats subscription unsubscribe error:", err);
      }
    };
  }, [token, fetchStats]);

  return {
    stats,
    loading,
    error,
    refreshStats: fetchStats,
    lastUpdated,
  };
};
