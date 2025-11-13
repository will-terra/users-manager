export interface User {
  id: number;
  full_name: string;
  email: string;
  role: "admin" | "user";
  avatar_urls?: {
    thumb: string;
    medium: string;
    large: string;
    original: string;
  };
  has_avatar?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserFormData {
  full_name: string;
  email: string;
  role: "admin" | "user";
  avatar?: File | string | null;
  avatar_url?: string;
}

export interface PaginationParams {
  page: number;
  per_page: number;
}

export interface UsersResponse {
  users: User[];
  meta: {
    total_count: number;
    total_pages: number;
    current_page: number;
    per_page: number;
  };
}
