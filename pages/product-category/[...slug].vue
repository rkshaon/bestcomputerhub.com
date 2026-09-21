<!-- File: /pages/product-category/[...slug].vue -->
<script setup lang="ts">
import { decodeHtmlEntities } from '@/utils';
import { ref, computed, reactive, onMounted, watch, nextTick } from 'vue';
import { SlidersHorizontal, Grid, List, Search, ChevronRight, Home, ArrowLeft, Menu, Loader2, Edit2, Save } from 'lucide-vue-next';
import { useRoute } from 'vue-router';
import { refDebounced } from '@vueuse/core';
import { useProductService } from '@/composables/useProductService';
import { useCategoryService } from '@/composables/useCategoryService';
import { useBrandService } from '@/composables/useBrandService';
import { useAuthStore } from '@/stores/auth';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useToast } from '@/composables/useToast';
import { cn } from '@/utils';
import type { Category, Product, Brand } from '@/types';
import UiPagination from '@/components/ui/UiPagination.vue';
import CommerceProductCard from '@/components/commerce/ProductCard.vue';
import UiBreadcrumbs from '@/components/ui/UiBreadcrumbs.vue';
import UiRichTextEditor from '@/components/ui/UiRichTextEditor.vue';

const route = useRoute();
const productService = useProductService();
const categoryService = useCategoryService();
const brandService = useBrandService();
const authStore = useAuthStore();
const { hasPermission, canEditInModule } = useAdminPermissions();
const { toastSuccess, handleApiError } = useToast();

const isOwnerOrStaff = computed(() => {
  if (!authStore.isLoggedIn || !authStore.user) return false;
  const roleUpper = (authStore.user.role || '').toString().trim().toUpperCase();
  if (roleUpper === 'OWNER' || roleUpper === 'STAFF') return true;
  if (Boolean(authStore.user.is_staff || authStore.user.is_superuser || authStore.user.is_superadmin)) return true;
  return false;
});

const canEditCategoryFromStorefront = computed(() => {
  if (!isOwnerOrStaff.value) return false;
  return (
    hasPermission(['store.change_category', 'change_category', 'categories.change_category', 'category_api.change_category']) ||
    canEditInModule('categories') ||
    canEditInModule('/admin/categories')
  );
});

// Inline editing state
const editingField = ref<'name' | 'short_description_title' | 'short_description' | 'description' | null>(null);
const isFieldSaving = ref<'name' | 'short_description_title' | 'short_description' | 'description' | null>(null);

const editNameValue = ref('');
const editShortDescTitleValue = ref('');
const editShortDescValue = ref('');
const editDescValue = ref('');

const nameInputRef = ref<HTMLInputElement | null>(null);
const shortDescTitleInputRef = ref<HTMLInputElement | null>(null);
const shortDescInputRef = ref<HTMLTextAreaElement | null>(null);

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

const startEditing = (field: 'name' | 'short_description_title' | 'short_description' | 'description') => {
  if (!canEditCategoryFromStorefront.value) return;
  
  editingField.value = field;
  
  if (field === 'name') {
    editNameValue.value = activeCategory.value?.name || '';
    nextTick(() => {
      nameInputRef.value?.focus();
    });
  } else if (field === 'short_description_title') {
    editShortDescTitleValue.value = activeCategory.value?.short_description_title || '';
    nextTick(() => {
      shortDescTitleInputRef.value?.focus();
    });
  } else if (field === 'short_description') {
    editShortDescValue.value = activeCategory.value?.short_description || '';
    nextTick(() => {
      shortDescInputRef.value?.focus();
    });
  } else if (field === 'description') {
    editDescValue.value = activeCategory.value?.description || '';
  }
};

const cancelEditing = () => {
  editingField.value = null;
  isFieldSaving.value = null;
};

const saveField = async (field: 'name' | 'short_description_title' | 'short_description' | 'description') => {
  if (isFieldSaving.value === field) return; // Prevent duplicate submissions
  
  const targetCategory = activeCategory.value;
  if (!targetCategory) return;
  
  const targetIdentifier = targetCategory.id;
  if (!targetIdentifier) return;

  let hasChanged = false;
  const payload: any = {};

  if (field === 'name') {
    const newVal = editNameValue.value.trim();
    const oldVal = (targetCategory.name || '').trim();
    if (newVal && newVal !== oldVal) {
      payload.name = newVal;
      hasChanged = true;
    }
  } else if (field === 'short_description_title') {
    const newVal = editShortDescTitleValue.value.trim();
    const oldVal = (targetCategory.short_description_title || '').trim();
    if (newVal !== oldVal) {
      payload.short_description_title = newVal;
      hasChanged = true;
    }
  } else if (field === 'short_description') {
    const newVal = editShortDescValue.value.trim();
    const oldVal = (targetCategory.short_description || '').trim();
    if (newVal !== oldVal) {
      payload.short_description = newVal;
      hasChanged = true;
    }
  } else if (field === 'description') {
    const newVal = editDescValue.value;
    const oldVal = targetCategory.description || '';
    if (!isHtmlEquivalent(newVal, oldVal)) {
      payload.description = newVal;
      hasChanged = true;
    }
  }

  if (!hasChanged) {
    editingField.value = null;
    return;
  }

  isFieldSaving.value = field;

  try {
    const updated = await categoryService.updateCategory(String(targetIdentifier), payload);
    toastSuccess('Category updated successfully.');
    
    if (activeCategory.value) {
      if (field === 'name') {
        activeCategory.value.name = updated.name;
      } else if (field === 'short_description_title') {
        activeCategory.value.short_description_title = updated.short_description_title;
      } else if (field === 'short_description') {
        activeCategory.value.short_description = updated.short_description;
      } else if (field === 'description') {
        activeCategory.value.description = updated.description;
      }
    }
    
    // Update in allCategoriesList if present
    const idx = allCategoriesList.value.findIndex(c => c.id === targetIdentifier);
    if (idx !== -1) {
      const catToUpdate = allCategoriesList.value[idx];
      if (catToUpdate) {
        if (field === 'name') {
          catToUpdate.name = updated.name;
        } else if (field === 'short_description_title') {
          catToUpdate.short_description_title = updated.short_description_title;
        } else if (field === 'short_description') {
          catToUpdate.short_description = updated.short_description;
        } else if (field === 'description') {
          catToUpdate.description = updated.description;
        }
      }
    }

    editingField.value = null;
  } catch (err: any) {
    handleApiError(err, 'Failed to update category.');
  } finally {
    isFieldSaving.value = null;
  }
};

const handleFocusOut = (event: FocusEvent, field: 'description') => {
  const container = event.currentTarget as HTMLElement | null;
  const relatedTarget = event.relatedTarget as HTMLElement | null;
  
  if (container && relatedTarget && container.contains(relatedTarget)) {
    return;
  }
  
  saveField(field);
};

const canRemoveFromMenu = computed(() => {
  if (!isOwnerOrStaff.value) return false;
  if (!hasPermission(['category_api.remove_category_from_menu', 'remove_category_from_menu', 'category_api.change_category', 'change_category'])) return false;
  const isCurrentlyMenu = activeCategory.value?.show_in_menu === true || activeCategory.value?.is_menu === true;
  return isCurrentlyMenu;
});

const isRemovingFromMenu = ref(false);

const handleRemoveFromMenu = async () => {
  if (!activeCategory.value?.slug || isRemovingFromMenu.value || !canRemoveFromMenu.value) return;

  isRemovingFromMenu.value = true;
  const targetCat = activeCategory.value;
  try {
    const updatedCategory = await categoryService.removeFromMenu(targetCat.slug);
    toastSuccess(`Category [${targetCat.name}] removed from menu.`);

    if (activeCategory.value) {
      activeCategory.value = {
        ...activeCategory.value,
        ...updatedCategory,
        show_in_menu: false,
        is_menu: false
      };
    }

    const idx = allCategoriesList.value.findIndex(c => c.id === targetCat.id || c.slug === targetCat.slug);
    if (idx !== -1) {
      allCategoriesList.value[idx] = {
        ...allCategoriesList.value[idx],
        ...updatedCategory,
        show_in_menu: false,
        is_menu: false
      };
    }
  } catch (err: any) {
    handleApiError(err, 'Failed to remove category from menu.');
  } finally {
    isRemovingFromMenu.value = false;
  }
};

const slugs = computed(() => {
  const s = route.params.slug;
  if (!s) return [];
  const raw = Array.isArray(s) ? s : [s];
  return raw.map(segment => (typeof segment === 'string' ? segment.trim() : '')).filter(Boolean);
});

const categorySlug = computed(() => {
  const arr = slugs.value;
  return arr.length ? arr[arr.length - 1] : '';
});

const allCategoriesList = ref<Category[]>([]);
const isPageLoading = ref(true);

const loadAllCategories = async () => {
  isPageLoading.value = true;
  try {
    const listResponse = await categoryService.getCategoriesList({ page_size: 200 });
    if (listResponse && listResponse.results && listResponse.results.length) {
      allCategoriesList.value = listResponse.results;
    } else {
      allCategoriesList.value = productService.getCategories();
    }
  } catch {
    allCategoriesList.value = productService.getCategories();
  } finally {
    isPageLoading.value = false;
    await resolveCategory();
  }
};

const activeCategory = ref<Category | null>(null);

const pageTitle = computed(() => {
  if (activeCategory.value?.name) {
    return decodeHtmlEntities(activeCategory.value.name);
  }
  return categorySlug.value ? categorySlug.value.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Products';
});

const pageDescription = computed(() => {
  if (activeCategory.value?.description) {
    return activeCategory.value.description;
  }
  return `Explore top quality ${pageTitle.value} at Best Computer Hub in Bangladesh. Authentic products with reliable warranty and fast shipping.`;
});

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  ogTitle: pageTitle,
  ogDescription: pageDescription
});

const resolveCategory = async () => {
  // Prevent category resolution when navigating to other routes (e.g. product details)
  if (!route.path.startsWith('/product-category/')) {
    return;
  }
  const targetSlug = categorySlug.value ? categorySlug.value.toLowerCase() : '';
  if (!targetSlug) {
    activeCategory.value = null;
    return;
  }

  // Recursive search helper to find category by slug in a hierarchy tree
  const findCategoryBySlug = (categories: Category[], slug: string): Category | null => {
    for (const cat of categories) {
      if (cat.slug?.toLowerCase() === slug.toLowerCase()) {
        return cat;
      }
      if (cat.children && cat.children.length > 0) {
        const found = findCategoryBySlug(cat.children, slug);
        if (found) return found;
      }
    }
    return null;
  };

  // 1. Instantly check for match in allCategoriesList (from menu's data/hierarchy list)
  let match = findCategoryBySlug(allCategoriesList.value, targetSlug);
  
  // 2. Fall back to static mock categories if not found in list
  if (!match) {
    match = findCategoryBySlug(productService.getCategories(), targetSlug);
  }

  // Set local match immediately so user gets an instant layout & visual response
  if (match) {
    activeCategory.value = { ...match };
  }

  // 3. Regardless of finding local match, call the Category Details API to load full rich content/description & ID
  try {
    const detail = await categoryService.getCategoryDetails(targetSlug);
    if (detail) {
      if (activeCategory.value) {
        // Merge rich details (like full description/guide) onto the basic category object
        activeCategory.value = { ...activeCategory.value, ...detail };
      } else {
        activeCategory.value = detail;
      }
      return;
    }
  } catch (e) {
    console.error('Failed to load category details via details API:', e);
  }

  // 4. If still not matched at all, try query search by slug
  if (!activeCategory.value && allCategoriesList.value.length > 0) {
    try {
      const searchRes = await categoryService.getCategoriesList({ search: targetSlug, page_size: 10 });
      if (searchRes && searchRes.results && searchRes.results.length) {
        const exactMatch = findCategoryBySlug(searchRes.results, targetSlug);
        if (exactMatch) {
          activeCategory.value = exactMatch;
          if (!allCategoriesList.value.some(c => c.id === exactMatch.id)) {
            allCategoriesList.value.push(exactMatch);
          }
        }
      }
    } catch (e) {
      console.error('Failed to resolve category via search:', e);
    }
  }
};

const category = computed(() => activeCategory.value);

onMounted(() => {
  loadAllCategories();
});

watch(() => route.params.slug, async () => {
  await resolveCategory();
}, { immediate: true, deep: true });

// Target category identifier for category path API
const targetCategoryIdentifier = computed(() => {
  if (category.value?.id) {
    return { id: category.value.id, slug: category.value.slug || categorySlug.value };
  }
  if (categorySlug.value) {
    return categorySlug.value;
  }
  return null;
});

// Category path hierarchy fetched via Category Path API: GET /api/v1/categories/path/
const { data: categoryPath } = await useAsyncData(
  `category-page-path-${slugs.value.join('-') || 'root'}`,
  async () => {
    const target = targetCategoryIdentifier.value;
    if (!target) return [];
    try {
      return await categoryService.getCategoryPath(target);
    } catch (e) {
      console.warn('Failed to load category path for category page:', e);
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

// Breadcrumbs trail
const breadcrumbs = computed<BreadcrumbItem[]>(() => {
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
  } else if (category.value?.name) {
    items.push({
      name: category.value.name,
      url: `/product-category/${category.value.slug || categorySlug.value}/`
    });
  }

  return items;
});

const filters = reactive({
  brand: '' as string | number,
  minPrice: 0,
  maxPrice: 10000,
  sort: 'newest'
});

const minPriceLimit = ref(0);
const maxPriceLimit = ref(10000);
const isResolvingCategory = ref(false);

const isPriceSliderDisabled = computed(() => {
  return minPriceLimit.value >= maxPriceLimit.value || (minPriceLimit.value === 0 && maxPriceLimit.value === 0);
});

const searchQuery = ref('');
const debouncedSearchQuery = refDebounced(searchQuery, 300);

const categoryBrands = ref<Brand[]>([]);
const isBrandsLoading = ref(false);

const subcategories = ref<Category[]>([]);
const isSubcategoriesLoading = ref(false);
const selectedSubcategoryId = ref<string | number | null>(null);

const fetchSubcategories = async () => {
  if (!category.value?.id) {
    subcategories.value = [];
    return;
  }
  isSubcategoriesLoading.value = true;
  try {
    const children = await categoryService.getCategoryChildrenBatch([category.value.id]);
    subcategories.value = Array.isArray(children) ? children : [];
  } catch (err: any) {
    console.warn('Failed to load category children for quick filters:', err?.message || err);
    subcategories.value = [];
  } finally {
    isSubcategoriesLoading.value = false;
  }
};

const currentPathSlugs = computed(() => {
  if (Array.isArray(categoryPath.value) && categoryPath.value.length > 0) {
    return categoryPath.value.map(c => c.slug).filter(Boolean);
  }
  return slugs.value;
});

const getSubcategoryUrl = (subcat: Category): string => {
  let baseSlugs: string[] = [];
  if (currentPathSlugs.value.length > 0) {
    baseSlugs = [...currentPathSlugs.value];
  } else if (category.value?.slug) {
    baseSlugs = [category.value.slug];
  }

  const cleanSubcatSlug = (subcat.slug || '').replace(/^\/+|\/+$/g, '');
  const finalSlugs = baseSlugs[baseSlugs.length - 1] === cleanSubcatSlug 
    ? baseSlugs 
    : [...baseSlugs, cleanSubcatSlug];

  return `/product-category/${finalSlugs.filter(Boolean).join('/')}/`;
};

const isSubcategoryActive = (subcat: Category): boolean => {
  if (selectedSubcategoryId.value !== null && String(selectedSubcategoryId.value) === String(subcat.id)) {
    return true;
  }
  if (categorySlug.value && (String(categorySlug.value) === String(subcat.slug) || String(category.value?.id) === String(subcat.id))) {
    return true;
  }
  return false;
};

const handleSubcategoryClick = (subcat: Category) => {
  selectedSubcategoryId.value = subcat.id;
};

const fetchCategoryBrands = async () => {
  if (!category.value?.id) {
    categoryBrands.value = [];
    return;
  }
  isBrandsLoading.value = true;
  try {
    const brandsList = await brandService.getBrandsByCategory(category.value.id);
    categoryBrands.value = Array.isArray(brandsList) ? brandsList : [];
  } catch {
    categoryBrands.value = [];
  } finally {
    isBrandsLoading.value = false;
  }
};

const fetchCategoryPriceRange = async () => {
  if (!category.value?.id) {
    minPriceLimit.value = 0;
    maxPriceLimit.value = 10000;
    filters.minPrice = 0;
    filters.maxPrice = 10000;
    return;
  }
  try {
    const range = await categoryService.getCategoryPriceRange(category.value.id || category.value.slug);
    if (range && (range.min_price !== null || range.max_price !== null)) {
      minPriceLimit.value = range.min_price !== null ? Math.floor(Number(range.min_price)) : 0;
      maxPriceLimit.value = range.max_price !== null ? Math.ceil(Number(range.max_price)) : 0;
      
      filters.minPrice = minPriceLimit.value;
      filters.maxPrice = maxPriceLimit.value;
    } else {
      minPriceLimit.value = 0;
      maxPriceLimit.value = 0;
      filters.minPrice = 0;
      filters.maxPrice = 0;
    }
  } catch (e) {
    console.error('Failed to load category price range:', e);
    minPriceLimit.value = 0;
    maxPriceLimit.value = 0;
    filters.minPrice = 0;
    filters.maxPrice = 0;
  }
};

const viewMode = ref<'grid' | 'list'>('grid');
const loadedProducts = ref<Product[]>([]);
const isProductsLoading = ref(false);
const currentPage = ref(1);
const totalPages = ref(1);
const totalCount = ref(0);
const pageSize = ref(12);

const fetchProducts = async () => {
  if (!category.value) {
    loadedProducts.value = [];
    totalCount.value = 0;
    totalPages.value = 1;
    return;
  }
  isProductsLoading.value = true;
  try {
    const res = await productService.getProductsList({
      categories: category.value.id,
      query: debouncedSearchQuery.value || undefined,
      minPrice: (!isPriceSliderDisabled.value && filters.minPrice > minPriceLimit.value) ? filters.minPrice : undefined,
      maxPrice: (!isPriceSliderDisabled.value && filters.maxPrice < maxPriceLimit.value) ? filters.maxPrice : undefined,
      brands: filters.brand !== '' ? filters.brand : undefined,
      sort: filters.sort,
      page: currentPage.value,
      page_size: pageSize.value
    });
    loadedProducts.value = res.results;
    totalCount.value = res.count;
    totalPages.value = res.pages;
  } catch {
    // Fallback sync query
    const fallbackProducts = productService.getProducts({
      category: category.value.id || category.value.slug,
      query: debouncedSearchQuery.value,
      minPrice: (!isPriceSliderDisabled.value && filters.minPrice > minPriceLimit.value) ? filters.minPrice : undefined,
      maxPrice: (!isPriceSliderDisabled.value && filters.maxPrice < maxPriceLimit.value) ? filters.maxPrice : undefined,
      brands: filters.brand !== '' ? filters.brand : undefined,
      sort: filters.sort
    });
    loadedProducts.value = fallbackProducts;
    totalCount.value = fallbackProducts.length;
    totalPages.value = Math.ceil(fallbackProducts.length / pageSize.value) || 1;
  } finally {
    isProductsLoading.value = false;
  }
};

watch(category, async (newCat, oldCat) => {
  currentPage.value = 1;
  // If category changed, reset brand filter, selected subcategory, and price range
  if (!oldCat || !newCat || oldCat.id !== newCat.id) {
    isResolvingCategory.value = true;
    filters.brand = '';
    selectedSubcategoryId.value = null;
    
    await Promise.all([
      fetchSubcategories(),
      fetchCategoryBrands(),
      fetchCategoryPriceRange()
    ]);
    
    isResolvingCategory.value = false;
  }
  fetchProducts();
}, { deep: true, immediate: true });

watch(
  [debouncedSearchQuery, () => filters.brand, () => filters.minPrice, () => filters.maxPrice, () => filters.sort],
  () => {
    if (isResolvingCategory.value) return;
    currentPage.value = 1;
    fetchProducts();
  }
);

const handlePageChange = (newPage: number) => {
  if (newPage < 1 || newPage > totalPages.value || newPage === currentPage.value) return;
  currentPage.value = newPage;
  fetchProducts();
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }
};

const products = computed(() => loadedProducts.value);

// Reset filters helper
const resetFilters = () => {
  filters.brand = '';
  filters.minPrice = minPriceLimit.value;
  filters.maxPrice = maxPriceLimit.value;
  filters.sort = 'newest';
  searchQuery.value = '';
};
</script>

<template>
  <div class="min-h-screen pb-24 bg-background">
    <!-- Breadcrumbs & Category Header -->
    <div class="bg-card border-b pt-3 sm:pt-4 pb-3.5 sm:pb-4 transition-all duration-300">
      <div class="container mx-auto px-4">
        <!-- Breadcrumbs Navigation -->
        <UiBreadcrumbs class="mb-2 sm:mb-2.5" :items="breadcrumbs" />

        <!-- Category Title & Info -->
        <div class="w-full space-y-2 sm:space-y-2.5">
          <!-- Category Short Description Title Heading / Editor & Actions -->
          <div v-if="category?.short_description_title || canEditCategoryFromStorefront || canRemoveFromMenu" class="relative group/edit flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
            <div class="min-w-0 flex-1">
              <template v-if="editingField === 'short_description_title'">
                <div class="flex items-center gap-2">
                  <input 
                    v-model="editShortDescTitleValue"
                    ref="shortDescTitleInputRef"
                    type="text"
                    placeholder="Add a short description title"
                    @blur="saveField('short_description_title')"
                    @keydown.enter="saveField('short_description_title')"
                    @keydown.esc="cancelEditing"
                    :disabled="isFieldSaving === 'short_description_title'"
                    class="text-2xl text-[24px] font-display font-black tracking-tight text-foreground transition-all bg-background border border-input rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none w-full animate-none"
                  />
                  <div v-if="isFieldSaving === 'short_description_title'" class="shrink-0">
                    <Loader2 class="w-5 h-5 animate-spin text-primary" />
                  </div>
                </div>
              </template>
              <template v-else>
                <h1 class="text-2xl text-[24px] font-display font-black tracking-tight text-foreground transition-all flex items-center gap-2.5">
                  <span v-if="category?.short_description_title">{{ decodeHtmlEntities(category.short_description_title) }}</span>
                  <span 
                    v-else 
                    :class="[
                      'text-muted-foreground/60 italic font-medium text-2xl text-[24px] select-none',
                      canEditCategoryFromStorefront ? 'cursor-pointer hover:text-muted-foreground/80' : ''
                    ]"
                    @click="canEditCategoryFromStorefront && startEditing('short_description_title')"
                  >Add a short description title</span>
                  <button 
                    v-if="canEditCategoryFromStorefront" 
                    @click="startEditing('short_description_title')"
                    class="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
                    title="Edit Short Description Title"
                    aria-label="Edit Short Description Title"
                  >
                    <Edit2 class="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </h1>
              </template>
            </div>

            <!-- Remove from Menu Action for Authorized Owner/Staff -->
            <div v-if="canRemoveFromMenu" class="shrink-0 flex items-center">
              <button
                type="button"
                @click="handleRemoveFromMenu"
                :disabled="isRemovingFromMenu"
                class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none shadow-sm whitespace-nowrap"
                title="Remove from Menu"
                aria-label="Remove from Menu"
              >
                <Loader2 v-if="isRemovingFromMenu" class="w-4 h-4 animate-spin shrink-0" />
                <Menu v-else class="w-4 h-4 shrink-0" />
                <span>Remove from Menu</span>
              </button>
            </div>
          </div>

          <!-- Short Description / Inline Editor -->
          <div v-if="editingField === 'short_description'" class="w-full">
            <div class="flex items-center gap-2 w-full">
              <textarea 
                v-model="editShortDescValue"
                ref="shortDescInputRef"
                rows="2"
                @blur="saveField('short_description')"
                @keydown.enter.exact.prevent="saveField('short_description')"
                @keydown.esc="cancelEditing"
                :disabled="isFieldSaving === 'short_description'"
                placeholder="Enter short description..."
                class="w-full flex-1 min-w-0 text-sm text-[14px] bg-background border border-input rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-foreground leading-relaxed resize-none"
              ></textarea>
              <div v-if="isFieldSaving === 'short_description'" class="shrink-0">
                <Loader2 class="w-4 h-4 animate-spin text-primary" />
              </div>
            </div>
          </div>
          <div v-else-if="category?.short_description?.trim()" class="w-full flex items-start gap-2">
            <p class="w-full flex-1 min-w-0 text-muted-foreground text-sm text-[14px] leading-relaxed break-words">
              {{ category.short_description }}
            </p>
            <button 
              v-if="canEditCategoryFromStorefront" 
              @click="startEditing('short_description')"
              class="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer mt-0.5"
              title="Edit Short Description"
              aria-label="Edit Short Description"
            >
              <Edit2 class="w-3.5 h-3.5" />
            </button>
          </div>
          <button 
            v-else-if="canEditCategoryFromStorefront"
            type="button"
            @click="startEditing('short_description')"
            class="inline-flex items-center gap-2 text-sm text-[14px] text-muted-foreground/80 hover:text-foreground italic cursor-pointer transition-colors group/edit-empty text-left"
            title="Edit Short Description"
            aria-label="Edit the short description to display"
          >
            <Edit2 class="w-3.5 h-3.5 text-muted-foreground group-hover/edit-empty:text-foreground transition-colors shrink-0" />
            <span>Edit the short description to display</span>
          </button>
        </div>

        <!-- Immediate Subcategory Quick Filter Row -->
        <div v-if="isSubcategoriesLoading || subcategories.length > 0" class="mt-3 pt-2.5 border-t border-border/40">
          <!-- Wrapping Subcategories Container -->
          <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <!-- Loading Skeletons -->
            <template v-if="isSubcategoriesLoading">
              <div v-for="i in 5" :key="i" class="h-5 sm:h-6 w-16 sm:w-20 bg-muted/60 rounded-full animate-pulse"></div>
            </template>

            <!-- Dynamic Subcategory Chips -->
            <template v-else>
              <NuxtLink
                v-for="subcat in subcategories"
                :key="subcat.id || subcat.slug"
                :to="getSubcategoryUrl(subcat)"
                @click="handleSubcategoryClick(subcat)"
                :class="[
                  'inline-flex items-center justify-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-medium transition-all duration-200 cursor-pointer border select-none max-w-full text-center break-words',
                  isSubcategoryActive(subcat)
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs scale-[1.02]'
                    : 'bg-transparent hover:bg-background text-muted-foreground hover:text-foreground border-border/80 hover:border-border'
                ]"
              >
                {{ decodeHtmlEntities(subcat.name) }}
              </NuxtLink>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Section -->
    <div class="container mx-auto px-4 pt-5 sm:pt-6 pb-12 sm:pb-16">
      <div class="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
        <!-- Sidebar Filters -->
        <aside class="w-full lg:w-64 xl:w-72 shrink-0 space-y-8">
          <div class="flex items-center justify-between border-b pb-4">
            <h3 class="font-bold text-base flex items-center gap-2">
              <SlidersHorizontal class="w-4.5 h-4.5 text-primary" />
              Advanced Filters
            </h3>
            <button 
              @click="resetFilters" 
              class="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline transition-all"
            >
              Reset All
            </button>
          </div>

          <!-- Search in this Category -->
          <div class="space-y-3">
            <h4 class="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Search Category</h4>
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                v-model="searchQuery"
                type="text" 
                placeholder="Search collection..." 
                class="w-full h-11 bg-muted/60 border rounded-xl pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium border-border/85"
              />
            </div>
          </div>

          <!-- Price Threshold -->
          <div class="space-y-3">
            <h4 class="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Price Threshold</h4>
            <div class="space-y-4">
              <input 
                type="range" 
                v-model="filters.maxPrice" 
                :min="minPriceLimit" 
                :max="maxPriceLimit" 
                :disabled="isPriceSliderDisabled"
                step="100" 
                class="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary disabled:opacity-50 disabled:cursor-not-allowed" 
              />
              <div class="flex items-center justify-between text-xs font-bold">
                <span class="bg-muted px-2.5 py-1 rounded-md">Tk {{ minPriceLimit }}</span>
                <span v-if="!isPriceSliderDisabled" class="text-primary bg-primary/10 px-3 py-1 rounded-md">Up to Tk {{ filters.maxPrice }}</span>
                <span v-else class="text-muted-foreground bg-muted px-3 py-1 rounded-md">No priced items</span>
              </div>
            </div>
          </div>

          <!-- Brands Selection -->
          <div class="space-y-3">
            <h4 class="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Brands</h4>
            
            <!-- Loading State -->
            <div v-if="isBrandsLoading" class="space-y-2 py-1">
              <div v-for="i in 4" :key="i" class="flex items-center gap-3 animate-pulse">
                <div class="w-4 h-4 rounded-full bg-muted"></div>
                <div class="h-3.5 bg-muted rounded w-24"></div>
              </div>
            </div>

            <!-- Dynamic Brands List -->
            <div v-else-if="categoryBrands.length > 0" class="space-y-2">
              <label 
                v-for="brand in categoryBrands" 
                :key="brand.id || brand.slug || brand.name" 
                class="flex items-center gap-3 cursor-pointer group/label"
              >
                <input 
                  type="radio" 
                  name="brand_filter" 
                  :value="brand.id" 
                  v-model="filters.brand"
                  class="w-4 h-4 rounded-full border-muted text-primary focus:ring-primary" 
                />
                <span class="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover/label:text-foreground transition-colors">
                  {{ brand.name }}
                </span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer group/label">
                <input 
                  type="radio" 
                  name="brand_filter" 
                  value="" 
                  v-model="filters.brand"
                  class="w-4 h-4 rounded-full border-muted text-primary focus:ring-primary" 
                />
                <span class="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover/label:text-foreground transition-colors">
                  All Brands
                </span>
              </label>
            </div>

            <!-- Empty State -->
            <div v-else class="text-xs text-muted-foreground italic py-1">
              No brand filters for this category.
            </div>
          </div>
        </aside>

        <!-- Product Grid Area -->
        <div class="flex-1 min-w-0 w-full space-y-8">
          <!-- Toolbar -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b">
            <span class="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Displaying <span class="text-foreground font-extrabold">{{ totalCount }}</span> optimal results
            </span>
            
            <div class="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
              <div class="flex items-center border rounded-lg overflow-hidden">
                <button 
                  @click="viewMode = 'grid'"
                  :class="cn('p-2.5 transition-all shrink-0', viewMode === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted')" 
                  title="Grid view" 
                  aria-label="Grid view"
                >
                  <Grid class="w-4 h-4" />
                </button>
                <button 
                  @click="viewMode = 'list'"
                  :class="cn('p-2.5 transition-all shrink-0', viewMode === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted')" 
                  title="List view" 
                  aria-label="List view"
                >
                  <List class="w-4 h-4" />
                </button>
              </div>
              <select 
                v-model="filters.sort"
                class="h-11 bg-background border border-border/85 rounded-xl px-4 text-xs font-bold uppercase tracking-wider outline-none cursor-pointer focus:ring-2 focus:ring-primary/20 shrink-0"
              >
                <option value="newest">Latest Arrivals</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="rating">Top Performance</option>
              </select>
            </div>
          </div>

          <!-- Grid of Products / Skeletons -->
          <div 
            v-if="isProductsLoading" 
            :class="cn(
              'grid gap-6',
              viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5' : 'grid-cols-1'
            )"
          >
            <div v-for="i in 10" :key="i" class="bg-card rounded-2xl border p-6 space-y-4 animate-pulse">
              <div class="aspect-video bg-muted rounded-xl w-full"></div>
              <div class="space-y-2">
                <div class="h-4 bg-muted rounded w-1/3"></div>
                <div class="h-6 bg-muted rounded w-3/4"></div>
              </div>
              <div class="flex items-center justify-between pt-4">
                <div class="h-6 bg-muted rounded w-1/4"></div>
                <div class="h-8 bg-muted rounded-full w-1/4"></div>
              </div>
            </div>
          </div>

          <div v-else-if="products.length > 0" class="space-y-12">
            <div 
              :class="cn(
                'grid gap-6',
                viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5' : 'grid-cols-1'
              )"
            >
              <CommerceProductCard 
                v-for="product in products" 
                :key="product.id" 
                :product="product" 
              />
            </div>

            <!-- Modern Paginated Controls -->
            <div v-if="totalPages > 1" class="flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-8">
              <span class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Page <span class="text-foreground font-black">{{ currentPage }}</span> of <span class="text-foreground font-black">{{ totalPages }}</span>
              </span>
              <div class="flex items-center gap-3">
                <UiButton 
                  variant="outline" 
                  size="sm" 
                  :disabled="currentPage === 1" 
                  @click="handlePageChange(currentPage - 1)"
                  class="rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  Previous
                </UiButton>
                <UiButton 
                  variant="outline" 
                  size="sm" 
                  :disabled="currentPage === totalPages" 
                  @click="handlePageChange(currentPage + 1)"
                  class="rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  Next
                </UiButton>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="py-24 flex flex-col items-center justify-center text-center space-y-6 bg-card border border-dashed rounded-2xl p-12 max-w-2xl mx-auto">
            <div class="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Search class="w-6 h-6 text-muted-foreground animate-pulse" />
            </div>
            <div class="space-y-2">
              <h3 class="text-xl font-bold tracking-tight text-foreground">No matches found</h3>
              <p class="text-muted-foreground max-w-sm text-sm">
                Try loosening your limits or searching a different term inside this category workspace.
              </p>
            </div>
            <UiButton variant="outline" @click="resetFilters">Clear All Filters</UiButton>
          </div>
        </div>
      </div>

      <!-- Bottom Rich Category Details Section -->
      <div 
        v-if="canEditCategoryFromStorefront || (category?.description && (category.description.includes('<') || category.description.length > 200))" 
        class="mt-16 bg-card border border-border/80 rounded-[2rem] p-8 md:p-12 space-y-6 shadow-sm"
      >
        <div class="flex items-center justify-between border-b pb-4">
          <h2 class="text-2xl font-display font-black tracking-tight text-foreground">
            Detailed Guide to {{ category?.name || 'this Category' }}
          </h2>
          
          <div v-if="canEditCategoryFromStorefront" class="shrink-0">
            <button 
              v-if="editingField !== 'description'"
              @click="startEditing('description')"
              class="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Edit Description"
            >
              <Edit2 class="w-3.5 h-3.5" />
              <span>Edit Description</span>
            </button>
            <div v-else-if="isFieldSaving === 'description'" class="flex items-center gap-1.5 text-xs text-amber-500 font-bold uppercase tracking-wider">
              <Loader2 class="w-3.5 h-3.5 animate-spin" /> Saving...
            </div>
          </div>
        </div>

        <div v-if="editingField === 'description'">
          <div @focusout="handleFocusOut($event, 'description')" class="w-full">
            <UiRichTextEditor 
              v-model="editDescValue"
              min-height="min-h-[220px]"
              :disabled="isFieldSaving === 'description'"
              placeholder="Enter category detailed description..."
            />
          </div>
        </div>
        <div v-else>
          <div 
            v-if="category?.description"
            class="prose prose-slate dark:prose-invert max-w-none"
            v-html="category.description"
          />
          <p v-else class="text-sm text-muted-foreground italic">
            No detailed description available. Click "Edit Description" to add one.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.prose h2 {
  @apply text-xl font-bold text-foreground mt-8 mb-4;
}
.prose h3 {
  @apply text-lg font-bold text-foreground mt-6 mb-3;
}
.prose h4 {
  @apply text-base font-bold text-foreground mt-4 mb-2;
}
.prose p {
  @apply mb-4 text-muted-foreground leading-relaxed text-sm;
}
.prose ul {
  @apply list-disc pl-6 mb-6 space-y-2;
}
.prose li {
  @apply text-muted-foreground text-sm leading-relaxed;
}
.prose a {
  @apply text-primary hover:underline transition-all;
}
</style>
