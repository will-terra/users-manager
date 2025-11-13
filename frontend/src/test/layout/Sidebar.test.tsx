import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test, vi } from "vitest";
import { useAuth } from "../../hooks/useAuth";
import { Sidebar } from "../../layout/Sidebar";
import type { User } from "../../types/user";

// Mock the useAuth hook
vi.mock("../../hooks/useAuth");
const mockUseAuth = vi.mocked(useAuth);

const mockUser: User = {
  id: 1,
  full_name: "John Doe",
  email: "john@example.com",
  role: "user",
  has_avatar: false,
};

const mockAdminUser: User = {
  ...mockUser,
  role: "admin",
};

describe("Sidebar", () => {
  const renderSidebar = (pathname = "/") => {
    return render(
      <MemoryRouter initialEntries={[pathname]}>
        <Sidebar />
      </MemoryRouter>,
    );
  };

  test("renders profile navigation for regular user", () => {
    mockUseAuth.mockReturnValue({
      currentUser: mockUser,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
      loading: false,
      error: null,
    });

    renderSidebar();

    expect(screen.getByText("My Profile")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Users")).not.toBeInTheDocument();
    expect(screen.queryByText("Imports")).not.toBeInTheDocument();
  });

  test("renders admin navigation for admin user", () => {
    mockUseAuth.mockReturnValue({
      currentUser: mockAdminUser,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
      loading: false,
      error: null,
    });

    renderSidebar();

    expect(screen.getByText("My Profile")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("Imports")).toBeInTheDocument();
    expect(screen.getByText("Administration")).toBeInTheDocument();
  });

  test("does not render admin navigation when user is null", () => {
    mockUseAuth.mockReturnValue({
      currentUser: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
      loading: false,
      error: null,
    });

    renderSidebar();

    expect(screen.getByText("My Profile")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Users")).not.toBeInTheDocument();
    expect(screen.queryByText("Imports")).not.toBeInTheDocument();
    expect(screen.queryByText("Administration")).not.toBeInTheDocument();
  });

  test("applies active class to current route", () => {
    mockUseAuth.mockReturnValue({
      currentUser: mockUser,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
      loading: false,
      error: null,
    });

    renderSidebar("/profile");

    const profileLink = screen.getByText("My Profile").closest("a");
    expect(profileLink).toHaveClass("active");
  });

  test("does not apply active class to non-current routes", () => {
    mockUseAuth.mockReturnValue({
      currentUser: mockUser,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
      loading: false,
      error: null,
    });

    renderSidebar("/other");

    const profileLink = screen.getByText("My Profile").closest("a");
    expect(profileLink).not.toHaveClass("active");
  });

  test("renders navigation links with correct paths", () => {
    mockUseAuth.mockReturnValue({
      currentUser: mockUser,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
      loading: false,
      error: null,
    });

    renderSidebar();

    const profileLink = screen.getByText("My Profile").closest("a");
    expect(profileLink).toHaveAttribute("href", "/profile");
  });

  test("renders admin navigation links with correct paths", () => {
    mockUseAuth.mockReturnValue({
      currentUser: mockAdminUser,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
      loading: false,
      error: null,
    });

    renderSidebar();

    const dashboardLink = screen.getByText("Dashboard").closest("a");
    const usersLink = screen.getByText("Users").closest("a");
    const importsLink = screen.getByText("Imports").closest("a");

    expect(dashboardLink).toHaveAttribute("href", "/admin/dashboard");
    expect(usersLink).toHaveAttribute("href", "/admin/users");
    expect(importsLink).toHaveAttribute("href", "/admin/imports");
  });

  test("renders icons for navigation items", () => {
    mockUseAuth.mockReturnValue({
      currentUser: mockUser,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
      loading: false,
      error: null,
    });

    renderSidebar();

    expect(screen.getByText("👤")).toBeInTheDocument();
  });

  test("renders admin icons for admin navigation items", () => {
    mockUseAuth.mockReturnValue({
      currentUser: mockAdminUser,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
      loading: false,
      error: null,
    });

    renderSidebar();

    expect(screen.getByText("📊")).toBeInTheDocument();
    expect(screen.getByText("👥")).toBeInTheDocument();
    expect(screen.getByText("📥")).toBeInTheDocument();
  });
});
