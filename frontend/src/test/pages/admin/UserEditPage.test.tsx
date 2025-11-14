import { render, screen } from "@testing-library/react";
import { useNavigate, useParams } from "react-router-dom";
import { describe, expect, test, vi } from "vitest";
import { useUser } from "../../../hooks/queries";
import { UserEditPage } from "../../../pages/admin/UserEditPage";
import type { User } from "../../types/user";

// Mock the hooks
vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
  useParams: vi.fn(),
}));
vi.mock("../../../hooks/queries");
vi.mock("../../../pages/admin/components/UserForm", () => ({
  UserForm: ({
    user,
    onSave,
    onCancel,
  }: {
    user?: User;
    onSave: () => void;
    onCancel: () => void;
  }) => (
    <div data-testid="user-form">
      UserForm - User: {user ? user.full_name : "null"}
      <button data-testid="save-btn" onClick={onSave}>
        Save
      </button>
      <button data-testid="cancel-btn" onClick={onCancel}>
        Cancel
      </button>
    </div>
  ),
}));

const mockUseParams = vi.mocked(useParams);
const mockUseNavigate = vi.mocked(useNavigate);
const mockUseUser = vi.mocked(useUser);

describe("UserEditPage", () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: "1" });
    mockUseNavigate.mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("displays loading state while fetching user", () => {
    mockUseUser.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(<UserEditPage />);

    expect(screen.getByText("Loading user...")).toBeInTheDocument();
  });

  test("displays error message when there is an error", () => {
    mockUseUser.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error("Failed to load user"),
    });

    render(<UserEditPage />);

    expect(screen.getByText("Failed to load user")).toBeInTheDocument();
  });

  test("displays user not found when data is null", () => {
    mockUseUser.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    render(<UserEditPage />);

    expect(screen.getByText("User not found")).toBeInTheDocument();
  });

  test("displays user not found when data.data is null", () => {
    mockUseUser.mockReturnValue({
      data: { data: null },
      isLoading: false,
      error: null,
    });

    render(<UserEditPage />);

    expect(screen.getByText("User not found")).toBeInTheDocument();
  });

  test("renders UserForm with user data when user is loaded", () => {
    const mockUser = {
      id: 1,
      full_name: "John Doe",
      email: "john@example.com",
      role: "user" as const,
    };

    mockUseUser.mockReturnValue({
      data: { data: mockUser },
      isLoading: false,
      error: null,
    });

    render(<UserEditPage />);

    expect(screen.getByTestId("user-form")).toBeInTheDocument();
    expect(screen.getByText("UserForm - User: John Doe")).toBeInTheDocument();
  });

  test("navigates to users list when save is triggered", () => {
    const mockUser = {
      id: 1,
      full_name: "John Doe",
      email: "john@example.com",
      role: "user" as const,
    };

    mockUseUser.mockReturnValue({
      data: { data: mockUser },
      isLoading: false,
      error: null,
    });

    render(<UserEditPage />);

    const saveButton = screen.getByTestId("save-btn");
    saveButton.click();

    expect(mockNavigate).toHaveBeenCalledWith("/admin/users");
  });

  test("navigates to users list when cancel is triggered", () => {
    const mockUser = {
      id: 1,
      full_name: "John Doe",
      email: "john@example.com",
      role: "user" as const,
    };

    mockUseUser.mockReturnValue({
      data: { data: mockUser },
      isLoading: false,
      error: null,
    });

    render(<UserEditPage />);

    const cancelButton = screen.getByTestId("cancel-btn");
    cancelButton.click();

    expect(mockNavigate).toHaveBeenCalledWith("/admin/users");
  });
});
