// Mock localStorage and sessionStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
});

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  LocalStorageTokenStorage,
  MemoryTokenStorage,
  SessionStorageTokenStorage,
} from "../../services/authService";

// Set default environment for most tests
vi.stubEnv("VITE_TOKEN_STORAGE", "localStorage");
vi.stubEnv("VITE_DEV_AUTH_TOKEN", null);

// Import with default configuration
const { authService } = await import("../../services/authService");

// Create a valid JWT token for testing
// Header: {"typ":"JWT","alg":"HS256"}
// Payload: {"id":1,"email":"test@example.com","role":"user","full_name":"Test User","exp":2000000000}
// Signature: (not verified in tests)
const validToken =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJmdWxsX25hbWUiOiJUZXN0IFVzZXIiLCJleHAiOjIwMDAwMDAwMDB9.test";
const expiredToken =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJmdWxsX25hbWUiOiJUZXN0IFVzZXIiLCJleHAiOjE2MzUzNDQwMDB9.test";

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
    sessionStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.setItem.mockImplementation(() => {});
    sessionStorageMock.removeItem.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getToken", () => {
    test("returns dev auth token when available", async () => {
      vi.stubEnv("VITE_DEV_AUTH_TOKEN", validToken);
      vi.resetModules();

      const { authService: testAuthService } = await import(
        "../../services/authService"
      );

      const result = testAuthService.getToken();

      expect(result).toBe(validToken);
    });

    test("returns token from localStorage when no dev token", () => {
      const token = "test.token.here";
      localStorageMock.getItem.mockReturnValue(token);

      const result = authService.getToken();

      expect(localStorageMock.getItem).toHaveBeenCalledWith("authToken");
      expect(result).toBe(token);
    });

    test("returns null for invalid token format", () => {
      localStorageMock.getItem.mockReturnValue("invalid-token");

      const result = authService.getToken();

      expect(result).toBeNull();
    });

    test("returns null when no token in storage", () => {
      const result = authService.getToken();

      expect(result).toBeNull();
    });
  });

  describe("setToken", () => {
    test("stores token in localStorage", () => {
      const token = "test.token.here";

      authService.setToken(token);

      expect(localStorageMock.setItem).toHaveBeenCalledWith("authToken", token);
    });
  });

  describe("clearToken", () => {
    test("removes token from localStorage", () => {
      authService.clearToken();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith("authToken");
    });
  });

  describe("isAuthenticated", () => {
    test("returns true for valid non-expired token", () => {
      localStorageMock.getItem.mockReturnValue(validToken);

      const result = authService.isAuthenticated();

      expect(result).toBe(true);
    });

    test("returns false for expired token", () => {
      localStorageMock.getItem.mockReturnValue(expiredToken);

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });

    test("returns false when no token", () => {
      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe("getCurrentUser", () => {
    test("returns user object from valid token", () => {
      localStorageMock.getItem.mockReturnValue(validToken);

      const result = authService.getCurrentUser();

      expect(result).toEqual({
        id: 1,
        email: "test@example.com",
        role: "user",
        full_name: "Test User",
      });
    });

    test("returns null for expired token", () => {
      localStorageMock.getItem.mockReturnValue(expiredToken);

      const result = authService.getCurrentUser();

      expect(result).toBeNull();
    });

    test("returns null for invalid token", () => {
      localStorageMock.getItem.mockReturnValue("invalid.token");

      const result = authService.getCurrentUser();

      expect(result).toBeNull();
    });

    test("returns null when no token", () => {
      const result = authService.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe("decodeToken", () => {
    test("decodes valid JWT token", () => {
      const result = authService.decodeToken(validToken);

      expect(result).toEqual({
        id: 1,
        email: "test@example.com",
        role: "user",
        full_name: "Test User",
        exp: 2000000000,
      });
    });

    test("returns null for invalid token format", () => {
      const result = authService.decodeToken("invalid.token");

      expect(result).toBeNull();
    });

    test("returns null for malformed JWT", () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const result = authService.decodeToken("header.invalid-base64.signature");

      expect(result).toBeNull();

      consoleError.mockRestore();
    });
  });

  describe("isTokenExpired", () => {
    test("returns false for non-expired token", () => {
      const result = authService.isTokenExpired(validToken);

      expect(result).toBe(false);
    });

    test("returns true for expired token", () => {
      const result = authService.isTokenExpired(expiredToken);

      expect(result).toBe(true);
    });

    test("returns true for token without exp", () => {
      const tokenWithoutExp =
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJmdWxsX25hbWUiOiJUZXN0IFVzZXIifQ.test";

      const result = authService.isTokenExpired(tokenWithoutExp);

      expect(result).toBe(true);
    });
  });

  describe("storage strategies", () => {
    test("uses localStorage by default", () => {
      // Test with default configuration (localStorage)
      authService.setToken(validToken);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "authToken",
        validToken,
      );
    });

    test("uses sessionStorage when configured", async () => {
      // Test sessionStorage directly by importing with different env
      vi.resetModules();
      vi.stubEnv("VITE_TOKEN_STORAGE", "sessionStorage");

      const { authService: sessionAuthService } = await import(
        "../../services/authService"
      );

      sessionAuthService.setToken(validToken);
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        "authToken",
        validToken,
      );
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    test("uses memory storage when configured", async () => {
      vi.resetModules();
      vi.stubEnv("VITE_TOKEN_STORAGE", "memory");

      const { authService: memoryAuthService } = await import(
        "../../services/authService"
      );

      memoryAuthService.setToken(validToken);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      expect(sessionStorageMock.setItem).not.toHaveBeenCalled();
      expect(memoryAuthService.getToken()).toBe(validToken);
    });

    test("falls back to localStorage for invalid storage type", async () => {
      vi.resetModules();
      vi.stubEnv("VITE_TOKEN_STORAGE", "invalid");

      const { authService: fallbackAuthService } = await import(
        "../../services/authService"
      );

      fallbackAuthService.setToken(validToken);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "authToken",
        validToken,
      );
      expect(sessionStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  test("SessionStorageTokenStorage get method", () => {
    const storage = new SessionStorageTokenStorage();
    sessionStorageMock.getItem.mockReturnValue("session-token");

    const result = storage.get();

    expect(sessionStorageMock.getItem).toHaveBeenCalledWith("authToken");
    expect(result).toBe("session-token");
  });

  test("SessionStorageTokenStorage set method", () => {
    const storage = new SessionStorageTokenStorage();

    storage.set("new-session-token");

    expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
      "authToken",
      "new-session-token",
    );
  });

  test("SessionStorageTokenStorage clear method", () => {
    const storage = new SessionStorageTokenStorage();

    storage.clear();

    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith("authToken");
  });

  test("LocalStorageTokenStorage class methods", () => {
    const storage = new LocalStorageTokenStorage();

    // Test get
    localStorageMock.getItem.mockReturnValue("local-token");
    expect(storage.get()).toBe("local-token");

    // Test set
    storage.set("new-local-token");
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "authToken",
      "new-local-token",
    );

    // Test clear
    storage.clear();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("authToken");
  });

  test("MemoryTokenStorage class methods", () => {
    const storage = new MemoryTokenStorage();

    // Test initial state
    expect(storage.get()).toBeNull();

    // Test set
    storage.set("memory-token");
    expect(storage.get()).toBe("memory-token");

    // Test clear
    storage.clear();
    expect(storage.get()).toBeNull();
  });

  test("getCurrentUser returns null when decoded token is null", () => {
    // Provide an invalid token that will fail decoding but pass initial checks
    const invalidToken = "header.!invalid-base64!.signature";
    localStorageMock.getItem.mockReturnValue(invalidToken);

    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = authService.getCurrentUser();

    expect(result).toBeNull();

    consoleError.mockRestore();
  });
});
