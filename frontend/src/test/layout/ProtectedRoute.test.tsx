import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";
import { ProtectedRoute } from "../../layout/ProtectedRoute";

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

test("shows loading when isLoading is true", () => {
  mockUseAuth.mockReturnValue({ currentUser: null, isLoading: true });
  render(
    <MemoryRouter>
      <ProtectedRoute>
        <div>Test Content</div>
      </ProtectedRoute>
    </MemoryRouter>,
  );
  expect(screen.getByText("Loading...")).toBeInTheDocument();
  expect(screen.queryByText("Test Content")).not.toBeInTheDocument();
});

test("redirects to login when no currentUser", () => {
  mockUseAuth.mockReturnValue({ currentUser: null, isLoading: false });
  render(
    <MemoryRouter>
      <ProtectedRoute>
        <div>Test Content</div>
      </ProtectedRoute>
    </MemoryRouter>,
  );
  expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  expect(screen.queryByText("Test Content")).not.toBeInTheDocument();
});

test("redirects to profile when adminOnly and user is not admin", () => {
  mockUseAuth.mockReturnValue({
    currentUser: { role: "user" },
    isLoading: false,
  });
  render(
    <MemoryRouter>
      <ProtectedRoute adminOnly>
        <div>Test Content</div>
      </ProtectedRoute>
    </MemoryRouter>,
  );
  expect(screen.queryByText("Test Content")).not.toBeInTheDocument();
});

test("renders children when user is admin and adminOnly", () => {
  mockUseAuth.mockReturnValue({
    currentUser: { role: "admin" },
    isLoading: false,
  });
  render(
    <MemoryRouter>
      <ProtectedRoute adminOnly>
        <div>Test Content</div>
      </ProtectedRoute>
    </MemoryRouter>,
  );
  expect(screen.getByText("Test Content")).toBeInTheDocument();
});

test("renders children when user is logged in and not adminOnly", () => {
  mockUseAuth.mockReturnValue({
    currentUser: { role: "user" },
    isLoading: false,
  });
  render(
    <MemoryRouter>
      <ProtectedRoute>
        <div>Test Content</div>
      </ProtectedRoute>
    </MemoryRouter>,
  );
  expect(screen.getByText("Test Content")).toBeInTheDocument();
});
