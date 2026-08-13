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

- **Pattern Selection Guideline**:
  - Use **`<UiPagination />`** when users need explicit page jumping, total record count visibility, or standard tabular admin dataset navigation.
  - Use **`<UiInfiniteScroll />`** when users stream through items continuously (e.g., dropdown search pickers, live audit logs, or infinite catalog feeds) without needing discrete page jumps.

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
