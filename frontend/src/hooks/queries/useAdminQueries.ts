/**
 * TanStack Query hooks for admin operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../services/api";
import type { User } from "../../types/user";

export const adminKeys = {
  stats: ["admin", "stats"] as const,
  users: (page: number, search: string) =>
    ["admin", "users", { page, search }] as const,
  user: (id: number) => ["admin", "users", id] as const,
  imports: (page: number) => ["admin", "imports", { page }] as const,
};

/**
 * Get admin dashboard statistics
 */
export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats,
    queryFn: () => adminApi.getStats(),
  });
}

/**
 * Get paginated list of users
 */
export function useUsers(page = 1, search = "") {
  return useQuery({
    queryKey: adminKeys.users(page, search),
    queryFn: () => adminApi.getUsers(page, search),
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });
}

/**
 * Get a single user by ID
 */
export function useUser(id: number) {
  return useQuery({
    queryKey: adminKeys.user(id),
    queryFn: () => adminApi.getUser(id),
    enabled: !!id, // Only run if id is provided
  });
}

/**
 * Create a new user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (userData: Partial<User> & { password?: string }) =>
      adminApi.createUser(userData),
    onSuccess: () => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats });
      navigate("/admin/users");
    },
  });
}

/**
 * Update an existing user
 */
export function useUpdateUser(id: number) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (userData: Partial<User>) => adminApi.updateUser(id, userData),
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: adminKeys.user(id) });

      // Snapshot the previous value
      const previousUser = queryClient.getQueryData(adminKeys.user(id));

      // Optimistically update
      queryClient.setQueryData(adminKeys.user(id), (old: { data: User }) => ({
        data: { ...old.data, ...newData },
      }));

      return { previousUser };
    },
    onError: (_err, _newData, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(adminKeys.user(id), context.previousUser);
      }
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: adminKeys.user(id) });
      navigate("/admin/users");
    },
  });
}

/**
 * Delete a user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminApi.deleteUser(id),
    onSuccess: () => {
      // Invalidate users list and stats
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats });
    },
  });
}

/**
 * Toggle user role between admin and user
 */
export function useToggleUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminApi.toggleUserRole(id),
    onSuccess: (data, id) => {
      // Update the user in cache
      queryClient.setQueryData(adminKeys.user(id), data);
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats });
    },
  });
}

/**
 * Get paginated list of imports
 */
export function useImports(page = 1) {
  return useQuery({
    queryKey: adminKeys.imports(page),
    queryFn: () => adminApi.getImports(page),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Create a new import
 */
export function useCreateImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => adminApi.createImport(file),
    onSuccess: () => {
      // Invalidate imports list and stats
      queryClient.invalidateQueries({ queryKey: ["admin", "imports"] });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats });
    },
  });
}
