// File: /types/shipping.ts

export interface ShippingMethod {
  id: number | string;
  name: string;
  code: string;
  description?: string | null;
  is_active?: boolean;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateShippingMethodPayload {
  name: string;
  code: string;
  description?: string;
  is_active?: boolean;
  display_order?: number;
}

export interface UpdateShippingMethodPayload extends Partial<CreateShippingMethodPayload> {}

export interface ShippingMethodQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
}

export interface PaginatedShippingMethods {
  count: number;
  next: string | null;
  previous: string | null;
  results: ShippingMethod[];
}

export interface ShippingZone {
  id: number | string;
  name: string;
  code: string;
  description?: string | null;
  is_default?: boolean;
  is_active?: boolean;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateShippingZonePayload {
  name: string;
  code: string;
  description?: string;
  is_default?: boolean;
  is_active?: boolean;
  display_order?: number;
}

export interface UpdateShippingZonePayload extends Partial<CreateShippingZonePayload> {}

export interface ShippingZoneQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
}

export interface PaginatedShippingZones {
  count: number;
  next: string | null;
  previous: string | null;
  results: ShippingZone[];
}

