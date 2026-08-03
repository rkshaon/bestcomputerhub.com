// File: /types/brand.ts

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string;
  description: string;
  productCount: number;
  is_active?: boolean;
  display_order?: number;
}
