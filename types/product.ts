// File: /types/product.ts

export interface ProductImage {
  id?: string | number;
  image?: string;
  alt_text?: string;
  is_default?: boolean;
}

export interface CategoryOrigin {
  id?: string | number;
  slug?: string;
  name?: string;
  parent?: any;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  current_selling_price?: number;
  originalPrice?: number;
  category: string;
  subCategory?: string;
  brand: string;
  images: string[];
  default_image?: ProductImage | string | null;
  origin?: CategoryOrigin | null;
  average_rating?: number;
  rating: number;
  total_reviews?: number;
  reviewCount: number;
  wishlist?: boolean;
  in_cart?: boolean;
  stock: number;
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
