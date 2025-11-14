import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { expect, test, vi } from "vitest";
import { useCreateUser, useUpdateUser } from "../../../../hooks/queries";
import { useAuth } from "../../../../hooks/useAuth";
import { UserForm } from "../../../../pages/admin/components/UserForm";

// Mock the hooks
vi.mock("../../../../hooks/queries", () => ({
  useCreateUser: vi.fn(),
  useUpdateUser: vi.fn(),
}));

vi.mock("../../../../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const mockUser = {
  id: 1,
  full_name: "John Doe",
  email: "john@example.com",
  role: "user" as const,
};

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>,
  );
};

test("renders create user form", () => {
  vi.mocked(useCreateUser).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
    data: undefined,
    error: null,
    isError: false,
    isSuccess: false,
    isIdle: true,
    status: "idle",
    variables: undefined,
    reset: vi.fn(),
    mutate: vi.fn(),
    context: undefined,
    failureCount: 0,
    failureReason: null,
    isPaused: false,
    submittedAt: 0,
  });
  vi.mocked(useUpdateUser).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
    data: undefined,
    error: null,
    isError: false,
    isSuccess: false,
    isIdle: true,
    status: "idle",
    variables: undefined,
    reset: vi.fn(),
    mutate: vi.fn(),
    context: undefined,
    failureCount: 0,
    failureReason: null,
    isPaused: false,
    submittedAt: 0,
  });
  vi.mocked(useAuth).mockReturnValue({
    currentUser: null,
    token: null,
    isAuthenticated: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    isLoading: false,
    globalError: null,
    globalSuccess: null,
    setGlobalError: vi.fn(),
    setGlobalSuccess: vi.fn(),
    clearNotifications: vi.fn(),
  });

  renderWithProviders(<UserForm onSave={vi.fn()} onCancel={vi.fn()} />);

  expect(screen.getByText("Create User")).toBeInTheDocument();
  expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
  expect(screen.getByLabelText("Email")).toBeInTheDocument();
  expect(screen.getByLabelText("Role")).toBeInTheDocument();
  expect(screen.getByLabelText("Password")).toBeInTheDocument();
  expect(screen.getByLabelText("Avatar")).toBeInTheDocument();
});

test("renders edit user form", () => {
  vi.mocked(useCreateUser).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
    data: undefined,
    error: null,
    isError: false,
    isSuccess: false,
    isIdle: true,
    status: "idle",
    variables: undefined,
    reset: vi.fn(),
    mutate: vi.fn(),
    context: undefined,
    failureCount: 0,
    failureReason: null,
    isPaused: false,
    submittedAt: 0,
  });
  vi.mocked(useUpdateUser).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
    data: undefined,
    error: null,
    isError: false,
    isSuccess: false,
    isIdle: true,
    status: "idle",
    variables: undefined,
    reset: vi.fn(),
    mutate: vi.fn(),
    context: undefined,
    failureCount: 0,
    failureReason: null,
    isPaused: false,
    submittedAt: 0,
  });
  vi.mocked(useAuth).mockReturnValue({
    currentUser: {
      id: 2,
      full_name: "Admin",
      email: "admin@example.com",
      role: "admin",
    },
    token: null,
    isAuthenticated: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    isLoading: false,
    globalError: null,
    globalSuccess: null,
    setGlobalError: vi.fn(),
    setGlobalSuccess: vi.fn(),
    clearNotifications: vi.fn(),
  });

  renderWithProviders(
    <UserForm user={mockUser} onSave={vi.fn()} onCancel={vi.fn()} />,
  );

  expect(screen.getByText("Edit User")).toBeInTheDocument();
  expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
  expect(screen.getByDisplayValue("john@example.com")).toBeInTheDocument();
  expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
});

test("handles input changes", () => {
  vi.mocked(useCreateUser).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
    data: undefined,
    error: null,
    isError: false,
    isSuccess: false,
    isIdle: true,
    status: "idle",
    variables: undefined,
    reset: vi.fn(),
    mutate: vi.fn(),
    context: undefined,
    failureCount: 0,
    failureReason: null,
    isPaused: false,
    submittedAt: 0,
  });
  vi.mocked(useUpdateUser).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
    data: undefined,
    error: null,
    isError: false,
    isSuccess: false,
    isIdle: true,
    status: "idle",
    variables: undefined,
    reset: vi.fn(),
    mutate: vi.fn(),
    context: undefined,
    failureCount: 0,
    failureReason: null,
    isPaused: false,
    submittedAt: 0,
  });
  vi.mocked(useAuth).mockReturnValue({
    currentUser: null,
    token: null,
    isAuthenticated: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    isLoading: false,
    globalError: null,
    globalSuccess: null,
    setGlobalError: vi.fn(),
    setGlobalSuccess: vi.fn(),
    clearNotifications: vi.fn(),
  });

  renderWithProviders(<UserForm onSave={vi.fn()} onCancel={vi.fn()} />);

  const fullNameInput = screen.getByLabelText("Full Name");
  fireEvent.change(fullNameInput, { target: { value: "Jane Doe" } });
  expect(fullNameInput).toHaveValue("Jane Doe");
});

test("handles file change", () => {
  vi.mocked(useCreateUser).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
    data: undefined,
    error: null,
    isError: false,
    isSuccess: false,
    isIdle: true,
    status: "idle",
    variables: undefined,
    reset: vi.fn(),
    mutate: vi.fn(),
    context: undefined,
    failureCount: 0,
    failureReason: null,
    isPaused: false,
    submittedAt: 0,
  });
  vi.mocked(useUpdateUser).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
    data: undefined,
    error: null,
    isError: false,
    isSuccess: false,
    isIdle: true,
    status: "idle",
    variables: undefined,
    reset: vi.fn(),
    mutate: vi.fn(),
    context: undefined,
    failureCount: 0,
    failureReason: null,
    isPaused: false,
    submittedAt: 0,
  });
  vi.mocked(useAuth).mockReturnValue({
    currentUser: null,
    token: null,
    isAuthenticated: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    isLoading: false,
    globalError: null,
    globalSuccess: null,
    setGlobalError: vi.fn(),
    setGlobalSuccess: vi.fn(),
    clearNotifications: vi.fn(),
  });

  renderWithProviders(<UserForm onSave={vi.fn()} onCancel={vi.fn()} />);

  const fileInput = screen.getByLabelText("Avatar");
  const file = new File(["test"], "test.png", { type: "image/png" });
  fireEvent.change(fileInput, { target: { files: [file] } });
});

test("submits create user form successfully", async () => {
  const mockMutateAsync = vi.fn().mockResolvedValue({ data: mockUser });
  vi.mocked(useCreateUser).mockReturnValue({
    mutateAsync: mockMutateAsync,
    isPending: false,
    data: undefined,
    error: null,
    isError: false,
    isSuccess: false,
    isIdle: true,
    status: "idle",
    variables: undefined,
    reset: vi.fn(),
    mutate: vi.fn(),
    context: undefined,
    failureCount: 0,
    failureReason: null,
    isPaused: false,
    submittedAt: 0,
  });
  vi.mocked(useUpdateUser).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
    data: undefined,
    error: null,
    isError: false,
    isSuccess: false,
    isIdle: true,
    status: "idle",
    variables: undefined,
    reset: vi.fn(),
    mutate: vi.fn(),
    context: undefined,
    failureCount: 0,
    failureReason: null,
    isPaused: false,
    submittedAt: 0,
  });
  vi.mocked(useAuth).mockReturnValue({
    currentUser: null,
    token: null,
    isAuthenticated: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    isLoading: false,
    globalError: null,
    globalSuccess: null,
    setGlobalError: vi.fn(),
    setGlobalSuccess: vi.fn(),
    clearNotifications: vi.fn(),
  });

  const mockOnSave = vi.fn();
  renderWithProviders(<UserForm onSave={mockOnSave} onCancel={vi.fn()} />);

  fireEvent.change(screen.getByLabelText("Full Name"), {
    target: { value: "Jane Doe" },
  });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "jane@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "password123" },
  });

  fireEvent.click(screen.getByText("Save"));

  await waitFor(() => {
    expect(mockMutateAsync).toHaveBeenCalledWith({
      full_name: "Jane Doe",
      email: "jane@example.com",
      role: "user",
      password: "password123",
    });
    expect(mockOnSave).toHaveBeenCalledWith(mockUser);
  });
});

test("submits update user form successfully", async () => {
  const mockMutateAsync = vi
    .fn()
    .mockResolvedValue({ data: { ...mockUser, full_name: "Updated Name" } });
  vi.mocked(useCreateUser).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
    data: undefined,
    error: null,
    isError: false,
    isSuccess: false,
    isIdle: true,
    status: "idle",
    variables: undefined,
    reset: vi.fn(),
    mutate: vi.fn(),
    context: undefined,
    failureCount: 0,
    failureReason: null,
    isPaused: false,
    submittedAt: 0,
  });
  vi.mocked(useUpdateUser).mockReturnValue({
    mutateAsync: mockMutateAsync,
    isPending: false,
    data: undefined,
    error: null,
    isError: false,
    isSuccess: false,
    isIdle: true,
    status: "idle",
    variables: undefined,
    reset: vi.fn(),
    mutate: vi.fn(),
    context: undefined,
    failureCount: 0,
    failureReason: null,
    isPaused: false,
    submittedAt: 0,
  });
  vi.mocked(useAuth).mockReturnValue({
    currentUser: {
      id: 2,
      full_name: "Admin",
      email: "admin@example.com",
      role: "admin",
    },
    token: null,
    isAuthenticated: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    isLoading: false,
    globalError: null,
    globalSuccess: null,
    setGlobalError: vi.fn(),
    setGlobalSuccess: vi.fn(),
    clearNotifications: vi.fn(),
  });

  const mockOnSave = vi.fn();
  renderWithProviders(
    <UserForm user={mockUser} onSave={mockOnSave} onCancel={vi.fn()} />,
  );

  fireEvent.change(screen.getByDisplayValue("John Doe"), {
    target: { value: "Updated Name" },
  });

  fireEvent.click(screen.getByText("Save"));

  await waitFor(() => {
    expect(mockMutateAsync).toHaveBeenCalledWith({
      full_name: "Updated Name",
      email: "john@example.com",
      role: "user",
    });
    expect(mockOnSave).toHaveBeenCalledWith({
      ...mockUser,
      full_name: "Updated Name",
    });
  });
});

test("handles submit error", async () => {
  const mockMutateAsync = vi.fn().mockRejectedValue(new Error("API Error"));
  vi.mocked(useCreateUser).mockReturnValue({
    mutateAsync: mockMutateAsync,
    isPending: false,
    data: undefined,
    error: null,
    isError: false,
    isSuccess: false,
    isIdle: true,
    status: "idle",
    variables: undefined,
    reset: vi.fn(),
    mutate: vi.fn(),
    context: undefined,
    failureCount: 0,
    failureReason: null,
    isPaused: false,
    submittedAt: 0,
  });
  vi.mocked(useUpdateUser).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
    data: undefined,
    error: null,
    isError: false,
    isSuccess: false,
    isIdle: true,
    status: "idle",
    variables: undefined,
    reset: vi.fn(),
    mutate: vi.fn(),
    context: undefined,
    failureCount: 0,
    failureReason: null,
    isPaused: false,
    submittedAt: 0,
  });
  vi.mocked(useAuth).mockReturnValue({
    currentUser: null,
    token: null,
    isAuthenticated: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    isLoading: false,
    globalError: null,
    globalSuccess: null,
    setGlobalError: vi.fn(),
    setGlobalSuccess: vi.fn(),
    clearNotifications: vi.fn(),
  });

  const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  renderWithProviders(<UserForm onSave={vi.fn()} onCancel={vi.fn()} />);

  fireEvent.change(screen.getByLabelText("Full Name"), {
    target: { value: "Jane Doe" },
  });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "jane@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "password123" },
  });

  fireEvent.click(screen.getByText("Save"));

  await waitFor(() => {
    expect(screen.getByText("API Error")).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalledWith(
      "Save user error:",
      expect.any(Error),
    );
  });

  consoleSpy.mockRestore();
});

test("disables role select for current user", () => {
  vi.mocked(useCreateUser).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
    data: undefined,
    error: null,
    isError: false,
    isSuccess: false,
    isIdle: true,
    status: "idle",
    variables: undefined,
    reset: vi.fn(),
    mutate: vi.fn(),
    context: undefined,
    failureCount: 0,
    failureReason: null,
    isPaused: false,
    submittedAt: 0,
  });
  vi.mocked(useUpdateUser).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
    data: undefined,
    error: null,
    isError: false,
    isSuccess: false,
    isIdle: true,
    status: "idle",
    variables: undefined,
    reset: vi.fn(),
    mutate: vi.fn(),
    context: undefined,
    failureCount: 0,
    failureReason: null,
    isPaused: false,
    submittedAt: 0,
  });
  vi.mocked(useAuth).mockReturnValue({
    currentUser: {
      id: 1,
      full_name: "John",
      email: "john@example.com",
      role: "user",
    },
    token: null,
    isAuthenticated: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    isLoading: false,
    globalError: null,
    globalSuccess: null,
    setGlobalError: vi.fn(),
    setGlobalSuccess: vi.fn(),
    clearNotifications: vi.fn(),
  });

  renderWithProviders(
    <UserForm user={mockUser} onSave={vi.fn()} onCancel={vi.fn()} />,
  );

  const roleSelect = screen.getByLabelText("Role");
  expect(roleSelect).toBeDisabled();
});

test("shows loading state", () => {
  vi.mocked(useCreateUser).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: true,
    data: undefined,
    error: null,
    isError: false,
    isSuccess: false,
    isIdle: false,
    status: "pending",
    variables: {},
    reset: vi.fn(),
    mutate: vi.fn(),
    context: undefined,
    failureCount: 0,
    failureReason: null,
    isPaused: false,
    submittedAt: 0,
  });
  vi.mocked(useUpdateUser).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
    data: undefined,
    error: null,
    isError: false,
    isSuccess: false,
    isIdle: true,
    status: "idle",
    variables: undefined,
    reset: vi.fn(),
    mutate: vi.fn(),
    context: undefined,
    failureCount: 0,
    failureReason: null,
    isPaused: false,
    submittedAt: 0,
  });
  vi.mocked(useAuth).mockReturnValue({
    currentUser: null,
    token: null,
    isAuthenticated: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    isLoading: false,
    globalError: null,
    globalSuccess: null,
    setGlobalError: vi.fn(),
    setGlobalSuccess: vi.fn(),
    clearNotifications: vi.fn(),
  });

  renderWithProviders(<UserForm onSave={vi.fn()} onCancel={vi.fn()} />);

  expect(screen.getByText("Saving...")).toBeInTheDocument();
  expect(screen.getByText("Saving...")).toBeDisabled();
});
