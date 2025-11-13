import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { useAuth } from "../../hooks/useAuth";
import { Header } from "../../layout/Header";

// Mock the useAuth hook
vi.mock("../../hooks/useAuth");
const mockUseAuth = vi.mocked(useAuth);

const mockUser = {
  id: 1,
  full_name: "John Doe",
  email: "john@example.com",
  role: "user",
};

describe("Header", () => {
  test("renders brand name", () => {
    mockUseAuth.mockReturnValue({
      currentUser: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
      loading: false,
      error: null,
    });

    render(<Header />);

    expect(screen.getByText("Users Manager")).toBeInTheDocument();
  });

  test("does not render user menu when no current user", () => {
    mockUseAuth.mockReturnValue({
      currentUser: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
      loading: false,
      error: null,
    });

    render(<Header />);

    expect(screen.queryByText("Logout")).not.toBeInTheDocument();
  });

  test("renders user greeting and logout button when user is logged in", () => {
    const mockLogout = vi.fn();
    mockUseAuth.mockReturnValue({
      currentUser: mockUser,
      login: vi.fn(),
      register: vi.fn(),
      logout: mockLogout,
      refresh: vi.fn(),
      loading: false,
      error: null,
    });

    render(<Header />);

    expect(screen.getByText("John")).toBeInTheDocument(); // First name from full_name
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  test("calls logout when logout button is clicked", () => {
    const mockLogout = vi.fn();
    mockUseAuth.mockReturnValue({
      currentUser: mockUser,
      login: vi.fn(),
      register: vi.fn(),
      logout: mockLogout,
      refresh: vi.fn(),
      loading: false,
      error: null,
    });

    render(<Header />);

    const logoutButton = screen.getByText("Logout");
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
  });

  test("handles user with single name", () => {
    const singleNameUser = { ...mockUser, full_name: "John" };
    mockUseAuth.mockReturnValue({
      currentUser: singleNameUser,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
      loading: false,
      error: null,
    });

    render(<Header />);

    expect(screen.getByText("John")).toBeInTheDocument();
  });

  test("handles user with multiple spaces in name", () => {
    const spacedNameUser = { ...mockUser, full_name: "  John   Doe  " };
    mockUseAuth.mockReturnValue({
      currentUser: spacedNameUser,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
      loading: false,
      error: null,
    });

    render(<Header />);

    expect(screen.getByText("John")).toBeInTheDocument();
  });
});
