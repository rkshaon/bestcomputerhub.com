# Frontend API Endpoint Reference

This document serves as the authoritative inventory of all API operations for the Best Computer Hub Nuxt 4 frontend.

## 1. API Architecture

- **Client**: Centralized `useApiClient.request()` in `/composables/useApiClient.ts`.
- **Base URL**: Configured via `useRuntimeConfig().public.apiBase`.
- **Conventions**:
  - All endpoints use a trailing slash `/`.
  - Authenticated requests utilize JWT Bearer tokens.
  - Centralized error handling via `useToast`.
  - All filter-driven requests are debounced by 300ms at the component level.

## 2. API Operation Inventory

| Endpoint | Method | Domain | Service |
|---|---|---|---|
| `/api/v1/sales/` | GET | Sales | `useSalesService` |
| `/api/v1/sales/statuses/` | GET | Sales | `useSalesService` |
| `/api/v1/sales/{id}/` | GET | Sales | `useSalesService` |
| `/api/v1/sales/{id}/update-status/` | POST | Sales | `useSalesService` |
| `/api/v1/sales/{id}/mark-paid/` | POST | Sales | `useSalesService` |
| `/api/v1/products/` | GET | Products | `useProductService` |
| `/api/v1/products/{id}/` | GET | Products | `useProductService` |
| `/api/v1/product-images/` | GET | Products | `useProductService` |
| `/api/v1/product-images/summary/` | GET | Products | `useProductService` |
| `/api/v1/products/{id}/product-images/` | GET | Products | `useProductService` |
| `/api/v1/product-images/` | POST | Products | `useProductService` |
| `/api/v1/product-images/bulk-upload/` | POST | Products | `useProductService` |
| `/api/v1/product-images/{id}/` | DELETE | Products | `useProductService` |
| `/api/v1/product-images/{id}/` | PATCH | Products | `useProductService` |
| `/api/v1/product-images/{id}/` | GET | Products | `useProductService` |
| `/api/v1/product-images/{id}/reorder/` | POST | Products | `useProductService` |
| `/api/v1/product-images/{id}/set-default/` | POST | Products | `useProductService` |
| `/api/v1/product-images/{id}/replace-image/` | POST | Products | `useProductService` |
| `/api/v1/products/` | POST | Products | `useProductService` |
| `/api/v1/products/{id}/` | PATCH | Products | `useProductService` |
| `/api/v1/banners/` | GET | Banners | `useBannerService` |
| `/api/v1/banners/{id}/` | GET | Banners | `useBannerService` |
| `/api/v1/banners/` | POST | Banners | `useBannerService` |
| `/api/v1/banners/{id}/` | PATCH | Banners | `useBannerService` |
| `/api/v1/banners/{id}/` | DELETE | Banners | `useBannerService` |
| `/api/v1/banners/reorder/` | POST | Banners | `useBannerService` |
| `/api/v1/banners/available/` | GET | Banners | `useBannerService` |
| `/api/v1/placements/` | GET | Banners | `useBannerService` |
| `/api/v1/placements/{id}/` | GET | Banners | `useBannerService` |
| `/api/v1/placements/` | POST | Banners | `useBannerService` |
| `/api/v1/placements/{id}/` | PATCH | Banners | `useBannerService` |
| `/api/v1/placements/{id}/` | DELETE | Banners | `useBannerService` |
| `/api/v1/blog/posts/` | GET | Blog | `useBlogService` |
| `/api/v1/blog/posts/{id}/` | GET | Blog | `useBlogService` |
| `/api/v1/blog/posts/{id}/categories/` | POST | Blog | `useBlogService` |
| `/api/v1/blog/posts/{blogPostId}/categories/{categoryId}/` | DELETE | Blog | `useBlogService` |
| `/api/v1/blog/posts/{id}/` | PATCH | Blog | `useBlogService` |
| `/api/v1/blog/posts/` | POST | Blog | `useBlogService` |
| `/api/v1/blog/tags/` | GET | Blog | `useBlogService` |
| `/api/v1/blog/tags/` | POST | Blog | `useBlogService` |
| `/api/v1/blog/tags/{id}/` | PATCH | Blog | `useBlogService` |
| `/api/v1/blog/tags/{id}/` | DELETE | Blog | `useBlogService` |
| `/api/v1/blog/posts/{id}/` | DELETE | Blog | `useBlogService` |
| `/api/v1/blog/posts/{id}/unpublish/` | POST | Blog | `useBlogService` |
| `/api/v1/blog/posts/{id}/publish/` | POST | Blog | `useBlogService` |
| `/api/v1/brands/` | GET | Brands | `useBrandService` |
| `/api/v1/brands/category/{categoryId}/` | GET | Brands | `useBrandService` |
| `/api/v1/brands/{id}/` | GET | Brands | `useBrandService` |
| `/api/v1/brands/` | POST | Brands | `useBrandService` |
| `/api/v1/brands/{id}/` | PATCH | Brands | `useBrandService` |
| `/api/v1/brands/{id}/` | DELETE | Brands | `useBrandService` |
| `/api/v1/categories/` | GET | Categories | `useCategoryService` |
| `/api/v1/categories/summary/` | GET | Categories | `useCategoryService` |
| `/api/v1/categories/{id}/` | GET | Categories | `useCategoryService` |
| `/api/v1/categories/` | POST | Categories | `useCategoryService` |
| `/api/v1/categories/{id}/` | PATCH | Categories | `useCategoryService` |
| `/api/v1/categories/{id}/` | DELETE | Categories | `useCategoryService` |
| `/api/v1/categories/{slug}/mark-as-menu/` | POST | Categories | `useCategoryService` |
| `/api/v1/categories/{slug}/remove-from-menu/` | POST | Categories | `useCategoryService` |
| `/api/v1/categories/bulk-menu-update/` | POST | Categories | `useCategoryService` |
| `/api/v1/categories/import-csv/` | POST | Categories | `useCategoryService` |
| `/api/v1/categories/import-json/` | POST | Categories | `useCategoryService` |
| `/api/v1/categories/import-xlsx/` | POST | Categories | `useCategoryService` |
| `/api/v1/categories/roots/` | GET | Categories | `useCategoryService` |

*(This list will be expanded as other services are inspected)*

## 3. Detailed Endpoint Contracts

### Domain: Sales (`useSalesService`)

#### Get Sales List
- **Endpoint**: `/api/v1/sales/`
- **Method**: `GET`
- **Request Parameters**: `page` (number), `page_size` (number), `search` (string)
- **Response Structure**: `PaginatedResponse<Order>`
- **Normalization**: Maps backend order list object to frontend `Order` type via `mapOrderSummary`.

#### Get Order Statuses
- **Endpoint**: `/api/v1/sales/statuses/`
- **Method**: `GET`
- **Response Structure**: `OrderStatusResponse`

#### Get Sale Details
- **Endpoint**: `/api/v1/sales/{id}/`
- **Method**: `GET`
- **Response Structure**: `BackendOrderDetail`
- **Normalization**: Maps backend detail object to frontend `Order` type via `mapOrderDetail`.

#### Update Order Status
- **Endpoint**: `/api/v1/sales/{id}/update-status/`
- **Method**: `POST`
- **Request Body**: `{ status: string }`
- **Response Structure**: `Order`

#### Mark Order as Paid
- **Endpoint**: `/api/v1/sales/{id}/mark-paid/`
- **Method**: `POST`
- **Response Structure**: `Order`
