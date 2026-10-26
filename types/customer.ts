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

export type AddressType = 'BILLING' | 'SHIPPING' | string;

export interface CustomerAddress {
  id: number;
  address_type: AddressType;
  first_name: string;
  last_name: string;
  phone?: string | null;
  city: string;
  state?: string | null;
  country: string;
  created_at?: string;
  company?: string | null;
  address_1?: string | null;
  address_2?: string | null;
  postcode?: string | null;
  /** Delivery area (ShippingZone id) chosen for this address; null for legacy rows. */
  shipping_zone?: number | null;
  shipping_zone_name?: string | null;
  shipping_zone_code?: string | null;
}

export interface PaginatedCustomerAddresses {
  count: number;
  next: string | null;
  previous: string | null;
  results: CustomerAddress[];
}

export interface CustomerAddressQueryParams {
  page?: number;
  page_size?: number;
}

export interface CreateCustomerAddressPayload {
  address_type: string;
  first_name: string;
  last_name: string;
  company?: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
  /** Active ShippingZone id; only accepted when the zone is active. */
  shipping_zone?: number | null;
}

/** PATCH /api/v1/customer-addresses/{id}/ accepts any subset of the create payload. */
export type UpdateCustomerAddressPayload = Partial<CreateCustomerAddressPayload>;
