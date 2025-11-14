import React from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useProfileForm } from "../../hooks/useProfileForm";
import type { ProfileUpdatePayload } from "../../types/profile";
import type { User } from "../../types/user";

// Mock React Query
vi.mock("@tanstack/react-query");

const mockCurrentUser: User = {
  id: 1,
  full_name: "John Doe",
  email: "john@example.com",
  role: "user",
  avatar_urls: {
    thumb: "thumb.jpg",
    medium: "medium.jpg",
    large: "large.jpg",
    original: "original.jpg",
  },
  has_avatar: true,
};

const mockUpdateProfileMutation: UseMutationResult<
  { data: User },
  unknown,
  ProfileUpdatePayload,
  unknown
> = {
  mutateAsync: vi.fn(),
  isPending: false,
  isError: false,
  isSuccess: false,
  data: undefined,
  error: null,
  mutate: vi.fn(),
  reset: vi.fn(),
  status: "idle",
  failureCount: 0,
  failureReason: null,
  isPaused: false,
  variables: undefined,
  submittedAt: 0,
};

describe("useProfileForm", () => {
  const defaultProps = {
    currentUser: mockCurrentUser,
    updateProfileMutation: mockUpdateProfileMutation,
    onSuccess: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateProfileMutation.mutateAsync.mockResolvedValue({
      data: mockCurrentUser,
    });
    mockUpdateProfileMutation.isPending = false;
  });

  test("initializes with correct default state", () => {
    const { result } = renderHook(() => useProfileForm(defaultProps));

    expect(result.current.isEditing).toBe(false);
    expect(result.current.localError).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(result.current.formData).toEqual({
      full_name: "John Doe",
      email: "john@example.com",
      avatar: null,
      avatar_url: "",
      remove_avatar: false,
      current_password: "",
      password: "",
      password_confirmation: "",
    });
  });

  test("initializes with null currentUser", () => {
    const { result } = renderHook(() =>
      useProfileForm({ ...defaultProps, currentUser: null }),
    );

    expect(result.current.formData).toEqual({
      full_name: "",
      email: "",
      avatar: null,
      avatar_url: "",
      remove_avatar: false,
      current_password: "",
      password: "",
      password_confirmation: "",
    });
  });

  test("resets form data when currentUser changes and not editing", () => {
    const { result, rerender } = renderHook((props) => useProfileForm(props), {
      initialProps: { ...defaultProps, currentUser: null },
    });

    // Initially empty
    expect(result.current.formData.full_name).toBe("");

    // Update with user data
    const newUser = { ...mockCurrentUser, full_name: "Jane Doe" };
    rerender({ ...defaultProps, currentUser: newUser });

    expect(result.current.formData.full_name).toBe("Jane Doe");
  });

  test("does not reset form data when editing", () => {
    const { result, rerender } = renderHook((props) => useProfileForm(props), {
      initialProps: defaultProps,
    });

    // Start editing and modify form
    act(() => {
      result.current.setIsEditing(true);
      result.current.handleChange({
        target: { name: "full_name", value: "Modified Name" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formData.full_name).toBe("Modified Name");

    // Change currentUser - should not reset because editing
    const newUser = { ...mockCurrentUser, full_name: "New Name" };
    rerender({ ...defaultProps, currentUser: newUser });

    expect(result.current.formData.full_name).toBe("Modified Name");
  });

  test("handles text input changes", () => {
    const { result } = renderHook(() => useProfileForm(defaultProps));

    act(() => {
      result.current.handleChange({
        target: { name: "full_name", value: "New Name" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formData.full_name).toBe("New Name");
  });

  test("handles avatar file upload with valid file", () => {
    const { result } = renderHook(() => useProfileForm(defaultProps));

    const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
    Object.defineProperty(mockFile, "size", { value: 1024 * 1024 }); // 1MB

    act(() => {
      result.current.handleChange({
        target: {
          name: "avatar",
          files: [mockFile],
        },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formData.avatar).toBe(mockFile);
    expect(result.current.formData.remove_avatar).toBe(false);
    expect(result.current.localError).toBe(null);
  });

  test("rejects invalid file type for avatar", () => {
    const { result } = renderHook(() => useProfileForm(defaultProps));

    const mockFile = new File(["test"], "test.txt", { type: "text/plain" });

    act(() => {
      result.current.handleChange({
        target: {
          name: "avatar",
          files: [mockFile],
        },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formData.avatar).toBe(null);
    expect(result.current.localError).toBe(
      "Please select a valid image file (JPEG, PNG, GIF, or WebP)",
    );
  });

  test("rejects file too large for avatar", () => {
    const { result } = renderHook(() => useProfileForm(defaultProps));

    const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
    Object.defineProperty(mockFile, "size", { value: 10 * 1024 * 1024 }); // 10MB

    act(() => {
      result.current.handleChange({
        target: {
          name: "avatar",
          files: [mockFile],
        },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formData.avatar).toBe(null);
    expect(result.current.localError).toBe("Avatar must be less than 5MB");
  });

  test("clears remove_avatar flag when avatar_url is provided", () => {
    const { result } = renderHook(() => useProfileForm(defaultProps));

    // First set remove_avatar to true
    act(() => {
      result.current.handleRemoveAvatar();
    });
    expect(result.current.formData.remove_avatar).toBe(true);

    // Then provide avatar_url
    act(() => {
      result.current.handleChange({
        target: { name: "avatar_url", value: "new-url.jpg" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formData.avatar_url).toBe("new-url.jpg");
    expect(result.current.formData.remove_avatar).toBe(false);
  });

  test("submits form successfully without password change", async () => {
    const { result } = renderHook(() => useProfileForm(defaultProps));

    // Modify form data
    act(() => {
      result.current.handleChange({
        target: { name: "full_name", value: "Updated Name" },
      } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "email", value: "updated@example.com" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as React.FormEvent<Element>);
    });

    expect(mockUpdateProfileMutation.mutateAsync).toHaveBeenCalledWith({
      full_name: "Updated Name",
      email: "updated@example.com",
      avatar_url: "",
      remove_avatar: false,
    });

    expect(result.current.formData).toEqual({
      full_name: "Updated Name",
      email: "updated@example.com",
      avatar: null,
      avatar_url: "",
      remove_avatar: false,
      current_password: "",
      password: "",
      password_confirmation: "",
    });

    expect(defaultProps.onSuccess).toHaveBeenCalled();
    expect(result.current.localError).toBe(null);
  });

  test("submits form successfully with avatar file", async () => {
    const { result } = renderHook(() => useProfileForm(defaultProps));

    const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
    Object.defineProperty(mockFile, "size", { value: 1024 * 1024 });

    act(() => {
      result.current.handleChange({
        target: {
          name: "avatar",
          files: [mockFile],
        },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as React.FormEvent<Element>);
    });

    expect(mockUpdateProfileMutation.mutateAsync).toHaveBeenCalledWith({
      full_name: "John Doe",
      email: "john@example.com",
      avatar_url: "",
      remove_avatar: false,
      avatar: mockFile,
    });
  });

  test("submits form successfully with password change", async () => {
    const { result } = renderHook(() => useProfileForm(defaultProps));

    act(() => {
      result.current.handleChange({
        target: { name: "current_password", value: "oldpass" },
      } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "password", value: "newpass123" },
      } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "password_confirmation", value: "newpass123" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as React.FormEvent<Element>);
    });

    expect(mockUpdateProfileMutation.mutateAsync).toHaveBeenCalledWith({
      full_name: "John Doe",
      email: "john@example.com",
      avatar_url: "",
      remove_avatar: false,
      current_password: "oldpass",
      password: "newpass123",
      password_confirmation: "newpass123",
    });
  });

  test("validates required full_name", async () => {
    const { result } = renderHook(() => useProfileForm(defaultProps));

    act(() => {
      result.current.handleChange({
        target: { name: "full_name", value: "" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as React.FormEvent<Element>);
    });

    expect(result.current.localError).toBe("Full name is required");
    expect(mockUpdateProfileMutation.mutateAsync).not.toHaveBeenCalled();
  });

  test("validates required email", async () => {
    const { result } = renderHook(() => useProfileForm(defaultProps));

    act(() => {
      result.current.handleChange({
        target: { name: "email", value: "" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as React.FormEvent<Element>);
    });

    expect(result.current.localError).toBe("Email is required");
    expect(mockUpdateProfileMutation.mutateAsync).not.toHaveBeenCalled();
  });

  test("validates current password when changing password", async () => {
    const { result } = renderHook(() => useProfileForm(defaultProps));

    act(() => {
      result.current.handleChange({
        target: { name: "password", value: "newpass123" },
      } as React.ChangeEvent<HTMLInputElement>);
      // Missing current_password
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as React.FormEvent<Element>);
    });

    expect(result.current.localError).toBe(
      "Current password is required to change password",
    );
    expect(mockUpdateProfileMutation.mutateAsync).not.toHaveBeenCalled();
  });

  test("validates password minimum length", async () => {
    const { result } = renderHook(() => useProfileForm(defaultProps));

    act(() => {
      result.current.handleChange({
        target: { name: "current_password", value: "oldpass" },
      } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "password", value: "123" }, // Too short
      } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "password_confirmation", value: "123" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as React.FormEvent<Element>);
    });

    expect(result.current.localError).toBe(
      "New password must be at least 6 characters",
    );
    expect(mockUpdateProfileMutation.mutateAsync).not.toHaveBeenCalled();
  });

  test("validates password confirmation match", async () => {
    const { result } = renderHook(() => useProfileForm(defaultProps));

    act(() => {
      result.current.handleChange({
        target: { name: "current_password", value: "oldpass" },
      } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "password", value: "newpass123" },
      } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "password_confirmation", value: "different" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as React.FormEvent<Element>);
    });

    expect(result.current.localError).toBe(
      "Password confirmation does not match",
    );
    expect(mockUpdateProfileMutation.mutateAsync).not.toHaveBeenCalled();
  });

  test("handles submission error", async () => {
    const errorMessage = "Update failed";
    mockUpdateProfileMutation.mutateAsync.mockRejectedValue(
      new Error(errorMessage),
    );

    const { result } = renderHook(() => useProfileForm(defaultProps));

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as React.FormEvent<Element>);
    });

    expect(result.current.localError).toBe(errorMessage);
    expect(defaultProps.onError).toHaveBeenCalledWith(errorMessage);
  });

  test("handles non-Error submission error", async () => {
    mockUpdateProfileMutation.mutateAsync.mockRejectedValue("String error");

    const { result } = renderHook(() => useProfileForm(defaultProps));

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as React.FormEvent<Element>);
    });

    expect(result.current.localError).toBe("String error");
    expect(defaultProps.onError).toHaveBeenCalledWith("String error");
  });

  test("clears error on form submission", async () => {
    const { result } = renderHook(() => useProfileForm(defaultProps));

    // Set an error first
    act(() => {
      result.current.handleChange({
        target: { name: "full_name", value: "" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as React.FormEvent<Element>);
    });

    expect(result.current.localError).toBe("Full name is required");

    // Submit again with valid data
    act(() => {
      result.current.handleChange({
        target: { name: "full_name", value: "Valid Name" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as React.FormEvent<Element>);
    });

    expect(result.current.localError).toBe(null);
  });

  test("handleCancel resets form and editing state", () => {
    const { result } = renderHook(() => useProfileForm(defaultProps));

    // Modify form and set editing
    act(() => {
      result.current.setIsEditing(true);
      result.current.handleChange({
        target: { name: "full_name", value: "Modified" },
      } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "email", value: "modified@example.com" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.isEditing).toBe(true);
    expect(result.current.formData.full_name).toBe("Modified");

    act(() => {
      result.current.handleCancel();
    });

    expect(result.current.isEditing).toBe(false);
    expect(result.current.formData).toEqual({
      full_name: "John Doe",
      email: "john@example.com",
      avatar: null,
      avatar_url: "",
      remove_avatar: false,
      current_password: "",
      password: "",
      password_confirmation: "",
    });
    expect(result.current.localError).toBe(null);
  });

  test("handleRemoveAvatar sets remove_avatar flag and clears avatar fields", () => {
    const { result } = renderHook(() => useProfileForm(defaultProps));

    // Set avatar data first
    act(() => {
      result.current.handleChange({
        target: { name: "avatar_url", value: "some-url.jpg" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formData.avatar_url).toBe("some-url.jpg");

    act(() => {
      result.current.handleRemoveAvatar();
    });

    expect(result.current.formData.remove_avatar).toBe(true);
    expect(result.current.formData.avatar).toBe(null);
    expect(result.current.formData.avatar_url).toBe("");
  });

  test("returns loading state from mutation", () => {
    mockUpdateProfileMutation.isPending = true;

    const { result } = renderHook(() => useProfileForm(defaultProps));

    expect(result.current.loading).toBe(true);
  });

  test("setIsEditing updates editing state", () => {
    const { result } = renderHook(() => useProfileForm(defaultProps));

    act(() => {
      result.current.setIsEditing(true);
    });

    expect(result.current.isEditing).toBe(true);

    act(() => {
      result.current.setIsEditing(false);
    });

    expect(result.current.isEditing).toBe(false);
  });

  test("trims whitespace from form fields on submit", async () => {
    const { result } = renderHook(() => useProfileForm(defaultProps));

    act(() => {
      result.current.handleChange({
        target: { name: "full_name", value: "  John Doe  " },
      } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "email", value: "  john@example.com  " },
      } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "avatar_url", value: "  avatar.jpg  " },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as React.FormEvent<Element>);
    });

    expect(mockUpdateProfileMutation.mutateAsync).toHaveBeenCalledWith({
      full_name: "John Doe",
      email: "john@example.com",
      avatar_url: "avatar.jpg",
      remove_avatar: false,
    });
  });
});
