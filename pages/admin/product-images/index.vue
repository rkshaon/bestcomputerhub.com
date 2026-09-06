<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useProductService } from '@/composables/useProductService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useRoute, useRouter } from 'vue-router';
import {
  Image as ImageIcon,
  Check,
  Star,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  AlertCircle,
  LayoutGrid,
  List
} from 'lucide-vue-next';
import UiTable from '@/components/ui/UiTable.vue';
import type { UiTableColumn } from '@/components/ui/UiTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import type { ProductImage } from '@/types';

definePageMeta({
  layout: false
});

const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
};

const productService = useProductService();
const { hasPermission } = useAdminPermissions();

const route = useRoute();
const router = useRouter();

const viewMode = ref<'grid' | 'list'>(route.query.view === 'grid' ? 'grid' : 'list');
const currentPage = ref(route.query.page ? parseInt(String(route.query.page)) || 1 : 1);
const itemsPerPage = ref(route.query.pageSize ? parseInt(String(route.query.pageSize)) || 10 : 10);

const tableColumns: UiTableColumn<ProductImage>[] = [
  { key: 'image', label: 'Image', width: '80px', headerClass: 'px-4 py-3 text-center', cellClass: 'px-4 py-2.5 text-center' },
  { key: 'alt_text', label: 'Alt Text', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
  { key: 'display_order', label: 'Order', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
  { key: 'is_default', label: 'Default', headerClass: 'px-4 py-3 text-center', cellClass: 'px-4 py-2.5 text-center' },
  { key: 'created_at', label: 'Created At', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' }
];

const images = ref<ProductImage[]>([]);
const totalItems = ref(0);
const isFetching = ref(false);
const errorMsg = ref<string | null>(null);

const fetchImages = async () => {
  isFetching.value = true;
  errorMsg.value = null;
  try {
    const res = await productService.getAllProductImages(currentPage.value, itemsPerPage.value);
    if (res && Array.isArray(res.results)) {
      images.value = res.results;
      totalItems.value = res.count || 0;
    } else {
      images.value = [];
      totalItems.value = 0;
    }
  } catch (err: any) {
    errorMsg.value = err.message || 'Failed to load product images.';
    images.value = [];
    totalItems.value = 0;
  } finally {
    isFetching.value = false;
  }
};

// Sync URL on state change
watch(
  [viewMode, currentPage, itemsPerPage],
  (newValues, oldValues) => {
    router.replace({
      query: {
        ...route.query,
        view: viewMode.value === 'grid' ? 'grid' : undefined,
        page: currentPage.value > 1 ? currentPage.value : undefined,
        pageSize: itemsPerPage.value !== 10 ? itemsPerPage.value : undefined
      }
    });

    // Only fetch if page or pageSize changed, not just viewMode
    if (!oldValues || newValues[1] !== oldValues[1] || newValues[2] !== oldValues[2]) {
      fetchImages();
    }
  },
  { immediate: true }
);

const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value) || 1);
</script>

<template>
  <NuxtLayout name="admin">
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-foreground flex items-center gap-2">
            <ImageIcon class="w-6 h-6 text-muted-foreground" />
            Product Images
          </h1>
          <p class="text-sm text-muted-foreground mt-1">
            Global registry of all uploaded product imagery.
          </p>
        </div>
        <button
          @click="fetchImages"
          class="h-9 px-4 border border-input bg-background hover:bg-muted text-foreground rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <RefreshCw :class="['w-4 h-4', { 'animate-spin': isFetching }]" />
          Refresh
        </button>
      </div>

      <div class="bg-card border border-border rounded-xl shadow-xs overflow-hidden flex flex-col">
        <div class="p-3 border-b border-border bg-muted/20 flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <!-- View Toggle Buttons -->
            <div class="flex items-center bg-muted/60 p-1 rounded-lg border border-border/80">
              <button
                type="button"
                @click="viewMode = 'grid'"
                :class="[
                  'h-7 w-7 rounded-md transition-all flex items-center justify-center cursor-pointer',
                  viewMode === 'grid'
                    ? 'bg-background text-primary shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                ]"
                title="Grid View"
                aria-label="Grid view"
              >
                <LayoutGrid class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                @click="viewMode = 'list'"
                :class="[
                  'h-7 w-7 rounded-md transition-all flex items-center justify-center cursor-pointer',
                  viewMode === 'list'
                    ? 'bg-background text-primary shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                ]"
                title="List View"
                aria-label="List view"
              >
                <List class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          
          <div class="flex items-center gap-2 ml-auto">
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
            </select>
          </div>
        </div>

        <div v-if="errorMsg" class="p-4 border-b border-border bg-destructive/10 text-destructive flex items-center gap-2 text-sm font-medium">
          <AlertCircle class="w-4 h-4" />
          {{ errorMsg }}
        </div>

        <div v-if="viewMode === 'grid'" class="p-4 bg-card flex-1">
          <div v-if="isFetching && images.length === 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            <div v-for="i in itemsPerPage" :key="i" class="rounded-xl border border-border bg-muted/20 animate-pulse aspect-square"></div>
          </div>
          <div v-else-if="images.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
            <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <ImageIcon class="w-6 h-6 text-muted-foreground/50" />
            </div>
            <h3 class="text-sm font-semibold text-foreground">No Product Images Found</h3>
            <p class="text-xs text-muted-foreground mt-1 max-w-sm">There are currently no product images in the global registry.</p>
          </div>
          <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            <div
              v-for="img in images"
              :key="img.id"
              class="group relative rounded-xl border border-border bg-background overflow-hidden flex flex-col hover:border-primary/50 hover:shadow-md transition-all duration-300"
            >
              <div class="relative aspect-square w-full bg-muted/10 flex items-center justify-center p-4 border-b border-border">
                <img v-if="img.image" :src="img.image" :alt="img.alt_text || 'Product image'" class="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" />
                <ImageIcon v-else class="w-8 h-8 text-muted-foreground/50" />
                <div v-if="img.is_default" class="absolute top-2 left-2 flex items-center justify-center w-6 h-6 rounded-full bg-background shadow-xs border border-border text-amber-500 z-10" title="Default Image">
                  <Star class="w-3.5 h-3.5 fill-amber-500" />
                </div>
              </div>
              <div class="p-3 flex flex-col gap-1.5 flex-1 justify-between">
                <p class="text-xs font-semibold text-foreground line-clamp-2 leading-tight" :title="img.alt_text">
                  {{ img.alt_text || 'No Alt Text' }}
                </p>
                <div class="flex items-center justify-between gap-2 mt-1 pt-2 border-t border-border/50">
                  <div class="flex flex-col">
                    <span class="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">Order</span>
                    <span class="text-[10px] font-mono text-foreground font-medium">{{ img.display_order }}</span>
                  </div>
                  <div class="flex flex-col items-end text-right">
                    <span class="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">Created</span>
                    <span class="text-[10px] font-mono text-foreground font-medium whitespace-nowrap">{{ img.created_at ? formatDate(img.created_at) : '—' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <UiTable
          v-else
          :columns="tableColumns"
          :data="images"
          :is-loading="isFetching"
          empty-title="No Product Images Found"
          empty-description="There are currently no product images in the global registry."
          empty-icon="ImageIcon"
        >
          <template #cell(image)="{ item }">
            <div class="w-12 h-12 bg-muted/30 border border-border rounded flex items-center justify-center p-1 mx-auto overflow-hidden">
              <img v-if="item.image" :src="item.image" :alt="item.alt_text || 'Product image'" class="w-full h-full object-contain" />
              <ImageIcon v-else class="w-4 h-4 text-muted-foreground" />
            </div>
          </template>
          
          <template #cell(alt_text)="{ item }">
            <span class="text-sm text-foreground font-medium truncate max-w-[200px] block" :title="item.alt_text">
              {{ item.alt_text || '—' }}
            </span>
          </template>

          <template #cell(display_order)="{ item }">
            <span class="font-mono text-xs text-muted-foreground">{{ item.display_order }}</span>
          </template>

          <template #cell(is_default)="{ item }">
            <div class="flex items-center justify-center">
              <Star v-if="item.is_default" class="w-4 h-4 fill-amber-500 text-amber-500" title="Default" />
              <span v-else class="text-muted-foreground/30">—</span>
            </div>
          </template>

          <template #cell(created_at)="{ item }">
            <span class="text-xs text-muted-foreground font-mono whitespace-nowrap">
              {{ item.created_at ? formatDate(item.created_at) : '—' }}
            </span>
          </template>
        </UiTable>

        <div class="px-4 py-3 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p class="text-xs text-muted-foreground font-medium">
            Showing {{ totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0 }}–{{ Math.min(currentPage * itemsPerPage, totalItems) }} of <span class="font-bold text-foreground">{{ totalItems }}</span>
          </p>
          <UiPagination
            :current-page="currentPage"
            :total-pages="totalPages"
            :total-count="totalItems"
            :items-per-page="itemsPerPage"
            @update:current-page="(p: number) => currentPage = p"
          />
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
