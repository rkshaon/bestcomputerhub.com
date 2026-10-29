// File: /types/seo.ts

/**
 * One indexable entity returned by `GET /api/v1/seo/sitemap-urls/`.
 * `lastmod` is an ISO 8601 timestamp with timezone.
 */
export interface SitemapUrlRecord {
  slug: string;
  lastmod: string;
}

/**
 * Response of `GET /api/v1/seo/sitemap-urls/`. The backend owns
 * indexability (active, not deleted, published, not `noindex`), and
 * always returns all four collections as arrays.
 */
export interface SitemapUrlsResponse {
  products: SitemapUrlRecord[];
  categories: SitemapUrlRecord[];
  brands: SitemapUrlRecord[];
  blogs: SitemapUrlRecord[];
}
