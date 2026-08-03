// File: /types/customer.ts
import type { User } from './auth';

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
