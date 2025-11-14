// Mock dependencies
vi.mock("@tanstack/react-query");
vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
}));
vi.mock("../../../services/api", () => ({
  adminApi: {
    getStats: vi.fn(),
    getUsers: vi.fn(),
    getUser: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    toggleUserRole: vi.fn(),
    getImports: vi.fn(),
    createImport: vi.fn(),
  },
}));

import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi, afterEach, type Mock } from "vitest";
import {
  useAdminStats,
  useCreateImport,
  useCreateUser,
  useDeleteUser,
  useImports,
  useToggleUserRole,
  useUpdateUser,
  useUser,
  useUsers,
} from "../../../hooks/queries/useAdminQueries";
import { adminApi } from "../../../services/api";

import { useNavigate } from "react-router-dom";

const mockUseQuery = vi.mocked(useQuery) as Mock;
const mockUseMutation = vi.mocked(useMutation) as Mock;
const mockUseQueryClient = vi.mocked(useQueryClient) as Mock;
const mockUseNavigate = vi.mocked(useNavigate) as Mock;
const mockAdminApi = vi.mocked(adminApi);

const createMockQueryResult = (data: unknown, isLoading = false) => ({
  data,
  isLoading,
  isError: false,
  error: null,
  isPending: isLoading,
  isLoadingError: false,
  isRefetchError: false,
  isSuccess: !isLoading,
  status: isLoading ? 'pending' as const : 'success' as const,
  dataUpdatedAt: 0,
  errorUpdatedAt: 0,
  failureCount: 0,
  failureReason: null,
  isFetched: true,
  isFetchedAfterMount: true,
  isFetching: false,
  isRefetching: false,
  isStale: false,
  refetch: vi.fn(),
  fetchStatus: 'idle' as const,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any as UseQueryResult<any, any>);

describe("useAdminQueries", () => {
  const mockQueryClient = {
    invalidateQueries: vi.fn(),
    cancelQueries: vi.fn(),
    getQueryData: vi.fn(),
    setQueryData: vi.fn(),
  };

  const mockNavigate = vi.fn();

  beforeEach(() => {
    mockUseQueryClient.mockReturnValue(mockQueryClient);
    mockUseNavigate.mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("useAdminStats", () => {
    test("calls useQuery with correct parameters", () => {
      const mockResult = createMockQueryResult({ totalUsers: 100 });
      mockUseQuery.mockReturnValue(mockResult);

      const { result } = renderHook(() => useAdminStats());

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ["admin", "stats"],
        queryFn: expect.any(Function),
      });
      expect(result.current).toBe(mockResult);
    });

    test("queryFn calls adminApi.getStats", () => {
      mockUseQuery.mockImplementation(({ queryFn }) => {
        const result = queryFn();
        return { data: result, isLoading: false };
      });

      renderHook(() => useAdminStats());

      expect(mockAdminApi.getStats).toHaveBeenCalled();
    });
  });

  describe("useUsers", () => {
    test("calls useQuery with correct parameters for default values", () => {
      const mockResult = { data: { users: [] }, isLoading: false };
      mockUseQuery.mockReturnValue(mockResult);

      const { result } = renderHook(() => useUsers());

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ["admin", "users", { page: 1, search: "" }],
        queryFn: expect.any(Function),
        placeholderData: expect.any(Function),
      });
      expect(result.current).toBe(mockResult);
    });

    test("calls useQuery with custom page and search", () => {
      const mockResult = { data: { users: [] }, isLoading: false };
      mockUseQuery.mockReturnValue(mockResult);

      renderHook(() => useUsers(2, "john"));

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ["admin", "users", { page: 2, search: "john" }],
        queryFn: expect.any(Function),
        placeholderData: expect.any(Function),
      });
    });

    test("queryFn calls adminApi.getUsers with correct parameters", () => {
      mockUseQuery.mockImplementation(({ queryFn }) => {
        const result = queryFn();
        return { data: result, isLoading: false };
      });

      renderHook(() => useUsers(2, "john"));

      expect(mockAdminApi.getUsers).toHaveBeenCalledWith(2, "john");
    });

    test("placeholderData returns previous data", () => {
      const previousData = { users: [{ id: 1, name: "John" }] };
      let capturedPlaceholderFn: (data: unknown) => unknown = () => { };

      mockUseQuery.mockImplementation((config) => {
        capturedPlaceholderFn = config.placeholderData as (
          data: unknown,
        ) => unknown;
        return createMockQueryResult(null, true);
      });

      renderHook(() => useUsers());

      const result = capturedPlaceholderFn(previousData);
      expect(result).toBe(previousData);
    });
  });

  describe("useUser", () => {
    test("calls useQuery with correct parameters when id is provided", () => {
      const mockResult = createMockQueryResult({ id: 1, name: "John" });
      mockUseQuery.mockReturnValue(mockResult);

      const { result } = renderHook(() => useUser(1));

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ["admin", "users", 1],
        queryFn: expect.any(Function),
        enabled: true,
      });
      expect(result.current).toBe(mockResult);
    });

    test("queryFn calls adminApi.getUser with correct id", () => {
      mockUseQuery.mockImplementation(({ queryFn }) => {
        const result = queryFn();
        return { data: result, isLoading: false };
      });

      renderHook(() => useUser(123));

      expect(mockAdminApi.getUser).toHaveBeenCalledWith(123);
    });

    test("enabled is false when id is falsy", () => {
      const mockResult = { data: null, isLoading: false };
      mockUseQuery.mockReturnValue(mockResult);

      renderHook(() => useUser(0));

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ["admin", "users", 0],
        queryFn: expect.any(Function),
        enabled: false,
      });
    });
  });

  describe("useCreateUser", () => {
    test("returns mutation with correct configuration", () => {
      const mockMutation = { mutate: vi.fn(), isPending: false };
      mockUseMutation.mockReturnValue(mockMutation);

      const { result } = renderHook(() => useCreateUser());

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onSuccess: expect.any(Function),
      });
      expect(result.current).toBe(mockMutation);
    });

    test("mutationFn calls adminApi.createUser with userData", () => {
      const userData = { full_name: "John Doe", email: "john@example.com" };
      mockUseMutation.mockImplementation(({ mutationFn }) => {
        mutationFn(userData);
        return { mutate: vi.fn(), isPending: false };
      });

      renderHook(() => useCreateUser());

      expect(mockAdminApi.createUser).toHaveBeenCalledWith(userData);
    });

    test("onSuccess invalidates queries and navigates", () => {
      const mockMutation = {
        mutate: vi.fn(),
        isPending: false,
        mutateAsync: vi.fn().mockResolvedValue({}),
      };
      mockUseMutation.mockReturnValue(mockMutation);

      renderHook(() => useCreateUser());

      const mutationConfig = mockUseMutation.mock.calls[0][0];
      mutationConfig.onSuccess();

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["admin", "users"],
      });
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["admin", "stats"],
      });
      expect(mockNavigate).toHaveBeenCalledWith("/admin/users");
    });
  });

  describe("useUpdateUser", () => {
    test("returns mutation with correct configuration", () => {
      const mockMutation = { mutate: vi.fn(), isPending: false };
      mockUseMutation.mockReturnValue(mockMutation);

      const { result } = renderHook(() => useUpdateUser(1));

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onMutate: expect.any(Function),
        onError: expect.any(Function),
        onSuccess: expect.any(Function),
      });
      expect(result.current).toBe(mockMutation);
    });

    test("mutationFn calls adminApi.updateUser with id and userData", () => {
      const userData = { full_name: "Updated Name" };
      mockUseMutation.mockImplementation(({ mutationFn }) => {
        mutationFn(userData);
        return { mutate: vi.fn(), isPending: false };
      });

      renderHook(() => useUpdateUser(123));

      expect(mockAdminApi.updateUser).toHaveBeenCalledWith(123, userData);
    });

    test("onMutate cancels queries and optimistically updates", async () => {
      const previousUser = { data: { id: 1, full_name: "Old Name" } };
      mockQueryClient.getQueryData.mockReturnValue(previousUser);

      const mockMutation = {
        mutate: vi.fn(),
        isPending: false,
        mutateAsync: vi.fn().mockResolvedValue({}),
      };
      mockUseMutation.mockReturnValue(mockMutation);

      renderHook(() => useUpdateUser(1));

      const mutationConfig = mockUseMutation.mock.calls[0][0];
      const context = await mutationConfig.onMutate({ full_name: "New Name" });

      expect(mockQueryClient.cancelQueries).toHaveBeenCalledWith({
        queryKey: ["admin", "users", 1],
      });
      expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
        ["admin", "users", 1],
        expect.any(Function),
      );
      expect(context).toEqual({ previousUser });
    });

    test("onError does not rollback when no previous user in context", () => {
      const context = {}; // No previousUser

      const mockMutation = {
        mutate: vi.fn(),
        isPending: false,
        mutateAsync: vi.fn().mockResolvedValue({}),
      };
      mockUseMutation.mockReturnValue(mockMutation);

      renderHook(() => useUpdateUser(1));

      const mutationConfig = mockUseMutation.mock.calls[0][0];
      mutationConfig.onError(new Error("Update failed"), {}, context);

      expect(mockQueryClient.setQueryData).not.toHaveBeenCalled();
    });

    test("onSuccess invalidates queries and navigates", () => {
      const mockMutation = {
        mutate: vi.fn(),
        isPending: false,
        mutateAsync: vi.fn().mockResolvedValue({}),
      };
      mockUseMutation.mockReturnValue(mockMutation);

      renderHook(() => useUpdateUser(1));

      const mutationConfig = mockUseMutation.mock.calls[0][0];
      mutationConfig.onSuccess();

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["admin", "users"],
      });
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["admin", "users", 1],
      });
      expect(mockNavigate).toHaveBeenCalledWith("/admin/users");
    });
  });

  describe("useDeleteUser", () => {
    test("returns mutation with correct configuration", () => {
      const mockMutation = { mutate: vi.fn(), isPending: false };
      mockUseMutation.mockReturnValue(mockMutation);

      const { result } = renderHook(() => useDeleteUser());

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onSuccess: expect.any(Function),
      });
      expect(result.current).toBe(mockMutation);
    });

    test("mutationFn calls adminApi.deleteUser with id", () => {
      mockUseMutation.mockImplementation(({ mutationFn }) => {
        mutationFn(123);
        return { mutate: vi.fn(), isPending: false };
      });

      renderHook(() => useDeleteUser());

      expect(mockAdminApi.deleteUser).toHaveBeenCalledWith(123);
    });

    test("onSuccess invalidates queries", () => {
      const mockMutation = {
        mutate: vi.fn(),
        isPending: false,
        mutateAsync: vi.fn().mockResolvedValue({}),
      };
      mockUseMutation.mockReturnValue(mockMutation);

      renderHook(() => useDeleteUser());

      const mutationConfig = mockUseMutation.mock.calls[0][0];
      mutationConfig.onSuccess();

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["admin", "users"],
      });
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["admin", "stats"],
      });
    });
  });

  describe("useToggleUserRole", () => {
    test("returns mutation with correct configuration", () => {
      const mockMutation = { mutate: vi.fn(), isPending: false };
      mockUseMutation.mockReturnValue(mockMutation);

      const { result } = renderHook(() => useToggleUserRole());

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onSuccess: expect.any(Function),
      });
      expect(result.current).toBe(mockMutation);
    });

    test("mutationFn calls adminApi.toggleUserRole with id", () => {
      mockUseMutation.mockImplementation(({ mutationFn }) => {
        mutationFn(123);
        return { mutate: vi.fn(), isPending: false };
      });

      renderHook(() => useToggleUserRole());

      expect(mockAdminApi.toggleUserRole).toHaveBeenCalledWith(123);
    });

    test("onSuccess updates cache and invalidates queries", () => {
      const updatedUser = { data: { id: 123, role: "admin" } };
      const mockMutation = {
        mutate: vi.fn(),
        isPending: false,
        mutateAsync: vi.fn().mockResolvedValue(updatedUser),
      };
      mockUseMutation.mockReturnValue(mockMutation);

      renderHook(() => useToggleUserRole());

      const mutationConfig = mockUseMutation.mock.calls[0][0];
      mutationConfig.onSuccess(updatedUser, 123);

      expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
        ["admin", "users", 123],
        updatedUser,
      );
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["admin", "users"],
      });
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["admin", "stats"],
      });
    });
  });

  describe("useImports", () => {
    test("calls useQuery with correct parameters for default page", () => {
      const mockResult = { data: { imports: [] }, isLoading: false };
      mockUseQuery.mockReturnValue(mockResult);

      const { result } = renderHook(() => useImports());

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ["admin", "imports", { page: 1 }],
        queryFn: expect.any(Function),
        placeholderData: expect.any(Function),
      });
      expect(result.current).toBe(mockResult);
    });

    test("calls useQuery with custom page", () => {
      const mockResult = { data: { imports: [] }, isLoading: false };
      mockUseQuery.mockReturnValue(mockResult);

      renderHook(() => useImports(3));

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ["admin", "imports", { page: 3 }],
        queryFn: expect.any(Function),
        placeholderData: expect.any(Function),
      });
    });

    test("queryFn calls adminApi.getImports with correct page", () => {
      mockUseQuery.mockImplementation(({ queryFn }) => {
        const result = queryFn();
        return { data: result, isLoading: false };
      });

      renderHook(() => useImports(5));

      expect(mockAdminApi.getImports).toHaveBeenCalledWith(5);
    });

    test("placeholderData returns previous data", () => {
      const previousData = { imports: [{ id: 1, name: "Import 1" }] };
      let capturedPlaceholderFn: (data: unknown) => unknown = () => { };

      mockUseQuery.mockImplementation((config) => {
        capturedPlaceholderFn = config.placeholderData as (
          data: unknown,
        ) => unknown;
        return createMockQueryResult(null, true);
      });

      renderHook(() => useImports());

      const result = capturedPlaceholderFn(previousData);
      expect(result).toBe(previousData);
    });
  });

  describe("useCreateImport", () => {
    test("returns mutation with correct configuration", () => {
      const mockMutation = { mutate: vi.fn(), isPending: false };
      mockUseMutation.mockReturnValue(mockMutation);

      const { result } = renderHook(() => useCreateImport());

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onSuccess: expect.any(Function),
      });
      expect(result.current).toBe(mockMutation);
    });

    test("mutationFn calls adminApi.createImport with file", () => {
      const mockFile = new File(["content"], "test.csv");
      mockUseMutation.mockImplementation(({ mutationFn }) => {
        mutationFn(mockFile);
        return { mutate: vi.fn(), isPending: false };
      });

      renderHook(() => useCreateImport());

      expect(mockAdminApi.createImport).toHaveBeenCalledWith(mockFile);
    });

    test("onSuccess invalidates queries", () => {
      const mockMutation = {
        mutate: vi.fn(),
        isPending: false,
        mutateAsync: vi.fn().mockResolvedValue({}),
      };
      mockUseMutation.mockReturnValue(mockMutation);

      renderHook(() => useCreateImport());

      const mutationConfig = mockUseMutation.mock.calls[0][0];
      mutationConfig.onSuccess();

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["admin", "imports", { page: 1 }],
      });
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["admin", "stats"],
      });
    });
  });

  test("optimistically updates user data with old data setter", async () => {
    const previousUser = {
      data: { id: 1, full_name: "Old Name", email: "old@test.com" },
    };
    mockQueryClient.getQueryData.mockReturnValue(previousUser);

    const mockMutation = {
      mutate: vi.fn(),
      isPending: false,
      mutateAsync: vi.fn().mockResolvedValue({}),
    };
    mockUseMutation.mockReturnValue(mockMutation);

    renderHook(() => useUpdateUser(1));

    const mutationConfig = mockUseMutation.mock.calls.at(-1)![0];
    await mutationConfig.onMutate({ full_name: "New Name" });

    // Verify setQueryData was called with a function
    const setQueryDataCall = mockQueryClient.setQueryData.mock.calls[0];
    expect(setQueryDataCall[0]).toEqual(["admin", "users", 1]);

    // Call the updater function to test line 86
    const updaterFn = setQueryDataCall[1];
    const result = updaterFn(previousUser);

    expect(result).toEqual({
      data: { id: 1, full_name: "New Name", email: "old@test.com" },
    });
  });

  test("rollback happens when previousUser exists in context", () => {
    const previousUser = { data: { id: 1, full_name: "Old Name" } };
    const context = { previousUser };

    const mockMutation = {
      mutate: vi.fn(),
      isPending: false,
      mutateAsync: vi.fn().mockResolvedValue({}),
    };
    mockUseMutation.mockReturnValue(mockMutation);

    renderHook(() => useUpdateUser(1));

    const mutationConfig = mockUseMutation.mock.calls[0][0];
    mutationConfig.onError(new Error("Update failed"), {}, context);

    // Line 95 should set the data back to previousUser
    expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
      ["admin", "users", 1],
      previousUser,
    );
  });
});
