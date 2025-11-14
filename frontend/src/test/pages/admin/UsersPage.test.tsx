import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import {
  useDeleteUser,
  useToggleUserRole,
  useUsers,
} from "../../../hooks/queries";
import { useAuth } from "../../../hooks/useAuth";
import { UsersPage } from "../../../pages/admin/UsersPage";

// Mock the hooks
vi.mock("../../../hooks/queries");
vi.mock("../../../hooks/useAuth");
vi.mock("react-router-dom", () => ({
  Link: ({
    to,
    children,
    className,
  }: {
    to: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={to} className={className} data-testid={`link-${to}`}>
      {children}
    </a>
  ),
}));

const mockUseAuth = vi.mocked(useAuth);
const mockUseUsers = vi.mocked(useUsers);
const mockUseDeleteUser = vi.mocked(useDeleteUser);
const mockUseToggleUserRole = vi.mocked(useToggleUserRole);

// Mock window.confirm
const mockConfirm = vi.fn();
global.confirm = mockConfirm;

describe("UsersPage", () => {
  const mockCurrentUser = {
    id: 1,
    full_name: "Admin User",
    email: "admin@example.com",
    role: "admin" as const,
  };
  const mockUsers = [
    {
      id: 1,
      full_name: "John Doe",
      email: "john@example.com",
      role: "user" as const,
    },
    {
      id: 2,
      full_name: "Jane Smith",
      email: "jane@example.com",
      role: "admin" as const,
    },
    { id: 3, full_name: "", email: "test@example.com", role: "user" as const },
  ];

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      globalError: null,
      setGlobalError: vi.fn(),
      currentUser: mockCurrentUser,
    });

    mockUseUsers.mockReturnValue({
      data: {
        data: {
          users: mockUsers,
          pagination: {
            total_pages: 1,
            current_page: 1,
            total_count: 3,
            per_page: 10,
          },
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    mockUseDeleteUser.mockReturnValue({
      mutate: vi.fn(),
    });

    mockUseToggleUserRole.mockReturnValue({
      mutate: vi.fn(),
    });

    mockConfirm.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("displays loading state when loading and no users", () => {
    mockUseUsers.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      error: null,
    });

    render(<UsersPage />);

    expect(screen.getByText("Loading users...")).toBeInTheDocument();
  });

  test("renders users table with user data", () => {
    render(<UsersPage />);

    expect(screen.getByText("Users Management")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    expect(screen.getByText("test")).toBeInTheDocument(); // email.split("@")[0] for user without full_name
    expect(screen.getAllByText("user")).toHaveLength(2);
    expect(screen.getByText("admin")).toBeInTheDocument();
  });

  test("displays add new user link", () => {
    render(<UsersPage />);

    const addLink = screen.getByTestId("link-/admin/users/new");
    expect(addLink).toBeInTheDocument();
    expect(addLink).toHaveTextContent("Add New User");
  });

  test("handles search functionality", () => {
    const mockSetGlobalError = vi.fn();
    mockUseAuth.mockReturnValue({
      globalError: null,
      setGlobalError: mockSetGlobalError,
      currentUser: mockCurrentUser,
    });

    render(<UsersPage />);

    const searchInput = screen.getByPlaceholderText("Search users...");
    const searchButton = screen.getByRole("button", { name: "Search" });

    fireEvent.change(searchInput, { target: { value: "john" } });
    fireEvent.click(searchButton);

    expect(mockUseUsers).toHaveBeenCalledWith(1, "john");
  });

  test("displays global error message", () => {
    mockUseAuth.mockReturnValue({
      globalError: "Test error message",
      setGlobalError: vi.fn(),
      currentUser: mockCurrentUser,
    });

    render(<UsersPage />);

    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  test("sets global error when users query fails", () => {
    const mockSetGlobalError = vi.fn();
    mockUseAuth.mockReturnValue({
      globalError: null,
      setGlobalError: mockSetGlobalError,
      currentUser: mockCurrentUser,
    });

    mockUseUsers.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: new Error("Failed to load users"),
    });

    render(<UsersPage />);

    expect(mockSetGlobalError).toHaveBeenCalledWith("Failed to load users");
  });

  test("renders edit links for all users", () => {
    render(<UsersPage />);

    expect(screen.getByTestId("link-/admin/users/1/edit")).toBeInTheDocument();
    expect(screen.getByTestId("link-/admin/users/2/edit")).toBeInTheDocument();
    expect(screen.getByTestId("link-/admin/users/3/edit")).toBeInTheDocument();
  });

  test("does not show toggle and delete buttons for current user", () => {
    render(<UsersPage />);

    // For user id 1 (current user), should not have toggle and delete buttons
    const user1Row = screen.getByText("John Doe").closest("tr");
    expect(user1Row).toBeInTheDocument();

    // Check that other users have the buttons
    expect(screen.getAllByText("Toggle Role")).toHaveLength(2); // users 2 and 3
    expect(screen.getAllByText("Delete")).toHaveLength(2); // users 2 and 3
  });

  test("handles toggle role action success", () => {
    const mockMutate = vi.fn();
    const mockSetGlobalError = vi.fn();
    mockUseToggleUserRole.mockReturnValue({
      mutate: mockMutate,
    });
    mockUseAuth.mockReturnValue({
      globalError: null,
      setGlobalError: mockSetGlobalError,
      currentUser: mockCurrentUser,
    });

    render(<UsersPage />);

    const toggleButtons = screen.getAllByText("Toggle Role");
    fireEvent.click(toggleButtons[0]); // Toggle role for user 2

    const [id, options] = mockMutate.mock.calls[0];
    expect(id).toBe(2);

    // Call onSuccess
    options.onSuccess();
    expect(mockSetGlobalError).toHaveBeenCalledWith(null);
  });

  test("handles toggle role action error", () => {
    const mockMutate = vi.fn();
    const mockSetGlobalError = vi.fn();
    mockUseToggleUserRole.mockReturnValue({
      mutate: mockMutate,
    });
    mockUseAuth.mockReturnValue({
      globalError: null,
      setGlobalError: mockSetGlobalError,
      currentUser: mockCurrentUser,
    });

    render(<UsersPage />);

    const toggleButtons = screen.getAllByText("Toggle Role");
    fireEvent.click(toggleButtons[0]);

    const [id, options] = mockMutate.mock.calls[0];

    // Call onError
    const error = new Error("Toggle failed");
    options.onError(error);
    expect(mockSetGlobalError).toHaveBeenCalledWith("Toggle failed");
  });

  test("handles delete action success", () => {
    const mockMutate = vi.fn();
    const mockSetGlobalError = vi.fn();
    mockUseDeleteUser.mockReturnValue({
      mutate: mockMutate,
    });
    mockUseAuth.mockReturnValue({
      globalError: null,
      setGlobalError: mockSetGlobalError,
      currentUser: mockCurrentUser,
    });

    mockConfirm.mockReturnValue(true);

    render(<UsersPage />);

    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]); // Delete user 2

    const [id, options] = mockMutate.mock.calls[0];
    expect(id).toBe(2);

    // Call onSuccess
    options.onSuccess();
    expect(mockSetGlobalError).toHaveBeenCalledWith(null);
  });

  test("handles delete action error", () => {
    const mockMutate = vi.fn();
    const mockSetGlobalError = vi.fn();
    mockUseDeleteUser.mockReturnValue({
      mutate: mockMutate,
    });
    mockUseAuth.mockReturnValue({
      globalError: null,
      setGlobalError: mockSetGlobalError,
      currentUser: mockCurrentUser,
    });

    mockConfirm.mockReturnValue(true);

    render(<UsersPage />);

    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]);

    const [id, options] = mockMutate.mock.calls[0];

    // Call onError
    const error = new Error("Delete failed");
    options.onError(error);
    expect(mockSetGlobalError).toHaveBeenCalledWith("Delete failed");
  });

  test("does not delete when confirmation is cancelled", () => {
    const mockMutate = vi.fn();
    mockUseDeleteUser.mockReturnValue({
      mutate: mockMutate,
    });

    mockConfirm.mockReturnValue(false);

    render(<UsersPage />);

    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]);

    expect(mockConfirm).toHaveBeenCalledWith(
      "Are you sure you want to delete this user?",
    );
    expect(mockMutate).not.toHaveBeenCalled();
  });

  test("does not show pagination when only one page", () => {
    render(<UsersPage />);

    expect(screen.queryByText("Page 1 of 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Previous")).not.toBeInTheDocument();
    expect(screen.queryByText("Next")).not.toBeInTheDocument();
  });

  test("shows pagination when multiple pages", () => {
    mockUseUsers.mockReturnValue({
      data: {
        data: {
          users: mockUsers,
          pagination: {
            total_pages: 3,
            current_page: 1,
            total_count: 25,
            per_page: 10,
          },
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<UsersPage />);

    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByText("Previous")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  test("handles pagination navigation", () => {
    mockUseUsers.mockReturnValue({
      data: {
        data: {
          users: mockUsers,
          pagination: {
            total_pages: 3,
            current_page: 1,
            total_count: 25,
            per_page: 10,
          },
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<UsersPage />);

    const nextButton = screen.getByText("Next");
    fireEvent.click(nextButton);

    expect(mockUseUsers).toHaveBeenCalledWith(2, "");
  });

  test("disables previous button on first page", () => {
    mockUseUsers.mockReturnValue({
      data: {
        data: {
          users: mockUsers,
          pagination: {
            total_pages: 3,
            current_page: 1,
            total_count: 25,
            per_page: 10,
          },
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<UsersPage />);

    const prevButton = screen.getByText("Previous");
    expect(prevButton).toBeDisabled();
  });

  test("handles pagination navigation", () => {
    mockUseUsers.mockReturnValue({
      data: {
        data: {
          users: mockUsers,
          pagination: {
            total_pages: 3,
            current_page: 1,
            total_count: 25,
            per_page: 10,
          },
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<UsersPage />);

    const nextButton = screen.getByText("Next");
    fireEvent.click(nextButton);

    expect(mockUseUsers).toHaveBeenCalledWith(2, "");
  });

  test("disables previous button on first page", () => {
    mockUseUsers.mockReturnValue({
      data: {
        data: {
          users: mockUsers,
          pagination: {
            total_pages: 3,
            current_page: 1,
            total_count: 25,
            per_page: 10,
          },
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<UsersPage />);

    const prevButton = screen.getByText("Previous");
    expect(prevButton).toBeDisabled();
  });

  test("triggers previous page navigation", () => {
    mockUseUsers.mockReturnValue({
      data: {
        data: {
          users: mockUsers,
          pagination: {
            total_pages: 3,
            current_page: 2,
            total_count: 25,
            per_page: 10,
          },
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<UsersPage />);

    // Move to next page first so Previous becomes enabled
    const nextButton = screen.getByText("Next");
    fireEvent.click(nextButton);

    const prevButton = screen.getByText("Previous");
    expect(prevButton).not.toBeDisabled();

    // Click previous button to test line 143
    fireEvent.click(prevButton);

    expect(mockUseUsers).toHaveBeenCalledWith(1, "");
  });
});
