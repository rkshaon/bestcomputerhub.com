# Frontend Route Reference

This document serves as the authoritative inventory for all routes in the Best Computer Hub Nuxt 4 application.

---

## 1. Routing Overview

Routes are categorized by domain. All public Storefront routes strictly adhere to the **trailing slash `/`** convention (e.g., `/product/slug/`). 

For architectural principles, dependency hierarchy, and global e-commerce domain definitions, consult:
- `/docs/agent-context/architecture.md`
- `/docs/agent-context/ecommerce-domain.md`
- `/docs/agent-context/seo-strategy.md`

---

## 2. Route Inventory

*Total registered routes: 73 (based on `.vue` file enumeration in `/pages/`).*

### 2.1 Storefront Routes
| Route | Component Path | Layout | Middleware | Auth | Permission |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | `/pages/index.vue` | default | - | Public | None |
| `/shop-now/` | `/pages/shop-now.vue` | default | - | Public | None |
| `/blog/` | `/pages/blog/index.vue` | default | - | Public | None |
| `/blog/[slug]/` | `/pages/blog/[slug].vue` | default | - | Public | None |
| `/product/[slug]/` | `/pages/product/[slug].vue` | default | - | Public | None |
| `/cart/` | `/pages/cart.vue` | default | - | Public | None |

### 2.2 Customer & Authentication Routes
| Route | Component Path | Layout | Middleware | Auth | Permission |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/login/` | `/pages/login.vue` | default | - | Public | None |
| `/signup/` | `/pages/signup.vue` | default | - | Public | None |
| `/checkout/` | `/pages/checkout.vue` | default | auth | Required | None |
| `/my-account/` | `/pages/my-account.vue` | default | auth | Required | None |

### 2.3 Administration Routes
All admin routes are guarded by `middleware/auth.global.ts`, requiring `authStore.isLoggedIn` AND `authStore.isAdmin`. Permissions are verified against `ADMIN_MODULES` via `useAdminPermissions()`.

| Route | Component Path | Layout | Auth | Permission Codename |
| :--- | :--- | :--- | :--- | :--- |
| `/admin/` | `/pages/admin/index.vue` | admin | Required | `dashboard.view_dashboard` |
| `/admin/products/`| `/pages/admin/products/index.vue` | admin | Required | `product_api.view_product`|
| `/admin/orders/` | `/pages/admin/orders/index.vue` | admin | Required | `sale_api.view_sale` |
| `/admin/forbidden/`| `/pages/admin/forbidden.vue` | admin | Required | None |

---

## 3. Administrative Access Control

Administrative access is managed in `/composables/useAdminPermissions.ts` using the `ADMIN_MODULES` registry and the `useAdminPermissions()` composable.

### 3.1 Admin Module Inventory

| Module Key | Route | View Permissions |
| :--- | :--- | :--- |
| `dashboard` | `/admin` | `dashboard.view_dashboard`, `view_dashboard`, ... |
| `products` | `/admin/products` | `store.view_product`, `product_api.view_product`, ... |
| `orders` | `/admin/orders` | `sale_api.view_sale`, `store.view_order`, ... |
| `customers` | `/admin/customers` | `store.view_customer`, `customer_api.view_customerprofile` |
| `orderNotifications`| `/admin/order-notifications`| `email_api.view_ordernotificationrecipient` |
| `...` | `...` | *(See `useAdminPermissions.ts` for all 21 modules)* |

### 3.2 Permission Evaluation Rules
- **Authorization Model**: Triple-gated (Authenticated user AND Staff/Owner type AND specific permission).
- **OR Logic**: `hasPermission()` uses `Array.prototype.some()`.
- **Superadmin Bypass**: Users with `is_superuser`, `is_superadmin`, or `OWNER` role bypass all permission checks.
- **Route Matching**: `findModule()` uses `startsWith` with boundary enforcement (e.g., `/admin/orders/123` matches `/admin/orders`).
- **Null Permission Behavior**: `canViewModule()` returns `true` if a module is mapped but `viewPermission` is `null` (e.g., `profile`).

---

## 4. API References
*Note: Route-to-API relationships are currently unmapped. See `/docs/api/endpoints.md` (Placeholder).*
