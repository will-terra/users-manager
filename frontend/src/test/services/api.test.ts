import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  adminApi,
  authApi,
  del,
  get,
  patch,
  post,
  upload,
} from "../../services/api";
import { authService } from "../../services/authService";

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

// Mock authService
vi.mock("../../services/authService", () => ({
  authService: {
    getToken: vi.fn(),
    setToken: vi.fn(),
    clearToken: vi.fn(),
  },
}));

// Mock window.location
const locationMock = { href: "" };
Object.defineProperty(window, "location", {
  value: locationMock,
  writable: true,
});

describe("api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3001/api/v1");
    locationMock.href = "";
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("authApi", () => {
    beforeEach(() => {
      // Mock getToken to return undefined by default for most tests
      authService.getToken.mockReturnValue(undefined);
    });

    describe("login", () => {
      test("successfully logs in user", async () => {
        const credentials = { email: "test@example.com", password: "password" };
        const mockResponse = {
          data: {
            user: {
              id: 1,
              email: "test@example.com",
              full_name: "Test User",
              role: "user",
            },
            token: "jwt.token.here",
          },
        };

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await authApi.login(credentials);

        expect(fetchMock).toHaveBeenCalledWith(
          "http://localhost:3001/api/v1/sign_in",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ user: credentials }),
          },
        );
        expect(authService.setToken).toHaveBeenCalledWith("jwt.token.here");
        expect(result).toEqual(mockResponse);
      });

      test("handles login failure", async () => {
        const credentials = { email: "test@example.com", password: "wrong" };

        fetchMock.mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: "Unauthorized",
          json: () =>
            Promise.resolve({ error: { message: "Invalid credentials" } }),
        });

        await expect(authApi.login(credentials)).rejects.toThrow(
          "Invalid credentials",
        );
        expect(authService.setToken).not.toHaveBeenCalled();
      });
    });

    describe("register", () => {
      test("successfully registers user", async () => {
        const userData = {
          full_name: "New User",
          email: "new@example.com",
          password: "password",
          password_confirmation: "password",
        };
        const mockResponse = {
          data: {
            user: {
              id: 2,
              email: "new@example.com",
              full_name: "New User",
              role: "user",
            },
            token: "jwt.token.here",
          },
        };

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await authApi.register(userData);

        expect(fetchMock).toHaveBeenCalledWith(
          "http://localhost:3001/api/v1/sign_up",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ user: userData }),
          },
        );
        expect(authService.setToken).toHaveBeenCalledWith("jwt.token.here");
        expect(result).toEqual(mockResponse);
      });
    });

    describe("logout", () => {
      test("successfully logs out user", async () => {
        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        });

        await authApi.logout();

        expect(fetchMock).toHaveBeenCalledWith(
          "http://localhost:3001/api/v1/sign_out",
          {
            method: "DELETE",
            headers: {},
            body: undefined,
          },
        );
        expect(authService.clearToken).toHaveBeenCalled();
      });

      test("clears token even if backend logout fails", async () => {
        fetchMock.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        });

        await authApi.logout();

        expect(authService.clearToken).toHaveBeenCalled();
      });
    });

    describe("getProfile", () => {
      test("successfully gets user profile", async () => {
        const mockResponse = {
          data: {
            id: 1,
            email: "test@example.com",
            full_name: "Test User",
            role: "user",
          },
        };

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await authApi.getProfile();

        expect(fetchMock).toHaveBeenCalledWith(
          "http://localhost:3001/api/v1/users/profile",
          {
            method: "GET",
            headers: {},
            body: undefined,
          },
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe("updateProfile", () => {
      test("successfully updates profile with text data", async () => {
        const userData = { full_name: "Updated Name" };
        const mockResponse = {
          data: {
            id: 1,
            email: "test@example.com",
            full_name: "Updated Name",
            role: "user",
          },
        };

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await authApi.updateProfile(userData);

        const formData = new FormData();
        formData.append("user[full_name]", "Updated Name");

        expect(fetchMock).toHaveBeenCalledWith(
          "http://localhost:3001/api/v1/users/profile",
          {
            method: "PATCH",
            headers: {},
            body: expect.any(FormData),
          },
        );
        expect(result).toEqual(mockResponse);
      });

      test("handles avatar file upload", async () => {
        const file = new File(["avatar content"], "avatar.jpg", {
          type: "image/jpeg",
        });
        const userData = { avatar: file };

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: {} }),
        });

        await authApi.updateProfile(userData);

        expect(fetchMock).toHaveBeenCalledWith(
          "http://localhost:3001/api/v1/users/profile",
          {
            method: "PATCH",
            headers: {},
            body: expect.any(FormData),
          },
        );
      });

      test("handles remove_avatar flag", async () => {
        const userData = { remove_avatar: true };

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: {} }),
        });

        await authApi.updateProfile(userData);

        expect(fetchMock).toHaveBeenCalledWith(
          "http://localhost:3001/api/v1/users/profile",
          {
            method: "PATCH",
            headers: {},
            body: expect.any(FormData),
          },
        );
      });

      test("handles avatar_url when non-empty", async () => {
        const userData = { avatar_url: "http://example.com/avatar.jpg" };

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: {} }),
        });

        await authApi.updateProfile(userData);

        expect(fetchMock).toHaveBeenCalledWith(
          "http://localhost:3001/api/v1/users/profile",
          {
            method: "PATCH",
            headers: {},
            body: expect.any(FormData),
          },
        );
      });
    });
  });

  describe("adminApi", () => {
    describe("getStats", () => {
      test("successfully gets admin stats", async () => {
        const mockResponse = {
          stats: {
            total_users: 100,
            admin_count: 5,
            user_count: 95,
            recent_signups: 10,
            active_today: 20,
          },
        };

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await adminApi.getStats();

        expect(fetchMock).toHaveBeenCalledWith(
          "http://localhost:3001/api/v1/admin/stats",
          {
            method: "GET",
            headers: {},
            body: undefined,
          },
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe("getUsers", () => {
      test("gets users without search", async () => {
        const mockResponse = {
          data: {
            users: [
              {
                id: 1,
                email: "user1@example.com",
                full_name: "User 1",
                role: "user",
              },
              {
                id: 2,
                email: "user2@example.com",
                full_name: "User 2",
                role: "admin",
              },
            ],
            pagination: {
              current_page: 1,
              total_pages: 5,
              total_count: 50,
              per_page: 10,
            },
          },
        };

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await adminApi.getUsers(1);

        expect(fetchMock).toHaveBeenCalledWith(
          "http://localhost:3001/api/v1/admin/users?page=1",
          {
            method: "GET",
            headers: {},
            body: undefined,
          },
        );
        expect(result).toEqual(mockResponse);
      });

      test("gets users with search", async () => {
        const mockResponse = {
          data: {
            users: [
              {
                id: 1,
                email: "user1@example.com",
                full_name: "User 1",
                role: "user",
              },
            ],
            pagination: {
              current_page: 1,
              total_pages: 1,
              total_count: 1,
              per_page: 10,
            },
          },
        };

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await adminApi.getUsers(1, "user1");

        expect(fetchMock).toHaveBeenCalledWith(
          "http://localhost:3001/api/v1/admin/users?page=1&search=user1",
          {
            method: "GET",
            headers: {},
            body: undefined,
          },
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe("getUser", () => {
      test("successfully gets single user", async () => {
        const mockResponse = {
          data: {
            id: 1,
            email: "user1@example.com",
            full_name: "User 1",
            role: "user",
          },
        };

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await adminApi.getUser(1);

        expect(fetchMock).toHaveBeenCalledWith(
          "http://localhost:3001/api/v1/admin/users/1",
          {
            method: "GET",
            headers: {},
            body: undefined,
          },
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe("createUser", () => {
      test("successfully creates user", async () => {
        const userData = {
          full_name: "New User",
          email: "new@example.com",
          password: "password",
        };
        const mockResponse = {
          data: {
            id: 3,
            email: "new@example.com",
            full_name: "New User",
            role: "user",
          },
        };

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await adminApi.createUser(userData);

        expect(fetchMock).toHaveBeenCalledWith(
          "http://localhost:3001/api/v1/admin/users",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ user: userData }),
          },
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe("updateUser", () => {
      test("successfully updates user", async () => {
        const userData = { full_name: "Updated Name" };
        const mockResponse = {
          data: {
            id: 1,
            email: "user1@example.com",
            full_name: "Updated Name",
            role: "user",
          },
        };

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await adminApi.updateUser(1, userData);

        expect(fetchMock).toHaveBeenCalledWith(
          "http://localhost:3001/api/v1/admin/users/1",
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ user: userData }),
          },
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe("deleteUser", () => {
      test("successfully deletes user", async () => {
        fetchMock.mockResolvedValueOnce({
          ok: true,
          status: 204,
        });

        await adminApi.deleteUser(1);

        expect(fetchMock).toHaveBeenCalledWith(
          "http://localhost:3001/api/v1/admin/users/1",
          {
            method: "DELETE",
            headers: {},
            body: undefined,
          },
        );
      });
    });

    describe("toggleUserRole", () => {
      test("successfully toggles user role", async () => {
        const mockResponse = {
          data: {
            id: 1,
            email: "user1@example.com",
            full_name: "User 1",
            role: "admin",
          },
        };

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await adminApi.toggleUserRole(1);

        expect(fetchMock).toHaveBeenCalledWith(
          "http://localhost:3001/api/v1/admin/users/1/toggle_role",
          {
            method: "PATCH",
            headers: {},
            body: undefined,
          },
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe("getImports", () => {
      test("successfully gets imports", async () => {
        const mockResponse = {
          imports: {
            data: [
              {
                id: "1",
                attributes: {
                  status: "completed",
                  progress: 100,
                  total_rows: 1000,
                  file_name: "import.csv",
                  created_at: "2025-01-01T00:00:00Z",
                },
              },
            ],
          },
          pagination: {
            current_page: 1,
            total_pages: 1,
            total_count: 1,
            per_page: 10,
          },
        };

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await adminApi.getImports(1);

        expect(fetchMock).toHaveBeenCalledWith(
          "http://localhost:3001/api/v1/admin/imports?page=1",
          {
            method: "GET",
            headers: {},
            body: undefined,
          },
        );
        expect(result).toEqual({
          data: {
            imports: [
              {
                id: 1,
                status: "completed",
                progress: 100,
                total_rows: 1000,
                file_name: "import.csv",
                created_at: "2025-01-01T00:00:00Z",
              },
            ],
            pagination: mockResponse.pagination,
          },
        });
      });
    });

    describe("createImport", () => {
      test("successfully creates import", async () => {
        const file = new File(["csv content"], "import.csv", {
          type: "text/csv",
        });
        const mockResponse = {
          imports: {
            data: {
              id: "1",
              attributes: {
                status: "pending",
                file_name: "import.csv",
                created_at: "2025-01-01T00:00:00Z",
              },
            },
          },
        };

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await adminApi.createImport(file);

        expect(fetchMock).toHaveBeenCalledWith(
          "http://localhost:3001/api/v1/admin/imports",
          {
            method: "POST",
            headers: {},
            body: expect.any(FormData),
          },
        );
        expect(result).toEqual({
          data: {
            id: 1,
            status: "pending",
            file_name: "import.csv",
            created_at: "2025-01-01T00:00:00Z",
          },
        });
      });
    });
  });

  describe("utility functions", () => {
    describe("get", () => {
      test("makes GET request", async () => {
        const mockResponse = { data: "test" };

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await get("/test");

        expect(fetchMock).toHaveBeenCalledWith(
          "http://localhost:3001/api/v1/test",
          {
            method: "GET",
            headers: {},
            body: undefined,
          },
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe("post", () => {
      test("makes POST request", async () => {
        const body = { test: "data" };
        const mockResponse = { data: "created" };

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await post("/test", body);

        expect(fetchMock).toHaveBeenCalledWith(
          "http://localhost:3001/api/v1/test",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          },
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe("patch", () => {
      test("makes PATCH request", async () => {
        const body = { test: "updated" };
        const mockResponse = { data: "updated" };

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await patch("/test", body);

        expect(fetchMock).toHaveBeenCalledWith(
          "http://localhost:3001/api/v1/test",
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          },
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe("del", () => {
      test("makes DELETE request", async () => {
        fetchMock.mockResolvedValueOnce({
          ok: true,
          status: 204,
        });

        await del("/test");

        expect(fetchMock).toHaveBeenCalledWith(
          "http://localhost:3001/api/v1/test",
          {
            method: "DELETE",
            headers: {},
            body: undefined,
          },
        );
      });
    });

    describe("upload", () => {
      test("makes file upload request", async () => {
        const formData = new FormData();
        formData.append("file", new File(["content"], "test.txt"));
        const mockResponse = { data: "uploaded" };

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await upload("/upload", formData);

        expect(fetchMock).toHaveBeenCalledWith(
          "http://localhost:3001/api/v1/upload",
          {
            method: "POST",
            headers: {},
            body: formData,
          },
        );
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe("error handling", () => {
    test("handles 401 unauthorized and redirects to login", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: () => Promise.resolve({}),
      });

      await expect(get("/protected")).rejects.toThrow("Unauthorized");
      expect(authService.clearToken).toHaveBeenCalled();
      expect(locationMock.href).toBe("/login");
    });

    test("skips 401 redirect when skip401 is true", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: () =>
          Promise.resolve({ error: { message: "Invalid credentials" } }),
      });

      await expect(
        authApi.login({ email: "test", password: "test" }),
      ).rejects.toThrow("Invalid credentials");
      expect(authService.clearToken).not.toHaveBeenCalled();
      expect(locationMock.href).toBe("");
    });

    test("handles various error response formats", async () => {
      // Test array of errors
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: "Unprocessable Entity",
        json: () =>
          Promise.resolve({
            errors: ["Email is invalid", "Password is too short"],
          }),
      });

      await expect(get("/test")).rejects.toThrow(
        "Email is invalid, Password is too short",
      );

      // Test nested error details
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: "Unprocessable Entity",
        json: () =>
          Promise.resolve({ error: { details: ["Field is required"] } }),
      });

      await expect(get("/test")).rejects.toThrow("Field is required");

      // Test error.message
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: () => Promise.resolve({ error: { message: "Database error" } }),
      });

      await expect(get("/test")).rejects.toThrow("Database error");

      // Test direct message
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: () => Promise.resolve({ message: "Bad request" }),
      });

      await expect(get("/test")).rejects.toThrow("Bad request");

      // Test fallback to statusText
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: () => Promise.resolve({}),
      });

      await expect(get("/test")).rejects.toThrow("Not Found");
    });

    test("handles 204 No Content responses", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await get("/test");

      expect(result).toEqual({});
    });

    test("handles network errors", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      await expect(get("/test")).rejects.toThrow("Network error");
    });

    test("handles invalid JSON in error response", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: () => Promise.reject(new Error("Invalid JSON")),
      });

      await expect(get("/test")).rejects.toThrow("Internal Server Error");
    });
  });

  describe("token handling", () => {
    test("includes authorization header when token is available", async () => {
      authService.getToken.mockReturnValue("test.token");

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: "success" }),
      });

      await get("/test");

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/test",
        {
          method: "GET",
          headers: { Authorization: "Bearer test.token" },
          body: undefined,
        },
      );
    });

    test("overrides token when provided in options", async () => {
      authService.getToken.mockReturnValue("default.token");

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: "success" }),
      });

      await get("/test", { token: "override.token" });

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/test",
        {
          method: "GET",
          headers: { Authorization: "Bearer override.token" },
          body: undefined,
        },
      );
    });

    test("does not include authorization header when no token", async () => {
      authService.getToken.mockReturnValue(null);

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: "success" }),
      });

      await get("/test");

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/test",
        {
          method: "GET",
          headers: {},
          body: undefined,
        },
      );
    });
  });

  describe("content type handling", () => {
    test("sets content-type for JSON requests", async () => {
      const body = { test: "data" };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await post("/test", body);

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/test",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );
    });

    test("does not set content-type for FormData", async () => {
      const formData = new FormData();
      formData.append("file", new File(["content"], "test.txt"));

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await post("/test", formData);

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/test",
        {
          method: "POST",
          headers: {},
          body: formData,
        },
      );
    });
  });

  describe("custom headers", () => {
    test("merges custom headers with default headers", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await get("/test", { headers: { "X-Custom": "value" } });

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/test",
        {
          method: "GET",
          headers: {
            "X-Custom": "value",
          },
          body: undefined,
        },
      );
    });
  });
});
