import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { useProfile, useUpdateProfile } from "../../../hooks/queries";
import { useAuth } from "../../../hooks/useAuth";
import { useProfileForm } from "../../../hooks/useProfileForm";
import { Profile } from "../../../pages/profile/Profile";
import type { User } from "../../../types/user";

// Mock the hooks
vi.mock("../../../hooks/queries");
vi.mock("../../../hooks/useAuth");
vi.mock("../../../hooks/useProfileForm");
vi.mock("../../../layout/NotificationBanner", () => ({
  NotificationBanner: ({
    error,
    success,
    onDismiss,
  }: {
    error?: string;
    success?: string;
    onDismiss: () => void;
  }) => (
    <div data-testid="notification-banner">
      {error && <div data-testid="error">{error}</div>}
      {success && <div data-testid="success">{success}</div>}
      <button data-testid="dismiss-btn" onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  ),
}));
vi.mock("../../../pages/profile/components/ProfileAvatar", () => ({
  ProfileAvatar: ({
    user,
    removeAvatar,
  }: {
    user: User;
    removeAvatar: boolean;
  }) => (
    <div data-testid="profile-avatar">
      Avatar for {user.full_name} - Remove: {removeAvatar ? "true" : "false"}
    </div>
  ),
}));
vi.mock("../../../pages/profile/components/ProfileForm", () => ({
  ProfileForm: ({
    onSubmit,
    onCancel,
  }: {
    onSubmit: () => void;
    onCancel: () => void;
  }) => (
    <div data-testid="profile-form">
      <button data-testid="submit-btn" onClick={onSubmit}>
        Submit
      </button>
      <button data-testid="cancel-btn" onClick={onCancel}>
        Cancel
      </button>
    </div>
  ),
}));
vi.mock("../../../pages/profile/components/ProfileInfo", () => ({
  ProfileInfo: ({ user }: { user: User }) => (
    <div data-testid="profile-info">Profile Info for {user.full_name}</div>
  ),
}));

const mockUseAuth = vi.mocked(useAuth);
const mockUseProfile = vi.mocked(useProfile);
const mockUseUpdateProfile = vi.mocked(useUpdateProfile);
const mockUseProfileForm = vi.mocked(useProfileForm);

describe("Profile", () => {
  const mockUser = {
    id: 1,
    full_name: "John Doe",
    email: "john@example.com",
    role: "user" as const,
  };

  const mockAuth = {
    globalError: null,
    globalSuccess: null,
    setGlobalError: vi.fn(),
    setGlobalSuccess: vi.fn(),
    clearNotifications: vi.fn(),
    refreshUser: vi.fn(),
  };

  const mockProfileForm = {
    isEditing: false,
    formData: {
      full_name: "John Doe",
      email: "john@example.com",
      remove_avatar: false,
    },
    loading: false,
    localError: null,
    setIsEditing: vi.fn(),
    handleChange: vi.fn(),
    handleSubmit: vi.fn(),
    handleCancel: vi.fn(),
    handleRemoveAvatar: vi.fn(),
  };

  beforeEach(() => {
    mockUseAuth.mockReturnValue(mockAuth);
    mockUseProfile.mockReturnValue({
      data: { data: mockUser },
      isLoading: false,
    });
    mockUseUpdateProfile.mockReturnValue({
      mutate: vi.fn(),
    });
    mockUseProfileForm.mockReturnValue(mockProfileForm);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("displays loading state when fetching profile", () => {
    mockUseProfile.mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(<Profile />);

    expect(screen.getByText("Loading profile...")).toBeInTheDocument();
  });

  test("displays loading state when no current user", () => {
    mockUseProfile.mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<Profile />);

    expect(screen.getByText("Loading profile...")).toBeInTheDocument();
  });

  test("renders profile page with user data", () => {
    render(<Profile />);

    expect(screen.getByText("My Profile")).toBeInTheDocument();
    expect(screen.getByText("Edit Profile")).toBeInTheDocument();
    expect(screen.getByTestId("profile-avatar")).toBeInTheDocument();
    expect(screen.getByTestId("profile-info")).toBeInTheDocument();
    expect(screen.getByText("Profile Info for John Doe")).toBeInTheDocument();
  });

  test("toggles to edit mode when edit button is clicked", () => {
    render(<Profile />);

    const editButton = screen.getByText("Edit Profile");
    fireEvent.click(editButton);

    expect(mockProfileForm.setIsEditing).toHaveBeenCalledWith(true);
    expect(mockAuth.clearNotifications).toHaveBeenCalled();
  });

  test("does not show edit button when in editing mode", () => {
    mockUseProfileForm.mockReturnValue({
      ...mockProfileForm,
      isEditing: true,
    });

    render(<Profile />);

    expect(screen.queryByText("Edit Profile")).not.toBeInTheDocument();
    expect(screen.getByTestId("profile-form")).toBeInTheDocument();
  });

  test("displays global error notification", () => {
    mockUseAuth.mockReturnValue({
      ...mockAuth,
      globalError: "Global error message",
    });

    render(<Profile />);

    expect(screen.getByTestId("error")).toBeInTheDocument();
    expect(screen.getByText("Global error message")).toBeInTheDocument();
  });

  test("displays global success notification", () => {
    mockUseAuth.mockReturnValue({
      ...mockAuth,
      globalSuccess: "Profile updated successfully!",
    });

    render(<Profile />);

    expect(screen.getByTestId("success")).toBeInTheDocument();
    expect(
      screen.getByText("Profile updated successfully!"),
    ).toBeInTheDocument();
  });

  test("passes remove_avatar state to ProfileAvatar", () => {
    mockUseProfileForm.mockReturnValue({
      ...mockProfileForm,
      formData: { ...mockProfileForm.formData, remove_avatar: true },
    });

    render(<Profile />);

    expect(
      screen.getByText("Avatar for John Doe - Remove: true"),
    ).toBeInTheDocument();
  });

  test("renders ProfileForm when in editing mode", () => {
    mockUseProfileForm.mockReturnValue({
      ...mockProfileForm,
      isEditing: true,
    });

    render(<Profile />);

    expect(screen.getByTestId("profile-form")).toBeInTheDocument();
    expect(screen.queryByTestId("profile-info")).not.toBeInTheDocument();
  });

  test("handles form submission success", async () => {
    mockUseProfileForm.mockImplementation((options) => ({
      ...mockProfileForm,
      isEditing: true,
      handleSubmit: async () => {
        await options.onSuccess();
      },
    }));

    render(<Profile />);

    const submitButton = screen.getByTestId("submit-btn");
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(mockAuth.refreshUser).toHaveBeenCalled();
    expect(mockAuth.setGlobalSuccess).toHaveBeenCalledWith(
      "Profile updated successfully!",
    );
    expect(mockProfileForm.setIsEditing).toHaveBeenCalledWith(false);
  });

  test("handles form submission error", () => {
    mockUseProfileForm.mockImplementation((options) => ({
      ...mockProfileForm,
      isEditing: true,
      handleSubmit: () => {
        options.onError("Update failed");
      },
    }));

    render(<Profile />);

    const submitButton = screen.getByTestId("submit-btn");
    fireEvent.click(submitButton);

    expect(mockAuth.setGlobalError).toHaveBeenCalledWith("Update failed");
  });

  test("handles form cancellation", () => {
    mockUseProfileForm.mockReturnValue({
      ...mockProfileForm,
      isEditing: true,
    });

    render(<Profile />);

    const cancelButton = screen.getByTestId("cancel-btn");
    fireEvent.click(cancelButton);

    expect(mockProfileForm.handleCancel).toHaveBeenCalled();
  });

  test("dismisses notifications when dismiss button is clicked", () => {
    mockUseAuth.mockReturnValue({
      ...mockAuth,
      globalError: "Error message",
    });

    render(<Profile />);

    const dismissButton = screen.getByTestId("dismiss-btn");
    fireEvent.click(dismissButton);

    expect(mockAuth.clearNotifications).toHaveBeenCalled();
  });
});
