import { useCallback, useEffect, useRef, useState } from "react";
import { adminApi } from "../services/api";
import { cableService } from "../services/cable";
import type { AdminStats } from "../types/api";

interface StatsUpdate {
  type: "stats_update";
  data: AdminStats;
}

export const useAdminStats = (token: string) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const isMountedRef = useRef(false);

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

  useEffect(() => {
    isMountedRef.current = true;
    fetchStats();

    const consumer = cableService.connect(token);
    const subscription = consumer.subscriptions.create("AdminStatsChannel", {
      received: (data: unknown) => {
        const typedData = data as StatsUpdate;
        if (typedData.type === "stats_update" && isMountedRef.current) {
          setStats(typedData.data);
          setLastUpdated(new Date());
        }
      },
      connected: () => {
        console.log("Connected to AdminStatsChannel");
      },
      disconnected: () => {
        console.log("Disconnected from AdminStatsChannel");
      },
    });

    return () => {
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
