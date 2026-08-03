// File: /types/product.ts

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  subCategory: string;
  brand: string;
  images: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  specifications: Record<string, string>;
  features: string[];
  isNew?: boolean;
  isFeatured?: boolean;
  onSale?: boolean;
  sku: string;
}

export interface ProductFilters {
  page?: number;
  page_size?: number;
  category?: string | number;
  query?: string;
  search?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  ordering?: string;
  isFeatured?: boolean;
  isNew?: boolean;
  onSale?: boolean;
}
