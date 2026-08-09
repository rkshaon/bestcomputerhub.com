# API Conventions

Backend: Django REST Framework.

Base API namespace:

/api/v1/

All endpoints use trailing slashes.

Examples:

GET    /api/v1/products/
GET    /api/v1/products/{id-or-slug}/
POST   /api/v1/products/
PATCH  /api/v1/products/{id}/
DELETE /api/v1/products/{id}/

## Pagination

Use:

PaginatedResponse<T>

Do not create domain-specific pagination wrappers unless
the backend contract genuinely differs.

## Contract Integrity

Do not send multiple guessed aliases such as:

search + query + q

or:

min_price + minPrice

Use the actual backend contract.

Do not silently accept arbitrary alternative response
structures in production code.

## Authentication & Permission Enforcement

Authenticated requests utilize JWT Bearer tokens attached via `useApiClient`.
Backend permissions returned from `GET /api/v1/users/me/` represent the authoritative authorization source for admin operations.
The frontend MUST verify permission via `useAdminPermissions()` before dispatching protected API requests to prevent unauthorized API calls and unexpected 403 errors.

## Search and Filter Debouncing

All user-input-driven search and filter requests must be debounced by default at the query or component layer (using `@vueuse/core`'s `refDebounced` with a 300ms delay).
- Local input state updates immediately on every keystroke.
- Downstream API query state and requests are debounced.
- The central HTTP client (`useApiClient`) must never own debounce logic.

## Demand-Driven API Calling

The application must not make API requests unless the data is required by the current user action, page, component, or workflow.
- **Verify Data Requirement**: Before adding or dispatching an API call, verify if the data is actually needed at this moment.
- **Reuse Existing Data**: If the data is already available in props, component state, stores, or service state, reuse it instead of re-fetching.
- **Defer Workflow Data**: Auxiliary dataset queries (such as modal dropdown options or full entity details) must be fetched when the user triggers that specific workflow (e.g. opening a modal), not on component mount or page load.
- **Avoid Side-Effects**: Prevent unintended API calls caused prematurely by component mounting, watchers, reactive state updates, or dialog setup.

