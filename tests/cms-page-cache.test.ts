// File: /tests/cms-page-cache.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PUBLIC_CMS_PAGE_CACHE_TTL_MS,
  createPublicCmsPageCache,
  normalizePublicCmsSlug,
} from '../utils/cmsPageCache';
import type { PublicCmsPage } from '../types/cms';

function makePage(slug: string, title = `Title: ${slug}`): PublicCmsPage {
  return {
    id: slug,
    title,
    slug,
    path: `/${slug}/`,
    sections: [
      {
        name: 'Body',
        source: 'page',
        content: [
          {
            type: 'rich_text',
            value: { body: `<p>${title}</p>`, alignment: 'left' },
          },
        ],
      },
    ],
  };
}

test('first request fetches and populates the 1-hour cache', async () => {
  let currentTime = 1_000;
  let fetchCount = 0;
  const cache = createPublicCmsPageCache({ now: () => currentTime });

  const key = normalizePublicCmsSlug('/warranty-policy/');
  assert.equal(key, 'warranty-policy');

  const page = await cache.getOrFetch(key, async () => {
    fetchCount++;
    return makePage('warranty-policy', 'Warranty Policy');
  });

  assert.equal(fetchCount, 1);
  assert.equal(page.title, 'Warranty Policy');
  assert.equal(cache.size(), 1);
});

test('revisit within 1 hour reuses cached entry without network request and isolates consumer mutations', async () => {
  let currentTime = 10_000;
  let fetchCount = 0;
  const cache = createPublicCmsPageCache({ now: () => currentTime });

  const first = await cache.getOrFetch(normalizePublicCmsSlug('warranty-policy'), async () => {
    fetchCount++;
    return makePage('warranty-policy', 'Warranty Policy');
  });

  // Mutate returned object as a consumer
  first.title = 'Mutated Client Copy';
  first.sections[0]!.content[0]!.value.body = '<p>Mutated</p>';

  // Advance 59m 59s (within 1-hour TTL) and use different leading/trailing slash / encoding form
  currentTime += PUBLIC_CMS_PAGE_CACHE_TTL_MS - 1;
  const second = await cache.getOrFetch(normalizePublicCmsSlug('/warranty-policy/'), async () => {
    fetchCount++;
    return makePage('warranty-policy', 'Should Not Fetch');
  });

  assert.equal(fetchCount, 1);
  assert.equal(second.title, 'Warranty Policy');
  assert.equal(second.sections[0]!.content[0]!.value.body, '<p>Warranty Policy</p>');
});

test('expiration after 1 hour invalidates stale data, fetches fresh data, and does not serve stale data on failure', async () => {
  let currentTime = 100_000;
  let fetchCount = 0;
  const cache = createPublicCmsPageCache({ now: () => currentTime });

  await cache.getOrFetch('delivery-policy', async () => {
    fetchCount++;
    return makePage('delivery-policy', 'Delivery v1');
  });
  assert.equal(fetchCount, 1);

  // Advance exactly 1 hour -> expired
  currentTime += PUBLIC_CMS_PAGE_CACHE_TTL_MS;
  assert.equal(cache.get('delivery-policy'), undefined);

  // First refresh fails: must reject and MUST NOT fall back to Delivery v1
  await assert.rejects(
    () =>
      cache.getOrFetch('delivery-policy', async () => {
        fetchCount++;
        throw Object.assign(new Error('Upstream 503'), { statusCode: 503 });
      }),
    /Upstream 503/
  );
  assert.equal(fetchCount, 2);
  assert.equal(cache.get('delivery-policy'), undefined);

  // Next retry succeeds and renews cache for another 1 hour
  const refreshed = await cache.getOrFetch('delivery-policy', async () => {
    fetchCount++;
    return makePage('delivery-policy', 'Delivery v2');
  });
  assert.equal(fetchCount, 3);
  assert.equal(refreshed.title, 'Delivery v2');
});

test('concurrent requests for the same uncached slug share one in-flight request', async () => {
  let fetchCount = 0;
  let resolveFetch!: (page: PublicCmsPage) => void;
  const cache = createPublicCmsPageCache();

  const fetcher = () => {
    fetchCount++;
    return new Promise<PublicCmsPage>((resolve) => {
      resolveFetch = resolve;
    });
  };

  const p1 = cache.getOrFetch('emi-information', fetcher);
  const p2 = cache.getOrFetch('emi-information', fetcher);
  assert.equal(fetchCount, 1);
  assert.equal(cache.inFlightSize(), 1);

  resolveFetch(makePage('emi-information', 'EMI Info'));

  const [res1, res2] = await Promise.all([p1, p2]);
  assert.equal(fetchCount, 1);
  assert.equal(cache.inFlightSize(), 0);
  assert.notEqual(res1, res2);

  // Mutating res1 must not mutate res2
  res1.title = 'Changed';
  assert.equal(res2.title, 'EMI Info');
});

test('failed request does not cache failure or retain rejected in-flight promise', async () => {
  let fetchCount = 0;
  const cache = createPublicCmsPageCache();

  const failingFetcher = async () => {
    fetchCount++;
    throw new Error('Network error');
  };

  await assert.rejects(
    () => Promise.all([cache.getOrFetch('disclaimer', failingFetcher), cache.getOrFetch('disclaimer', failingFetcher)]),
    /Network error/
  );
  assert.equal(fetchCount, 1);
  assert.equal(cache.inFlightSize(), 0);
  assert.equal(cache.size(), 0);

  const retried = await cache.getOrFetch('disclaimer', async () => {
    fetchCount++;
    return makePage('disclaimer', 'Disclaimer');
  });
  assert.equal(fetchCount, 2);
  assert.equal(retried.title, 'Disclaimer');
});

test('404 responses and unpublished/archived pages are never cached and retry cleanly', async () => {
  let fetchCount = 0;
  const cache = createPublicCmsPageCache();

  await assert.rejects(
    () =>
      cache.getOrFetch('missing-page', async () => {
        fetchCount++;
        throw Object.assign(new Error('Not Found'), { statusCode: 404 });
      }),
    /Not Found/
  );
  assert.equal(cache.size(), 0);

  // Non-live / archived payload must also not be cached
  await cache.getOrFetch('draft-page', async () => {
    fetchCount++;
    return { ...makePage('draft-page'), live: false } as PublicCmsPage;
  });
  assert.equal(cache.get('draft-page'), undefined);

  // Retry succeeds later
  const recovered = await cache.getOrFetch('missing-page', async () => {
    fetchCount++;
    return makePage('missing-page', 'Now Published');
  });
  assert.equal(fetchCount, 3);
  assert.equal(recovered.title, 'Now Published');
});

test('SSR bypasses shared cache while client hydration seeds cache cleanly without duplicate requests', async () => {
  let serverFetches = 0;
  let clientFetches = 0;
  const clientCache = createPublicCmsPageCache();

  const simulateGetPublicPageBySlug = async (slug: string, isClient: boolean, fetcher: () => Promise<PublicCmsPage>) => {
    const key = normalizePublicCmsSlug(slug);
    if (isClient) {
      return clientCache.getOrFetch(key, fetcher);
    }
    return fetcher();
  };

  // Two independent SSR requests must never share module cache
  const ssr1 = await simulateGetPublicPageBySlug('about-us', false, async () => {
    serverFetches++;
    return makePage('about-us', 'SSR Copy 1');
  });
  const ssr2 = await simulateGetPublicPageBySlug('about-us', false, async () => {
    serverFetches++;
    return makePage('about-us', 'SSR Copy 2');
  });
  assert.equal(serverFetches, 2);
  assert.equal(ssr1.title, 'SSR Copy 1');
  assert.equal(ssr2.title, 'SSR Copy 2');
  assert.equal(clientCache.size(), 0);

  // Client hydration seeds from SSR payload (zero extra network request)
  const seeded = clientCache.seed(normalizePublicCmsSlug('about-us'), ssr2);
  assert.equal(seeded, true);
  assert.equal(clientFetches, 0);

  // Revisiting slug later on client within 1 hour uses seeded cache
  const revisited = await simulateGetPublicPageBySlug('/about-us/', true, async () => {
    clientFetches++;
    return makePage('about-us', 'Should Not Fetch');
  });
  assert.equal(clientFetches, 0);
  assert.equal(revisited.title, 'SSR Copy 2');
});

test('different slugs maintain independent cache entries and TTL lifetimes', async () => {
  let currentTime = 50_000;
  let privacyFetches = 0;
  let warrantyFetches = 0;
  const cache = createPublicCmsPageCache({ now: () => currentTime });

  await cache.getOrFetch('privacy-policy', async () => {
    privacyFetches++;
    return makePage('privacy-policy', 'Privacy');
  });

  // 30 minutes later, cache warranty-policy
  currentTime += 30 * 60 * 1000;
  await cache.getOrFetch('warranty-policy', async () => {
    warrantyFetches++;
    return makePage('warranty-policy', 'Warranty');
  });

  // 31 minutes later (total 61m for privacy, 31m for warranty):
  // privacy-policy has expired; warranty-policy is still fresh
  currentTime += 31 * 60 * 1000;

  const w = await cache.getOrFetch('warranty-policy', async () => {
    warrantyFetches++;
    return makePage('warranty-policy', 'Warranty v2');
  });
  const p = await cache.getOrFetch('privacy-policy', async () => {
    privacyFetches++;
    return makePage('privacy-policy', 'Privacy v2');
  });

  assert.equal(warrantyFetches, 1);
  assert.equal(privacyFetches, 2);
  assert.equal(w.title, 'Warranty');
  assert.equal(p.title, 'Privacy v2');
});
