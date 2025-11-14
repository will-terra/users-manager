import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { AuthProvider } from "../../../contexts/AuthContext";
import { Register } from "../../../pages/auth/Register";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useAuth hook
vi.mock("../../../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../../../hooks/useAuth";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>{component}</AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>,
  );
};

describe("Register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders register form", () => {
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      register: vi.fn(),
      globalError: null,
      setGlobalError: vi.fn(),
      setGlobalSuccess: vi.fn(),
      currentUser: null,
      token: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      isLoading: false,
      globalSuccess: null,
      clearNotifications: vi.fn(),
    });

    renderWithProviders(<Register />);

    expect(screen.getByText("Users Manager")).toBeInTheDocument();
    expect(screen.getByText("Register:")).toBeInTheDocument();
    expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    expect(screen.getByText("Register")).toBeInTheDocument();
  });

  test("handles input changes", () => {
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      register: vi.fn(),
      globalError: null,
      setGlobalError: vi.fn(),
      setGlobalSuccess: vi.fn(),
      currentUser: null,
      token: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      isLoading: false,
      globalSuccess: null,
      clearNotifications: vi.fn(),
    });

    renderWithProviders(<Register />);

    const fullNameInput = screen.getByLabelText("Full Name");
    fireEvent.change(fullNameInput, { target: { value: "John Doe" } });
    expect(fullNameInput).toHaveValue("John Doe");

    const emailInput = screen.getByLabelText("Email");
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    expect(emailInput).toHaveValue("john@example.com");

    const passwordInput = screen.getByLabelText("Password");
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    expect(passwordInput).toHaveValue("password123");

    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    fireEvent.change(confirmPasswordInput, {
      target: { value: "password123" },
    });
    expect(confirmPasswordInput).toHaveValue("password123");
  });

  test("disables submit button when form is incomplete", () => {
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      register: vi.fn(),
      globalError: null,
      setGlobalError: vi.fn(),
      setGlobalSuccess: vi.fn(),
      currentUser: null,
      token: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      isLoading: false,
      globalSuccess: null,
      clearNotifications: vi.fn(),
    });

    renderWithProviders(<Register />);

    const submitButton = screen.getByText("Register");
    expect(submitButton).toBeDisabled();

    // Fill only some fields
    fireEvent.change(screen.getByLabelText("Full Name"), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "john@example.com" },
    });
    expect(submitButton).toBeDisabled();

    // Fill all fields
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "password123" },
    });
    expect(submitButton).not.toBeDisabled();
  });

  test("disables submit button when passwords do not match", () => {
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      register: vi.fn(),
      globalError: null,
      setGlobalError: vi.fn(),
      setGlobalSuccess: vi.fn(),
      currentUser: null,
      token: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      isLoading: false,
      globalSuccess: null,
      clearNotifications: vi.fn(),
    });

    renderWithProviders(<Register />);

    fireEvent.change(screen.getByLabelText("Full Name"), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "password456" },
    });

    const submitButton = screen.getByText("Register");
    expect(submitButton).toBeDisabled();
    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
  });

  test("submits form successfully", async () => {
    const mockRegister = vi
      .fn()
      .mockResolvedValue({ redirect_to: "/dashboard" });
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      register: mockRegister,
      globalError: null,
      setGlobalError: vi.fn(),
      setGlobalSuccess: vi.fn(),
      currentUser: null,
      token: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      isLoading: false,
      globalSuccess: null,
      clearNotifications: vi.fn(),
    });

    renderWithProviders(<Register />);

    fireEvent.change(screen.getByLabelText("Full Name"), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByText("Register"));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        full_name: "John Doe",
        email: "john@example.com",
        password: "password123",
        password_confirmation: "password123",
      });
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard", {
        replace: true,
      });
    });
  });

  test("submits form successfully with default redirect", async () => {
    const mockRegister = vi.fn().mockResolvedValue({});
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      register: mockRegister,
      globalError: null,
      setGlobalError: vi.fn(),
      setGlobalSuccess: vi.fn(),
      currentUser: null,
      token: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      isLoading: false,
      globalSuccess: null,
      clearNotifications: vi.fn(),
    });

    renderWithProviders(<Register />);

    fireEvent.change(screen.getByLabelText("Full Name"), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByText("Register"));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/profile", { replace: true });
    });
  });

  test("handles registration error", async () => {
    const mockSetGlobalError = vi.fn();
    const mockRegister = vi
      .fn()
      .mockRejectedValue(new Error("Registration failed"));
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      register: mockRegister,
      globalError: null,
      setGlobalError: mockSetGlobalError,
      setGlobalSuccess: vi.fn(),
      currentUser: null,
      token: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      isLoading: false,
      globalSuccess: null,
      clearNotifications: vi.fn(),
    });

    renderWithProviders(<Register />);

    fireEvent.change(screen.getByLabelText("Full Name"), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByText("Register"));

    await waitFor(() => {
      expect(mockSetGlobalError).toHaveBeenCalledWith("Registration failed");
    });
  });

  test("handles unexpected error", async () => {
    const mockSetGlobalError = vi.fn();
    const mockRegister = vi.fn().mockRejectedValue("string error");
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      register: mockRegister,
      globalError: null,
      setGlobalError: mockSetGlobalError,
      setGlobalSuccess: vi.fn(),
      currentUser: null,
      token: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      isLoading: false,
    });

    renderWithProviders(<Register />);

    fireEvent.change(screen.getByLabelText("Full Name"), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByText("Register"));

    await waitFor(() => {
      expect(mockSetGlobalError).toHaveBeenCalledWith(
        "An unexpected error occurred. Please try again.",
      );
    });
  });

  test("shows loading state", async () => {
    const mockRegister = vi
      .fn()
      .mockImplementation(() => new Promise(() => {})); // Never resolves
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      register: mockRegister,
      globalError: null,
      setGlobalError: vi.fn(),
      setGlobalSuccess: vi.fn(),
      currentUser: null,
      token: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      isLoading: false,
      globalSuccess: null,
      clearNotifications: vi.fn(),
    });

    renderWithProviders(<Register />);

    fireEvent.change(screen.getByLabelText("Full Name"), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByText("Register"));

    await waitFor(() => {
      expect(screen.getByText("Creating Account...")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Full Name")).toBeDisabled();
    expect(screen.getByLabelText("Email")).toBeDisabled();
    expect(screen.getByLabelText("Password")).toBeDisabled();
    expect(screen.getByLabelText("Confirm Password")).toBeDisabled();
  });

  test("displays global error", () => {
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      register: vi.fn(),
      globalError: "Global error message",
      setGlobalError: vi.fn(),
      setGlobalSuccess: vi.fn(),
      currentUser: null,
      token: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      isLoading: false,
      globalSuccess: null,
      clearNotifications: vi.fn(),
    });

    renderWithProviders(<Register />);

    expect(screen.getByText("Global error message")).toBeInTheDocument();
  });
});
