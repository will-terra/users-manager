/**
 * Unified hook for managing import tracking and ActionCable subscriptions.
 * Handles fetching imports, real-time updates via websocket, and dismissed state.
 */
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
  // In-memory map of imports (synced from API and websocket)
  const [importsMap, setImportsMap] = useState<Map<number, ImportProgress>>(
    new Map(),
  );

  // Current import when watching a specific import
  const [currentImport, setCurrentImport] = useState<ImportProgress | null>(
    null,
  );

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  /**
   * Fetch imports list from the API
   */
  const refreshImports = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminApi.getImports();
      const imports = response.data.imports as ImportProgress[];

      // Update map, excluding dismissed imports
      setImportsMap((prev) => {
        const newMap = new Map(prev);
        imports.forEach((imp) => {
          if (!dismissedIds.has(imp.id)) {
            newMap.set(imp.id, imp);
          }
        });
        return newMap;
      });

      setError(null);
    } catch {
      setError("Failed to fetch imports");
    } finally {
      setLoading(false);
    }
  }, [dismissedIds]);

  /**
   * Dismiss an import (removes from map and persists to localStorage)
   */
  const dismissImport = useCallback((importId: number) => {
    setDismissedIds((prev) => new Set(prev).add(importId));
    setImportsMap((prev) => {
      const newMap = new Map(prev);
      newMap.delete(importId);
      return newMap;
    });
  }, []);

  // Subscribe to import updates via ActionCable
  useEffect(() => {
    refreshImports();

    let consumer;
    try {
      consumer = cableService.connect(token ?? undefined);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect to websocket",
      );
      setLoading(false);
      return () => { };
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
              if (!dismissedIds.has(data.data.id)) {
                setImportsMap((prev) => {
                  const newMap = new Map(prev);
                  newMap.set(data.data.id, data.data);
                  return newMap;
                });
              }
              break;
            case "progress_update":
            case "import_completed":
              if (!dismissedIds.has(data.data.id)) {
                setImportsMap((prev) => {
                  const newMap = new Map(prev);
                  const existing = newMap.get(data.data.id);
                  if (existing) {
                    newMap.set(data.data.id, { ...existing, ...data.data });
                  } else {
                    newMap.set(data.data.id, data.data);
                  }
                  return newMap;
                });
              }
              break;
            case "imports_list_updated":
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
  }, [token, specificImportId, refreshImports, dismissedIds]);

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
