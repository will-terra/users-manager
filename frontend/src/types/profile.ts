import type { UseMutationResult } from "@tanstack/react-query";
import type { User } from "./user";

export interface ProfileFormData {
  full_name: string;
  email: string;
  avatar: File | null;
  avatar_url: string;
  remove_avatar: boolean;
}

export interface UseProfileFormProps {
  currentUser: User | null;
  /**
   * TanStack Query mutation result returned by `useUpdateProfile()`.
   * The hook will call `mutateAsync` on this mutation.
   */
  updateProfileMutation: UseMutationResult<
    { data: User },
    unknown,
    Partial<User> & {
      avatar?: File;
      avatar_url?: string;
      remove_avatar?: boolean;
    },
    unknown
  >;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export interface ProfileUpdatePayload {
  full_name: string;
  email: string;
  avatar_url: string;
  remove_avatar: boolean;
  avatar?: File;
}

export interface UseProfileFormReturn {
  isEditing: boolean;
  formData: ProfileFormData;
  loading: boolean;
  localError: string | null;
  setIsEditing: (editing: boolean) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleCancel: () => void;
  handleRemoveAvatar: () => void;
}
