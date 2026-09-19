// File: /types/banner.ts
import type { PaginatedResponse } from './api';

/**
 * Complete Admin Banner model returned by DRF CRUD endpoints.
 */
export interface Banner {
  id: number;
  placement: number;
  placement_name?: string;
  placement_code?: string;
  title: string;
  subtitle: string;
  image: string;
  mobile_image: string | null;
  cta_text: string;
  cta_url: string;
  display_order: number;
  is_active: boolean;
  start_at: string | null;
  end_at: string | null;
  deleted_at: string | null;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Lightweight Storefront Banner model returned by /api/v1/banners/available/
 */
export interface BannerStorefront {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  mobile_image: string | null;
  cta_text: string;
  cta_url: string;
  display_order: number;
}

/**
 * Placement entity representing banner zones across the application.
 */
export interface BannerPlacement {
  id: number;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Query parameters for filtering banners in the admin panel.
 */
export interface BannerFilters {
  page?: number;
  page_size?: number;
  placement?: number | string;
  placement_code?: string;
  is_active?: boolean | string;
  search?: string;
  ordering?: string;
}

/**
 * Query parameters for fetching available banners on storefront.
 */
export interface StorefrontBannerFilters {
  placement?: number | string;
  placement_code?: string;
}

/**
 * Payload for creating a new Banner (supports FormData multipart upload).
 */
export interface CreateBannerPayload {
  placement: number;
  title: string;
  subtitle?: string;
  image: File | string;
  mobile_image?: File | string | null;
  cta_text?: string;
  cta_url?: string;
  display_order?: number;
  is_active?: boolean;
  start_at?: string | null;
  end_at?: string | null;
}

/**
 * Payload for updating an existing Banner.
 */
export interface UpdateBannerPayload {
  placement?: number;
  title?: string;
  subtitle?: string;
  image?: File | string | null;
  mobile_image?: File | string | null;
  cta_text?: string;
  cta_url?: string;
  display_order?: number;
  is_active?: boolean;
  start_at?: string | null;
  end_at?: string | null;
}

/**
 * Item in Banner Reorder payload.
 */
export interface BannerReorderItem {
  id: number;
  display_order: number;
}

/**
 * Reorder request payload for POST /api/v1/banners/reorder/
 */
export interface BannerReorderRequest {
  placement: number;
  banners: BannerReorderItem[];
}

/**
 * Reorder response for POST /api/v1/banners/reorder/
 */
export interface BannerReorderResponse {
  detail: string;
}

/**
 * Paginated API responses.
 */
export type PaginatedBannersResponse = PaginatedResponse<Banner>;
export type PaginatedPlacementsResponse = PaginatedResponse<BannerPlacement>;
