---

name: seo
description: Standard workflow for implementing and modifying SEO-sensitive public pages in the Best Computer Hub Nuxt frontend.
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
* metadata
* canonical URLs
* structured data
* sitemap
* robots configuration
* WordPress migration redirects

## Workflow

1. Identify the page type and route.
2. Determine whether the page should be indexable.
3. Check whether an equivalent URL exists on the current WordPress site.
4. Preserve the existing public URL where practical.
5. Ensure primary indexable content is server-renderable.
6. Fetch authoritative page data before generating dynamic metadata.
7. Set the page title and meta description.
8. Set the canonical URL.
9. Add appropriate Open Graph and social metadata.
10. Add valid structured data where applicable.
11. Handle breadcrumbs and internal linking where appropriate.
12. Verify 404 and redirect behavior.
13. Check for duplicate URL risks from query parameters.
14. Consider sitemap and robots implications.
15. Verify applicable performance and image-loading concerns.
16. Run type-checking and build validation.

## Rules

* Follow `/docs/agent-context/seo-strategy.md`.
* Do not make primary SEO content depend exclusively on client-side `onMounted()` fetching.
* Use Nuxt-supported SEO/head APIs such as `useSeoMeta()` and `useHead()`.
* Generate dynamic metadata from resolved authoritative data.
* Do not hard-code development origins into canonical URLs.
* Use the configured production application URL for canonical generation.
* Do not fabricate SEO content, commerce data, ratings, reviews, prices, stock, specifications, or business claims.
* Structured data must describe real page content.
* Do not emit `AggregateRating` when real eligible rating data does not exist.
* Do not emit fake reviews or offers for structured data.
* Return a real 404 for missing public entities.
* Do not convert missing resources into successful `200` pages.
* Do not change established public URLs without considering migration impact.
* Use permanent redirects when an existing indexed URL must move to a meaningful replacement.
* Do not redirect unrelated removed pages to the homepage by default.
* Avoid creating uncontrolled indexable URLs from filters, sorting, search, and query parameters.
* Do not expose admin, account, cart, checkout, or other private/utility pages as SEO landing pages.
* Do not allow mock/demo data to appear in production metadata or JSON-LD.

## Metadata

For applicable indexable pages, consider:

```text
title
description
canonical

og:title
og:description
og:image
og:url
og:type

twitter:card
twitter:title
twitter:description
twitter:image
```

Only include metadata supported by real page data.

## Structured Data

Use schema types only when appropriate to the page.

Examples:

```text
Product
Offer
BreadcrumbList
Article
Organization
WebSite
FAQPage
```

Typical product relationship:

```text
Product
├── Brand
├── Offer
├── AggregateRating
└── Review
```

Include optional properties only when valid real data exists.

## WordPress Migration

For existing public URLs, follow:

```text
Existing WordPress URL
        ↓
Can it be preserved?
   ↓             ↓
 Yes             No
  ↓               ↓
Keep URL      Map old URL
                   ↓
             301 redirect
                   ↓
            Relevant Nuxt URL
```

SEO preservation takes priority over creating cleaner-looking route structures.

## Query Parameters

Treat URLs created by:

* search
* sorting
* filtering
* pagination

deliberately.

Do not assume every parameter combination should be indexed.

Avoid accidental duplicate-content generation.

Follow the canonical/indexability strategy defined for the page type.

## Technical Checks

For applicable SEO-sensitive pages, verify:

* server-rendered primary content
* correct HTTP status
* unique title
* useful description
* canonical URL
* Open Graph metadata
* structured data validity
* breadcrumb consistency
* meaningful internal links
* image alt text
* image loading behavior
* crawlable pagination where needed
* no accidental duplicate URLs
* no mock data in SEO output

## Relevant Context

Refer to:

* `/docs/agent-context/seo-strategy.md`
* `/docs/agent-context/ecommerce-domain.md`
* `/docs/agent-context/architecture.md`

For complete storefront page implementation, also use the `storefront-page` skill.

For DRF-backed SEO data integration, also use the `api-integration` skill.
