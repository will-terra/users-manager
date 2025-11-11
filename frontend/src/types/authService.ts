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
