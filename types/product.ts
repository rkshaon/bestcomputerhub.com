// File: /types/product.ts

export interface ProductImage {
  id?: string | number;
  image?: string;
  alt_text?: string;
  is_default?: boolean;
  display_order?: number;
  created_at?: string;
}

export interface CategoryOrigin {
  id?: string | number;
  slug?: string;
  name?: string;
  parent?: any;
}

export interface ProductCategoryRef {
  id: number | string;
  name: string;
  slug: string;
}

export interface ProductOriginRef {
  id: number | string;
  slug: string;
  name: string;
  parent?: string | null;
}

export interface ProductPriceHistoryItem {
  price: string | number;
  changed_at: string;
  changed_by?: string | number | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  legacy_id?: number | string | null;
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
  origin?: ProductOriginRef | CategoryOrigin | null;
  categories?: (ProductCategoryRef | number | any)[];
  price_histories?: ProductPriceHistoryItem[];
  average_rating?: number;
  rating: number;
  total_reviews?: number;
  reviewCount: number;
  wishlist?: boolean;
  in_cart?: boolean;
  is_active?: boolean;
  stock: number;
  specifications: string | Record<string, any>;
  features: string[];
  isNew?: boolean;
  isFeatured?: boolean;
  onSale?: boolean;
  sku: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  created_by?: number | string | null;
  updated_by?: number | string | null;
}

export interface CreateProductPayload {
  name: string;
  categories: number[];
  current_selling_price: number;
  description?: string;
  short_description?: string;
  specifications?: string | Record<string, any>;
}

export interface UpdateProductPayload {
  name?: string;
  categories?: number[];
  current_selling_price?: number;
  description?: string;
  short_description?: string;
  specifications?: string | Record<string, any>;
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

export interface BulkUploadProductImageItem {
  image: File;
  alt_text?: string;
  display_order?: number;
  is_default?: boolean;
}

export interface BulkUploadProductImagesPayload {
  product: string | number;
  images: BulkUploadProductImageItem[];
}

