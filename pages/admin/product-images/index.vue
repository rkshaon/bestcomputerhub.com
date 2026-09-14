<script setup lang="ts">
import { ref, computed, watch, reactive, onMounted, onUnmounted } from 'vue';
import { useProductService } from '@/composables/useProductService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useAdminModalState } from '@/composables/useAdminModalState';
import { toastError } from '@/composables/useToast';
import { useInfinitePagination } from '@/composables/useInfinitePagination';
import { useRoute, useRouter } from 'vue-router';
import { isNonSquareAspect, isExceedingResolution } from '@/utils/imageValidation';
import { decodeHtmlEntities } from '@/utils';
import ProductImageCropModal from '@/components/admin/ProductImageCropModal.vue';
import UiInfiniteScroll from '@/components/ui/UiInfiniteScroll.vue';
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
  List,
  Crop,
  ChevronDown,
  X
} from 'lucide-vue-next';
import UiTable from '@/components/ui/UiTable.vue';
import type { UiTableColumn } from '@/components/ui/UiTable.vue';
import UiButton from '@/components/ui/Button.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import type { ProductImage, Product } from '@/types';

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

// Product multi-select filter state
const parseProductsFromQuery = (queryVal: any): string[] => {
  if (!queryVal) return [];
  if (Array.isArray(queryVal)) {
    return queryVal
      .map(String)
      .flatMap(v => v.split(','))
      .map(s => s.trim())
      .filter(Boolean);
  }
  return String(queryVal)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
};

const selectedProductIds = ref<string[]>(parseProductsFromQuery(route.query.products));

const productsParam = computed(() => {
  return selectedProductIds.value.length > 0 ? selectedProductIds.value.join(',') : undefined;
});

const productSearchQuery = ref('');
const isProductDropdownOpen = ref(false);
const productDropdownRef = ref<HTMLElement | null>(null);

const productPagination = useInfinitePagination<Product>({
  fetcher: async (params) => {
    return await productService.getProductsList({
      page: params.page,
      page_size: 10,
      search: params.search
    });
  },
  search: productSearchQuery,
  pageSize: 10,
  dedupeKey: (p) => String(p.id),
  autoFetch: false
});

const knownProductsMap = reactive<Record<string, Product>>({});

watch(
  () => productPagination.items.value,
  (newItems) => {
    newItems.forEach((p) => {
      if (p.id) knownProductsMap[String(p.id)] = p;
      if (p.slug) knownProductsMap[String(p.slug)] = p;
    });
  },
  { immediate: true, deep: true }
);

const resolveSelectedProductDetails = async () => {
  for (const id of selectedProductIds.value) {
    if (!knownProductsMap[id]) {
      try {
        const prod = await productService.getProductDetails(id);
        if (prod) {
          if (prod.id) knownProductsMap[String(prod.id)] = prod;
          if (prod.slug) knownProductsMap[String(prod.slug)] = prod;
        }
      } catch {
        // Fallback label used if resolution fails
      }
    }
  }
};

watch(
  selectedProductIds,
  () => {
    resolveSelectedProductDetails();
  },
  { immediate: true, deep: true }
);

const toggleProductDropdown = () => {
  isProductDropdownOpen.value = !isProductDropdownOpen.value;
  if (isProductDropdownOpen.value && productPagination.items.value.length === 0) {
    productPagination.refresh();
  }
};

const closeProductDropdown = () => {
  isProductDropdownOpen.value = false;
};

const toggleProductSelection = (product: Product) => {
  const idStr = String(product.id);
  const index = selectedProductIds.value.indexOf(idStr);
  if (index > -1) {
    selectedProductIds.value.splice(index, 1);
  } else {
    selectedProductIds.value.push(idStr);
    knownProductsMap[idStr] = product;
    if (product.slug) {
      knownProductsMap[product.slug] = product;
    }
  }
};

const removeProductSelection = (id: string) => {
  const index = selectedProductIds.value.indexOf(id);
  if (index > -1) {
    selectedProductIds.value.splice(index, 1);
  }
};

const isProductSelected = (product: Product) => {
  const idStr = String(product.id);
  const slugStr = product.slug ? String(product.slug) : '';
  return selectedProductIds.value.includes(idStr) || (slugStr !== '' && selectedProductIds.value.includes(slugStr));
};

const clearProductSelection = () => {
  selectedProductIds.value = [];
};

const getSelectedProductName = (id: string): string => {
  const found = knownProductsMap[id];
  if (found) {
    return decodeHtmlEntities(found.name);
  }
  return `Product #${id}`;
};

const activeProductsButtonLabel = computed(() => {
  if (selectedProductIds.value.length === 0) {
    return 'All Products';
  }
  const firstId = selectedProductIds.value[0];
  if (selectedProductIds.value.length === 1 && firstId) {
    return getSelectedProductName(firstId);
  }
  return `${selectedProductIds.value.length} Products selected`;
});

const onDocumentClick = (e: MouseEvent) => {
  if (productDropdownRef.value && !productDropdownRef.value.contains(e.target as Node)) {
    closeProductDropdown();
  }
};

const onDocumentKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    closeProductDropdown();
  }
};

onMounted(() => {
  if (typeof window !== 'undefined') {
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onDocumentKeydown);
  }
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    document.removeEventListener('click', onDocumentClick);
    document.removeEventListener('keydown', onDocumentKeydown);
  }
});

const tableColumns: UiTableColumn<ProductImage>[] = [
  { key: 'image', label: 'Image', width: '80px', headerClass: 'px-4 py-3 text-center', cellClass: 'px-4 py-2.5 text-center' },
  { key: 'alt_text', label: 'Alt Text', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
  { key: 'resolution', label: 'Resolution', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
  { key: 'size', label: 'Size', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
  { key: 'display_order', label: 'Order', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
  { key: 'is_default', label: 'Default', headerClass: 'px-4 py-3 text-center', cellClass: 'px-4 py-2.5 text-center' },
  { key: 'created_at', label: 'Created At', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
  { key: 'actions', label: 'Actions', headerClass: 'px-4 py-3 text-right', cellClass: 'px-4 py-2.5 text-right' }
];

const modalState = useAdminModalState<ProductImage>({
  modalParam: 'modal',
  idParam: 'id',
  getItems: async (id) => {
    const idStr = String(id);
    const found = images.value.find((img) => String(img.id) === idStr);
    if (found) return found;

    try {
      const singleImg = await productService.getProductImageDetail(id);
      if (singleImg) return singleImg;
    } catch {
      // Fallthrough to null
    }
    return null;
  },
  onResolveError: (id) => {
    toastError(`Product image #${id} could not be resolved.`);
    modalState.closeModal({ replace: true });
  }
});

const isCropModalOpen = computed(() => modalState.isOpen.value && modalState.activeMode.value === 'crop');
const selectedImageToCrop = computed(() => modalState.activeEntity.value);

const openCropModal = (item: ProductImage) => {
  modalState.openModal('crop', item.id);
};

const closeCropModal = () => {
  modalState.closeModal();
};

const handleImageReplaced = async (updatedItem: ProductImage) => {
  if (selectedImageToCrop.value?.image) {
    delete imageMetadataCache[selectedImageToCrop.value.image];
  }
  if (updatedItem.image) {
    delete imageMetadataCache[updatedItem.image];
    fetchImageMetadata(updatedItem.image);
  }
  await fetchImages();
  await modalState.closeModal();
};

const formatSize = (bytes?: number) => {
  if (bytes === undefined || isNaN(bytes)) return '—';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const imageMetadataCache = reactive<Record<string, { width?: number; height?: number; size?: number; loaded?: boolean; loading?: boolean }>>({});

const fetchImageMetadata = async (url: string) => {
  if (import.meta.server || !url || imageMetadataCache[url]?.loaded || imageMetadataCache[url]?.loading) return;
  imageMetadataCache[url] = { ...imageMetadataCache[url], loading: true };
  
  try {
    const img = new Image();
    const dimensionsPromise = new Promise<{width: number, height: number}>((resolve, reject) => {
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = reject;
      img.src = url;
    });

    const sizePromise = fetch(url, { method: 'HEAD' })
      .then((res) => {
        const length = res.headers.get('content-length');
        const parsedLength = length ? parseInt(length, 10) : NaN;
        return !isNaN(parsedLength) && parsedLength > 0 ? parsedLength : undefined;
      })
      .catch(() => undefined);

    const [dims, size] = await Promise.all([
      dimensionsPromise.catch(() => ({ width: 0, height: 0 })),
      sizePromise
    ]);
    
    imageMetadataCache[url] = {
      width: dims.width,
      height: dims.height,
      size: size,
      loaded: true,
      loading: false
    };
  } catch (err) {
    imageMetadataCache[url] = { loaded: true, loading: false };
  }
};

const images = ref<ProductImage[]>([]);

watch(() => images.value, (newImages) => {
  newImages.forEach(img => {
    if (img.image) {
      fetchImageMetadata(img.image);
    }
  });
}, { immediate: true, deep: true });

const totalItems = ref(0);
const isFetching = ref(false);
const errorMsg = ref<string | null>(null);

const fetchImages = async () => {
  isFetching.value = true;
  errorMsg.value = null;
  try {
    const res = await productService.getAllProductImages(
      currentPage.value,
      itemsPerPage.value,
      productsParam.value
    );
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
  [viewMode, currentPage, itemsPerPage, productsParam],
  (newValues, oldValues) => {
    const [newView, newPage, newPageSize, newProducts] = newValues;
    const oldProducts = oldValues ? oldValues[3] : undefined;
    const oldPage = oldValues ? oldValues[1] : undefined;
    const oldPageSize = oldValues ? oldValues[2] : undefined;

    // Reset pagination to page 1 when products filter changes
    if (oldValues && newProducts !== oldProducts) {
      if (currentPage.value !== 1) {
        currentPage.value = 1;
        return;
      }
    }

    router.replace({
      query: {
        ...route.query,
        view: newView === 'grid' ? 'grid' : undefined,
        page: newPage > 1 ? newPage : undefined,
        pageSize: newPageSize !== 10 ? newPageSize : undefined,
        products: newProducts
      }
    });

    if (!oldValues || newPage !== oldPage || newPageSize !== oldPageSize || newProducts !== oldProducts) {
      fetchImages();
    }
  },
  { immediate: true }
);

const isNonSquareImage = (imageUrl?: string | null): boolean => {
  if (!imageUrl) return false;
  const meta = imageMetadataCache[imageUrl];
  if (!meta?.loaded) return false;
  return isNonSquareAspect(meta.width, meta.height);
};

const isHighResolutionImage = (imageUrl?: string | null): boolean => {
  if (!imageUrl) return false;
  const meta = imageMetadataCache[imageUrl];
  if (!meta?.loaded) return false;
  return isExceedingResolution(meta.width, meta.height, 500);
};

const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value) || 1);
</script>

<template>
  <NuxtLayout name="admin">
    <template #header-title>
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground/40 font-light select-none">/</span>
        <h1 class="text-xl font-display font-extrabold tracking-tight text-foreground">
          Product Images
        </h1>
      </div>
    </template>

    <template #header-actions>
      <div class="flex flex-wrap items-center gap-2">
        <UiButton 
          variant="outline" 
          class="rounded-xl h-9 px-3.5 gap-1.5 border-border font-bold text-xs"
          @click="fetchImages"
          :disabled="isFetching"
        >
          <RefreshCw :class="['w-3.5 h-3.5', isFetching && 'animate-spin']" />
          <span>Refresh</span>
        </UiButton>
      </div>
    </template>

    <div class="space-y-4 animate-in fade-in duration-500">
      <div class="bg-card border border-border rounded-xl shadow-xs overflow-hidden flex flex-col">
        <div class="p-3 border-b border-border bg-muted/20 flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2">
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

            <!-- Product Multi-Select Filter Popover -->
            <div ref="productDropdownRef" class="relative">
              <button
                type="button"
                @click.stop="toggleProductDropdown"
                class="h-9 px-3 bg-background border border-input rounded-lg outline-none text-xs font-medium cursor-pointer text-foreground focus:ring-2 focus:ring-ring/20 transition-all flex items-center justify-between gap-2 min-w-[180px]"
                :class="selectedProductIds.length > 0 ? 'border-primary/50 text-foreground font-semibold' : 'text-muted-foreground'"
              >
                <div class="flex items-center gap-1.5 truncate">
                  <Filter class="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span class="truncate">{{ activeProductsButtonLabel }}</span>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                  <span 
                    v-if="selectedProductIds.length > 0" 
                    class="px-1.5 py-0.5 text-[10px] font-bold bg-primary text-primary-foreground rounded-full leading-none"
                  >
                    {{ selectedProductIds.length }}
                  </span>
                  <ChevronDown :class="['w-3.5 h-3.5 transition-transform duration-200', isProductDropdownOpen && 'rotate-180']" />
                </div>
              </button>

              <!-- Product Options Popover Menu -->
              <div 
                v-if="isProductDropdownOpen"
                @click.stop
                class="absolute left-0 z-30 mt-1.5 w-80 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-lg p-2 text-xs font-medium animate-in fade-in zoom-in-95 duration-150"
              >
                <div class="relative mb-2">
                  <Search class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    v-model="productSearchQuery"
                    type="text"
                    placeholder="Search products by name, SKU..."
                    class="w-full h-8 pl-8 pr-2.5 text-xs bg-muted/50 border border-input rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/20"
                  />
                </div>

                <div class="flex items-center justify-between px-1 py-1 mb-1 border-b border-border/60 text-[11px]">
                  <span class="text-muted-foreground font-semibold">Filter by Product</span>
                  <button
                    v-if="selectedProductIds.length > 0"
                    type="button"
                    @click="clearProductSelection"
                    class="text-primary hover:underline font-bold cursor-pointer"
                  >
                    Clear all ({{ selectedProductIds.length }})
                  </button>
                </div>

                <div class="max-h-60 overflow-y-auto space-y-0.5 p-0.5 scrollbar-thin">
                  <button
                    type="button"
                    @click="clearProductSelection"
                    :class="[
                      'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between',
                      selectedProductIds.length === 0 ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'
                    ]"
                  >
                    <span>All Products</span>
                    <Check v-if="selectedProductIds.length === 0" class="w-3.5 h-3.5 text-primary" />
                  </button>

                  <button
                    v-for="prod in productPagination.items.value"
                    :key="prod.id"
                    type="button"
                    @click="toggleProductSelection(prod)"
                    :class="[
                      'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between gap-2',
                      isProductSelected(prod) ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'
                    ]"
                  >
                    <div class="min-w-0 flex-1">
                      <div class="truncate text-xs font-medium">{{ decodeHtmlEntities(prod.name) }}</div>
                      <div v-if="prod.sku || prod.slug" class="text-[10px] text-muted-foreground truncate">
                        <span v-if="prod.sku">SKU: {{ prod.sku }}</span>
                        <span v-else-if="prod.slug">Slug: {{ prod.slug }}</span>
                      </div>
                    </div>
                    <div 
                      class="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors"
                      :class="isProductSelected(prod) ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-background'"
                    >
                      <Check v-if="isProductSelected(prod)" class="w-3 h-3 stroke-[3]" />
                    </div>
                  </button>

                  <UiInfiniteScroll
                    :has-more="productPagination.hasMore.value"
                    :is-fetching="productPagination.isFetchingNextPage.value"
                    @load-more="productPagination.loadNextPage"
                  />
                </div>
              </div>
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

        <!-- Active Filter Badges Bar -->
        <div v-if="selectedProductIds.length > 0" class="flex flex-wrap items-center gap-1.5 px-3.5 py-2 bg-muted/10 border-b border-border text-xs">
          <span class="text-[11px] font-semibold text-muted-foreground">Filtered by:</span>
          <div 
            v-for="id in selectedProductIds" 
            :key="id"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[11px] font-medium"
          >
            <span class="truncate max-w-[180px]">{{ getSelectedProductName(id) }}</span>
            <button 
              type="button" 
              @click="removeProductSelection(id)"
              class="hover:bg-primary/20 rounded-full p-0.5 transition-colors cursor-pointer"
              title="Remove product filter"
            >
              <X class="w-3 h-3" />
            </button>
          </div>
          <button 
            type="button" 
            @click="clearProductSelection"
            class="text-[11px] font-bold text-destructive hover:underline ml-1 cursor-pointer"
          >
            Clear Filter
          </button>
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
              :class="[
                'group relative rounded-xl border overflow-hidden flex flex-col transition-all duration-300',
                isNonSquareImage(img.image)
                  ? 'border-destructive/40 bg-destructive/10 text-destructive-foreground shadow-2xs hover:border-destructive'
                  : 'border-border bg-background hover:border-primary/50 hover:shadow-md'
              ]"
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
                <div class="flex flex-col gap-2 mt-1 pt-2 border-t border-border/50">
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex flex-col">
                      <span class="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">Res</span>
                      <span class="text-[10px] font-mono text-foreground font-medium inline-flex items-center gap-1">
                        <template v-if="img.image && imageMetadataCache[img.image]?.loaded">
                          <template v-if="imageMetadataCache[img.image]?.width">
                            <span>{{ imageMetadataCache[img.image]?.width }}&times;{{ imageMetadataCache[img.image]?.height }}</span>
                            <AlertCircle
                              v-if="isHighResolutionImage(img.image)"
                              class="w-3 h-3 text-amber-500 inline-block shrink-0 cursor-help"
                              title="Please keep the image height and width below or equal to 500 pixels."
                            />
                          </template>
                          <template v-else>—</template>
                        </template>
                        <Loader2 v-else-if="img.image && imageMetadataCache[img.image]?.loading" class="w-3 h-3 animate-spin text-muted-foreground" />
                        <template v-else>—</template>
                      </span>
                    </div>
                    <div class="flex flex-col items-end text-right">
                      <span class="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">Size</span>
                      <span class="text-[10px] font-mono text-foreground font-medium inline-flex items-center">
                        <template v-if="img.image && imageMetadataCache[img.image]?.loaded">
                          {{ formatSize(imageMetadataCache[img.image]?.size) }}
                        </template>
                        <Loader2 v-else-if="img.image && imageMetadataCache[img.image]?.loading" class="w-3 h-3 animate-spin text-muted-foreground" />
                        <template v-else>—</template>
                      </span>
                    </div>
                  </div>
                  
                  <div class="flex items-center justify-between gap-2 border-t border-border/30 pt-1.5 mt-0.5">
                    <div class="flex flex-col">
                      <span class="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">Order</span>
                      <span class="text-[10px] font-mono text-foreground font-medium">{{ img.display_order }}</span>
                    </div>
                    <div class="flex flex-col items-end text-right">
                      <span class="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">Created</span>
                      <span class="text-[10px] font-mono text-foreground font-medium whitespace-nowrap">{{ img.created_at ? formatDate(img.created_at) : '—' }}</span>
                    </div>
                  </div>

                  <!-- Always-visible Resolution Warning Message -->
                  <div v-if="isHighResolutionImage(img.image)" class="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[10px] leading-snug">
                    <p class="font-bold flex items-center gap-1">
                      <AlertCircle class="w-3 h-3 shrink-0 text-amber-500" />
                      <span>Image resolution is too large</span>
                    </p>
                    <p class="mt-0.5 text-[9.5px] text-muted-foreground font-normal">
                      Please replace this image with one where both width and height are 500px or less.
                    </p>
                  </div>

                  <!-- Always-visible Crop Image Action for Non-Square Images -->
                  <UiButton
                    v-if="isNonSquareImage(img.image)"
                    variant="outline"
                    size="sm"
                    class="w-full h-7 mt-2 text-[11px] font-bold border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:border-destructive gap-1.5 cursor-pointer justify-center"
                    @click="openCropModal(img)"
                  >
                    <Crop class="w-3.5 h-3.5" />
                    <span>Crop image</span>
                  </UiButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        <UiTable
          v-else
          :columns="tableColumns"
          :data="images"
          :loading="isFetching"
          :row-class="(item) => isNonSquareImage(item.image) ? 'bg-destructive/10 text-destructive-foreground hover:bg-destructive/15' : ''"
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

          <template #cell(resolution)="{ item }">
            <div class="flex flex-col">
              <span class="text-xs font-mono text-muted-foreground whitespace-nowrap inline-flex items-center gap-1">
                <template v-if="item.image && imageMetadataCache[item.image]?.loaded">
                  <template v-if="imageMetadataCache[item.image]?.width">
                    <span>{{ imageMetadataCache[item.image]?.width }} &times; {{ imageMetadataCache[item.image]?.height }} px</span>
                    <AlertCircle
                      v-if="isHighResolutionImage(item.image)"
                      class="w-3.5 h-3.5 text-amber-500 inline-block shrink-0 cursor-help"
                      title="Please keep the image height and width below or equal to 500 pixels."
                    />
                  </template>
                  <template v-else>—</template>
                </template>
                <Loader2 v-else-if="item.image && imageMetadataCache[item.image]?.loading" class="w-3 h-3 animate-spin text-muted-foreground" />
                <template v-else>—</template>
              </span>

              <!-- Always-visible Resolution Warning Message for Table List View -->
              <div v-if="isHighResolutionImage(item.image)" class="mt-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[10px] leading-snug max-w-[240px]">
                <p class="font-bold flex items-center gap-1">
                  <AlertCircle class="w-3 h-3 shrink-0 text-amber-500" />
                  <span>Image resolution is too large</span>
                </p>
                <p class="mt-0.5 text-[9.5px] text-muted-foreground font-normal whitespace-normal">
                  Please replace this image with one where both width and height are 500px or less.
                </p>
              </div>
            </div>
          </template>
          
          <template #cell(size)="{ item }">
            <span class="text-xs font-mono text-muted-foreground whitespace-nowrap inline-flex items-center">
              <template v-if="item.image && imageMetadataCache[item.image]?.loaded">
                {{ formatSize(imageMetadataCache[item.image]?.size) }}
              </template>
              <Loader2 v-else-if="item.image && imageMetadataCache[item.image]?.loading" class="w-3 h-3 animate-spin text-muted-foreground" />
              <template v-else>—</template>
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

          <template #cell(actions)="{ item }">
            <div class="flex items-center justify-end">
              <UiButton
                v-if="isNonSquareImage(item.image)"
                variant="outline"
                size="sm"
                class="h-7 px-2.5 text-[11px] font-bold border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:border-destructive gap-1 cursor-pointer"
                @click="openCropModal(item)"
              >
                <Crop class="w-3.5 h-3.5" />
                <span>Crop image</span>
              </UiButton>
              <span v-else class="text-xs text-muted-foreground/40">—</span>
            </div>
          </template>
        </UiTable>

        <UiPagination
          v-model:current-page="currentPage"
          :total-pages="totalPages"
          :total-count="totalItems"
          :items-per-page="itemsPerPage"
          item-label="images"
        />
      </div>
    </div>

    <!-- Product Image Crop Modal -->
    <ProductImageCropModal
      :is-open="isCropModalOpen"
      :image-item="selectedImageToCrop"
      @close="closeCropModal"
      @success="handleImageReplaced"
    />
  </NuxtLayout>
</template>
