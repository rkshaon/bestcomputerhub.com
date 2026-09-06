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
  AlertCircle
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

watch(
  [currentPage, itemsPerPage],
  () => {
    router.replace({
      query: {
        ...route.query,
        page: currentPage.value > 1 ? currentPage.value : undefined,
        pageSize: itemsPerPage.value !== 10 ? itemsPerPage.value : undefined
      }
    });
    fetchImages();
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

        <UiTable
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
            @page-change="(p) => currentPage = p"
          />
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
