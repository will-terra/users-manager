/**
 * Unified hook for managing import tracking and ActionCable subscriptions.
 * Handles fetching imports, real-time updates via websocket, and dismissed state.
 * Now uses TanStack Query for better caching and state management.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../services/api";
import { cableService } from "../services/cable";
import type { ImportProgress } from "../types/api";

const DISMISSED_IDS_KEY = "dismissed_import_ids";

interface ImportUpdate {
  type:
    | "import_started"
    | "progress_update"
    | "import_completed"
    | "import_created";
  data: ImportProgress & { channel?: string };
}

interface ImportsListUpdate {
  type: "imports_list_updated";
  data: {
    pending_imports: number;
    recent_imports: Array<{
      id: number;
      status: string;
      file_name: string;
      created_at: string;
      percentage: number;
    }>;
  };
}

export const useImports = (
  token?: string | null,
  specificImportId?: number,
) => {
  const queryClient = useQueryClient();

  // Current import when watching a specific import
  const [currentImport, setCurrentImport] = useState<ImportProgress | null>(
    null,
  );

  // Persisted set of dismissed import IDs
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(() => {
    try {
      const stored = localStorage.getItem(DISMISSED_IDS_KEY);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (error) {
      console.warn("Failed to load dismissed IDs:", error);
    }
    return new Set();
  });

  // Persist dismissed IDs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        DISMISSED_IDS_KEY,
        JSON.stringify(Array.from(dismissedIds)),
      );
    } catch (error) {
      console.warn("Failed to save dismissed IDs:", error);
    }
  }, [dismissedIds]);

  // Use TanStack Query to fetch imports
  const {
    data: importsData,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["admin", "imports", 1],
    queryFn: () => adminApi.getImports(1),
    refetchInterval: 5000, // Auto-refetch every 5 seconds for real-time updates
    refetchIntervalInBackground: true,
  });

  const error = queryError ? "Failed to fetch imports" : null;

  // Convert imports array to Map, filtering out dismissed ones
  const importsMap = new Map<number, ImportProgress>();
  const imports = (importsData?.data?.imports as ImportProgress[]) || [];
  imports.forEach((imp) => {
    if (!dismissedIds.has(imp.id)) {
      importsMap.set(imp.id, imp);
    }
  });

  /**
   * Refresh imports (now just triggers refetch)
   */
  const refreshImports = useCallback(async () => {
    await refetch();
  }, [refetch]);

  /**
   * Dismiss an import (removes from map and persists to localStorage)
   */
  const dismissImport = useCallback((importId: number) => {
    setDismissedIds((prev) => new Set(prev).add(importId));
  }, []);

  // Subscribe to import updates via ActionCable for real-time updates
  useEffect(() => {
    if (!token) return;

    let consumer;
    try {
      consumer = cableService.connect(token);
    } catch (err) {
      console.error(
        err instanceof Error ? err.message : "Failed to connect to websocket",
      );
      return () => {};
    }

    let subscription;

    if (specificImportId) {
      // Subscribe to a specific import
      subscription = consumer.subscriptions.create(
        { channel: "ImportsChannel", import_id: specificImportId },
        {
          received: (data: ImportUpdate) => {
            switch (data.type) {
              case "import_started":
              case "progress_update":
              case "import_completed":
                setCurrentImport(data.data);
                // Invalidate query to refetch
                queryClient.invalidateQueries({
                  queryKey: ["admin", "imports"],
                });
                break;
            }
          },
        },
      );
    } else {
      // Subscribe to general imports channel
      subscription = consumer.subscriptions.create("ImportsChannel", {
        received: (data: ImportUpdate | ImportsListUpdate) => {
          switch (data.type) {
            case "import_created":
            case "progress_update":
            case "import_completed":
              // Invalidate query to trigger refetch on any import update
              queryClient.invalidateQueries({ queryKey: ["admin", "imports"] });
              break;
            case "imports_list_updated":
              // Invalidate query for list updates
              queryClient.invalidateQueries({ queryKey: ["admin", "imports"] });
              break;
          }
        },
      });
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [token, specificImportId, queryClient]);

  return {
    importsMap,
    currentImport,
    loading,
    error,
    refreshImports,
    dismissImport,
  };
};

export default useImports;
