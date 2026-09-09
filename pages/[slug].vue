<!-- File: /pages/[slug].vue -->
<script setup lang="ts">
import { useRoute, createError, navigateTo, useAsyncData } from '#app';
import { useBlogService } from '@/composables/useBlogService';

const route = useRoute();
const blogService = useBlogService();

const slug = Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug;

if (!slug) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  });
}

// Fetch main blog post details using slug directly
const { data: post } = await useAsyncData(
  `legacy-blog-redirect-${slug}`,
  async () => {
    try {
      return await blogService.getBlogPost(slug);
    } catch {
      return null;
    }
  }
);

if (!post.value || !post.value.slug) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  });
}

// Redirect using standard 301 Permanent Redirect
await navigateTo({
  path: `/blog/${post.value.slug}/`,
  query: route.query
}, {
  redirectCode: 301
});
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-background" id="redirect-page">
    <div class="text-center" id="redirect-message-container">
      <p class="text-muted-foreground animate-pulse" id="redirect-text">Redirecting...</p>
    </div>
  </div>
</template>
