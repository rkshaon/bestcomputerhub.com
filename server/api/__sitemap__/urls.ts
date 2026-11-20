// File: /server/api/__sitemap__/urls.ts
//
// Dynamic sitemap source for @nuxtjs/sitemap (registered in nuxt.config.ts
// under `sitemap.sources`). Combines the backend's indexable products,
// categories, brands, and blog posts with published CMS pages.
//
// The backend decides what is indexable; this handler only validates the
// payloads, normalizes paths, and deduplicates URLs. It runs server-side only,
// so it uses `$fetch` with the shared `apiBase` instead of the browser-oriented
// `useApiClient`.
import { createError } from 'h3';
import { defineSitemapEventHandler } from '#sitemap/server';
import type { SitemapUrlInput } from '#sitemap/types';
import type { CmsSitemapEntry } from '~~/types/cms';
import type { SitemapUrlRecord, SitemapUrlsResponse } from '~~/types/seo';

const SITEMAP_URLS_ENDPOINT = '/api/v1/seo/sitemap-urls/';
const CMS_SITEMAP_ENDPOINT = '/api/v1/cms/public/sitemap/';
const BACKEND_TIMEOUT_MS = 15000;

// Canonical storefront route prefix per backend collection.
// Every path ends with a trailing slash (AGENTS.md §9).
const COLLECTION_ROUTES: Record<keyof SitemapUrlsResponse, string> = {
  products: '/product/',
  categories: '/product-category/',
  brands: '/brand/',
  blogs: '/blog/'
};

type SitemapUrlObject = Exclude<SitemapUrlInput, string>;

const COLLECTION_PRIORITIES: Record<keyof SitemapUrlsResponse, SitemapUrlObject['priority']> = {
  products: 0.8,
  categories: 0.8,
  brands: 0.7,
  blogs: 0.6
};

const COLLECTION_CHANGEFREQ: Record<keyof SitemapUrlsResponse, SitemapUrlObject['changefreq']> = {
  products: 'weekly',
  categories: 'weekly',
  brands: 'weekly',
  blogs: 'monthly'
};

// A single path segment: letters (with combining marks, e.g. Bengali vowel
// signs), digits, `-`, `_`, or an already percent-encoded byte (legacy
// WordPress slugs such as `27%e2%80%b3`).
const SLUG_PATTERN = /^(?:[\p{L}\p{M}\p{N}_-]|%[0-9A-Fa-f]{2})+$/u;

// CMS paths may contain multi-segment slugs and occasional dots (excluding `.` / `..`).
const CMS_SEGMENT_PATTERN = /^(?:[\p{L}\p{M}\p{N}._-]|%[0-9A-Fa-f]{2})+$/u;
const HAS_SCHEME_PATTERN = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
const CONTROL_OR_SPACE_PATTERN = /[\x00-\x20\x7f]/;

// Last successful results cached separately so a transient CMS outage never
// degrades catalog/category/brand/blog entries, and a catalog outage falls
// back cleanly to cached catalog entries.
let lastKnownGoodCatalog: SitemapUrlInput[] | null = null;
let lastKnownGoodCms: SitemapUrlInput[] | null = null;

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
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString() : undefined;
};

const resolveAllowedHosts = (config: ReturnType<typeof useRuntimeConfig>): Set<string> => {
  const hosts = new Set<string>();
  const siteConfig = (config as { site?: { url?: unknown } }).site;
  const candidates = [
    config.public?.appUrl,
    (config.public as { siteUrl?: unknown } | undefined)?.siteUrl,
    siteConfig?.url,
    process.env.NUXT_PUBLIC_SITE_URL
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== 'string' || !candidate.trim()) continue;
    try {
      const parsed = new URL(candidate.trim());
      if (parsed.hostname) {
        hosts.add(parsed.hostname.toLowerCase());
      }
    } catch {
      // Ignore malformed runtime origin candidates
    }
  }

  return hosts;
};

const normalizeCmsLoc = (rawLoc: unknown, allowedHosts: Set<string>): string | null => {
  if (typeof rawLoc !== 'string') return null;
  const trimmed = rawLoc.trim();
  if (!trimmed || CONTROL_OR_SPACE_PATTERN.test(trimmed)) return null;

  // Reject protocol-relative URLs.
  if (trimmed.startsWith('//')) return null;

  let pathname = trimmed;

  if (HAS_SCHEME_PATTERN.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return null;
      }
      if (!allowedHosts.has(parsed.hostname.toLowerCase())) {
        return null;
      }
      pathname = parsed.pathname;
    } catch {
      return null;
    }
  } else {
    // Strip query string and fragment identifier from relative paths.
    const queryIdx = pathname.indexOf('?');
    if (queryIdx !== -1) pathname = pathname.slice(0, queryIdx);
    const hashIdx = pathname.indexOf('#');
    if (hashIdx !== -1) pathname = pathname.slice(0, hashIdx);
  }

  if (!pathname) return null;

  const rawSegments = pathname.split('/').filter(Boolean);
  if (rawSegments.length === 0) {
    return '/';
  }

  const encodedSegments: string[] = [];
  for (const segment of rawSegments) {
    if (!CMS_SEGMENT_PATTERN.test(segment)) {
      return null;
    }
    let decoded: string;
    try {
      decoded = decodeURIComponent(segment);
    } catch {
      return null;
    }
    if (decoded === '.' || decoded === '..') {
      return null;
    }
    encodedSegments.push(
      segment.replace(/[^%A-Za-z0-9._-]/gu, char => encodeURIComponent(char))
    );
  }

  return `/${encodedSegments.join('/')}/`;
};

const isSitemapUrlsResponse = (data: unknown): data is SitemapUrlsResponse => {
  if (!data || typeof data !== 'object') return false;
  const record = data as Record<string, unknown>;
  return (Object.keys(COLLECTION_ROUTES) as (keyof SitemapUrlsResponse)[])
    .every(key => Array.isArray(record[key]));
};

const extractCmsSitemapArray = (data: unknown): unknown[] | null => {
  return Array.isArray(data) ? data : null;
};

const buildCatalogEntries = (data: SitemapUrlsResponse): SitemapUrlInput[] => {
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

const buildCmsEntries = (records: unknown[], allowedHosts: Set<string>): SitemapUrlInput[] => {
  const seen = new Set<string>();
  const entries: SitemapUrlInput[] = [];

  for (const record of records) {
    if (!record || typeof record !== 'object') continue;
    const candidate = record as Partial<CmsSitemapEntry> & {
      live?: unknown;
      archived_at?: unknown;
    };

    if (
      candidate.seo_noindex === true ||
      candidate.live === false ||
      Boolean(candidate.archived_at)
    ) {
      continue;
    }

    const loc = normalizeCmsLoc(candidate.path, allowedHosts);
    if (!loc || seen.has(loc)) continue;
    seen.add(loc);

    const entryLastmod = toLastmod(candidate.lastmod);

    entries.push({
      loc,
      _encoded: true,
      ...(entryLastmod ? { lastmod: entryLastmod } : {})
    });
  }

  return entries;
};

const combineSitemapEntries = (
  catalogEntries: SitemapUrlInput[],
  cmsEntries: SitemapUrlInput[]
): SitemapUrlInput[] => {
  const seen = new Set<string>();
  const combined: SitemapUrlInput[] = [];

  for (const entry of catalogEntries) {
    if (typeof entry === 'string') continue;
    if (seen.has(entry.loc)) continue;
    seen.add(entry.loc);
    combined.push(entry);
  }

  for (const entry of cmsEntries) {
    if (typeof entry === 'string') continue;
    if (seen.has(entry.loc)) continue;
    seen.add(entry.loc);
    combined.push(entry);
  }

  return combined;
};

export default defineSitemapEventHandler(async () => {
  const config = useRuntimeConfig();
  const apiBase = String(config.public.apiBase || '').replace(/\/+$/, '');
  const allowedHosts = resolveAllowedHosts(config);

  if (!apiBase) {
    if (lastKnownGoodCatalog) {
      console.warn('[sitemap] runtimeConfig.public.apiBase is not configured, serving last known entries');
      return combineSitemapEntries(lastKnownGoodCatalog, lastKnownGoodCms ?? []);
    }
    console.error('[sitemap] runtimeConfig.public.apiBase is not configured');
    throw createError({ statusCode: 502, statusMessage: 'Sitemap source unavailable' });
  }

  const [catalogResult, cmsResult] = await Promise.allSettled([
    $fetch<unknown>(`${apiBase}${SITEMAP_URLS_ENDPOINT}`, {
      timeout: BACKEND_TIMEOUT_MS,
      retry: 1,
      headers: { Accept: 'application/json' }
    }),
    $fetch<unknown>(`${apiBase}${CMS_SITEMAP_ENDPOINT}`, {
      timeout: BACKEND_TIMEOUT_MS,
      retry: 1,
      headers: { Accept: 'application/json' }
    })
  ]);

  let catalogEntries: SitemapUrlInput[];
  if (catalogResult.status === 'fulfilled' && isSitemapUrlsResponse(catalogResult.value)) {
    catalogEntries = buildCatalogEntries(catalogResult.value);
    lastKnownGoodCatalog = catalogEntries;
  } else {
    const message =
      catalogResult.status === 'rejected'
        ? catalogResult.reason instanceof Error
          ? catalogResult.reason.message
          : String(catalogResult.reason)
        : 'Malformed sitemap-urls response';

    if (lastKnownGoodCatalog) {
      console.warn(`[sitemap] Backend sitemap-urls failed, serving last known catalog entries: ${message}`);
      catalogEntries = lastKnownGoodCatalog;
    } else {
      console.error(`[sitemap] Backend sitemap-urls failed: ${message}`);
      // The module treats a failed source as transient and does not cache it.
      throw createError({ statusCode: 502, statusMessage: 'Sitemap source unavailable' });
    }
  }

  let cmsEntries: SitemapUrlInput[];
  if (cmsResult.status === 'fulfilled') {
    const rawCmsRecords = extractCmsSitemapArray(cmsResult.value);
    if (rawCmsRecords !== null) {
      cmsEntries = buildCmsEntries(rawCmsRecords, allowedHosts);
      lastKnownGoodCms = cmsEntries;
    } else {
      console.warn('[sitemap] Backend CMS sitemap returned a malformed response; continuing with catalog sitemap');
      cmsEntries = lastKnownGoodCms ?? [];
    }
  } else {
    const message =
      cmsResult.reason instanceof Error ? cmsResult.reason.message : String(cmsResult.reason);
    console.warn(`[sitemap] Backend CMS sitemap failed, continuing without fresh CMS entries: ${message}`);
    cmsEntries = lastKnownGoodCms ?? [];
  }

  return combineSitemapEntries(catalogEntries, cmsEntries);
});

