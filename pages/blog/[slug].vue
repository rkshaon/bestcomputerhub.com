<!-- File: /pages/blog/[slug].vue -->
<script setup lang="ts">
import { ArrowLeft, Calendar, Clock, Share2, Tag, ChevronRight, User } from 'lucide-vue-next';

const route = useRoute();
const blogService = useBlogService();
const slug = route.params.slug as string;
const post = blogService.getPostBySlug(slug);

if (!post) {
  throw createError({ statusCode: 404, statusMessage: 'Article not found' });
}

const recentPosts = blogService.getRecentPosts(3).filter(p => p.id !== post.id);

// Scroll progress for reading indicator
const scrollProgress = ref(0);
const handleScroll = () => {
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const scrollTop = window.scrollY;
  scrollProgress.value = (scrollTop / (documentHeight - windowHeight)) * 100;
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <div class="min-h-screen">
    <!-- Reading Progress Bar -->
    <div 
      class="fixed top-0 left-0 h-1 bg-primary z-[60] transition-all duration-100 ease-out" 
      :style="{ width: `${scrollProgress}%` }"
    ></div>

    <!-- Article Hero -->
    <header class="bg-card border-b py-20 md:py-32 overflow-hidden relative">
      <div class="absolute inset-0 bg-primary/[0.01] pointer-events-none"></div>
      <div class="container mx-auto px-4 relative z-10">
        <div class="max-w-4xl mx-auto space-y-8">
          <NuxtLink to="/blog" class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft class="w-4 h-4" />
            Back to Journal
          </NuxtLink>

          <div class="space-y-6">
            <div class="flex flex-wrap items-center gap-4">
              <span class="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                {{ post.category }}
              </span>
              <div class="flex items-center gap-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <span class="flex items-center gap-1.5"><Calendar class="w-3.5 h-3.5" /> {{ post.publishedAt }}</span>
                <span class="flex items-center gap-1.5"><Clock class="w-3.5 h-3.5" /> {{ post.readingTime }}</span>
              </div>
            </div>
            
            <h1 class="text-4xl md:text-6xl font-display font-extrabold tracking-tight leading-tight">
              {{ post.title }}
            </h1>
            
            <div class="flex items-center gap-4 pt-4">
              <img :src="post.author.avatar" class="w-12 h-12 rounded-full border-2 border-background shadow-lg" />
              <div class="flex flex-col">
                <span class="font-bold text-lg leading-none">{{ post.author.name }}</span>
                <span class="text-sm text-muted-foreground">{{ post.author.role }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="container mx-auto px-4 py-20">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-16 max-w-7xl mx-auto">
        <!-- Sidebar Navigation (Desktop) -->
        <aside class="hidden lg:block lg:col-span-1 sticky top-32 h-fit">
          <div class="flex flex-col gap-6 items-center">
            <button class="w-12 h-12 rounded-full border border-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all group">
              <Share2 class="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
            <div class="w-px h-12 bg-muted/50"></div>
          </div>
        </aside>

        <!-- Article Body -->
        <main class="lg:col-span-7 space-y-12">
          <div class="aspect-video rounded-[3rem] overflow-hidden bg-muted border shadow-2xl">
            <img :src="post.image" class="w-full h-full object-cover" />
          </div>

          <div class="prose prose-lg dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-primary hover:prose-a:underline prose-img:rounded-[2rem] prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:p-8 prose-blockquote:rounded-3xl prose-blockquote:not-italic font-sans leading-relaxed text-muted-foreground">
             <div v-html="post.content"></div>
          </div>

          <!-- Tags -->
          <div class="pt-12 border-t flex flex-wrap gap-3">
             <NuxtLink 
              v-for="tag in post.tags" 
              :key="tag" 
              to="#"
              class="px-4 py-2 bg-muted rounded-full text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-all uppercase tracking-widest text-muted-foreground"
            >
              #{{ tag }}
            </NuxtLink>
          </div>
        </main>

        <!-- Recommendations Section -->
        <aside class="lg:col-span-4 space-y-12">
          <div class="bg-card border rounded-[2.5rem] p-8 space-y-8">
            <h3 class="text-xl font-display font-bold">Latest in Hardware</h3>
            <div class="space-y-8">
              <article v-for="item in recentPosts" :key="item.id" class="group flex gap-4">
                <NuxtLink :to="`/blog/${item.slug}`" class="w-20 h-20 shrink-0 rounded-2xl overflow-hidden bg-muted border block">
                  <img :src="item.image" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </NuxtLink>
                <div class="space-y-1">
                  <span class="text-[10px] font-bold uppercase tracking-widest text-primary">{{ item.category }}</span>
                  <NuxtLink :to="`/blog/${item.slug}`" class="block">
                    <h4 class="font-bold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">{{ item.title }}</h4>
                  </NuxtLink>
                  <span class="text-[10px] text-muted-foreground">{{ item.publishedAt }}</span>
                </div>
              </article>
            </div>
            <UiButton variant="outline" class="w-full rounded-2xl gap-2 h-12" @click="navigateTo('/blog')">
              Explore All Insights <ChevronRight class="w-4 h-4" />
            </UiButton>
          </div>

          <!-- Newsletter Card -->
          <div class="bg-primary rounded-[2.5rem] p-8 text-primary-foreground space-y-6 relative overflow-hidden">
            <div class="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full"></div>
            <h3 class="text-2xl font-display font-bold leading-tight">Join the Inner Circuit.</h3>
            <p class="text-sm text-primary-foreground/80 leading-relaxed">
              Weekly deep dives into the manufacturing processes and tech trends reshaping the enterprise field.
            </p>
            <input type="email" placeholder="Work email address" class="w-full h-12 bg-white/10 border border-white/20 rounded-full px-6 outline-none focus:ring-2 focus:ring-white/40 placeholder:text-white/40 text-sm font-medium" />
            <UiButton variant="secondary" class="w-full rounded-full h-12 font-bold shadow-xl">Subscribe Now</UiButton>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<style>
/* Nuxt Prose overrides would normally go here in a full project */
.prose h2 {
  @apply text-foreground mt-12 mb-6;
}
.prose h3 {
  @apply text-foreground mt-8 mb-4;
}
.prose p {
  @apply mb-6;
}
.prose ul {
  @apply list-disc pl-6 mb-6 space-y-2;
}
.prose li {
  @apply text-muted-foreground;
}
</style>
