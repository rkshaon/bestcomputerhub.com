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
| `/api/v1/customer-addresses/` | GET | Customers | `useCustomerAddressService` |
| `/api/v1/customer-addresses/` | POST | Customers | `useCustomerAddressService` |
| `/api/v1/customer-addresses/{id}/` | PATCH | Customers | `useCustomerAddressService` |
| `/api/v1/customers/` | GET | Customers | `useCustomerService` |
| `/api/v1/orders/` | GET | Orders | `useOrderService` |
| `/api/v1/orders/{id}/` | GET | Orders | `useOrderService` |
| `/api/v1/orders/{id}/cancel/` | POST | Orders | `useOrderService` |
| `/api/v1/email/order-notification-recipients/` | GET | Notifications | `useOrderNotificationService` |
| `/api/v1/email/order-notification-recipients/` | POST | Notifications | `useOrderNotificationService` |
| `/api/v1/email/order-notification-recipients/{id}/` | PATCH | Notifications | `useOrderNotificationService` |
| `/api/v1/email/order-notification-recipients/{id}/` | DELETE | Notifications | `useOrderNotificationService` |
| `/api/v1/auth/email-verification/status/` | GET | Auth | `useEmailVerification` |
| `/api/v1/auth/email-verification/request/` | POST | Auth | `useEmailVerification` |
| `/api/v1/permissions/` | GET | Permissions | `usePermissionService` |
| `/api/v1/roles/` | GET | Roles | `useRoleService` |
| `/api/v1/roles/` | POST | Roles | `useRoleService` |
| `/api/v1/roles/{id}/` | PATCH | Roles | `useRoleService` |
| `/api/v1/roles/{id}/` | DELETE | Roles | `useRoleService` |
| `/api/v1/roles/{id}/` | GET | Roles | `useRoleService` |
| `/api/v1/users/` | GET | Users | `useUserService` |
| `/api/v1/users/{id}/` | GET | Users | `useUserService` |
| `/api/v1/users/` | POST | Users | `useUserService` |
| `/api/v1/users/{id}/` | PATCH | Users | `useUserService` |
| `/api/v1/users/{id}/` | DELETE | Users | `useUserService` |
| `/api/v1/users/{id}/assign-role/` | POST | Users | `useUserService` |
| `/api/v1/users/{id}/remove-role/` | POST | Users | `useUserService` |
| `/api/v1/users/me/change-password/` | PATCH | Users | `useUserService` |
| `/api/v1/users/me/` | PATCH | Users | `useUserService` |
| `/api/v1/users/{id}/change-password/` | POST | Users | `useUserService` |
| `/api/v1/users/{id}/change-username/` | POST | Users | `useUserService` |
| `/api/v1/users/{id}/change-email/` | POST | Users | `useUserService` |
| `/api/v1/auth/login/` | POST | Auth | `useApiClient` |
| `/api/v1/auth/refresh/` | POST | Auth | `useApiClient` |
| `/api/v1/auth/register/` | POST | Auth | `useApiClient` |
| `/api/v1/auth/logout/` | POST | Auth | `useApiClient` |
| `/api/v1/auth/password-reset/request/` | POST | Auth | `useApiClient` |
| `/api/v1/auth/password-reset/confirm/` | POST | Auth | `useApiClient` |

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

### Domain: Customers (`useCustomerAddressService`, `useCustomerService`)

#### List Customer Addresses
- **Endpoint**: `/api/v1/customer-addresses/`
- **Method**: `GET`
- **Request Parameters**: `page`, `page_size`
- **Response Structure**: `PaginatedCustomerAddresses`

#### Create Customer Address
- **Endpoint**: `/api/v1/customer-addresses/`
- **Method**: `POST`
- **Request Body**: `CreateCustomerAddressPayload`

#### Update Customer Address
- **Endpoint**: `/api/v1/customer-addresses/{id}/`
- **Method**: `PATCH`
- **Request Body**: `UpdateCustomerAddressPayload`

#### List Customers
- **Endpoint**: `/api/v1/customers/`
- **Method**: `GET`
- **Request Parameters**: `page`, `page_size`, `customer_type`, `is_active`, `search`
- **Response Structure**: `PaginatedCustomers`

### Domain: Orders (`useOrderService`)

#### Get Orders List (Customer)
- **Endpoint**: `/api/v1/orders/`
- **Method**: `GET`
- **Response Structure**: `BackendOrderSummary[]` (backend may return wrapped `results` array)
- **Normalization**: Maps to `Order` list via `mapOrderSummary`.

#### Get Order Details (Customer)
- **Endpoint**: `/api/v1/orders/{id}/`
- **Method**: `GET`
- **Response Structure**: `BackendOrderDetail`
- **Normalization**: Maps to `Order` type via `mapOrderDetail`.

#### Cancel Order
- **Endpoint**: `/api/v1/orders/{id}/cancel/`
- **Method**: `POST`
- **Response Structure**: `BackendOrderCancelResponse`

### Domain: Notifications (`useOrderNotificationService`)

#### List Order Notification Recipients
- **Endpoint**: `/api/v1/email/order-notification-recipients/`
- **Method**: `GET`
- **Request Parameters**: `page`, `page_size`, `search`, `is_active`
- **Response Structure**: `PaginatedOrderNotificationRecipients`

#### Create Recipient
- **Endpoint**: `/api/v1/email/order-notification-recipients/`
- **Method**: `POST`
- **Request Body**: `CreateOrderNotificationRecipientPayload`

#### Update Recipient
- **Endpoint**: `/api/v1/email/order-notification-recipients/{id}/`
- **Method**: `PATCH`
- **Request Body**: `UpdateOrderNotificationRecipientPayload`

#### Delete Recipient
- **Endpoint**: `/api/v1/email/order-notification-recipients/{id}/`
- **Method**: `DELETE`

### Domain: Auth (`useEmailVerification`, `useApiClient`)

#### Get Email Verification Status
- **Endpoint**: `/api/v1/auth/email-verification/status/`
- **Method**: `GET`
- **Response Structure**: `{ email: string, email_verified: boolean }`

#### Request Email Verification
- **Endpoint**: `/api/v1/auth/email-verification/request/`
- **Method**: `POST`

#### Auth: Login, Refresh, Register, Logout, Password Reset
*(Handled centrally in `useApiClient`; backend verification required for full schema)*

### Domain: Permissions (`usePermissionService`)

#### List Permissions
- **Endpoint**: `/api/v1/permissions/`
- **Method**: `GET`
- **Response Structure**: `PaginatedPermissions` | `Permission[]`

### Domain: Roles (`useRoleService`)

#### List Roles
- **Endpoint**: `/api/v1/roles/`
- **Method**: `GET`
- **Response Structure**: `PaginatedRoles`

#### Create Role
- **Endpoint**: `/api/v1/roles/`
- **Method**: `POST`
- **Request Body**: `CreateRolePayload`

#### Update Role
- **Endpoint**: `/api/v1/roles/{id}/`
- **Method**: `PATCH`
- **Request Body**: `UpdateRolePayload`

#### Delete Role
- **Endpoint**: `/api/v1/roles/{id}/`
- **Method**: `DELETE`

### Domain: Users (`useUserService`)

#### List Users
- **Endpoint**: `/api/v1/users/`
- **Method**: `GET`
- **Request Parameters**: `page`, `page_size`, `search`
- **Response Structure**: `PaginatedUsers`

#### Create/Update/Delete/Change Operations
- **Endpoints**: `/api/v1/users/`, `/api/v1/users/{id}/`, `/api/v1/users/{id}/assign-role/`, `/api/v1/users/{id}/remove-role/`, `/api/v1/users/me/change-password/`, `/api/v1/users/me/`, `/api/v1/users/{id}/change-password/`, `/api/v1/users/{id}/change-username/`, `/api/v1/users/{id}/change-email/`
- **Methods**: `POST`, `PATCH`
- **Note**: Administrative user management and self-service profile updates.
