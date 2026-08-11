// File: /types/brand.ts

export interface Brand {
  id: string | number;
  name: string;
  slug: string;
  logo: string;
  description: string;
  productCount?: number;
  is_active?: boolean;
  display_order?: number;
}

export interface CreateBrandPayload {
  name: string;
  logo?: File | null;
  slug?: string;
  description?: string;
  display_order?: number;
}

export interface UpdateBrandPayload {
  name: string;
  slug?: string;
  description?: string;
  display_order?: number;
  logo?: File | null;
}

