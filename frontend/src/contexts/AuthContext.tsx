import type { ReactNode } from "react";
import React, { createContext, useEffect, useState } from "react";
import { authApi } from "../services/api";
import { authService } from "../services/authService";
import type {
  AuthResponse,
  LoginCredentials,
  RegisterPayload,
} from "../types/authService";
import type { User } from "../types/user";

interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (
    data: Partial<User> & {
      avatar?: File;
      avatar_url?: string;
      remove_avatar?: boolean;
    },
  ) => Promise<void>;
  isLoading: boolean;
  // Global notifications (quick solution for persistent messages across remounts)
  globalError: string | null;
  globalSuccess: string | null;
  setGlobalError: (msg: string | null) => void;
  setGlobalSuccess: (msg: string | null) => void;
  clearNotifications: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);

  const isAuthenticated = authService.isAuthenticated();

  useEffect(() => {
    // Initialize auth state on mount
    const initAuth = () => {
      const token = authService.getToken();
      if (token && authService.isAuthenticated()) {
        setTokenState(token);
        // Try to get full user data from localStorage first, fallback to JWT reconstruction
        const storedUser = localStorage.getItem("currentUser");
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            setCurrentUser(user);
          } catch (error) {
            console.error("Failed to parse stored user data:", error);
            // Fallback to JWT reconstruction
            const user = authService.getCurrentUser();
            setCurrentUser(user);
          }
        } else {
          // Fallback to JWT reconstruction
          const user = authService.getCurrentUser();
          setCurrentUser(user);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (
    credentials: LoginCredentials,
  ): Promise<AuthResponse> => {
    const response = await authApi.login(credentials);
    setTokenState(response.data.token);
    setCurrentUser(response.data.user);
    localStorage.setItem("currentUser", JSON.stringify(response.data.user));
    return response.data;
  };

  const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authApi.register(payload);
      setTokenState(response.data.token);
      setCurrentUser(response.data.user);
      localStorage.setItem("currentUser", JSON.stringify(response.data.user));
      return response.data;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
      setTokenState(null);
      setCurrentUser(null);
      localStorage.removeItem("currentUser");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await authApi.getProfile();
      setCurrentUser(response.data);
      localStorage.setItem("currentUser", JSON.stringify(response.data));
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (
    data: Partial<User> & {
      avatar?: File;
      avatar_url?: string;
      remove_avatar?: boolean;
    },
  ) => {
    setIsLoading(true);
    try {
      const response = await authApi.updateProfile(data);
      setCurrentUser(response.data);
      // Update stored user data
      localStorage.setItem("currentUser", JSON.stringify(response.data));
    } finally {
      setIsLoading(false);
    }
  };

  const setGlobalErrorMsg = (msg: string | null) => {
    setGlobalError(msg);
  };

  const setGlobalSuccessMsg = (msg: string | null) => {
    setGlobalSuccess(msg);
  };

  const clearNotifications = () => {
    setGlobalError(null);
    setGlobalSuccess(null);
  };

  const value: AuthContextType = {
    currentUser,
    token,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
    updateProfile,
    isLoading,
    globalError,
    globalSuccess,
    setGlobalError: setGlobalErrorMsg,
    setGlobalSuccess: setGlobalSuccessMsg,
    clearNotifications,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
