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
