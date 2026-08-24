# Best Computer Hub Frontend — Agent Guidelines

## Project

This repository contains the Best Computer Hub e-commerce
frontend.

The application is being migrated from an existing
WordPress/WooCommerce storefront.

The frontend is built with:

- Nuxt 4
- Vue 3
- TypeScript
- Tailwind CSS 3
- Pinia
- VueUse
- lucide-vue-next
- pnpm

The backend is Django REST Framework.

## Primary Goals

The storefront must prioritize:

1. SEO
2. performance
3. accessibility
4. maintainability
5. responsive design
6. commerce-data accuracy

## Architecture

Use this dependency direction where practical:

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
DRF

Pages should primarily handle:

- routing
- server data fetching
- SEO
- route-level errors
- feature composition

Components should primarily handle presentation and
user interaction.

Domain services own API-specific operations.

useApiClient owns shared HTTP concerns.

## TypeScript

TypeScript strict mode is enabled.

Avoid `any`.

Do not use `any` merely because an API response differs
from the frontend model.

Model API contracts explicitly.

## Commerce Data Integrity

Never fabricate production commerce data.

This includes:

- prices
- discounts
- stock
- ratings
- reviews
- specifications
- warranty
- certifications
- shipping promises
- product compatibility
- availability

Mock values are allowed only inside explicitly isolated
mock/demo systems.

The backend is authoritative for commerce-critical
business data and calculations.

## Authentication & Authorization

Never infer permissions or roles from:

- email addresses
- usernames
- routes
- frontend state

Roles and permissions come from the backend.

Frontend route/UI guards improve UX but are not security
boundaries.

DRF must enforce protected operations.

## Package Management

Use pnpm exclusively.

Do not use npm or yarn.

Do not generate package-lock.json.

## Styling

Use Tailwind CSS and the project's semantic design tokens.

Prefer:

bg-primary
text-primary-foreground
bg-card
text-card-foreground
border-border

over hard-coded theme-dependent colors.

Use lucide-vue-next for icons.

## API

All DRF endpoints must use trailing slashes.

Do not guess API field names, query parameters, response
structures, or authentication contracts.

Integrate against the established backend contract.

All shared HTTP communication must go through useApiClient.

## Storefront URL Route Convention (Trailing Slashes)

All public Storefront URLs, links, navigation paths, and routes must strictly use a **trailing slash `/`** at the end of the URL path. 

This convention applies to:
- **Homepage**: `/`
- **Static Storefront Routes**: (e.g., `/about/`, `/sustainability/`, `/careers/`, `/privacy/`)
- **Product URLs**: `/product/{slug}/` (e.g., `/product/dji-mavic-3-pro-fly-more-combo-4k-drone-with-remote-controller/`)
- **Category URLs**: `/product-category/{slug}/` (e.g., `/product-category/gaming-component/laptop/msi-laptop/`)
- **Dynamic segments / links**: Brand pages, blog archives, and posts (e.g., `/blog/{slug}/`, `/brand/{slug}/`)
- **User experience navigation links**: (e.g., `/offers/`, `/new-arrivals/`)
- **Breadcrumb links**: Every intermediate path in breadcrumb arrays must terminate with a trailing slash.
- **Programmatically generated URLs**: Any URL resolved via services or composables (e.g. `categoryService.getCategoryPath()`, product dynamic links).

New Storefront links, Nuxt page components, navigation handlers, and programmatically generated storefront routes must NOT intentionally generate URLs lacking the trailing slash. Maintaining trailing slashes is crucial to preserve original SEO juice, replicate the original WordPress URL patterns, and prevent canonicalization/duplicate content conflicts.

## SEO

Public catalog and content pages are SEO-sensitive.

Product, category, brand and content pages should be
server-renderable and expose appropriate metadata.

Do not replace existing WordPress URLs without considering
SEO migration and redirects.

## Reusable Admin Infrastructure & State Patterns

### 1. Reusable Admin Pagination Standards (`<UiPagination />` & `<UiInfiniteScroll />`)
All admin list views and paginated collections must use the established, reusable pagination primitives rather than creating custom or page-specific pagination UI.

- **Standard Admin Numbered Pagination (`<UiPagination />` from `/components/ui/UiPagination.vue`)**:
  - **Mandatory Standard**: `<UiPagination />` is the single required standard for all admin list and table views that require numbered page navigation.
  - **No Duplication**: Admin pages must never create local page-specific pagination UI or duplicate page calculation/navigation logic.
  - **Preserved Design & Behavior**: All instances must maintain the standardized behavior:
    - Previous/Next navigation controls.
    - Multiple visible page numbers with balanced end-range visibility (showing multiple pages near both start and end bounds).
    - Ellipsis (`...`) strictly for skipped page ranges.
    - Stable, fixed-slot pagination layout and width across page transitions (preventing layout shift).
    - Concise `Showing X–Y of Z` summary format (e.g., `Showing 1–10 of 1,572`).
  - **Extensibility Rule**: If a page requires pagination functionality not currently supported, extend the reusable `<UiPagination />` component directly rather than creating a bespoke local implementation.

- **Infinite Scroll (`useInfinitePagination<T>` & `<UiInfiniteScroll />`)**:
  - Use `useInfinitePagination<T>()` from `/composables/useInfinitePagination.ts` and `<UiInfiniteScroll />` from `/components/ui/UiInfiniteScroll.vue` for continuous infinite-scroll feeds, dropdown selectors, or compact modal list views where streaming items continuously is preferred over discrete page numbers.
  - **Paginated Filter Option Standard**: All filter option lists across the application — including Admin pages, Storefront interfaces, and reusable filter/select components — whose option API returns paginated data must implement infinite scrolling using `useInfinitePagination<T>()` and/or `<UiInfiniteScroll />` according to these project-wide rules:
    - **`next` Link Page Checks**: Use the API response `next` pagination URL/value to evaluate whether subsequent option pages exist.
    - **End-of-List Scroll Triggering**: Load the next page automatically when the user scrolls to the end of available options.
    - **Option Appending**: Append newly loaded options to the existing options list; never overwrite or replace previously loaded options.
    - **Termination**: Continue loading sequential pages upon scrolling until `next` is `null`. Do not request another page when there is no `next` page.
    - **Duplicate & Concurrency Prevention**: Prevent duplicate or concurrent API requests for the same next page while a fetch request is pending (`isFetchingNextPage`).
    - **Option State Preservation**: Preserve already-loaded filter options when the filter popover or dropdown is closed and reopened where the component or state lifecycle permits.
    - **Demand-Driven Lazy Loading**: Fetch filter options strictly on demand when the user opens or interacts with the filter workflow; never issue pre-emptive option requests on page or component mount.
    - **Data Reuse**: Reuse previously loaded option collections across UI open triggers instead of dispatching redundant requests.
    - **Search Debouncing**: When the filter supports search, maintain immediate local typing responsiveness while debouncing downstream API queries (standard 300ms delay via `refDebounced`).

- **Pattern Selection Guideline**:
  - Use **`<UiPagination />`** when users need explicit page jumping, total record count visibility, or standard tabular admin dataset navigation.
  - Use **`<UiInfiniteScroll />`** when users stream through items continuously (e.g., dropdown search pickers, live audit logs, or infinite catalog feeds) without needing discrete page jumps.

- **Admin View-Based Pagination Rule (Grid View vs. List/Table View)**:
  For any existing or future Admin page that provides both Grid View and List/Table View:
  - **Grid View**: Must use infinite-scroll data loading using the existing `useInfinitePagination()` + `<UiInfiniteScroll />` pattern.
  - **List/Table View**: Must use numbered pagination using the existing numbered pagination pattern with `<UiPagination />`.
  - **Strategy Switching**: The active view mode determines the active pagination/data-loading strategy.
  - **State Reset on Switch**: Pagination and data-loading state must be reset appropriately when switching between Grid and List views so state from one strategy is not incorrectly carried into the other.
  - **Separation of Responsibilities**: `<UiTable />`, `<UiPagination />`, and `<UiInfiniteScroll />` remain strictly separate reusable responsibilities.
  - **No Infrastructure Duplication**: Do not duplicate pagination infrastructure for individual pages.

### 2. URL-Driven Admin Modal State (`useAdminModalState` & `<UiAdminModal />`)
All admin CRUD dialogs (Create/Edit/View/Delete) must synchronize their state directly with route query parameters using `useAdminModalState<T>()` from `/composables/useAdminModalState.ts` and `<UiAdminModal />` from `/components/ui/UiAdminModal.vue`.
- Standard URL query format: `?modal=create`, `?modal=edit&id=15`, `?modal=view&id=15`, `?modal=delete&id=15`.
- **Single Source of Truth**: The URL drives modal visibility and entity resolution. Opens, closes, reloads, and browser Back/Forward navigation automatically stay synchronized.
- **Unified Dismissal Flow**: All close triggers (Cancel button, Close 'X' button, clicking backdrop/outside area, and Escape key) must call the same canonical `closeModal()` method to clear query parameters and restore URL state.
- **UI Container Requirement**: All admin modals must wrap their markup in `<UiAdminModal>` to enforce consistent z-indexing, backdrop blur, mousedown-outside tracking, and keyboard accessibility.

### 3. Centralized Permission-Based Authorization (`useAdminPermissions`)
All admin navigation, route access, module visibility, page-level data fetching, and action controls (Create/Edit/Delete buttons) must consume the centralized Admin Permission Registry via `useAdminPermissions()` from `/composables/useAdminPermissions.ts`.
- **Single Source of Truth**: Backend permissions returned in `GET /api/v1/users/me/` drive frontend authorization decisions.
- **Route & Sidebar Integration**: Navigation items in `/layouts/admin.vue` and global route guards in `/middleware/auth.global.ts` enforce module-level permission rules using `canViewModule(route)`. Unauthorized direct access routes to `/admin/forbidden` (403) rather than redirecting to login.
- **Action-Level Gating**: Buttons and CRUD controls must check module create/edit/delete permissions (`canCreateInModule`, `canEditInModule`, `canDeleteInModule`) or specific codenames via `hasPermission()`. Unprivileged users must not trigger unauthorized API calls.

### 4. Global Search & Filter Debouncing
All user-input-driven API searches and filters must be debounced by default using `@vueuse/core`'s `refDebounced` (standard 300ms delay).
- **Separation of Concerns**: Immediate local input state must remain responsive on every keystroke, while the API query state must be debounced.
- **Architectural Placement**: Debounce belongs at the query/composable/component layer (e.g. `useInfinitePagination`, storefront listings, admin tables), never inside the central `useApiClient` HTTP client or via global request interceptors.
- **Exemptions**: Explicit actions (e.g. clicking 'Apply Filters', 'Save', pagination buttons, page initial loads, mutations) must remain immediate.

### 5. Efficient & Demand-Driven API Calling
API requests must be driven by actual data requirements, not merely by component mounting, watchers, reactive state changes, or anticipated future actions.
- **Demand-Driven Principle**: Before dispatching an API call, verify if the data is required for the current view or user action. If data is already available in props, state, or stores, reuse it.
- **Lazy Workflow Fetching**: Fetch workflow-specific or auxiliary data (such as form selection lists or modal entity details) only when the user actively opens or triggers that specific workflow, never on page or parent component mount.
- **No Duplicate Requests**: Avoid redundant API calls when usable data has already been fetched or is currently being processed.

### 6. Centralized API Error Message Handling
All API errors (`400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`, etc.) must be processed centrally through the existing API client and toast error-handling architecture (`useApiClient` / `useToast`'s `handleApiError` / `extractErrorMessage`).
- **No Independent Component Parsing**: Components and feature views must NOT manually parse API errors independently unless explicitly required by a specific feature workflow.
- **Error Message Priority & Extraction**: The centralized handler must inspect error responses, extract user-facing messages provided by the backend (e.g. `detail`, `message`, `error`, `non_field_errors`, or field errors), and display them via the toast notification system.
- **User-Friendly Fallbacks**: When no backend error message is provided, fall back to a clear, generic user-facing message (e.g. "An unexpected error occurred.").
- **No Raw Technical Strings**: Never expose raw HTTP request signatures, URLs, HTTP methods, status code headers (e.g. `[POST] "...": 403 Forbidden`), or internal error objects to end users in toasts or UI error states.

### 7. Icon-Only Action Buttons
For common, visually recognizable secondary actions (such as View, Edit, Delete, Add, Remove) on cards, tables, list items, or dense admin interfaces, prefer compact icon-only action buttons.
- **When to Use Visible Text**: Retain text labels for primary CTAs, non-obvious actions, or when additional context is needed to prevent ambiguity.
- **Accessibility Requirements**: All icon-only action buttons MUST include an accessible `aria-label` and an appropriate `title`/tooltip for sighted users while using the project's standard icon library (`lucide-vue-next`).

### 8. Standard Reusable Admin Table Pattern (`<UiTable />`)
All administrative list and data views displaying tabular data must use the standard `<UiTable />` component (`/components/ui/UiTable.vue`) rather than implementing raw `<table>` HTML markup or inline table styling directly within pages.

- **Mandatory Reusable Primitive**: `<UiTable />` is the required standard primitive for all Admin list and tabular data views. Future and existing Admin pages displaying tabular data must first check for and reuse `<UiTable />` instead of creating raw custom table markup or duplicate table components.
- **Encapsulated Presentation Responsibilities**: `<UiTable />` handles core table structure and visual presentation:
  - Responsive table container wrapper handling overflow and scroll behavior (`overflow-x-auto`).
  - Standardized header rendering (`<thead>`, `<th>`) and column configuration API.
  - Consistent row (`<tr>`) and cell (`<td>`) padding, borders, typography, alignment, hover states, and semantic design tokens (`bg-card`, `text-card-foreground`, `border-border`, etc.).
  - Built-in empty state rendering when dataset collections are empty.
  - Built-in loading state rendering (skeletons or spinners) during asynchronous operations.
- **Flexible Column & Cell Rendering API**:
  - Entity-specific fields, badges, avatars, action buttons, and custom formatters must be supported via a flexible slot/prop API (e.g., named cell slots like `#cell(columnKey)` or `#cell-name`) without hardcoding domain entity logic inside `<UiTable />`.
- **Strict Separation of Concerns**:
  - **Pagination**: Kept strictly separate. `<UiPagination />` and `<UiInfiniteScroll />` remain responsible for pagination controls and page navigation, positioned outside `<UiTable />`.
  - **Business & Data Logic**: Sorting, searching, filtering, permissions checking, row action handlers, and API data-fetching logic remain outside `<UiTable />`, managed by pages, composables, or stores and passed into `<UiTable />` via props/slots.

### 9. Admin UI Layout & Information-Density Standards
All Admin pages must maintain high information density, clear visual hierarchy, and compact container spacing across all modules (Categories, Products, Brands, Orders, Inventory, Users/Staff, Roles, Permissions, Notifications, Security, etc.):
- **Single-Row Page Header**: On pages with breadcrumbs, combine the breadcrumb path and page title on the left side of the header row with page action buttons right-aligned on the same row. Omit redundant descriptive subtitles to save vertical viewport space.
- **Viewport Information Density**: Maximize visible data and controls within the viewport by reducing outer container padding and section vertical gaps. Do not shrink font sizes or interactive control targets below standard guidelines.
- **Compact Search & Filter Containers**: Outer search/filter bar wrappers must remain vertically compact (e.g., `px-3.5 py-2.5`), while individual filter controls retain comfortable internal heights (`h-9`) and breathing room. Never shrink search input components.
- **Full Guidance**: See `/docs/agent-context/design-system.md` for detailed authoritative layout and density standards.

### 10. Admin Categories Tree Sibling-Level Accordion Expansion Standard
The Admin Categories Tree view must use **sibling-level accordion behavior**, not global single-node expansion:
- **Canonical Rule**: At each hierarchy level, only one sibling branch may be expanded at a time. Expanding a category collapses other expanded siblings with the same immediate parent, while all ancestors of the selected category remain expanded.
- **Siblings**: Categories with the same immediate parent are siblings; root categories are treated as siblings at the root level.
- **Hierarchical Ancestor Retention**: A child can be expanded while its parent remains expanded. A grandchild can be expanded while both parent and grandparent remain expanded. Never collapse an ancestor simply because a descendant is expanded.
- **Lazy Loading**: Expanding a category continues to utilize demand-driven lazy child loading (`categoryService.getCategoryChildrenBatch`), loading children only when not already cached and without introducing redundant API requests.
- **State Management**: Use the existing centralized tree/category expansion state (`expandedCategoryIds`, `isNodeExpanded`, `setNodeExpanded`) rather than creating duplicate, local, or globally exclusive state abstractions.
- **Menu Tree Parity**: The same hierarchical sibling-level expansion principle applies to Menu Tree views while preserving menu filtering behavior (`is_menu=true`).
- **Full Guidance & Examples**: See `/docs/agent-context/design-system.md` Section 42.

### 11. Standard Admin List Page-Size Selector ("Show: X / page")
All Admin list pages displaying tabular data with numbered pagination (including Products, Categories, Brands, Users, Roles, and future Admin list views) must provide a standardized **Show / page-size selector** integrated directly into the list controls.

- **Authoritative Reference Implementation**: Follow the reference implementation established on the Admin Products list page (`/pages/admin/products/index.vue`).
- **Standardized Values & Default**:
  - Allowed options: `5 / page`, `10 / page`, `25 / page`, `50 / page`, `100 / page`, and `1000 / page` (numeric values: `5`, `10`, `25`, `50`, `100`, `1000`).
  - Standard default page size: `10`.
  - Do not invent custom or arbitrary page-size increments.
- **Visual Presentation & Placement**:
  - Positioned inside the compact search/filter container on the right side, separated from preceding filter controls with a subtle left border delimiter (`border-l border-border pl-2.5`).
  - Label: `<span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground hidden sm:inline">Show:</span>`.
  - Control: Standardized `<select>` using design tokens (`h-9 px-2.5 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer`).
  - View-Mode Gating: Rendered when the active view is List/Table view (`v-if="viewMode === 'list'"`). In Grid view, data loading follows infinite scrolling with `useInfinitePagination`.
- **Architectural & State Patterns**:
  - **URL Query Initialization**: `const itemsPerPage = ref(route.query.pageSize ? parseInt(String(route.query.pageSize)) || 10 : 10)`.
  - **URL Query Synchronization**: Synchronize state with route query `pageSize` when value differs from default (10), e.g. `pageSize: itemsPerPage.value !== 10 ? itemsPerPage.value : undefined`.
  - **Pagination Reset on Change**: Changing `itemsPerPage` must reset `currentPage.value = 1` before dispatching API fetching (via reactive watcher on `itemsPerPage`).
  - **API Contract**: Pass `page_size: itemsPerPage.value` into the domain service request parameters (e.g. `productService.getProductsList({ page, page_size, search, ... })`).
  - **`<UiPagination />` Integration**: Pass `:items-per-page="itemsPerPage"` into `<UiPagination />` to maintain accurate `Showing X–Y of Z` summary rendering and compute `totalPages = Math.ceil(totalCount / itemsPerPage)`.
- **Scope**: Products (reference), Categories, Brands, Users, Roles, and all future admin list pages.

## Structural Changes

Agents may autonomously perform small, task-local,
convention-preserving structural changes.

Do not perform broad architectural restructuring,
authentication redesign, dependency replacement or
cross-domain refactoring unless required by the task.

## Definition of Done

Before considering implementation complete:

- TypeScript passes
- build passes
- affected flows are verified
- no temporary artifacts remain
- no obvious architectural violation was introduced
- no fabricated production commerce data was introduced
