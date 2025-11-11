export interface AdminStats {
  total_users: number;
  admin_count: number;
  user_count: number;
  recent_signups: number;
  active_today: number;
  inactive_users?: number;
  users_by_month?: Record<string, number>;
  role_distribution?: Record<string, number>;
}

export interface Pagination {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page?: number;
}

export interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  password_confirmation?: string;
}
