<!-- File: /pages/admin/products/new.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { 
  ChevronLeft, 
  Save, 
  X, 
  Search, 
  Check, 
  Layers, 
  DollarSign, 
  AlertCircle, 
  Loader2, 
  Package, 
  Plus, 
  ChevronDown 
} from 'lucide-vue-next';
import { useProductService } from '@/composables/useProductService';
import { useCategoryService } from '@/composables/useCategoryService';
import { useInfinitePagination } from '@/composables/useInfinitePagination';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { toastSuccess, handleApiError, extractErrorMessage } from '@/composables/useToast';
import { formatCurrency, cn } from '@/utils';
import type { Category, CreateProductPayload } from '@/types';

definePageMeta({
  layout: 'admin'
});

const productService = useProductService();
const categoryService = useCategoryService();
const { canCreateInModule, hasPermission } = useAdminPermissions();
const router = useRouter();

const canCreateProduct = computed(() => hasPermission('product_api.add_product') || canCreateInModule('/admin/products'));

// Form State
const productName = ref('');
const currentSellingPrice = ref<number | ''>('');
const selectedCategoryIds = ref<number[]>([]);

// UI & Async States
const isSubmitting = ref(false);
const formError = ref<string | null>(null);
const fieldErrors = ref<{
  name?: string;
  categories?: string;
  price?: string;
}>({});

// Category Dropdown & Infinite Scroll Picker State
const isCategoryDropdownOpen = ref(false);
const categoryDropdownRef = ref<HTMLElement | null>(null);
const categorySearchQuery = ref('');
const productNameInputRef = ref<HTMLInputElement | null>(null);

const categoryPagination = useInfinitePagination<Category>({
  fetcher: async (params) => {
    return await categoryService.getCategoriesList({
      page: params.page,
      page_size: 10,
      search: params.search
    });
  },
  search: categorySearchQuery,
  pageSize: 10,
  dedupeKey: (c) => String(c.id),
  autoFetch: false
});

// Category Dropdown Actions
const toggleCategoryDropdown = () => {
  isCategoryDropdownOpen.value = !isCategoryDropdownOpen.value;
  if (isCategoryDropdownOpen.value && categoryPagination.items.value.length === 0) {
    categoryPagination.refresh();
  }
};

const closeCategoryDropdown = () => {
  isCategoryDropdownOpen.value = false;
};

const toggleCategorySelection = (categoryId: number | string) => {
  const numId = Number(categoryId);
  const index = selectedCategoryIds.value.indexOf(numId);
  if (index > -1) {
    selectedCategoryIds.value.splice(index, 1);
  } else {
    selectedCategoryIds.value.push(numId);
  }
  if (fieldErrors.value.categories && selectedCategoryIds.value.length > 0) {
    fieldErrors.value.categories = undefined;
  }
};

const removeCategorySelection = (categoryId: number) => {
  const index = selectedCategoryIds.value.indexOf(categoryId);
  if (index > -1) {
    selectedCategoryIds.value.splice(index, 1);
  }
};

const isCategorySelected = (categoryId: number | string) => {
  return selectedCategoryIds.value.includes(Number(categoryId));
};

const clearCategorySelection = () => {
  selectedCategoryIds.value = [];
};

const getCategoryNameById = (id: number): string => {
  const found = categoryPagination.items.value.find(c => Number(c.id) === id);
  return found ? found.name : `Category #${id}`;
};

// Validation & Submission
const validateForm = (): boolean => {
  fieldErrors.value = {};
  formError.value = null;
  let isValid = true;

  if (!productName.value || !productName.value.trim()) {
    fieldErrors.value.name = 'Product name is required.';
    isValid = false;
  }

  if (selectedCategoryIds.value.length === 0) {
    fieldErrors.value.categories = 'At least one category must be selected.';
    isValid = false;
  }

  if (currentSellingPrice.value === '' || isNaN(Number(currentSellingPrice.value)) || Number(currentSellingPrice.value) < 0) {
    fieldErrors.value.price = 'Please enter a valid non-negative selling price.';
    isValid = false;
  }

  return isValid;
};

const handleSubmit = async () => {
  if (!validateForm()) {
    formError.value = 'Please fix the validation errors before submitting.';
    return;
  }

  if (!canCreateProduct.value) {
    formError.value = 'You do not have permission to create products.';
    return;
  }

  isSubmitting.value = true;
  formError.value = null;

  const payload: CreateProductPayload = {
    name: productName.value.trim(),
    categories: selectedCategoryIds.value.map(id => Number(id)),
    current_selling_price: Number(currentSellingPrice.value)
  };

  try {
    await productService.createProduct(payload);
    toastSuccess(`Product "${payload.name}" created successfully.`);
    await navigateTo('/admin/products');
  } catch (err: any) {
    formError.value = extractErrorMessage(err, 'Failed to create product. Please check your inputs and try again.');
    handleApiError(err, 'Failed to create product.');
  } finally {
    isSubmitting.value = false;
  }
};

// Global click & keydown listeners
const onDocumentClick = (e: MouseEvent) => {
  if (!isCategoryDropdownOpen.value) return;
  const target = e.target as HTMLElement | null;
  if (categoryDropdownRef.value && !categoryDropdownRef.value.contains(target)) {
    closeCategoryDropdown();
  }
};

const onDocumentKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isCategoryDropdownOpen.value) {
    closeCategoryDropdown();
  }
};

onMounted(() => {
  if (!canCreateProduct.value) {
    navigateTo('/admin/forbidden');
    return;
  }
  categoryPagination.refresh();
  nextTick(() => {
    productNameInputRef.value?.focus();
  });
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
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header Row -->
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <NuxtLink 
          to="/admin/products" 
          class="w-9 h-9 border border-border bg-card rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Back to products list"
          aria-label="Back to products list"
        >
          <ChevronLeft class="w-4 h-4" />
        </NuxtLink>
        <div>
          <h1 class="text-2xl font-display font-extrabold tracking-tight text-foreground">Add Product</h1>
          <p class="text-xs text-muted-foreground mt-0.5">Register a new product in the catalog.</p>
        </div>
      </div>

      <div class="flex items-center gap-2.5">
        <NuxtLink 
          to="/admin/products"
          class="h-9 px-4 border border-input bg-background hover:bg-muted text-foreground rounded-xl text-xs font-semibold flex items-center transition-colors"
        >
          Cancel
        </NuxtLink>
        <button
          type="button"
          @click="handleSubmit"
          :disabled="isSubmitting || !canCreateProduct"
          class="h-9 px-5 bg-primary text-primary-foreground rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs hover:opacity-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          <Save v-else class="w-4 h-4" />
          <span>{{ isSubmitting ? 'Creating...' : 'Create Product' }}</span>
        </button>
      </div>
    </div>

    <!-- Error Banner -->
    <div v-if="formError" class="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-xs font-medium text-destructive">
      <AlertCircle class="w-4 h-4 shrink-0" />
      <span>{{ formError }}</span>
    </div>

    <!-- Main Form Card -->
    <form @submit.prevent="handleSubmit" class="bg-card text-card-foreground border border-border rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
      <div class="border-b border-border/80 pb-4 flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Package class="w-4 h-4" />
        </div>
        <div>
          <h2 class="text-base font-bold text-foreground">Product Information</h2>
          <p class="text-xs text-muted-foreground">Provide core identity and pricing attributes for this product.</p>
        </div>
      </div>

      <!-- Form Fields Grid -->
      <div class="space-y-5">
        <!-- Product Name -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Product Name <span class="text-destructive">*</span></span>
            <span v-if="fieldErrors.name" class="text-destructive font-normal normal-case text-xs">{{ fieldErrors.name }}</span>
          </label>
          <input
            ref="productNameInputRef"
            v-model="productName"
            type="text"
            placeholder="e.g. GeForce RTX 4090 Gaming OC 24G"
            :class="cn(
              'w-full h-11 px-3.5 bg-background border rounded-xl outline-none text-sm font-medium text-foreground placeholder:text-muted-foreground transition-all focus:ring-2',
              fieldErrors.name ? 'border-destructive focus:ring-destructive/20' : 'border-input focus:ring-ring/20'
            )"
            :disabled="isSubmitting"
          />
        </div>

        <!-- Categories Selector -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Categories <span class="text-destructive">*</span></span>
            <span v-if="fieldErrors.categories" class="text-destructive font-normal normal-case text-xs">{{ fieldErrors.categories }}</span>
          </label>

          <!-- Selected Category Pills / Chips -->
          <div v-if="selectedCategoryIds.length > 0" class="flex flex-wrap gap-1.5 mb-2">
            <span 
              v-for="catId in selectedCategoryIds" 
              :key="catId"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-medium"
            >
              <Layers class="w-3 h-3" />
              <span>{{ getCategoryNameById(catId) }}</span>
              <button
                type="button"
                @click="removeCategorySelection(catId)"
                class="text-primary/70 hover:text-primary hover:bg-primary/20 rounded p-0.5 transition-colors cursor-pointer"
                title="Remove category"
                aria-label="Remove category"
              >
                <X class="w-3 h-3" />
              </button>
            </span>
          </div>

          <!-- Category Dropdown Trigger -->
          <div ref="categoryDropdownRef" class="relative">
            <button
              type="button"
              @click.stop="toggleCategoryDropdown"
              :class="cn(
                'w-full h-11 px-3.5 bg-background border rounded-xl text-left text-sm font-medium transition-all flex items-center justify-between gap-2 cursor-pointer focus:ring-2',
                fieldErrors.categories ? 'border-destructive focus:ring-destructive/20' : 'border-input focus:ring-ring/20',
                selectedCategoryIds.length === 0 ? 'text-muted-foreground' : 'text-foreground'
              )"
              :disabled="isSubmitting"
              aria-haspopup="listbox"
              :aria-expanded="isCategoryDropdownOpen"
            >
              <div class="flex items-center gap-2 truncate">
                <Layers class="w-4 h-4 text-muted-foreground shrink-0" />
                <span class="truncate">
                  {{ selectedCategoryIds.length === 0 ? 'Select one or more categories...' : `${selectedCategoryIds.length} categories selected` }}
                </span>
              </div>
              <ChevronDown :class="cn('w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0', isCategoryDropdownOpen && 'rotate-180')" />
            </button>

            <!-- Category Dropdown Popover -->
            <div 
              v-if="isCategoryDropdownOpen"
              @click.stop
              class="absolute left-0 top-full z-40 mt-1.5 w-full bg-card border border-border rounded-xl shadow-lg p-2.5 text-xs font-medium animate-in fade-in zoom-in-95 duration-150"
            >
              <!-- Category Search Input -->
              <div class="relative mb-2">
                <Search class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  v-model="categorySearchQuery"
                  type="text"
                  placeholder="Search categories..."
                  class="w-full h-8 pl-8 pr-2.5 text-xs bg-muted/50 border border-input rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>

              <!-- Header & Clear Option -->
              <div class="flex items-center justify-between px-1 py-1 mb-1 border-b border-border/60 text-[11px]">
                <span class="text-muted-foreground font-semibold">Available Categories</span>
                <button
                  v-if="selectedCategoryIds.length > 0"
                  type="button"
                  @click="clearCategorySelection"
                  class="text-primary hover:underline font-bold cursor-pointer"
                >
                  Clear selection ({{ selectedCategoryIds.length }})
                </button>
              </div>

              <!-- Infinite Scroll List of Categories -->
              <div class="max-h-56 overflow-y-auto space-y-0.5 p-0.5 scrollbar-thin">
                <button
                  v-for="cat in categoryPagination.items.value"
                  :key="cat.id"
                  type="button"
                  @click="toggleCategorySelection(cat.id)"
                  :class="[
                    'w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer',
                    isCategorySelected(cat.id) ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'
                  ]"
                >
                  <div class="flex items-center gap-2 truncate">
                    <span class="truncate">{{ cat.name }}</span>
                    <span v-if="cat.slug" class="font-mono text-[10px] text-muted-foreground">/{{ cat.slug }}</span>
                  </div>
                  <div 
                    class="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors"
                    :class="isCategorySelected(cat.id) ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-background'"
                  >
                    <Check v-if="isCategorySelected(cat.id)" class="w-3 h-3 stroke-[3]" />
                  </div>
                </button>

                <!-- Loading State -->
                <div v-if="categoryPagination.isLoading.value && categoryPagination.items.value.length === 0" class="py-4 text-center text-muted-foreground flex items-center justify-center gap-2 text-xs">
                  <Loader2 class="w-3.5 h-3.5 animate-spin text-primary" />
                  <span>Loading categories...</span>
                </div>

                <!-- Empty Category State -->
                <div v-if="!categoryPagination.isLoading.value && categoryPagination.items.value.length === 0" class="py-4 text-center text-muted-foreground text-xs">
                  No matching categories found.
                </div>

                <!-- Infinite Scroll Sentinel -->
                <UiInfiniteScroll
                  :has-more="categoryPagination.hasMore.value"
                  :is-loading="categoryPagination.isFetchingNextPage.value"
                  :error="categoryPagination.error.value"
                  @load-more="categoryPagination.loadNextPage"
                  @retry="categoryPagination.loadNextPage"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Current Selling Price -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Current Selling Price <span class="text-destructive">*</span></span>
            <span v-if="fieldErrors.price" class="text-destructive font-normal normal-case text-xs">{{ fieldErrors.price }}</span>
          </label>
          <div class="relative">
            <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm pointer-events-none">
              $
            </div>
            <input
              v-model.number="currentSellingPrice"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              :class="cn(
                'w-full h-11 pl-8 pr-3.5 bg-background border rounded-xl outline-none text-sm font-medium text-foreground placeholder:text-muted-foreground transition-all focus:ring-2 font-mono',
                fieldErrors.price ? 'border-destructive focus:ring-destructive/20' : 'border-input focus:ring-ring/20'
              )"
              :disabled="isSubmitting"
            />
          </div>
          <p class="text-[11px] text-muted-foreground">Standard retail unit price for transactions in USD.</p>
        </div>
      </div>

      <!-- Action Buttons Footer -->
      <div class="pt-4 border-t border-border flex items-center justify-end gap-3">
        <NuxtLink 
          to="/admin/products"
          class="h-10 px-5 border border-input bg-background hover:bg-muted text-foreground rounded-xl text-xs font-semibold flex items-center transition-colors"
        >
          Cancel
        </NuxtLink>
        <button
          type="submit"
          :disabled="isSubmitting || !canCreateProduct"
          class="h-10 px-6 bg-primary text-primary-foreground rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs hover:opacity-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          <Save v-else class="w-4 h-4" />
          <span>{{ isSubmitting ? 'Creating Product...' : 'Save Product' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>
