// Mock dependencies
vi.mock("@tanstack/react-query");
vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
}));
vi.mock("../../../services/api", () => ({
  authApi: {
    getProfile: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { useNavigate } from "react-router-dom";
import { describe, expect, test, vi } from "vitest";
import { authApi } from "../../../services/api";
import {
  useLogin,
  useLogout,
  useProfile,
  useRegister,
  useUpdateProfile,
} from "../../../hooks/queries/useAuthQueries";

const mockUseQuery = vi.mocked(useQuery);
const mockUseMutation = vi.mocked(useMutation);
const mockUseQueryClient = vi.mocked(useQueryClient);
const mockUseNavigate = vi.mocked(useNavigate);
const mockAuthApi = vi.mocked(authApi);

describe("useAuthQueries", () => {
  const mockQueryClient = {
    invalidateQueries: vi.fn(),
    cancelQueries: vi.fn(),
    getQueryData: vi.fn(),
    setQueryData: vi.fn(),
    clear: vi.fn(),
  };

  const mockNavigate = vi.fn();

  beforeEach(() => {
    mockUseQueryClient.mockReturnValue(mockQueryClient);
    mockUseNavigate.mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("useProfile", () => {
    test("calls useQuery with correct parameters", () => {
      const mockResult = {
        data: { data: { id: 1, email: "test@example.com" } },
        isLoading: false,
      };
      mockUseQuery.mockReturnValue(mockResult);

      const { result } = renderHook(() => useProfile());

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ["auth", "profile"],
        queryFn: expect.any(Function),
        retry: false,
      });
      expect(result.current).toBe(mockResult);
    });

    test("queryFn calls authApi.getProfile", () => {
      mockUseQuery.mockImplementation(({ queryFn }) => {
        const result = queryFn();
        return { data: result, isLoading: false };
      });

      renderHook(() => useProfile());

      expect(mockAuthApi.getProfile).toHaveBeenCalled();
    });
  });

  describe("useLogin", () => {
    test("returns mutation with correct configuration", () => {
      const mockMutation = { mutate: vi.fn(), isPending: false };
      mockUseMutation.mockReturnValue(mockMutation);

      const { result } = renderHook(() => useLogin());

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onSuccess: expect.any(Function),
      });
      expect(result.current).toBe(mockMutation);
    });

    test("mutationFn calls authApi.login with credentials", () => {
      const credentials = {
        email: "test@example.com",
        password: "password123",
      };
      mockUseMutation.mockImplementation(({ mutationFn }) => {
        mutationFn(credentials);
        return { mutate: vi.fn(), isPending: false };
      });

      renderHook(() => useLogin());

      expect(mockAuthApi.login).toHaveBeenCalledWith(credentials);
    });

    test("onSuccess sets profile data in cache and navigates", () => {
      const userData = {
        id: 1,
        email: "test@example.com",
        full_name: "Test User",
      };
      const responseData = { data: { user: userData } };
      const mockMutation = {
        mutate: vi.fn(),
        isPending: false,
        mutateAsync: vi.fn().mockResolvedValue(responseData),
      };
      mockUseMutation.mockReturnValue(mockMutation);

      renderHook(() => useLogin());

      const mutationConfig = mockUseMutation.mock.calls[0][0];
      mutationConfig.onSuccess(responseData);

      expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
        ["auth", "profile"],
        { data: userData },
      );
      expect(mockNavigate).toHaveBeenCalledWith("/profile");
    });
  });

  describe("useRegister", () => {
    test("returns mutation with correct configuration", () => {
      const mockMutation = { mutate: vi.fn(), isPending: false };
      mockUseMutation.mockReturnValue(mockMutation);

      const { result } = renderHook(() => useRegister());

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onSuccess: expect.any(Function),
      });
      expect(result.current).toBe(mockMutation);
    });

    test("mutationFn calls authApi.register with userData", () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
        full_name: "Test User",
      };
      mockUseMutation.mockImplementation(({ mutationFn }) => {
        mutationFn(userData);
        return { mutate: vi.fn(), isPending: false };
      });

      renderHook(() => useRegister());

      expect(mockAuthApi.register).toHaveBeenCalledWith(userData);
    });

    test("onSuccess sets profile data in cache and navigates", () => {
      const userData = {
        id: 1,
        email: "test@example.com",
        full_name: "Test User",
      };
      const responseData = { data: { user: userData } };
      const mockMutation = {
        mutate: vi.fn(),
        isPending: false,
        mutateAsync: vi.fn().mockResolvedValue(responseData),
      };
      mockUseMutation.mockReturnValue(mockMutation);

      renderHook(() => useRegister());

      const mutationConfig = mockUseMutation.mock.calls[0][0];
      mutationConfig.onSuccess(responseData);

      expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
        ["auth", "profile"],
        { data: userData },
      );
      expect(mockNavigate).toHaveBeenCalledWith("/profile");
    });
  });

  describe("useLogout", () => {
    test("returns mutation with correct configuration", () => {
      const mockMutation = { mutate: vi.fn(), isPending: false };
      mockUseMutation.mockReturnValue(mockMutation);

      const { result } = renderHook(() => useLogout());

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onSuccess: expect.any(Function),
      });
      expect(result.current).toBe(mockMutation);
    });

    test("mutationFn calls authApi.logout", () => {
      mockUseMutation.mockImplementation(({ mutationFn }) => {
        mutationFn();
        return { mutate: vi.fn(), isPending: false };
      });

      renderHook(() => useLogout());

      expect(mockAuthApi.logout).toHaveBeenCalled();
    });

    test("onSuccess clears queries and navigates to login", () => {
      const mockMutation = {
        mutate: vi.fn(),
        isPending: false,
        mutateAsync: vi.fn().mockResolvedValue({}),
      };
      mockUseMutation.mockReturnValue(mockMutation);

      renderHook(() => useLogout());

      const mutationConfig = mockUseMutation.mock.calls[0][0];
      mutationConfig.onSuccess();

      expect(mockQueryClient.clear).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  describe("useUpdateProfile", () => {
    test("returns mutation with correct configuration", () => {
      const mockMutation = { mutate: vi.fn(), isPending: false };
      mockUseMutation.mockReturnValue(mockMutation);

      const { result } = renderHook(() => useUpdateProfile());

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onMutate: expect.any(Function),
        onError: expect.any(Function),
        onSuccess: expect.any(Function),
      });
      expect(result.current).toBe(mockMutation);
    });

    test("mutationFn calls authApi.updateProfile with userData", () => {
      const userData = { full_name: "Updated Name" };
      mockUseMutation.mockImplementation(({ mutationFn }) => {
        mutationFn(userData);
        return { mutate: vi.fn(), isPending: false };
      });

      renderHook(() => useUpdateProfile());

      expect(mockAuthApi.updateProfile).toHaveBeenCalledWith(userData);
    });

    test("onMutate cancels queries and optimistically updates", async () => {
      const previousProfile = { data: { id: 1, full_name: "Old Name" } };
      mockQueryClient.getQueryData.mockReturnValue(previousProfile);

      const mockMutation = {
        mutate: vi.fn(),
        isPending: false,
        mutateAsync: vi.fn().mockResolvedValue({}),
      };
      mockUseMutation.mockReturnValue(mockMutation);

      renderHook(() => useUpdateProfile());

      const mutationConfig = mockUseMutation.mock.calls[0][0];
      const context = await mutationConfig.onMutate({ full_name: "New Name" });

      expect(mockQueryClient.cancelQueries).toHaveBeenCalledWith({
        queryKey: ["auth", "profile"],
      });
      expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
        ["auth", "profile"],
        expect.any(Function),
      );
      expect(context).toEqual({ previousProfile });
    });

    test("onError rolls back optimistic update", () => {
      const previousProfile = { data: { id: 1, full_name: "Old Name" } };
      const context = { previousProfile };

      const mockMutation = {
        mutate: vi.fn(),
        isPending: false,
        mutateAsync: vi.fn().mockResolvedValue({}),
      };
      mockUseMutation.mockReturnValue(mockMutation);

      renderHook(() => useUpdateProfile());

      const mutationConfig = mockUseMutation.mock.calls[0][0];
      mutationConfig.onError(new Error("Update failed"), {}, context);

      expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
        ["auth", "profile"],
        previousProfile,
      );
    });

    test("onSuccess updates cache with server response", () => {
      const serverResponse = {
        data: { id: 1, full_name: "Server Updated Name" },
      };
      const mockMutation = {
        mutate: vi.fn(),
        isPending: false,
        mutateAsync: vi.fn().mockResolvedValue(serverResponse),
      };
      mockUseMutation.mockReturnValue(mockMutation);

      renderHook(() => useUpdateProfile());

      const mutationConfig = mockUseMutation.mock.calls[0][0];
      mutationConfig.onSuccess(serverResponse);

      expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
        ["auth", "profile"],
        serverResponse,
      );
    });
  });

  test("optimistically updates profile with old data setter", async () => {
    const previousProfile = {
      data: { id: 1, full_name: "Old Name", email: "test@test.com" },
    };
    mockQueryClient.getQueryData.mockReturnValue(previousProfile);

    const mockMutation = {
      mutate: vi.fn(),
      isPending: false,
      mutateAsync: vi.fn().mockResolvedValue({}),
    };
    mockUseMutation.mockReturnValue(mockMutation);

    renderHook(() => useUpdateProfile());

    const mutationConfig = mockUseMutation.mock.calls.at(-1)![0];
    await mutationConfig.onMutate({ full_name: "New Name" });

    // Verify setQueryData was called with a function
    const setQueryDataCall = mockQueryClient.setQueryData.mock.calls[0];
    expect(setQueryDataCall[0]).toEqual(["auth", "profile"]);

    // Call the updater function to test line 100
    const updaterFn = setQueryDataCall[1];
    const result = updaterFn(previousProfile);

    expect(result).toEqual({
      data: { id: 1, full_name: "New Name", email: "test@test.com" },
    });
  });
});
