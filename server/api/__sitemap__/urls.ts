// File: /server/api/__sitemap__/urls.ts
//
// Dynamic sitemap source for @nuxtjs/sitemap (registered in nuxt.config.ts
// under `sitemap.sources`). Maps the backend's indexable products,
// categories, brands and blog posts to canonical storefront URLs.
//
// The backend decides what is indexable; this handler only validates the
// payload and builds paths. It runs server-side only, so it uses `$fetch`
// with the shared `apiBase` instead of the browser-oriented `useApiClient`.
import { createError } from 'h3';
import { defineSitemapEventHandler } from '#sitemap/server';
import type { SitemapUrlInput } from '#sitemap/types';
import type { SitemapUrlRecord, SitemapUrlsResponse } from '~~/types/seo';

const SITEMAP_URLS_ENDPOINT = '/api/v1/seo/sitemap-urls/';
const BACKEND_TIMEOUT_MS = 15000;

// Canonical storefront route prefix per backend collection.
// Every path ends with a trailing slash (AGENTS.md §9).
const COLLECTION_ROUTES: Record<keyof SitemapUrlsResponse, string> = {
  products: '/product/',
  categories: '/product-category/',
  brands: '/brand/',
  blogs: '/blog/'
};

const COLLECTION_PRIORITIES: Record<keyof SitemapUrlsResponse, 0 | 0.8 | 0.7 | 0.6 | 1 | 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.9 | undefined> = {
  products: 0.8,
  categories: 0.8,
  brands: 0.7,
  blogs: 0.6
};

const COLLECTION_CHANGEFREQ: Record<keyof SitemapUrlsResponse, 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' | undefined> = {
  products: 'weekly',
  categories: 'weekly',
  brands: 'weekly',
  blogs: 'monthly'
};

// A single path segment: letters (with combining marks, e.g. Bengali vowel
// signs), digits, `-`, `_`, or an already percent-encoded byte (legacy
// WordPress slugs such as `27%e2%80%b3`).
const SLUG_PATTERN = /^(?:[\p{L}\p{M}\p{N}_-]|%[0-9A-Fa-f]{2})+$/u;

// Last successful result, served while the backend is unavailable so one
// outage does not publish (and cache) a sitemap without catalog URLs.
let lastKnownGood: SitemapUrlInput[] | null = null;

const toEncodedSegment = (slug: unknown): string | null => {
  if (typeof slug !== 'string') return null;
  const trimmed = slug.trim();
  if (!trimmed || !SLUG_PATTERN.test(trimmed)) return null;
  try {
    // Reject malformed escapes such as `%e2%80` (truncated UTF-8).
    decodeURIComponent(trimmed);
  } catch {
    return null;
  }
  // Keep existing escapes byte-for-byte (legacy URL parity); encode only
  // raw non-ASCII letters and digits.
  return trimmed.replace(/[^%A-Za-z0-9_-]/gu, char => encodeURIComponent(char));
};

const toLastmod = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || !value) return undefined;
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString() : undefined;
};

const isSitemapUrlsResponse = (data: unknown): data is SitemapUrlsResponse => {
  if (!data || typeof data !== 'object') return false;
  const record = data as Record<string, unknown>;
  return (Object.keys(COLLECTION_ROUTES) as (keyof SitemapUrlsResponse)[])
    .every(key => Array.isArray(record[key]));
};

const buildEntries = (data: SitemapUrlsResponse): SitemapUrlInput[] => {
  const seen = new Set<string>();
  const entries: SitemapUrlInput[] = [];

  for (const [collection, prefix] of Object.entries(COLLECTION_ROUTES)) {
    const records = data[collection as keyof SitemapUrlsResponse] as unknown[];

    for (const record of records) {
      if (!record || typeof record !== 'object') continue;
      const { slug, lastmod } = record as Partial<SitemapUrlRecord>;

      const segment = toEncodedSegment(slug);
      if (!segment) continue;

      const loc = `${prefix}${segment}/`;
      if (seen.has(loc)) continue;
      seen.add(loc);

      const entryLastmod = toLastmod(lastmod);
      const priority = COLLECTION_PRIORITIES[collection as keyof SitemapUrlsResponse];
      const changefreq = COLLECTION_CHANGEFREQ[collection as keyof SitemapUrlsResponse];
      entries.push({
        loc,
        priority,
        changefreq,
        // `loc` is already percent-encoded; stop the module encoding it again.
        _encoded: true,
        ...(entryLastmod ? { lastmod: entryLastmod } : {})
      });
    }
  }

  return entries;
};

export default defineSitemapEventHandler(async () => {
  const config = useRuntimeConfig();
  const apiBase = String(config.public.apiBase || '').replace(/\/+$/, '');

  try {
    if (!apiBase) {
      throw new Error('runtimeConfig.public.apiBase is not configured');
    }

    const data = await $fetch<unknown>(`${apiBase}${SITEMAP_URLS_ENDPOINT}`, {
      timeout: BACKEND_TIMEOUT_MS,
      retry: 1,
      headers: { Accept: 'application/json' }
    });

    if (!isSitemapUrlsResponse(data)) {
      throw new Error('Malformed sitemap-urls response');
    }

    lastKnownGood = buildEntries(data);
    return lastKnownGood;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (lastKnownGood) {
      console.warn(`[sitemap] Backend sitemap-urls failed, serving last known entries: ${message}`);
      return lastKnownGood;
    }

    console.error(`[sitemap] Backend sitemap-urls failed: ${message}`);
    // The module treats a failed source as transient and does not cache it.
    throw createError({ statusCode: 502, statusMessage: 'Sitemap source unavailable' });
  }
});
