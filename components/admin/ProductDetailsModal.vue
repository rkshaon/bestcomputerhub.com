<!-- File: /components/admin/ProductDetailsModal.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { 
  ExternalLink,
  Edit2,
  X,
  Loader2,
  AlertCircle,
  ShoppingCart,
  Layers
} from 'lucide-vue-next';
import UiAdminModal from '@/components/ui/UiAdminModal.vue';
import ProductImageGallery from '@/components/admin/ProductImageGallery.vue';
import { formatCurrency, cn, decodeHtmlEntities } from '@/utils';
import type { Product, ProductImage, ProductCategoryRef } from '@/types';

const props = defineProps<{
  isOpen: boolean;
  isResolving: boolean;
  product: Product | null;
  canEdit?: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'edit', id: string | number): void;
}>();

const isModalImagesLoading = ref(false);
const selectedGalleryImage = ref<ProductImage | null>(null);
const modalImageErrorMap = ref<Record<string, boolean>>({});
const isGallerySubmodalOpen = ref(false);

const handleModalImageError = (imageKey?: string) => {
  if (imageKey) {
    modalImageErrorMap.value[imageKey] = true;
  }
};

watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen) {
      selectedGalleryImage.value = null;
      modalImageErrorMap.value = {};
      isGallerySubmodalOpen.value = false;
    }
  }
);

const getProductImageUrl = (p: Product): string => {
  if (p.default_image) {
    if (typeof p.default_image === 'object' && p.default_image.image) {
      return p.default_image.image;
    }
    if (typeof p.default_image === 'string') {
      return p.default_image;
    }
  }
  if (Array.isArray(p.images) && p.images.length > 0) {
    return typeof p.images[0] === 'string' ? p.images[0] : (p.images[0]?.image || '');
  }
  return 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&h=600&fit=crop&q=80';
};

const getProductImageAlt = (p: Product): string => {
  if (p.default_image && typeof p.default_image === 'object' && p.default_image.alt_text) {
    return p.default_image.alt_text;
  }
  return decodeHtmlEntities(p.name) || 'Product Image';
};

const modalMainImageUrl = computed<string>(() => {
  if (selectedGalleryImage.value?.image) {
    if (modalImageErrorMap.value[selectedGalleryImage.value.image]) {
      return 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&h=600&fit=crop&q=80';
    }
    return selectedGalleryImage.value.image;
  }
  if (props.product) {
    return getProductImageUrl(props.product);
  }
  return 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&h=600&fit=crop&q=80';
});

const modalMainImageAlt = computed<string>(() => {
  if (selectedGalleryImage.value?.alt_text) {
    return selectedGalleryImage.value.alt_text;
  }
  if (props.product) {
    return getProductImageAlt(props.product);
  }
  return 'Product Image';
});

const getProductPrice = (product: Product): number => {
  if (product.current_selling_price !== undefined && product.current_selling_price !== null) {
    return Number(product.current_selling_price);
  }
  return Number(product.price ?? 0);
};

const getStorefrontProductUrl = (product: Product): string => {
  const slug = product.slug || String(product.id);
  return `/product/${slug}/`;
};

const getProductDetailCategories = computed<ProductCategoryRef[]>(() => {
  const p = props.product;
  if (!p || !p.categories) return [];
  if (Array.isArray(p.categories)) {
    return p.categories.map((c: any) => {
      if (typeof c === 'object' && c !== null) {
        return {
          id: c.id ?? '',
          name: c.name ?? 'Unnamed Category',
          slug: c.slug ?? ''
        };
      }
      return {
        id: c,
        name: `Category #${c}`,
        slug: ''
      };
    });
  }
  return [];
});

const parsedSpecifications = computed<Array<{ key: string; value: any }>>(() => {
  const specs = props.product?.specifications;
  if (!specs) return [];
  if (typeof specs === 'string') {
    try {
      const parsed = JSON.parse(specs);
      if (parsed && typeof parsed === 'object') {
        return Object.entries(parsed).map(([key, value]) => ({ key, value }));
      }
    } catch {
      // Not JSON
    }
  } else if (typeof specs === 'object' && specs !== null) {
    return Object.entries(specs).map(([key, value]) => ({ key, value }));
  }
  return [];
});

const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  } catch {
    return String(dateStr);
  }
};
</script>

<template>
  <UiAdminModal 
    :is-open="isOpen" 
    max-width="max-w-3xl" 
    :show-close-button="false" 
    :close-on-escape="!isGallerySubmodalOpen"
    :close-on-backdrop="!isGallerySubmodalOpen"
    @close="emit('close')"
  >
    <div class="w-full relative overflow-hidden flex flex-col cursor-default">
      <!-- Header Banner -->
      <div class="px-6 py-5 border-b border-border flex items-center justify-between shrink-0 bg-muted/20">
        <div>
          <span class="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground">Product Specification Audit</span>
          <h3 class="text-xl font-display font-extrabold tracking-tight text-foreground mt-0.5">
            {{ isResolving ? 'Loading Product...' : (product?.name || 'Product Details') }}
          </h3>
        </div>
        <div class="flex items-center gap-2">
          <NuxtLink 
            v-if="!isResolving && product"
            :to="getStorefrontProductUrl(product)"
            target="_blank"
            rel="noopener noreferrer"
            class="h-9 px-3.5 border border-input bg-background hover:bg-muted text-foreground rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="View on Storefront"
          >
            <ExternalLink class="w-3.5 h-3.5" />
            <span>Storefront</span>
          </NuxtLink>
          <button 
            v-if="!isResolving && product && canEdit"
            type="button"
            @click="emit('edit', product.id)"
            class="h-9 px-3.5 border border-input bg-background hover:bg-muted text-foreground rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Edit2 class="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
          <button 
            type="button"
            @click="emit('close')" 
            aria-label="Close dialog"
            class="w-9 h-9 border border-input rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Resolving / Loading State -->
      <div v-if="isResolving" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
        <p class="text-xs font-semibold text-muted-foreground">Retrieving product specifications & metadata...</p>
      </div>

      <!-- Error / Not Found State -->
      <div v-else-if="!product" class="p-12 flex flex-col items-center justify-center gap-3 text-center">
        <div class="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle class="w-6 h-6" />
        </div>
        <p class="text-sm font-bold text-foreground">Product Details Not Available</p>
        <p class="text-xs text-muted-foreground">Could not load the requested product specifications from the catalog registry.</p>
        <button 
          type="button"
          @click="emit('close')"
          class="mt-2 h-9 px-4 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>

      <!-- Product Content Container -->
      <div v-else class="flex flex-col overflow-hidden">
        <!-- Scrollable Modal Body -->
        <div class="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[70vh]">

          <!-- Product Hero Card -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 bg-muted/40 rounded-2xl border border-border">
            <div class="w-20 h-20 bg-background border border-border rounded-xl flex items-center justify-center p-1.5 shadow-xs overflow-hidden shrink-0 relative">
              <div v-if="isModalImagesLoading" class="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-xs z-10">
                <Loader2 class="w-4 h-4 animate-spin text-primary" />
              </div>
              <img 
                :src="modalMainImageUrl" 
                :alt="modalMainImageAlt" 
                @error="handleModalImageError(selectedGalleryImage?.image)"
                class="w-full h-full object-contain" 
              />
            </div>
            
            <div class="flex-1 min-w-0 space-y-1.5 w-full">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-lg font-bold font-display tracking-tight text-foreground leading-tight">
                  {{ product.name }}
                </span>
                <span v-if="product.in_cart" class="shrink-0 text-primary" title="In Cart">
                  <ShoppingCart class="w-4 h-4" />
                </span>
              </div>
              <!-- Read-only context -->
              <div class="flex items-center gap-2 flex-wrap text-xs pt-1">
                <span class="font-mono text-primary font-bold bg-primary/10 px-2 py-0.5 rounded text-[11px]">
                  {{ product.slug }}
                </span>
                <span class="font-mono text-muted-foreground text-[11px] font-semibold">
                  SKU: {{ product.sku || 'N/A' }}
                </span>
                <div class="flex items-center gap-1.5 ml-auto">
                  <span :class="cn(
                    'w-2 h-2 rounded-full',
                    product.is_active !== false ? 'bg-emerald-500' : 'bg-muted-foreground'
                  )"></span>
                  <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {{ product.is_active !== false ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Pricing & Core Identifiers Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="p-3.5 bg-muted/20 border border-border rounded-xl space-y-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Selling Price</span>
              <p class="text-base font-extrabold text-foreground font-mono">
                {{ formatCurrency(getProductPrice(product)) }}
              </p>
            </div>
            <div class="p-3.5 bg-muted/20 border border-border rounded-xl space-y-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product ID</span>
              <p class="text-base font-bold text-foreground font-mono">
                #{{ product.id }}
              </p>
            </div>
            <div class="p-3.5 bg-muted/20 border border-border rounded-xl space-y-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Legacy ID</span>
              <p class="text-base font-bold text-foreground font-mono">
                {{ product.legacy_id !== null && product.legacy_id !== undefined ? `#${product.legacy_id}` : 'N/A' }}
              </p>
            </div>
            <div class="p-3.5 bg-muted/20 border border-border rounded-xl space-y-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Inventory Stock</span>
              <p class="text-base font-bold text-foreground font-mono">
                {{ product.stock ?? 0 }} units
              </p>
            </div>
          </div>

          <!-- Classifications Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="p-4 bg-muted/20 border border-border rounded-xl space-y-2">
              <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Assigned Categories</span>
              <div v-if="getProductDetailCategories.length > 0" class="flex flex-wrap gap-1.5 mt-1">
                <span 
                  v-for="cat in getProductDetailCategories" 
                  :key="cat.id"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-medium"
                >
                  <Layers class="w-3 h-3" />
                  <span>{{ cat.name }}</span>
                  <span v-if="cat.slug" class="text-[10px] font-mono text-primary/70">/{{ cat.slug }}</span>
                </span>
              </div>
              <p v-else class="text-xs text-muted-foreground italic mt-1">No categories assigned.</p>
            </div>
            <div class="p-4 bg-muted/20 border border-border rounded-xl space-y-2">
              <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category Origin</span>
              <div v-if="product.origin" class="p-2.5 bg-muted/30 border border-border rounded-xl text-xs inline-block mt-1 w-full">
                <div class="flex items-center gap-3">
                  <span class="font-bold text-foreground">{{ typeof product.origin === 'object' ? product.origin.name : product.origin }}</span>
                  <span v-if="typeof product.origin === 'object' && product.origin.id" class="font-mono text-[10px] text-muted-foreground">ID: #{{ product.origin.id }}</span>
                </div>
                <p v-if="typeof product.origin === 'object' && product.origin.slug" class="text-[11px] font-mono text-muted-foreground mt-0.5">
                  Slug: {{ product.origin.slug }}
                </p>
                <p v-if="typeof product.origin === 'object' && product.origin.parent" class="text-[11px] text-muted-foreground mt-0.5">
                  Parent: {{ product.origin.parent }}
                </p>
              </div>
              <p v-else class="text-xs text-muted-foreground italic mt-1">No category origin recorded.</p>
            </div>
          </div>

          <!-- Rich-Text HTML Fields -->
          <div class="space-y-6 pt-4 border-t border-border/60">
            <div v-if="product.short_description" class="space-y-1.5">
              <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Short Description</span>
              <div class="prose prose-sm prose-slate dark:prose-invert max-w-none text-xs text-foreground bg-muted/30 p-3.5 rounded-xl border border-border font-medium leading-relaxed" v-html="product.short_description">
              </div>
            </div>
            <div class="space-y-1.5">
              <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description</span>
              <div class="prose prose-sm prose-slate dark:prose-invert max-w-none text-xs text-foreground bg-muted/20 p-4 rounded-xl border border-border font-normal leading-relaxed max-h-48 overflow-y-auto">
                <div v-if="product.description" v-html="product.description"></div>
                <p v-else class="text-xs text-muted-foreground italic m-0">No product description provided.</p>
              </div>
            </div>
            <div class="space-y-2">
              <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Technical Specifications</span>
              <div v-if="typeof product.specifications === 'string' && (product.specifications.includes('<') && product.specifications.includes('>'))" class="prose prose-sm prose-slate dark:prose-invert max-w-none">
                <div v-html="product.specifications" class="text-xs text-foreground bg-card border rounded-xl p-4 overflow-x-auto"></div>
              </div>
              <div v-else-if="parsedSpecifications.length > 0" class="border border-border rounded-xl overflow-hidden divide-y divide-border text-xs">
                <div 
                  v-for="(spec, idx) in parsedSpecifications" 
                  :key="idx"
                  class="flex items-start justify-between p-2.5 bg-card hover:bg-muted/30 transition-colors gap-4"
                >
                  <span class="font-bold text-muted-foreground w-1/3 shrink-0">{{ spec.key }}</span>
                  <span class="font-medium text-foreground text-right break-words flex-1">{{ spec.value }}</span>
                </div>
              </div>
              <p v-else class="text-xs text-muted-foreground italic">No specifications recorded for this product.</p>
            </div>
          </div>

          <!-- Dedicated Product Image Gallery Section -->
          <div class="space-y-1.5 pt-4 border-t border-border/60">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product Image Gallery</span>
            <ProductImageGallery
              :product="product"
              :product-id="product.id"
              v-model:selected-image="selectedGalleryImage"
              v-model:is-submodal-open="isGallerySubmodalOpen"
              v-model:is-loading="isModalImagesLoading"
              :can-add="false"
              :can-delete="false"
              class="pt-2"
            />
          </div>

          <!-- Price History Section (Read-Only) -->
          <div class="space-y-2 pt-4 border-t border-border/60">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Price History</span>
            <div v-if="product.price_histories && product.price_histories.length > 0" class="border border-border rounded-xl overflow-hidden divide-y divide-border text-xs">
              <div class="grid grid-cols-3 bg-muted/40 p-2.5 font-bold text-[11px] uppercase tracking-wider text-muted-foreground">
                <span>Price</span>
                <span>Changed At</span>
                <span class="text-right">Changed By</span>
              </div>
              <div 
                v-for="(history, hIdx) in product.price_histories" 
                :key="hIdx"
                class="grid grid-cols-3 p-2.5 bg-card hover:bg-muted/20 transition-colors items-center"
              >
                <span class="font-bold font-mono text-foreground">{{ typeof history.price === 'number' ? formatCurrency(history.price) : (!isNaN(Number(history.price)) ? formatCurrency(Number(history.price)) : history.price) }}</span>
                <span class="text-muted-foreground text-[11px] font-mono">{{ formatDate(history.changed_at) }}</span>
                <span class="text-right text-muted-foreground font-mono text-[11px]">{{ history.changed_by || 'System' }}</span>
              </div>
            </div>
            <p v-else class="text-xs text-muted-foreground italic mt-1">No price modification history records available.</p>
          </div>

          <!-- Audit Metadata Grid (Read-Only) -->
          <div class="pt-4 border-t border-border space-y-2.5 text-xs">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Audit & Governance</span>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="space-y-0.5">
                <span class="text-[10px] text-muted-foreground font-semibold">Created At</span>
                <p class="font-mono text-[11px] text-foreground">{{ formatDate(product.created_at) }}</p>
              </div>
              <div class="space-y-0.5">
                <span class="text-[10px] text-muted-foreground font-semibold">Updated At</span>
                <p class="font-mono text-[11px] text-foreground">{{ formatDate(product.updated_at) }}</p>
              </div>
              <div class="space-y-0.5">
                <span class="text-[10px] text-muted-foreground font-semibold">Created By</span>
                <p class="font-mono text-[11px] text-foreground">{{ product.created_by ? `#${product.created_by}` : 'System' }}</p>
              </div>
              <div class="space-y-0.5">
                <span class="text-[10px] text-muted-foreground font-semibold">Updated By</span>
                <p class="font-mono text-[11px] text-foreground">{{ product.updated_by ? `#${product.updated_by}` : 'System' }}</p>
              </div>
            </div>
            <div v-if="product.deleted_at" class="mt-3 p-2.5 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive flex items-center justify-between">
              <span class="font-bold">Soft Deleted Timestamp</span>
              <span class="font-mono">{{ formatDate(product.deleted_at) }}</span>
            </div>
          </div>
        </div>

        <!-- Footer Control -->
        <div class="px-6 py-4 border-t border-border flex items-center justify-end gap-3 bg-muted/20">
          <button 
            type="button"
            @click="emit('close')" 
            class="h-10 px-6 bg-foreground text-background hover:bg-foreground/90 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </UiAdminModal>
</template>
