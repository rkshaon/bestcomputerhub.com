<!-- File: /pages/blog/index.vue -->
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { Calendar, User, ArrowRight, Search, FileText, AlertCircle, RefreshCw } from 'lucide-vue-next';
import { refDebounced } from '@vueuse/core';
import { useBlogService } from '@/composables/useBlogService';
import { extractErrorMessage } from '@/composables/useToast';
import type { BlogPostItem } from '@/types';

useSeoMeta({
  title: 'Blog & Tech Insights | Best Computer Hub',
  description: 'Read the latest PC hardware reviews, gaming benchmarks, buying guides, and tech news at Best Computer Hub.',
  ogTitle: 'Blog & Tech Insights | Best Computer Hub',
  ogDescription: 'Read the latest PC hardware reviews, gaming benchmarks, buying guides, and tech news at Best Computer Hub.',
  ogImage: '/logo.svg'
});

const blogService = useBlogService();

const searchQuery = ref('');
const debouncedSearch = refDebounced(searchQuery, 300);

const currentPage = ref(1);
const pageSize = ref(9);
const posts = ref<BlogPostItem[]>([]);
const totalCount = ref(0);
const totalPages = ref(1);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);

const fetchPosts = async () => {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    const res = await blogService.getBlogPosts({
      page: currentPage.value,
      page_size: pageSize.value,
      search: debouncedSearch.value,
      status: 'PUBLISHED'
    });

    posts.value = res.results || [];
    totalCount.value = res.count || 0;
    totalPages.value = Math.max(1, Math.ceil(totalCount.value / pageSize.value));
  } catch (err: any) {
    errorMessage.value = extractErrorMessage(err, 'Failed to retrieve blog posts. Please try again.');
  } finally {
    isLoading.value = false;
  }
};

watch(debouncedSearch, () => {
  currentPage.value = 1;
  fetchPosts();
});

const onPageChange = (newPage: number) => {
  currentPage.value = newPage;
  fetchPosts();
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
  currentPage.value = 1;
  fetchPosts();
};

onMounted(() => {
  fetchPosts();
});
</script>

<template>
  <div class="min-h-screen pb-20">
    <!-- Header -->
    <section class="bg-card border-b py-16 md:py-20 relative overflow-hidden">
      <div class="absolute inset-0 bg-primary/[0.02] pointer-events-none"></div>
      <div class="container mx-auto px-4 relative z-10">
        <div class="max-w-3xl space-y-4">
          <div class="inline-flex items-center gap-2 bg-primary/10 text-primary px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
            Best Computer Hub Journal
          </div>
          <h1 class="text-4xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.95]">
            Blog & <span class="text-primary italic">Tech Insights</span>.
          </h1>
          <p class="text-lg text-muted-foreground leading-relaxed max-w-xl">
            Read the latest PC hardware reviews, gaming benchmarks, buying guides, and enterprise computing news.
          </p>
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
            placeholder="Search articles by title or keyword..." 
            class="w-full h-12 bg-muted/50 border rounded-full pl-12 pr-6 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
          />
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
        <UiButton variant="outline" size="sm" class="rounded-full gap-2 shrink-0" @click="fetchPosts">
          <RefreshCw class="w-3.5 h-3.5" />
          Retry
        </UiButton>
      </div>

      <!-- Loading Skeleton Grid -->
      <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
      <div v-else-if="posts.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <article 
          v-for="post in posts" 
          :key="post.id"
          class="bg-card border rounded-[2rem] p-5 space-y-5 flex flex-col hover:border-primary/50 transition-all duration-300 hover:shadow-lg group"
        >
          <!-- Thumbnail & Categories -->
          <NuxtLink :to="`/blog/${post.slug}/`" class="block aspect-[16/10] overflow-hidden rounded-2xl bg-muted relative">
            <img 
              :src="post.featured_image || '/placeholder-image.webp'" 
              :alt="post.featured_image_alt_text || post.title"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div v-if="post.categories && post.categories.length > 0" class="absolute top-3 left-3 flex flex-wrap gap-1">
              <span 
                v-for="cat in post.categories" 
                :key="cat.id" 
                class="bg-background/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-primary border shadow-sm"
              >
                {{ cat.name }}
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
              <span v-if="post.author" class="flex items-center gap-1.5">
                <User class="w-3.5 h-3.5 text-primary" /> 
                {{ post.author.full_name || post.author.username }}
              </span>
            </div>

            <NuxtLink :to="`/blog/${post.slug}/`" class="block group/title">
              <h2 class="text-xl font-display font-bold leading-snug group-hover/title:text-primary transition-colors line-clamp-2">
                {{ post.title }}
              </h2>
            </NuxtLink>

            <!-- Tags -->
            <div v-if="post.tags && post.tags.length > 0" class="flex flex-wrap gap-1.5 pt-1">
              <span 
                v-for="tag in post.tags" 
                :key="tag.id"
                class="text-[10px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-md"
              >
                #{{ tag.name }}
              </span>
            </div>
          </div>

          <!-- Card Footer -->
          <div class="pt-4 border-t flex items-center justify-between mt-auto">
            <span class="text-xs font-medium text-muted-foreground">
              By {{ post.author?.full_name || post.author?.username || 'Best Computer Hub' }}
            </span>
            <NuxtLink 
              :to="`/blog/${post.slug}/`" 
              class="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline group/link"
            >
              Read Article 
              <ArrowRight class="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
            </NuxtLink>
          </div>
        </article>
      </div>

      <!-- Empty State -->
      <div v-else-if="!isLoading && posts.length === 0" class="py-20 flex flex-col items-center text-center space-y-5">
        <div class="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
          <FileText class="w-9 h-9 text-muted-foreground" />
        </div>
        <div class="space-y-2">
          <h3 class="text-2xl font-bold">No articles found</h3>
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
    </section>
  </div>
</template>
