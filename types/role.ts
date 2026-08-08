// File: /types/role.ts

export interface Permission {
  id: number;
  codename: string;
  name: string;
}

export interface PaginatedPermissions {
  count: number;
  next: string | null;
  previous: string | null;
  results: Permission[];
}

export interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}

export interface PaginatedRoles {
  count: number;
  next: string | null;
  previous: string | null;
  results: Role[];
}

export interface CreateRolePayload {
  name: string;
  permission_ids: number[];
  permissions?: number[];
}

export interface UpdateRolePayload {
  name?: string;
  permission_ids?: number[];
  permissions?: number[];
}
