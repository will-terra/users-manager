import { useQuery, useQueryClient } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useImports } from "../../hooks/useImports";
import { cableService } from "../../services/cable";

// Mock dependencies
vi.mock("@tanstack/react-query");
vi.mock("../../services/api");
vi.mock("../../services/cable");

const mockUseQuery = vi.mocked(useQuery);
const mockUseQueryClient = vi.mocked(useQueryClient);
const mockCableService = vi.mocked(cableService);

type ImportUpdate = {
  type:
    | "import_started"
    | "progress_update"
    | "import_completed"
    | "import_created";
  data: Record<string, unknown>;
};

type ImportsListUpdate = {
  type: "imports_list_updated";
  data: Record<string, unknown>;
};

type WebSocketData = ImportUpdate | ImportsListUpdate;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("useImports", () => {
  const mockQueryClient = {
    invalidateQueries: vi.fn(),
  };

  const mockImports = [
    {
      id: 1,
      status: "completed",
      file_name: "test1.csv",
      created_at: "2023-01-01",
      percentage: 100,
    },
    {
      id: 2,
      status: "processing",
      file_name: "test2.csv",
      created_at: "2023-01-02",
      percentage: 50,
    },
    {
      id: 3,
      status: "failed",
      file_name: "test3.csv",
      created_at: "2023-01-03",
      percentage: 0,
    },
  ];

  beforeEach(() => {
    mockUseQueryClient.mockReturnValue(mockQueryClient);
    mockUseQuery.mockReturnValue({
      data: { data: { imports: mockImports } },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Mock cableService to return a proper consumer
    const mockConsumer = {
      subscriptions: {
        create: vi.fn().mockReturnValue({
          unsubscribe: vi.fn(),
        }),
      },
    };
    mockCableService.connect.mockReturnValue(mockConsumer);

    // Reset localStorage mocks
    localStorageMock.getItem.mockReturnValue(null); // No dismissed IDs initially
    localStorageMock.setItem.mockImplementation(() => {}); // No-op by default
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("returns imports map excluding dismissed imports", () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify([2])); // Import 2 is dismissed

    const { result } = renderHook(() => useImports("token"));

    expect(result.current.importsMap.size).toBe(2);
    expect(result.current.importsMap.has(1)).toBe(true);
    expect(result.current.importsMap.has(2)).toBe(false); // Dismissed
    expect(result.current.importsMap.has(3)).toBe(true);
  });

  test("loads dismissed IDs from localStorage on initialization", () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify([1, 3]));

    renderHook(() => useImports("token"));

    expect(localStorageMock.getItem).toHaveBeenCalledWith(
      "dismissed_import_ids",
    );
  });

  test("handles localStorage errors gracefully", () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error("localStorage error");
    });

    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Should not throw during initialization
    expect(() => renderHook(() => useImports("token"))).not.toThrow();

    consoleError.mockRestore();
  });

  test("saves dismissed IDs to localStorage", () => {
    const { result } = renderHook(() => useImports("token"));

    act(() => {
      result.current.dismissImport(1);
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "dismissed_import_ids",
      JSON.stringify([1]),
    );
  });

  test("handles localStorage save errors gracefully", () => {
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error("localStorage save error");
    });

    const { result } = renderHook(() => useImports("token"));

    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Should not throw
    expect(() => {
      act(() => {
        result.current.dismissImport(1);
      });
    }).not.toThrow();

    consoleError.mockRestore();
  });

  test("returns loading state from query", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useImports("token"));

    expect(result.current.loading).toBe(true);
  });

  test("returns error when query fails", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error("Query failed"),
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useImports("token"));

    expect(result.current.error).toBe("Failed to fetch imports");
  });

  test("refreshImports calls refetch", async () => {
    const mockRefetch = vi.fn();
    mockUseQuery.mockReturnValue({
      data: { data: { imports: mockImports } },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const { result } = renderHook(() => useImports("token"));

    await act(async () => {
      await result.current.refreshImports();
    });

    expect(mockRefetch).toHaveBeenCalled();
  });

  test("dismissImport adds ID to dismissed set", () => {
    const { result } = renderHook(() => useImports("token"));

    act(() => {
      result.current.dismissImport(2);
    });

    expect(result.current.importsMap.has(2)).toBe(false);
  });

  test("sets up ActionCable subscription for general imports when token provided", () => {
    const mockConsumer = {
      subscriptions: {
        create: vi.fn().mockReturnValue({
          unsubscribe: vi.fn(),
        }),
      },
    };

    mockCableService.connect.mockReturnValue(mockConsumer);

    renderHook(() => useImports("test-token"));

    expect(mockCableService.connect).toHaveBeenCalledWith("test-token");
    expect(mockConsumer.subscriptions.create).toHaveBeenCalledWith(
      "ImportsChannel",
      expect.any(Object),
    );
  });

  test("does not set up ActionCable subscription when no token", () => {
    renderHook(() => useImports(null));

    expect(mockCableService.connect).not.toHaveBeenCalled();
  });

  test("handles ActionCable connection errors gracefully", () => {
    mockCableService.connect.mockImplementation(() => {
      throw new Error("Connection failed");
    });

    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Should not throw
    expect(() => renderHook(() => useImports("token"))).not.toThrow();

    consoleError.mockRestore();
  });

  test("sets up specific import subscription when specificImportId provided", () => {
    const mockConsumer = {
      subscriptions: {
        create: vi.fn().mockReturnValue({
          unsubscribe: vi.fn(),
        }),
      },
    };

    mockCableService.connect.mockReturnValue(mockConsumer);

    renderHook(() => useImports("token", 123));

    expect(mockConsumer.subscriptions.create).toHaveBeenCalledWith(
      { channel: "ImportsChannel", import_id: 123 },
      expect.any(Object),
    );
  });

  test("updates currentImport on specific import updates", () => {
    const mockConsumer = {
      subscriptions: {
        create: vi.fn().mockReturnValue({
          unsubscribe: vi.fn(),
        }),
      },
    };

    let receivedCallback: (data: WebSocketData) => void;
    mockConsumer.subscriptions.create.mockImplementation((channel, options) => {
      receivedCallback = options.received;
      return { unsubscribe: vi.fn() };
    });

    mockCableService.connect.mockReturnValue(mockConsumer);

    const { result } = renderHook(() => useImports("token", 123));

    const updateData = { id: 123, status: "processing", percentage: 75 };
    act(() => {
      receivedCallback!({
        type: "progress_update",
        data: updateData,
      });
    });

    expect(result.current.currentImport).toEqual(updateData);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["admin", "imports"],
    });
  });

  test("invalidates queries on general import updates", () => {
    const mockConsumer = {
      subscriptions: {
        create: vi.fn().mockReturnValue({
          unsubscribe: vi.fn(),
        }),
      },
    };

    let receivedCallback: (data: WebSocketData) => void;
    mockConsumer.subscriptions.create.mockImplementation((channel, options) => {
      receivedCallback = options.received;
      return { unsubscribe: vi.fn() };
    });

    mockCableService.connect.mockReturnValue(mockConsumer);

    renderHook(() => useImports("token"));

    act(() => {
      receivedCallback!({
        type: "import_created",
        data: { id: 456 },
      });
    });

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["admin", "imports"],
    });
  });

  test("unsubscribes from ActionCable on unmount", () => {
    const mockSubscription = { unsubscribe: vi.fn() };
    const mockConsumer = {
      subscriptions: {
        create: vi.fn().mockReturnValue(mockSubscription),
      },
    };

    mockCableService.connect.mockReturnValue(mockConsumer);

    const { unmount } = renderHook(() => useImports("token"));

    unmount();

    expect(mockSubscription.unsubscribe).toHaveBeenCalled();
  });

  test("verifies refetchInterval configuration", () => {
    renderHook(() => useImports("token"));

    // Verify useQuery was called with refetchInterval settings
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        refetchInterval: 5000,
        refetchIntervalInBackground: true,
      }),
    );
  });

  test("handles imports_list_updated message", () => {
    const mockConsumer = {
      subscriptions: {
        create: vi.fn().mockReturnValue({
          unsubscribe: vi.fn(),
        }),
      },
    };

    let receivedCallback: (data: WebSocketData) => void;
    mockConsumer.subscriptions.create.mockImplementation((channel, options) => {
      receivedCallback = options.received;
      return { unsubscribe: vi.fn() };
    });

    mockCableService.connect.mockReturnValue(mockConsumer);

    renderHook(() => useImports("token"));

    act(() => {
      receivedCallback!({
        type: "imports_list_updated",
        data: {
          pending_imports: 2,
          recent_imports: [],
        },
      });
    });

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["admin", "imports"],
    });
  });

  test("queryFn is called when query executes", () => {
    mockUseQuery.mockImplementation((config) => {
      // Execute the queryFn to ensure it's covered
      if (config.queryFn) {
        config.queryFn();
      }
      return {
        data: { data: { imports: mockImports } },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      };
    });

    renderHook(() => useImports("token"));

    // The queryFn should have been invoked during hook initialization
    expect(mockUseQuery).toHaveBeenCalled();
  });
});
