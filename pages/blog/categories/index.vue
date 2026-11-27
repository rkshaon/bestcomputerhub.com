<!-- File: /pages/blog/categories/index.vue -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useAsyncData, useHead, useRoute, useRouter, useRuntimeConfig, useSeoMeta } from '#app';
import { useSiteConfig } from '#imports';
import { ArrowLeft, FolderOpen, AlertCircle, RefreshCw } from 'lucide-vue-next';
import { decodeHtmlEntities } from '@/utils';
import { resolveOriginFromUrl } from '@/utils/cms';
import { useBlogService } from '@/composables/useBlogService';
import { extractErrorMessage } from '@/composables/useToast';
import type { PaginatedBlogCategories } from '@/types';
import UiBreadcrumbs from '@/components/ui/UiBreadcrumbs.vue';
import UiBadge from '@/components/ui/UiBadge.vue';
import UiButton from '@/components/ui/Button.vue';
import UiPagination from '@/components/ui/UiPagination.vue';

const route = useRoute();
const router = useRouter();
const runtimeConfig = useRuntimeConfig();
const siteConfig = useSiteConfig();
const blogService = useBlogService();

const parsePositiveInt = (val: unknown, fallback = 1): number => {
  const raw = Array.isArray(val) ? val[0] : val;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : fallback;
};

const currentPage = ref(parsePositiveInt(route.query.page, 1));
const pageSize = ref(24);

const siteOrigin = computed(() => {
  const fromSite = resolveOriginFromUrl((siteConfig as Record<string, any>)?.url);
  if (fromSite) return fromSite;
  const publicCfg = runtimeConfig.public as Record<string, any>;
  const fromAppUrl = resolveOriginFromUrl(publicCfg?.appUrl);
  if (fromAppUrl) return fromAppUrl;
  return 'https://bestcomputerhub.com';
});

useSeoMeta({
  title: 'Blog Categories',
  description: 'Explore all blog categories and article counts across PC hardware guides, reviews, and tech insights at Best Computer Hub.',
  ogTitle: 'Blog Categories | Best Computer Hub',
  ogDescription: 'Explore all blog categories and article counts across PC hardware guides, reviews, and tech insights at Best Computer Hub.',
  ogImage: '/logo.png',
  ogUrl: computed(() => `${siteOrigin.value}/blog/categories/`),
  robots: 'index, follow'
});

useHead({
  link: [
    {
      rel: 'canonical',
      href: computed(() => `${siteOrigin.value}/blog/categories/`)
    }
  ]
});

const breadcrumbItems = [
  { name: 'Blog', url: '/blog/' },
  { name: 'Categories', url: '/blog/categories/' }
];

const syncRouteQuery = () => {
  const nextQuery: Record<string, string> = {};
  if (currentPage.value > 1) {
    nextQuery.page = String(currentPage.value);
  }
  router.replace({ query: nextQuery });
};

const {
  data: categoriesResponse,
  status: categoriesStatus,
  error: categoriesError,
  refresh: refreshCategories
} = await useAsyncData<PaginatedBlogCategories>(
  () => `blog-categories-list-${currentPage.value}`,
  () =>
    blogService.getBlogCategories({
      page: currentPage.value,
      page_size: pageSize.value
    })
);

const categories = computed(() => categoriesResponse.value?.results || []);
const totalCount = computed(() => categoriesResponse.value?.count || 0);
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)));
const isLoading = computed(() => categoriesStatus.value === 'pending');
const errorMessage = computed(() =>
  categoriesError.value
    ? extractErrorMessage(categoriesError.value, 'Failed to retrieve blog categories. Please try again.')
    : null
);

watch(
  () => route.query.page,
  (newPageQuery) => {
    const nextPage = parsePositiveInt(newPageQuery, 1);
    if (nextPage !== currentPage.value) {
      currentPage.value = nextPage;
    }
  }
);

const onPageChange = (newPage: number) => {
  if (newPage === currentPage.value) return;
  currentPage.value = newPage;
  syncRouteQuery();
  if (import.meta.client) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};
</script>

<template>
  <div class="min-h-screen pb-20">
    <!-- Header -->
    <section class="bg-card border-b py-12 md:py-16 relative overflow-hidden">
      <div class="absolute inset-0 bg-primary/[0.02] pointer-events-none"></div>
      <div class="container mx-auto px-4 relative z-10 space-y-6">
        <UiBreadcrumbs :items="breadcrumbItems" />

        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div class="space-y-2 max-w-2xl">
            <div class="flex items-center gap-3 flex-wrap">
              <h1 class="text-3xl md:text-5xl font-display font-extrabold tracking-tight text-foreground">
                Blog Categories
              </h1>
              <UiBadge v-if="!isLoading && totalCount > 0" variant="primary" size="sm" class="tabular-nums">
                {{ totalCount }} {{ totalCount === 1 ? 'Category' : 'Categories' }}
              </UiBadge>
            </div>
            <p class="text-sm md:text-base text-muted-foreground">
              Browse all editorial topics and hardware guide categories published on Best Computer Hub.
            </p>
          </div>

          <NuxtLink
            to="/blog/"
            class="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-bold uppercase tracking-wider text-foreground transition-all shrink-0"
          >
            <ArrowLeft class="w-3.5 h-3.5" />
            <span>Back to Blog</span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Content Area -->
    <section class="container mx-auto px-4 py-12 md:py-16">
      <!-- Error State -->
      <div v-if="errorMessage" class="bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div class="flex items-center gap-3">
          <AlertCircle class="w-5 h-5 shrink-0" />
          <p class="text-sm font-medium">{{ errorMessage }}</p>
        </div>
        <UiButton variant="outline" size="sm" class="rounded-full gap-2 shrink-0" @click="refreshCategories()">
          <RefreshCw class="w-3.5 h-3.5" />
          Retry
        </UiButton>
      </div>

      <!-- Loading Skeleton Grid -->
      <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div
          v-for="i in 12"
          :key="i"
          class="bg-card border border-border rounded-2xl p-5 flex items-center justify-between gap-4 animate-pulse"
        >
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <div class="w-10 h-10 rounded-xl bg-muted shrink-0"></div>
            <div class="h-5 bg-muted rounded-full w-2/3"></div>
          </div>
          <div class="h-6 w-16 bg-muted rounded-full shrink-0"></div>
        </div>
      </div>

      <!-- Categories Grid -->
      <div v-else-if="categories.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <article
          v-for="cat in categories"
          :key="cat.id"
          class="bg-card border border-border rounded-2xl p-5 min-h-[76px] flex items-center justify-between gap-4 shadow-xs"
        >
          <div class="flex items-center gap-3.5 min-w-0">
            <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FolderOpen class="w-5 h-5" />
            </div>
            <h2 class="text-base font-display font-bold text-foreground truncate">
              {{ decodeHtmlEntities(cat.name) }}
            </h2>
          </div>

          <UiBadge variant="secondary" size="sm" class="tabular-nums shrink-0">
            {{ cat.blog_post_count }} {{ cat.blog_post_count === 1 ? 'post' : 'posts' }}
          </UiBadge>
        </article>
      </div>

      <!-- Empty State -->
      <div v-else-if="!isLoading && !errorMessage && categories.length === 0" class="py-20 flex flex-col items-center text-center space-y-5">
        <div class="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
          <FolderOpen class="w-9 h-9 text-muted-foreground" />
        </div>
        <div class="space-y-2">
          <h2 class="text-2xl font-bold">No blog categories found</h2>
          <p class="text-muted-foreground max-w-sm text-sm">
            There are currently no blog categories available.
          </p>
        </div>
        <NuxtLink to="/blog/">
          <UiButton variant="outline" class="rounded-full gap-2">
            <ArrowLeft class="w-4 h-4" />
            Return to Blog
          </UiButton>
        </NuxtLink>
      </div>

      <!-- Pagination -->
      <div v-if="totalCount > 0 && totalPages > 1" class="mt-12">
        <UiPagination
          :current-page="currentPage"
          :total-pages="totalPages"
          :total-count="totalCount"
          :items-per-page="pageSize"
          variant="card"
          @update:current-page="onPageChange"
        />
      </div>
    </section>
  </div>
</template>
