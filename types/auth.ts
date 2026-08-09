// File: /types/auth.ts

export interface User {
  id: string | number;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  role?: string;
  roles?: (string | { id?: string | number; name: string })[];
  groups?: (string | { id?: string | number; name: string })[];
  permissions?: (string | { id?: string | number; name?: string; codename?: string })[];
  is_staff?: boolean;
  is_superuser?: boolean;
  is_superadmin?: boolean;
  joinedAt: string;
}

export interface UserEntity {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role?: string;
  joinedAt: string;
}

export interface RegisterPayload {
  name?: string;
  full_name?: string;
  email: string;
  password?: string;
  confirm_password?: string;
  confirmPassword?: string;
  phone?: string;
}

export interface RegisterResponse {
  customer?: any;
  user?: User;
  message?: string;
}

export interface LoginPayload {
  credential?: string;
  email?: string;
  password?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface TokenRefreshPayload {
  refreshToken: string;
}

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken?: string;
}

export interface UserProfileResponse {
  id: string | number;
  user_id?: string | number;
  username?: string;
  full_name?: string;
  name?: string;
  email: string;
  avatar?: string;
  phone?: string;
  role?: string;
  roles?: (string | { id?: string | number; name: string })[];
  groups?: (string | { id?: string | number; name: string })[];
  permissions?: (string | { id?: string | number; name?: string; codename?: string })[];
  is_staff?: boolean;
  is_staff_user?: boolean;
  is_superuser?: boolean;
  is_superadmin?: boolean;
  created_at?: string;
  date_joined?: string;
  joinedAt?: string;
}
