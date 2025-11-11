/**
 * Token storage and JWT utilities service.
 * Supports configurable storage strategies: localStorage, sessionStorage, or in-memory.
 * Handles JWT decoding, expiration checking, and user extraction from tokens.
 */

import type { User } from "../types/user";

// Storage strategy configuration
type StorageType = "localStorage" | "sessionStorage" | "memory";

const STORAGE_TYPE: StorageType =
  (import.meta.env.VITE_TOKEN_STORAGE as StorageType) || "localStorage";

interface TokenStorage {
  get(): string | null;
  set(token: string): void;
  clear(): void;
}

class LocalStorageTokenStorage implements TokenStorage {
  private key = "authToken";

  get(): string | null {
    return localStorage.getItem(this.key);
  }

  set(token: string): void {
    localStorage.setItem(this.key, token);
  }

  clear(): void {
    localStorage.removeItem(this.key);
  }
}

class SessionStorageTokenStorage implements TokenStorage {
  private key = "authToken";

  get(): string | null {
    return sessionStorage.getItem(this.key);
  }

  set(token: string): void {
    sessionStorage.setItem(this.key, token);
  }

  clear(): void {
    sessionStorage.removeItem(this.key);
  }
}

class MemoryTokenStorage implements TokenStorage {
  private token: string | null = null;

  get(): string | null {
    return this.token;
  }

  set(token: string): void {
    this.token = token;
  }

  clear(): void {
    this.token = null;
  }
}

const tokenStorages: Record<StorageType, TokenStorage> = {
  localStorage: new LocalStorageTokenStorage(),
  sessionStorage: new SessionStorageTokenStorage(),
  memory: new MemoryTokenStorage(),
};

const tokenStorage = tokenStorages[STORAGE_TYPE];

// JWT payload interface
export interface JwtPayload {
  user?: User;
  exp?: number;
  iat?: number;
  sub?: string;
}

// User interface

// JWT utility functions
function decodeJWT(token: string): JwtPayload | null {
  if (!token || token.split(".").length !== 3) return null;
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    ) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  return Date.now() >= decoded.exp * 1000;
}

// Token storage service
export const authService = {
  /**
   * Get current token
   */
  getToken(): string | null {
    const token = tokenStorage.get();
    if (!token || token.split(".").length !== 3) return null;
    return token;
  },

  /**
   * Set token
   */
  setToken(token: string): void {
    tokenStorage.set(token);
  },

  /**
   * Clear token
   */
  clearToken(): void {
    tokenStorage.clear();
  },

  /**
   * Check if user is authenticated (token exists and not expired)
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return token !== null && !isTokenExpired(token);
  },

  /**
   * Get current user from token (without API call)
   */
  getCurrentUser(): User | null {
    const token = this.getToken();
    if (!token || isTokenExpired(token)) return null;
    const decoded = decodeJWT(token);
    return decoded?.user || null;
  },

  /**
   * Decode JWT token
   */
  decodeToken(token: string): JwtPayload | null {
    return decodeJWT(token);
  },

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    return isTokenExpired(token);
  },
};
