<!-- File: /pages/blog/[slug].vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Share2, 
  Tag as TagIcon, 
  ChevronRight, 
  User, 
  Folder, 
  AlertCircle,
  RefreshCw,
  BookOpen
} from 'lucide-vue-next';
import { decodeHtmlEntities } from '@/utils';
import { useBlogService } from '@/composables/useBlogService';
import type { BlogPostItem } from '@/types';
import UiBreadcrumbs from '@/components/ui/UiBreadcrumbs.vue';
import UiButton from '@/components/ui/Button.vue';

const route = useRoute();
const router = useRouter();
const blogService = useBlogService();

const param = computed(() => String(route.params.slug || ''));

// Fetch main blog post details using ID / slug
const { data: post, pending: isLoading, error, refresh } = await useAsyncData<BlogPostItem | null>(
  `blog-post-detail-${param.value}`,
  async () => {
    const val = param.value.trim();
    if (!val) return null;

    try {
      // 1. First attempt direct GET /api/v1/blog/posts/{id}/
      return await blogService.getBlogPost(val);
    } catch (firstErr: any) {
      // 2. If param is a non-numeric slug, query post list to resolve ID
      if (isNaN(Number(val))) {
        try {
          const listRes = await blogService.getBlogPosts({ search: val, page_size: 50 });
          const matched = listRes.results.find(p => p.slug === val || String(p.id) === val);
          if (matched && matched.id) {
            return await blogService.getBlogPost(matched.id);
          }
        } catch {
          // Ignore secondary fallback error
        }
      }
      throw firstErr;
    }
  },
  {
    watch: [param]
  }
);

// Fetch recent posts for sidebar recommendations
const { data: recentPostsData } = await useAsyncData(
  'blog-recent-posts',
  async () => {
    try {
      return await blogService.getBlogPosts({ page_size: 5 });
    } catch {
      return null;
    }
  }
);

const recentPosts = computed(() => {
  if (!recentPostsData.value?.results) return [];
  const currentId = post.value?.id;
  return recentPostsData.value.results
    .filter(p => p.id !== currentId)
    .slice(0, 3);
});

// Breadcrumbs setup
const breadcrumbItems = computed(() => [
  { name: 'Blog', url: '/blog/' },
  { name: post.value?.title || 'Article Detail', url: `/blog/${post.value?.slug || param.value}/` }
]);

// Robots directive computation (seo_noindex, seo_nofollow)
const robotsContent = computed(() => {
  if (!post.value) return undefined;
  const noindex = post.value.seo_noindex ? 'noindex' : 'index';
  const nofollow = post.value.seo_nofollow ? 'nofollow' : 'follow';
  if (noindex === 'index' && nofollow === 'follow') return 'index, follow';
  return `${noindex}, ${nofollow}`;
});

const seoTitle = computed(() => post.value?.seo_title || post.value?.title || 'Blog Article | Best Computer Hub');
const seoDescription = computed(() => {
  if (post.value?.seo_description) return post.value.seo_description;
  if (post.value?.content) {
    const cleanText = post.value.content.replace(/<[^>]*>?/gm, '').trim();
    return cleanText.slice(0, 160) + (cleanText.length > 160 ? '...' : '');
  }
  return 'Read the latest technology updates and hardware reviews at Best Computer Hub.';
});

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
  ogImage: () => post.value?.featured_image || '/logo.svg',
  robots: robotsContent
});

useHead({
  link: [
    {
      rel: 'canonical',
      href: computed(() => post.value?.slug ? `/blog/${post.value.slug}/` : `/blog/`)
    }
  ]
});

// Safe Date Formatter
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Recently Published';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently Published';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return 'Recently Published';
  }
};

// Display Name for Author (no sensitive email exposed)
const authorDisplayName = computed(() => {
  if (!post.value?.author) return 'Editorial Team';
  return post.value.author.full_name || post.value.author.username || 'Editorial Team';
});

// Estimated Reading Time
const readingTime = computed(() => {
  if (!post.value?.content) return '3 min read';
  const text = post.value.content.replace(/<[^>]*>?/gm, '');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
});

// Scroll progress for reading indicator
const scrollProgress = ref(0);
const handleScroll = () => {
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const scrollTop = window.scrollY;
  const maxScroll = documentHeight - windowHeight;
  scrollProgress.value = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
};

// Share functionality
const shareArticle = () => {
  if (typeof navigator !== 'undefined' && navigator.share && post.value) {
    navigator.share({
      title: post.value.title,
      text: seoDescription.value,
      url: window.location.href
    }).catch(() => {});
  } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(window.location.href);
    alert('Article link copied to clipboard!');
  }
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <div class="min-h-screen bg-background text-foreground pb-20">
    <!-- Reading Progress Bar -->
    <div 
      class="fixed top-0 left-0 h-1 bg-primary z-[60] transition-all duration-100 ease-out" 
      :style="{ width: `${scrollProgress}%` }"
    ></div>

    <!-- Header / Navigation Bar -->
    <div class="bg-card border-b py-4">
      <div class="container mx-auto px-4 max-w-7xl flex items-center justify-between gap-4">
        <UiBreadcrumbs :items="breadcrumbItems" />
        <NuxtLink 
          to="/blog/" 
          class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors shrink-0"
        >
          <ArrowLeft class="w-3.5 h-3.5" />
          <span>All Articles</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Loading State Skeleton -->
    <div v-if="isLoading" class="container mx-auto px-4 py-16 max-w-7xl space-y-12 animate-pulse">
      <div class="max-w-4xl space-y-6">
        <div class="flex gap-2">
          <div class="h-6 w-24 bg-muted rounded-full"></div>
          <div class="h-6 w-32 bg-muted rounded-full"></div>
        </div>
        <div class="h-12 w-3/4 bg-muted rounded-2xl"></div>
        <div class="h-6 w-1/2 bg-muted rounded-xl"></div>
      </div>
      <div class="aspect-video w-full bg-muted rounded-[2.5rem]"></div>
      <div class="max-w-4xl space-y-4">
        <div class="h-4 bg-muted rounded w-full"></div>
        <div class="h-4 bg-muted rounded w-5/6"></div>
        <div class="h-4 bg-muted rounded w-4/6"></div>
      </div>
    </div>

    <!-- Error / Not Found State -->
    <div v-else-if="error || !post" class="container mx-auto px-4 py-24 max-w-2xl text-center space-y-6">
      <div class="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
        <AlertCircle class="w-8 h-8" />
      </div>
      <div class="space-y-2">
        <h1 class="text-2xl font-display font-bold">Article Not Found</h1>
        <p class="text-sm text-muted-foreground">
          The requested blog article could not be loaded or may no longer exist.
        </p>
      </div>
      <div class="flex justify-center gap-4 pt-4">
        <UiButton variant="outline" class="gap-2" @click="refresh">
          <RefreshCw class="w-4 h-4" /> Try Again
        </UiButton>
        <NuxtLink to="/blog/">
          <UiButton class="gap-2">
            <ArrowLeft class="w-4 h-4" /> Back to Blog
          </UiButton>
        </NuxtLink>
      </div>
    </div>

    <!-- Loaded Article View -->
    <template v-else>
      <!-- Article Hero Header -->
      <header class="bg-card border-b py-12 md:py-20 relative overflow-hidden">
        <div class="absolute inset-0 bg-primary/[0.015] pointer-events-none"></div>
        <div class="container mx-auto px-4 max-w-7xl relative z-10">
          <div class="max-w-4xl space-y-6">
            
            <!-- Category Chips & Date -->
            <div class="flex flex-wrap items-center gap-3">
              <template v-if="post.categories && post.categories.length > 0">
                <span 
                  v-for="cat in post.categories" 
                  :key="cat.id" 
                  class="bg-primary/10 text-primary px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-primary/20"
                >
                  {{ cat.name }}
                </span>
              </template>
              <span v-else class="bg-primary/10 text-primary px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                Insights
              </span>

              <div class="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-muted-foreground ml-2">
                <span class="flex items-center gap-1.5">
                  <Calendar class="w-3.5 h-3.5" /> {{ formatDate(post.published_at) }}
                </span>
                <span class="flex items-center gap-1.5">
                  <Clock class="w-3.5 h-3.5" /> {{ readingTime }}
                </span>
              </div>
            </div>

            <!-- Article Title -->
            <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-extrabold tracking-tight leading-[1.15] text-foreground">
              {{ decodeHtmlEntities(post.title) }}
            </h1>

            <!-- Author & Metadata Footer -->
            <div class="flex items-center justify-between gap-4 pt-4 border-t border-border/60">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm">
                  {{ authorDisplayName.charAt(0).toUpperCase() }}
                </div>
                <div class="flex flex-col">
                  <span class="font-bold text-sm leading-none text-foreground">{{ authorDisplayName }}</span>
                  <span class="text-xs text-muted-foreground mt-0.5">Author & Hardware Specialist</span>
                </div>
              </div>

              <!-- Share Button -->
              <button 
                class="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-all cursor-pointer"
                title="Share this article"
                aria-label="Share article"
                @click="shareArticle"
              >
                <Share2 class="w-3.5 h-3.5 text-primary" />
                <span class="hidden sm:inline">Share</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      <!-- Main Article Body & Sidebar Container -->
      <div class="container mx-auto px-4 py-12 md:py-16 max-w-7xl">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          <!-- Sticky Share Bar (Desktop) -->
          <aside class="hidden lg:block lg:col-span-1 sticky top-32 h-fit">
            <div class="flex flex-col gap-4 items-center">
              <button 
                class="w-11 h-11 rounded-full border border-border bg-card flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-xs cursor-pointer group"
                title="Share article"
                aria-label="Share article"
                @click="shareArticle"
              >
                <Share2 class="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
              <div class="w-px h-10 bg-border"></div>
            </div>
          </aside>

          <!-- Main Article Article Body -->
          <main class="lg:col-span-7 space-y-10">
            
            <!-- Featured Image -->
            <div v-if="post.featured_image" class="aspect-video rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-muted border shadow-lg relative">
              <img 
                :src="post.featured_image" 
                :alt="post.featured_image_alt_text || post.title"
                class="w-full h-full object-cover"
              />
            </div>

            <!-- Content HTML Body -->
            <article class="prose prose-lg dark:prose-invert max-w-none font-sans leading-relaxed text-foreground/90 font-normal prose-headings:font-display prose-headings:font-bold prose-a:text-primary hover:prose-a:underline prose-img:rounded-2xl prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:p-6 prose-blockquote:rounded-r-2xl prose-blockquote:not-italic">
              <div v-if="post.content" v-html="post.content"></div>
              <p v-else class="text-muted-foreground italic">
                No article content available.
              </p>
            </article>

            <!-- Tags Footer -->
            <div v-if="post.tags && post.tags.length > 0" class="pt-8 border-t flex flex-wrap gap-2.5 items-center">
              <span class="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1 flex items-center gap-1">
                <TagIcon class="w-3.5 h-3.5" /> Tags:
              </span>
              <span 
                v-for="tag in post.tags" 
                :key="tag.id" 
                class="px-3 py-1 bg-muted/80 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
              >
                #{{ tag.name }}
              </span>
            </div>

            <!-- Bottom Article Navigation -->
            <div class="pt-8 border-t flex items-center justify-between gap-4">
              <NuxtLink to="/blog/">
                <UiButton variant="outline" class="gap-2 rounded-xl text-xs font-bold uppercase tracking-wider">
                  <ArrowLeft class="w-4 h-4" /> All Blog Posts
                </UiButton>
              </NuxtLink>
              
              <button 
                class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold uppercase tracking-wider text-foreground transition-all cursor-pointer"
                @click="shareArticle"
              >
                <Share2 class="w-4 h-4 text-primary" /> Share Article
              </button>
            </div>

          </main>

          <!-- Sidebar / Recommended Articles -->
          <aside class="lg:col-span-4 space-y-8">
            
            <!-- Recent Insights Card -->
            <div class="bg-card border rounded-[2rem] p-6 md:p-8 space-y-6 shadow-xs">
              <div class="flex items-center gap-2 border-b border-border pb-4">
                <BookOpen class="w-4 h-4 text-primary" />
                <h3 class="text-lg font-display font-bold text-foreground">Recommended Articles</h3>
              </div>

              <div v-if="recentPosts.length > 0" class="space-y-6">
                <article v-for="item in recentPosts" :key="item.id" class="group flex gap-4 items-start">
                  <NuxtLink 
                    :to="`/blog/${item.slug}/`" 
                    class="w-20 h-20 shrink-0 rounded-2xl overflow-hidden bg-muted border block relative"
                  >
                    <img 
                      :src="item.featured_image || '/logo.svg'" 
                      :alt="item.featured_image_alt_text || item.title"
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  </NuxtLink>
                  <div class="space-y-1 flex-1 min-w-0">
                    <span class="text-[10px] font-bold uppercase tracking-widest text-primary block truncate">
                      {{ item.categories?.[0]?.name || 'Tech' }}
                    </span>
                    <NuxtLink :to="`/blog/${item.slug}/`" class="block">
                      <h4 class="font-bold text-sm leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                        {{ decodeHtmlEntities(item.title) }}
                      </h4>
                    </NuxtLink>
                    <span class="text-[10px] text-muted-foreground block">
                      {{ formatDate(item.published_at) }}
                    </span>
                  </div>
                </article>
              </div>

              <div v-else class="text-xs text-muted-foreground py-2 text-center">
                No recent recommendations available.
              </div>

              <NuxtLink to="/blog/" class="block pt-2">
                <UiButton variant="outline" class="w-full rounded-xl gap-2 h-11 text-xs font-bold uppercase tracking-wider">
                  Explore Blog <ChevronRight class="w-4 h-4" />
                </UiButton>
              </NuxtLink>
            </div>

            <!-- Storefront Promo Card -->
            <div class="bg-gradient-to-br from-primary to-primary/80 rounded-[2rem] p-6 md:p-8 text-primary-foreground space-y-4 shadow-md relative overflow-hidden">
              <div class="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
              <h3 class="text-xl font-display font-bold leading-tight">Need Custom Hardware Solutions?</h3>
              <p class="text-xs text-primary-foreground/90 leading-relaxed">
                Discover authentic gaming components, laptops, and enterprise hardware with direct warranty and expert Bangladesh support.
              </p>
              <NuxtLink to="/products/" class="block pt-2">
                <UiButton variant="secondary" class="w-full rounded-xl h-11 font-bold text-xs uppercase tracking-wider shadow-sm">
                  Shop Products
                </UiButton>
              </NuxtLink>
            </div>

          </aside>

        </div>
      </div>
    </template>
  </div>
</template>
