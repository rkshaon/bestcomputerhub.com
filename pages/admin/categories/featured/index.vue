<!-- File: /pages/admin/categories/featured/index.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { 
  Sparkles, 
  RefreshCw, 
  Search, 
  Eye, 
  Edit2, 
  Trash2, 
  FolderOpen, 
  Layers, 
  ArrowLeft, 
  Check, 
  X, 
  Upload, 
  AlertCircle, 
  Loader2, 
  LayoutGrid, 
  List, 
  ExternalLink, 
  Image as ImageIcon, 
  ChevronRight, 
  Plus,
  Info,
  GripVertical,
  Save,
  ArrowUp,
  ArrowDown,
  RotateCcw
} from 'lucide-vue-next';
import { useCategoryService } from '@/composables/useCategoryService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useAdminModalState } from '@/composables/useAdminModalState';
import UiAdminModal from '@/components/ui/UiAdminModal.vue';
import UiSearchInput from '@/components/ui/UiSearchInput.vue';
import UiTable, { type UiTableColumn } from '@/components/ui/UiTable.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiButton from '@/components/ui/Button.vue';
import { cn, decodeHtmlEntities } from '@/utils';
import { validateFeaturedCategoryIcon } from '@/utils/imageValidation';
import { refDebounced } from '@vueuse/core';
import type { FeaturedCategory, Category } from '@/types';
import { toastSuccess, toastError, toastInfo, extractErrorMessage } from '@/composables/useToast';

definePageMeta({
  layout: false
});

const categoryService = useCategoryService();
const { canEditInModule, hasPermission } = useAdminPermissions();

const route = useRoute();
const router = useRouter();

// State vectors
const featuredCategories = ref<FeaturedCategory[]>([]);
const initialCategoryIds = ref<Array<string | number>>([]);
const isLoading = ref(false);
const isSavingOrder = ref(false);
const errorMsg = ref<string | null>(null);
const searchQuery = ref('');
const debouncedSearchQuery = refDebounced(searchQuery, 300);
const viewMode = ref<'list' | 'grid'>('list');
const processingUnfeatureId = ref<string | number | null>(null);

// Drag & drop state
const draggedCategoryId = ref<string | number | null>(null);
const dragOverCategoryId = ref<string | number | null>(null);

// Permissions
const canUnfeature = computed(() => {
  return hasPermission('category_api.remove_category_from_featured') || canEditInModule('/admin/categories');
});

const canEditCategory = computed(() => {
  return canEditInModule('/admin/categories');
});

// Evaluate if local order differs from initial saved backend order
const currentCategoryIds = computed(() => featuredCategories.value.map(c => c.id));

const hasUnsavedOrderChanges = computed(() => {
  if (initialCategoryIds.value.length === 0 || currentCategoryIds.value.length !== initialCategoryIds.value.length) {
    return false;
  }
  return currentCategoryIds.value.some((id, index) => String(id) !== String(initialCategoryIds.value[index]));
});

// Table columns definition
const columns: UiTableColumn<FeaturedCategory>[] = [
  { key: 'reorder', label: 'Order', width: '100px', align: 'center' },
  { key: 'featured_icon', label: 'Icon', width: '80px', align: 'center' },
  { key: 'name', label: 'Category Name & Slug', sortable: true },
  { key: 'featured_display_order', label: 'Position', width: '100px', align: 'center' },
  { key: 'status', label: 'Status', width: '120px', align: 'center' },
  { key: 'actions', label: 'Actions', width: '140px', align: 'right' }
];

// Fetch featured categories from GET /api/v1/categories/featured/
const fetchFeaturedCategories = async () => {
  isLoading.value = true;
  errorMsg.value = null;
  try {
    const list = await categoryService.getFeaturedCategories();
    const categoriesList = Array.isArray(list) ? list : [];
    featuredCategories.value = categoriesList;
    initialCategoryIds.value = categoriesList.map(c => c.id);
  } catch (err: any) {
    errorMsg.value = extractErrorMessage(err, 'Failed to retrieve featured categories.');
    toastError(errorMsg.value);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchFeaturedCategories();
});

// Client-side search filtering
const filteredFeaturedCategories = computed(() => {
  if (!debouncedSearchQuery.value.trim()) {
    return featuredCategories.value;
  }
  const q = debouncedSearchQuery.value.toLowerCase().trim();
  return featuredCategories.value.filter(cat => {
    return (
      (cat.name || '').toLowerCase().includes(q) ||
      (cat.slug || '').toLowerCase().includes(q) ||
      (cat.description || '').toLowerCase().includes(q)
    );
  });
});

// HTML5 Drag and Drop Event Handlers
const handleDragStart = (event: DragEvent, cat: FeaturedCategory) => {
  draggedCategoryId.value = cat.id;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(cat.id));
  }
};

const handleDragOver = (event: DragEvent, targetCat: FeaturedCategory) => {
  event.preventDefault();
  if (draggedCategoryId.value !== null && String(draggedCategoryId.value) !== String(targetCat.id)) {
    dragOverCategoryId.value = targetCat.id;
  }
};

const handleDragLeave = (event: DragEvent, targetCat: FeaturedCategory) => {
  if (String(dragOverCategoryId.value) === String(targetCat.id)) {
    dragOverCategoryId.value = null;
  }
};

const handleDrop = (event: DragEvent, targetCat: FeaturedCategory) => {
  event.preventDefault();
  if (draggedCategoryId.value === null || String(draggedCategoryId.value) === String(targetCat.id)) {
    draggedCategoryId.value = null;
    dragOverCategoryId.value = null;
    return;
  }

  const srcIndex = featuredCategories.value.findIndex(c => String(c.id) === String(draggedCategoryId.value));
  const tgtIndex = featuredCategories.value.findIndex(c => String(c.id) === String(targetCat.id));

  if (srcIndex !== -1 && tgtIndex !== -1) {
    const list = [...featuredCategories.value];
    const [moved] = list.splice(srcIndex, 1);
    if (moved) {
      list.splice(tgtIndex, 0, moved);

      // Update local featured_display_order numbers sequentially
      list.forEach((item, index) => {
        item.featured_display_order = index + 1;
      });

      featuredCategories.value = list;
    }
  }

  draggedCategoryId.value = null;
  dragOverCategoryId.value = null;
};

const handleDragEnd = () => {
  draggedCategoryId.value = null;
  dragOverCategoryId.value = null;
};

// Keyboard & Button-based Reordering
const moveCategoryUp = (index: number) => {
  if (index <= 0 || index >= featuredCategories.value.length) return;
  const list = [...featuredCategories.value];
  const [moved] = list.splice(index, 1);
  if (moved) {
    list.splice(index - 1, 0, moved);
    list.forEach((item, idx) => {
      item.featured_display_order = idx + 1;
    });
    featuredCategories.value = list;
  }
};

const moveCategoryDown = (index: number) => {
  if (index < 0 || index >= featuredCategories.value.length - 1) return;
  const list = [...featuredCategories.value];
  const [moved] = list.splice(index, 1);
  if (moved) {
    list.splice(index + 1, 0, moved);
    list.forEach((item, idx) => {
      item.featured_display_order = idx + 1;
    });
    featuredCategories.value = list;
  }
};

// Reset local order to initial
const handleResetOrder = () => {
  if (!initialCategoryIds.value.length) return;
  const map = new Map(featuredCategories.value.map(c => [String(c.id), c]));
  const restored: FeaturedCategory[] = [];
  
  initialCategoryIds.value.forEach((id, idx) => {
    const cat = map.get(String(id));
    if (cat) {
      cat.featured_display_order = idx + 1;
      restored.push(cat);
    }
  });

  featuredCategories.value.forEach(cat => {
    if (!initialCategoryIds.value.map(String).includes(String(cat.id))) {
      restored.push(cat);
    }
  });

  featuredCategories.value = restored;
  toastInfo('Featured category order reset to initial state.');
};

// Save Order API call
const handleSaveOrder = async () => {
  if (!hasUnsavedOrderChanges.value || isSavingOrder.value) return;

  isSavingOrder.value = true;
  const payloadIds = featuredCategories.value.map(c => c.id);

  try {
    const response = await categoryService.reorderFeaturedCategories(payloadIds);
    toastSuccess('Featured category order saved successfully.');

    initialCategoryIds.value = [...payloadIds];

    if (Array.isArray(response) && response.length > 0) {
      featuredCategories.value = response;
    } else {
      await fetchFeaturedCategories();
    }
  } catch (err: any) {
    toastError(extractErrorMessage(err, 'Failed to save featured category order.'));
  } finally {
    isSavingOrder.value = false;
  }
};

// Unsaved changes navigation guard
onBeforeRouteLeave((to, from, next) => {
  if (hasUnsavedOrderChanges.value) {
    const confirmLeave = window.confirm('You have unsaved featured category order changes. Are you sure you want to leave without saving?');
    if (!confirmLeave) {
      next(false);
      return;
    }
  }
  next();
});

// Row attrs & class for UiTable
const getRowAttrs = (item: FeaturedCategory) => {
  return {
    draggable: true,
    onDragstart: (e: DragEvent) => handleDragStart(e, item),
    onDragover: (e: DragEvent) => handleDragOver(e, item),
    onDragleave: (e: DragEvent) => handleDragLeave(e, item),
    onDrop: (e: DragEvent) => handleDrop(e, item),
    onDragend: handleDragEnd
  };
};

const getRowClass = (item: FeaturedCategory) => {
  const isDragged = String(draggedCategoryId.value) === String(item.id);
  const isDragOver = String(dragOverCategoryId.value) === String(item.id);
  return cn(
    'transition-all duration-150',
    isDragged && 'opacity-40 bg-amber-500/10 border-2 border-dashed border-amber-500 ring-2 ring-amber-500/20',
    isDragOver && 'border-t-2 border-t-amber-500 bg-amber-500/15 ring-2 ring-amber-500/30'
  );
};

// Modals State
const isViewModalOpen = ref(false);
const viewCategoryData = ref<FeaturedCategory | null>(null);

const triggerViewModal = (cat: FeaturedCategory) => {
  viewCategoryData.value = cat;
  isViewModalOpen.value = true;
};

// Edit Modal State
const isEditModalOpen = ref(false);
const editCategoryData = ref<FeaturedCategory | null>(null);
const editForm = ref({
  name: '',
  slug: '',
  description: '',
  short_description_title: '',
  short_description: ''
});
const editFormError = ref<string | null>(null);
const isEditSubmitting = ref(false);
const selectedIconFile = ref<File | null>(null);
const iconPreviewUrl = ref<string | null>(null);

const triggerEditModal = (cat: FeaturedCategory) => {
  editCategoryData.value = cat;
  editForm.value = {
    name: cat.name || '',
    slug: cat.slug || '',
    description: cat.description || '',
    short_description_title: cat.short_description_title || '',
    short_description: cat.short_description || ''
  };
  editFormError.value = null;
  selectedIconFile.value = null;
  iconPreviewUrl.value = cat.featured_icon || null;
  isEditModalOpen.value = true;
};

const handleIconFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files || !target.files[0]) return;
  const file = target.files[0];
  const validation = await validateFeaturedCategoryIcon(file);
  if (!validation.valid) {
    editFormError.value = validation.error || 'Invalid icon file.';
    return;
  }
  editFormError.value = null;
  selectedIconFile.value = file;
  if (iconPreviewUrl.value && iconPreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(iconPreviewUrl.value);
  }
  iconPreviewUrl.value = URL.createObjectURL(file);
};

const handleSaveEditCategory = async () => {
  if (!editCategoryData.value) return;
  if (!editForm.value.name.trim()) {
    editFormError.value = 'Category name is required.';
    return;
  }
  if (!editForm.value.slug.trim()) {
    editFormError.value = 'Category slug is required.';
    return;
  }

  isEditSubmitting.value = true;
  editFormError.value = null;

  try {
    const catId = String(editCategoryData.value.id);
    await categoryService.updateCategory(catId, {
      name: editForm.value.name,
      slug: editForm.value.slug,
      description: editForm.value.description,
      short_description_title: editForm.value.short_description_title,
      short_description: editForm.value.short_description
    });

    if (selectedIconFile.value) {
      await categoryService.uploadFeaturedCategoryIcon(catId, selectedIconFile.value);
    }

    toastSuccess(`Category "${editForm.value.name}" updated successfully.`);
    isEditModalOpen.value = false;
    await fetchFeaturedCategories();
  } catch (err: any) {
    editFormError.value = extractErrorMessage(err, 'Failed to update category.');
  } finally {
    isEditSubmitting.value = false;
  }
};

// Unfeature Modal State
const isUnfeatureModalOpen = ref(false);
const categoryToUnfeature = ref<FeaturedCategory | null>(null);

const triggerUnfeatureModal = (cat: FeaturedCategory) => {
  categoryToUnfeature.value = cat;
  isUnfeatureModalOpen.value = true;
};

const executeUnfeatureCategory = async () => {
  if (!categoryToUnfeature.value) return;
  const cat = categoryToUnfeature.value;
  processingUnfeatureId.value = cat.id;

  try {
    await categoryService.unfeatureCategory(cat.id);
    toastSuccess(`Category "${cat.name}" has been removed from featured categories.`);
    isUnfeatureModalOpen.value = false;
    categoryToUnfeature.value = null;
    await fetchFeaturedCategories();
  } catch (err: any) {
    toastError(extractErrorMessage(err, 'Failed to remove category from featured.'));
  } finally {
    processingUnfeatureId.value = null;
  }
};
</script>

<template>
  <NuxtLayout name="admin">
    <template #header-title>
      <div class="flex items-center gap-2">
        <NuxtLink to="/admin/categories/" class="text-muted-foreground hover:text-foreground transition-colors">
          Categories
        </NuxtLink>
        <span class="text-muted-foreground/40 font-light select-none">/</span>
        <h1 class="text-xl font-display font-extrabold tracking-tight text-foreground flex items-center gap-2">
          <span>Featured Categories</span>
          <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {{ featuredCategories.length }}
          </span>
        </h1>
      </div>
    </template>

    <template #header-actions>
      <div class="flex flex-wrap items-center gap-2">
        <UiButton
          v-if="hasUnsavedOrderChanges"
          variant="outline"
          class="rounded-xl h-9 px-3.5 gap-1.5 border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-xs cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/30"
          @click="handleResetOrder"
          :disabled="isSavingOrder"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          <span>Discard</span>
        </UiButton>

        <UiButton
          class="rounded-xl h-9 px-4 gap-1.5 font-bold text-xs cursor-pointer bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600 shadow-xs"
          @click="handleSaveOrder"
          :disabled="!hasUnsavedOrderChanges || isSavingOrder"
        >
          <Loader2 v-if="isSavingOrder" class="w-3.5 h-3.5 animate-spin" />
          <Save v-else class="w-3.5 h-3.5" />
          <span>Save Order</span>
        </UiButton>

        <NuxtLink to="/admin/categories/">
          <UiButton 
            variant="outline" 
            class="rounded-xl h-9 px-3.5 gap-1.5 border-border font-bold text-xs cursor-pointer"
          >
            <ArrowLeft class="w-3.5 h-3.5" />
            <span>All Categories</span>
          </UiButton>
        </NuxtLink>

        <UiButton 
          variant="outline" 
          class="rounded-xl h-9 px-3.5 gap-1.5 border-border font-bold text-xs cursor-pointer"
          @click="fetchFeaturedCategories"
          :disabled="isLoading || isSavingOrder"
        >
          <RefreshCw :class="['w-3.5 h-3.5', isLoading && 'animate-spin']" />
          <span>Refresh</span>
        </UiButton>
      </div>
    </template>

    <div class="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      <!-- Unsaved Order Changes Alert Banner -->
      <div 
        v-if="hasUnsavedOrderChanges" 
        class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300"
      >
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
            <Sparkles class="w-4 h-4 text-amber-600 dark:text-amber-400 fill-amber-500" />
          </div>
          <div>
            <p class="text-xs font-bold">Unsaved Category Order</p>
            <p class="text-[11px] opacity-80">You have rearranged featured categories. Save your changes to apply the new order to the storefront.</p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <UiButton 
            variant="outline" 
            size="sm"
            class="rounded-xl h-8 px-3 text-xs font-bold border-amber-500/30 hover:bg-amber-500/20 cursor-pointer"
            @click="handleResetOrder"
            :disabled="isSavingOrder"
          >
            <RotateCcw class="w-3.5 h-3.5 mr-1" />
            <span>Discard</span>
          </UiButton>
          <UiButton 
            size="sm"
            class="rounded-xl h-8 px-4 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600 gap-1.5 cursor-pointer shadow-xs"
            @click="handleSaveOrder"
            :disabled="isSavingOrder"
          >
            <Loader2 v-if="isSavingOrder" class="w-3.5 h-3.5 animate-spin" />
            <Save v-else class="w-3.5 h-3.5" />
            <span>Save Order</span>
          </UiButton>
        </div>
      </div>

      <!-- Stats / Information Banner -->
      <UiCard class="p-4 border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-transparent">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-xs">
              <Sparkles class="w-5 h-5 fill-amber-500/20 text-amber-500" />
            </div>
            <div>
              <h2 class="text-sm font-bold text-foreground">Featured Storefront Categories</h2>
              <p class="text-xs text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">
                Featured categories are highlighted on homepage banners and storefront navigation sections. Drag items using the handle or use the arrow controls to reorder.
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <NuxtLink to="/admin/categories/">
              <UiButton
                size="sm"
                variant="outline"
                class="rounded-xl h-8 px-3 text-xs font-bold gap-1.5 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>Feature More Categories</span>
              </UiButton>
            </NuxtLink>
          </div>
        </div>
      </UiCard>

      <!-- Search & View Toggle Bar -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border px-3.5 py-2.5 rounded-xl shadow-xs">
        <UiSearchInput 
          v-model="searchQuery" 
          placeholder="Search featured categories by name, slug or description..." 
          class="w-full sm:w-80"
        />

        <div class="flex items-center gap-2 self-end sm:self-auto">
          <!-- View Mode Switcher -->
          <div class="flex items-center bg-muted/60 p-1 rounded-lg border border-border/80">
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
          </div>
        </div>
      </div>

      <!-- Error State Banner -->
      <div v-if="errorMsg && !isLoading" class="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ errorMsg }}</span>
        </div>
        <UiButton size="sm" variant="outline" class="h-8 px-3 text-xs font-bold border-destructive/30 hover:bg-destructive/10" @click="fetchFeaturedCategories">
          Retry
        </UiButton>
      </div>

      <!-- Table List View -->
      <div v-if="viewMode === 'list'" class="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <UiTable
          :columns="columns"
          :data="filteredFeaturedCategories"
          :loading="isLoading"
          :row-attrs="getRowAttrs"
          :row-class="getRowClass"
          key-field="id"
          empty-text="No Featured Categories Found"
          empty-description="There are currently no featured categories. You can feature categories from the main Categories list."
        >
          <!-- Drag & Keyboard Reorder Cell -->
          <template #cell-reorder="{ item, index }">
            <div class="flex items-center justify-center gap-1.5" @click.stop>
              <div 
                class="p-1 text-muted-foreground/60 hover:text-amber-500 cursor-grab active:cursor-grabbing rounded transition-colors"
                title="Drag row to reorder"
                aria-label="Drag row to reorder"
              >
                <GripVertical class="w-4 h-4" />
              </div>
              <div class="flex flex-col gap-0.5">
                <button 
                  type="button"
                  @click.stop="moveCategoryUp(index)"
                  :disabled="index === 0"
                  class="p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                  title="Move Up"
                  aria-label="Move Up"
                >
                  <ArrowUp class="w-3 h-3" />
                </button>
                <button 
                  type="button"
                  @click.stop="moveCategoryDown(index)"
                  :disabled="index === filteredFeaturedCategories.length - 1"
                  class="p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                  title="Move Down"
                  aria-label="Move Down"
                >
                  <ArrowDown class="w-3 h-3" />
                </button>
              </div>
            </div>
          </template>

          <!-- Featured Icon Cell -->
          <template #cell-featured_icon="{ item }">
            <div class="flex items-center justify-center">
              <div class="w-10 h-10 rounded-xl bg-muted/60 border border-border flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                <img 
                  v-if="item.featured_icon" 
                  :src="item.featured_icon" 
                  :alt="item.name" 
                  class="w-full h-full object-cover" 
                />
                <span v-else-if="item.icon" class="text-base">{{ item.icon }}</span>
                <Sparkles v-else class="w-4 h-4 text-amber-500/60" />
              </div>
            </div>
          </template>

          <!-- Name & Slug Cell -->
          <template #cell-name="{ item }">
            <div class="min-w-0 py-0.5">
              <div class="flex items-center gap-2">
                <span class="font-bold text-foreground text-xs leading-tight hover:text-primary transition-colors cursor-pointer" @click="triggerViewModal(item)">
                  {{ decodeHtmlEntities(item.name) }}
                </span>
              </div>
              <p class="text-[10px] text-muted-foreground font-mono tracking-wider mt-0.5 truncate">
                /product-category/{{ item.slug }}/
              </p>
            </div>
          </template>

          <!-- Featured Order Cell -->
          <template #cell-featured_display_order="{ item }">
            <div class="text-center font-mono font-bold text-xs text-foreground bg-muted/40 py-1 px-2.5 rounded-lg border border-border/50 inline-block">
              #{{ item.featured_display_order ?? item.display_order ?? '—' }}
            </div>
          </template>

          <!-- Status Cell -->
          <template #cell-status="{ item }">
            <div class="flex justify-center">
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Sparkles class="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>Featured</span>
              </span>
            </div>
          </template>

          <!-- Actions Cell -->
          <template #cell-actions="{ item }">
            <div class="flex items-center justify-end gap-1">
              <button 
                type="button"
                @click="triggerViewModal(item)" 
                class="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-all cursor-pointer"
                title="View Category Details"
                aria-label="View Category Details"
              >
                <Eye class="w-4 h-4" />
              </button>

              <button 
                v-if="canEditCategory"
                type="button"
                @click="triggerEditModal(item)" 
                class="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-all cursor-pointer"
                title="Edit Category"
                aria-label="Edit Category"
              >
                <Edit2 class="w-4 h-4" />
              </button>

              <button 
                v-if="canUnfeature"
                type="button"
                @click="triggerUnfeatureModal(item)" 
                :disabled="processingUnfeatureId === item.id"
                class="p-1.5 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-all cursor-pointer disabled:opacity-40"
                title="Remove from Featured Categories"
                aria-label="Remove from Featured Categories"
              >
                <Loader2 v-if="processingUnfeatureId === item.id" class="w-4 h-4 animate-spin text-primary" />
                <Sparkles v-else class="w-4 h-4 fill-amber-500 text-amber-500" />
              </button>
            </div>
          </template>

          <!-- Custom Empty State with CTA -->
          <template #empty>
            <div class="flex flex-col items-center justify-center text-center py-12 px-4">
              <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 border border-amber-500/20">
                <Sparkles class="w-6 h-6 stroke-[1.5]" />
              </div>
              <h3 class="text-sm font-bold text-foreground">No Featured Categories Found</h3>
              <p class="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
                There are currently no featured categories. You can feature categories from the main Categories list.
              </p>
              <div class="mt-4">
                <NuxtLink to="/admin/categories/">
                  <UiButton class="rounded-xl h-9 px-4 text-xs font-bold gap-2">
                    <Plus class="w-3.5 h-3.5" />
                    <span>Go to Categories</span>
                  </UiButton>
                </NuxtLink>
              </div>
            </div>
          </template>
        </UiTable>
      </div>

      <!-- Grid View Mode -->
      <div v-else-if="viewMode === 'grid'" class="space-y-6">
        <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="i in 6" :key="i" class="bg-card border border-border rounded-2xl p-5 space-y-4 animate-pulse">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-muted"></div>
              <div class="space-y-2 flex-1">
                <div class="h-4 bg-muted rounded w-2/3"></div>
                <div class="h-3 bg-muted rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="filteredFeaturedCategories.length === 0" class="bg-card border border-border rounded-2xl p-12 text-center">
          <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3 border border-amber-500/20">
            <Sparkles class="w-6 h-6" />
          </div>
          <h3 class="text-sm font-bold text-foreground">No Featured Categories Found</h3>
          <p class="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            There are currently no featured categories matching your criteria.
          </p>
          <div class="mt-4">
            <NuxtLink to="/admin/categories/">
              <UiButton class="rounded-xl h-9 px-4 text-xs font-bold gap-2">
                <Plus class="w-3.5 h-3.5" />
                <span>Go to Categories</span>
              </UiButton>
            </NuxtLink>
          </div>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="(cat, index) in filteredFeaturedCategories" 
            :key="cat.id"
            draggable="true"
            @dragstart="handleDragStart($event, cat)"
            @dragover="handleDragOver($event, cat)"
            @dragleave="handleDragLeave($event, cat)"
            @drop="handleDrop($event, cat)"
            @dragend="handleDragEnd"
            :class="[
              'bg-card text-card-foreground border border-border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 relative group flex flex-col justify-between cursor-grab active:cursor-grabbing',
              String(draggedCategoryId) === String(cat.id) && 'opacity-40 bg-amber-500/10 border-2 border-dashed border-amber-500 ring-2 ring-amber-500/20',
              String(dragOverCategoryId) === String(cat.id) && 'border-2 border-amber-500 bg-amber-500/15 ring-2 ring-amber-500/30'
            ]"
          >
            <div>
              <div class="flex items-start justify-between gap-3 mb-4">
                <div class="flex items-center gap-3">
                  <div class="p-1 text-muted-foreground/50 group-hover:text-amber-500 transition-colors">
                    <GripVertical class="w-4 h-4" />
                  </div>
                  <div class="w-12 h-12 rounded-2xl bg-muted/60 border border-border flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                    <img v-if="cat.featured_icon" :src="cat.featured_icon" :alt="cat.name" class="w-full h-full object-cover" />
                    <span v-else-if="cat.icon" class="text-lg">{{ cat.icon }}</span>
                    <Sparkles v-else class="w-5 h-5 text-amber-500/60" />
                  </div>
                  <div class="min-w-0">
                    <h3 class="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                      {{ decodeHtmlEntities(cat.name) }}
                    </h3>
                    <p class="text-[10px] text-muted-foreground font-mono tracking-wider mt-0.5 truncate">
                      /{{ cat.slug }}/
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-1.5 shrink-0">
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Sparkles class="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>#{{ cat.featured_display_order ?? cat.display_order ?? index + 1 }}</span>
                  </span>
                </div>
              </div>

              <div class="bg-muted/30 border border-border/50 rounded-xl p-3 text-xs space-y-1.5 mb-4">
                <div class="flex justify-between items-center text-[11px]">
                  <span class="text-muted-foreground">Position:</span>
                  <span class="font-mono font-bold text-foreground">#{{ cat.featured_display_order ?? cat.display_order ?? index + 1 }}</span>
                </div>
                <div v-if="cat.short_description" class="text-[11px] text-muted-foreground line-clamp-2 mt-1">
                  {{ cat.short_description }}
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between border-t border-border pt-3 mt-2">
              <div class="flex items-center gap-1">
                <button 
                  type="button"
                  @click.stop="moveCategoryUp(index)"
                  :disabled="index === 0"
                  class="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                  title="Move Up"
                  aria-label="Move Up"
                >
                  <ArrowUp class="w-3.5 h-3.5" />
                </button>
                <button 
                  type="button"
                  @click.stop="moveCategoryDown(index)"
                  :disabled="index === filteredFeaturedCategories.length - 1"
                  class="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                  title="Move Down"
                  aria-label="Move Down"
                >
                  <ArrowDown class="w-3.5 h-3.5" />
                </button>
              </div>

              <div class="flex items-center gap-1">
                <button 
                  type="button"
                  @click="triggerViewModal(cat)" 
                  class="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-all cursor-pointer"
                  title="View Category Details"
                  aria-label="View Category Details"
                >
                  <Eye class="w-4 h-4" />
                </button>

                <button 
                  v-if="canEditCategory"
                  type="button"
                  @click="triggerEditModal(cat)" 
                  class="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-all cursor-pointer"
                  title="Edit Category"
                  aria-label="Edit Category"
                >
                  <Edit2 class="w-4 h-4" />
                </button>

                <button 
                  v-if="canUnfeature"
                  type="button"
                  @click="triggerUnfeatureModal(cat)" 
                  :disabled="processingUnfeatureId === cat.id"
                  class="p-1.5 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-all cursor-pointer disabled:opacity-40"
                  title="Remove from Featured Categories"
                  aria-label="Remove from Featured Categories"
                >
                  <Loader2 v-if="processingUnfeatureId === cat.id" class="w-4 h-4 animate-spin text-primary" />
                  <Sparkles v-else class="w-4 h-4 fill-amber-500 text-amber-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- View Category Modal -->
    <UiAdminModal
      :is-open="isViewModalOpen && !!viewCategoryData"
      max-width="max-w-lg"
      @close="isViewModalOpen = false; viewCategoryData = null;"
    >
      <div v-if="viewCategoryData" class="p-6 space-y-6">
        <div class="flex items-start gap-4">
          <div class="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
            <img v-if="viewCategoryData.featured_icon" :src="viewCategoryData.featured_icon" :alt="viewCategoryData.name" class="w-full h-full object-cover" />
            <span v-else-if="viewCategoryData.icon" class="text-2xl">{{ viewCategoryData.icon }}</span>
            <Sparkles v-else class="w-6 h-6 text-amber-500" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <h3 class="text-base font-bold text-foreground leading-tight truncate">
                {{ decodeHtmlEntities(viewCategoryData.name) }}
              </h3>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                Featured
              </span>
            </div>
            <p class="text-xs text-muted-foreground font-mono mt-1">/product-category/{{ viewCategoryData.slug }}/</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-xl border border-border/60 text-xs">
          <div>
            <span class="text-muted-foreground text-[10px] uppercase font-bold tracking-wider block">Category ID</span>
            <span class="font-mono font-bold text-foreground">{{ viewCategoryData.id }}</span>
          </div>
          <div>
            <span class="text-muted-foreground text-[10px] uppercase font-bold tracking-wider block">Featured Order</span>
            <span class="font-mono font-bold text-foreground">{{ viewCategoryData.featured_display_order ?? viewCategoryData.display_order ?? '—' }}</span>
          </div>
        </div>

        <div v-if="viewCategoryData.short_description" class="space-y-1">
          <h4 class="text-xs font-bold text-foreground uppercase tracking-wider">Short Description</h4>
          <p class="text-xs text-muted-foreground leading-relaxed">{{ viewCategoryData.short_description }}</p>
        </div>

        <div v-if="viewCategoryData.description" class="space-y-1">
          <h4 class="text-xs font-bold text-foreground uppercase tracking-wider">Full Description</h4>
          <p class="text-xs text-muted-foreground leading-relaxed">{{ viewCategoryData.description }}</p>
        </div>

        <div class="flex items-center justify-between pt-4 border-t border-border">
          <a 
            :href="`/product-category/${viewCategoryData.slug}/`" 
            target="_blank" 
            class="text-xs font-bold text-primary hover:underline flex items-center gap-1.5"
          >
            <span>Preview on Storefront</span>
            <ExternalLink class="w-3.5 h-3.5" />
          </a>

          <UiButton
            variant="outline"
            class="rounded-xl h-9 px-4 text-xs font-bold cursor-pointer"
            @click="isViewModalOpen = false; viewCategoryData = null;"
          >
            Close
          </UiButton>
        </div>
      </div>
    </UiAdminModal>

    <!-- Edit Category Modal -->
    <UiAdminModal
      :is-open="isEditModalOpen && !!editCategoryData"
      max-width="max-w-xl"
      @close="isEditModalOpen = false; editCategoryData = null;"
    >
      <div v-if="editCategoryData" class="p-6 space-y-5">
        <div class="flex items-center justify-between pb-3 border-b border-border">
          <h3 class="text-base font-bold text-foreground flex items-center gap-2">
            <Edit2 class="w-4 h-4 text-primary" />
            <span>Edit Featured Category</span>
          </h3>
        </div>

        <div v-if="editFormError" class="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ editFormError }}</span>
        </div>

        <form @submit.prevent="handleSaveEditCategory" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-foreground">Category Name *</label>
              <input 
                v-model="editForm.name" 
                type="text" 
                required 
                class="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-foreground">Slug *</label>
              <input 
                v-model="editForm.slug" 
                type="text" 
                required 
                class="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-mono focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Featured Icon Asset</label>
            <div class="flex items-center gap-4 p-3 bg-muted/40 rounded-xl border border-border">
              <div class="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center overflow-hidden shrink-0">
                <img v-if="iconPreviewUrl" :src="iconPreviewUrl" alt="Icon Preview" class="w-full h-full object-cover" />
                <Sparkles v-else class="w-5 h-5 text-muted-foreground" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-bold text-foreground">Upload Custom Icon</p>
                <p class="text-[10px] text-muted-foreground mt-0.5">PNG, SVG, WEBP up to 2MB</p>
                <input 
                  type="file" 
                  accept="image/png,image/jpeg,image/webp,image/svg+xml" 
                  class="mt-1.5 text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                  @change="handleIconFileSelect"
                />
              </div>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Short Description Title</label>
            <input 
              v-model="editForm.short_description_title" 
              type="text" 
              class="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Short Description</label>
            <textarea 
              v-model="editForm.short_description" 
              rows="2" 
              class="w-full p-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none resize-none"
            ></textarea>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Description</label>
            <textarea 
              v-model="editForm.description" 
              rows="3" 
              class="w-full p-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none resize-none"
            ></textarea>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <UiButton
              type="button"
              variant="outline"
              class="rounded-xl h-10 px-4 text-xs font-bold cursor-pointer"
              @click="isEditModalOpen = false; editCategoryData = null;"
              :disabled="isEditSubmitting"
            >
              Cancel
            </UiButton>

            <UiButton
              type="submit"
              class="rounded-xl h-10 px-5 text-xs font-bold gap-2 cursor-pointer"
              :disabled="isEditSubmitting"
            >
              <Loader2 v-if="isEditSubmitting" class="w-4 h-4 animate-spin" />
              <span>Save Changes</span>
            </UiButton>
          </div>
        </form>
      </div>
    </UiAdminModal>

    <!-- Unfeature Confirmation Modal -->
    <UiAdminModal
      :is-open="isUnfeatureModalOpen && !!categoryToUnfeature"
      max-width="max-w-md"
      :show-close-button="false"
      @close="isUnfeatureModalOpen = false; categoryToUnfeature = null;"
    >
      <div class="p-6 space-y-6">
        <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <Sparkles class="w-6 h-6" />
        </div>

        <div>
          <h3 class="text-lg font-bold text-foreground">Remove Category from Featured</h3>
          <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Are you sure you want to unfeature Category <span class="font-bold text-foreground">"{{ decodeHtmlEntities(categoryToUnfeature?.name || '') }}"</span>? It will no longer appear in featured category sections on the storefront.
          </p>
          <p class="text-[11px] text-muted-foreground/80 mt-2 italic">
            Note: The category's featured icon asset will be retained and not deleted.
          </p>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <UiButton
            variant="outline"
            class="rounded-xl h-10 px-5 text-xs font-bold cursor-pointer"
            @click="isUnfeatureModalOpen = false; categoryToUnfeature = null;"
            :disabled="processingUnfeatureId === categoryToUnfeature?.id"
          >
            Cancel
          </UiButton>

          <UiButton
            class="rounded-xl h-10 px-5 text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 gap-2 cursor-pointer"
            @click="executeUnfeatureCategory"
            :disabled="processingUnfeatureId === categoryToUnfeature?.id"
          >
            <Loader2 v-if="processingUnfeatureId === categoryToUnfeature?.id" class="w-4 h-4 animate-spin" />
            <Sparkles v-else class="w-3.5 h-3.5" />
            <span>Unfeature Category</span>
          </UiButton>
        </div>
      </div>
    </UiAdminModal>

  </NuxtLayout>
</template>
