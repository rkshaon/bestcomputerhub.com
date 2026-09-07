<!-- File: /pages/admin/blog/tags/index.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { Tag, Search, RefreshCw, AlertCircle } from 'lucide-vue-next';
import { refDebounced } from '@vueuse/core';
import { useBlogService } from '@/composables/useBlogService';
import { cn, decodeHtmlEntities } from '@/utils';
import type { BlogTag } from '@/types';
import type { UiTableColumn } from '@/components/ui/UiTable.vue';
import UiTable from '@/components/ui/UiTable.vue';
import UiSearchInput from '@/components/ui/UiSearchInput.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiButton from '@/components/ui/Button.vue';

definePageMeta({
  layout: false
});

const blogService = useBlogService();
const route = useRoute();
const router = useRouter();

// State management
const tagsList = ref<BlogTag[]>([]);
const totalCount = ref<number>(0);
const isLoading = ref<boolean>(false);
const errorMsg = ref<string | null>(null);

const searchQuery = ref(route.query.search ? String(route.query.search) : '');
const debouncedSearchQuery = refDebounced(searchQuery, 300);

const statusFilter = ref<'all' | 'active' | 'inactive'>(
  (route.query.status as 'all' | 'active' | 'inactive') ||
  (route.query.is_active === 'true' ? 'active' : route.query.is_active === 'false' ? 'inactive' : 'all')
);

const currentPage = ref(route.query.page ? parseInt(String(route.query.page)) || 1 : 1);
const itemsPerPage = ref(route.query.pageSize ? parseInt(String(route.query.pageSize)) || 10 : 10);

const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(d);
  } catch {
    return dateStr;
  }
};

const fetchTags = async () => {
  isLoading.value = true;
  errorMsg.value = null;

  try {
    let isActiveParam: boolean | undefined = undefined;
    if (statusFilter.value === 'active') {
      isActiveParam = true;
    } else if (statusFilter.value === 'inactive') {
      isActiveParam = false;
    }

    const res = await blogService.getBlogTags({
      page: currentPage.value,
      page_size: itemsPerPage.value,
      search: debouncedSearchQuery.value,
      is_active: isActiveParam
    });

    tagsList.value = res.results || [];
    totalCount.value = res.count || 0;
  } catch (err: any) {
    errorMsg.value = blogService.errorMsg.value || 'Failed to fetch blog tags.';
    tagsList.value = [];
    totalCount.value = 0;
  } finally {
    isLoading.value = false;
  }
};

const totalPages = computed(() => {
  return Math.ceil(totalCount.value / itemsPerPage.value) || 1;
});

// Computed active and inactive counts from current page view
const activeCount = computed(() => {
  return tagsList.value.filter(t => t.is_active).length;
});

const inactiveCount = computed(() => {
  return tagsList.value.filter(t => !t.is_active).length;
});

// Reset page on filter changes
watch([debouncedSearchQuery, statusFilter, itemsPerPage], () => {
  currentPage.value = 1;
  fetchTags();
});

// Refetch on page change
watch(currentPage, () => {
  fetchTags();
});

// Synchronize state to URL query params
watch([searchQuery, statusFilter, currentPage, itemsPerPage], () => {
  const query: Record<string, any> = { ...route.query };

  if (searchQuery.value) query.search = searchQuery.value;
  else delete query.search;

  if (statusFilter.value !== 'all') query.status = statusFilter.value;
  else delete query.status;

  if (currentPage.value !== 1) query.page = String(currentPage.value);
  else delete query.page;

  if (itemsPerPage.value !== 10) query.pageSize = String(itemsPerPage.value);
  else delete query.pageSize;

  router.replace({ query });
});

// Sync state from URL changes (browser Back / Forward navigation)
watch(() => route.query, (newQuery) => {
  const newSearch = newQuery.search ? String(newQuery.search) : '';
  if (searchQuery.value !== newSearch) searchQuery.value = newSearch;

  const newStatus = (newQuery.status as any) || (newQuery.is_active === 'true' ? 'active' : newQuery.is_active === 'false' ? 'inactive' : 'all');
  if (statusFilter.value !== newStatus) statusFilter.value = newStatus;

  const newPage = newQuery.page ? parseInt(String(newQuery.page)) || 1 : 1;
  if (currentPage.value !== newPage) currentPage.value = newPage;

  const newPageSize = newQuery.pageSize ? parseInt(String(newQuery.pageSize)) || 10 : 10;
  if (itemsPerPage.value !== newPageSize) itemsPerPage.value = newPageSize;
});

onMounted(() => {
  fetchTags();
});

// Reusable table column configuration
const tableColumns: UiTableColumn<BlogTag>[] = [
  { key: 'name', label: 'Tag Name', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
  { key: 'slug', label: 'Slug', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
  { key: 'is_active', label: 'Status', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
  { key: 'created_at', label: 'Created Date', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
];
</script>

<template>
  <NuxtLayout name="admin">
    <template #header-title>
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground/40 font-light select-none">/</span>
        <h1 class="text-xl font-display font-extrabold tracking-tight text-foreground">
          Blog Tags
        </h1>
      </div>
    </template>

    <template #header-actions>
      <div class="flex flex-wrap items-center gap-2">
        <UiButton 
          variant="outline" 
          class="rounded-xl h-9 px-3.5 gap-1.5 border-border font-bold text-xs"
          @click="fetchTags"
          :disabled="isLoading"
        >
          <RefreshCw :class="['w-3.5 h-3.5', isLoading && 'animate-spin']" />
          <span>Refresh</span>
        </UiButton>
      </div>
    </template>

    <div class="space-y-4 animate-in fade-in duration-500">
      
      <!-- Analytics / Summary Cards Row -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <UiCard class="flex items-center gap-3.5 p-3.5">
          <div class="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-inner">
            <Tag class="w-5 h-5" />
          </div>
          <div>
            <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Total Tags</p>
            <p class="text-2xl font-display font-extrabold tracking-tight text-foreground leading-tight">{{ totalCount }}</p>
          </div>
        </UiCard>

        <UiCard class="flex items-center gap-3.5 p-3.5">
          <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
            <Tag class="w-5 h-5" />
          </div>
          <div>
            <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Active (Page)</p>
            <p class="text-2xl font-display font-extrabold tracking-tight text-foreground leading-tight">{{ activeCount }}</p>
          </div>
        </UiCard>

        <UiCard class="flex items-center gap-3.5 p-3.5">
          <div class="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
            <Tag class="w-5 h-5" />
          </div>
          <div>
            <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Inactive (Page)</p>
            <p class="text-2xl font-display font-extrabold tracking-tight text-foreground leading-tight">{{ inactiveCount }}</p>
          </div>
        </UiCard>
      </div>

      <!-- Search & Filters Bar -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border px-3.5 py-2.5 rounded-xl shadow-xs">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <UiSearchInput 
            v-model="searchQuery" 
            placeholder="Search tags..." 
            class="w-full sm:w-80"
          />
        </div>

        <div class="flex items-center gap-3 self-end sm:self-center">
          <!-- Status Filter -->
          <div class="flex items-center gap-2 border-l border-border pl-3">
            <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Status:</span>
            <select 
              v-model="statusFilter"
              class="h-9 px-3 bg-background border border-input rounded-lg outline-none text-[10px] font-bold uppercase tracking-wider cursor-pointer text-foreground focus:ring-2 focus:ring-ring/20 transition-all"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <!-- Items Per Page Selector -->
          <div class="flex items-center gap-1.5 border-l border-border pl-2.5">
            <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground hidden sm:inline">Show:</span>
            <select 
              v-model="itemsPerPage"
              class="h-9 px-2.5 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
            >
              <option :value="5">5 / page</option>
              <option :value="10">10 / page</option>
              <option :value="25">25 / page</option>
              <option :value="50">50 / page</option>
              <option :value="100">100 / page</option>
              <option :value="1000">1000 / page</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-if="errorMsg" class="h-64 flex flex-col items-center justify-center gap-4 p-6 text-center bg-card border border-border rounded-2xl">
        <div class="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle class="w-6 h-6" />
        </div>
        <div>
          <p class="text-lg font-bold text-foreground">Failed to Load Blog Tags</p>
          <p class="text-xs text-muted-foreground max-w-md mx-auto mt-1">{{ errorMsg }}</p>
        </div>
        <button @click="fetchTags" class="bg-primary text-primary-foreground text-xs px-4 py-2 rounded-xl font-bold hover:opacity-90">
          Try Again
        </button>
      </div>

      <!-- Paginated Tags Table -->
      <UiTable
        v-else
        :columns="tableColumns"
        :data="tagsList"
        :loading="isLoading"
        key-field="id"
      >
        <!-- Tag Name Column -->
        <template #cell-name="{ item: tag }">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-primary/10 text-primary border border-primary/20 rounded-lg flex items-center justify-center shrink-0">
              <Tag class="w-4 h-4" />
            </div>
            <div>
              <h4 class="text-xs font-bold text-foreground leading-tight">{{ decodeHtmlEntities(tag.name) }}</h4>
            </div>
          </div>
        </template>

        <!-- Slug Column -->
        <template #cell-slug="{ item: tag }">
          <span class="font-mono text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-md border border-border/80 uppercase tracking-wider font-semibold">
            {{ tag.slug }}
          </span>
        </template>

        <!-- Status Column -->
        <template #cell-is_active="{ item: tag }">
          <div class="flex items-center gap-2">
            <span :class="cn(
              'w-2 h-2 rounded-full ring-4',
              tag.is_active 
                ? 'bg-emerald-500 ring-emerald-500/10' 
                : 'bg-muted-foreground/30 ring-muted-foreground/10'
            )"></span>
            <span class="text-[10px] uppercase font-bold tracking-widest" :class="tag.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'">
              {{ tag.is_active ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </template>

        <!-- Created Date Column -->
        <template #cell-created_at="{ item: tag }">
          <span class="font-mono text-xs text-muted-foreground">
            {{ formatDate(tag.created_at) }}
          </span>
        </template>

        <!-- Empty State -->
        <template #empty>
          <div class="flex flex-col items-center justify-center gap-4 text-muted-foreground py-12">
            <div class="w-16 h-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center">
              <Search class="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p class="font-display font-medium text-lg text-foreground">No Blog Tags Found</p>
              <p class="text-xs max-w-sm mx-auto mt-1">No tags matched your current filter criteria.</p>
            </div>
          </div>
        </template>

        <!-- Pagination Footer -->
        <template #footer>
          <UiPagination
            v-model:current-page="currentPage"
            :total-pages="totalPages"
            :total-count="totalCount"
            :items-per-page="itemsPerPage"
            item-label="tags"
            prefix-label="Showing"
            variant="footer"
          />
        </template>
      </UiTable>

    </div>
  </NuxtLayout>
</template>
