// File: /types/customer.ts
import type { User } from './auth';

export type CustomerType = 'WEBSITE' | 'POS' | 'FACEBOOK';

export interface CustomerItem {
  id: number;
  full_name: string | null;
  email: string;
  phone: string | null;
  facebook_profile_url: string | null;
  customer_type: CustomerType;
  created_at: string;
  is_active?: boolean;
}

export interface PaginatedCustomers {
  count: number;
  next: string | null;
  previous: string | null;
  results: CustomerItem[];
}

export interface CustomerQueryParams {
  page?: number;
  page_size?: number;
  customer_type?: CustomerType | '';
  is_active?: boolean | string;
  search?: string;
}

export interface Customer extends User {
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  status: 'active' | 'inactive' | 'blocked';
}

export interface CustomerProfileEntity {
  id: string;
  user_id: string;
  totalOrders: number;
  totalSpent: number;
  status: 'active' | 'inactive' | 'blocked';
}

