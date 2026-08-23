<!-- File: /pages/admin/seo/index.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  Globe, 
  RefreshCw, 
  FileText, 
  Layers, 
  Package, 
  BookOpen, 
  ExternalLink, 
  Copy, 
  Check, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Sparkles, 
  Search, 
  ArrowUpRight, 
  Compass, 
  Sliders, 
  Eye, 
  Download, 
  Info,
  Tag
} from 'lucide-vue-next';
import { cn } from '@/utils';
import { toastSuccess, toastInfo, toastWarning } from '@/composables/useToast';
import UiTable, { type UiTableColumn } from '@/components/ui/UiTable.vue';
import UiBadge from '@/components/ui/UiBadge.vue';
import UiButton from '@/components/ui/Button.vue';

definePageMeta({
  layout: false
});

useSeoMeta({
  title: 'SEO & Sitemap Management - Best Computer Hub Admin',
  robots: 'noindex, nofollow'
});

// Mock state management for design & interaction
const isLoading = ref(false);
const isGenerating = ref(false);
const isCopying = ref(false);
const lastGlobalGeneration = ref('2026-08-23 02:30:15 UTC');
const searchQuery = ref('');

interface SitemapEntry {
  id: string;
  name: string;
  filename: string;
  url: string;
  type: 'Product' | 'Category' | 'Blog' | 'Page' | 'Brand';
  urlsCount: number;
  lastGenerated: string;
  status: 'Generated' | 'Pending' | 'Error';
  fileSize: string;
  rules: string;
}

// Master Sitemap Table Columns
const tableColumns: UiTableColumn<SitemapEntry>[] = [
  { key: 'name', label: 'Sitemap & Endpoint', width: '300px', headerClass: 'px-6 py-3.5 whitespace-nowrap', cellClass: 'px-6 py-3.5' },
  { key: 'type', label: 'Entity Type', headerClass: 'px-6 py-3.5 whitespace-nowrap', cellClass: 'px-6 py-3.5 whitespace-nowrap' },
  { key: 'urlsCount', label: 'Total URLs', align: 'right', headerClass: 'px-6 py-3.5 text-right whitespace-nowrap', cellClass: 'px-6 py-3.5 text-right whitespace-nowrap font-mono font-bold text-xs' },
  { key: 'lastGenerated', label: 'Last Generated', headerClass: 'px-6 py-3.5 whitespace-nowrap', cellClass: 'px-6 py-3.5 whitespace-nowrap text-xs text-muted-foreground' },
  { key: 'status', label: 'Status', headerClass: 'px-6 py-3.5 whitespace-nowrap', cellClass: 'px-6 py-3.5 whitespace-nowrap' },
  { key: 'actions', label: 'Actions', align: 'right', headerClass: 'px-6 py-3.5 text-right whitespace-nowrap', cellClass: 'px-6 py-3.5 text-right whitespace-nowrap' }
];

// Mock sitemap list
const sitemapEntries = ref<SitemapEntry[]>([
  {
    id: 'sitemap-products',
    name: 'Products Sitemap',
    filename: 'sitemap-products.xml',
    url: 'https://bestcomputerhub.com/sitemap-products.xml',
    type: 'Product',
    urlsCount: 4120,
    lastGenerated: '2026-08-23 02:30:15 UTC',
    status: 'Generated',
    fileSize: '418 KB',
    rules: 'Active, published, non-deleted, indexed items'
  },
  {
    id: 'sitemap-categories',
    name: 'Categories Sitemap',
    filename: 'sitemap-categories.xml',
    url: 'https://bestcomputerhub.com/sitemap-categories.xml',
    type: 'Category',
    urlsCount: 186,
    lastGenerated: '2026-08-23 02:30:15 UTC',
    status: 'Generated',
    fileSize: '24 KB',
    rules: 'Active catalog branches with valid paths'
  },
  {
    id: 'sitemap-blogs',
    name: 'Blogs & Articles Sitemap',
    filename: 'sitemap-blogs.xml',
    url: 'https://bestcomputerhub.com/sitemap-blogs.xml',
    type: 'Blog',
    urlsCount: 546,
    lastGenerated: '2026-08-23 02:30:15 UTC',
    status: 'Generated',
    fileSize: '58 KB',
    rules: 'Published articles where published_at <= now()'
  },
  {
    id: 'sitemap-pages',
    name: 'Storefront Static Pages',
    filename: 'sitemap-pages.xml',
    url: 'https://bestcomputerhub.com/sitemap-pages.xml',
    type: 'Page',
    urlsCount: 24,
    lastGenerated: '2026-08-23 02:30:15 UTC',
    status: 'Generated',
    fileSize: '4.2 KB',
    rules: 'Public marketing, about, policy, and career pages'
  },
  {
    id: 'sitemap-brands',
    name: 'Brand Hub Sitemap',
    filename: 'sitemap-brands.xml',
    url: 'https://bestcomputerhub.com/sitemap-brands.xml',
    type: 'Brand',
    urlsCount: 0,
    lastGenerated: 'Pending Setup',
    status: 'Pending',
    fileSize: '0 KB',
    rules: 'Active partner brands with public showcases'
  }
]);

// Filtered sitemaps based on search
const filteredSitemaps = computed(() => {
  if (!searchQuery.value.trim()) return sitemapEntries.value;
  const q = searchQuery.value.toLowerCase().trim();
  return sitemapEntries.value.filter(s => 
    s.name.toLowerCase().includes(q) ||
    s.filename.toLowerCase().includes(q) ||
    s.type.toLowerCase().includes(q)
  );
});

// Mock total indexable metrics
const totalIndexableUrls = computed(() => {
  return sitemapEntries.value.reduce((acc, curr) => acc + curr.urlsCount, 0);
});

// Mock Indexability breakdown
const indexabilityBreakdown = {
  products: {
    indexable: 4120,
    excluded: 38,
    total: 4158,
    rate: 99.1,
    reasons: [
      { label: 'Draft / Unpublished', count: 18 },
      { label: 'Soft-deleted / Archived', count: 14 },
      { label: 'Explicit noindex tag', count: 6 }
    ]
  },
  categories: {
    indexable: 186,
    excluded: 12,
    total: 198,
    rate: 93.9,
    reasons: [
      { label: 'Hidden utility branches', count: 8 },
      { label: 'Inactive / Draft categories', count: 4 }
    ]
  },
  blogs: {
    indexable: 546,
    excluded: 9,
    total: 555,
    rate: 98.4,
    reasons: [
      { label: 'Draft articles', count: 7 },
      { label: 'Future scheduled publication', count: 2 }
    ]
  },
  pages: {
    indexable: 24,
    excluded: 0,
    total: 24,
    rate: 100.0,
    reasons: []
  }
};

// Planned URL configuration schema
const publicUrlPatterns = [
  {
    entity: 'Product Details',
    pattern: '/product/{slug}/',
    example: '/product/dji-mavic-3-pro-fly-more-combo-4k-drone/',
    notes: 'Trailing slash enforced, dynamic DRF slug mapping, SSR enabled',
    badge: 'Standard'
  },
  {
    entity: 'Category Catalog',
    pattern: '/product-category/{slug}/',
    example: '/product-category/gaming-component/laptop/msi-laptop/',
    notes: 'Multi-level hierarchical ancestor path resolution, trailing slash',
    badge: 'Hierarchical'
  },
  {
    entity: 'Blog & Articles',
    pattern: '/blog/{slug}/',
    example: '/blog/rtx-5090-benchmarks-and-thermal-analysis/',
    notes: 'Published articles, trailing slash, Open Graph & JSON-LD article schema',
    badge: 'Editorial'
  },
  {
    entity: 'Brand Showcase',
    pattern: '/brand/{slug}/',
    example: '/brand/msi/',
    notes: 'Brand catalog hub, trailing slash, organization structured data',
    badge: 'Planned'
  },
  {
    entity: 'Sitemap Index',
    pattern: '/sitemap.xml',
    example: 'https://bestcomputerhub.com/sitemap.xml',
    notes: 'Django-orchestrated master XML index referencing sub-sitemaps',
    badge: 'XML Index'
  },
  {
    entity: 'Robots Directives',
    pattern: '/robots.txt',
    example: 'https://bestcomputerhub.com/robots.txt',
    notes: 'Nuxt-hosted root file referencing master sitemap index',
    badge: 'Directives'
  }
];

// Helper methods for actions
const handleRefresh = async () => {
  isLoading.value = true;
  await new Promise(resolve => setTimeout(resolve, 600));
  isLoading.value = false;
  toastInfo('Sitemap status refreshed.');
};

const handleGenerateSitemap = async () => {
  isGenerating.value = true;
  await new Promise(resolve => setTimeout(resolve, 1200));
  const now = new Date();
  lastGlobalGeneration.value = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  
  // Update timestamp on generated entries
  sitemapEntries.value = sitemapEntries.value.map(entry => {
    if (entry.status === 'Generated') {
      return { ...entry, lastGenerated: lastGlobalGeneration.value };
    }
    return entry;
  });

  isGenerating.value = false;
  toastSuccess('Sitemap index and 4 sub-sitemaps regenerated successfully.');
};

const copyToClipboard = (text: string, label: string = 'URL') => {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text);
    isCopying.value = true;
    toastSuccess(`${label} copied to clipboard.`);
    setTimeout(() => {
      isCopying.value = false;
    }, 2000);
  }
};

const handleSubSitemapAction = (sitemap: SitemapEntry, action: string) => {
  if (action === 'copy') {
    copyToClipboard(sitemap.url, sitemap.name);
  } else if (action === 'regenerate') {
    toastInfo(`Regenerating ${sitemap.name}...`);
    setTimeout(() => {
      sitemap.lastGenerated = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
      sitemap.status = 'Generated';
      toastSuccess(`${sitemap.name} updated successfully.`);
    }, 800);
  } else if (action === 'view') {
    toastInfo(`Mock preview for ${sitemap.filename} (Endpoint: ${sitemap.url})`);
  }
};

const getStatusBadgeVariant = (status: SitemapEntry['status']) => {
  switch (status) {
    case 'Generated':
      return 'success';
    case 'Pending':
      return 'warning';
    case 'Error':
      return 'error';
    default:
      return 'secondary';
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

    <template #header-actions>
      <div class="flex flex-wrap items-center gap-2">
        <UiButton 
          variant="outline" 
          class="rounded-xl h-9 px-3.5 gap-1.5 border-border font-bold text-xs"
          @click="handleRefresh"
          :disabled="isLoading || isGenerating"
        >
          <RefreshCw :class="['w-3.5 h-3.5', (isLoading || isGenerating) && 'animate-spin']" />
          <span>Refresh</span>
        </UiButton>

        <UiButton 
          class="rounded-xl h-9 px-4 gap-1.5 shadow-md shadow-primary/20 bg-primary text-primary-foreground font-bold text-xs"
          @click="handleGenerateSitemap"
          :disabled="isGenerating"
        >
          <Sparkles class="w-3.5 h-3.5" />
          <span>{{ isGenerating ? 'Generating...' : 'Generate Sitemap' }}</span>
        </UiButton>
      </div>
    </template>

    <div class="space-y-6 animate-in fade-in duration-500 pb-12">
      <!-- Top Context Banner -->
      <div class="bg-card text-card-foreground border border-border px-4 py-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Globe class="w-4 h-4" />
          </div>
          <div>
            <h2 class="text-xs font-bold text-foreground">Decoupled Sitemap & SEO Architecture</h2>
            <p class="text-[11px] text-muted-foreground">Frontend manages on-page meta and trailing-slash routing; Backend manages XML sitemap generation and indexing eligibility.</p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <UiBadge variant="success" size="xs">SSR Enabled</UiBadge>
          <UiBadge variant="secondary" size="xs">Index Valid</UiBadge>
        </div>
      </div>

      <!-- 1. Sitemap Overview Summary Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <!-- Total Indexable -->
        <div class="bg-card text-card-foreground border border-border p-4 rounded-2xl shadow-2xs space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Total Indexable URLs</span>
            <div class="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Globe class="w-3.5 h-3.5" />
            </div>
          </div>
          <p class="text-2xl font-display font-extrabold text-foreground tracking-tight">{{ totalIndexableUrls.toLocaleString() }}</p>
          <p class="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 class="w-3 h-3" />
            <span>98.9% Catalog Rate</span>
          </p>
        </div>

        <!-- Products -->
        <div class="bg-card text-card-foreground border border-border p-4 rounded-2xl shadow-2xs space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Products</span>
            <div class="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Package class="w-3.5 h-3.5" />
            </div>
          </div>
          <p class="text-2xl font-display font-extrabold text-foreground tracking-tight">{{ indexabilityBreakdown.products.indexable.toLocaleString() }}</p>
          <p class="text-[11px] text-muted-foreground font-medium">
            <span class="text-muted-foreground font-bold">{{ indexabilityBreakdown.products.excluded }}</span> excluded / draft
          </p>
        </div>

        <!-- Categories -->
        <div class="bg-card text-card-foreground border border-border p-4 rounded-2xl shadow-2xs space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Categories</span>
            <div class="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Layers class="w-3.5 h-3.5" />
            </div>
          </div>
          <p class="text-2xl font-display font-extrabold text-foreground tracking-tight">{{ indexabilityBreakdown.categories.indexable.toLocaleString() }}</p>
          <p class="text-[11px] text-muted-foreground font-medium">
            <span class="text-muted-foreground font-bold">{{ indexabilityBreakdown.categories.excluded }}</span> hidden / utility
          </p>
        </div>

        <!-- Blogs -->
        <div class="bg-card text-card-foreground border border-border p-4 rounded-2xl shadow-2xs space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Blogs & News</span>
            <div class="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <BookOpen class="w-3.5 h-3.5" />
            </div>
          </div>
          <p class="text-2xl font-display font-extrabold text-foreground tracking-tight">{{ indexabilityBreakdown.blogs.indexable.toLocaleString() }}</p>
          <p class="text-[11px] text-muted-foreground font-medium">
            <span class="text-muted-foreground font-bold">{{ indexabilityBreakdown.blogs.excluded }}</span> drafts / scheduled
          </p>
        </div>

        <!-- Last Generated -->
        <div class="bg-card text-card-foreground border border-border p-4 rounded-2xl shadow-2xs space-y-1 col-span-2 sm:col-span-1">
          <div class="flex items-center justify-between">
            <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Last Generated</span>
            <div class="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Clock class="w-3.5 h-3.5" />
            </div>
          </div>
          <p class="text-xs font-mono font-bold text-foreground truncate mt-1">{{ lastGlobalGeneration }}</p>
          <p class="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <ShieldCheck class="w-3 h-3" />
            <span>200 OK • Healthy</span>
          </p>
        </div>
      </div>

      <!-- 2. Sitemap Generation & Operations Area -->
      <div class="bg-card text-card-foreground border border-border rounded-2xl p-5 shadow-2xs">
        <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div class="space-y-1.5 max-w-2xl">
            <div class="flex items-center gap-2">
              <span class="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">Sitemap Index Architecture</span>
              <span class="text-xs text-muted-foreground">•</span>
              <span class="text-xs font-semibold text-muted-foreground">Automated Daily 02:00 UTC</span>
            </div>
            <h2 class="text-base font-display font-extrabold text-foreground">Master Sitemap Index Configuration</h2>
            <div class="flex flex-wrap items-center gap-2 pt-1">
              <div class="flex items-center gap-1.5 bg-muted/80 border border-input rounded-lg px-3 py-1.5 text-xs font-mono text-foreground select-all">
                <Globe class="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span>https://bestcomputerhub.com/sitemap.xml</span>
              </div>
              <button 
                type="button"
                @click="copyToClipboard('https://bestcomputerhub.com/sitemap.xml', 'Master Sitemap URL')"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-xs font-bold transition-colors cursor-pointer border border-border"
                title="Copy Master XML URL"
              >
                <Check v-if="isCopying" class="w-3.5 h-3.5 text-emerald-500" />
                <Copy v-else class="w-3.5 h-3.5" />
                <span>{{ isCopying ? 'Copied' : 'Copy URL' }}</span>
              </button>
              <a 
                href="/sitemap.xml" 
                target="_blank"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 hover:bg-accent text-muted-foreground hover:text-foreground rounded-lg text-xs font-bold transition-colors border border-transparent hover:border-border"
                title="View Sitemap XML endpoint"
              >
                <ExternalLink class="w-3.5 h-3.5" />
                <span>Inspect XML</span>
              </a>
            </div>
          </div>

          <!-- Quick Actions Panel -->
          <div class="flex flex-wrap items-center gap-2 self-stretch lg:self-auto justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-border/80">
            <UiButton 
              variant="outline" 
              size="sm"
              class="rounded-xl text-xs font-bold gap-1.5 h-9"
              @click="toastInfo('Google & Bing Search Engines notified with updated sitemap ping.')"
            >
              <Compass class="w-3.5 h-3.5" />
              <span>Ping Search Engines</span>
            </UiButton>
            <UiButton 
              size="sm"
              class="rounded-xl text-xs font-bold gap-1.5 h-9 bg-primary text-primary-foreground"
              @click="handleGenerateSitemap"
              :disabled="isGenerating"
            >
              <RefreshCw :class="['w-3.5 h-3.5', isGenerating && 'animate-spin']" />
              <span>{{ isGenerating ? 'Regenerating...' : 'Regenerate All Sitemaps' }}</span>
            </UiButton>
          </div>
        </div>
      </div>

      <!-- 3. Sitemap Index Table Section -->
      <div class="space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border px-3.5 py-2.5 rounded-xl shadow-2xs">
          <div class="flex items-center gap-2">
            <FileText class="w-4 h-4 text-primary" />
            <h2 class="text-sm font-bold text-foreground">Sitemap Index & Sub-Sitemaps</h2>
            <span class="text-xs text-muted-foreground font-mono font-medium">({{ filteredSitemaps.length }} active partitions)</span>
          </div>

          <div class="flex items-center gap-2">
            <div class="relative w-full sm:w-64">
              <Search class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Filter sitemaps..."
                class="w-full h-8 pl-8 pr-3 bg-background border border-input rounded-lg text-xs font-medium text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/20 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <UiTable
          :columns="tableColumns"
          :data="filteredSitemaps"
          :loading="isLoading"
          key-field="id"
          empty-text="No sitemaps matched your filter"
          empty-description="Adjust your search query or generate new sitemap entries."
        >
          <!-- Custom Cell: Name -->
          <template #cell-name="{ item }">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="font-bold text-foreground text-xs">{{ item.name }}</span>
                <span class="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">{{ item.fileSize }}</span>
              </div>
              <div class="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                <span>/{{ item.filename }}</span>
              </div>
              <p class="text-[10px] text-muted-foreground/80 italic">{{ item.rules }}</p>
            </div>
          </template>

          <!-- Custom Cell: Type -->
          <template #cell-type="{ item }">
            <UiBadge 
              :variant="item.type === 'Product' ? 'primary' : item.type === 'Category' ? 'info' : item.type === 'Blog' ? 'warning' : 'secondary'" 
              size="xs"
            >
              {{ item.type }}
            </UiBadge>
          </template>

          <!-- Custom Cell: URLs Count -->
          <template #cell-urlsCount="{ item }">
            <span class="text-xs font-bold font-mono text-foreground">
              {{ item.urlsCount.toLocaleString() }}
            </span>
          </template>

          <!-- Custom Cell: Last Generated -->
          <template #cell-lastGenerated="{ item }">
            <span class="text-xs text-muted-foreground font-mono">
              {{ item.lastGenerated }}
            </span>
          </template>

          <!-- Custom Cell: Status -->
          <template #cell-status="{ item }">
            <UiBadge :variant="getStatusBadgeVariant(item.status)" size="xs">
              {{ item.status }}
            </UiBadge>
          </template>

          <!-- Custom Cell: Actions (Dropdown Menu via UiTable) -->
          <template #cell-actions="{ item }">
            <div class="flex flex-col py-1 min-w-[160px] text-xs">
              <button
                type="button"
                @click="handleSubSitemapAction(item, 'copy')"
                class="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-accent text-left font-medium text-foreground rounded-lg transition-colors cursor-pointer"
              >
                <Copy class="w-3.5 h-3.5 text-muted-foreground" />
                <span>Copy Endpoint URL</span>
              </button>
              <button
                type="button"
                @click="handleSubSitemapAction(item, 'regenerate')"
                class="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-accent text-left font-medium text-foreground rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw class="w-3.5 h-3.5 text-muted-foreground" />
                <span>Regenerate Partition</span>
              </button>
              <button
                type="button"
                @click="handleSubSitemapAction(item, 'view')"
                class="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-accent text-left font-medium text-foreground rounded-lg transition-colors cursor-pointer"
              >
                <ExternalLink class="w-3.5 h-3.5 text-muted-foreground" />
                <span>Inspect XML Output</span>
              </button>
            </div>
          </template>
        </UiTable>
      </div>

      <!-- 4. Indexability Breakdown & Eligibility Matrix -->
      <div class="space-y-3">
        <div class="bg-card border border-border px-4 py-2.5 rounded-xl shadow-2xs flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Sliders class="w-4 h-4 text-primary" />
            <h2 class="text-sm font-bold text-foreground">Catalog Indexability & Eligibility Breakdown</h2>
          </div>
          <span class="text-[11px] text-muted-foreground">Authority: DRF Backend Data Layer</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Products Eligibility -->
          <div class="bg-card text-card-foreground border border-border p-4 rounded-2xl shadow-2xs space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Package class="w-4 h-4 text-blue-500" />
                <h3 class="text-xs font-bold text-foreground">Products</h3>
              </div>
              <span class="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">99.1%</span>
            </div>
            <!-- Progress Bar -->
            <div class="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div class="bg-blue-500 h-full rounded-full" style="width: 99.1%"></div>
            </div>
            <div class="space-y-1.5 text-xs">
              <div class="flex justify-between text-muted-foreground">
                <span>Eligible in Sitemap:</span>
                <span class="font-bold text-foreground font-mono">4,120</span>
              </div>
              <div class="flex justify-between text-muted-foreground">
                <span>Excluded / Noindex:</span>
                <span class="font-bold text-destructive font-mono">38</span>
              </div>
              <div class="border-t border-border pt-1.5 space-y-1 text-[10px] text-muted-foreground">
                <p>• 18 Draft / Inactive</p>
                <p>• 14 Soft-deleted</p>
                <p>• 6 Explicit noindex</p>
              </div>
            </div>
          </div>

          <!-- Categories Eligibility -->
          <div class="bg-card text-card-foreground border border-border p-4 rounded-2xl shadow-2xs space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Layers class="w-4 h-4 text-indigo-500" />
                <h3 class="text-xs font-bold text-foreground">Categories</h3>
              </div>
              <span class="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">93.9%</span>
            </div>
            <!-- Progress Bar -->
            <div class="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div class="bg-indigo-500 h-full rounded-full" style="width: 93.9%"></div>
            </div>
            <div class="space-y-1.5 text-xs">
              <div class="flex justify-between text-muted-foreground">
                <span>Eligible in Sitemap:</span>
                <span class="font-bold text-foreground font-mono">186</span>
              </div>
              <div class="flex justify-between text-muted-foreground">
                <span>Excluded / Hidden:</span>
                <span class="font-bold text-destructive font-mono">12</span>
              </div>
              <div class="border-t border-border pt-1.5 space-y-1 text-[10px] text-muted-foreground">
                <p>• 8 Internal utility trees</p>
                <p>• 4 Inactive categories</p>
              </div>
            </div>
          </div>

          <!-- Blog Posts Eligibility -->
          <div class="bg-card text-card-foreground border border-border p-4 rounded-2xl shadow-2xs space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <BookOpen class="w-4 h-4 text-purple-500" />
                <h3 class="text-xs font-bold text-foreground">Blog Articles</h3>
              </div>
              <span class="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">98.4%</span>
            </div>
            <!-- Progress Bar -->
            <div class="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div class="bg-purple-500 h-full rounded-full" style="width: 98.4%"></div>
            </div>
            <div class="space-y-1.5 text-xs">
              <div class="flex justify-between text-muted-foreground">
                <span>Eligible in Sitemap:</span>
                <span class="font-bold text-foreground font-mono">546</span>
              </div>
              <div class="flex justify-between text-muted-foreground">
                <span>Drafts / Embargo:</span>
                <span class="font-bold text-amber-500 font-mono">9</span>
              </div>
              <div class="border-t border-border pt-1.5 space-y-1 text-[10px] text-muted-foreground">
                <p>• 7 Draft articles</p>
                <p>• 2 Scheduled for future</p>
              </div>
            </div>
          </div>

          <!-- Static Pages Eligibility -->
          <div class="bg-card text-card-foreground border border-border p-4 rounded-2xl shadow-2xs space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <FileText class="w-4 h-4 text-emerald-500" />
                <h3 class="text-xs font-bold text-foreground">Static Pages</h3>
              </div>
              <span class="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">100%</span>
            </div>
            <!-- Progress Bar -->
            <div class="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div class="bg-emerald-500 h-full rounded-full" style="width: 100%"></div>
            </div>
            <div class="space-y-1.5 text-xs">
              <div class="flex justify-between text-muted-foreground">
                <span>Eligible in Sitemap:</span>
                <span class="font-bold text-foreground font-mono">24</span>
              </div>
              <div class="flex justify-between text-muted-foreground">
                <span>Excluded:</span>
                <span class="font-bold text-muted-foreground font-mono">0</span>
              </div>
              <div class="border-t border-border pt-1.5 space-y-1 text-[10px] text-muted-foreground">
                <p>• Core storefront routes</p>
                <p>• Policy & compliance pages</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. Planned Public URL Routing Patterns & Canonical Config Preview -->
      <div class="space-y-3">
        <div class="bg-card border border-border px-4 py-2.5 rounded-xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <Globe class="w-4 h-4 text-primary" />
            <h2 class="text-sm font-bold text-foreground">Planned Public URL Routing Conventions & Patterns</h2>
          </div>
          <UiBadge variant="secondary" size="xs">Trailing Slash `/` Enforced</UiBadge>
        </div>

        <div class="bg-card text-card-foreground border border-border rounded-2xl p-4 shadow-2xs overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-border text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                <th class="py-2.5 px-3">Entity Type</th>
                <th class="py-2.5 px-3">Centralized Pattern</th>
                <th class="py-2.5 px-3">Live Canonical Example</th>
                <th class="py-2.5 px-3">Implementation Notes</th>
                <th class="py-2.5 px-3 text-right">Scope</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border/60 font-medium">
              <tr v-for="item in publicUrlPatterns" :key="item.entity" class="hover:bg-muted/40 transition-colors">
                <td class="py-3 px-3 font-bold text-foreground whitespace-nowrap">{{ item.entity }}</td>
                <td class="py-3 px-3 font-mono text-primary font-bold whitespace-nowrap">{{ item.pattern }}</td>
                <td class="py-3 px-3 font-mono text-muted-foreground truncate max-w-xs" :title="item.example">{{ item.example }}</td>
                <td class="py-3 px-3 text-muted-foreground text-[11px]">{{ item.notes }}</td>
                <td class="py-3 px-3 text-right whitespace-nowrap">
                  <UiBadge variant="secondary" size="xs">{{ item.badge }}</UiBadge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 6. Robots & Search Engine Verification Preview -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Robots.txt Directives -->
        <div class="bg-card text-card-foreground border border-border rounded-2xl p-4 shadow-2xs space-y-2.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <FileText class="w-4 h-4 text-primary" />
              <h3 class="text-xs font-bold text-foreground">Robots Configuration (/robots.txt)</h3>
            </div>
            <UiBadge variant="success" size="xs">Nuxt Managed</UiBadge>
          </div>
          <p class="text-[11px] text-muted-foreground">Public frontend serves crawler instructions pointing to the backend sitemap index.</p>
          <div class="bg-muted/90 rounded-xl p-3 font-mono text-[11px] text-foreground space-y-1 border border-input select-all">
            <p><span class="text-muted-foreground">User-agent:</span> *</p>
            <p><span class="text-muted-foreground">Allow:</span> /</p>
            <p><span class="text-muted-foreground">Disallow:</span> /admin/</p>
            <p><span class="text-muted-foreground">Disallow:</span> /account/</p>
            <p><span class="text-muted-foreground">Disallow:</span> /cart/</p>
            <p><span class="text-muted-foreground">Disallow:</span> /checkout/</p>
            <p class="pt-1 text-primary font-bold">Sitemap: https://bestcomputerhub.com/sitemap.xml</p>
          </div>
        </div>

        <!-- Search Engine Verification -->
        <div class="bg-card text-card-foreground border border-border rounded-2xl p-4 shadow-2xs space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Compass class="w-4 h-4 text-primary" />
              <h3 class="text-xs font-bold text-foreground">Search Engine Crawler Verification</h3>
            </div>
            <UiBadge variant="secondary" size="xs">Monitoring</UiBadge>
          </div>
          <p class="text-[11px] text-muted-foreground">Verification status across verified Webmaster consoles.</p>

          <div class="space-y-2 text-xs">
            <div class="flex items-center justify-between p-2.5 bg-muted/50 rounded-xl border border-border">
              <div class="flex items-center gap-2">
                <CheckCircle2 class="w-4 h-4 text-emerald-500" />
                <span class="font-bold text-foreground">Google Search Console</span>
              </div>
              <span class="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">Submitted • 4,876 URLs</span>
            </div>

            <div class="flex items-center justify-between p-2.5 bg-muted/50 rounded-xl border border-border">
              <div class="flex items-center gap-2">
                <CheckCircle2 class="w-4 h-4 text-emerald-500" />
                <span class="font-bold text-foreground">Bing Webmaster Tools</span>
              </div>
              <span class="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">Submitted • 4,876 URLs</span>
            </div>

            <div class="flex items-center justify-between p-2.5 bg-muted/50 rounded-xl border border-border">
              <div class="flex items-center gap-2">
                <ShieldCheck class="w-4 h-4 text-blue-500" />
                <span class="font-bold text-foreground">Crawl Errors (Last 7 Days)</span>
              </div>
              <span class="font-mono text-[11px] text-foreground font-bold">0 Detected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
