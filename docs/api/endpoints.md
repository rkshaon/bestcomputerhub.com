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
