// File: /tests/blog-categories.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import { parse, compileTemplate } from '@vue/compiler-sfc';

test('useBlogService.getBlogCategories calls GET /api/v1/blog/posts/categories/ without mutating singleton refs', async () => {
  const requests: Array<{ url: string; options: Record<string, any> }> = [];
  let shouldFail = false;

  (globalThis as any).__mockBlogApiClient = () => ({
    request: async (url: string, options: Record<string, any>) => {
      requests.push({ url, options });
      if (shouldFail) {
        throw new Error('Categories endpoint unavailable');
      }
      return {
        count: 25,
        next: 'https://api.example.com/api/v1/blog/posts/categories/?page=2&page_size=10',
        previous: null,
        results: [
          { id: 1, name: 'Hardware &amp; GPUs', slug: 'hardware-gpus', blog_post_count: 14 },
          { id: 2, name: 'Laptop Reviews', slug: 'laptop-reviews', blog_post_count: 9 }
        ]
      };
    }
  });

  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      if (context.parentURL?.includes('/composables/useBlogService.ts')) {
        if (specifier === './useApiClient') {
          return { url: 'mock:blogApiClient', shortCircuit: true };
        }
        if (specifier === './useToast') {
          return { url: 'mock:blogToast', shortCircuit: true };
        }
        if (specifier === '@/mock/data') {
          return { url: 'mock:blogMockData', shortCircuit: true };
        }
      }
      return nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
      if (url === 'mock:blogApiClient') {
        return {
          format: 'module',
          source: 'export const useApiClient = () => globalThis.__mockBlogApiClient();',
          shortCircuit: true
        };
      }
      if (url === 'mock:blogToast') {
        return {
          format: 'module',
          source: 'export const extractErrorMessage = (err, fallback) => err?.message || fallback;',
          shortCircuit: true
        };
      }
      if (url === 'mock:blogMockData') {
        return {
          format: 'module',
          source: 'export const blogPosts = [];',
          shortCircuit: true
        };
      }
      return nextLoad(url, context);
    }
  });

  try {
    const blogServiceUrl = pathToFileURL(resolve(process.cwd(), 'composables/useBlogService.ts')).href;
    const { useBlogService } = await import(`${blogServiceUrl}?t=${Date.now()}`);
    const service = useBlogService();

    assert.equal(service.isLoading.value, false);
    assert.equal(service.errorMsg.value, null);

    const res = await service.getBlogCategories({ page: 1, page_size: 10 });
    assert.equal(requests.length, 1);
    assert.equal(requests[0]?.url, '/api/v1/blog/posts/categories/');
    assert.equal(requests[0]?.options.method, 'GET');
    assert.deepEqual(requests[0]?.options.params, { page: 1, page_size: 10 });

    assert.equal(res.count, 25);
    assert.equal(res.previous, null);
    assert.equal(res.results.length, 2);
    assert.deepEqual(res.results[0], {
      id: 1,
      name: 'Hardware &amp; GPUs',
      slug: 'hardware-gpus',
      blog_post_count: 14
    });

    // Module-level singleton refs must stay untouched so category requests stay isolated.
    assert.equal(service.isLoading.value, false);
    assert.equal(service.errorMsg.value, null);

    shouldFail = true;
    await assert.rejects(
      () => service.getBlogCategories({ page: 2, page_size: 24 }),
      /Categories endpoint unavailable/
    );
    assert.equal(service.isLoading.value, false);
    assert.equal(service.errorMsg.value, null);
  } finally {
    hooks.deregister();
    delete (globalThis as any).__mockBlogApiClient;
  }
});

test('useBlogService.getMostViewedBlogPosts calls GET /api/v1/blog/posts/most-viewed/ without mutating singleton refs', async () => {
  const requests: Array<{ url: string; options: Record<string, any> }> = [];
  let shouldFail = false;

  (globalThis as any).__mockBlogApiClient = () => ({
    request: async (url: string, options: Record<string, any>) => {
      requests.push({ url, options });
      if (shouldFail) {
        throw new Error('Most viewed endpoint unavailable');
      }
      return {
        count: 12,
        next: 'https://api.example.com/api/v1/blog/posts/most-viewed/?page=2&page_size=5',
        previous: null,
        results: [
          { id: 101, slug: 'rtx-5080-review', name: 'RTX 5080 &amp; Benchmark Review', view_count: 1480 },
          { id: 102, slug: 'best-gaming-laptop-2026', name: 'Best Gaming Laptops 2026', view_count: 930 }
        ]
      };
    }
  });

  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      if (context.parentURL?.includes('/composables/useBlogService.ts')) {
        if (specifier === './useApiClient') {
          return { url: 'mock:blogApiClient', shortCircuit: true };
        }
        if (specifier === './useToast') {
          return { url: 'mock:blogToast', shortCircuit: true };
        }
        if (specifier === '@/mock/data') {
          return { url: 'mock:blogMockData', shortCircuit: true };
        }
      }
      return nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
      if (url === 'mock:blogApiClient') {
        return {
          format: 'module',
          source: 'export const useApiClient = () => globalThis.__mockBlogApiClient();',
          shortCircuit: true
        };
      }
      if (url === 'mock:blogToast') {
        return {
          format: 'module',
          source: 'export const extractErrorMessage = (err, fallback) => err?.message || fallback;',
          shortCircuit: true
        };
      }
      if (url === 'mock:blogMockData') {
        return {
          format: 'module',
          source: 'export const blogPosts = [];',
          shortCircuit: true
        };
      }
      return nextLoad(url, context);
    }
  });

  try {
    const blogServiceUrl = pathToFileURL(resolve(process.cwd(), 'composables/useBlogService.ts')).href;
    const { useBlogService } = await import(`${blogServiceUrl}?t=${Date.now()}`);
    const service = useBlogService();

    assert.equal(service.isLoading.value, false);
    assert.equal(service.errorMsg.value, null);

    const res = await service.getMostViewedBlogPosts({ page: 1, page_size: 5 });
    assert.equal(requests.length, 1);
    assert.equal(requests[0]?.url, '/api/v1/blog/posts/most-viewed/');
    assert.equal(requests[0]?.options.method, 'GET');
    assert.deepEqual(requests[0]?.options.params, { page: 1, page_size: 5 });

    assert.equal(res.count, 12);
    assert.equal(res.previous, null);
    assert.equal(res.results.length, 2);
    assert.deepEqual(res.results[0], {
      id: 101,
      slug: 'rtx-5080-review',
      name: 'RTX 5080 &amp; Benchmark Review',
      view_count: 1480
    });

    assert.equal(service.isLoading.value, false);
    assert.equal(service.errorMsg.value, null);

    shouldFail = true;
    await assert.rejects(
      () => service.getMostViewedBlogPosts({ page: 1, page_size: 5 }),
      /Most viewed endpoint unavailable/
    );
    assert.equal(service.isLoading.value, false);
    assert.equal(service.errorMsg.value, null);
  } finally {
    hooks.deregister();
    delete (globalThis as any).__mockBlogApiClient;
  }
});

test('/pages/blog/index.vue compiles cleanly and enforces two-column layout, Top Categories, Most Viewed Blogs, SSR fetching, and deferred filtering', () => {
  const source = readFileSync(resolve('pages/blog/index.vue'), 'utf8');
  const parsed = parse(source);
  assert.ok(parsed.descriptor.template, '/pages/blog/index.vue must have a template');

  const compiled = compileTemplate({
    source: parsed.descriptor.template.content,
    filename: 'pages/blog/index.vue',
    id: 'pages/blog/index.vue'
  });
  assert.equal(compiled.errors.length, 0);

  // SSR fetching and non-use of onMounted
  assert.match(source, /useAsyncData<PaginatedBlogPosts>/);
  assert.match(source, /useAsyncData<PaginatedBlogCategories>/);
  assert.match(source, /useAsyncData<PaginatedMostViewedBlogPosts>/);
  assert.doesNotMatch(source, /\bonMounted\b/);

  // Main blog listing preservation + 2-column grid alongside sidebar
  assert.match(source, /pageSize\s*=\s*ref\(9\)/);
  assert.match(source, /status:\s*'PUBLISHED'/);
  assert.match(source, /refDebounced\(searchQuery,\s*300\)/);
  assert.match(source, /md:grid-cols-2/);
  assert.doesNotMatch(source, /lg:grid-cols-3/);
  assert.match(source, /<UiPagination[\s\S]*variant="card"/);

  // Sidebar Widget 1: Top Categories (page=1, page_size=10) before Widget 2: Most Viewed Blogs (page=1, page_size=5)
  assert.match(source, /getBlogCategories\(\{\s*page:\s*1,\s*page_size:\s*10\s*\}\)/);
  assert.match(source, /getMostViewedBlogPosts\(\{\s*page:\s*1,\s*page_size:\s*5\s*\}\)/);
  assert.match(source, /Top Categories/);
  assert.match(source, /Most Viewed Blogs/);
  assert.ok(source.indexOf('Top Categories') < source.indexOf('Most Viewed Blogs'), 'Top Categories must appear before Most Viewed Blogs');
  assert.match(source, /cat\.blog_post_count/);
  assert.match(source, /to="\/blog\/categories\/"/);
  assert.match(source, /See All Categories/);
  assert.match(source, /refreshCategories\(\)/);
  assert.match(source, /refreshMostViewed\(\)/);
  assert.match(source, /decodeHtmlEntities\(item\.name\)/);
  assert.match(source, /item\.view_count/);
  assert.match(source, /\/blog\/\$\{item\.slug\}\//);

  // SEO canonical
  assert.match(source, /rel:\s*'canonical'/);
  assert.match(source, /\/blog\//);

  // Strictly deferred / excluded items
  assert.doesNotMatch(source, /\/blog\/category\//);
  assert.doesNotMatch(source, /category_slug/);
});

test('/pages/blog/categories/index.vue compiles cleanly with SSR pagination, breadcrumbs, and SEO metadata', () => {
  const source = readFileSync(resolve('pages/blog/categories/index.vue'), 'utf8');
  const parsed = parse(source);
  assert.ok(parsed.descriptor.template, '/pages/blog/categories/index.vue must have a template');

  const compiled = compileTemplate({
    source: parsed.descriptor.template.content,
    filename: 'pages/blog/categories/index.vue',
    id: 'pages/blog/categories/index.vue'
  });
  assert.equal(compiled.errors.length, 0);

  assert.match(source, /useAsyncData<PaginatedBlogCategories>/);
  assert.match(source, /getBlogCategories\(\{[\s\S]*page:\s*currentPage\.value,[\s\S]*page_size:\s*pageSize\.value/);
  assert.match(source, /<UiBreadcrumbs/);
  assert.match(source, /url:\s*'\/blog\/'/);
  assert.match(source, /url:\s*'\/blog\/categories\/'/);
  assert.match(source, /Blog Categories/);
  assert.match(source, /cat\.blog_post_count/);
  assert.match(source, /<UiPagination[\s\S]*variant="card"/);
  assert.match(source, /to="\/blog\/"/);
  assert.match(source, /rel:\s*'canonical'/);
  assert.match(source, /\/blog\/categories\//);

  // No guessed filtering routes or params
  assert.doesNotMatch(source, /\/blog\/category\//);
  assert.doesNotMatch(source, /category_slug/);
});
