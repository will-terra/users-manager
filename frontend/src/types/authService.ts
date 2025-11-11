import type { User } from "./user";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  password_confirmation?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  redirect_to?: string;
}

export interface JwtPayload {
  id: number;
  exp: number;
  email: string;
  role: string;
  full_name: string;
}
