# DRF API Integration

## Use when

Use this skill when integrating or modifying communication
with a Django REST Framework endpoint.

## Workflow

1. Identify the exact backend endpoint.
2. Inspect/confirm request parameters.
3. Inspect/confirm response structure.
4. Define or reuse typed API contracts.
5. Determine whether mapping to a UI/domain model is needed.
6. Add the operation to the appropriate domain service.
7. Route HTTP communication through useApiClient.
8. Handle expected API errors.
9. Integrate loading/error/empty states.
10. Verify SSR compatibility where applicable.
11. Type-check and build.

## Rules

Never guess API fields.

Never send multiple parameter aliases hoping one works.

Never use `any` as the default API response type.

Never duplicate JWT refresh logic inside domain services.

Never fabricate missing backend commerce values.

Always preserve DRF trailing slashes.

Always verify user permissions via `useAdminPermissions()` before invoking protected admin endpoints to prevent unauthorized request execution and unnecessary 403 API errors.

