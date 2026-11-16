<!-- File: /pages/[slug].vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, createError, navigateTo, useAsyncData, useRuntimeConfig, useSeoMeta, useHead } from '#app';
import { useSiteConfig } from '#imports';
import { useCmsService } from '@/composables/useCmsService';
import { useBlogService } from '@/composables/useBlogService';
import { decodeHtmlEntities } from '@/utils';
import { getRichTextBlockValue, normalizeCmsPath, resolveOriginFromUrl, sanitizeCmsHtml } from '@/utils/cms';
import type { PublicCmsPage } from '@/types/cms';
import UiBreadcrumbs from '@/components/ui/UiBreadcrumbs.vue';
import CmsRichTextSection from '@/components/cms/CmsRichTextSection.vue';

definePageMeta({
  key: (route) => route.path
});

const DEFAULT_SITE_DESCRIPTION =
  'Best Computer Hub is your trusted destination for gaming PCs, laptops, computer components, networking devices, accessories, and enterprise hardware in Bangladesh. Shop authentic products at competitive prices with reliable support.';
const DEFAULT_OG_IMAGE = '/logo.png';

const route = useRoute();
const runtimeConfig = useRuntimeConfig();
const siteConfig = useSiteConfig();
const cmsService = useCmsService();
const blogService = useBlogService();

const slug = computed(() => {
  const raw = route.params.slug;
  return (Array.isArray(raw) ? raw[0] : raw) || '';
});

if (!slug.value.trim()) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  });
}

const cmsPath = computed(() => normalizeCmsPath(slug.value));

const mediaOrigin = computed(() => {
  const publicCfg = runtimeConfig.public as Record<string, any>;
  return resolveOriginFromUrl(publicCfg?.mediaBase || publicCfg?.apiBase);
});

const siteOrigin = computed(() => {
  const fromSite = resolveOriginFromUrl((siteConfig as Record<string, any>)?.url);
  if (fromSite) return fromSite;
  const publicCfg = runtimeConfig.public as Record<string, any>;
  const fromAppUrl = resolveOriginFromUrl(publicCfg?.appUrl);
  if (fromAppUrl) return fromAppUrl;
  return 'https://bestcomputerhub.com';
});

function getHttpStatus(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const e = err as Record<string, any>;
  const candidate = e.status ?? e.statusCode ?? e.response?.status ?? e.data?.statusCode;
  return typeof candidate === 'number' ? candidate : undefined;
}

type SlugResolution =
  | { status: 'cms'; page: PublicCmsPage }
  | { status: 'blog_redirect'; blogSlug: string }
  | { status: 'not_found' }
  | { status: 'error'; statusCode: number; message: string };

const { data: resolved, error: asyncError } = await useAsyncData<SlugResolution>(
  `public-slug-${slug.value}`,
  async () => {
    try {
      const page = await cmsService.getPublicPageByPath(cmsPath.value);
      const pageMeta = page as Record<string, any>;
      if (!page || pageMeta.live === false || Boolean(pageMeta.archived_at)) {
        return { status: 'not_found' };
      }
      return { status: 'cms', page };
    } catch (cmsErr: unknown) {
      const cmsStatus = getHttpStatus(cmsErr);

      // Only treat a confirmed HTTP 404 from CMS as a fallback trigger
      if (cmsStatus !== 404) {
        const message =
          (cmsErr as any)?.data?.message ||
          (cmsErr as any)?.message ||
          'Unable to load page';
        return {
          status: 'error',
          statusCode: cmsStatus && cmsStatus >= 400 ? cmsStatus : 503,
          message
        };
      }
    }

    // CMS returned 404 -> fallback to legacy blog redirect lookup
    try {
      const post = await blogService.getBlogPost(slug.value);
      if (post && post.slug) {
        return { status: 'blog_redirect', blogSlug: post.slug };
      }
      return { status: 'not_found' };
    } catch (blogErr: unknown) {
      const blogStatus = getHttpStatus(blogErr);
      if (blogStatus === 404) {
        return { status: 'not_found' };
      }
      const message =
        (blogErr as any)?.data?.message ||
        (blogErr as any)?.message ||
        'Unable to load page';
      return {
        status: 'error',
        statusCode: blogStatus && blogStatus >= 400 ? blogStatus : 503,
        message
      };
    }
  }
);

if (asyncError.value && !resolved.value) {
  throw createError({
    statusCode: getHttpStatus(asyncError.value) || 503,
    statusMessage: 'Unable to load page',
    fatal: true
  });
}

if (!resolved.value || resolved.value.status === 'error') {
  throw createError({
    statusCode: resolved.value?.statusCode || 503,
    statusMessage: resolved.value?.message || 'Unable to load page',
    fatal: true
  });
}

if (resolved.value.status === 'not_found') {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  });
}

if (resolved.value.status === 'blog_redirect') {
  await navigateTo(
    {
      path: `/blog/${resolved.value.blogSlug}/`,
      query: route.query
    },
    {
      redirectCode: 301
    }
  );
}

const cmsPage = computed<PublicCmsPage | null>(() =>
  resolved.value?.status === 'cms' ? resolved.value.page : null
);

const normalizedPagePath = computed(() => {
  if (cmsPage.value?.url_path?.trim()) {
    return normalizeCmsPath(cmsPage.value.url_path);
  }
  return cmsPath.value;
});

const richTextBlocks = computed(() => {
  const sections = cmsPage.value?.sections;
  if (!Array.isArray(sections)) return [];

  const blocks: Array<{ key: string; body: string; alignment: string }> = [];

  sections.forEach((sec, secIdx) => {
    if (!sec) return;
    const secRecord = sec as Record<string, any>;
    if (secRecord.archived === true || Boolean(secRecord.archived_at) || secRecord.is_active === false) {
      return;
    }
    if (!Array.isArray(sec.content)) return;

    sec.content.forEach((block, blockIdx) => {
      if (block?.type !== 'rich_text') return;
      const { body, alignment } = getRichTextBlockValue(block.value);
      const sanitizedPreview = sanitizeCmsHtml(body, { mediaOrigin: mediaOrigin.value });
      if (sanitizedPreview) {
        blocks.push({
          key: `rich-text-${secIdx}-${blockIdx}`,
          body,
          alignment
        });
      }
    });
  });

  return blocks;
});

const breadcrumbs = computed(() => [
  {
    name: cmsPage.value?.title || 'Page',
    url: normalizedPagePath.value
  }
]);

if (cmsPage.value) {
  const seoTitle = computed(
    () => cmsPage.value?.seo_title?.trim() || cmsPage.value?.title?.trim() || 'Best Computer Hub'
  );
  const seoDescription = computed(
    () => cmsPage.value?.seo_description?.trim() || DEFAULT_SITE_DESCRIPTION
  );
  const ogTitle = computed(
    () =>
      cmsPage.value?.og_title?.trim() ||
      cmsPage.value?.seo_title?.trim() ||
      cmsPage.value?.title?.trim() ||
      'Best Computer Hub'
  );
  const ogDescription = computed(
    () =>
      cmsPage.value?.og_description?.trim() ||
      cmsPage.value?.seo_description?.trim() ||
      DEFAULT_SITE_DESCRIPTION
  );
  const metaKeywords = computed(() => {
    const kw = cmsPage.value?.meta_keywords?.trim();
    return kw ? kw : undefined;
  });
  const robotsMeta = computed(() => {
    const indexPart = cmsPage.value?.seo_noindex ? 'noindex' : 'index';
    const followPart = cmsPage.value?.seo_nofollow ? 'nofollow' : 'follow';
    return `${indexPart}, ${followPart}`;
  });
  const ogImage = computed(() => {
    const raw = cmsPage.value?.og_image;
    if (typeof raw !== 'string') {
      return DEFAULT_OG_IMAGE;
    }
    const trimmed = raw.trim();
    if (!trimmed) {
      return DEFAULT_OG_IMAGE;
    }
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
      if (trimmed.startsWith('/media/') && mediaOrigin.value) {
        return `${mediaOrigin.value}${trimmed}`;
      }
      return trimmed;
    }
    return DEFAULT_OG_IMAGE;
  });
  const canonicalHref = computed(() => {
    const rawCanonical = cmsPage.value?.canonical_url?.trim();
    if (rawCanonical) {
      if (/^https?:\/\//i.test(rawCanonical)) {
        return rawCanonical;
      }
      return `${siteOrigin.value}${normalizeCmsPath(rawCanonical)}`;
    }
    return `${siteOrigin.value}${normalizedPagePath.value}`;
  });

  useSeoMeta({
    title: seoTitle,
    description: seoDescription,
    ogTitle,
    ogDescription,
    ogImage,
    robots: robotsMeta
  });

  useHead({
    meta: computed(() =>
      metaKeywords.value ? [{ name: 'keywords', content: metaKeywords.value }] : []
    ),
    link: [
      {
        rel: 'canonical',
        href: canonicalHref
      }
    ]
  });
}
</script>

<template>
  <div v-if="cmsPage" class="min-h-screen bg-background text-foreground">
    <div class="container mx-auto px-4 py-8 md:py-12 max-w-4xl space-y-6">
      <UiBreadcrumbs :items="breadcrumbs" />

      <header class="border-b border-border pb-5">
        <h1 class="text-[26px] font-display font-bold tracking-tight leading-tight text-foreground">
          {{ decodeHtmlEntities(cmsPage.title) }}
        </h1>
      </header>

      <div v-if="richTextBlocks.length > 0" class="space-y-4">
        <CmsRichTextSection
          v-for="item in richTextBlocks"
          :key="item.key"
          :body="item.body"
          :alignment="item.alignment"
        />
      </div>

      <div v-else class="py-8 text-muted-foreground text-sm">
        <p>No content is available for this page.</p>
      </div>
    </div>
  </div>

  <div v-else class="flex items-center justify-center min-h-screen bg-background" id="redirect-page">
    <div class="text-center" id="redirect-message-container">
      <p class="text-muted-foreground animate-pulse" id="redirect-text">Redirecting...</p>
    </div>
  </div>
</template>
