<!-- File: /pages/blog/index.vue -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useAsyncData, useHead, useRoute, useRouter, useRuntimeConfig, useSeoMeta } from '#app';
import { useSiteConfig } from '#imports';
import { Calendar, ArrowRight, Search, FileText, AlertCircle, RefreshCw, FolderOpen } from 'lucide-vue-next';
import { refDebounced } from '@vueuse/core';
import { decodeHtmlEntities } from '@/utils';
import { resolveOriginFromUrl } from '@/utils/cms';
import { useBlogService } from '@/composables/useBlogService';
import { extractErrorMessage } from '@/composables/useToast';
import type { PaginatedBlogCategories, PaginatedBlogPosts } from '@/types';
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

const readQueryString = (val: unknown): string => {
  const raw = Array.isArray(val) ? val[0] : val;
  return typeof raw === 'string' ? raw : '';
};

const searchQuery = ref(readQueryString(route.query.search));
const debouncedSearch = refDebounced(searchQuery, 300);
const appliedSearch = ref(searchQuery.value.trim());

const currentPage = ref(parsePositiveInt(route.query.page, 1));
const pageSize = ref(9);

const siteOrigin = computed(() => {
  const fromSite = resolveOriginFromUrl((siteConfig as Record<string, any>)?.url);
  if (fromSite) return fromSite;
  const publicCfg = runtimeConfig.public as Record<string, any>;
  const fromAppUrl = resolveOriginFromUrl(publicCfg?.appUrl);
  if (fromAppUrl) return fromAppUrl;
  return 'https://bestcomputerhub.com';
});

useSeoMeta({
  title: 'Blog & Tech Insights | Best Computer Hub',
  description: 'Read the latest PC hardware reviews, gaming benchmarks, buying guides, and tech news at Best Computer Hub.',
  ogTitle: 'Blog & Tech Insights | Best Computer Hub',
  ogDescription: 'Read the latest PC hardware reviews, gaming benchmarks, buying guides, and tech news at Best Computer Hub.',
  ogImage: '/logo.png',
  ogUrl: computed(() => `${siteOrigin.value}/blog/`),
  robots: computed(() => (appliedSearch.value ? 'noindex, follow' : 'index, follow'))
});

useHead({
  link: [
    {
      rel: 'canonical',
      href: computed(() => `${siteOrigin.value}/blog/`)
    }
  ]
});

const syncRouteQuery = () => {
  const nextQuery: Record<string, string> = {};
  if (currentPage.value > 1) {
    nextQuery.page = String(currentPage.value);
  }
  if (appliedSearch.value) {
    nextQuery.search = appliedSearch.value;
  }
  router.replace({ query: nextQuery });
};

// SSR-compatible blog posts fetch; hydrates without a duplicate client request.
const {
  data: postsResponse,
  status: postsStatus,
  error: postsError,
  refresh: refreshPosts
} = await useAsyncData<PaginatedBlogPosts>(
  () => `blog-posts-list-${currentPage.value}-${appliedSearch.value}`,
  () =>
    blogService.getBlogPosts({
      page: currentPage.value,
      page_size: pageSize.value,
      search: appliedSearch.value || undefined,
      status: 'PUBLISHED'
    })
);

// Independent SSR-compatible fetch for Top 10 blog categories in the sidebar.
const {
  data: categoriesResponse,
  status: categoriesStatus,
  error: categoriesError,
  refresh: refreshCategories
} = await useAsyncData<PaginatedBlogCategories>(
  'blog-sidebar-top-categories',
  () =>
    blogService.getBlogCategories({
      page: 1,
      page_size: 10
    })
);

const posts = computed(() => postsResponse.value?.results || []);
const totalCount = computed(() => postsResponse.value?.count || 0);
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)));
const isLoading = computed(() => postsStatus.value === 'pending');
const errorMessage = computed(() =>
  postsError.value
    ? extractErrorMessage(postsError.value, 'Failed to retrieve blog posts. Please try again.')
    : null
);

const topCategories = computed(() => (categoriesResponse.value?.results || []).slice(0, 10));
const isCategoriesLoading = computed(() => categoriesStatus.value === 'pending');
const categoriesErrorMessage = computed(() =>
  categoriesError.value
    ? extractErrorMessage(categoriesError.value, 'Failed to load blog categories.')
    : null
);

watch(debouncedSearch, (nextVal) => {
  const trimmed = nextVal.trim();
  if (trimmed === appliedSearch.value) return;
  currentPage.value = 1;
  appliedSearch.value = trimmed;
  syncRouteQuery();
});

watch(
  () => [route.query.page, route.query.search],
  ([newPageQuery, newSearchQuery]) => {
    const nextPage = parsePositiveInt(newPageQuery, 1);
    const nextSearch = readQueryString(newSearchQuery).trim();
    if (nextPage !== currentPage.value) {
      currentPage.value = nextPage;
    }
    if (nextSearch !== appliedSearch.value) {
      appliedSearch.value = nextSearch;
      if (nextSearch !== searchQuery.value.trim()) {
        searchQuery.value = nextSearch;
      }
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

const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return '—';
  }
};

const clearSearch = () => {
  searchQuery.value = '';
  if (currentPage.value === 1 && appliedSearch.value === '') return;
  currentPage.value = 1;
  appliedSearch.value = '';
  syncRouteQuery();
};
</script>

<template>
  <div class="min-h-screen pb-20">
    <!-- Header -->
    <section class="bg-card border-b py-16 md:py-20 relative overflow-hidden">
      <div class="absolute inset-0 bg-primary/[0.02] pointer-events-none"></div>
      <div class="container mx-auto px-4 relative z-10">
        <div class="max-w-3xl space-y-4">
          <h1 class="text-4xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.95] text-foreground">
            Best Computer Hub Blogs
          </h1>
        </div>
      </div>
    </section>

    <!-- Filters & Search -->
    <section class="container mx-auto px-4 -mt-8 relative z-20">
      <div class="bg-background border rounded-[2rem] p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2 text-sm font-bold text-muted-foreground px-2">
          <FileText class="w-4 h-4 text-primary" />
          <span>Latest Articles</span>
          <span v-if="!isLoading" class="text-xs bg-muted text-foreground px-2.5 py-0.5 rounded-full font-mono">
            {{ totalCount }}
          </span>
        </div>

        <div class="relative w-full md:w-96">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            v-model="searchQuery"
            type="text"
            aria-label="Search articles by title or keyword"
            placeholder="Search articles by title or keyword..."
            class="w-full h-12 bg-muted/50 border rounded-full pl-12 pr-6 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
          />
        </div>
      </div>
    </section>

    <!-- Two-Column Content Area -->
    <section class="container mx-auto px-4 py-12 md:py-16">
      <div class="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
        <!-- Left: Main Blog Content -->
        <div class="flex-1 min-w-0 w-full">
          <!-- Error State -->
          <div v-if="errorMessage" class="bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div class="flex items-center gap-3">
              <AlertCircle class="w-5 h-5 shrink-0" />
              <p class="text-sm font-medium">{{ errorMessage }}</p>
            </div>
            <UiButton variant="outline" size="sm" class="rounded-full gap-2 shrink-0" @click="refreshPosts()">
              <RefreshCw class="w-3.5 h-3.5" />
              Retry
            </UiButton>
          </div>

          <!-- Loading Skeleton Grid -->
          <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            <div v-for="i in 6" :key="i" class="bg-card border rounded-3xl p-5 space-y-4 animate-pulse">
              <div class="aspect-[16/10] bg-muted rounded-2xl w-full"></div>
              <div class="space-y-2">
                <div class="h-4 bg-muted rounded-full w-1/3"></div>
                <div class="h-6 bg-muted rounded-full w-5/6"></div>
                <div class="h-6 bg-muted rounded-full w-2/3"></div>
              </div>
              <div class="pt-4 border-t flex justify-between items-center">
                <div class="h-4 bg-muted rounded-full w-1/4"></div>
                <div class="h-4 bg-muted rounded-full w-1/4"></div>
              </div>
            </div>
          </div>

          <!-- Posts Grid -->
          <div v-else-if="posts.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            <article
              v-for="post in posts"
              :key="post.id"
              class="bg-card border rounded-[2rem] p-5 space-y-5 flex flex-col hover:border-primary/50 transition-all duration-300 hover:shadow-lg group"
            >
              <!-- Thumbnail & Categories -->
              <NuxtLink :to="`/blog/${post.slug}/`" class="block aspect-[16/10] overflow-hidden rounded-2xl bg-muted relative">
                <img
                  :src="post.featured_image || '/logo.png'"
                  :alt="post.featured_image_alt_text || decodeHtmlEntities(post.title)"
                  :class="[
                    'w-full h-full group-hover:scale-105 transition-transform duration-500',
                    post.featured_image ? 'object-cover' : 'object-contain p-8 opacity-40'
                  ]"
                  loading="lazy"
                />
                <div v-if="post.categories && post.categories.length > 0" class="absolute top-3 left-3 flex flex-wrap gap-1">
                  <span
                    v-for="cat in post.categories"
                    :key="cat.id"
                    class="bg-background/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-primary border shadow-sm"
                  >
                    {{ decodeHtmlEntities(cat.name) }}
                  </span>
                </div>
              </NuxtLink>

              <!-- Post Content -->
              <div class="space-y-3 flex-grow">
                <div class="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                  <span class="flex items-center gap-1.5">
                    <Calendar class="w-3.5 h-3.5 text-primary" />
                    {{ formatDate(post.published_at || post.created_at) }}
                  </span>
                </div>

                <NuxtLink :to="`/blog/${post.slug}/`" class="block group/title">
                  <h2 class="text-xl font-display font-bold leading-snug group-hover/title:text-primary transition-colors line-clamp-2">
                    {{ decodeHtmlEntities(post.title) }}
                  </h2>
                </NuxtLink>

                <!-- Tags -->
                <div v-if="post.tags && post.tags.length > 0" class="flex flex-wrap gap-1.5 pt-1">
                  <span
                    v-for="tag in post.tags"
                    :key="tag.id"
                    class="text-[10px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-md"
                  >
                    #{{ decodeHtmlEntities(tag.name) }}
                  </span>
                </div>
              </div>

              <!-- Card Footer -->
              <div class="pt-4 border-t flex items-center justify-between mt-auto">
                <NuxtLink
                  :to="`/blog/${post.slug}/`"
                  class="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline group/link min-h-[36px]"
                >
                  Read Article
                  <ArrowRight class="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                </NuxtLink>
              </div>
            </article>
          </div>

          <!-- Empty State -->
          <div v-else-if="!isLoading && !errorMessage && posts.length === 0" class="py-20 flex flex-col items-center text-center space-y-5">
            <div class="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
              <FileText class="w-9 h-9 text-muted-foreground" />
            </div>
            <div class="space-y-2">
              <h2 class="text-2xl font-bold">No articles found</h2>
              <p class="text-muted-foreground max-w-sm text-sm">
                <template v-if="searchQuery">
                  We couldn't find any articles matching "{{ searchQuery }}". Try clearing your search filter.
                </template>
                <template v-else>
                  There are currently no published blog articles available.
                </template>
              </p>
            </div>
            <UiButton v-if="searchQuery" variant="outline" class="rounded-full" @click="clearSearch">
              Clear Search
            </UiButton>
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
        </div>

        <!-- Right: Blog Discovery Sidebar -->
        <aside
          aria-label="Blog discovery sidebar"
          class="w-full lg:w-80 xl:w-[340px] shrink-0 lg:sticky lg:top-28 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6"
        >
          <!-- Top Categories Widget -->
          <section class="bg-card border border-border rounded-[2rem] p-6 space-y-5 shadow-sm md:col-span-2 lg:col-span-1">
            <div class="flex items-center justify-between gap-3 border-b border-border pb-4">
              <div class="flex items-center gap-2.5">
                <FolderOpen class="w-4 h-4 text-primary shrink-0" />
                <h2 class="text-[18px] font-display font-bold text-foreground leading-tight">
                  Top Categories
                </h2>
              </div>
              <UiBadge v-if="!isCategoriesLoading && topCategories.length > 0" variant="primary" size="xs">
                Top {{ topCategories.length }}
              </UiBadge>
            </div>

            <!-- Categories Loading State -->
            <div v-if="isCategoriesLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 animate-pulse">
              <div
                v-for="i in 6"
                :key="i"
                class="h-11 rounded-xl bg-muted/70 border border-border/40"
              ></div>
            </div>

            <!-- Categories Error State (Isolated from Main Listing) -->
            <div v-else-if="categoriesErrorMessage" class="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 space-y-3">
              <div class="flex items-start gap-2.5">
                <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
                <p class="text-xs font-medium leading-relaxed">{{ categoriesErrorMessage }}</p>
              </div>
              <UiButton variant="outline" size="sm" class="w-full rounded-xl gap-1.5" @click="refreshCategories()">
                <RefreshCw class="w-3.5 h-3.5" />
                Retry Categories
              </UiButton>
            </div>

            <!-- Categories List -->
            <ul v-else-if="topCategories.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              <li
                v-for="cat in topCategories"
                :key="cat.id"
                class="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between gap-3"
              >
                <span class="text-sm font-medium text-foreground truncate">
                  {{ decodeHtmlEntities(cat.name) }}
                </span>
                <UiBadge variant="secondary" size="sm" class="tabular-nums shrink-0">
                  {{ cat.blog_post_count }}
                </UiBadge>
              </li>
            </ul>

            <!-- Categories Empty State -->
            <p v-else class="text-xs text-muted-foreground py-2 text-center">
              No blog categories available.
            </p>

            <!-- See All Categories Link -->
            <div class="pt-1 border-t border-border/70">
              <NuxtLink
                to="/blog/categories/"
                class="inline-flex items-center justify-center gap-2 w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary text-xs font-bold uppercase tracking-wider text-foreground transition-all"
              >
                <span>See All Categories</span>
                <ArrowRight class="w-3.5 h-3.5" />
              </NuxtLink>
            </div>
          </section>
        </aside>
      </div>
    </section>
  </div>
</template>
