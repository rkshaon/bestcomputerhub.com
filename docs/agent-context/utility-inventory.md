# Frontend Utility & Helper Function Inventory

This document provides a verified inventory of reusable utility functions, helpers, composables, and service boundaries across the Best Computer Hub application codebase.

---

## Important Boundary & Architectural Distinctions

When selecting or implementing helper functions, agents must respect these structural boundaries established in the codebase:

1. **Pure Utilities vs. Reactive Composables**:
   - Pure utilities (`cn`, `formatCurrency`, `decodeHtmlEntities`) are stateless, side-effect-free functions that accept inputs and return calculated outputs synchronously.
   - Composables (`useApiClient`, `useToast`, `useAdminPermissions`, `useInfinitePagination`, `useAdminModalState`) manage Vue reactive state (`ref`, `computed`), lifecycle hooks (`onMounted`, `onBeforeUnmount`), or browser cookies/storage.

2. **HTML Entity Decoding vs. Content Sanitization**:
   - `decodeHtmlEntities` in `/utils/index.ts` is purely a text decoder that converts character entity references (e.g., `&amp;` -> `&`, `&#039;` -> `'`) into plain text for clean UI display.
   - It **does not** sanitize executable HTML scripts, strip unsafe tags, or enforce Content Security Policies. Rich text HTML rendering or policy scanning is handled separately by `<UiRichTextEditor>` and `useContentSecurityService`.

3. **Display Formatting vs. API Payload Transformation**:
   - `formatCurrency` in `/utils/index.ts` formats numbers for UI presentation (e.g., `Tk 1,500`).
   - It **must never** be sent to backend API payloads, which require unformatted numbers (`1500` or `1500.00`).

4. **Authentication Checks vs. Action Permission Checks**:
   - `authStore.isLoggedIn` checks if an active session or valid access/refresh token exists.
   - `authStore.isAdmin` evaluates top-level role flags (`OWNER`, `STAFF`, `is_superuser`, `is_superadmin`).
   - `useAdminPermissions().hasPermission()` / `canViewModule()` performs action-specific, non-transitive RBAC authorization against the user permission set from `GET /api/v1/users/me/`.

5. **API Domain Services vs. Pagination Helpers**:
   - Domain services (`useProductService`, `useCategoryService`, `useBrandService`) own endpoint URLs, request payload mapping, trailing slash enforcement (`/`), and domain logic.
   - `useInfinitePagination` orchestrates reactive page iteration, search debouncing (`refDebounced`), and item deduplication without hardcoding domain endpoint signatures.

---

## 1. Core Pure & Formatting Utilities

### `cn`
- **File Location**: `/utils/index.ts`
- **Category**: Pure utility
- **Scope**: Shared
- **Purpose**: Combines and merges Tailwind CSS classes dynamically, resolving class conflicts via `tailwind-merge` and conditional class objects via `clsx`.
- **Parameters & Return Value**:
  - `...inputs: ClassValue[]` — Variable list of class strings, objects, or arrays.
  - Returns `string` — Merged, conflict-free Tailwind CSS class string.
- **Example Usage**:
  ```ts
  const classes = cn('px-4 py-2 bg-primary', isSelected && 'bg-primary/80', className);
  ```
- **Files or Features Currently Using It**: Almost all UI components (`/components/ui/*`), layouts, storefront sections, and admin views.
- **Side Effects**: None (Pure function).
- **Accesses Browser State**: No.
- **Performs Network Work**: No.
- **Related Utilities**: None.
- **What It Explicitly Does Not Do**: Does not validate CSS syntax or apply inline styles.
- **Reusability Level**: High.
- **Edge Cases & Behavior**: Correctly handles undefined, null, boolean conditions, and array class inputs. Preserves order while overriding conflicting Tailwind utility utilities (e.g. `p-4` over `p-2`).

---

### `formatCurrency`
- **File Location**: `/utils/index.ts`
- **Category**: Formatter
- **Scope**: Shared (Storefront & Admin)
- **Purpose**: Formats numeric monetary values into standard Bangladeshi Taka currency display strings (`Tk X,XXX`).
- **Parameters & Return Value**:
  - `value: number` — Numeric price or total value.
  - Returns `string` — Formatted currency string with `Tk ` prefix and integer rounding.
- **Example Usage**:
  ```ts
  const formattedPrice = formatCurrency(12500.50); // "Tk 12,501"
  ```
- **Files or Features Currently Using It**: `<CommerceProductCard>`, `<CartDrawer>`, `<RecentOrdersTable>`, product detail pages, checkout summary, invoice listings, admin order tables.
- **Side Effects**: None (Pure function).
- **Accesses Browser State**: No.
- **Performs Network Work**: No.
- **Related Utilities**: None.
- **What It Explicitly Does Not Do**: Does not convert currency rates, format decimals (rounds to nearest integer), or format backend API numeric request payloads.
- **Reusability Level**: High.
- **Edge Cases & Behavior**:
  - If `value` is non-numeric, `NaN`, `null`, or `undefined`, returns `'Tk 0'`.
  - Uses `Math.round(value)` and `toLocaleString('en-US')` with 0 fraction digits.

---

### `decodeHtmlEntities`
- **File Location**: `/utils/index.ts`
- **Category**: Normalizer / HTML utility
- **Scope**: Shared
- **Purpose**: Safely decodes HTML character entities (named entities like `&amp;`, `&lt;`, `&quot;`, `&trade;` and numeric/hex entities like `&#39;`, `&#x27;`) in plain-text strings or object name properties.
- **Parameters & Return Value**:
  - `value: string | { name?: string } | any` — Input string or object containing a `name` string property.
  - Returns `string` — Plain text string with decoded characters.
- **Example Usage**:
  ```ts
  const title = decodeHtmlEntities('Laptops &amp; Accessories'); // "Laptops & Accessories"
  ```
- **Files or Features Currently Using It**: `<UiBreadcrumbs>`, `<CommerceProductCard>`, `<HeaderMegaMenu>`, product/category title headers, category tree nodes.
- **Side Effects**: None (Pure function).
- **Accesses Browser State**: No.
- **Performs Network Work**: No.
- **Related Utilities**: None.
- **What It Explicitly Does Not Do**: Does not sanitize script tags, remove HTML tags, or perform DOM parsing.
- **Reusability Level**: High.
- **Edge Cases & Behavior**:
  - Safely handles `null`, `undefined`, empty values, and non-string types (returns `''`).
  - If given an object, extracts `value.name`.
  - Performs regex replacement against a map of standard HTML entities and code-point decimal/hex conversions.

---

### `isNonSquareAspect` & `isExceedingResolution`
- **File Location**: `/utils/imageValidation.ts`
- **Category**: Pure utility
- **Scope**: Shared image workflows (Admin Product Images, Admin Product Details, upload modals, storefront image pickers)
- **Purpose**: Validates image aspect ratios (identifying non-1:1 images) and detects whether image dimensions exceed maximum resolution thresholds (default 500px).
- **Parameters & Return Values**:
  - `isNonSquareAspect(width?: number | null, height?: number | null): boolean` — Returns `true` if width and height are valid positive numbers and `width !== height`.
  - `isExceedingResolution(width?: number | null, height?: number | null, maxDimension: number = 500): boolean` — Returns `true` if either valid positive `width` or `height` exceeds `maxDimension`.
- **Example Usage**:
  ```ts
  import { isNonSquareAspect, isExceedingResolution } from '@/utils/imageValidation';

  const isInvalidRatio = isNonSquareAspect(600, 400); // true
  const isTooLarge = isExceedingResolution(600, 400, 500); // true
  ```
- **Files or Features Currently Using It**: `/pages/admin/product-images/index.vue` (Admin Product Images registry list and grid views).
- **Side Effects**: None (Pure functions).
- **Accesses Browser State**: No.
- **Performs Network Work**: No.
- **Related Utilities**: None.
- **What It Explicitly Does Not Do**: Does not load images, extract file metadata, issue network requests, or handle Vue reactive state (metadata fetching and reactive state belong in page/component orchestrators).
- **Reusability Level**: High.
- **Edge Cases & Behavior**:
  - Safely handles `undefined`, `null`, `NaN`, zero, and negative dimension values by returning `false`.
  - Only returns `true` when both dimensions are strictly positive numbers (`> 0`).

---

## 2. Central HTTP Transport & Network Helpers

### `useApiClient`
- **File Location**: `/composables/useApiClient.ts`
- **Category**: API/service helper
- **Scope**: Shared
- **Purpose**: Provides the central HTTP client instance wrapping Nuxt's `$fetch`. Handles relative URL construction with `apiBase`, dynamic `Bearer` access token injection, automatic 401 token refresh interceptors with single-promise deduplication, session invalidation redirects, and mock mode simulation.
- **Parameters & Return Value**:
  - Composable hook returning object:
    - `request<T>(url: string, options?: FetchOptions): Promise<T>` — Generic request execution helper.
    - `isLoading: Ref<boolean>` — Reactive request pending state.
    - `errorMsg: Ref<string | null>` — Reactive error message state.
    - `isSuccess: Ref<boolean>` — Reactive request completion flag.
    - `getLoginRedirectUrl()` — Resolves return URL for post-login navigation.
- **Example Usage**:
  ```ts
  const apiClient = useApiClient();
  const data = await apiClient.request<PaginatedResponse<Product>>('/api/v1/products/', { method: 'GET' });
  ```
- **Files or Features Currently Using It**: All domain service composables (`useProductService`, `useCategoryService`, `useBrandService`, `useBlogService`, `useUserService`, `useRoleService`, `usePermissionService`, `useRequestLogService`, `useContentSecurityService`, `useAuthStore`).
- **Side Effects**: Modifies cookies (`access_token`, `refresh_token`, `auth_user`), triggers router navigation on 401 unrecoverable session expiry, displays error toasts on failed token negotiation.
- **Accesses Browser State**: Reads/writes cookies via `useCookie`, inspects `window.location.search` and `localStorage` for mock mode flags.
- **Performs Network Work**: Yes (`$fetch`).
- **Related Utilities**: `extractErrorMessage`, `toastError`, `useAuthStore`.
- **What It Explicitly Does Not Do**: Does not own search/filter debouncing (debouncing belongs in composables/components), does not format domain-specific request/response models.
- **Reusability Level**: High (Mandatory central HTTP transport).
- **Edge Cases & Behavior**:
  - Automatically appends `Bearer ` prefix if missing.
  - Prevents recursive refresh loops when `/api/v1/auth/refresh/` fails.
  - Shares a single `refreshPromise` across concurrent 401 failures to prevent redundant refresh network calls.

---

### `create_user` & `create_customer_profile`
- **File Location**: `/composables/useApiClient.ts`
- **Category**: Other (Mock/Demo entity generator)
- **Scope**: Shared / Mock system
- **Purpose**: Atomic helper functions to instantiate and persist mock user entities and linked customer profile records in `localStorage` when running in isolated mock mode.
- **Parameters & Return Value**:
  - `create_user(data: { full_name: string; email: string; phone?: string; role?: 'customer' | 'admin' | 'staff' }): UserEntity`
  - `create_customer_profile(userEntity: UserEntity): CustomerProfileEntity`
- **Example Usage**:
  ```ts
  const user = create_user({ full_name: 'John Doe', email: 'john@example.com' });
  const profile = create_customer_profile(user);
  ```
- **Files or Features Currently Using It**: Mock authentication and checkout simulation handlers.
- **Side Effects**: Writes to `localStorage` (`techcore_mock_users2`, `techcore_mock_customers2`).
- **Accesses Browser State**: Yes (`localStorage`).
- **Performs Network Work**: No.
- **Related Utilities**: `useApiClient`.
- **What It Explicitly Does Not Do**: Does not interact with Django REST Framework backend endpoints.
- **Reusability Level**: Low (Isolated mock system use).

---

## 3. Notification & Error Processing Helpers

### `extractErrorMessage`
- **File Location**: `/composables/useToast.ts`
- **Category**: Normalizer / Validator
- **Scope**: Shared
- **Purpose**: Intelligently inspects API error objects, response payloads (`detail`, `message`, `error`, `non_field_errors`, field error maps), and status codes to extract clean, user-friendly error strings. Masks HTTP 500 server errors and filters out raw `FetchError` strings or request URLs.
- **Parameters & Return Value**:
  - `err: any` — Caught error object or response payload.
  - `fallbackMessage = 'An unexpected error occurred.'` — Default message string if no specific message is found.
  - Returns `string` — Safe, human-readable error string.
- **Example Usage**:
  ```ts
  try {
    await productService.createProduct(payload);
  } catch (err) {
    const message = extractErrorMessage(err, 'Failed to save product.');
  }
  ```
- **Files or Features Currently Using It**: `handleApiError`, `useApiClient`, `useProductService`, `useCategoryService`, `useBrandService`, `useBlogService`, `useUserService`, `useRoleService`, `usePermissionService`, `useRequestLogService`, `useContentSecurityService`.
- **Side Effects**: None.
- **Accesses Browser State**: No.
- **Performs Network Work**: No.
- **Related Utilities**: `handleApiError`, `toastError`.
- **What It Explicitly Does Not Do**: Does not trigger toast notifications directly (returns the parsed message string).
- **Reusability Level**: High.
- **Edge Cases & Behavior**:
  - Returns `'An unexpected server error occurred. Please try again.'` for status >= 500.
  - Returns `'You do not have permission to perform this action.'` for status 403 when no payload message exists.
  - Formats field error maps (e.g. `{ email: ["Already exists"] }` -> `"email: Already exists"`).
  - Rejects strings starting with `[GET]`, `[POST]`, `FetchError:`, or HTTP/HTTPS URLs.

---

### `handleApiError`
- **File Location**: `/composables/useToast.ts`
- **Category**: API/service helper
- **Scope**: Shared
- **Purpose**: Combines error message extraction via `extractErrorMessage` and automatic toast notification display via `toastError` in a single helper function.
- **Parameters & Return Value**:
  - `err: any` — Caught error object or response payload.
  - `fallbackMessage = 'An unexpected error occurred.'` — Default message string.
  - Returns `string` — Displayed error message.
- **Example Usage**:
  ```ts
  try {
    await categoryApi.saveCategory(data);
  } catch (err) {
    handleApiError(err, 'Could not save category.');
  }
  ```
- **Files or Features Currently Using It**: Admin CRUD page action handlers, form submission handlers across storefront and admin views.
- **Side Effects**: Triggers error toast notification (`vue-sonner`).
- **Accesses Browser State**: Yes (DOM toast rendering).
- **Performs Network Work**: No.
- **Related Utilities**: `extractErrorMessage`, `toastError`.
- **What It Explicitly Does Not Do**: Does not re-throw the error (returns message string).
- **Reusability Level**: High.

---

### `toastSuccess`, `toastError`, `toastInfo`, `toastWarning`, `useToast`
- **File Location**: `/composables/useToast.ts`
- **Category**: Browser/runtime helper
- **Scope**: Shared
- **Purpose**: Direct global toast notification helpers wrapping `vue-sonner`.
- **Parameters & Return Value**:
  - `(message: string, options?: ToastOptions)` — Display toast message with optional configuration.
  - `useToast()` returns object with all notification functions.
- **Example Usage**:
  ```ts
  toastSuccess('Product created successfully.');
  ```
- **Files or Features Currently Using It**: Forms, auth workflows, shopping cart actions, admin CRUD actions, global route guards.
- **Side Effects**: Renders toast notification on screen.
- **Accesses Browser State**: Yes (DOM).
- **Performs Network Work**: No.
- **Reusability Level**: High.

---

## 4. Pagination, Search & Data Streaming Helpers

### `useInfinitePagination`
- **File Location**: `/composables/useInfinitePagination.ts`
- **Category**: Composable / Route/query helper
- **Scope**: Shared (Storefront & Admin)
- **Purpose**: Reusable stateful composable orchestrating paginated data loading, debounced search (`refDebounced` 300ms), item deduplication via custom key extractor, page-by-page fetching, and infinite-scroll sentinel integration.
- **Parameters & Return Value**:
  - `options: UseInfinitePaginationOptions<T>` — Configuration object:
    - `fetcher: (params) => Promise<PaginatedResponse<T>>` — Page fetcher function.
    - `search?: MaybeRef<string>` — Reactive search input ref.
    - `extraParams?: MaybeRef<Record<string, any>>` — Reactive extra filters.
    - `pageSize?: number` — Page size (defaults to 10).
    - `dedupeKey?: (item: T) => string | number` — Deduplication key extractor.
    - `autoFetch?: boolean` — Whether to fetch page 1 automatically (defaults to `true`).
    - `debounceMs?: number` — Search debounce delay (defaults to 300ms).
  - Returns reactive object:
    - `items: Ref<T[]>` — Accumulated items list.
    - `totalCount: Ref<number>` — Total record count.
    - `currentPage: Ref<number>` — Active page index.
    - `hasMore: Ref<boolean>` — Whether subsequent pages exist.
    - `isLoading: Ref<boolean>` — First page loading state.
    - `isFetchingNextPage: Ref<boolean>` — Subsequent page loading state.
    - `error: Ref<string | null>` — Error message string.
    - `loadNextPage()` — Triggers loading next page.
    - `resetAndFetch()` — Clears items and fetches page 1.
- **Example Usage**:
  ```ts
  const { items, hasMore, isFetchingNextPage, loadNextPage } = useInfinitePagination({
    fetcher: (params) => brandService.getBrandsList(params),
    search: searchQuery,
    pageSize: 10
  });
  ```
- **Files or Features Currently Using It**: `<UiInfiniteScroll>`, Admin grid views, paginated filter option selectors across admin and storefront.
- **Side Effects**: Triggers async API fetch calls.
- **Accesses Browser State**: No direct window references (reactive refs).
- **Performs Network Work**: Yes (delegates to fetcher).
- **Related Utilities**: `<UiInfiniteScroll>`, `<UiPagination>`.
- **What It Explicitly Does Not Do**: Does not render UI markup or handle discrete numbered page buttons (numbered page buttons use `<UiPagination>`).
- **Reusability Level**: High.
- **Edge Cases & Behavior**:
  - Automatically resets to page 1 when `search` or `extraParams` reactive values change (debounced by `debounceMs`).
  - Deduplicates incoming items using `dedupeKey` to prevent duplicate key rendering warnings in Vue lists.

---

## 5. Admin Modal & URL Navigation Helpers

### `useAdminModalState`
- **File Location**: `/composables/useAdminModalState.ts`
- **Category**: Composable / Route/query helper
- **Scope**: Admin
- **Purpose**: Synchronizes admin CRUD dialog state (Create/Edit/View/Delete) directly with route query parameters (`?modal=create`, `?modal=edit&id=15`). Provides unified dismissal, entity resolution by ID, boolean visibility flags, and automatic keyboard Escape key closing.
- **Parameters & Return Value**:
  - `options?: UseAdminModalStateOptions<T>`:
    - `modalParam?: string` — Query param key for mode (defaults to `'modal'`).
    - `idParam?: string` — Query param key for ID (defaults to `'id'`).
    - `getItems?: MaybeRef<T[]> | ((id) => Promise<T | null>)` — Item lookup source.
    - `closeOnEscape?: boolean` — Enable Escape key listener (defaults to `true`).
  - Returns state object:
    - `activeMode: ComputedRef<ModalMode | null>`
    - `activeId: ComputedRef<string | number | null>`
    - `activeEntity: Ref<T | null>`
    - `isOpen`, `isCreate`, `isEdit`, `isView`, `isDelete`: Computed boolean flags.
    - `openCreate()`, `openEdit(id)`, `openView(id)`, `openDelete(id)`, `closeModal()`: Navigation functions.
- **Example Usage**:
  ```ts
  const { isOpen, isEdit, activeEntity, closeModal } = useAdminModalState({
    getItems: (id) => productService.getProductById(id)
  });
  ```
- **Files or Features Currently Using It**: All Admin list pages and CRUD modals (`<UserFormModal>`, `<RoleFormModal>`, Product/Category/Brand CRUD modals).
- **Side Effects**: Modifies browser URL query parameters via Vue Router.
- **Accesses Browser State**: Listens to global window `keydown` events for Escape key.
- **Performs Network Work**: Optional async entity resolution via `getItems`.
- **Related Utilities**: `<UiAdminModal>`.
- **What It Explicitly Does Not Do**: Does not render modal markup or handle form field validation directly.
- **Reusability Level**: High (Mandatory admin CRUD standard).

---

## 6. Authentication & Permission Helpers

### `useAdminPermissions`
- **File Location**: `/composables/useAdminPermissions.ts`
- **Category**: Permission/authentication helper
- **Scope**: Admin
- **Purpose**: Centralized authorization composable enforcing Django REST Framework RBAC permission checks against the user permission set returned by `GET /api/v1/users/me/`. Evaluates route access, sidebar visibility, and action controls (Create/Edit/Delete buttons).
- **Parameters & Return Value**:
  - Composable hook returning:
    - `isSuperadmin: ComputedRef<boolean>` — True if user has `is_superuser` or `is_superadmin`.
    - `userPermissions: ComputedRef<string[]>` — Array of normalized permission codenames.
    - `hasPermission(perm: string | string[] | null): boolean` — Evaluates specific permission.
    - `canViewModule(keyOrRoute: string): boolean` — Check module view access.
    - `canCreateInModule(keyOrRoute: string): boolean` — Check create action access.
    - `canEditInModule(keyOrRoute: string): boolean` — Check edit action access.
    - `canDeleteInModule(keyOrRoute: string): boolean` — Check delete action access.
    - `ADMIN_MODULES` — Module configuration registry mapping routes to permission codenames.
- **Example Usage**:
  ```ts
  const { canCreateInModule, hasPermission } = useAdminPermissions();
  if (canCreateInModule('products')) { /* render Create Product button */ }
  ```
- **Files or Features Currently Using It**: Admin layout sidebar (`/layouts/admin.vue`), global auth middleware (`/middleware/auth.global.ts`), admin action buttons across all admin feature modules.
- **Side Effects**: None.
- **Accesses Browser State**: Reads Pinia `useAuthStore` state.
- **Performs Network Work**: No.
- **Related Utilities**: `useAuthStore`, `auth.global.ts`.
- **What It Explicitly Does Not Do**: Does not replace backend security checks (DRF backend remains authoritative security boundary).
- **Reusability Level**: High (Mandatory admin authorization standard).
- **Edge Cases & Behavior**:
  - Permissions are strictly non-transitive (having `change_product` does not imply `delete_product`).
  - Superadmins (`is_superuser` / `is_superadmin`) bypass permission checks.
  - Normalizes permission strings by checking full codenames (`product_api.add_product`) and short names (`add_product`).

---

### `parseJwt`
- **File Location**: `/stores/auth.ts`
- **Category**: Pure utility / Authentication helper
- **Scope**: Shared
- **Purpose**: Local standalone helper parsing base64url encoded JWT access/refresh token strings to extract token payload claims without external dependencies.
- **Parameters & Return Value**:
  - `token: string` — JWT token string.
  - Returns `object | null` — Decoded JSON payload object or `null` if invalid.
- **Files or Features Currently Using It**: `useAuthStore`.
- **Side Effects**: None.
- **Accesses Browser State**: Uses `atob()` and `decodeURIComponent()`.
- **Performs Network Work**: No.
- **Reusability Level**: Medium.

---

## 7. Storefront Category & Mega Menu Helpers

### `useMegaMenu`
- **File Location**: `/composables/useMegaMenu.ts`
- **Category**: Composable / Domain service helper
- **Scope**: Storefront
- **Purpose**: Provides a module-level cached category tree loader for storefront header mega-menus. Manages demand-driven single-parent child category fetching (`GET /api/v1/categories/children/?ids=`), request deduplication (`inFlightRequests`), and shared state across header flyout panels.
- **Parameters & Return Value**:
  - Composable hook returning:
    - `getChildren(parentId: string | number): Category[]` — Retrieve cached child categories.
    - `hasLoadedChildren(parentId: string | number): boolean` — Check if loaded.
    - `isLoadingChildren(parentId: string | number): boolean` — Check if fetching.
    - `ensureChildren(parentId: string | number): Promise<Category[]>` — Lazily load children.
- **Example Usage**:
  ```ts
  const { ensureChildren, getChildren } = useMegaMenu();
  await ensureChildren(parentCategoryId);
  const subCategories = getChildren(parentCategoryId);
  ```
- **Files or Features Currently Using It**: `<HeaderMegaMenu>`, `<HeaderCategorySubmenu>`.
- **Side Effects**: Updates module-scoped reactive caches (`childrenByParentId`, `loadedParentIds`).
- **Accesses Browser State**: No.
- **Performs Network Work**: Yes (`useApiClient`).
- **Related Utilities**: `useCategoryService`.
- **Reusability Level**: High (Storefront header navigation).

---

## 8. Domain Service Composables Summary

| Composable Service | Primary Domain Responsibility | Endpoint Scope | Key Responsibilities & Normalizations |
| :--- | :--- | :--- | :--- |
| `useProductService` | Products & Images | `/api/v1/products/`, `/api/v1/product-images/` | Product list queries, price mapping (`current_selling_price`), primary image fallback, trailing slashes, bulk product image uploads. |
| `useCategoryService` | Categories & Tree | `/api/v1/categories/`, `/api/v1/categories/tree/` | Category hierarchy tree traversal, sibling-level accordion expansion (`expandedCategoryIds`), demand-driven lazy child batching, breadcrumb path construction (`getCategoryPath`), trailing slashes. |
| `useBrandService` | Brands | `/api/v1/brands/` | Brand listing, active status filtering, brand CRUD operations, brand response mapping. |
| `useBlogService` | Blog Posts & Tags | `/api/v1/blog/posts/`, `/api/v1/blog/tags/` | Blog post queries by tag/category/author, post detail by ID/slug, blog tag CRUD operations. |
| `useUserService` | Users & Staff | `/api/v1/users/` | User account listing, staff management, user CRUD, password changes, status updates. |
| `useRoleService` | Roles & Groups | `/api/v1/roles/` (Django Groups) | Role/Group listing, RBAC role CRUD, permission assignments. |
| `usePermissionService` | Permissions Matrix | `/api/v1/permissions/` | Fetches available backend permissions and content types for RBAC role matrix pickers. |
| `useRequestLogService` | Security Audit Logs | `/api/v1/request-logs/` | Security and request log entry filtering and listing for audit views. |
| `useContentSecurityService` | CSP & Security Rules | `/api/v1/content-security/*` | Keyword, domain, hidden content, redirect, and HTML tag security rules management. |

---

## 9. Inventory Maintenance & Updating Guidelines

1. **Consult Before Creating**: Always inspect this document and search `/composables/` and `/utils/` before introducing new utility functions or composables.
2. **Reuse & Extend Existing Utilities**: Prefer extending existing helpers (e.g. `extractErrorMessage`, `useInfinitePagination`, `useAdminModalState`) over creating duplicate or overlapping implementations.
3. **Updating the Inventory**: When a new reusable utility function or composable is created, modified, or renamed, update `/docs/agent-context/utility-inventory.md` accordingly.
4. **Authoritative Code Principle**: If code and documentation diverge, the application source code is the authoritative source of truth.
