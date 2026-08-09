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

### 1. Reusable Infinite Pagination (`useInfinitePagination`)
All paginated selectors and infinite-scroll collections must use `useInfinitePagination<T>()` from `/composables/useInfinitePagination.ts` and `<UiInfiniteScroll />` from `/components/ui/UiInfiniteScroll.vue`.
- Features built-in deduplication, DRF pagination handling, loading states, search resets, and IntersectionObserver scroll triggering.

### 2. URL-Driven Admin Modal State (`useAdminModalState` & `<UiAdminModal />`)
All admin CRUD dialogs (Create/Edit/View/Delete) must synchronize their state directly with route query parameters using `useAdminModalState<T>()` from `/composables/useAdminModalState.ts` and `<UiAdminModal />` from `/components/ui/UiAdminModal.vue`.
- Standard URL query format: `?modal=create`, `?modal=edit&id=15`, `?modal=view&id=15`, `?modal=delete&id=15`.
- **Single Source of Truth**: The URL drives modal visibility and entity resolution. Opens, closes, reloads, and browser Back/Forward navigation automatically stay synchronized.
- **Unified Dismissal Flow**: All close triggers (Cancel button, Close 'X' button, clicking backdrop/outside area, and Escape key) must call the same canonical `closeModal()` method to clear query parameters and restore URL state.
- **UI Container Requirement**: All admin modals must wrap their markup in `<UiAdminModal>` to enforce consistent z-indexing, backdrop blur, mousedown-outside tracking, and keyboard accessibility.

### 4. Global Search & Filter Debouncing
All user-input-driven API searches and filters must be debounced by default using `@vueuse/core`'s `refDebounced` (standard 300ms delay).
- **Separation of Concerns**: Immediate local input state must remain responsive on every keystroke, while the API query state must be debounced.
- **Architectural Placement**: Debounce belongs at the query/composable/component layer (e.g. `useInfinitePagination`, storefront listings, admin tables), never inside the central `useApiClient` HTTP client or via global request interceptors.
- **Exemptions**: Explicit actions (e.g. clicking 'Apply Filters', 'Save', pagination buttons, page initial loads, mutations) must remain immediate.

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
