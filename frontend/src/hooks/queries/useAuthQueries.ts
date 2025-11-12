/**
 * TanStack Query hooks for authentication
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../services/api";
import type { RegisterData } from "../../types/api";
import type { LoginCredentials } from "../../types/authService";
import type { User } from "../../types/user";

export const authKeys = {
  profile: ["auth", "profile"] as const,
};

/**
 * Get current user profile
 */
export function useProfile() {
  return useQuery({
    queryKey: authKeys.profile,
    queryFn: () => authApi.getProfile(),
    retry: false,
  });
}

/**
 * Login mutation
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (data) => {
      // Set the profile data in cache
      queryClient.setQueryData(authKeys.profile, { data: data.data.user });
      navigate("/profile");
    },
  });
}

/**
 * Register mutation
 */
export function useRegister() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (userData: RegisterData) => authApi.register(userData),
    onSuccess: (data) => {
      // Set the profile data in cache
      queryClient.setQueryData(authKeys.profile, { data: data.data.user });
      navigate("/profile");
    },
  });
}

/**
 * Logout mutation
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      // Clear all queries on logout
      queryClient.clear();
      navigate("/login");
    },
  });
}

/**
 * Update profile mutation
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      userData: Partial<User> & {
        avatar?: File;
        avatar_url?: string;
        remove_avatar?: boolean;
      },
    ) => authApi.updateProfile(userData),
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: authKeys.profile });

      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData(authKeys.profile);

      // Optimistically update to the new value
      queryClient.setQueryData(authKeys.profile, (old: { data: User }) => ({
        data: { ...old.data, ...newData },
      }));

      return { previousProfile };
    },
    onError: (_err, _newData, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(authKeys.profile, context.previousProfile);
      }
    },
    onSuccess: (data) => {
      // Update with server response
      queryClient.setQueryData(authKeys.profile, data);
    },
  });
}
