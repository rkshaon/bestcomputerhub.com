# Frontend Architecture

This document describes the structural architecture of the Best Computer Hub frontend and defines the intended responsibilities of each application layer.

## 1. Architecture Overview

The frontend is built with:

* Nuxt 4
* Vue 3
* TypeScript
* Tailwind CSS
* Pinia
* VueUse

The backend is a separate Django REST Framework application.

The frontend follows this general dependency flow:

```text
Page
  ↓
Feature / Component
  ↓
Store / Composable
  ↓
Domain Service
  ↓
useApiClient
  ↓
Django REST Framework
```

Not every feature requires every layer. Avoid introducing unnecessary abstractions for simple functionality.

---

## 2. Pages

Directory:

```text
/pages/
```

Pages represent application routes.

Pages are responsible for:

* route parameters
* route-level data fetching
* SSR-sensitive data loading
* SEO integration
* route-level error and 404 handling
* composing features and components

Keep pages reasonably thin.

Large UI sections should be extracted into appropriate feature or reusable components rather than allowing route files to grow indefinitely.

Public storefront pages such as product, category, brand, and content pages must be designed with server rendering and SEO in mind.

### Storefront URL Route Trailing Slash Convention
All public Storefront links, static or dynamic routes, navigation menus, breadcrumbs, and programmatically constructed URL paths must strictly include a **trailing slash `/`** (e.g., `/`, `/product/`, `/product/slug/`, `/product-category/slug/`). No storefront link or route-generating code may intentionally generate URLs lacking a trailing slash. This ensures robust search visibility, prevents canonicalization redirects, and matches legacy WordPress URL patterns.

Admin pages must follow the Admin UI Layout & Information Density Standards (combining breadcrumb, title, and actions on a single row where feasible, and optimizing container padding for high viewport density; see `/docs/agent-context/design-system.md`).

---

## 3. Components

### UI Components

Directory:

```text
/components/ui/
```

Contains generic reusable UI primitives.

Examples:

* buttons
* badges
* cards
* inputs
* dialogs
* pagination controls

UI components should not contain e-commerce business logic or directly integrate with domain APIs unless their responsibility explicitly requires it.

### Layout Components

Directory:

```text
/components/layout/
```

Contains application-wide structural components.

Examples:

* header
* footer
* navigation
* mega menu
* cookie banner
* global drawers

### Commerce Components

Directory:

```text
/components/commerce/
```

Contains reusable storefront/e-commerce presentation components.

Examples:

* product cards
* price displays
* product badges
* cart-related presentation
* wishlist controls

Commerce components may interact with stores or composables for user actions, but business-critical rules remain backend-authoritative.

---

## 4. Features

Directory:

```text
/features/
```

Use feature directories for larger domain-specific functionality that contains multiple related components or supporting code.

Examples:

```text
/features/
├── admin/
├── product/
├── checkout/
└── account/
```

Do not create a feature directory for every small component.

Prefer `/components/` when something is broadly reusable.

Prefer `/features/` when implementation is strongly tied to one application domain or workflow.

---

## 5. Composables and Domain Services

Directory:

```text
/composables/
```

Composable services provide reusable application and domain behavior.

Examples:

```text
useApiClient
useProductService
useCategoryService
useBrandService
useAdminPermissions
useToast
```

Domain services are responsible for operations related to their own domain.
`useAdminPermissions` acts as the centralized permission authorization layer, converting backend user permission matrices (`GET /api/v1/users/me/`) into frontend route gating, sidebar filtering, and action control availability.

For example:

```text
useProductService
    → product operations

useCategoryService
    → category operations

useBrandService
    → brand operations
```

Avoid putting unrelated domain operations into the same service.

Domain services should use `useApiClient` for HTTP communication rather than implementing their own HTTP/authentication infrastructure.

---

## 6. API Client

`useApiClient` is the centralized HTTP communication layer.

Its responsibility is shared transport-level behavior such as:

* API base URL handling
* request execution
* authentication credentials
* shared request/response behavior
* standardized transport errors
* session/token infrastructure

Domain-specific API endpoints and business operations should remain in their respective services.

Do not duplicate authentication or token-refresh infrastructure across domain services.

---

## 7. Stores

Directory:

```text
/stores/
```

Pinia stores manage shared client/application state.

Examples:

* authentication state
* cart state
* wishlist state
* UI state
* cookie/preferences state

Stores should not become replacements for backend business logic.

For commerce-critical information, Django REST Framework remains the authoritative source.

---

## 8. Types

Directory:

```text
/types/
```

Shared TypeScript domain and API contracts belong here.

As the application grows, prefer domain-oriented files:

```text
types/
├── api.ts
├── auth.ts
├── product.ts
├── category.ts
├── brand.ts
├── cart.ts
├── customer.ts
├── order.ts
└── admin.ts
```

Use explicit API response/request types when the backend representation differs from the frontend domain model.

Avoid using `any` to bypass API contract differences.

---

## 9. Utilities

Directory:

```text
/utils/
```

Contains small, reusable, domain-independent helpers.

Examples:

* currency formatting
* class-name merging
* formatting helpers
* pure transformations

Utilities should generally remain stateless and free from API communication.

---

## 10. Architectural Principle

Before creating new code, determine the correct responsibility:

```text
Routing / SSR / SEO
        → Page

Reusable visual primitive
        → components/ui

Shared layout
        → components/layout

Reusable commerce presentation
        → components/commerce

Large domain-specific UI/workflow
        → features

Shared application state
        → store

Domain/API operation
        → domain service/composable

HTTP transport
        → useApiClient

Shared type contract
        → types

Pure helper
        → utils
```

Prefer the simplest layer that correctly owns the responsibility.

Do not introduce new architectural layers unless the project has a concrete need for them.

## 11. Search & Filter Debouncing Principle

All user-input-driven search and filter interactions must be debounced by default (e.g. using `@vueuse/core`'s `refDebounced` with 300ms delay).
- **Separation**: Local input state remains immediately responsive on every keystroke, while the downstream API query state is debounced.
- **Responsibility**: Debounce belongs at the query/composable/component layer (e.g. `useInfinitePagination`, storefront listings, admin tables). The central HTTP client (`useApiClient`) must never own debounce behavior.
- **Exemptions**: Explicit actions (clicking 'Apply Filters', 'Save', pagination buttons, page initial loads, mutations) remain immediate.

## 12. Demand-Driven API Calling Principle

API requests must be driven by actual data requirements, not merely by component or page mounting or anticipated future actions.
- **Check Availability First**: Before making an API request, verify if the data is already available in existing state, props, stores, or services.
- **Defer Auxiliary Workflows**: Fetch auxiliary datasets (such as modal dropdown options or full entity details) only when the corresponding workflow is actively initiated.
- **Paginated Filter Option Infinite Scroll**: All filter option lists across Admin and Storefront with paginated APIs must load options on demand via `useInfinitePagination` / `<UiInfiniteScroll />`. Sequential pages must be loaded on scroll and appended to existing options until `next` is `null`, guarding against duplicate/in-flight requests, preserving loaded option collections across reopening, and debouncing option search inputs (300ms).
- **Prevent Mounting Side-Effects**: Do not call secondary or unrelated APIs in `onMounted()` or top-level setup scripts simply because a component or composable is mounted.

## 13. Centralized API Error Message Handling Principle

API errors across all status codes (`400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`, etc.) are processed centrally through `useApiClient` and the centralized toast error handling architecture (`useToast`'s `handleApiError` / `extractErrorMessage`).
- **Delegated Responsibility**: Feature components and domain services delegate error parsing and toast display to the centralized handler rather than implementing bespoke error parsing logic.
- **Extraction Priority**: The centralized error handler extracts user-facing messages from backend API response payloads (e.g. `detail`, `message`, `error`, `non_field_errors`, or field error arrays).
- **Fallback**: When the backend provides no specific message, the handler falls back to a friendly, generic error message (e.g. "An unexpected error occurred.").
- **User Privacy & Cleanliness**: Raw request URLs, HTTP method names, status strings (such as `[POST] "...": 403 Forbidden`), or technical stack traces are never exposed in user-facing toasts or UI error messages.
 
## 14. Admin List Page-Size & Numbered Pagination Architecture

The Admin page-size selection mechanism operates within the established component, composable, and domain service layers without introducing bespoke abstractions:

```text
Page Layer (/pages/admin/*)
  - Owns `itemsPerPage` state (initialized from `route.query.pageSize` || 10).
  - Synchronizes `pageSize` in URL query parameters when !== 10.
  - Watches `itemsPerPage` and resets `currentPage.value = 1`.
  - Passes `itemsPerPage` to domain service as `page_size`.
  - Passes `:items-per-page="itemsPerPage"` to `<UiPagination />`.
        ↓
Domain Service Layer (/composables/use*Service.ts)
  - Accepts `page_size?: number` in list query parameters.
  - Forwards `page_size` parameter to `useApiClient`.
        ↓
Central HTTP Client (/composables/useApiClient.ts)
  - Attaches `page_size` query parameter to backend request: `GET /api/v1/{resource}/?page=1&page_size=10`.
        ↓
Django REST Framework Backend
  - Returns standard `PaginatedResponse<T>` containing `count`, `page`, `pages`, `results`.
        ↓
Presentation Components (/components/ui/UiPagination.vue)
  - Receives `:items-per-page="itemsPerPage"`, `:total-items="totalCount"`, and `:total-pages="totalPages"`.
  - Renders exact range summary (`Showing 1–10 of 1,572`) and pagination button numbers.
```

### Key Architectural Rules
- **No Duplicate Pagination Logic**: `<UiPagination />` and domain services remain the sole pagination primitives. Individual pages simply supply their active `itemsPerPage` to these existing structures.
- **View Mode Decoupling**: Page size is relevant strictly to discrete numbered pagination (`List / Table` mode). Grid view uses `useInfinitePagination` and `<UiInfiniteScroll />` where items are streamed dynamically.




