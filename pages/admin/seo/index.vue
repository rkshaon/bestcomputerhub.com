<!-- File: /pages/admin/seo/index.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { Globe, Download, ExternalLink, Check } from 'lucide-vue-next';
import { toastSuccess, toastError, toastInfo } from '@/composables/useToast';
import UiButton from '@/components/ui/Button.vue';

definePageMeta({
  layout: false
});

useSeoMeta({
  title: 'SEO & Sitemap Management - Best Computer Hub Admin',
  robots: 'noindex, nofollow'
});

const isDownloading = ref(false);
const SITEMAP_URL = 'https://best-computers.rkshaon.info/sitemap.xml';

const handleDownloadSitemap = async () => {
  if (isDownloading.value) return;
  
  isDownloading.value = true;
  toastInfo('Downloading sitemap...');

  try {
    const response = await fetch(SITEMAP_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toastSuccess('Sitemap downloaded successfully.');
  } catch (error) {
    console.error('Sitemap download failed:', error);
    toastError('Failed to download sitemap. Please try again.');
  } finally {
    isDownloading.value = false;
  }
};
</script>

<template>
  <NuxtLayout name="admin">
    <template #header-title>
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground/40 font-light select-none">/</span>
        <h1 class="text-xl font-display font-extrabold tracking-tight text-foreground">
          SEO & Sitemap
        </h1>
      </div>
    </template>

    <div class="space-y-6 animate-in fade-in duration-500 pb-12">
      <!-- Sitemap Access Utility -->
      <div class="bg-card text-card-foreground border border-border p-6 rounded-2xl shadow-2xs space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Globe class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-base font-bold text-foreground">Sitemap Access & Utility</h2>
            <p class="text-xs text-muted-foreground">Manage and download the generated sitemap XML.</p>
          </div>
        </div>
        
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t border-border pt-4">
          <div class="flex-1 space-y-1">
            <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Master Sitemap Endpoint</p>
            <div class="flex items-center gap-2 bg-muted/50 border border-input rounded-lg px-3 py-2 text-xs font-mono text-foreground">
              {{ SITEMAP_URL }}
            </div>
          </div>
          
          <div class="flex items-center gap-2 shrink-0">
            <a 
              :href="SITEMAP_URL"
              target="_blank"
              class="inline-flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl text-xs font-bold transition-colors border border-border"
            >
              <ExternalLink class="w-4 h-4" />
              <span>View Sitemap</span>
            </a>
            
            <UiButton 
              class="rounded-xl h-9 px-4 gap-2 bg-primary text-primary-foreground font-bold text-xs shadow-md shadow-primary/20"
              @click="handleDownloadSitemap"
              :disabled="isDownloading"
            >
              <Download v-if="!isDownloading" class="w-4 h-4" />
              <div v-else class="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              <span>{{ isDownloading ? 'Downloading...' : 'Download sitemap.xml' }}</span>
            </UiButton>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
