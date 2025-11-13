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

export interface ImportProgress {
  id: number;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  total_rows: number;
  percentage: number;
  error_message?: string;
  file_name: string;
  created_at: string;
  user?: {
    id: number;
    full_name: string;
  };
  successful_imports?: number;
  failed_imports?: number;
  recent_errors?: string[];
}
