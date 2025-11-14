import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";
import { PublicRoute } from "../../layout/PublicRoute";

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

test("shows loading when isLoading is true", () => {
  mockUseAuth.mockReturnValue({ currentUser: null, isLoading: true });
  render(
    <MemoryRouter>
      <PublicRoute>
        <div>Test Content</div>
      </PublicRoute>
    </MemoryRouter>,
  );
  expect(screen.getByText("Loading...")).toBeInTheDocument();
  expect(screen.queryByText("Test Content")).not.toBeInTheDocument();
});

test("redirects admin to dashboard when logged in", () => {
  mockUseAuth.mockReturnValue({
    currentUser: { role: "admin" },
    isLoading: false,
  });
  render(
    <MemoryRouter>
      <PublicRoute>
        <div>Test Content</div>
      </PublicRoute>
    </MemoryRouter>,
  );
  expect(screen.queryByText("Test Content")).not.toBeInTheDocument();
});

test("redirects user to profile when logged in", () => {
  mockUseAuth.mockReturnValue({
    currentUser: { role: "user" },
    isLoading: false,
  });
  render(
    <MemoryRouter>
      <PublicRoute>
        <div>Test Content</div>
      </PublicRoute>
    </MemoryRouter>,
  );
  expect(screen.queryByText("Test Content")).not.toBeInTheDocument();
});

test("renders children when not logged in", () => {
  mockUseAuth.mockReturnValue({ currentUser: null, isLoading: false });
  render(
    <MemoryRouter>
      <PublicRoute>
        <div>Test Content</div>
      </PublicRoute>
    </MemoryRouter>,
  );
  expect(screen.getByText("Test Content")).toBeInTheDocument();
});
