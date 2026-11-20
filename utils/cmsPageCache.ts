// File: /utils/cmsPageCache.ts
import type { PublicCmsPage } from '@/types/cms';

export const PUBLIC_CMS_PAGE_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour (3,600,000 ms)

interface CachedPublicCmsPageEntry {
  data: PublicCmsPage;
  expiresAt: number;
}

export interface PublicCmsPageCacheOptions {
  ttlMs?: number;
  now?: () => number;
}

/**
 * Validates and normalizes a CMS page slug into a canonical cache/request segment.
 * Strips whitespace and surrounding slashes, percent-decodes safely, and rejects
 * empty or path-traversal values with a 404-tagged error.
 */
export function normalizePublicCmsSlug(slug: string): string {
  const cleanSlug = typeof slug === 'string' ? slug.trim().replace(/^\/+|\/+$/g, '') : '';
  if (!cleanSlug) {
    const err = new Error('CMS page slug is required.') as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  let decodedSlug = cleanSlug;
  try {
    decodedSlug = decodeURIComponent(cleanSlug);
  } catch {
    // Keep raw slug when percent-decoding is invalid
  }

  const normalized = decodedSlug.trim().replace(/^\/+|\/+$/g, '');
  if (!normalized || normalized === '.' || normalized === '..') {
    const err = new Error(`Failed to fetch public page for slug: ${cleanSlug}`) as Error & {
      statusCode: number;
    };
    err.statusCode = 404;
    throw err;
  }

  return normalized;
}

/**
 * Returns true only for active, non-archived public CMS page responses eligible for caching.
 */
export function isCacheablePublicCmsPage(page: unknown): page is PublicCmsPage {
  if (!page || typeof page !== 'object') {
    return false;
  }
  const record = page as Record<string, unknown>;
  if (record.live === false || Boolean(record.archived_at)) {
    return false;
  }
  return true;
}

/**
 * Produces an isolated deep copy of a PublicCmsPage so consumer mutations
 * (or Vue reactive proxies) cannot corrupt cached entries.
 */
export function clonePublicCmsPage<T extends PublicCmsPage>(page: T): T {
  try {
    return JSON.parse(JSON.stringify(page)) as T;
  } catch {
    if (typeof structuredClone === 'function') {
      return structuredClone(page);
    }
    return { ...page };
  }
}

export function createPublicCmsPageCache(options: PublicCmsPageCacheOptions = {}) {
  const ttlMs = options.ttlMs ?? PUBLIC_CMS_PAGE_CACHE_TTL_MS;
  const now = options.now ?? (() => Date.now());

  const entries = new Map<string, CachedPublicCmsPageEntry>();
  const inFlight = new Map<string, Promise<PublicCmsPage>>();

  const pruneExpired = (currentTime: number): void => {
    for (const [key, entry] of entries.entries()) {
      if (currentTime >= entry.expiresAt) {
        entries.delete(key);
      }
    }
  };

  const get = (normalizedSlug: string): PublicCmsPage | undefined => {
    const entry = entries.get(normalizedSlug);
    if (!entry) {
      return undefined;
    }
    if (now() >= entry.expiresAt) {
      entries.delete(normalizedSlug);
      return undefined;
    }
    return clonePublicCmsPage(entry.data);
  };

  const set = (normalizedSlug: string, page: PublicCmsPage): boolean => {
    if (!isCacheablePublicCmsPage(page)) {
      return false;
    }
    const currentTime = now();
    pruneExpired(currentTime);
    entries.set(normalizedSlug, {
      data: clonePublicCmsPage(page),
      expiresAt: currentTime + ttlMs,
    });
    return true;
  };

  const seed = (normalizedSlug: string, page: PublicCmsPage): boolean => {
    if (get(normalizedSlug) !== undefined) {
      return false;
    }
    return set(normalizedSlug, page);
  };

  const getOrFetch = async (
    normalizedSlug: string,
    fetcher: () => Promise<PublicCmsPage>
  ): Promise<PublicCmsPage> => {
    const cached = get(normalizedSlug);
    if (cached !== undefined) {
      return cached;
    }

    const existingInFlight = inFlight.get(normalizedSlug);
    if (existingInFlight) {
      return clonePublicCmsPage(await existingInFlight);
    }

    const requestPromise = (async () => {
      const page = await fetcher();
      if (isCacheablePublicCmsPage(page)) {
        set(normalizedSlug, page);
      }
      return page;
    })();

    inFlight.set(normalizedSlug, requestPromise);

    try {
      return clonePublicCmsPage(await requestPromise);
    } finally {
      if (inFlight.get(normalizedSlug) === requestPromise) {
        inFlight.delete(normalizedSlug);
      }
    }
  };

  const clear = (normalizedSlug?: string): void => {
    if (typeof normalizedSlug === 'string') {
      entries.delete(normalizedSlug);
      inFlight.delete(normalizedSlug);
      return;
    }
    entries.clear();
    inFlight.clear();
  };

  const size = (): number => entries.size;
  const inFlightSize = (): number => inFlight.size;

  return {
    get,
    set,
    seed,
    getOrFetch,
    clear,
    size,
    inFlightSize,
  };
}
