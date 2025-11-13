/**
 * Fetch-based API client  with automatic token injection from authService.
 * Handles 401 responses by clearing token and redirecting to /login.
 */

import type { AdminStats, Pagination, RegisterData } from "../types/api";
import type { AuthResponse, LoginCredentials } from "../types/authService";
import type { User } from "../types/user";
import { authService } from "./authService";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api/v1";

/**
 * Handle fetch response, including error cases and 401 redirects
 */
async function handleResponse<T>(
  response: Response,
  options: { skip401?: boolean } = {},
): Promise<T> {
  // Handle 401 Unauthorized
  if (response.status === 401 && !options.skip401) {
    authService.clearToken();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  // Handle other error statuses
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    // Extract error message from various possible formats
    let message: string;
    if (
      errorBody?.errors &&
      Array.isArray(errorBody.errors) &&
      errorBody.errors.length > 0
    ) {
      // Handle array of error messages
      message = errorBody.errors.join(", ");
    } else if (
      errorBody?.error?.details &&
      Array.isArray(errorBody.error.details) &&
      errorBody.error.details.length > 0
    ) {
      // Handle nested error details array
      message = errorBody.error.details.join(", ");
    } else if (errorBody?.error?.message) {
      message = errorBody.error.message;
    } else if (errorBody?.message) {
      message = errorBody.message;
    } else {
      message = response.statusText || "Request failed";
    }

    const err = new Error(message) as Error & {
      body?: unknown;
      status?: number;
    };
    err.body = errorBody;
    err.status = response.status;
    throw err;
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  // Parse JSON response
  return response.json();
}

/**
 * Request function that automatically adds token from authService
 */
async function request<T>(
  method: string,
  endpoint: string,
  body?: unknown,
  options: { token?: string; headers?: HeadersInit; skip401?: boolean } = {},
): Promise<T> {
  const token = options.token ?? authService.getToken();

  const headers: HeadersInit = {
    ...(body && !(body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body:
      body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  return handleResponse<T>(response, { skip401: options.skip401 });
}

// ===== Auth API =====

export const authApi = {
  /**
   * Authenticate a user
   */
  login: async (
    credentials: LoginCredentials,
  ): Promise<{ data: AuthResponse }> => {
    const response = await request<{ data: AuthResponse }>(
      "POST",
      "/sign_in",
      {
        user: credentials,
      },
      { skip401: true },
    );
    authService.setToken(response.data.token);
    return response;
  },

  /**
   * Register a new user
   */
  register: async (userData: RegisterData): Promise<{ data: AuthResponse }> => {
    const response = await request<{ data: AuthResponse }>("POST", "/sign_up", {
      user: userData,
    });
    authService.setToken(response.data.token);
    return response;
  },

  /**
   * Sign out (invalidate token)
   */
  logout: async (): Promise<void> => {
    try {
      await request("DELETE", "/sign_out");
    } catch (error) {
      console.warn("Backend logout failed:", error);
    } finally {
      authService.clearToken();
    }
  },

  /**
   * Get current user profile
   */
  getProfile: async (): Promise<{ data: User }> => {
    return request<{ data: User }>("GET", "/users/profile");
  },

  /**
   * Update user profile (supports file upload for avatar)
   */
  updateProfile: async (
    userData: Partial<User> & {
      avatar?: File;
      avatar_url?: string;
      remove_avatar?: boolean;
    },
  ): Promise<{ data: User }> => {
    const formData = new FormData();

    Object.keys(userData).forEach((key) => {
      const value = userData[key as keyof typeof userData];
      if (key === "avatar" && value instanceof File) {
        formData.append("user[avatar]", value);
      } else if (key === "remove_avatar") {
        // Rails model expects remove_avatar to be the string '1' to trigger purge
        if (value) {
          formData.append("user[remove_avatar]", "1");
        }
      } else if (key === "avatar_url") {
        // Only append avatar_url when non-empty; an empty string signals removal
        if (value && String(value).trim() !== "") {
          formData.append(`user[${key}]`, String(value));
        }
      } else if (value !== undefined && value !== null) {
        formData.append(`user[${key}]`, String(value));
      }
    });

    return request<{ data: User }>("PATCH", "/users/profile", formData);
  },
};

// ===== Admin API =====

export const adminApi = {
  /**
   * Get admin dashboard statistics
   */
  getStats: async (): Promise<{ stats: AdminStats }> => {
    return request<{ stats: AdminStats }>("GET", "/admin/stats");
  },

  /**
   * Get paginated list of users
   */
  getUsers: async (
    page = 1,
    search = "",
  ): Promise<{ data: { users: User[]; pagination: Pagination } }> => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    if (search) params.append("search", search);
    return request<{ data: { users: User[]; pagination: Pagination } }>(
      "GET",
      `/admin/users?${params.toString()}`,
    );
  },

  /**
   * Get a single user by ID
   */
  getUser: async (id: number): Promise<{ data: User }> => {
    return request<{ data: User }>("GET", `/admin/users/${id}`);
  },

  /**
   * Create a new user
   */
  createUser: async (
    userData: Partial<User> & { password?: string },
  ): Promise<{ data: User }> => {
    return request<{ data: User }>("POST", "/admin/users", { user: userData });
  },

  /**
   * Update an existing user
   */
  updateUser: async (
    id: number,
    userData: Partial<User>,
  ): Promise<{ data: User }> => {
    return request<{ data: User }>("PATCH", `/admin/users/${id}`, {
      user: userData,
    });
  },

  /**
   * Delete a user
   */
  deleteUser: async (id: number): Promise<void> => {
    await request("DELETE", `/admin/users/${id}`);
  },

  /**
   * Toggle user role between admin and user
   */
  toggleUserRole: async (id: number): Promise<{ data: User }> => {
    return request<{ data: User }>("PATCH", `/admin/users/${id}/toggle_role`);
  },

  /**
   * Get paginated list of imports
   */
  getImports: async (
    page = 1,
  ): Promise<{ data: { imports: unknown[]; pagination: Pagination } }> => {
    const params = new URLSearchParams();
    params.append("page", page.toString());

    // Backend returns a JSONAPI-serialized payload under `imports`, e.g.
    // { imports: { data: [ { id, attributes: { ... } }, ... ] }, pagination: { ... } }
    // Normalize it into an array of flat import objects that match ImportProgress
    const response = await request<{
      imports: {
        data: Array<{ id: string; attributes: Record<string, unknown> }>;
      };
      pagination: Pagination;
    }>("GET", `/admin/imports?${params.toString()}`);

    const serialized = response.imports as
      | { data: Array<{ id: string; attributes?: Record<string, unknown> }> }
      | undefined;

    const imports: unknown[] = Array.isArray(serialized?.data)
      ? serialized.data.map((item) => {
          const attrs = item.attributes ?? {};
          return {
            id: Number(item.id),
            ...attrs,
          } as unknown;
        })
      : [];

    return { data: { imports, pagination: response.pagination } };
  },

  /**
   * Create a new import
   */
  createImport: async (file: File): Promise<{ data: unknown }> => {
    const formData = new FormData();
    formData.append("import[file]", file);

    // The create endpoint returns a JSONAPI-serialized single resource.
    // Normalize to return a flat import object to the caller.
    const response = await request<
      | {
          imports?: {
            data: { id: string; attributes?: Record<string, unknown> };
          };
        }
      | { data?: { id: string; attributes?: Record<string, unknown> } }
    >("POST", "/admin/imports", formData);

    // Support responses that return either { imports: { data: { ... } } }
    // or { data: { ... } } depending on serialization
    const respObj = response as Record<string, unknown>;
    const maybeImports = respObj["imports"] as
      | { data?: { id: string; attributes?: Record<string, unknown> } }
      | undefined;
    const maybeData = respObj["data"] as
      | { id: string; attributes?: Record<string, unknown> }
      | undefined;

    const resource = maybeImports?.data ?? maybeData ?? null;

    const created = resource
      ? { id: Number(resource.id), ...(resource.attributes || {}) }
      : null;

    return { data: created };
  },
};

// ===== Utility API functions =====

export const get = <T>(
  endpoint: string,
  options?: { token?: string; headers?: HeadersInit },
): Promise<T> => request<T>("GET", endpoint, undefined, options);

export const post = <T>(
  endpoint: string,
  body?: unknown,
  options?: { token?: string; headers?: HeadersInit },
): Promise<T> => request<T>("POST", endpoint, body, options);

export const patch = <T>(
  endpoint: string,
  body?: unknown,
  options?: { token?: string; headers?: HeadersInit },
): Promise<T> => request<T>("PATCH", endpoint, body, options);

export const del = <T>(
  endpoint: string,
  options?: { token?: string; headers?: HeadersInit },
): Promise<T> => request<T>("DELETE", endpoint, undefined, options);

export const upload = <T>(
  endpoint: string,
  formData: FormData,
  options?: { token?: string; headers?: HeadersInit },
): Promise<T> => request<T>("POST", endpoint, formData, options);
