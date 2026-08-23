---

name: seo
description: Standard workflow for implementing and modifying SEO-sensitive public pages, sitemaps, and metadata in the Best Computer Hub Nuxt frontend.
--------------------------------------------------------------------------------------------------------------------------------

<!-- File: /skills/seo/SKILL.md -->

# SEO

## Use When

Use this skill when creating or substantially modifying SEO behavior for public storefront pages.

Examples:

* product pages
* category pages
* brand pages
* product listing pages
* blog articles
* landing pages
* public content pages
* metadata and `<title>`
* canonical URLs (trailing slash convention)
* structured data (JSON-LD)
* sitemap and sitemap-index coordination
* `robots.txt` configuration
* WordPress migration redirects

## Core Separation of Responsibilities

* **Frontend / Nuxt**: Owns page routing, SSR rendering, `<title>`, meta descriptions, canonical links, Open Graph/Twitter tags, JSON-LD structured data, and `/robots.txt`.
* **Backend / Django**: Owns XML sitemap generation, `/sitemap.xml` index, sub-sitemaps (`products`, `categories`, `blogs`), eligibility/indexability evaluation, `lastmod` timestamps, and centralized public URL resolution (`SITE_URL`, `PRODUCT_URL_PATTERN`, etc.).

> **Principle:** Frontend knows how a page is accessed. Backend knows which pages should be available to search engines.

## Page SEO Implementation Workflow

1. **Route & Indexability Evaluation**: Identify page type and determine if the route should be public/indexed or blocked (`noindex` for `/admin/*`, `/account/`, `/cart/`, search, filter facets).
2. **WordPress URL Continuity**: Check if an equivalent WordPress URL exists; preserve identical URL with trailing slash (`/`) where practical.
3. **SSR Data Fetching**: Ensure primary indexable content is server-renderable via Nuxt SSR data fetching (`useAsyncData` / server composables).
4. **Metadata & Head Tags**:
   - Set unique, authentic `<title>` and `<meta name="description">` using `useSeoMeta()`.
   - Set self-referencing canonical URL via `useHead()` or `useSeoMeta()` using the production `appUrl` and trailing slash.
   - Attach Open Graph and Twitter Card tags with valid imagery.
5. **Structured Data**: Inject valid JSON-LD schemas (`Product`, `Offer`, `BreadcrumbList`, `Article`, `Organization`) based strictly on authentic domain data without fabricating reviews, ratings, or stock.
6. **Internal Links & Breadcrumbs**: Ensure visible navigation, trailing-slash links, and structured breadcrumbs match catalog hierarchy.
7. **HTTP Status Codes**: Ensure valid pages return `200` and missing entities return real `404` (avoid soft-404s).
8. **Performance Verification**: Optimize image sizing, alt text, and critical above-the-fold asset loading (LCP/CLS).

## Sitemap Coordination Workflow

1. **Sitemap Index Structure**: Confirm sitemaps follow the index architecture (`/sitemap.xml` referencing `/sitemap-products.xml`, `/sitemap-categories.xml`, `/sitemap-blogs.xml`, etc.).
2. **Eligibility Enforcement**: Confirm the backend filters out deleted, draft, unpublished, `noindex`, or non-canonical items from XML sitemaps.
3. **URL Pattern Verification**: Ensure backend-generated sitemap URLs conform to the storefront URL patterns (including trailing slashes `/`).
4. **Excluded Route Auditing**: Ensure administrative, search query, faceted filter combinations, and customer-private pages are strictly omitted from all sitemaps.
5. **Robots Coordination**: Verify `/robots.txt` points to `Sitemap: https://bestcomputerhub.com/sitemap.xml`.

## WordPress Migration & Redirect Workflow

1. **URL Preservation**: Retain legacy slugs and routes whenever possible.
2. **Permanent Redirect Mapping**: When an indexed WordPress URL cannot be preserved, map it to the closest relevant replacement using a **301 redirect**.
3. **Intentional 404/410 Handling**: For permanently deleted products/pages without replacement, allow clean `404` responses rather than blanket-redirecting to the homepage.
4. **Chain Avoidance**: Ensure redirects resolve in a single 301 hop.

## Rules

* Follow `/docs/agent-context/seo-strategy.md`.
* Do not make primary SEO content depend exclusively on client-side `onMounted()` fetching.
* Use Nuxt-supported SEO/head APIs such as `useSeoMeta()` and `useHead()`.
* Generate dynamic metadata from resolved authoritative data.
* Enforce trailing slashes (`/`) on all storefront URLs, links, breadcrumbs, and canonical declarations.
* Do not hard-code development origins into canonical URLs; use `runtimeConfig.public.appUrl`.
* Do not fabricate SEO content, commerce data, ratings, reviews, prices, stock, specifications, or business claims.
* Structured data must describe real page content. Do not emit `AggregateRating` when real eligible rating data does not exist.
* Return a real 404 for missing public entities; never convert missing resources into successful `200` pages.
* Avoid creating uncontrolled indexable URLs from filters, sorting, search, and query parameters.
* Do not expose admin, account, cart, checkout, or other private/utility pages as SEO landing pages; admin pages must use `robots: 'noindex, nofollow'`.
* Do not allow mock/demo data to appear in production metadata or JSON-LD.

## Relevant Context

Refer to:

* `/docs/agent-context/seo-strategy.md`
* `/docs/agent-context/ecommerce-domain.md`
* `/docs/agent-context/architecture.md`

For complete storefront page implementation, also use the `storefront-page` skill.
For DRF-backed SEO data integration, also use the `api-integration` skill.
