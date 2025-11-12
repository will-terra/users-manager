import { useEffect, useState } from "react";
import type {
  ProfileFormData,
  ProfileUpdatePayload,
  UseProfileFormProps,
  UseProfileFormReturn,
} from "../types/profile";

/**
 * Custom hook to manage profile form state and operations
 *
 * Extracts form logic from the Profile component for better:
 * - Testability
 * - Reusability
 * - Separation of concerns
 */
export const useProfileForm = ({
  currentUser,
  updateProfileMutation,
  onSuccess,
  onError,
}: UseProfileFormProps): UseProfileFormReturn => {
  const [isEditing, setIsEditing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Use mutation's loading state
  const loading = updateProfileMutation.isPending;

  // Initialize form data from current user
  const getInitialFormData = (): ProfileFormData => ({
    full_name: currentUser?.full_name || "",
    email: currentUser?.email || "",
    avatar: null,
    avatar_url: "",
    remove_avatar: false,
  });

  const [formData, setFormData] =
    useState<ProfileFormData>(getInitialFormData());

  // Reset form when currentUser changes and not editing
  useEffect(() => {
    if (currentUser && !isEditing) {
      setFormData(getInitialFormData());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, isEditing]);

  /**
   * Handle input field changes
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;

    if (name === "avatar" && files && files[0]) {
      // Validate file type before setting
      const file = files[0];
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

      if (!validTypes.includes(file.type)) {
        setLocalError(
          "Please select a valid image file (JPEG, PNG, GIF, or WebP)",
        );
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setLocalError("Avatar must be less than 5MB");
        return;
      }

      setLocalError(null);
      setFormData((prev) => ({ ...prev, avatar: file, remove_avatar: false }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (name === "avatar_url" && value) {
        // Clear remove_avatar flag when URL is provided
        setFormData((prev) => ({ ...prev, remove_avatar: false }));
      }
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    try {
      // Build update payload
      const updateData: ProfileUpdatePayload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        avatar_url: formData.avatar_url.trim(),
        remove_avatar: formData.remove_avatar,
      };

      // Include avatar file if provided
      if (formData.avatar) {
        updateData.avatar = formData.avatar;
      }

      // Validate required fields
      if (!updateData.full_name) {
        setLocalError("Full name is required");
        return;
      }

      if (!updateData.email) {
        setLocalError("Email is required");
        return;
      }

      await updateProfileMutation.mutateAsync(updateData);

      // Reset form to clean state after successful update
      setFormData({
        full_name: updateData.full_name,
        email: updateData.email,
        avatar: null,
        avatar_url: "",
        remove_avatar: false,
      });

      onSuccess?.();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setLocalError(errorMessage);
      onError?.(errorMessage);
    }
  };

  /**
   * Handle cancel - reset to current user data
   */
  const handleCancel = () => {
    setIsEditing(false);
    setFormData(getInitialFormData());
    setLocalError(null);
  };

  /**
   * Handle avatar removal
   */
  const handleRemoveAvatar = () => {
    setFormData((prev) => ({
      ...prev,
      remove_avatar: true,
      avatar: null,
      avatar_url: "",
    }));
  };

  return {
    isEditing,
    formData,
    loading,
    localError,
    setIsEditing,
    handleChange,
    handleSubmit,
    handleCancel,
    handleRemoveAvatar,
  };
};
