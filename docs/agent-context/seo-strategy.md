# Best Computer Hub — SEO Strategy

This document defines the SEO architecture and implementation principles for the Best Computer Hub Nuxt frontend.

Best Computer Hub is being migrated from an existing WordPress/WooCommerce website to a Nuxt 4 frontend backed by Django REST Framework.

SEO preservation and improvement are primary requirements of the migration.

---

## 1. SEO Goals

The frontend should be designed to:

1. Preserve existing organic search visibility during migration.
2. Preserve valuable existing WordPress URLs whenever practical.
3. Prevent accidental loss of indexed pages.
4. Provide search engines with server-rendered, crawlable content.
5. Generate accurate metadata from real backend content.
6. provide structured data where appropriate.
7. prevent duplicate-content and canonicalization problems.
8. maintain strong technical SEO and Core Web Vitals.
9. support future catalog growth without manual SEO work for every page.

SEO must be considered part of storefront architecture, not an afterthought added after UI development.

---

## 2. SEO-Sensitive Routes

The following public page types should be treated as SEO-sensitive by default:

```text
Homepage

Product pages
Category pages
Brand pages
Product-category pages

Blog listing
Blog articles

About
Careers
Sustainability

Help Center
Shipping
Returns
Warranty

Privacy Policy
Terms
Cookie Policy

Offers
New Arrivals
```

Not every page necessarily needs to be indexed.

Indexability should be decided based on the purpose and content quality of the route.

Administrative and customer-private pages must not be treated as SEO landing pages.

---

## 3. Server Rendering

Public SEO-sensitive pages should provide meaningful content during server rendering.

Do not depend exclusively on client-side lifecycle hooks such as:

```ts
onMounted()
```

to load primary indexable page content.

Preferred conceptual flow:

```text
Search Engine / Browser
        ↓
Nuxt Route
        ↓
Server-side Data Fetching
        ↓
DRF
        ↓
Rendered Product / Category / Content
        ↓
HTML Response
```

Primary page content should be available in the server-rendered response whenever practical.

This is especially important for:

* product names
* descriptions
* pricing
* availability
* category content
* brand content
* breadcrumbs
* article content
* SEO metadata

Interactive functionality may hydrate and continue on the client after server rendering.

---

## 4. Data Fetching

SEO-sensitive route data should use Nuxt-compatible server-aware data fetching.

Depending on the implementation, use appropriate Nuxt patterns such as:

```text
useAsyncData
useFetch
```

or server-compatible domain services built on the project's centralized API infrastructure.

Do not create separate inconsistent HTTP implementations solely for SEO pages.

Data fetching should remain compatible with the project's intended architecture:

```text
Page
  ↓
Domain Service
  ↓
useApiClient
  ↓
DRF
```

When adapting `useApiClient` or domain services for SSR, preserve this architectural boundary where practical.

---

## 5. Dynamic Routes

Dynamic catalog routes must resolve their data before SEO metadata is finalized.

Examples:

```text
/product/[slug]

/category/[slug]

/product-category/[...slug]

/brand/[slug]

/blog/[slug]
```

SEO metadata must be derived from the resolved entity rather than generic placeholder values.

For example:

```text
/product/logitech-g102/
        ↓
Fetch product
        ↓
Resolve SEO information
        ↓
Render HTML + metadata
```

---

## 6. Page Titles

Every indexable page should have a meaningful and unique title.

Product titles should normally be derived from real product data.

Category titles should reflect the category.

Blog titles should reflect the article.

Avoid using one generic title across many routes.

Do not invent product attributes solely to make titles longer or more keyword-rich.

Where the backend provides explicit SEO title fields, prefer those fields according to the established API contract.

Otherwise, generate titles from trusted page/domain data using a consistent frontend convention.

---

## 7. Meta Descriptions

Indexable pages should provide useful meta descriptions where appropriate.

Descriptions should accurately represent the page.

Preferred sources may include:

1. explicit backend SEO description
2. appropriate entity summary/excerpt
3. carefully derived description from trusted entity content

Never fabricate:

* specifications
* discounts
* warranty claims
* certifications
* stock claims
* shipping promises

for SEO descriptions.

Do not fill missing SEO metadata with invented commercial information.

---

## 8. Nuxt SEO Metadata

Use Nuxt-supported head/SEO mechanisms.

Prefer:

```ts
useSeoMeta()
```

for standard SEO metadata.

Use:

```ts
useHead()
```

when additional head elements are required, such as canonical links or structured data.

Typical metadata may include:

```text
title
description

ogTitle
ogDescription
ogImage
ogType
ogUrl

twitterCard
twitterTitle
twitterDescription
twitterImage
```

Only provide metadata supported by actual page data.

---

## 9. Canonical URLs

Every indexable page should have a deliberate canonical strategy.

Canonical URLs should use the production application origin configured through:

```text
runtimeConfig.public.appUrl
```

Do not hard-code development domains such as:

```text
localhost
127.0.0.1
```

into canonical metadata.

Canonical URLs should represent the preferred public URL for the content.

Example:

```text
https://bestcomputerhub.com/product/example-product/
```

The exact route structure should follow the final migration URL strategy.

---

## 10. WordPress Migration

Best Computer Hub already exists as a WordPress/WooCommerce website.

Existing URLs may already:

* be indexed by search engines
* receive organic traffic
* have backlinks
* appear in search results
* carry historical ranking signals

Do not casually change existing public URL structures during the Nuxt migration.

Before replacing an existing WordPress route:

```text
Identify old URL
        ↓
Determine new equivalent
        ↓
Can URL be preserved?
   ↓              ↓
 Yes              No
  ↓                ↓
Keep URL        Permanent redirect
```

Preserving a good existing URL is generally preferable to creating an unnecessary new one.

---

## 11. Redirect Strategy

When an existing indexed WordPress URL cannot be preserved, define an intentional permanent redirect to the most relevant new page.

Typical migration mapping:

```text
Old WordPress URL
        ↓
301
        ↓
Equivalent Nuxt URL
```

Do not redirect every removed page to the homepage.

Redirect to the closest meaningful replacement.

Examples:

```text
Old product
    → replacement/current product when appropriate

Old category
    → equivalent new category

Renamed page
    → new page URL
```

If no meaningful equivalent exists, handle removal intentionally rather than creating misleading redirects.

A redirect inventory should be prepared before production migration.

---

## 12. URL Stability

Once the new storefront is live, avoid unnecessary URL changes.

Stable URLs are especially important for:

* products
* categories
* brands
* blog posts
* important landing pages

Slug changes should be treated as SEO-impacting operations.

If a published slug changes, the system should support redirecting the previous URL where appropriate.

---

## 13. Query Parameters

Query parameters used for application state require careful SEO treatment.

Examples:

```text
?search=keyboard

?page=2

?ordering=price

?brand=logitech

?min_price=1000
```

Not every combination should become a separately indexable page.

Filtering and sorting can create a very large number of near-duplicate URLs.

Do not automatically treat every query-parameter combination as a unique SEO landing page.

Canonicalization and indexability for filtered pages should follow an intentional strategy.

Administrative URL query parameters are not relevant to public SEO.

---

## 14. Product Pages

Product pages are high-priority SEO pages.

A product page should provide server-renderable:

* product name
* product description
* product images
* price when publicly available
* availability when publicly available
* brand
* category context
* specifications
* breadcrumbs
* real ratings/review summary when available

Product pages should also provide appropriate metadata and structured data.

Never fabricate product information for SEO purposes.

---

## 15. Product Structured Data

Where valid data exists, product pages should support Product structured data.

Potential properties include:

```text
name
description
image
sku
brand
offers
aggregateRating
review
```

Only include properties when the corresponding real data exists and the implementation is valid.

For example:

```text
Real rating data exists
        ↓
AggregateRating may be emitted
```

but:

```text
No real rating data
        ↓
Do not invent AggregateRating
```

The same rule applies to reviews, price, availability, SKU, and brand.

Structured data must describe visible/real page content.

---

## 16. Offer Structured Data

Product offer data may include:

* price
* price currency
* availability
* product URL

These values must come from authoritative commerce data.

Do not generate a structured-data price from placeholder or mock frontend values.

Availability should map from actual backend-supported inventory/availability states.

---

## 17. Breadcrumbs

Important hierarchical pages should provide visible breadcrumbs where useful.

Example:

```text
Home
  →
Laptops
  →
Gaming Laptops
  →
Product
```

Breadcrumb hierarchy should reflect the actual catalog structure.

Where appropriate, provide corresponding `BreadcrumbList` structured data.

Do not maintain a separate fake breadcrumb hierarchy only for search engines.

Visible navigation and structured data should remain consistent.

---

## 18. Category Pages

Category pages should be capable of acting as useful organic landing pages.

A category page may include:

* category name
* category description
* product listing
* subcategories
* filters
* breadcrumbs
* SEO metadata

Category pages should not become thin pages containing only a product grid when meaningful category content is available.

Category hierarchy should come from backend catalog data.

---

## 19. Brand Pages

If dedicated brand pages exist, they may contain:

* brand name
* logo
* description
* products
* breadcrumbs
* SEO metadata

Only create indexable brand pages when they provide meaningful customer value.

Avoid generating large numbers of empty or near-empty brand pages.

---

## 20. Product Listing Pagination

Large product collections may require pagination.

Pagination must remain crawlable and usable without requiring client-only interaction.

Do not create an SEO architecture where search engines can only discover products by clicking JavaScript-only infinite-scroll controls.

Infinite scroll may be used for user experience, but crawlable pagination or another discoverable URL strategy should exist where required.

---

## 21. Search Results

Internal site-search pages require deliberate indexability handling.

URLs such as:

```text
/search?q=keyboard
```

should not automatically become SEO landing pages.

Internal search can create effectively unlimited low-quality URL combinations.

The indexability strategy for search results should be intentionally configured rather than left to accidental crawler discovery.

---

## 22. Offers and Filtered Landing Pages

Promotional and filtered pages may be indexable when they are intentionally created as valuable landing pages.

Examples might include:

```text
Gaming Laptop Offers
New Arrivals
Specific Campaign Landing Page
```

Do not make arbitrary filter combinations indexable simply because they produce a URL.

SEO landing pages should be intentional.

---

## 23. Blog

Blog content should support:

* unique title
* meta description
* canonical URL
* Open Graph metadata
* article image
* author information when appropriate
* publication date
* breadcrumbs
* structured data where valid

Article content should be available during server rendering.

Blog slugs should remain stable after publication whenever practical.

---

## 24. Static and Support Content

Important informational pages should have appropriate metadata.

Examples:

```text
About
Shipping
Returns
Warranty
Help Center
Privacy Policy
Terms
```

These pages may contribute to trust, customer support, and overall site quality.

Do not use the same generic title and description for all support pages.

---

## 25. Structured Data

Structured data should be generated only where the page and available data support it.

Potential schema types may include:

```text
Organization
WebSite
Product
Offer
BreadcrumbList
Article
FAQPage
```

Schema selection should match actual page content.

Do not add schema solely because it might produce a search feature.

Never put fabricated business data into JSON-LD.

---

## 26. Organization Data

Site-wide organization information should come from a stable trusted configuration or backend source.

Potential information may include:

* business name
* website URL
* logo
* contact information
* social profiles

Do not invent company contact information or social URLs.

---

## 27. Open Graph

Important public pages should provide useful social-sharing metadata.

Typical fields include:

```text
og:title
og:description
og:image
og:url
og:type
```

Product pages should normally use a real product image when available.

Blog pages should normally use the article's primary image when available.

Provide an intentional site-wide fallback image only when one has actually been defined for the project.

---

## 28. Images and SEO

Images should:

* use meaningful alt text
* avoid unnecessary layout shift
* use appropriate dimensions
* be optimized for web delivery
* use responsive loading strategies where appropriate

Product image alt text should describe the actual product/image.

Do not keyword-stuff alt attributes.

For example, prefer:

```text
Logitech G102 Lightsync Gaming Mouse
```

over:

```text
best cheap gaming mouse Bangladesh buy Logitech mouse
```

Image optimization should not destroy image quality required for customers to evaluate products.

---

## 29. Performance and Core Web Vitals

SEO and performance are closely related.

Public storefront pages should minimize:

* unnecessary JavaScript
* layout shift
* render-blocking resources
* oversized images
* unnecessary third-party scripts
* excessive client-side fetching

Pay particular attention to:

```text
LCP
CLS
INP
```

Large hero images and primary product images should have deliberate loading behavior.

Do not lazy-load critical above-the-fold images without considering LCP.

Below-the-fold listing images may generally use lazy loading.

---

## 30. Internal Linking

Important pages should be discoverable through normal internal links.

Use `NuxtLink` for internal application navigation where appropriate.

Examples of useful internal relationships include:

```text
Homepage
    → Categories

Category
    → Subcategories
    → Products

Product
    → Category
    → Brand
    → Related Products

Blog
    → Related Articles
    → Relevant Catalog Pages
```

Do not depend exclusively on sitemap discovery for important pages.

---

## 31. Sitemap

The production application should provide XML sitemap support.

Sitemap content should reflect canonical public pages.

Potential sitemap entities include:

* products
* categories
* brands
* blog articles
* important static pages

Do not include:

* admin pages
* authenticated account pages
* cart
* checkout
* arbitrary search results
* unwanted filter combinations

The sitemap should use production canonical URLs.

---

## 32. Robots

The application should provide a deliberate `robots.txt` configuration.

Production robots behavior must differ appropriately from staging/development environments.

Staging environments should not accidentally become indexed.

Production configuration must not accidentally block important catalog pages.

Changes to robots rules should be treated as SEO-sensitive changes.

---

## 33. Noindex Pages

Some routes generally should not be search landing pages.

Examples may include:

```text
/login
/signup
/forgot-password

/account

/cart
/checkout

/admin/*

customer-specific pages
internal search results
```

The exact noindex strategy should be implemented deliberately.

Authentication alone should not be relied upon as the only indexing strategy for public-but-unwanted routes.

---

## 34. HTTP Status Codes

SEO-sensitive routes must return meaningful HTTP status codes.

Examples:

```text
Existing product
    → 200

Missing product
    → 404

Permanently moved page
    → 301

Unexpected server failure
    → appropriate 5xx
```

Do not render a friendly "Product not found" page while returning HTTP `200`.

Soft 404s should be avoided.

---

## 35. Product Removal

When products are removed, choose behavior intentionally.

Possible cases include:

```text
Temporarily unavailable
    → keep product page when useful

Discontinued but still valuable
    → potentially keep informational page

Replaced by another product
    → potentially redirect when appropriate

Removed with no replacement/value
    → appropriate removal response
```

Do not automatically redirect every unavailable product to the homepage or category.

The correct behavior depends on business and SEO value.

---

## 36. SEO Data Source

Where possible, backend entities may eventually provide explicit SEO fields such as:

```text
seo_title
seo_description
canonical_url
```

The exact fields must follow the real DRF contract.

Do not assume these fields exist until the backend implements them.

When explicit SEO data does not exist, the frontend may derive appropriate metadata from trusted domain fields.

---

## 37. SEO and Mock Data

Mock/demo data must never leak into production SEO metadata or structured data.

This includes:

* fake ratings
* fake prices
* fake reviews
* fake stock
* fake specifications
* placeholder descriptions
* fake product images
* fake brand information

SEO output must be based on real production data.

---

## 38. SEO and Error Handling

SEO-sensitive data-fetching failures must be handled intentionally.

Conceptually:

```text
DRF 404
    → Nuxt 404

DRF unexpected failure
    → appropriate application/server error

Valid empty collection
    → normal empty-state page when appropriate
```

Do not convert every API failure into a successful empty page.

---

## 39. Environment Safety

SEO output must respect the current environment.

Production should use:

```text
https://bestcomputerhub.com
```

or the configured production `appUrl`.

Development and staging environments must not accidentally generate production-looking canonical URLs unless intentionally configured for testing.

Likewise, staging should not accidentally become independently indexable.

---

## 40. SEO Implementation Principle

When creating or modifying an SEO-sensitive page, follow this conceptual sequence:

```text
Identify route
      ↓
Determine indexability
      ↓
Fetch authoritative data
      ↓
Handle 404/errors
      ↓
Render meaningful server HTML
      ↓
Set title and description
      ↓
Set canonical
      ↓
Set Open Graph metadata
      ↓
Add valid structured data
      ↓
Verify internal links
      ↓
Verify performance
      ↓
Consider legacy WordPress URL impact
```

Detailed implementation procedures belong in the project's SEO skill.

This document defines the strategy and business expectations.

---

## 41. Migration Principle

The WordPress-to-Nuxt migration must prioritize preservation before optimization.

Use this order:

```text
Preserve existing SEO value
        ↓
Establish correct Nuxt rendering
        ↓
Establish canonical URLs
        ↓
Establish redirects
        ↓
Validate indexing behavior
        ↓
Improve metadata/content
        ↓
Optimize performance
        ↓
Expand SEO features
```

Do not redesign URL structures merely because a different route structure looks cleaner in code.

Existing search value is a business asset.

---

## 42. Final SEO Rule

For every public storefront feature, ask:

```text
Can search engines access the content?

Is the important content server-rendered?

Is the URL canonical and stable?

Does the page return the correct HTTP status?

Is metadata based on real data?

Is structured data accurate?

Could this create duplicate URLs?

Does this change an existing WordPress URL?

Does this introduce fake commerce information?

Does the page perform well?
```

SEO decisions should protect customer experience and existing search visibility while enabling the Nuxt storefront to improve over time.
