import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";
import { AuthProvider } from "../../../contexts/AuthContext";
import { Login } from "../../../pages/auth/Login";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useAuth
const mockLogin = vi.fn();
const mockSetGlobalError = vi.fn();
const mockSetGlobalSuccess = vi.fn();

vi.mock("../../../hooks/useAuth", () => ({
  useAuth: () => ({
    login: mockLogin,
    globalError: null,
    setGlobalError: mockSetGlobalError,
    setGlobalSuccess: mockSetGlobalSuccess,
  }),
}));

const renderLogin = () => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>,
  );
};

test("renders login form correctly", () => {
  renderLogin();

  expect(screen.getByText("Users Manager")).toBeInTheDocument();
  expect(screen.getByText("Login:")).toBeInTheDocument();
  expect(screen.getByLabelText("Email")).toBeInTheDocument();
  expect(screen.getByLabelText("Password")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
  expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Register here" }),
  ).toBeInTheDocument();
});

test("form is incomplete when fields are empty", () => {
  renderLogin();

  const submitButton = screen.getByRole("button", { name: "Login" });
  expect(submitButton).toBeDisabled();
});

test("form becomes complete when both fields have values", async () => {
  renderLogin();

  const emailInput = screen.getByLabelText("Email");
  const passwordInput = screen.getByLabelText("Password");
  const submitButton = screen.getByRole("button", { name: "Login" });

  fireEvent.change(emailInput, { target: { value: "test@example.com" } });
  fireEvent.change(passwordInput, { target: { value: "password123" } });

  await waitFor(() => {
    expect(submitButton).not.toBeDisabled();
  });
});

test("form becomes incomplete when email is cleared", async () => {
  renderLogin();

  const emailInput = screen.getByLabelText("Email");
  const passwordInput = screen.getByLabelText("Password");
  const submitButton = screen.getByRole("button", { name: "Login" });

  fireEvent.change(emailInput, { target: { value: "test@example.com" } });
  fireEvent.change(passwordInput, { target: { value: "password123" } });

  await waitFor(() => {
    expect(submitButton).not.toBeDisabled();
  });

  fireEvent.change(emailInput, { target: { value: "" } });

  await waitFor(() => {
    expect(submitButton).toBeDisabled();
  });
});

test("form becomes incomplete when password is cleared", async () => {
  renderLogin();

  const emailInput = screen.getByLabelText("Email");
  const passwordInput = screen.getByLabelText("Password");
  const submitButton = screen.getByRole("button", { name: "Login" });

  fireEvent.change(emailInput, { target: { value: "test@example.com" } });
  fireEvent.change(passwordInput, { target: { value: "password123" } });

  await waitFor(() => {
    expect(submitButton).not.toBeDisabled();
  });

  fireEvent.change(passwordInput, { target: { value: "" } });

  await waitFor(() => {
    expect(submitButton).toBeDisabled();
  });
});

test("submits form successfully", async () => {
  mockLogin.mockResolvedValue({ redirect_to: "/dashboard" });

  renderLogin();

  const emailInput = screen.getByLabelText("Email");
  const passwordInput = screen.getByLabelText("Password");
  const submitButton = screen.getByRole("button", { name: "Login" });

  fireEvent.change(emailInput, { target: { value: "test@example.com" } });
  fireEvent.change(passwordInput, { target: { value: "password123" } });
  fireEvent.click(submitButton);

  await waitFor(() => {
    expect(mockLogin).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
  });
});

test("handles login error", async () => {
  const errorMessage = "Invalid credentials";
  mockLogin.mockRejectedValue(new Error(errorMessage));

  renderLogin();

  const emailInput = screen.getByLabelText("Email");
  const passwordInput = screen.getByLabelText("Password");
  const submitButton = screen.getByRole("button", { name: "Login" });

  fireEvent.change(emailInput, { target: { value: "test@example.com" } });
  fireEvent.change(passwordInput, { target: { value: "password123" } });
  fireEvent.click(submitButton);

  await waitFor(() => {
    expect(mockSetGlobalError).toHaveBeenCalledWith(errorMessage);
  });
});
