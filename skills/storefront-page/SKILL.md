---

name: storefront-page
description: Standard workflow for building and modifying public Best Computer Hub storefront pages in Nuxt.
------------------------------------------------------------------------------------------------------------

<!-- File: /skills/storefront-page/SKILL.md -->

# Storefront Page

## Use When

Use this skill when creating or substantially modifying a public customer-facing page.

Examples:

* homepage
* product detail page
* product listing page
* category page
* brand page
* search results
* offers
* new arrivals
* blog pages
* public content/support pages

## Workflow

1. Identify the route and page responsibility.
2. Inspect existing related pages, components, services, and types.
3. Identify the authoritative DRF data required by the page.
4. Confirm the API contract.
5. Define or reuse the required TypeScript types.
6. Fetch data through the appropriate domain service.
7. Use SSR-compatible data fetching for SEO-sensitive primary content.
8. Handle loading, empty, error, and 404 states where applicable.
9. Keep the page focused on route-level orchestration and extract meaningful UI sections into components.
10. Implement responsive and accessible behavior.
11. Apply the project's SEO requirements.
12. Consider existing WordPress URL impact when changing public routes.
13. Run type-checking and build validation.

## Rules

* Keep route files reasonably thin.
* Do not place shared HTTP infrastructure directly in pages.
* Use existing domain services and `useApiClient`.
* Do not guess DRF fields, query parameters, or response structures.
* Do not use `any` to hide uncertain API contracts.
* Do not fabricate prices, discounts, stock, ratings, reviews, specifications, or other commerce data.
* DRF remains authoritative for commerce-critical data and business rules.
* Primary SEO-sensitive content must not depend exclusively on client-side `onMounted()` fetching.
* Admin pages (as distinguished from public storefront pages) must enforce permission checks via `useAdminPermissions()` and route middleware, preventing unauthorized access.
* Return a real 404 when a requested public entity does not exist.
* Use existing design-system components and semantic tokens where appropriate.
* Important actions must remain usable on mobile and by keyboard.
* Do not change established public URLs without considering the WordPress-to-Nuxt SEO migration.
* Storefront search and filter interactions must not issue API requests per keystroke; use shared debouncing mechanisms (e.g. `refDebounced` with 300ms delay) to keep typing responsive while optimizing server request frequency.
* Do not introduce large unrelated architectural refactors while implementing a page.

## Relevant Context

Refer to:

* `/docs/agent-context/architecture.md`
* `/docs/agent-context/ecommerce-domain.md`
* `/docs/agent-context/design-system.md`
* `/docs/agent-context/seo-strategy.md`

For API-heavy work, also use the `api-integration` skill.

For substantial SEO work, also use the `seo` skill.
