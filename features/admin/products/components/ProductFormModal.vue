<!-- File: /features/admin/products/components/ProductFormModal.vue -->
<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { 
  AlertCircle, 
  Loader2, 
  Layers, 
  X, 
  ChevronDown, 
  Search, 
  Check, 
  Save 
} from 'lucide-vue-next';
import { useProductService } from '@/composables/useProductService';
import { useCategoryService } from '@/composables/useCategoryService';
import { useInfinitePagination } from '@/composables/useInfinitePagination';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { toastSuccess, handleApiError, extractErrorMessage } from '@/composables/useToast';
import { cn, formatCurrency } from '@/utils';
import type { Product, ProductImage, Category, CreateProductPayload, UpdateProductPayload } from '@/types';
import UiAdminModal from '@/components/ui/UiAdminModal.vue';
import UiRichTextEditor from '@/components/ui/UiRichTextEditor.vue';
import ProductImageGallery from '@/components/admin/ProductImageGallery.vue';
import UiInfiniteScroll from '@/components/ui/UiInfiniteScroll.vue';

interface Props {
  isOpen: boolean;
  mode?: 'create' | 'edit';
  product?: Product | null;
  isResolving?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create',
  product: null,
  isResolving: false,
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved'): void;
}>();

const productService = useProductService();
const categoryService = useCategoryService();
const { canCreateInModule, canEditInModule, hasPermission } = useAdminPermissions();

const canCreateProduct = computed(() => hasPermission('product_api.add_product') || canCreateInModule('/admin/products'));
const canEditProduct = computed(() => hasPermission('product_api.change_product') || canEditInModule('/admin/products'));

// Form State
const modalProductName = ref('');
const modalCurrentSellingPrice = ref<number | ''>('');
const modalSelectedCategoryIds = ref<number[]>([]);
const modalShortDescription = ref('');
const modalDescription = ref('');
const modalSpecifications = ref('');
const isModalSubmitting = ref(false);
const modalFormError = ref<string | null>(null);
const modalFieldErrors = ref<{
  name?: string;
  categories?: string;
  price?: string;
}>({});
const modalProductNameInputRef = ref<HTMLInputElement | null>(null);

// Modal Category Picker State
const isModalCategoryDropdownOpen = ref(false);
const modalCategoryDropdownRef = ref<HTMLElement | null>(null);
const modalCategoryDropdownTriggerRef = ref<HTMLButtonElement | null>(null);
const modalCategorySearchInputRef = ref<HTMLInputElement | null>(null);
const modalCategorySearchQuery = ref('');

const modalCategoryPagination = useInfinitePagination<Category>({
  fetcher: async (params) => {
    return await categoryService.getCategoriesList({
      page: params.page,
      page_size: 10,
      search: params.search
    });
  },
  search: modalCategorySearchQuery,
  pageSize: 10,
  dedupeKey: (c) => String(c.id),
  autoFetch: false
});

const toggleModalCategoryDropdown = async () => {
  isModalCategoryDropdownOpen.value = !isModalCategoryDropdownOpen.value;
  if (isModalCategoryDropdownOpen.value) {
    if (modalCategoryPagination.items.value.length === 0) {
      modalCategoryPagination.refresh();
    }
    await nextTick();
    modalCategorySearchInputRef.value?.focus();
  } else {
    modalCategoryDropdownTriggerRef.value?.focus();
  }
};

const closeModalCategoryDropdown = (restoreFocus = false) => {
  if (isModalCategoryDropdownOpen.value) {
    isModalCategoryDropdownOpen.value = false;
    if (restoreFocus) {
      nextTick(() => {
        modalCategoryDropdownTriggerRef.value?.focus();
      });
    }
  }
};

const toggleModalCategorySelection = (categoryId: number | string) => {
  const numId = Number(categoryId);
  const index = modalSelectedCategoryIds.value.indexOf(numId);
  if (index > -1) {
    modalSelectedCategoryIds.value.splice(index, 1);
  } else {
    modalSelectedCategoryIds.value.push(numId);
  }
  if (modalFieldErrors.value.categories && modalSelectedCategoryIds.value.length > 0) {
    modalFieldErrors.value.categories = undefined;
  }
};

const removeModalCategorySelection = (categoryId: number) => {
  const index = modalSelectedCategoryIds.value.indexOf(categoryId);
  if (index > -1) {
    modalSelectedCategoryIds.value.splice(index, 1);
  }
};

const isModalCategorySelected = (categoryId: number | string) => {
  return modalSelectedCategoryIds.value.includes(Number(categoryId));
};

const clearModalCategorySelection = () => {
  modalSelectedCategoryIds.value = [];
};

const getModalCategoryNameById = (id: number): string => {
  const found = modalCategoryPagination.items.value.find(c => Number(c.id) === id);
  return found ? found.name : `Category #${id}`;
};

// Form comparison tracking for PATCH
const originalFormValues = ref<{
  name: string;
  categories: number[];
  current_selling_price: string | number;
  short_description: string;
  description: string;
  specifications: string;
} | null>(null);

const cleanHtmlForComparison = (html: string): string => {
  if (!html) return '';
  let cleaned = html
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

  const emptyParagraphPattern = /^(<p>\s*(<br\s*\/?>)?\s*<\/p>|<br\s*\/?>|\s*)+$/gi;
  if (emptyParagraphPattern.test(cleaned)) {
    return '';
  }

  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();

  return cleaned;
};

const isHtmlEquivalent = (h1: string, h2: string): boolean => {
  return cleanHtmlForComparison(h1) === cleanHtmlForComparison(h2);
};

// Image gallery submodal state
const isModalImagesLoading = ref(false);
const selectedGalleryImage = ref<ProductImage | null>(null);
const modalImageErrorMap = ref<Record<string, boolean>>({});
const isGallerySubmodalOpen = ref(false);

const handleModalImageError = (imageKey?: string) => {
  if (imageKey) {
    modalImageErrorMap.value[imageKey] = true;
  }
};

const getProductImageUrl = (product: Product): string => {
  if (modalImageErrorMap.value[product.id]) {
    return 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&h=600&fit=crop&q=80';
  }
  if (product.default_image) {
    if (typeof product.default_image === 'object' && product.default_image.image) {
      return product.default_image.image;
    }
    if (typeof product.default_image === 'string') {
      return product.default_image;
    }
  }
  if (product.images && product.images.length > 0 && product.images[0]) {
    return product.images[0];
  }
  return 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&h=600&fit=crop&q=80';
};

const getProductImageAlt = (product: Product): string => {
  if (product.default_image && typeof product.default_image === 'object' && product.default_image.alt_text) {
    return product.default_image.alt_text;
  }
  return product.name || 'Product Image';
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

// Populate or reset form on open / mode change
const initForm = () => {
  if (!props.isOpen) {
    selectedGalleryImage.value = null;
    modalImageErrorMap.value = {};
    isGallerySubmodalOpen.value = false;
    return;
  }

  if (props.mode === 'create') {
    modalProductName.value = '';
    modalCurrentSellingPrice.value = '';
    modalSelectedCategoryIds.value = [];
    modalShortDescription.value = '';
    modalDescription.value = '';
    modalSpecifications.value = '';
    modalFormError.value = null;
    modalFieldErrors.value = {};
    modalCategorySearchQuery.value = '';
    isModalCategoryDropdownOpen.value = false;
    originalFormValues.value = null;
    selectedGalleryImage.value = null;
    modalImageErrorMap.value = {};
    isGallerySubmodalOpen.value = false;

    if (modalCategoryPagination.items.value.length === 0) {
      modalCategoryPagination.refresh();
    }
    nextTick(() => {
      modalProductNameInputRef.value?.focus();
    });
  } else if (props.mode === 'edit' && props.product) {
    const entity = props.product;
    modalProductName.value = entity.name || '';
    modalCurrentSellingPrice.value = entity.current_selling_price !== undefined && entity.current_selling_price !== null
      ? Number(entity.current_selling_price)
      : (entity.price !== undefined ? Number(entity.price) : '');

    modalShortDescription.value = entity.short_description || '';
    modalDescription.value = entity.description || '';

    if (typeof entity.specifications === 'string') {
      modalSpecifications.value = entity.specifications;
    } else if (typeof entity.specifications === 'object' && entity.specifications !== null) {
      const entries = Object.entries(entity.specifications);
      if (entries.length > 0) {
        const rows = entries
          .map(([k, v]) => `<tr><td class="font-bold border border-border p-2">${k}</td><td class="border border-border p-2">${v}</td></tr>`)
          .join('');
        modalSpecifications.value = `<table class="w-full border-collapse border border-border"><thead><tr class="bg-muted/50"><th class="border border-border p-2 text-left font-bold">Attribute</th><th class="border border-border p-2 text-left font-bold">Specification</th></tr></thead><tbody>${rows}</tbody></table>`;
      } else {
        modalSpecifications.value = '';
      }
    } else {
      modalSpecifications.value = '';
    }

    if (Array.isArray(entity.categories) && entity.categories.length > 0) {
      modalSelectedCategoryIds.value = entity.categories
        .map((c: any) => (typeof c === 'object' && c !== null && 'id' in c ? Number(c.id) : Number(c)))
        .filter((id: number) => !isNaN(id));
    } else if (entity.origin && typeof entity.origin === 'object' && entity.origin.id) {
      modalSelectedCategoryIds.value = [Number(entity.origin.id)];
    } else if (typeof (entity as any).category === 'number') {
      modalSelectedCategoryIds.value = [Number((entity as any).category)];
    } else {
      modalSelectedCategoryIds.value = [];
    }

    modalFormError.value = null;
    modalFieldErrors.value = {};
    modalCategorySearchQuery.value = '';
    isModalCategoryDropdownOpen.value = false;
    if (modalCategoryPagination.items.value.length === 0) {
      modalCategoryPagination.refresh();
    }

    originalFormValues.value = {
      name: modalProductName.value,
      categories: [...modalSelectedCategoryIds.value],
      current_selling_price: modalCurrentSellingPrice.value,
      short_description: modalShortDescription.value,
      description: modalDescription.value,
      specifications: modalSpecifications.value
    };

    nextTick(() => {
      modalProductNameInputRef.value?.focus();
    });
  }
};

watch([() => props.isOpen, () => props.mode, () => props.product], () => {
  initForm();
}, { immediate: true });

const validateModalForm = (): boolean => {
  modalFieldErrors.value = {};
  modalFormError.value = null;
  let isValid = true;

  if (!modalProductName.value || !modalProductName.value.trim()) {
    modalFieldErrors.value.name = 'Product name is required.';
    isValid = false;
  }

  if (modalSelectedCategoryIds.value.length === 0) {
    modalFieldErrors.value.categories = 'At least one category must be selected.';
    isValid = false;
  }

  if (modalCurrentSellingPrice.value === '' || isNaN(Number(modalCurrentSellingPrice.value)) || Number(modalCurrentSellingPrice.value) < 0) {
    modalFieldErrors.value.price = 'Please enter a valid non-negative selling price.';
    isValid = false;
  }

  return isValid;
};

const handleModalProductSubmit = async () => {
  if (!validateModalForm()) {
    modalFormError.value = 'Please fix the validation errors before submitting.';
    return;
  }

  if (props.mode === 'create') {
    if (!canCreateProduct.value) {
      modalFormError.value = 'You do not have permission to create products.';
      return;
    }

    isModalSubmitting.value = true;
    modalFormError.value = null;

    const payload: CreateProductPayload = {
      name: modalProductName.value.trim(),
      categories: modalSelectedCategoryIds.value.map(id => Number(id)),
      current_selling_price: Number(modalCurrentSellingPrice.value)
    };

    try {
      await productService.createProduct(payload);
      toastSuccess(`Product "${payload.name}" created successfully.`);
      emit('saved');
      emit('close');
    } catch (err: any) {
      modalFormError.value = extractErrorMessage(err, 'Failed to create product. Please check your inputs and try again.');
      handleApiError(err, 'Failed to create product.');
    } finally {
      isModalSubmitting.value = false;
    }
  } else if (props.mode === 'edit') {
    if (!canEditProduct.value) {
      modalFormError.value = 'You do not have permission to edit products.';
      return;
    }

    const targetProduct = props.product;
    const targetIdentifier = targetProduct?.id ?? targetProduct?.slug;
    if (!targetIdentifier) {
      modalFormError.value = 'Product identifier missing.';
      return;
    }

    isModalSubmitting.value = true;
    modalFormError.value = null;

    const payload: Partial<UpdateProductPayload> = {};

    if (originalFormValues.value) {
      const orig = originalFormValues.value;

      // 1. name
      const currentName = modalProductName.value.trim();
      if (currentName !== orig.name.trim()) {
        payload.name = currentName;
      }

      // 2. categories
      const currentCats = modalSelectedCategoryIds.value.map(id => Number(id)).sort((a, b) => a - b);
      const originalCats = orig.categories.map(id => Number(id)).sort((a, b) => a - b);
      const isCategoriesModified = currentCats.length !== originalCats.length || currentCats.some((val, idx) => val !== originalCats[idx]);
      if (isCategoriesModified) {
        payload.categories = modalSelectedCategoryIds.value.map(id => Number(id));
      }

      // 3. current_selling_price
      const currentPrice = modalCurrentSellingPrice.value;
      const originalPrice = orig.current_selling_price;
      const isPriceModified = (!currentPrice && !originalPrice)
        ? false
        : Number(currentPrice) !== Number(originalPrice);
      if (isPriceModified) {
        payload.current_selling_price = currentPrice === '' ? 0 : Number(currentPrice);
      }

      // 4. short_description
      if (!isHtmlEquivalent(modalShortDescription.value, orig.short_description)) {
        payload.short_description = modalShortDescription.value;
      }

      // 5. description
      if (!isHtmlEquivalent(modalDescription.value, orig.description)) {
        payload.description = modalDescription.value;
      }

      // 6. specifications
      if (!isHtmlEquivalent(modalSpecifications.value, orig.specifications)) {
        payload.specifications = modalSpecifications.value;
      }
    } else {
      // Fallback
      payload.name = modalProductName.value.trim();
      payload.categories = modalSelectedCategoryIds.value.map(id => Number(id));
      payload.current_selling_price = Number(modalCurrentSellingPrice.value);
      payload.short_description = modalShortDescription.value;
      payload.description = modalDescription.value;
      payload.specifications = modalSpecifications.value;
    }

    if (Object.keys(payload).length === 0) {
      toastSuccess(`Product "${modalProductName.value.trim()}" updated successfully.`);
      emit('saved');
      emit('close');
      isModalSubmitting.value = false;
      return;
    }

    try {
      await productService.updateProduct(targetIdentifier, payload);
      toastSuccess(`Product "${modalProductName.value.trim()}" updated successfully.`);
      emit('saved');
      emit('close');
    } catch (err: any) {
      modalFormError.value = extractErrorMessage(err, 'Failed to update product. Please check your inputs and try again.');
      handleApiError(err, 'Failed to update product.');
    } finally {
      isModalSubmitting.value = false;
    }
  }
};

const handleClose = () => {
  emit('close');
};

const onDocumentClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement | null;
  if (isModalCategoryDropdownOpen.value && modalCategoryDropdownRef.value && !modalCategoryDropdownRef.value.contains(target)) {
    closeModalCategoryDropdown();
  }
};

const onDocumentKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (isModalCategoryDropdownOpen.value) {
      closeModalCategoryDropdown(true);
      e.stopPropagation();
    }
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
</script>

<template>
  <UiAdminModal
    :is-open="isOpen"
    :title="mode === 'edit' ? 'Edit Product' : 'Add Product'"
    :subtitle="mode === 'edit' ? 'Update product specifications, category classifications, descriptions, and pricing.' : 'Configure and register a new product in the catalog.'"
    :max-width="mode === 'edit' ? 'max-w-3xl' : 'max-w-xl'"
    :close-on-escape="!isGallerySubmodalOpen"
    :close-on-backdrop="!isGallerySubmodalOpen"
    @close="handleClose"
  >
    <!-- Loading State during Edit entity resolution -->
    <div v-if="mode === 'edit' && isResolving" class="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
      <Loader2 class="w-7 h-7 animate-spin text-primary" />
      <span class="text-xs font-semibold">Loading product details...</span>
    </div>

    <form v-else @submit.prevent="handleModalProductSubmit" class="flex flex-col">
      <!-- Scrollable Modal Body -->
      <div class="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[70vh]">
        <!-- Error Banner -->
        <div v-if="modalFormError" class="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2.5 text-xs font-medium text-destructive">
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ modalFormError }}</span>
        </div>

        <!-- Product Hero Card -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 bg-muted/40 rounded-2xl border border-border">
          <div v-if="mode === 'edit'" class="w-20 h-20 bg-background border border-border rounded-xl flex items-center justify-center p-1.5 shadow-xs overflow-hidden shrink-0 relative">
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
            <!-- Name is editable -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Product Name <span class="text-destructive">*</span></span>
                <span v-if="modalFieldErrors.name" class="text-destructive font-normal normal-case text-xs">{{ modalFieldErrors.name }}</span>
              </label>
              <input
                ref="modalProductNameInputRef"
                v-model="modalProductName"
                type="text"
                placeholder="e.g. GeForce RTX 4090 Gaming OC 24G"
                :class="cn(
                  'w-full h-11 px-3.5 bg-background border rounded-xl outline-none text-sm font-medium text-foreground placeholder:text-muted-foreground transition-all focus:ring-2',
                  modalFieldErrors.name ? 'border-destructive focus:ring-destructive/20' : 'border-input focus:ring-ring/20'
                )"
                :disabled="isModalSubmitting"
              />
            </div>
            <!-- Read-only context -->
            <div v-if="mode === 'edit' && product" class="flex items-center gap-2 flex-wrap text-xs pt-1">
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
          <!-- Selling Price is editable -->
          <div class="p-3.5 bg-muted/20 border border-border rounded-xl space-y-1 sm:col-span-1">
            <label class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex justify-between">
              <span>Selling Price <span class="text-destructive">*</span></span>
            </label>
            <div class="relative mt-1">
              <div class="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-xs pointer-events-none">
                Tk
              </div>
              <input
                v-model.number="modalCurrentSellingPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                :class="cn(
                  'w-full h-8 pl-8 pr-2.5 bg-background border rounded-lg outline-none text-xs font-mono font-bold text-foreground placeholder:text-muted-foreground transition-all focus:ring-2',
                  modalFieldErrors.price ? 'border-destructive focus:ring-destructive/20' : 'border-input focus:ring-ring/20'
                )"
                :disabled="isModalSubmitting"
              />
            </div>
          </div>
          <!-- Read-only core identifiers -->
          <div v-if="mode === 'edit' && product" class="p-3.5 bg-muted/20 border border-border rounded-xl space-y-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product ID</span>
            <p class="text-base font-bold text-foreground font-mono">
              #{{ product.id }}
            </p>
          </div>
          <div v-if="mode === 'edit' && product" class="p-3.5 bg-muted/20 border border-border rounded-xl space-y-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Legacy ID</span>
            <p class="text-base font-bold text-foreground font-mono">
              {{ product.legacy_id !== null && product.legacy_id !== undefined ? `#${product.legacy_id}` : 'N/A' }}
            </p>
          </div>
          <div v-if="mode === 'edit' && product" class="p-3.5 bg-muted/20 border border-border rounded-xl space-y-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Inventory Stock</span>
            <p class="text-base font-bold text-foreground font-mono">
              {{ product.stock ?? 0 }} units
            </p>
          </div>
        </div>

        <!-- Classifications Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <!-- Assigned Categories Editable -->
          <div class="p-4 bg-muted/20 border border-border rounded-xl space-y-2" :class="mode === 'edit' && product ? '' : 'sm:col-span-2'">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex justify-between">
              <span>Assigned Categories <span class="text-destructive">*</span></span>
              <span v-if="modalFieldErrors.categories" class="text-destructive font-normal normal-case">{{ modalFieldErrors.categories }}</span>
            </span>
            
            <!-- Selected Category Pills / Chips -->
            <div v-if="modalSelectedCategoryIds.length > 0" class="flex flex-wrap gap-1.5 mt-1">
              <span 
                v-for="catId in modalSelectedCategoryIds" 
                :key="catId"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-medium"
              >
                <Layers class="w-3 h-3" />
                <span>{{ getModalCategoryNameById(catId) }}</span>
                <button
                  type="button"
                  @click="removeModalCategorySelection(catId)"
                  class="text-primary/70 hover:text-primary hover:bg-primary/20 rounded p-0.5 transition-colors cursor-pointer"
                  title="Remove category"
                  aria-label="Remove category"
                >
                  <X class="w-3 h-3" />
                </button>
              </span>
            </div>
            
            <!-- Modal Category Dropdown Trigger -->
            <div ref="modalCategoryDropdownRef" class="relative mt-2">
              <button
                ref="modalCategoryDropdownTriggerRef"
                type="button"
                @click.stop="toggleModalCategoryDropdown"
                :aria-expanded="isModalCategoryDropdownOpen"
                :class="cn(
                  'w-full h-10 px-3 bg-background border rounded-xl text-left text-xs font-medium transition-all flex items-center justify-between gap-2 cursor-pointer focus:ring-2',
                  modalFieldErrors.categories ? 'border-destructive focus:ring-destructive/20' : 'border-input focus:ring-ring/20',
                  modalSelectedCategoryIds.length === 0 ? 'text-muted-foreground' : 'text-foreground'
                )"
                :disabled="isModalSubmitting"
              >
                <div class="flex items-center gap-2 truncate">
                  <Layers class="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span class="truncate">
                    {{ modalSelectedCategoryIds.length === 0 ? 'Select categories...' : `Add more categories...` }}
                  </span>
                </div>
                <ChevronDown :class="cn('w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0', isModalCategoryDropdownOpen && 'rotate-180')" />
              </button>
              
              <!-- Category Dropdown Popover -->
              <div 
                v-if="isModalCategoryDropdownOpen"
                @click.stop
                @keydown.esc.stop="closeModalCategoryDropdown(true)"
                class="absolute left-0 top-full z-50 mt-1.5 w-full bg-card border border-border rounded-xl shadow-xl p-2.5 text-xs font-medium animate-in fade-in zoom-in-95 duration-150"
              >
                <!-- Category Search Input -->
                <div class="relative mb-2">
                  <Search class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    ref="modalCategorySearchInputRef"
                    v-model="modalCategorySearchQuery"
                    type="text"
                    placeholder="Search categories..."
                    class="w-full h-8 pl-8 pr-2.5 text-xs bg-muted/50 border border-input rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/20"
                  />
                </div>
                <!-- Header & Clear Option -->
                <div class="flex items-center justify-between px-1 py-1 mb-1 border-b border-border/60 text-[11px]">
                  <span class="text-muted-foreground font-semibold">Available Categories</span>
                  <button
                    v-if="modalSelectedCategoryIds.length > 0"
                    type="button"
                    @click="clearModalCategorySelection"
                    class="text-primary hover:underline font-bold cursor-pointer"
                  >
                    Clear selection ({{ modalSelectedCategoryIds.length }})
                  </button>
                </div>
                <!-- Infinite Scroll List of Categories -->
                <div class="max-h-52 overflow-y-auto space-y-0.5 p-0.5 scrollbar-thin">
                  <button
                    v-for="cat in modalCategoryPagination.items.value"
                    :key="cat.id"
                    type="button"
                    @click="toggleModalCategorySelection(cat.id)"
                    :class="[
                      'w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer',
                      isModalCategorySelected(cat.id) ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'
                    ]"
                  >
                    <div class="flex items-center gap-2 truncate">
                      <span class="truncate">{{ cat.name }}</span>
                      <span v-if="cat.slug" class="font-mono text-[10px] text-muted-foreground">/{{ cat.slug }}</span>
                    </div>
                    <div 
                      class="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors"
                      :class="isModalCategorySelected(cat.id) ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-background'"
                    >
                      <Check v-if="isModalCategorySelected(cat.id)" class="w-3 h-3 stroke-[3]" />
                    </div>
                  </button>
                  <!-- Loading State -->
                  <div v-if="modalCategoryPagination.isLoading.value && modalCategoryPagination.items.value.length === 0" class="py-4 text-center text-muted-foreground flex items-center justify-center gap-2 text-xs">
                    <Loader2 class="w-3.5 h-3.5 animate-spin text-primary" />
                    <span>Loading categories...</span>
                  </div>
                  <!-- Empty Category State -->
                  <div v-if="!modalCategoryPagination.isLoading.value && modalCategoryPagination.items.value.length === 0" class="py-4 text-center text-muted-foreground text-xs">
                    No matching categories found.
                  </div>
                  <!-- Infinite Scroll Sentinel -->
                  <UiInfiniteScroll
                    :has-more="modalCategoryPagination.hasMore.value"
                    :is-loading="modalCategoryPagination.isFetchingNextPage.value"
                    :error="modalCategoryPagination.error.value"
                    @load-more="modalCategoryPagination.loadNextPage"
                    @retry="modalCategoryPagination.loadNextPage"
                  />
                </div>
              </div>
            </div>
          </div>
          <!-- Category Origin Readonly -->
          <div v-if="mode === 'edit' && product" class="p-4 bg-muted/20 border border-border rounded-xl space-y-2 sm:col-span-1">
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
        <div>
          <!-- Short Description -->
          <div class="space-y-1.5 pt-4 border-t border-border/60">
            <UiRichTextEditor
              v-model="modalShortDescription"
              label="Short Description"
              placeholder="Enter brief product highlights / summary..."
              min-height="min-h-[100px]"
              :disabled="isModalSubmitting"
              helper-text="Concise summary displayed on product cards and catalog overviews."
            />
          </div>
          <!-- Full Description -->
          <div class="space-y-1.5 pt-4 border-t border-border/60">
            <UiRichTextEditor
              v-model="modalDescription"
              label="Description"
              placeholder="Enter comprehensive product description, features, and marketing content..."
              min-height="min-h-[160px]"
              :disabled="isModalSubmitting"
              helper-text="Full product details with headings, bullet points, formatting, and paragraphs."
            />
          </div>
          <!-- Technical Specifications -->
          <div class="space-y-1.5 pt-4 border-t border-border/60">
            <UiRichTextEditor
              v-model="modalSpecifications"
              label="Specifications"
              placeholder="Enter technical specifications (insert table using toolbar)..."
              min-height="min-h-[180px]"
              :disabled="isModalSubmitting"
              :allow-tables="true"
              helper-text="HTML specification table containing structured technical hardware parameters."
            />
          </div>
        </div>
        <!-- Dedicated Product Image Gallery Section -->
        <div v-if="mode === 'edit'" class="space-y-1.5 pt-4 border-t border-border/60">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product Image Gallery</span>
          <ProductImageGallery
            :product="product"
            :product-id="product?.id"
            v-model:selected-image="selectedGalleryImage"
            v-model:is-submodal-open="isGallerySubmodalOpen"
            v-model:is-loading="isModalImagesLoading"
            class="pt-2"
          />
        </div>

        <!-- Price History Section (Read-Only) -->
        <div v-if="mode === 'edit' && product" class="space-y-2 pt-4 border-t border-border/60">
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
        <div v-if="mode === 'edit' && product" class="pt-4 border-t border-border space-y-2.5 text-xs">
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
      <!-- Modal Footer Controls -->
      <div class="px-6 py-4 border-t border-border flex items-center justify-end gap-3 bg-muted/20">
        <button 
          type="button"
          @click="handleClose"
          class="h-10 px-5 border border-input bg-background hover:bg-muted text-foreground rounded-xl text-xs font-semibold flex items-center transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="isModalSubmitting || (mode === 'create' && !canCreateProduct) || (mode === 'edit' && !canEditProduct)"
          class="h-10 px-6 bg-primary text-primary-foreground rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs hover:opacity-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Loader2 v-if="isModalSubmitting" class="w-4 h-4 animate-spin" />
          <Save v-else class="w-4 h-4" />
          <span>{{ isModalSubmitting ? (mode === 'edit' ? 'Saving Changes...' : 'Creating Product...') : (mode === 'edit' ? 'Save Changes' : 'Create Product') }}</span>
        </button>
      </div>
    </form>
  </UiAdminModal>
</template>
