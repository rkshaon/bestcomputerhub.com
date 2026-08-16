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

### Paginated Filter Options Standard

All filter option endpoints across Admin, Storefront, and reusable filter components that return paginated responses (`PaginatedResponse<T>`) must follow the project-wide infinite-scroll filter standard:
- Check `next` to evaluate whether subsequent option pages exist.
- Load the next page when scrolling reaches the end of current options and append results to the existing option list (never overwrite loaded options).
- Terminate pagination when `next` is `null` (do not dispatch requests when `next` is `null`).
- Prevent concurrent or duplicate in-flight requests for the same next page.
- Preserve already-loaded options upon filter close/reopen where component state lifecycle permits.
- Enforce demand-driven loading: do not fetch filter options until the filter is opened or activated by the user.
- Debounce search queries (standard 300ms delay via `refDebounced`) when option searching is enabled.

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

## Centralized Error Message Handling

All HTTP errors (`400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`, etc.) must be processed centrally through `useApiClient` and the centralized toast error handler (`handleApiError` / `extractErrorMessage` in `useToast.ts`).
- **Centralized Handling**: Components and domain services delegate error message formatting and toast presentation to the centralized layer rather than manually parsing response structures in individual feature code.
- **Backend Message Extraction**: The error handler inspects backend API error responses and extracts the user-facing message supplied by DRF (e.g. `detail`, `message`, `error`, `non_field_errors`, or field-level validation errors).
- **Fallback Behavior**: When the backend API response does not include a usable error message, the handler falls back to a clean, user-friendly default message (e.g. "An unexpected error occurred.").
- **No Technical Leakage**: Toasts and user notifications must never expose raw technical request signatures, request URLs, HTTP method names, or status code strings (such as `[POST] "...": 403 Forbidden`).


