// File: /types/category.ts
import type { PaginatedResponse } from './api';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  description?: string;
  parentCategoryId?: string;
  subCategories?: string[];
  order?: number;
  children?: Category[];
  has_children?: boolean;
}

export interface RootCategory {
  id: string | number;
  slug: string;
  name: string;
  has_children: boolean;
}

export interface CategoryFilters {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  parent?: string;
  is_parent?: boolean;
}

export type PaginatedCategoriesResponse = PaginatedResponse<Category>;

export interface CategoryImportResponse {
  success: boolean;
  created: number;
  errors: string[];
}
