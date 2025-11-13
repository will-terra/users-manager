import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { AuthContext, AuthProvider } from "../../contexts/AuthContext";
import { authApi } from "../../services/api";
import { authService } from "../../services/authService";

// Mock the services (paths match imports above)
vi.mock("../../services/api", () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
  },
}));

vi.mock("../../services/authService", () => ({
  authService: {
    getToken: vi.fn(),
    isAuthenticated: vi.fn(),
    setToken: vi.fn(),
    clearToken: vi.fn(),
  },
}));

// Test component that consumes the AuthContext
const TestComponent: React.FC = () => {
  const auth = React.useContext(AuthContext);
  if (!auth) return <div>No auth context</div>;

  return (
    <div>
      <div data-testid="current-user">
        {auth.currentUser ? auth.currentUser.email : "No user"}
      </div>
      <div data-testid="token">{auth.token || "No token"}</div>
      <div data-testid="is-authenticated">
        {auth.isAuthenticated ? "Yes" : "No"}
      </div>
      <div data-testid="is-loading">
        {auth.isLoading ? "Loading" : "Not loading"}
      </div>
      <div data-testid="global-error">{auth.globalError || "No error"}</div>
      <div data-testid="global-success">
        {auth.globalSuccess || "No success"}
      </div>
      <button
        data-testid="login-btn"
        onClick={() =>
          auth
            .login({ email: "test@example.com", password: "password" })
            .catch(() => {})
        }
      >
        Login
      </button>
      <button
        data-testid="register-btn"
        onClick={() =>
          auth
            .register({
              full_name: "Test User",
              email: "test@example.com",
              password: "password",
              password_confirmation: "password",
            })
            .catch(() => {})
        }
      >
        Register
      </button>
      <button
        data-testid="logout-btn"
        onClick={() => auth.logout().catch(() => {})}
      >
        Logout
      </button>
      <button
        data-testid="refresh-btn"
        onClick={() => auth.refreshUser().catch(() => {})}
      >
        Refresh
      </button>
      <button
        data-testid="set-error-btn"
        onClick={() => auth.setGlobalError("Test error")}
      >
        Set Error
      </button>
      <button
        data-testid="set-success-btn"
        onClick={() => auth.setGlobalSuccess("Test success")}
      >
        Set Success
      </button>
      <button
        data-testid="clear-notifications-btn"
        onClick={auth.clearNotifications}
      >
        Clear Notifications
      </button>
    </div>
  );
};

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{component}</AuthProvider>
    </QueryClientProvider>,
  );
};

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks
    authService.getToken.mockReturnValue(null);
    authService.isAuthenticated.mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe("initial state", () => {
    test("provides initial context values", () => {
      renderWithProviders(<TestComponent />);

      expect(screen.getByTestId("current-user")).toHaveTextContent("No user");
      expect(screen.getByTestId("token")).toHaveTextContent("No token");
      expect(screen.getByTestId("is-authenticated")).toHaveTextContent("No");
      expect(screen.getByTestId("is-loading")).toHaveTextContent("Not loading");
      expect(screen.getByTestId("global-error")).toHaveTextContent("No error");
      expect(screen.getByTestId("global-success")).toHaveTextContent(
        "No success",
      );
    });

    test("initializes with token from authService", () => {
      authService.getToken.mockReturnValue("initial.token");

      renderWithProviders(<TestComponent />);

      expect(screen.getByTestId("token")).toHaveTextContent("initial.token");
    });

    test("initializes with authenticated state from authService", () => {
      authService.isAuthenticated.mockReturnValue(true);

      renderWithProviders(<TestComponent />);

      expect(screen.getByTestId("is-authenticated")).toHaveTextContent("Yes");
    });
  });

  describe("login", () => {
    test("successfully logs in user", async () => {
      const user = {
        id: 1,
        email: "test@example.com",
        full_name: "Test User",
        role: "user",
      };
      const mockResponse = { data: { user, token: "new.token" } };

      authApi.login.mockResolvedValue(mockResponse);

      renderWithProviders(<TestComponent />);

      fireEvent.click(screen.getByTestId("login-btn"));

      await waitFor(() => {
        expect(authApi.login).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password",
        });
      });

      expect(screen.getByTestId("token")).toHaveTextContent("new.token");
    });

    test("handles login error", async () => {
      const error = new Error("Login failed");
      authApi.login.mockRejectedValue(error);

      renderWithProviders(<TestComponent />);

      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      fireEvent.click(screen.getByTestId("login-btn"));

      await waitFor(() => {
        expect(authApi.login).toHaveBeenCalled();
      });

      // Token should remain unchanged
      expect(screen.getByTestId("token")).toHaveTextContent("No token");

      consoleSpy.mockRestore();
    });
  });

  describe("register", () => {
    test("successfully registers user", async () => {
      const user = {
        id: 1,
        email: "test@example.com",
        full_name: "Test User",
        role: "user",
      };
      const mockResponse = { data: { user, token: "new.token" } };

      authApi.register.mockResolvedValue(mockResponse);

      renderWithProviders(<TestComponent />);

      fireEvent.click(screen.getByTestId("register-btn"));

      await waitFor(() => {
        expect(authApi.register).toHaveBeenCalledWith({
          full_name: "Test User",
          email: "test@example.com",
          password: "password",
          password_confirmation: "password",
        });
      });

      expect(screen.getByTestId("token")).toHaveTextContent("new.token");
      expect(screen.getByTestId("is-loading")).toHaveTextContent("Not loading");
    });

    test("sets loading state during registration", async () => {
      authApi.register.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      renderWithProviders(<TestComponent />);

      fireEvent.click(screen.getByTestId("register-btn"));

      expect(screen.getByTestId("is-loading")).toHaveTextContent("Loading");

      await waitFor(() => {
        expect(screen.getByTestId("is-loading")).toHaveTextContent(
          "Not loading",
        );
      });
    });

    test("handles registration error", async () => {
      const error = new Error("Registration failed");
      authApi.register.mockRejectedValue(error);

      renderWithProviders(<TestComponent />);

      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      fireEvent.click(screen.getByTestId("register-btn"));

      await waitFor(() => {
        expect(screen.getByTestId("is-loading")).toHaveTextContent(
          "Not loading",
        );
      });

      expect(authApi.register).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("logout", () => {
    test("successfully logs out user", async () => {
      authService.getToken.mockReturnValue("existing.token");
      authApi.logout.mockResolvedValue();

      renderWithProviders(<TestComponent />);

      fireEvent.click(screen.getByTestId("logout-btn"));

      await waitFor(() => {
        expect(authApi.logout).toHaveBeenCalled();
      });

      expect(screen.getByTestId("token")).toHaveTextContent("No token");
      expect(screen.getByTestId("is-loading")).toHaveTextContent("Not loading");
    });

    test("sets loading state during logout", async () => {
      authApi.logout.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      renderWithProviders(<TestComponent />);

      fireEvent.click(screen.getByTestId("logout-btn"));

      expect(screen.getByTestId("is-loading")).toHaveTextContent("Loading");

      await waitFor(() => {
        expect(screen.getByTestId("is-loading")).toHaveTextContent(
          "Not loading",
        );
      });
    });

    test("handles logout error gracefully", async () => {
      const error = new Error("Logout failed");
      authApi.logout.mockRejectedValue(error);

      renderWithProviders(<TestComponent />);

      // Suppress console.warn for this test since logout logs warnings
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      fireEvent.click(screen.getByTestId("logout-btn"));

      await waitFor(() => {
        expect(screen.getByTestId("is-loading")).toHaveTextContent(
          "Not loading",
        );
      });

      expect(authApi.logout).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("refreshUser", () => {
    test("refreshes user data when token exists", async () => {
      authService.getToken.mockReturnValue("existing.token");
      const user = {
        id: 1,
        email: "test@example.com",
        full_name: "Test User",
        role: "user",
      };
      authApi.getProfile.mockResolvedValue({ data: user });

      renderWithProviders(<TestComponent />);

      fireEvent.click(screen.getByTestId("refresh-btn"));

      await waitFor(() => {
        expect(authApi.getProfile).toHaveBeenCalled();
      });

      expect(screen.getByTestId("current-user")).toHaveTextContent(
        "test@example.com",
      );
      expect(screen.getByTestId("is-loading")).toHaveTextContent("Not loading");
    });

    test("does not refresh when no token", async () => {
      authService.getToken.mockReturnValue(null);

      renderWithProviders(<TestComponent />);

      fireEvent.click(screen.getByTestId("refresh-btn"));

      expect(authApi.getProfile).not.toHaveBeenCalled();
    });

    test("sets loading state during refresh", async () => {
      authService.getToken.mockReturnValue("existing.token");
      authApi.getProfile.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      renderWithProviders(<TestComponent />);

      fireEvent.click(screen.getByTestId("refresh-btn"));

      expect(screen.getByTestId("is-loading")).toHaveTextContent("Loading");

      await waitFor(() => {
        expect(screen.getByTestId("is-loading")).toHaveTextContent(
          "Not loading",
        );
      });
    });
  });

  describe("notifications", () => {
    test("sets global error message", async () => {
      renderWithProviders(<TestComponent />);

      fireEvent.click(screen.getByTestId("set-error-btn"));

      expect(screen.getByTestId("global-error")).toHaveTextContent(
        "Test error",
      );
    });

    test("sets global success message", async () => {
      renderWithProviders(<TestComponent />);

      fireEvent.click(screen.getByTestId("set-success-btn"));

      expect(screen.getByTestId("global-success")).toHaveTextContent(
        "Test success",
      );
    });

    test("clears notifications", async () => {
      renderWithProviders(<TestComponent />);

      fireEvent.click(screen.getByTestId("set-error-btn"));
      fireEvent.click(screen.getByTestId("set-success-btn"));
      fireEvent.click(screen.getByTestId("clear-notifications-btn"));

      expect(screen.getByTestId("global-error")).toHaveTextContent("No error");
      expect(screen.getByTestId("global-success")).toHaveTextContent(
        "No success",
      );
    });
  });

  describe("context integration", () => {
    test("shows no auth context message when used outside provider", () => {
      render(<TestComponent />);

      expect(screen.getByText("No auth context")).toBeInTheDocument();
    });
  });
});
