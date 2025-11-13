import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import React, { createContext } from "react";
import { authKeys } from "../hooks/queries/useAuthQueries";
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
  const queryClient = useQueryClient();
  const [token, setTokenState] = React.useState<string | null>(
    authService.getToken(),
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [globalError, setGlobalError] = React.useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = React.useState<string | null>(null);

  // Get current user from React Query cache as single source of truth
  const profileData = queryClient.getQueryData<{ data: User }>(
    authKeys.profile,
  );
  const currentUser = profileData?.data ?? null;

  const isAuthenticated = authService.isAuthenticated();

  const login = async (
    credentials: LoginCredentials,
  ): Promise<AuthResponse> => {
    const response = await authApi.login(credentials);
    setTokenState(response.data.token);
    // Set user in React Query cache
    queryClient.setQueryData(authKeys.profile, { data: response.data.user });
    return response.data;
  };

  const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authApi.register(payload);
      setTokenState(response.data.token);
      // Set user in React Query cache
      queryClient.setQueryData(authKeys.profile, { data: response.data.user });
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
      // Clear React Query cache
      queryClient.clear();
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await authApi.getProfile();
      // Update React Query cache
      queryClient.setQueryData(authKeys.profile, { data: response.data });
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
    isLoading,
    globalError,
    globalSuccess,
    setGlobalError: setGlobalErrorMsg,
    setGlobalSuccess: setGlobalSuccessMsg,
    clearNotifications,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
