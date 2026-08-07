<!-- File: /pages/blog/index.vue -->
<script setup lang="ts">
import { Calendar, Clock, User, ArrowRight, Search, Tag } from 'lucide-vue-next';

useSeoMeta({
  title: 'Blog & Tech News',
  description: 'Read the latest PC hardware reviews, gaming benchmarks, buying guides, and tech news at Best Computer Hub.'
});

const blogService = useBlogService();
const posts = ref(blogService.getPosts());
const categories = blogService.getCategories();

const selectedCategory = ref('All');
const searchQuery = ref('');

const filteredPosts = computed(() => {
  return blogService.getPosts({
    category: selectedCategory.value === 'All' ? undefined : selectedCategory.value,
    query: searchQuery.value
  });
});
</script>

<template>
  <div class="min-h-screen pb-20">
    <!-- Header -->
    <section class="bg-card border-b py-20 relative overflow-hidden">
      <div class="absolute inset-0 bg-primary/[0.02] pointer-events-none"></div>
      <div class="container mx-auto px-4 relative z-10">
        <div class="max-w-3xl space-y-6">
          <div class="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
            Engineering Journal
          </div>
          <h1 class="text-5xl md:text-7xl font-display font-extrabold tracking-tight leading-[0.9]">
            The <span class="text-primary italic">Circuit</span> Blog.
          </h1>
          <p class="text-xl text-muted-foreground leading-relaxed max-w-xl">
            Deep dives into hardware architecture, industrial design, and the future of enterprise technology.
          </p>
        </div>
      </div>
    </section>

    <!-- Filters & Search -->
    <section class="container mx-auto px-4 -mt-8 relative z-20">
      <div class="bg-background border rounded-[2rem] p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar w-full md:w-auto">
          <button 
            @click="selectedCategory = 'All'"
            :class="[
              'px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap',
              selectedCategory === 'All' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground hover:text-foreground'
            ]"
          >
            All Insights
          </button>
          <button 
            v-for="cat in categories" 
            :key="cat"
            @click="selectedCategory = cat"
            :class="[
              'px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap',
              selectedCategory === cat ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground hover:text-foreground'
            ]"
          >
            {{ cat }}
          </button>
        </div>

        <div class="relative w-full md:w-80">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search articles..." 
            class="w-full h-12 bg-muted/50 border rounded-full pl-12 pr-6 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
          />
        </div>
      </div>
    </section>

    <!-- Blog Grid -->
    <section class="container mx-auto px-4 py-20">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        <article 
          v-for="post in filteredPosts" 
          :key="post.id"
          class="group space-y-6 flex flex-col"
        >
          <NuxtLink :to="`/blog/${post.slug}`" class="block aspect-[16/10] overflow-hidden rounded-[2.5rem] bg-muted relative">
            <img 
              :src="post.image" 
              :alt="post.title"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div class="absolute top-6 left-6">
              <span class="bg-background/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-primary">
                {{ post.category }}
              </span>
            </div>
          </NuxtLink>

          <div class="space-y-4 flex-grow">
            <div class="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <span class="flex items-center gap-1.5"><Calendar class="w-3 h-3" /> {{ post.publishedAt }}</span>
              <span class="flex items-center gap-1.5"><Clock class="w-3 h-3" /> {{ post.readingTime }}</span>
            </div>
            
            <NuxtLink :to="`/blog/${post.slug}`" class="block group/title">
              <h2 class="text-2xl font-display font-bold leading-tight group-hover/title:text-primary transition-colors">
                {{ post.title }}
              </h2>
            </NuxtLink>
            
            <p class="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
              {{ post.excerpt }}
            </p>
          </div>

          <div class="pt-6 border-t flex items-center justify-between">
            <div class="flex items-center gap-3">
              <img :src="post.author.avatar" class="w-8 h-8 rounded-full border shadow-sm" />
              <div class="flex flex-col">
                <span class="text-xs font-bold">{{ post.author.name }}</span>
                <span class="text-[10px] text-muted-foreground">{{ post.author.role }}</span>
              </div>
            </div>
            <NuxtLink :to="`/blog/${post.slug}`" class="text-primary p-2 hover:bg-primary/5 rounded-full transition-all">
              <ArrowRight class="w-5 h-5" />
            </NuxtLink>
          </div>
        </article>
      </div>

      <!-- Empty State -->
      <div v-if="filteredPosts.length === 0" class="py-32 flex flex-col items-center text-center space-y-6">
        <div class="w-24 h-24 bg-muted rounded-[2rem] flex items-center justify-center">
          <Tag class="w-10 h-10 text-muted-foreground" />
        </div>
        <div class="space-y-2">
          <h3 class="text-2xl font-bold">No articles found</h3>
          <p class="text-muted-foreground max-w-sm">We couldn't find any articles matching your current filters. Try refining your search.</p>
        </div>
        <UiButton variant="outline" class="rounded-full" @click="selectedCategory = 'All'; searchQuery = ''">View All Articles</UiButton>
      </div>
    </section>
  </div>
</template>
