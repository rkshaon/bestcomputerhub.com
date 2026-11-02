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
| `/api/v1/cart/items/` | GET | Cart | `useCartService` |
| `/api/v1/cart/items/` | POST | Cart | `useCartService` |
| `/api/v1/cart/items/{id}/` | PATCH | Cart | `useCartService` |
| `/api/v1/cart/items/{id}/` | DELETE | Cart | `useCartService` |
| `/api/v1/checkout/validate/` | POST | Checkout | `useCheckoutService` |
| `/api/v1/checkout/confirm/` | POST | Checkout | `useCheckoutService` |
| `/api/v1/orders/{id}/` | GET | Checkout | `useCheckoutService` |
| `/api/v1/shipping/methods/` | GET | Shipping | `useShippingService` |
| `/api/v1/shipping/methods/{id}/` | GET | Shipping | `useShippingService` |
| `/api/v1/shipping/methods/` | POST | Shipping | `useShippingService` |
| `/api/v1/shipping/methods/{id}/` | PATCH | Shipping | `useShippingService` |
| `/api/v1/shipping/methods/{id}/` | PUT | Shipping | `useShippingService` |
| `/api/v1/shipping/methods/{id}/` | DELETE | Shipping | `useShippingService` |
| `/api/v1/shipping/zones/` | GET | Shipping | `useShippingService` |
| `/api/v1/shipping/zones/{id}/` | GET | Shipping | `useShippingService` |
| `/api/v1/shipping/zones/` | POST | Shipping | `useShippingService` |
| `/api/v1/shipping/zones/{id}/` | PATCH | Shipping | `useShippingService` |
| `/api/v1/shipping/zones/{id}/` | PUT | Shipping | `useShippingService` |
| `/api/v1/shipping/zones/{id}/` | DELETE | Shipping | `useShippingService` |
| `/api/v1/shipping/rates/` | GET | Shipping | `useShippingService` |
| `/api/v1/shipping/rates/{id}/` | GET | Shipping | `useShippingService` |
| `/api/v1/shipping/rates/` | POST | Shipping | `useShippingService` |
| `/api/v1/shipping/rates/{id}/` | PATCH | Shipping | `useShippingService` |
| `/api/v1/shipping/rates/{id}/` | PUT | Shipping | `useShippingService` |
| `/api/v1/shipping/rates/{id}/` | DELETE | Shipping | `useShippingService` |
| `/api/v1/shipping/zones/available/` | GET | Shipping | `useShippingService` |
| `/api/v1/shipping/options/` | GET | Shipping | `useShippingService` |

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

### Domain: Cart (`useCartService`)

#### Get Cart Items
- **Endpoint**: `/api/v1/cart/items/`
- **Method**: `GET`
- **Response Structure**: `CartItem[]`
- **Normalization**: Maps backend product representation to frontend `CartItem` model.

#### Add to Cart
- **Endpoint**: `/api/v1/cart/items/`
- **Method**: `POST`
- **Request Body**: `{ product: number, quantity: number }`

#### Update Cart Item
- **Endpoint**: `/api/v1/cart/items/{id}/`
- **Method**: `PATCH`
- **Request Body**: `{ quantity: number }`

#### Remove from Cart
- **Endpoint**: `/api/v1/cart/items/{id}/`
- **Method**: `DELETE`

### Domain: Checkout (`useCheckoutService`)

#### Validate Checkout
- **Endpoint**: `/api/v1/checkout/validate/`
- **Method**: `POST`
- **Request Body**: `CheckoutValidatePayload`
- **Response Structure**: `CheckoutValidateResponse`

#### Confirm Order
- **Endpoint**: `/api/v1/checkout/confirm/`
- **Method**: `POST`
- **Request Body**: `CheckoutConfirmPayload`
- **Headers**: `Idempotency-Key` (required)
- **Response Structure**: `Order`

#### Get Order Details
- **Endpoint**: `/api/v1/orders/{id}/`
- **Method**: `GET`
- **Response Structure**: `Order`
- **Normalization**: Maps `BackendOrderDetail` to frontend `Order` type via `mapOrderDetail`.

### Domain: Shipping (`useShippingService`)

#### List Shipping Methods
- **Endpoint**: `/api/v1/shipping/methods/`
- **Method**: `GET`
- **Request Parameters**: `page` (number), `page_size` (number), `search` (string), `is_active` (boolean)
- **Response Structure**: `PaginatedShippingMethods`

#### Get Shipping Method Details
- **Endpoint**: `/api/v1/shipping/methods/{id}/`
- **Method**: `GET`
- **Response Structure**: `ShippingMethod`

#### Create Shipping Method
- **Endpoint**: `/api/v1/shipping/methods/`
- **Method**: `POST`
- **Request Body**: `CreateShippingMethodPayload`

#### Update Shipping Method
- **Endpoint**: `/api/v1/shipping/methods/{id}/`
- **Method**: `PATCH` / `PUT`
- **Request Body**: `UpdateShippingMethodPayload`

#### Delete Shipping Method
- **Endpoint**: `/api/v1/shipping/methods/{id}/`
- **Method**: `DELETE`

*(Note: Shipping Zones and Rates follow analogous CRUD patterns to Methods; backend verification required for full schema)*

#### Get Available Shipping Zones
- **Endpoint**: `/api/v1/shipping/zones/available/`
- **Method**: `GET`
- **Response Structure**: `AvailableShippingZone[]`

#### Get Shipping Options
- **Endpoint**: `/api/v1/shipping/options/`
- **Method**: `GET`
- **Query Parameters**: `address_id` (number)
- **Response Structure**: `ShippingOptionsResponse`
