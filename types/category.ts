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
  show_in_menu?: boolean;
  is_menu?: boolean;
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
  is_menu?: boolean;
  menu?: string;
}

export interface CategorySummaryResponse {
  total_categories: number;
  root_categories: number;
  sub_categories: number;
  menu_categories?: number;
  sub_menu_categories?: number;
}

export type PaginatedCategoriesResponse = PaginatedResponse<Category>;

export interface CategoryImportResponse {
  success: boolean;
  created: number;
  errors: string[];
}
