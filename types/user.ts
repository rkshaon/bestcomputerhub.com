// File: /types/user.ts

export interface UserGroup {
  id: number;
  name: string;
}

export interface UserItem {
  id: number;
  full_name?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  email: string;
  username: string;
  groups?: (UserGroup | number)[];
  permissions?: string[];
  is_superuser?: boolean;
}

export interface PaginatedUsers {
  count: number;
  next: string | null;
  previous: string | null;
  results: UserItem[];
}

export interface CreateUserPayload {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  email: string;
  username: string;
  password: string;
  confirm_password: string;
  groups: number[];
}

export interface UpdateUserPayload {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  email?: string;
  username?: string;
  password?: string;
  confirm_password?: string;
  groups?: number[];
}
