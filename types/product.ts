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
  short_description?: string;
  price: number;
  current_selling_price?: number;
  originalPrice?: number;
  category: string;
  subCategory?: string;
  brand: string;
  images: string[];
  default_image?: ProductImage | string | null;
  origin?: CategoryOrigin | null;
  categories?: number[] | any[];
  price_histories?: any[];
  average_rating?: number;
  rating: number;
  total_reviews?: number;
  reviewCount: number;
  wishlist?: boolean;
  in_cart?: boolean;
  stock: number;
  specifications: Record<string, any>;
  features: string[];
  isNew?: boolean;
  isFeatured?: boolean;
  onSale?: boolean;
  sku: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProductPayload {
  name: string;
  categories: number[];
  current_selling_price: number;
}

export interface UpdateProductPayload {
  name?: string;
  categories?: number[];
  current_selling_price?: number;
}

export interface ProductFilters {
  page?: number;
  page_size?: number;
  category?: string | number;
  categories?: string | number | (string | number)[];
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
