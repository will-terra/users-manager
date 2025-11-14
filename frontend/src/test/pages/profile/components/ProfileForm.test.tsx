import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { ProfileForm } from "../../../../pages/profile/components/ProfileForm";
import type { ProfileFormData } from "../../../types/profile";
import type { User } from "../../../types/user";

// Mock data
const mockFormData: ProfileFormData = {
  full_name: "John Doe",
  email: "john@example.com",
  avatar: null,
  avatar_url: "",
  remove_avatar: false,
  current_password: "",
  password: "",
  password_confirmation: "",
};

const mockUserWithAvatar: User = {
  id: 1,
  email: "john@example.com",
  full_name: "John Doe",
  has_avatar: true,
  avatar_urls: {
    small: "/avatars/small.jpg",
    medium: "/avatars/medium.jpg",
    large: "/avatars/large.jpg",
  },
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-01T00:00:00Z",
};

const mockUserWithoutAvatar: User = {
  id: 2,
  email: "jane@example.com",
  full_name: "Jane Smith",
  has_avatar: false,
  avatar_urls: null,
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-01T00:00:00Z",
};

// Mock functions
const mockOnChange = vi.fn();
const mockOnSubmit = vi.fn();
const mockOnCancel = vi.fn();
const mockOnRemoveAvatar = vi.fn();

describe("ProfileForm", () => {
  test("renders form with all fields and help text", () => {
    render(
      <ProfileForm
        formData={mockFormData}
        currentUser={mockUserWithoutAvatar}
        loading={false}
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        onRemoveAvatar={mockOnRemoveAvatar}
      />,
    );

    // Check that the avatar help text is present (this covers the untested line)
    expect(
      screen.getByText(
        "Accepted formats: JPEG, PNG, GIF, WebP. Maximum size: 5MB.",
      ),
    ).toBeInTheDocument();

    // Check other form elements
    expect(screen.getByLabelText("Upload New Avatar")).toBeInTheDocument();
    expect(screen.getByLabelText("Or Enter Image URL")).toBeInTheDocument();
    expect(screen.getByLabelText("Full Name *")).toBeInTheDocument();
    expect(screen.getByLabelText("Current Password")).toBeInTheDocument();
    expect(screen.getByLabelText("New Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm New Password")).toBeInTheDocument();
  });

  test("shows remove avatar button when user has avatar and remove_avatar is false", () => {
    render(
      <ProfileForm
        formData={mockFormData}
        currentUser={mockUserWithAvatar}
        loading={false}
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        onRemoveAvatar={mockOnRemoveAvatar}
      />,
    );

    const removeButton = screen.getByRole("button", {
      name: "Remove current avatar",
    });
    expect(removeButton).toBeInTheDocument();
  });

  test("does not show remove avatar button when user has no avatar", () => {
    render(
      <ProfileForm
        formData={mockFormData}
        currentUser={mockUserWithoutAvatar}
        loading={false}
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        onRemoveAvatar={mockOnRemoveAvatar}
      />,
    );

    const removeButton = screen.queryByRole("button", {
      name: "Remove current avatar",
    });
    expect(removeButton).not.toBeInTheDocument();
  });

  test("shows warning when remove_avatar is true", () => {
    const formDataWithRemove = { ...mockFormData, remove_avatar: true };

    render(
      <ProfileForm
        formData={formDataWithRemove}
        currentUser={mockUserWithAvatar}
        loading={false}
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        onRemoveAvatar={mockOnRemoveAvatar}
      />,
    );

    expect(
      screen.getByText("Avatar will be removed when you save changes."),
    ).toBeInTheDocument();
  });

  test("disables all inputs when loading", () => {
    render(
      <ProfileForm
        formData={mockFormData}
        currentUser={mockUserWithoutAvatar}
        loading={true}
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        onRemoveAvatar={mockOnRemoveAvatar}
      />,
    );

    expect(screen.getByLabelText("Upload New Avatar")).toBeDisabled();
    expect(screen.getByLabelText("Or Enter Image URL")).toBeDisabled();
    expect(screen.getByLabelText("Full Name *")).toBeDisabled();
    expect(screen.getByLabelText("Current Password")).toBeDisabled();
    expect(screen.getByLabelText("New Password")).toBeDisabled();
    expect(screen.getByLabelText("Confirm New Password")).toBeDisabled();

    const submitButton = screen.getByRole("button", { name: "Saving..." });
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveAttribute("aria-busy", "true");

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    expect(cancelButton).toBeDisabled();
  });

  test("calls onChange when input values change", () => {
    render(
      <ProfileForm
        formData={mockFormData}
        currentUser={mockUserWithoutAvatar}
        loading={false}
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        onRemoveAvatar={mockOnRemoveAvatar}
      />,
    );

    const fullNameInput = screen.getByLabelText("Full Name *");
    fireEvent.change(fullNameInput, { target: { value: "Jane Doe" } });
    expect(mockOnChange).toHaveBeenCalled();
  });

  test("calls onSubmit when form is submitted", () => {
    render(
      <ProfileForm
        formData={mockFormData}
        currentUser={mockUserWithoutAvatar}
        loading={false}
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        onRemoveAvatar={mockOnRemoveAvatar}
      />,
    );

    const submitButton = screen.getByRole("button", { name: "Save Changes" });
    fireEvent.click(submitButton);
    expect(mockOnSubmit).toHaveBeenCalled();
  });

  test("calls onCancel when cancel button is clicked", () => {
    render(
      <ProfileForm
        formData={mockFormData}
        currentUser={mockUserWithoutAvatar}
        loading={false}
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        onRemoveAvatar={mockOnRemoveAvatar}
      />,
    );

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancelButton);
    expect(mockOnCancel).toHaveBeenCalled();
  });

  test("calls onRemoveAvatar when remove avatar button is clicked", () => {
    render(
      <ProfileForm
        formData={mockFormData}
        currentUser={mockUserWithAvatar}
        loading={false}
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        onRemoveAvatar={mockOnRemoveAvatar}
      />,
    );

    const removeButton = screen.getByRole("button", {
      name: "Remove current avatar",
    });
    fireEvent.click(removeButton);
    expect(mockOnRemoveAvatar).toHaveBeenCalled();
  });
});
