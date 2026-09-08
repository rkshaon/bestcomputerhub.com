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
  AlertCircle,
  RefreshCw,
  BookOpen,
  Copy,
  Check,
  Type,
  ThumbsUp,
  List,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Laptop
} from 'lucide-vue-next';
import { decodeHtmlEntities } from '@/utils';
import { useBlogService } from '@/composables/useBlogService';
import { useToast } from '@/composables/useToast';
import type { BlogPostItem } from '@/types';
import UiBreadcrumbs from '@/components/ui/UiBreadcrumbs.vue';
import UiBadge from '@/components/ui/UiBadge.vue';
import UiButton from '@/components/ui/Button.vue';

const route = useRoute();
const router = useRouter();
const blogService = useBlogService();
const { toastSuccess, toastInfo } = useToast();

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

// Fetch recent posts for sidebar and footer recommendations
const { data: recentPostsData } = await useAsyncData(
  'blog-recent-posts',
  async () => {
    try {
      return await blogService.getBlogPosts({ page_size: 8 });
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
    .slice(0, 4);
});

const footerGridPosts = computed(() => {
  if (!recentPostsData.value?.results) return [];
  const currentId = post.value?.id;
  return recentPostsData.value.results
    .filter(p => p.id !== currentId)
    .slice(0, 3);
});

// Breadcrumbs setup
const breadcrumbItems = computed(() => [
  { name: 'Blog', url: '/blog/' },
  { name: post.value?.title ? decodeHtmlEntities(post.value.title) : 'Article Detail', url: `/blog/${post.value?.slug || param.value}/` }
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

// Display Name for Author
const authorDisplayName = computed(() => {
  if (!post.value?.author) return 'Best Computer Hub Editorial';
  return post.value.author.full_name || post.value.author.username || 'Best Computer Hub Editorial';
});

// Estimated Reading Time
const readingTime = computed(() => {
  if (!post.value?.content) return '3 min read';
  const text = post.value.content.replace(/<[^>]*>?/gm, '');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
});

// Table of Contents Generator from Content Headings
interface TocItem {
  id: string;
  text: string;
  level: number;
}

const tableOfContents = computed<TocItem[]>(() => {
  if (!post.value?.content) return [];
  const headings: TocItem[] = [];
  const headingRegex = /<h([23])[^>]*>(.*?)<\/h[23]>/gi;
  let match: RegExpExecArray | null;
  let index = 0;
  
  while ((match = headingRegex.exec(post.value.content)) !== null) {
    const group1 = match[1];
    const group2 = match[2];
    if (group1 && group2) {
      const level = parseInt(group1, 10);
      const rawText = group2.replace(/<[^>]*>?/gm, '').trim();
      if (rawText) {
        const id = `heading-${index++}-${rawText.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        headings.push({ id, text: decodeHtmlEntities(rawText), level });
      }
    }
  }
  return headings;
});

// Processed Content with IDs injected into H2/H3 tags for smooth navigation
const processedContent = computed(() => {
  if (!post.value?.content) return '';
  let index = 0;
  return post.value.content.replace(/<h([23])([^>]*)>(.*?)<\/h\1>/gi, (fullMatch, level, attrs, text) => {
    const rawText = text.replace(/<[^>]*>?/gm, '').trim();
    if (!rawText) return fullMatch;
    const id = `heading-${index++}-${rawText.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    return `<h${level}${attrs} id="${id}" class="scroll-mt-28">${text}</h${level}>`;
  });
});

const scrollToHeading = (id: string) => {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
};

// Reading progress bar
const scrollProgress = ref(0);
const handleScroll = () => {
  if (typeof window === 'undefined') return;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const scrollTop = window.scrollY;
  const maxScroll = documentHeight - windowHeight;
  scrollProgress.value = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
};

// Font size scaling state for long-form reading comfort
const fontSizeMode = ref<'normal' | 'large' | 'xlarge'>('normal');
const toggleFontSize = () => {
  if (fontSizeMode.value === 'normal') fontSizeMode.value = 'large';
  else if (fontSizeMode.value === 'large') fontSizeMode.value = 'xlarge';
  else fontSizeMode.value = 'normal';
};

const fontSizeClass = computed(() => {
  switch (fontSizeMode.value) {
    case 'large': return 'text-lg md:text-xl leading-relaxed';
    case 'xlarge': return 'text-xl md:text-2xl leading-relaxed';
    default: return 'text-base md:text-lg leading-relaxed';
  }
});

// Like / Helpful Article Feedback state
const isLiked = ref(false);
const toggleLike = () => {
  isLiked.value = !isLiked.value;
  if (isLiked.value) {
    toastSuccess('Thank you for your feedback!');
  }
};

// Share & Copy utilities
const isCopied = ref(false);
const shareArticle = async () => {
  if (typeof navigator !== 'undefined' && navigator.share && post.value) {
    try {
      await navigator.share({
        title: post.value.title || 'Best Computer Hub Journal',
        text: seoDescription.value || '',
        url: window.location.href
      });
      return;
    } catch {
      // Fallback to clipboard
    }
  }
  copyToClipboard();
};

const copyToClipboard = () => {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(window.location.href);
    isCopied.value = true;
    toastSuccess('Article link copied to clipboard!');
    setTimeout(() => {
      isCopied.value = false;
    }, 2500);
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
  <div class="min-h-screen bg-background text-foreground pb-24">
    <!-- Fixed Reading Progress Indicator -->
    <div 
      class="fixed top-0 left-0 h-1 bg-primary z-[60] transition-all duration-150 ease-out" 
      :style="{ width: `${scrollProgress}%` }"
    ></div>

    <!-- Sticky Sub-Header Navigation Bar -->
    <div class="bg-card/80 backdrop-blur-md border-b sticky top-0 z-30 py-3 transition-colors">
      <div class="container mx-auto px-4 max-w-7xl flex items-center justify-between gap-4">
        <UiBreadcrumbs :items="breadcrumbItems" />
        
        <div class="flex items-center gap-3 shrink-0">
          <button 
            class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            title="Adjust Text Size"
            @click="toggleFontSize"
          >
            <Type class="w-3.5 h-3.5 text-primary" />
            <span class="capitalize">{{ fontSizeMode }} Font</span>
          </button>

          <NuxtLink 
            to="/blog/" 
            class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft class="w-3.5 h-3.5" />
            <span>All Articles</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Loading State Skeleton -->
    <div v-if="isLoading" class="container mx-auto px-4 py-16 max-w-5xl space-y-10 animate-pulse">
      <div class="space-y-6 text-center max-w-3xl mx-auto">
        <div class="flex justify-center gap-2">
          <div class="h-6 w-24 bg-muted rounded-full"></div>
          <div class="h-6 w-32 bg-muted rounded-full"></div>
        </div>
        <div class="h-12 w-full bg-muted rounded-2xl"></div>
        <div class="h-10 w-3/4 bg-muted rounded-2xl mx-auto"></div>
        <div class="h-6 w-1/2 bg-muted rounded-xl mx-auto"></div>
      </div>
      <div class="aspect-[21/9] w-full bg-muted rounded-[2.5rem]"></div>
      <div class="max-w-3xl mx-auto space-y-4">
        <div class="h-4 bg-muted rounded w-full"></div>
        <div class="h-4 bg-muted rounded w-11/12"></div>
        <div class="h-4 bg-muted rounded w-4/5"></div>
        <div class="h-4 bg-muted rounded w-full"></div>
      </div>
    </div>

    <!-- Error / Not Found State -->
    <div v-else-if="error || !post" class="container mx-auto px-4 py-24 max-w-2xl text-center space-y-6">
      <div class="w-20 h-20 bg-destructive/10 text-destructive rounded-3xl flex items-center justify-center mx-auto border border-destructive/20 shadow-sm">
        <AlertCircle class="w-10 h-10" />
      </div>
      <div class="space-y-2">
        <h1 class="text-3xl font-display font-bold">Article Not Found</h1>
        <p class="text-muted-foreground text-sm max-w-md mx-auto">
          The requested article could not be loaded or may have been updated or moved.
        </p>
      </div>
      <div class="flex justify-center gap-4 pt-4">
        <UiButton variant="outline" class="gap-2 rounded-xl" @click="refresh">
          <RefreshCw class="w-4 h-4" /> Try Again
        </UiButton>
        <NuxtLink to="/blog/">
          <UiButton class="gap-2 rounded-xl">
            <ArrowLeft class="w-4 h-4" /> Return to Blog
          </UiButton>
        </NuxtLink>
      </div>
    </div>

    <!-- Article Content -->
    <template v-else>
      <!-- Article Hero Header -->
      <header class="bg-gradient-to-b from-card via-card to-background border-b py-12 md:py-16 relative overflow-hidden">
        <div class="absolute inset-0 bg-primary/[0.02] pointer-events-none"></div>
        
        <div class="container mx-auto px-4 max-w-4xl relative z-10 text-left space-y-8">
          
          <!-- Categories & Reading Metadata Header -->
          <div class="flex flex-wrap items-center gap-3">
            <template v-if="post.categories && post.categories.length > 0">
              <UiBadge 
                v-for="cat in post.categories" 
                :key="cat.id" 
                variant="primary" 
                size="sm"
              >
                {{ cat.name }}
              </UiBadge>
            </template>
            <UiBadge v-else variant="primary" size="sm">
              Hardware Insights
            </UiBadge>

            <div class="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
              <span class="flex items-center gap-1.5">
                <Calendar class="w-3.5 h-3.5 text-primary" /> {{ formatDate(post.published_at) }}
              </span>
              <span class="flex items-center gap-1.5">
                <Clock class="w-3.5 h-3.5 text-primary" /> {{ readingTime }}
              </span>
            </div>
          </div>

          <!-- Main Article Title -->
          <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-extrabold tracking-tight leading-[1.12] text-foreground">
            {{ decodeHtmlEntities(post.title) }}
          </h1>

          <!-- Article Subtitle / Excerpt Lead -->
          <p v-if="post.seo_description" class="text-lg md:text-xl text-muted-foreground font-normal leading-relaxed border-l-4 border-primary/80 pl-5 py-1 bg-muted/20 rounded-r-2xl">
            {{ post.seo_description }}
          </p>

          <!-- Author Bylines & Quick Share Toolbar -->
          <div class="flex flex-wrap items-center justify-between gap-6 pt-6 border-t border-border/80">
            <div class="flex items-center gap-3.5">
              <div class="w-12 h-12 rounded-full bg-primary/10 text-primary border-2 border-primary/20 flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                {{ authorDisplayName.charAt(0).toUpperCase() }}
              </div>
              <div class="flex flex-col">
                <span class="font-bold text-base leading-none text-foreground">{{ authorDisplayName }}</span>
                <span class="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Sparkles class="w-3 h-3 text-primary" /> Hardware & Tech Specialist
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button 
                class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-bold text-foreground transition-all cursor-pointer shadow-xs"
                title="Copy Article Link"
                @click="copyToClipboard"
              >
                <Check v-if="isCopied" class="w-4 h-4 text-success" />
                <Copy v-else class="w-4 h-4 text-primary" />
                <span>{{ isCopied ? 'Link Copied!' : 'Copy Link' }}</span>
              </button>

              <button 
                class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-bold transition-all cursor-pointer shadow-xs"
                title="Share Article"
                @click="shareArticle"
              >
                <Share2 class="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
          </div>

        </div>
      </header>

      <!-- Featured Image Container -->
      <div v-if="post.featured_image" class="container mx-auto px-4 max-w-5xl -mt-6 md:-mt-8 mb-12 relative z-20">
        <div class="aspect-[16/9] md:aspect-[21/9] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-card border shadow-2xl relative group">
          <img 
            :src="post.featured_image" 
            :alt="post.featured_image_alt_text || post.title"
            class="w-full h-full object-cover"
          />
        </div>
        <p v-if="post.featured_image_alt_text" class="text-xs text-center text-muted-foreground mt-3 font-mono">
          Photo: {{ post.featured_image_alt_text }}
        </p>
      </div>

      <!-- Main Article Editorial Layout -->
      <div class="container mx-auto px-4 max-w-7xl">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          <!-- Desktop Floating Share Utility Bar (Left) -->
          <aside class="hidden lg:flex lg:col-span-1 flex-col items-center gap-4 sticky top-28 h-fit py-2">
            <div class="bg-card border rounded-2xl p-2.5 shadow-sm space-y-3 flex flex-col items-center">
              <button 
                class="w-10 h-10 rounded-xl border border-border bg-background flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all cursor-pointer group"
                title="Share Article"
                @click="shareArticle"
              >
                <Share2 class="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>

              <button 
                class="w-10 h-10 rounded-xl border border-border bg-background flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all cursor-pointer group"
                title="Copy Link"
                @click="copyToClipboard"
              >
                <Check v-if="isCopied" class="w-4 h-4 text-success" />
                <Copy v-else class="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>

              <button 
                :class="[
                  'w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer group',
                  isLiked ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-background hover:bg-primary/10 hover:text-primary'
                ]"
                title="Helpful Article"
                @click="toggleLike"
              >
                <ThumbsUp class="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>

              <div class="w-8 h-px bg-border"></div>

              <button 
                class="w-10 h-10 rounded-xl border border-border bg-background flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all cursor-pointer"
                title="Adjust Font Size"
                @click="toggleFontSize"
              >
                <Type class="w-4 h-4" />
              </button>
            </div>
          </aside>

          <!-- Main Article Reading Column -->
          <main class="lg:col-span-7 xl:col-span-8 min-w-0 space-y-12">
            
            <!-- Table of Contents Callout (if article headings exist) -->
            <div v-if="tableOfContents.length > 0" class="bg-card border rounded-2xl p-6 space-y-4 shadow-xs">
              <div class="flex items-center gap-2 border-b border-border pb-3">
                <List class="w-4 h-4 text-primary" />
                <h3 class="text-sm font-bold uppercase tracking-wider text-foreground">In This Article</h3>
              </div>
              <nav class="space-y-2">
                <button
                  v-for="item in tableOfContents"
                  :key="item.id"
                  @click="scrollToHeading(item.id)"
                  :class="[
                    'block text-left text-xs font-medium hover:text-primary transition-colors cursor-pointer w-full py-1',
                    item.level === 3 ? 'pl-4 border-l-2 border-border/60 text-muted-foreground' : 'font-semibold text-foreground'
                  ]"
                >
                  {{ item.text }}
                </button>
              </nav>
            </div>

            <!-- Rich Content Article Body -->
            <article 
              :class="[
                'prose prose-lg dark:prose-invert max-w-none font-sans text-foreground/90 font-normal',
                'prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground',
                'prose-h2:text-2xl md:prose-h2:text-3xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:pb-2',
                'prose-h3:text-xl md:prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3',
                'prose-p:leading-relaxed prose-p:mb-6',
                'prose-a:text-primary prose-a:font-semibold prose-a:no-underline hover:prose-a:underline',
                'prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-muted/30 prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:rounded-r-2xl prose-blockquote:not-italic prose-blockquote:font-medium',
                'prose-code:bg-muted prose-code:px-2 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:font-mono',
                'prose-pre:bg-slate-950 prose-pre:text-slate-50 prose-pre:p-6 prose-pre:rounded-2xl prose-pre:shadow-lg',
                'prose-img:rounded-2xl prose-img:shadow-md prose-img:border',
                'prose-ul:list-disc prose-ol:list-decimal prose-li:my-1.5',
                fontSizeClass
              ]"
            >
              <div v-if="post.content" v-html="processedContent"></div>
              <p v-else class="text-muted-foreground italic py-8 text-center">
                No article content available.
              </p>
            </article>

            <!-- Tags Section -->
            <div v-if="post.tags && post.tags.length > 0" class="pt-8 border-t flex flex-wrap gap-2 items-center">
              <span class="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-2 flex items-center gap-1.5">
                <TagIcon class="w-3.5 h-3.5 text-primary" /> Tags:
              </span>
              <span 
                v-for="tag in post.tags" 
                :key="tag.id" 
                class="px-3.5 py-1 bg-muted/80 hover:bg-primary/10 hover:text-primary border border-border rounded-full text-xs font-semibold text-muted-foreground transition-all cursor-pointer uppercase tracking-wider"
              >
                #{{ tag.name }}
              </span>
            </div>

            <!-- Helpful Article Feedback Card -->
            <div class="bg-card border rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div class="space-y-1 text-center sm:text-left">
                <h4 class="font-bold text-sm text-foreground">Was this article helpful?</h4>
                <p class="text-xs text-muted-foreground">Your feedback helps us deliver better tech hardware guides.</p>
              </div>

              <div class="flex items-center gap-3 shrink-0">
                <UiButton 
                  :variant="isLiked ? 'primary' : 'outline'" 
                  size="sm" 
                  class="rounded-xl gap-2 text-xs font-bold"
                  @click="toggleLike"
                >
                  <ThumbsUp class="w-3.5 h-3.5" />
                  <span>{{ isLiked ? 'Helpful!' : 'Yes, Helpful' }}</span>
                </UiButton>
              </div>
            </div>

            <!-- Author Bio Spotlight Card -->
            <div class="bg-card border rounded-[2rem] p-6 md:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-xs relative overflow-hidden">
              <div class="w-20 h-20 rounded-2xl bg-primary/10 text-primary border-2 border-primary/20 flex items-center justify-center font-bold text-2xl shadow-sm shrink-0">
                {{ authorDisplayName.charAt(0).toUpperCase() }}
              </div>
              <div class="space-y-3 text-center sm:text-left flex-1 min-w-0">
                <div class="space-y-1">
                  <span class="text-[10px] font-bold uppercase tracking-widest text-primary">Written By</span>
                  <h3 class="text-xl font-display font-bold text-foreground leading-none">{{ authorDisplayName }}</h3>
                  <p class="text-xs text-muted-foreground font-medium">Hardware Specialist & Technical Reviewer at Best Computer Hub</p>
                </div>
                <p class="text-xs text-muted-foreground leading-relaxed">
                  Covering desktop hardware architecture, GPU benchmarks, workstation performance tuning, and PC gaming component reviews in Bangladesh.
                </p>
                <NuxtLink to="/blog/" class="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline pt-1">
                  <span>View All Journal Articles</span>
                  <ChevronRight class="w-3.5 h-3.5" />
                </NuxtLink>
              </div>
            </div>

            <!-- Article Footer Navigation & Share Bar -->
            <div class="pt-8 border-t flex flex-wrap items-center justify-between gap-4">
              <NuxtLink to="/blog/">
                <UiButton variant="outline" class="gap-2 rounded-xl text-xs font-bold uppercase tracking-wider">
                  <ArrowLeft class="w-4 h-4" /> All Articles
                </UiButton>
              </NuxtLink>

              <div class="flex items-center gap-2">
                <button 
                  class="p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-all cursor-pointer"
                  title="Copy Article Link"
                  aria-label="Copy Article Link"
                  @click="copyToClipboard"
                >
                  <Copy class="w-4 h-4" />
                </button>
                <button 
                  class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                  @click="shareArticle"
                >
                  <Share2 class="w-4 h-4" /> Share Article
                </button>
              </div>
            </div>

          </main>

          <!-- Right Editorial Sidebar -->
          <aside class="lg:col-span-4 xl:col-span-3 space-y-8 sticky top-28">
            
            <!-- Recommended Articles Box -->
            <div class="bg-card border rounded-[2rem] p-6 space-y-6 shadow-xs">
              <div class="flex items-center justify-between border-b border-border pb-4">
                <div class="flex items-center gap-2">
                  <BookOpen class="w-4 h-4 text-primary" />
                  <h3 class="text-base font-display font-bold text-foreground">Recommended Reads</h3>
                </div>
              </div>

              <div v-if="recentPosts.length > 0" class="space-y-5">
                <article v-for="item in recentPosts" :key="item.id" class="group flex gap-3.5 items-start">
                  <NuxtLink 
                    :to="`/blog/${item.slug}/`" 
                    class="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-muted border block relative"
                  >
                    <img 
                      :src="item.featured_image || '/logo.svg'" 
                      :alt="item.featured_image_alt_text || item.title"
                      :class="[
                        'w-full h-full group-hover:scale-105 transition-transform duration-500',
                        item.featured_image ? 'object-cover' : 'object-contain p-2 opacity-50'
                      ]" 
                    />
                  </NuxtLink>
                  <div class="space-y-1 flex-1 min-w-0">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-primary block truncate">
                      {{ item.categories?.[0]?.name || 'Hardware' }}
                    </span>
                    <NuxtLink :to="`/blog/${item.slug}/`" class="block">
                      <h4 class="font-bold text-xs leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
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
                No related articles available.
              </div>

              <NuxtLink to="/blog/" class="block pt-1">
                <UiButton variant="outline" class="w-full rounded-xl gap-2 h-10 text-xs font-bold uppercase tracking-wider">
                  Explore Blog <ChevronRight class="w-3.5 h-3.5" />
                </UiButton>
              </NuxtLink>
            </div>

            <!-- Popular Hardware Categories Box -->
            <div class="bg-card border rounded-[2rem] p-6 space-y-4 shadow-xs">
              <div class="flex items-center gap-2 border-b border-border pb-3">
                <Laptop class="w-4 h-4 text-primary" />
                <h3 class="text-base font-display font-bold text-foreground">Explore Hardware</h3>
              </div>
              <div class="flex flex-wrap gap-2">
                <NuxtLink 
                  to="/product-category/gaming-component/" 
                  class="px-3 py-1.5 bg-muted/70 hover:bg-primary/10 hover:text-primary border border-border rounded-xl text-xs font-medium text-foreground transition-all"
                >
                  Gaming Components
                </NuxtLink>
                <NuxtLink 
                  to="/product-category/laptop/" 
                  class="px-3 py-1.5 bg-muted/70 hover:bg-primary/10 hover:text-primary border border-border rounded-xl text-xs font-medium text-foreground transition-all"
                >
                  Laptops & Notebooks
                </NuxtLink>
                <NuxtLink 
                  to="/products/" 
                  class="px-3 py-1.5 bg-muted/70 hover:bg-primary/10 hover:text-primary border border-border rounded-xl text-xs font-medium text-foreground transition-all"
                >
                  All Tech Products
                </NuxtLink>
              </div>
            </div>

            <!-- Storefront Promo Banner -->
            <div class="bg-gradient-to-br from-primary via-primary to-primary/90 rounded-[2rem] p-6 text-primary-foreground space-y-4 shadow-md relative overflow-hidden">
              <div class="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
              <div class="space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full inline-block">
                  Best Computer Hub
                </span>
                <h3 class="text-xl font-display font-bold leading-tight">Authentic Hardware & Tech Warranty</h3>
              </div>
              <p class="text-xs text-primary-foreground/90 leading-relaxed">
                Explore official PC parts, gaming gear, laptops, and enterprise hardware with official warranty support.
              </p>
              <NuxtLink to="/products/" class="block pt-2">
                <UiButton variant="secondary" class="w-full rounded-xl h-11 font-bold text-xs uppercase tracking-wider shadow-sm gap-2">
                  <ShoppingBag class="w-4 h-4" /> Browse Catalog
                </UiButton>
              </NuxtLink>
            </div>

          </aside>

        </div>
      </div>

      <!-- Bottom Recommended Articles Grid -->
      <section v-if="footerGridPosts.length > 0" class="bg-card/60 border-t py-16 mt-20">
        <div class="container mx-auto px-4 max-w-7xl space-y-10">
          <div class="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-border pb-6">
            <div class="space-y-1">
              <span class="text-xs font-bold uppercase tracking-widest text-primary">More From The Hub</span>
              <h2 class="text-2xl sm:text-3xl font-display font-bold text-foreground">Explore Further Tech Journal Articles</h2>
            </div>
            <NuxtLink to="/blog/">
              <UiButton variant="outline" class="rounded-xl gap-2 text-xs font-bold uppercase tracking-wider">
                View All Articles <ChevronRight class="w-4 h-4" />
              </UiButton>
            </NuxtLink>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <article 
              v-for="item in footerGridPosts" 
              :key="item.id"
              class="bg-background border rounded-[2rem] p-5 space-y-4 flex flex-col hover:border-primary/50 transition-all duration-300 hover:shadow-lg group"
            >
              <NuxtLink :to="`/blog/${item.slug}/`" class="block aspect-[16/10] overflow-hidden rounded-2xl bg-muted relative">
                <img 
                  :src="item.featured_image || '/logo.svg'" 
                  :alt="item.featured_image_alt_text || item.title"
                  :class="[
                    'w-full h-full group-hover:scale-105 transition-transform duration-500',
                    item.featured_image ? 'object-cover' : 'object-contain p-8 opacity-40'
                  ]" 
                />
              </NuxtLink>
              <div class="space-y-2 flex-1">
                <span class="text-[10px] font-bold uppercase tracking-widest text-primary block">
                  {{ item.categories?.[0]?.name || 'Insights' }}
                </span>
                <NuxtLink :to="`/blog/${item.slug}/`" class="block">
                  <h3 class="font-display font-bold text-base leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {{ decodeHtmlEntities(item.title) }}
                  </h3>
                </NuxtLink>
              </div>
              <div class="pt-3 border-t flex items-center justify-between text-xs text-muted-foreground mt-auto">
                <span>{{ formatDate(item.published_at) }}</span>
                <NuxtLink :to="`/blog/${item.slug}/`" class="text-primary font-bold hover:underline flex items-center gap-1">
                  Read <ChevronRight class="w-3 h-3" />
                </NuxtLink>
              </div>
            </article>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
