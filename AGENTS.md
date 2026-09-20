# Best Computer Hub Frontend — Agent Guidelines

## 1. Project Overview & Technology Stack

This repository contains the Best Computer Hub e-commerce storefront, migrated from WordPress/WooCommerce to a decoupled modern frontend with a Django REST Framework (DRF) backend.

The frontend is built with:
- **Framework**: Nuxt 4 (Vue 3)
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS 3 with semantic design tokens
- **State Management**: Pinia, VueUse
- **Icons**: `lucide-vue-next`
- **Package Manager**: `pnpm` exclusively (never use `npm` or `yarn`; never generate `package-lock.json`)

### Primary Storefront Goals
1. SEO & search crawlability
2. Performance & Core Web Vitals
3. Accessibility (WCAG AA)
4. Maintainability & clean abstraction
5. Responsive mobile-first design
6. Commerce-data accuracy & backend authority

---

## 2. Core Architecture & Dependency Hierarchy

Strictly maintain the following dependency direction across all features:

```text
Page (/pages/)
  ↓
Feature / Component (/features/, /components/)
  ↓
Store / Composable (/stores/, /composables/)
  ↓
Domain Service (/composables/use*Service.ts)
  ↓
useApiClient (/composables/useApiClient.ts)
  ↓
Django REST Framework (DRF Backend)
```

### Layer Responsibilities
- **Pages (`/pages/`)**: Own routing, server data fetching (SSR), SEO metadata, route-level error/404 handling, and high-level feature composition. Pages must remain thin; extract UI into components or features.
- **Components (`/components/`)**: Own visual presentation and local UI interactions. UI primitives (`/components/ui/`) must remain domain-agnostic. Commerce components (`/components/commerce/`) handle presentation of products, cart, and prices.
- **Features (`/features/`)**: Own larger domain-specific modules with multiple tightly coupled components (e.g., admin dashboard widgets).
- **Domain Services (`/composables/use*Service.ts`)**: Own entity-specific API communication and business calls. Never put raw API endpoints in components or pages.
- **`useApiClient`**: Owns centralized HTTP transport, authentication headers, base URLs, token refresh, and standardized network error handling.
- **Stores (`/stores/`)**: Own client-side cross-component state (auth session, cart items, UI drawers, cookie preferences). Stores must not duplicate or replace backend calculations.

*Authoritative details*: `/docs/agent-context/architecture.md`.

---

## 3. Reusable Logic & Inventory Mandates

To prevent code duplication, enforce utility-first development and component reuse across all tasks:

- **Check Inventories First**: Before implementing any new helper, formatter, calculation, normalizer, or UI component:
  1. Read `/docs/agent-context/utility-inventory.md` for existing utilities, composables, and helpers.
  2. Read `/docs/agent-context/component-inventory.md` for existing UI primitives, layout elements, and commerce components.
  3. Search the codebase (`/utils/`, `/composables/`, `/components/`) for similar implementations.
- **Reuse Over Duplication**: If an existing utility or component satisfies or can be cleanly extended to satisfy the requirement, reuse it. Do not create local duplicate logic.
- **Keep Inventories Synchronized**: Whenever you create, relocate, or substantially modify a reusable utility, helper, or component, update `/docs/agent-context/utility-inventory.md` or `/docs/agent-context/component-inventory.md` within the same task.
- **Extraction Criteria**: Extract code only for genuine reuse across multiple contexts, distinct domain ownership, or complex encapsulated state—never merely to meet arbitrary file-length limits.

---

## 4. TypeScript & Code Quality

- **Strict Typing**: TypeScript strict mode is enabled. Avoid `any`.
- **Explicit Contracts**: Never use `any` simply because a backend response differs from frontend models. Define explicit request, response, and entity contracts in `/types/`.
- **Imports**: Place imports at the top of the file. Use named imports (`import { ... }`).
- **No Inline Styles**: Use Tailwind CSS utility classes and semantic tokens. Avoid inline `style=""` attributes and custom CSS files.

---

## 5. Commerce Data Integrity & Backend Authority

The Django REST Framework backend is the single authoritative source for commerce data, business calculations, and access permissions.

- **Never Fabricate Commerce Data**: You are strictly forbidden from fabricating or hard-coding production commerce values, including:
  - Prices, discounts, and sale figures
  - Stock levels and availability statuses
  - Ratings, review counts, and customer feedback
  - Technical specifications and attributes
  - Warranty terms and certifications
  - Shipping promises, delivery dates, and compatibility
- **Mock Data Boundary**: Mock values are permitted only inside explicitly isolated mock/demo test fixtures.
- **Calculations**: Never recalculate discounts, taxes, or cart order totals independently on the client; always display values returned or confirmed by the backend.

*Authoritative details*: `/docs/agent-context/ecommerce-domain.md`.

---

## 6. Authentication & Authorization Boundaries

- **Backend Authority**: User roles, permissions, and session validity are strictly determined by the backend (`GET /api/v1/users/me/`).
- **No Inferred Roles**: Never infer permissions or user types from email addresses, usernames, routes, or local storage.
- **Defense in Depth**: Frontend route guards (`middleware/auth.global.ts`) and UI checks improve user experience by hiding inaccessible controls, but they are not security boundaries. DRF must enforce protected operations.
- **Centralized Admin Authorization**: All Admin panel routing (`/admin/*`) and CRUD actions are restricted by a triple-gated authorization model:
  ```text
  Authenticated user AND User type is Owner or Staff AND User has specific permission
  ```
  - Unauthenticated users redirect to login. Non-staff users (e.g., Customers) redirect to `/admin/forbidden` (403).
  - Permissions are action-specific and non-transitive (`view_*`, `add_*`, `change_*`, `delete_*`). Having one permission never grants another.
  - All admin checks must use `useAdminPermissions()`. Never create custom role logic.

*Authoritative details*: `/docs/agent-context/architecture.md` (Section 5) and `/docs/agent-context/ecommerce-domain.md` (Section 5).

---

## 7. Styling & Semantic Design Tokens

- **Semantic Tokens**: Build interfaces using the project's semantic Tailwind tokens rather than hardcoded hex codes or arbitrary palette colors:
  - Backgrounds: `bg-background`, `bg-card`, `bg-muted`, `bg-primary`
  - Foregrounds: `text-foreground`, `text-card-foreground`, `text-muted-foreground`, `text-primary-foreground`
  - Borders: `border-border`, `border-input`
  - Rings: `ring-ring`
- **Iconography**: Use `lucide-vue-next` exclusively.
- **Icon-Only Action Buttons**: For common secondary table/card actions (View, Edit, Delete), use compact icon-only buttons. Primary CTAs retain visible text. All icon buttons must provide accessible `aria-label` and `title` attributes.

*Authoritative details*: `/docs/agent-context/design-system.md`.

---

## 8. API Communication Conventions

- **Trailing Slashes**: All DRF API endpoints must terminate with a trailing slash `/` (e.g., `/api/v1/products/`).
- **Standard HTTP Client**: All shared HTTP communication must go through `useApiClient`.
- **Search & Filter Debouncing**: All user-input searches and filter queries must be debounced by default (standard 300ms delay via `@vueuse/core`'s `refDebounced`). Debouncing belongs at the query/component layer, never inside `useApiClient`. Explicit user actions (Apply button, Save, Pagination clicks) remain immediate.
- **Demand-Driven API Fetching**: API requests must be driven strictly by immediate view requirements. Verify if data is already available in props, stores, or state before fetching. Defer auxiliary workflow data (such as modal options) until the workflow is actively opened.
- **Centralized Error Handling**: Process all API errors (`400`, `401`, `403`, `404`, `500`, etc.) centrally through `useApiClient` and `useToast` (`handleApiError` / `extractErrorMessage`). Extract user-facing backend messages; never expose raw URLs, HTTP methods, status strings, or stack traces in toasts.

*Authoritative details*: `/docs/agent-context/api-conventions.md` and `/docs/agent-context/architecture.md` (Sections 11–13).

---

## 9. Storefront URL Route Convention (Trailing Slashes)

All public Storefront URLs, links, navigation paths, and routes must strictly terminate with a **trailing slash `/`**:
- Homepage: `/`
- Static pages: `/about/`, `/sustainability/`, `/careers/`, `/privacy/`
- Products: `/product/{slug}/`
- Categories: `/product-category/{slug}/`
- Brands & blog: `/brand/{slug}/`, `/blog/{slug}/`
- Navigation & dynamic links: `/offers/`, `/new-arrivals/`
- Breadcrumb paths: Every intermediate and terminal link must have a trailing slash.

Never generate storefront links lacking a trailing slash. Maintaining trailing slashes preserves SEO equity, matches legacy WordPress URLs, and prevents canonical redirect chains.

*Authoritative details*: `/docs/agent-context/seo-strategy.md` (Section 9a).

---

## 10. SEO & Public Storefront Principles

- **Server-Side Rendering (SSR)**: Catalog pages (products, categories, brands) and content pages are SEO-sensitive and must be fully server-renderable with valid metadata (`useSeoMeta`).
- **URL Stability**: Never alter, replace, or remove existing storefront URLs without considering WordPress migration parity, redirects, and canonical URL consistency.
- **Sitemap Rules**: Only indexable, active products, categories, and public pages belong in sitemaps. Exclude admin routes, auth flows, carts, checkout, and private customer areas.

*Authoritative details*: `/docs/agent-context/seo-strategy.md` and `/skills/seo/SKILL.md`.

---

## 11. Reusable Admin Infrastructure Standards

All administrative list, table, and CRUD interfaces must adhere to established shared patterns rather than building page-local implementations:

1. **Admin Numbered Pagination (`<UiPagination />`)**:
   - `<UiPagination />` from `/components/ui/UiPagination.vue` is the single mandatory standard for admin tabular list pagination.
   - Shows concise `Showing X–Y of Z` summary on the left, balanced boundary page buttons with ellipsis (`...`) for skipped ranges on the right, and stable layout width.
   - *Authoritative details*: `/docs/agent-context/design-system.md` (Section 39).

2. **Continuous Streaming & Paginated Filter Options (`useInfinitePagination` & `<UiInfiniteScroll />`)**:
   - Continuous feeds, search pickers, compact modal lists, and all paginated filter option dropdowns across Admin and Storefront must use `useInfinitePagination<T>()` and `<UiInfiniteScroll />`.
   - Must evaluate API `next` URLs, append subsequent pages on end-of-list scroll without overwriting existing options, stop when `next` is null, guard against duplicate in-flight requests, and fetch strictly on demand.
   - *Authoritative details*: `/docs/agent-context/design-system.md` (Section 39) and `/docs/agent-context/architecture.md` (Section 12).

3. **Dual View-Mode Pagination Rule (Grid vs. List/Table)**:
   - When a page provides both Grid and List views: **List/Table View** uses numbered pagination (`<UiPagination />`); **Grid View** uses infinite scrolling (`useInfinitePagination`).
   - Switching views resets data loading state cleanly.
   - *Authoritative details*: `/docs/agent-context/design-system.md` (Sections 38, 39).

4. **URL-Driven Admin Modals (`useAdminModalState` & `<UiAdminModal />`)**:
   - All admin CRUD dialogs (Create, Edit, View, Delete) must synchronize visibility and active entity IDs directly with route query parameters (`?modal=create`, `?modal=edit&id=15`).
   - Must use `useAdminModalState()` and wrap dialog markup in `<UiAdminModal>`.
   - *Authoritative details*: `/skills/url-driven-dialogs/SKILL.md`.

5. **Standard Admin Table Primitive (`<UiTable />`)**:
   - Tabular admin datasets must use `<UiTable />` from `/components/ui/UiTable.vue` instead of raw `<table>` HTML.
   - Encapsulates horizontal scroll wrappers, standardized headers, cell padding, hover states, empty states, and loading states.
   - Cell content is customized via named slots (`#cell(key)`). Sorting, filtering, and pagination controls remain outside `<UiTable />`.
   - *Authoritative details*: `/docs/agent-context/design-system.md` (Section 40).

6. **Admin Layout & Information Density**:
   - Use single-row page headers combining breadcrumbs, page title, and action buttons.
   - Maximize visible data in the viewport by keeping container padding compact (e.g., search/filter container `px-3.5 py-2.5`). Controls inside maintain standard height (`h-9`).
   - Increase density by reducing whitespace, not by shrinking accessible font sizes or control hit targets below WCAG AA.
   - *Authoritative details*: `/docs/agent-context/design-system.md` (Section 41).

7. **Category Tree Sibling-Level Accordion Expansion**:
   - The Admin Categories Tree and Menu Tree must use sibling-level accordion expansion: at any hierarchy level, only one sibling branch may be expanded at a time. Expanding a category collapses only other siblings with the same immediate parent.
   - Ancestors always remain expanded. Lazy child loading loads data on demand without redundant requests.
   - *Authoritative details*: `/docs/agent-context/design-system.md` (Section 42).

8. **Admin List Page-Size Selector ("Show: X / page")**:
   - Admin tabular list pages with numbered pagination must provide the standard page-size selector integrated into the filter bar.
   - Allowed options: `5 / page`, `10 / page`, `25 / page`, `50 / page`, `100 / page`, and `1000 / page` (default: `10`).
   - Changing page size resets current page to 1, synchronizes the `pageSize` URL query parameter, and passes `page_size` to the API.
   - *Authoritative details*: `/docs/agent-context/design-system.md` (Section 43) and `/docs/agent-context/architecture.md` (Section 14).

9. **Storefront Inline Editing**:
   - Storefront administrative editing must use contextual inline editing rather than intrusive banners or redirecting to admin pages.
   - Contextual edit icon visible only to authorized users (triple-gated via `useAdminPermissions`).
   - Saves automatically on focus loss (blur), validates change detection pre-flight, and submits minimal PATCH payloads.
   - *Authoritative details*: `/docs/agent-context/design-system.md` (Section 44) and `/skills/storefront-inline-editing/SKILL.md`.

---

## 12. Structural Changes & Scope Discipline

- **Task-Local Changes**: Agents may autonomously perform small, task-local, convention-preserving structural changes required to complete the specific user request.
- **No Unsolicited Restructuring**: Do not perform broad architectural restructuring, authentication redesign, dependency replacement, or cross-domain refactoring unless explicitly instructed.
- **Respect User Intent**: Build what was requested cleanly and accurately without introducing unrequested features, speculative abstractions, or cosmetic rewrites of working code.
- **No Auxiliary/Analysis Scripts**: Do not create auxiliary, temporary, or automatic auditing/analysis scripts (e.g., Python `.py` scripts, shell scripts, Jupyter notebooks, or conversion tools) to analyze the workspace. All auditing, code scanning, or refactoring analysis must be performed using standard workspace tools (e.g., `grep` or IDE search utilities) without writing temporary code files.

---

## 13. Definition of Done

Before considering any task complete, verify that:
1. **TypeScript Validation Passes**: `pnpm lint` (which runs `nuxt typecheck`) passes with zero type errors.
2. **Production Build Passes**: `pnpm build` completes successfully.
3. **Flows & Functionality Verified**: All modified workflows, interactive states, and edge cases operate cleanly in the browser.
4. **No Temporary Artifacts**: Remove all temporary debugging code, console logs, scratch files, and any auxiliary search/auditing scripts (e.g. `.py` or `.sh` files).
5. **Architectural & Data Compliance**: No architectural boundary was violated, and no fabricated production commerce data was introduced.
6. **Inventories Updated**: Any new or updated reusable utility, composable, or component is documented in `/docs/agent-context/utility-inventory.md` or `/docs/agent-context/component-inventory.md`.

---

## 14. Authoritative Knowledge Base Reference Map

For detailed implementation specifications, consult the authoritative documentation:

| Domain / Responsibility | Authoritative File Location |
| :--- | :--- |
| **System Architecture & Layers** | `/docs/agent-context/architecture.md` |
| **Design System, UI Tokens & Admin Standards** | `/docs/agent-context/design-system.md` |
| **E-Commerce Domain & Backend Authority** | `/docs/agent-context/ecommerce-domain.md` |
| **SEO, Metadata, SSR & Redirects** | `/docs/agent-context/seo-strategy.md` |
| **API Conventions & HTTP Standards** | `/docs/agent-context/api-conventions.md` |
| **Temporarily Disabled Features** | `/docs/agent-context/disabled-features.md` |
| **Component Inventory & Reuse** | `/docs/agent-context/component-inventory.md` |
| **Utility & Helper Inventory** | `/docs/agent-context/utility-inventory.md` |
| **Admin Modal Dialog Lifecycle** | `/skills/url-driven-dialogs/SKILL.md` |
| **Storefront Inline Editing Lifecycle** | `/skills/storefront-inline-editing/SKILL.md` |
| **Storefront Page Creation Workflow** | `/skills/storefront-page/SKILL.md` |
| **UI Component Creation Workflow** | `/skills/ui-component/SKILL.md` |
| **DRF API Endpoint Integration** | `/skills/api-integration/SKILL.md` |
| **SEO Strategy Verification Workflow** | `/skills/seo/SKILL.md` |
