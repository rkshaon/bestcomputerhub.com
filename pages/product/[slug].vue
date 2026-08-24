<!-- File: /pages/product/[slug].vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { 
  ChevronRight, 
  ArrowLeft, 
  Star, 
  ShoppingCart, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Info, 
  Plus, 
  Minus, 
  Zap, 
  Cpu, 
  Globe, 
  Heart, 
  Check, 
  Package, 
  AlertCircle, 
  RefreshCw,
  Layers,
  Clock,
  Home,
  Edit2,
  Loader2,
  Save,
  X,
  ChevronDown,
  Search
} from 'lucide-vue-next';
import { formatCurrency, cn } from '@/utils';
import { useCartStore } from '@/stores/cart';
import { useUIStore } from '@/stores/ui';
import { useProductService } from '@/composables/useProductService';
import { useCategoryService } from '@/composables/useCategoryService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useAuthStore } from '@/stores/auth';
import { useInfinitePagination } from '@/composables/useInfinitePagination';
import { toastSuccess, toastError, handleApiError, extractErrorMessage } from '@/composables/useToast';
import type { Product, Category, UpdateProductPayload } from '@/types';
import UiAdminModal from '@/components/ui/UiAdminModal.vue';
import UiRichTextEditor from '@/components/ui/UiRichTextEditor.vue';
import UiInfiniteScroll from '@/components/ui/UiInfiniteScroll.vue';

const route = useRoute();
const productService = useProductService();
const categoryService = useCategoryService();
const cartStore = useCartStore();
const uiStore = useUIStore();

const slug = computed(() => (route.params.slug as string) || '');

// Fetch product details via async data using the route slug
const { data: product, pending: isLoading, error, refresh } = await useAsyncData(
  `product-detail-${slug.value}`,
  async () => {
    if (!slug.value) return null;
    return await productService.getProductDetails(slug.value);
  },
  {
    watch: [slug]
  }
);

// Quantity & local state
const quantity = ref(1);
const activeTab = ref<'description' | 'specification' | 'reviews'>('description');
const selectedImage = ref<string>('');
const isWishlisted = ref(false);

// Synchronize selected image and wishlist state when product data changes
watch(
  () => product.value,
  (newProd) => {
    if (newProd) {
      if (newProd.images && newProd.images.length > 0 && newProd.images[0]) {
        selectedImage.value = newProd.images[0];
      } else if (newProd.default_image) {
        selectedImage.value = typeof newProd.default_image === 'string'
          ? newProd.default_image
          : (newProd.default_image.image || '');
      } else {
        selectedImage.value = '';
      }
      isWishlisted.value = Boolean(newProd.wishlist);
    }
  },
  { immediate: true }
);

// Dynamic SEO metadata
useSeoMeta({
  title: () => product.value ? `${product.value.name} | Best Computer Hub` : 'Product Details | Best Computer Hub',
  description: () => product.value?.short_description || product.value?.description || 'Authentic hardware and computing components at Best Computer Hub. Official warranty and express fulfillment.',
  ogTitle: () => product.value?.name || 'Product Details',
  ogDescription: () => product.value?.short_description || product.value?.description || 'Shop authentic computer components with official warranty at Best Computer Hub.',
  ogImage: () => selectedImage.value || '/logo.svg'
});

// Category and Origin resolution
const originCategory = computed(() => {
  if (product.value?.origin && typeof product.value.origin === 'object') {
    return product.value.origin;
  }
  return null;
});

// Extract the leaf/actual category from product.categories (the last object in the hierarchical array)
const targetCategoryIdentifier = computed(() => {
  if (!product.value || !Array.isArray(product.value.categories) || product.value.categories.length === 0) {
    return null;
  }

  // Iterate backwards to find the first category that is not the product itself
  for (let i = product.value.categories.length - 1; i >= 0; i--) {
    const cat = product.value.categories[i];
    if (!cat) continue;

    let catId = '';
    let catSlug = '';

    if (typeof cat === 'object') {
      catId = cat.id !== undefined && cat.id !== null ? String(cat.id) : '';
      catSlug = cat.slug ? String(cat.slug) : '';
    } else if (typeof cat === 'number' || typeof cat === 'string') {
      catId = String(cat);
      catSlug = String(cat);
    }

    // Ignore if this category represents the product itself
    if (
      (catSlug && catSlug.toLowerCase() === slug.value.toLowerCase()) ||
      (product.value.slug && catSlug.toLowerCase() === product.value.slug.toLowerCase()) ||
      (product.value.id && catId === String(product.value.id))
    ) {
      continue;
    }

    // Found a valid category that is not the product itself
    if (typeof cat === 'object') {
      if (cat.id !== undefined && cat.id !== null && cat.id !== '') {
        return cat.id;
      }
      if (cat.slug) {
        return cat.slug;
      }
    } else {
      return cat;
    }
  }

  return null;
});

// Category path hierarchy fetched via Category Path API: GET /api/v1/categories/path/
const { data: categoryPath } = await useAsyncData(
  `product-category-path-${slug.value}`,
  async () => {
    const target = targetCategoryIdentifier.value;
    if (!target) return [];
    try {
      return await categoryService.getCategoryPath(target);
    } catch (e) {
      console.warn('Failed to load category path for product:', e);
      return [];
    }
  },
  {
    watch: [targetCategoryIdentifier]
  }
);

interface BreadcrumbItem {
  name: string;
  url: string;
}

const categoryBreadcrumbs = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = [];
  const path = categoryPath.value;

  if (Array.isArray(path) && path.length > 0) {
    // Render the returned path in its provided order:
    // Parent Category → Sub Category → Current Category
    path.forEach((catItem, idx) => {
      const slugPath = path.slice(0, idx + 1).map(c => c.slug).filter(Boolean).join('/');
      items.push({
        name: catItem.name,
        url: `/product-category/${slugPath}/`
      });
    });
  } else if (originCategory.value?.name) {
    items.push({
      name: originCategory.value.name,
      url: originCategory.value.slug ? `/product-category/${originCategory.value.slug}/` : '/products/'
    });
  } else if (product.value?.category && typeof product.value.category === 'string' && product.value.category !== 'General') {
    items.push({
      name: product.value.category,
      url: '/products/'
    });
  }

  return items;
});

const categoryName = computed(() => {
  if (categoryPath.value && categoryPath.value.length > 0) {
    const lastItem = categoryPath.value[categoryPath.value.length - 1];
    if (lastItem?.name) return lastItem.name;
  }
  if (originCategory.value?.name) return originCategory.value.name;
  if (product.value?.category && typeof product.value.category === 'string' && product.value.category !== 'General') {
    return product.value.category;
  }
  return 'Catalog';
});

const categoryUrl = computed(() => {
  if (categoryBreadcrumbs.value.length > 0) {
    const lastBc = categoryBreadcrumbs.value[categoryBreadcrumbs.value.length - 1];
    if (lastBc?.url) return lastBc.url;
  }
  if (originCategory.value?.slug) {
    return `/product-category/${originCategory.value.slug}/`;
  }
  return '/products/';
});

// Normalized specifications for display
const normalizedSpecs = computed(() => {
  if (!product.value?.specifications) return [];
  const specs = product.value.specifications;
  
  if (Array.isArray(specs)) {
    return specs.map((item: any, idx: number) => ({
      key: item.key || item.name || item.label || `Specification ${idx + 1}`,
      value: String(item.value ?? item.val ?? '')
    }));
  }
  
  if (typeof specs === 'object' && specs !== null) {
    return Object.entries(specs).map(([key, val]) => ({
      key,
      value: typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)
    }));
  }
  
  return [];
});

// Similar Trending Products
const similarProducts = ref<Product[]>([]);
const isSimilarLoading = ref(false);

const loadSimilarProducts = async () => {
  if (!product.value) return;
  isSimilarLoading.value = true;
  try {
    let catFilter: string | number | undefined;

    // Use the last object in product.categories as the leaf category
    if (Array.isArray(product.value.categories) && product.value.categories.length > 0) {
      const lastCat = product.value.categories[product.value.categories.length - 1];
      if (lastCat && typeof lastCat === 'object') {
        catFilter = lastCat.id ?? lastCat.pk;
      } else if (typeof lastCat === 'number' || typeof lastCat === 'string') {
        catFilter = lastCat;
      }
    }

    // Preserve existing safe fallback if product.categories is empty or unavailable
    if (catFilter === undefined || catFilter === '') {
      catFilter = originCategory.value?.id || product.value.category;
    }

    const res = await productService.getProductsList({
      category: catFilter,
      page_size: 4
    });
    similarProducts.value = res.results
      .filter(p => String(p.id) !== String(product.value?.id) && p.slug !== product.value?.slug)
      .slice(0, 4);
  } catch {
    similarProducts.value = [];
  } finally {
    isSimilarLoading.value = false;
  }
};

watch(
  () => product.value?.id,
  () => {
    loadSimilarProducts();
  },
  { immediate: true }
);

// Actions
const addToCart = () => {
  if (!product.value) return;
  cartStore.addToCart(product.value, quantity.value);
  toastSuccess(`Added ${quantity.value} × "${product.value.name}" to cart.`);
  uiStore.isCartOpen = true;
};

const toggleWishlist = () => {
  isWishlisted.value = !isWishlisted.value;
  if (isWishlisted.value) {
    toastSuccess(`Added "${product.value?.name}" to wishlist.`);
  } else {
    toastSuccess(`Removed from wishlist.`);
  }
};

const isItemInCart = computed(() => {
  if (!product.value) return false;
  return cartStore.items.some(item => String(item.productId) === String(product.value?.id));
});

// Storefront Product Editing state & permission-checks
const authStore = useAuthStore();
const { hasPermission, canEditInModule } = useAdminPermissions();

const canEditProductFromStorefront = computed(() => {
  if (!authStore.isLoggedIn || !authStore.user) return false;
  
  const userRole = authStore.user.role;
  const isOwnerOrStaff = userRole === 'OWNER' || userRole === 'STAFF' || authStore.user.is_staff || authStore.user.is_superuser || authStore.user.is_superadmin;
  if (!isOwnerOrStaff) return false;
  
  return hasPermission('product_api.change_product') || canEditInModule('/admin/products');
});

// Edit Product Form State
const isEditModalOpen = ref(false);
const isModalSubmitting = ref(false);
const modalFormError = ref<string | null>(null);
const modalFieldErrors = ref<{
  name?: string;
  categories?: string;
  price?: string;
}>({});

const modalProductName = ref('');
const modalCurrentSellingPrice = ref<number | ''>('');
const modalSelectedCategoryIds = ref<number[]>([]);
const modalShortDescription = ref('');
const modalDescription = ref('');
const modalSpecifications = ref('');

const originalFormValues = ref<{
  name: string;
  categories: number[];
  current_selling_price: string | number;
  short_description: string;
  description: string;
  specifications: string;
} | null>(null);

// Modal Category Picker State
const isModalCategoryDropdownOpen = ref(false);
const modalCategoryDropdownRef = ref<HTMLElement | null>(null);
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

const toggleModalCategoryDropdown = () => {
  isModalCategoryDropdownOpen.value = !isModalCategoryDropdownOpen.value;
  if (isModalCategoryDropdownOpen.value && modalCategoryPagination.items.value.length === 0) {
    modalCategoryPagination.refresh();
  }
};

const closeModalCategoryDropdown = () => {
  isModalCategoryDropdownOpen.value = false;
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

const openEditModal = () => {
  if (!canEditProductFromStorefront.value) {
    toastError('You do not have permission to edit products.');
    return;
  }
  
  const entity = product.value;
  if (!entity) return;

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

  isEditModalOpen.value = true;
};

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

  if (!canEditProductFromStorefront.value) {
    modalFormError.value = 'You do not have permission to edit products.';
    return;
  }

  const targetProduct = product.value;
  const targetIdentifier = targetProduct?.id ?? targetProduct?.slug ?? slug.value;
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
    isEditModalOpen.value = false;
    isModalSubmitting.value = false;
    return;
  }

  try {
    await productService.updateProduct(String(targetIdentifier), payload);
    toastSuccess(`Product "${modalProductName.value.trim()}" updated successfully.`);
    isEditModalOpen.value = false;
    await refresh();
  } catch (err: any) {
    modalFormError.value = extractErrorMessage(err, 'Failed to update product. Please check your inputs and try again.');
    handleApiError(err, 'Failed to update product.');
  } finally {
    isModalSubmitting.value = false;
  }
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
      closeModalCategoryDropdown();
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
  <div class="pb-16 sm:pb-20">
    <!-- Breadcrumbs -->
    <div class="bg-muted/30 border-b">
      <div class="container mx-auto px-4 py-3 sm:py-4">
        <nav class="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-medium uppercase tracking-widest text-muted-foreground overflow-x-auto whitespace-nowrap custom-submenu-scrollbar" aria-label="Breadcrumb">
          <NuxtLink to="/" class="hover:text-primary transition-colors shrink-0 flex items-center" aria-label="Home">
            <Home class="w-3.5 h-3.5 shrink-0" />
          </NuxtLink>

          <template v-for="bc in categoryBreadcrumbs" :key="bc.url">
            <ChevronRight class="w-3 h-3 shrink-0" />
            <NuxtLink :to="bc.url" class="hover:text-primary transition-colors shrink-0">
              {{ bc.name }}
            </NuxtLink>
          </template>

          <ChevronRight class="w-3 h-3 shrink-0" />
          <span class="text-foreground font-semibold truncate max-w-[160px] sm:max-w-[260px] md:max-w-none">
            {{ product?.name || slug }}
          </span>
        </nav>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="container mx-auto px-4 mt-6 sm:mt-8 lg:mt-12">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16">
        <div class="space-y-4">
          <div class="aspect-square rounded-2xl sm:rounded-3xl bg-muted/40 animate-pulse border"></div>
          <div class="flex gap-3">
            <div v-for="i in 4" :key="i" class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-muted/40 animate-pulse border"></div>
          </div>
        </div>
        <div class="space-y-6">
          <div class="h-4 w-28 bg-muted/60 rounded animate-pulse"></div>
          <div class="h-8 sm:h-12 w-4/5 bg-muted/60 rounded animate-pulse"></div>
          <div class="h-20 w-full bg-muted/40 rounded animate-pulse"></div>
          <div class="h-32 w-full bg-muted/30 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    </div>

    <!-- Error / Not Found State -->
    <div v-else-if="error || !product" class="container mx-auto px-4 mt-12 sm:mt-16 text-center max-w-lg">
      <div class="p-8 sm:p-12 rounded-3xl bg-card border shadow-sm space-y-6">
        <div class="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle class="w-8 h-8" />
        </div>
        <div class="space-y-2">
          <h1 class="text-2xl font-bold font-display">Product Specification Unavailable</h1>
          <p class="text-sm text-muted-foreground leading-relaxed">
            The requested product identifier <span class="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{{ slug }}</span> could not be loaded from the catalog database.
          </p>
        </div>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <UiButton variant="outline" @click="refresh" class="w-full sm:w-auto gap-2">
            <RefreshCw class="w-4 h-4" /> Retry Query
          </UiButton>
          <UiButton to="/products/" class="w-full sm:w-auto gap-2">
            <ArrowLeft class="w-4 h-4" /> Browse Catalog
          </UiButton>
        </div>
      </div>
    </div>

    <!-- Product Loaded Content -->
    <div v-else class="container mx-auto px-4 mt-6 sm:mt-8 lg:mt-12">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16">
        <!-- Gallery / Image View -->
        <div class="space-y-4 sm:space-y-6">
          <div class="aspect-square rounded-2xl sm:rounded-3xl lg:rounded-[2rem] overflow-hidden bg-muted/40 border group relative flex items-center justify-center p-4">
            <img 
              v-if="selectedImage" 
              :src="selectedImage" 
              :alt="product.name" 
              class="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105" 
            />
            <div v-else class="w-full h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground/60 space-y-3">
              <Package class="w-16 h-16 stroke-1 text-muted-foreground/40" />
              <div class="space-y-1">
                <p class="font-bold text-sm text-foreground uppercase tracking-wider">{{ product.brand || 'Authentic Hardware' }}</p>
                <p class="text-xs text-muted-foreground">Standard Specification Unit</p>
              </div>
            </div>

            <!-- Badges -->
            <div class="absolute top-3 left-3 sm:top-6 sm:left-6 flex flex-col gap-2 sm:gap-3">
              <span v-if="product.isNew" class="bg-primary text-primary-foreground px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl">New Arrival</span>
              <span v-if="product.onSale || (product.originalPrice && product.originalPrice > product.price)" class="bg-destructive text-destructive-foreground px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl">Promotional Pricing</span>
              <span v-if="isItemInCart || product.in_cart" class="bg-emerald-600 text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl flex items-center gap-1">
                <Check class="w-3 h-3" /> In Cart
              </span>
            </div>

            <!-- Wishlist Action -->
            <button 
              @click="toggleWishlist"
              class="absolute top-3 right-3 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-background/80 backdrop-blur-md border flex items-center justify-center text-foreground hover:text-destructive hover:scale-110 transition-all cursor-pointer shadow-md"
              :aria-label="isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'"
            >
              <Heart :class="cn('w-5 h-5 transition-colors', isWishlisted ? 'fill-destructive text-destructive' : 'text-muted-foreground')" />
            </button>
          </div>
          
          <!-- Image Thumbnails (if multiple images exist) -->
          <div v-if="product.images && product.images.length > 1" class="flex gap-2 sm:gap-4 overflow-x-auto pb-2 custom-submenu-scrollbar">
            <button 
              v-for="(img, idx) in product.images" 
              :key="idx" 
              @click="selectedImage = img"
              :class="[
                'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 shrink-0 rounded-xl sm:rounded-2xl overflow-hidden border-2 transition-all p-1 bg-muted/20 cursor-pointer',
                selectedImage === img ? 'border-primary ring-2 ring-primary/20' : 'border-muted hover:border-primary/50'
              ]"
              :aria-label="`View product image ${idx + 1}`"
            >
              <img :src="img" :alt="`${product.name} thumbnail ${idx + 1}`" class="w-full h-full object-contain" />
            </button>
          </div>
        </div>

        <!-- Info & Actions -->
        <div class="space-y-6 sm:space-y-8 lg:space-y-10">
          <!-- Admin Edit Banner -->
          <div v-if="canEditProductFromStorefront" class="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between gap-4">
            <div class="flex items-center gap-2.5">
              <ShieldCheck class="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <h4 class="text-xs font-bold text-slate-950 dark:text-slate-50">Admin Workspace</h4>
                <p class="text-[10px] text-muted-foreground leading-snug">You have permission to modify this product catalog record.</p>
              </div>
            </div>
            <button 
              type="button"
              @click="openEditModal"
              class="h-9 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-amber-600/20 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Edit2 class="w-3.5 h-3.5" />
              <span>Edit Product</span>
            </button>
          </div>

          <div class="space-y-3 sm:space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span v-if="product.brand" class="text-xs sm:text-sm font-bold text-primary uppercase tracking-widest">
                {{ product.brand }}
              </span>
              <span v-else class="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-widest">
                {{ categoryName }}
              </span>

              <div v-if="product.rating" class="flex items-center gap-1.5 px-2.5 py-1 bg-muted/80 rounded-full">
                <Star class="w-3.5 h-3.5 text-yellow-500 fill-current shrink-0" />
                <span class="text-xs sm:text-sm font-bold">{{ product.rating }}</span>
                <span v-if="product.reviewCount" class="text-[11px] sm:text-xs text-muted-foreground">({{ product.reviewCount }} Reviews)</span>
              </div>
            </div>

            <h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold tracking-tight leading-tight break-words">
              {{ product.name }}
            </h1>

            <!-- Short Description -->
            <div v-if="product.short_description" class="prose prose-slate dark:prose-invert max-w-none text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed" v-html="product.short_description"></div>
            <div v-else-if="product.description" class="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed line-clamp-3" v-html="product.description"></div>
            
            <!-- Metadata & Attributes -->
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t">
              <div class="p-3 bg-muted/20 rounded-xl border border-border/50 space-y-1">
                <span class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Availability</span>
                <p class="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {{ product.stock > 0 ? `${product.stock} Units In Stock` : 'Available to Order' }}
                </p>
              </div>

              <div class="p-3 bg-muted/20 rounded-xl border border-border/50 space-y-1">
                <span class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Category</span>
                <NuxtLink :to="categoryUrl" class="text-xs font-semibold text-primary hover:underline block truncate">
                  {{ categoryName }}
                </NuxtLink>
              </div>

              <div class="p-3 bg-muted/20 rounded-xl border border-border/50 space-y-1 col-span-2 sm:col-span-1">
                <span class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Product Code</span>
                <p class="text-xs font-mono font-medium text-foreground truncate">
                  {{ product.sku || `ID-${product.id}` }}
                </p>
              </div>
            </div>

            <!-- Value Highlights Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-4 sm:pt-6 border-t mt-4 sm:mt-6">
              <div class="space-y-1.5 sm:space-y-2">
                <h4 class="text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-foreground">
                   <ShieldCheck class="w-4 h-4 text-primary shrink-0" /> Authentic Hardware
                </h4>
                <p class="text-xs text-muted-foreground leading-relaxed">Sourced through verified commercial distribution channels with full manufacturer technical compliance.</p>
              </div>
              <div class="space-y-1.5 sm:space-y-2">
                <h4 class="text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-foreground">
                   <Zap class="w-4 h-4 text-primary shrink-0" /> Enterprise Reliability
                </h4>
                <p class="text-xs text-muted-foreground leading-relaxed">Built for continuous operations, tested against standardized workloads to ensure stable thermal and power envelopes.</p>
              </div>
            </div>
          </div>

          <!-- Pricing & Actions -->
          <div class="p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl bg-muted/30 border border-muted space-y-5 sm:space-y-6 lg:space-y-8">
            <div class="flex flex-wrap items-baseline gap-2 sm:gap-4">
              <span class="text-3xl sm:text-4xl font-display font-extrabold text-foreground">
                {{ formatCurrency(product.current_selling_price || product.price) }}
              </span>
              <span v-if="product.originalPrice && product.originalPrice > (product.current_selling_price || product.price)" class="text-lg sm:text-xl text-muted-foreground line-through decoration-destructive/30">
                {{ formatCurrency(product.originalPrice) }}
              </span>
              <span v-if="product.originalPrice && product.originalPrice > (product.current_selling_price || product.price)" class="px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold rounded-md">
                SAVE {{ Math.round((1 - (product.current_selling_price || product.price) / product.originalPrice) * 100) }}%
              </span>
            </div>

            <!-- Price History Note if available -->
            <div v-if="product.price_histories && product.price_histories.length > 0" class="flex items-center gap-2 text-xs text-muted-foreground bg-background/60 p-2.5 rounded-lg border border-border/40">
              <Clock class="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Verified competitive price indexed against market benchmark records.</span>
            </div>

            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div class="flex items-center justify-between sm:justify-start gap-4 bg-background border h-12 sm:h-14 rounded-xl sm:rounded-2xl px-4 py-2 w-full sm:w-auto shrink-0">
                <button 
                  @click="quantity = Math.max(1, quantity - 1)" 
                  class="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer" 
                  aria-label="Decrease quantity"
                >
                  <Minus class="w-4 h-4" />
                </button>
                <span class="font-bold text-center min-w-[2rem] text-sm sm:text-base">{{ quantity }}</span>
                <button 
                  @click="quantity++" 
                  class="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer" 
                  aria-label="Increase quantity"
                >
                  <Plus class="w-4 h-4" />
                </button>
              </div>
              
              <UiButton 
                @click="addToCart" 
                class="h-12 sm:h-14 w-full sm:w-auto sm:flex-grow px-6 sm:px-10 gap-3 rounded-xl sm:rounded-2xl text-base sm:text-lg font-bold"
              >
                <ShoppingCart class="w-5 h-5" />
                {{ isItemInCart ? 'Add More to Cart' : 'Add to Cart' }}
              </UiButton>
            </div>

            <!-- Trust Badges -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4 border-t">
              <div v-for="(item, idx) in [
                { icon: Truck, text: 'Express Delivery' },
                { icon: ShieldCheck, text: 'Official Warranty' },
                { icon: RotateCcw, text: 'Return Policy' },
                { icon: Info, text: 'All Taxes Included' }
              ]" :key="idx" class="flex flex-col items-center text-center gap-1.5 p-1.5 rounded-xl">
                <component :is="item.icon" class="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" />
                <span class="text-[10px] sm:text-[11px] font-bold uppercase text-muted-foreground leading-tight">{{ item.text }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Split Layout: Similar Products Sidebar + Tabs Content -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 pt-10 sm:pt-14 lg:pt-20 border-t items-start mt-8 sm:mt-12 lg:mt-16">
        <!-- Sidebar: Similar Trending Products -->
        <aside class="lg:col-span-4 xl:col-span-3 space-y-6 sm:space-y-8 lg:sticky lg:top-28">
          <div class="space-y-1.5 sm:space-y-2">
            <h3 class="text-xl sm:text-2xl font-display font-bold">Similar <span class="text-primary italic">Hardware</span></h3>
            <p class="text-xs text-muted-foreground leading-relaxed">Frequently evaluated alongside this component for related deployments.</p>
          </div>
          
          <div v-if="similarProducts.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6">
            <CommerceProductCard 
              v-for="p in similarProducts" 
              :key="p.id" 
              :product="p" 
            />
          </div>
          <div v-else class="p-6 bg-muted/20 rounded-2xl border border-dashed text-center">
            <p class="text-xs text-muted-foreground">Browse our full hardware catalog for matching components.</p>
          </div>

          <UiButton variant="ghost" class="w-full rounded-full font-bold group h-11 text-xs sm:text-sm" :to="categoryUrl">
            View Category Products <ChevronRight class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </UiButton>
        </aside>

        <!-- Main: Details Tabs -->
        <main class="lg:col-span-8 xl:col-span-9">
          <!-- Tabs Navigation -->
          <div class="flex border-b overflow-x-auto custom-submenu-scrollbar">
            <button 
              v-for="tab in (['description', 'specification', 'reviews'] as const)" 
              :key="tab"
              @click="activeTab = tab"
              :class="cn(
                'px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-xs sm:text-sm font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all relative shrink-0 cursor-pointer',
                activeTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )"
            >
              {{ tab }}
              <div v-if="activeTab === tab" class="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-primary rounded-t-full"></div>
            </button>
          </div>

          <!-- Tab Content -->
          <div class="py-6 sm:py-8 lg:py-12 animate-in fade-in slide-in-from-left-4 duration-500">
            <!-- Description Tab -->
            <div v-if="activeTab === 'description'" class="space-y-8 sm:space-y-12">
              <div class="prose prose-slate dark:prose-invert max-w-none">
                <div v-if="product.description" v-html="product.description" class="text-base sm:text-lg text-muted-foreground leading-relaxed"></div>
                <p v-else class="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  Authentic hardware component engineered to rigorous enterprise standards with comprehensive manufacturer validation.
                </p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                <div class="bg-muted/30 p-5 sm:p-8 lg:p-10 rounded-2xl sm:rounded-[2.5rem] space-y-3 sm:space-y-4 border border-transparent hover:border-primary/20 transition-colors group">
                  <div class="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-xl sm:rounded-2xl flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-transform">
                     <Cpu class="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h4 class="text-lg sm:text-xl font-bold">Premium Engineering</h4>
                  <p class="text-xs sm:text-sm text-muted-foreground leading-relaxed">Engineered to official specifications, ensuring stable operation under continuous workloads.</p>
                </div>
                <div class="bg-muted/30 p-5 sm:p-8 lg:p-10 rounded-2xl sm:rounded-[2.5rem] space-y-3 sm:space-y-4 border border-transparent hover:border-primary/20 transition-colors group">
                  <div class="w-10 h-10 sm:w-12 sm:h-12 bg-black dark:bg-slate-800 rounded-xl sm:rounded-2xl flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-transform">
                     <Zap class="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h4 class="text-lg sm:text-xl font-bold">Efficiency Focus</h4>
                  <p class="text-xs sm:text-sm text-muted-foreground leading-relaxed">Optimized for power-to-performance efficiency and thermal stability across diverse system architectures.</p>
                </div>
              </div>
            </div>

            <!-- Specification Tab -->
            <div v-if="activeTab === 'specification'" class="space-y-6 sm:space-y-10">
              <!-- Render HTML specifications if string -->
              <div v-if="typeof product.specifications === 'string' && product.specifications.trim()" class="prose prose-slate dark:prose-invert max-w-none">
                <div v-html="product.specifications" class="text-base text-muted-foreground bg-card border rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-8 overflow-x-auto"></div>
              </div>

              <!-- Fallback to normalized specs if it's an array/object -->
              <div v-else-if="normalizedSpecs.length > 0" class="bg-card border rounded-2xl sm:rounded-[2.5rem] overflow-hidden">
                <div class="grid grid-cols-1">
                  <div 
                    v-for="(spec, idx) in normalizedSpecs" 
                    :key="spec.key" 
                    :class="cn(
                      'flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 px-4 sm:px-8 lg:px-10 gap-1 sm:gap-4 transition-colors hover:bg-muted/30',
                      idx !== normalizedSpecs.length - 1 && 'border-b border-muted'
                    )"
                  >
                    <span class="text-muted-foreground font-bold uppercase tracking-widest text-[10px] sm:text-xs shrink-0">{{ spec.key }}</span>
                    <span class="font-bold text-sm sm:text-base lg:text-lg text-foreground sm:text-right break-words">{{ spec.value }}</span>
                  </div>
                </div>
              </div>

              <!-- Empty Specs State -->
              <div v-else class="p-8 sm:p-12 text-center bg-card border rounded-2xl sm:rounded-[2.5rem] space-y-3">
                <Layers class="w-10 h-10 mx-auto text-muted-foreground/50" />
                <p class="text-sm font-semibold text-foreground">Detailed technical specifications will be posted shortly.</p>
                <p class="text-xs text-muted-foreground">Contact technical support for specific electrical or dimensional parameters.</p>
              </div>
              
              <div class="flex items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-6 lg:p-8 bg-primary/5 rounded-2xl sm:rounded-3xl border border-primary/10">
                 <Info class="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0 mt-0.5 sm:mt-0" />
                 <p class="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">Specifications are manufacturer certified. Actual system performance may vary with integration topology and environmental parameters.</p>
              </div>
            </div>

            <!-- Reviews Tab -->
            <div v-if="activeTab === 'reviews'" class="space-y-6 sm:space-y-12">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 bg-muted/20 p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border">
                <div class="space-y-1 sm:space-y-2">
                  <h4 class="text-xl sm:text-2xl md:text-3xl font-display font-bold">Customer Feedback</h4>
                  <div class="flex flex-wrap items-center gap-2">
                    <div class="flex">
                      <Star v-for="s in 5" :key="s" class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500 fill-current" />
                    </div>
                    <span class="text-xs sm:text-sm font-bold">
                      {{ product.rating ? `${product.rating} Rating` : 'Verified Product' }}
                      {{ product.reviewCount ? `Based on ${product.reviewCount} Reviews` : '' }}
                    </span>
                  </div>
                </div>
                <UiButton variant="outline" class="rounded-full font-bold px-6 sm:px-8 h-10 sm:h-12 border-primary/20 text-primary hover:bg-primary/5 text-xs sm:text-sm w-full sm:w-auto shrink-0">Submit Review</UiButton>
              </div>

              <div class="space-y-4 sm:space-y-6">
                <div class="p-5 sm:p-8 bg-card border rounded-2xl sm:rounded-[2.5rem] space-y-4 sm:space-y-6 hover:shadow-xl hover:shadow-primary/5 transition-all">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="flex items-center gap-3 sm:gap-4">
                      <div class="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-muted flex items-center justify-center font-bold text-base sm:text-xl text-primary shrink-0">BC</div>
                      <div class="space-y-0.5 sm:space-y-1">
                        <p class="font-bold text-base sm:text-lg">Verified Customer</p>
                        <p class="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-[0.15em] sm:tracking-[0.2em]">Authentic Purchase & Deployment</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-1">
                      <Star v-for="s in 5" :key="s" class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500 fill-current" />
                    </div>
                  </div>
                  <p class="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed italic border-l-2 sm:border-l-4 border-primary/20 pl-4 sm:pl-6">
                    "Authentic product in original retail packaging with valid warranty. Delivered on time and performing exactly as specified."
                  </p>
                  <div class="flex items-center gap-4 text-xs font-bold text-muted-foreground pt-2">
                    <span>Helpful?</span>
                    <button class="hover:text-primary transition-colors cursor-pointer">Yes (8)</button>
                    <button class="hover:text-primary transition-colors cursor-pointer">No (0)</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>

    <!-- Edit Product Modal -->
    <UiAdminModal
      :is-open="isEditModalOpen"
      title="Edit Product"
      subtitle="Update product specifications, category classifications, descriptions, and pricing."
      max-width="max-w-3xl"
      @close="isEditModalOpen = false"
    >
      <form @submit.prevent="handleModalProductSubmit" class="flex flex-col">
        <!-- Scrollable Modal Body -->
        <div class="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          <!-- Error Banner -->
          <div v-if="modalFormError" class="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2.5 text-xs font-medium text-destructive">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{{ modalFormError }}</span>
          </div>

          <!-- Product Name -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Product Name <span class="text-destructive">*</span></span>
              <span v-if="modalFieldErrors.name" class="text-destructive font-normal normal-case text-xs">{{ modalFieldErrors.name }}</span>
            </label>
            <input
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

          <!-- Categories Selector -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Categories <span class="text-destructive">*</span></span>
              <span v-if="modalFieldErrors.categories" class="text-destructive font-normal normal-case text-xs">{{ modalFieldErrors.categories }}</span>
            </label>

            <!-- Selected Category Pills / Chips -->
            <div v-if="modalSelectedCategoryIds.length > 0" class="flex flex-wrap gap-1.5 mb-2">
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
            <div ref="modalCategoryDropdownRef" class="relative">
              <button
                type="button"
                @click.stop="toggleModalCategoryDropdown"
                :class="cn(
                  'w-full h-11 px-3.5 bg-background border rounded-xl text-left text-sm font-medium transition-all flex items-center justify-between gap-2 cursor-pointer focus:ring-2',
                  modalFieldErrors.categories ? 'border-destructive focus:ring-destructive/20' : 'border-input focus:ring-ring/20',
                  modalSelectedCategoryIds.length === 0 ? 'text-muted-foreground' : 'text-foreground'
                )"
                :disabled="isModalSubmitting"
                aria-haspopup="listbox"
                :aria-expanded="isModalCategoryDropdownOpen"
              >
                <div class="flex items-center gap-2 truncate">
                  <Layers class="w-4 h-4 text-muted-foreground shrink-0" />
                  <span class="truncate">
                    {{ modalSelectedCategoryIds.length === 0 ? 'Select one or more categories...' : `${modalSelectedCategoryIds.length} categories selected` }}
                  </span>
                </div>
                <ChevronDown :class="cn('w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0', isModalCategoryDropdownOpen && 'rotate-180')" />
              </button>

              <!-- Category Dropdown Popover -->
              <div 
                v-if="isModalCategoryDropdownOpen"
                @click.stop
                class="absolute left-0 top-full z-50 mt-1.5 w-full bg-card border border-border rounded-xl shadow-xl p-2.5 text-xs font-medium animate-in fade-in zoom-in-95 duration-150"
              >
                <!-- Category Search Input -->
                <div class="relative mb-2">
                  <Search class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
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

          <!-- Current Selling Price -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Current Selling Price <span class="text-destructive">*</span></span>
              <span v-if="modalFieldErrors.price" class="text-destructive font-normal normal-case text-xs">{{ modalFieldErrors.price }}</span>
            </label>
            <div class="relative">
              <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm pointer-events-none">
                $
              </div>
              <input
                v-model.number="modalCurrentSellingPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                :class="cn(
                  'w-full h-11 pl-8 pr-3.5 bg-background border rounded-xl outline-none text-sm font-medium text-foreground placeholder:text-muted-foreground transition-all focus:ring-2 font-mono',
                  modalFieldErrors.price ? 'border-destructive focus:ring-destructive/20' : 'border-input focus:ring-ring/20'
                )"
                :disabled="isModalSubmitting"
              />
            </div>
            <p class="text-[11px] text-muted-foreground">Standard retail unit price for transactions in USD.</p>
          </div>

          <!-- Rich-Text HTML Fields in Edit Mode -->
          <!-- Short Description -->
          <div class="space-y-1.5 pt-2 border-t border-border/60">
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
          <div class="space-y-1.5 pt-2 border-t border-border/60">
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
          <div class="space-y-1.5 pt-2 border-t border-border/60">
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

        <!-- Modal Footer Controls -->
        <div class="px-6 py-4 border-t border-border flex items-center justify-end gap-3 bg-muted/20">
          <button 
            type="button"
            @click="isEditModalOpen = false"
            class="h-10 px-5 border border-input bg-background hover:bg-muted text-foreground rounded-xl text-xs font-semibold flex items-center transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isModalSubmitting"
            class="h-10 px-6 bg-primary text-primary-foreground rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs hover:opacity-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="isModalSubmitting" class="w-4 h-4 animate-spin" />
            <Save v-else class="w-4 h-4" />
            <span>{{ isModalSubmitting ? 'Saving Changes...' : 'Save Changes' }}</span>
          </button>
        </div>
      </form>
    </UiAdminModal>
  </div>
</template>
