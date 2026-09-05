<!-- File: /components/admin/ProductImageGallery.vue -->
<script setup lang="ts">
import { ref, computed, watch, useId } from 'vue';
import { 
  Upload, 
  Trash2, 
  Loader2, 
  Check, 
  X, 
  Plus,
  Image as ImageIcon,
  Images,
  Pencil
} from 'lucide-vue-next';
import { useProductService } from '@/composables/useProductService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { toastSuccess, toastError, handleApiError } from '@/composables/useToast';
import { cn } from '@/utils';
import type { Product, ProductImage } from '@/types';
import UiButton from '@/components/ui/Button.vue';
import UiAdminModal from '@/components/ui/UiAdminModal.vue';

interface Props {
  productId?: string | number | null;
  product?: Product | null;
  canAdd?: boolean;
  canDelete?: boolean;
  isOpen?: boolean;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  productId: null,
  product: null,
  canAdd: undefined,
  canDelete: undefined,
  isOpen: true,
  class: ''
});

const selectedImage = defineModel<ProductImage | null>('selectedImage', { default: null });
const isSubmodalOpen = defineModel<boolean>('isSubmodalOpen', { default: false });
const isLoadingModel = defineModel<boolean>('isLoading', { default: false });

const emit = defineEmits<{
  (e: 'select', image: ProductImage): void;
  (e: 'image-uploaded', image: any): void;
  (e: 'images-uploaded', images: ProductImage[]): void;
  (e: 'image-deleted', id: string | number): void;
}>();

const galleryInstanceId = useId ? useId() : Math.random().toString(36).substring(2, 9);
const productService = useProductService();
const { hasPermission, canEditInModule, canDeleteInModule } = useAdminPermissions();

// Permissions
const canAddImageComputed = computed(() => {
  if (props.canAdd !== undefined) return props.canAdd;
  return hasPermission('product_api.add_productimage');
});

const canDeleteImageComputed = computed(() => {
  if (props.canDelete !== undefined) return props.canDelete;
  return hasPermission('product_api.delete_productimage');
});

const canEditImageComputed = computed(() => {
  return hasPermission('product_api.change_productimage');
});

const canManageComputed = computed(() => {
  return canAddImageComputed.value || canDeleteImageComputed.value || canEditImageComputed.value;
});

// Dedicated Full Gallery Modal State & Handlers
const isFullGalleryOpen = ref(false);

const openFullGallery = () => {
  isFullGalleryOpen.value = true;
};

const openFullGalleryAndAdd = () => {
  isFullGalleryOpen.value = true;
  isAddingImage.value = true;
};

const closeFullGallery = () => {
  if (isDeletingImage.value || isUploadingImage.value || isUpdatingImage.value) return;
  isFullGalleryOpen.value = false;
  cancelAddImage();
  cancelDeleteProductImage();
  cancelEditProductImage();
};

const onPreviewOverflowClick = (img: ProductImage) => {
  selectImage(img);
  openFullGallery();
};

const modalTitle = computed(() => 'Product Image Gallery');

const modalSubtitle = computed(() => {
  if (props.product?.name) {
    return `${props.product.name} — Manage and organize catalog images, default badges, and display sequence.`;
  }
  return 'Manage and organize catalog images, default badges, and display sequence.';
});

// Gallery state
const isLoading = ref(false);
const productImages = ref<ProductImage[]>([]);
const internalSelectedImage = ref<ProductImage | null>(null);
const imageErrorMap = ref<Record<string, boolean>>({});

// Sync external and internal selection
const activeSelectedImage = computed({
  get: () => selectedImage.value ?? internalSelectedImage.value,
  set: (val: ProductImage | null) => {
    selectedImage.value = val;
    internalSelectedImage.value = val;
    if (val) {
      emit('select', val);
    }
  }
});

const handleImageError = (imageKey?: string) => {
  if (imageKey) {
    imageErrorMap.value[imageKey] = true;
  }
};

// Fetch product images from backend
const fetchProductImages = async (targetIdOrSlug?: string | number | null) => {
  const resolvedTarget = targetIdOrSlug ?? props.productId ?? props.product?.id ?? props.product?.slug;
  if (!resolvedTarget) {
    productImages.value = [];
    return;
  }

  isLoading.value = true;
  isLoadingModel.value = true;
  try {
    const images = await productService.getProductImages(resolvedTarget);
    productImages.value = Array.isArray(images) ? images : [];
  } catch {
    // Fallback to slug if ID fetch failed and product has a slug
    if (props.product?.slug && String(resolvedTarget) !== String(props.product.slug)) {
      try {
        const images = await productService.getProductImages(props.product.slug);
        productImages.value = Array.isArray(images) ? images : [];
      } catch {
        productImages.value = [];
      }
    } else {
      productImages.value = [];
    }
  } finally {
    isLoading.value = false;
    isLoadingModel.value = false;
  }
};

// Resolved sorted gallery images: sorted by display_order with fallback to product data
const galleryImages = computed<ProductImage[]>(() => {
  if (productImages.value && productImages.value.length > 0) {
    const valid = productImages.value.filter(img => Boolean(img && img.image));
    return [...valid].sort((a, b) => {
      const orderA = typeof a.display_order === 'number' ? a.display_order : 999999;
      const orderB = typeof b.display_order === 'number' ? b.display_order : 999999;
      return orderA - orderB;
    });
  }

  // Fallback to existing product images if endpoint returns none
  if (props.product) {
    if (props.product.images && props.product.images.length > 0) {
      return props.product.images
        .filter(Boolean)
        .map((img, idx) => ({
          id: idx,
          image: typeof img === 'string' ? img : (img as any)?.image || '',
          alt_text: props.product?.name || '',
          is_default: idx === 0,
          display_order: idx
        }))
        .filter(img => Boolean(img.image));
    }
    if (props.product.default_image) {
      const defImgUrl = typeof props.product.default_image === 'string'
        ? props.product.default_image
        : props.product.default_image.image;
      const defAlt = typeof props.product.default_image === 'object'
        ? props.product.default_image.alt_text
        : props.product?.name;
      if (defImgUrl) {
        return [{
          id: 0,
          image: defImgUrl,
          alt_text: defAlt || props.product?.name || '',
          is_default: true,
          display_order: 0
        }];
      }
    }
  }

  return [];
});

// Up to 4 preview thumbnails for the compact inline gallery
const previewImages = computed<ProductImage[]>(() => {
  return galleryImages.value.slice(0, 4);
});

// Additional images count beyond the 3 shown normally
const remainingImagesCount = computed<number>(() => {
  if (galleryImages.value.length > 4) {
    return galleryImages.value.length - 3;
  }
  return 0;
});

// Synchronize default / first selected image
watch(
  galleryImages,
  (images) => {
    if (images.length > 0) {
      const defaultImg = images.find(img => img.is_default) || images[0];
      const currentExists = activeSelectedImage.value
        ? images.some(img => img.image === activeSelectedImage.value?.image || (img.id !== undefined && img.id === activeSelectedImage.value?.id))
        : false;
      if (!currentExists || !activeSelectedImage.value) {
        activeSelectedImage.value = defaultImg || null;
      }
    } else {
      activeSelectedImage.value = null;
    }
  },
  { immediate: true }
);

// Watch props for re-fetching
watch(
  [() => props.productId, () => props.product?.id, () => props.isOpen],
  ([newId, newProdId, isOpen], [oldId, oldProdId, prevIsOpen]) => {
    if (isOpen === false) {
      isFullGalleryOpen.value = false;
      cancelAddImage();
      cancelDeleteProductImage();
      return;
    }

    const currentId = newId ?? newProdId;
    const prevId = oldId ?? oldProdId;

    if (currentId) {
      if (currentId !== prevId || (isOpen && !prevIsOpen)) {
        isFullGalleryOpen.value = false;
        fetchProductImages(currentId);
      }
    } else {
      isFullGalleryOpen.value = false;
      productImages.value = [];
      activeSelectedImage.value = null;
      imageErrorMap.value = {};
      cancelAddImage();
      cancelDeleteProductImage();
    }
  },
  { immediate: true }
);

const isSelected = (img: ProductImage) => {
  if (!activeSelectedImage.value) return false;
  if (img.image && activeSelectedImage.value.image) {
    return img.image === activeSelectedImage.value.image;
  }
  if (img.id !== undefined && activeSelectedImage.value.id !== undefined) {
    return img.id === activeSelectedImage.value.id;
  }
  return false;
};

const selectImage = (img: ProductImage) => {
  activeSelectedImage.value = img;
};

// Bulk Upload State & Handlers
interface PendingUploadImage {
  id: string;
  file: File;
  previewUrl: string;
  altText: string;
  isDefault: boolean;
}

const isAddingImage = ref(false);
const pendingImages = ref<PendingUploadImage[]>([]);
const isUploadingImage = ref(false);
const imageFileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const triggerImageUpload = () => {
  imageFileInput.value?.click();
};

const handleSelectedFiles = (files: FileList | File[]) => {
  const fileArray = Array.from(files).filter(f => f && f.type.startsWith('image/'));
  if (fileArray.length === 0) return;

  const startIndex = pendingImages.value.length;
  const newItems: PendingUploadImage[] = fileArray.map((file, idx) => ({
    id: `pending_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${startIndex + idx}`,
    file,
    previewUrl: URL.createObjectURL(file),
    altText: '',
    isDefault: false
  }));

  // If there are currently no gallery images and no pending images have isDefault set,
  // automatically designate the first pending image as default.
  const hasExistingGallery = galleryImages.value.length > 0;
  const anyDefaultPending = pendingImages.value.some(p => p.isDefault);
  const firstNewItem = newItems[0];
  if (!hasExistingGallery && !anyDefaultPending && firstNewItem) {
    firstNewItem.isDefault = true;
  }

  pendingImages.value.push(...newItems);
  isAddingImage.value = true;
  if (imageFileInput.value) {
    imageFileInput.value.value = '';
  }
};

const onImageFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    handleSelectedFiles(target.files);
  }
};

const onDragOver = (e: DragEvent) => {
  e.preventDefault();
  isDragging.value = true;
};

const onDragLeave = () => {
  isDragging.value = false;
};

const onDrop = (e: DragEvent) => {
  e.preventDefault();
  isDragging.value = false;
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    handleSelectedFiles(e.dataTransfer.files);
  }
};

const setDefaultPendingImage = (targetId: string, value: boolean) => {
  if (value) {
    // Exactly one pending image is marked as default
    pendingImages.value.forEach(item => {
      item.isDefault = item.id === targetId;
    });
  } else {
    // Unmark target
    const target = pendingImages.value.find(item => item.id === targetId);
    if (target) {
      target.isDefault = false;
    }
  }
};

const removePendingImage = (index: number) => {
  const item = pendingImages.value[index];
  if (!item) return;

  const wasDefault = item.isDefault;
  if (item.previewUrl) {
    URL.revokeObjectURL(item.previewUrl);
  }
  pendingImages.value.splice(index, 1);

  // If removed item was default, and product has no existing gallery images, designate first remaining item as default
  const firstRemainingItem = pendingImages.value[0];
  if (wasDefault && galleryImages.value.length === 0 && firstRemainingItem) {
    firstRemainingItem.isDefault = true;
  }
};

const cancelAddImage = () => {
  isAddingImage.value = false;
  pendingImages.value.forEach(item => {
    if (item.previewUrl) {
      URL.revokeObjectURL(item.previewUrl);
    }
  });
  pendingImages.value = [];
  isDragging.value = false;
  if (imageFileInput.value) {
    imageFileInput.value.value = '';
  }
};

const confirmBulkUpload = async () => {
  const targetProductId = props.productId ?? props.product?.id;
  if (!targetProductId || pendingImages.value.length === 0 || isUploadingImage.value) return;

  isUploadingImage.value = true;
  try {
    const maxOrder = galleryImages.value.reduce((max, img) => {
      return typeof img.display_order === 'number' ? Math.max(max, img.display_order) : max;
    }, -1);
    const startOrder = maxOrder >= 0 ? maxOrder + 1 : galleryImages.value.length;

    const payloadImages = pendingImages.value.map((item, idx) => ({
      image: item.file,
      alt_text: item.altText.trim() || undefined,
      display_order: startOrder + idx,
      is_default: item.isDefault
    }));

    const result = await productService.bulkUploadProductImages({
      product: targetProductId,
      images: payloadImages
    });

    const count = result.length || pendingImages.value.length;
    toastSuccess(`Successfully uploaded ${count} ${count === 1 ? 'image' : 'images'} to gallery`);
    
    emit('images-uploaded', result);
    const firstResult = result[0];
    if (result.length > 0 && firstResult) {
      emit('image-uploaded', firstResult);
    }

    await fetchProductImages(targetProductId);
    cancelAddImage();
  } catch (error: any) {
    // Preserve selected files and form data on error so user does not lose their work
    handleApiError(error, 'Failed to upload product images');
  } finally {
    isUploadingImage.value = false;
  }
};

// Delete State & Handlers
const imageToDelete = ref<ProductImage | null>(null);
const isDeletingImage = ref(false);

// Edit State & Handlers
const imageToEdit = ref<ProductImage | null>(null);
const editAltTextVal = ref('');
const isUpdatingImage = ref(false);

watch(
  [isFullGalleryOpen, imageToDelete, imageToEdit],
  ([isFullOpen, toDelete, toEdit]) => {
    isSubmodalOpen.value = Boolean(isFullOpen || toDelete || toEdit);
  },
  { immediate: true }
);

const promptDeleteProductImage = (img: ProductImage) => {
  if (!canDeleteImageComputed.value) {
    toastError('You do not have permission to delete product images.');
    return;
  }
  imageToDelete.value = img;
};

const cancelDeleteProductImage = () => {
  if (isDeletingImage.value) return;
  imageToDelete.value = null;
};

const confirmDeleteProductImage = async () => {
  if (!imageToDelete.value?.id) return;

  const targetImageId = imageToDelete.value.id;
  const targetProductId = props.productId ?? props.product?.id;
  isDeletingImage.value = true;

  try {
    await productService.deleteProductImage(targetImageId);
    toastSuccess('Product image deleted successfully');
    emit('image-deleted', targetImageId);
    imageToDelete.value = null;

    if (targetProductId) {
      await fetchProductImages(targetProductId);
    }
  } catch (error: any) {
    handleApiError(error, 'Failed to delete product image');
  } finally {
    isDeletingImage.value = false;
  }
};

const promptEditProductImage = (img: ProductImage) => {
  if (!canEditImageComputed.value) {
    toastError('You do not have permission to edit product images.');
    return;
  }
  imageToEdit.value = img;
  editAltTextVal.value = img.alt_text || '';
};

const cancelEditProductImage = () => {
  if (isUpdatingImage.value) return;
  imageToEdit.value = null;
  editAltTextVal.value = '';
};

const confirmEditProductImage = async () => {
  if (!imageToEdit.value || imageToEdit.value.id === undefined || imageToEdit.value.id === null || isUpdatingImage.value) return;

  const targetImageId = imageToEdit.value.id;
  const newAltText = editAltTextVal.value.trim();
  isUpdatingImage.value = true;

  try {
    const updated = await productService.updateProductImage(targetImageId, { alt_text: newAltText });
    const idx = productImages.value.findIndex(img => String(img.id) === String(targetImageId));
    if (idx !== -1 && productImages.value[idx]) {
      productImages.value[idx] = {
        ...productImages.value[idx],
        alt_text: updated.alt_text ?? newAltText
      };
    }
    if (activeSelectedImage.value && String(activeSelectedImage.value.id) === String(targetImageId)) {
      activeSelectedImage.value = {
        ...activeSelectedImage.value,
        alt_text: updated.alt_text ?? newAltText
      };
    }
    toastSuccess('Product image alt text updated successfully.');
    cancelEditProductImage();
  } catch (error: any) {
    handleApiError(error, 'Failed to update product image alt text');
  } finally {
    isUpdatingImage.value = false;
  }
};

defineExpose({
  fetchProductImages,
  refresh: fetchProductImages,
  galleryImages,
  productImages,
  isFullGalleryOpen,
  openFullGallery,
  closeFullGallery
});
</script>

<template>
  <div :class="cn('space-y-3', props.class)">
    <!-- 1. Compact Inline Image Gallery Preview -->
    <div class="flex items-center justify-between border-b border-border pb-1.5">
      <div class="flex items-center gap-2">
        <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product Image Gallery</span>
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground font-mono">
          {{ galleryImages.length }} {{ galleryImages.length === 1 ? 'image' : 'images' }}
        </span>
        <div v-if="isLoading" class="flex items-center gap-1.5 text-xs text-muted-foreground ml-1">
          <Loader2 class="w-3.5 h-3.5 animate-spin text-primary" />
          <span class="text-[11px] font-medium hidden xs:inline">Fetching...</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button 
          type="button" 
          @click="openFullGallery" 
          class="text-xs font-semibold px-2.5 py-1 rounded-lg border border-input bg-background hover:bg-muted text-foreground transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Images class="w-3.5 h-3.5 text-muted-foreground" />
          <span>{{ canManageComputed ? 'Manage Gallery' : 'View Gallery' }}</span>
        </button>
      </div>
    </div>

    <!-- Compact Preview Body -->
    <!-- Loading Skeleton State -->
    <div v-if="isLoading && galleryImages.length === 0" class="flex items-center gap-2.5">
      <div v-for="i in 4" :key="i" class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-muted/40 animate-pulse border border-border flex items-center justify-center shrink-0">
        <Loader2 class="w-4 h-4 animate-spin text-muted-foreground/50" />
      </div>
    </div>

    <!-- Preview Thumbnails (Up to 4) -->
    <div v-else-if="galleryImages.length > 0" class="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
      <div
        v-for="(img, idx) in previewImages"
        :key="img.id ?? idx"
        @click="selectImage(img)"
        role="button"
        tabindex="0"
        @keydown.enter="selectImage(img)"
        @keydown.space.prevent="selectImage(img)"
        :class="cn(
          'group relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl border bg-card overflow-hidden transition-all cursor-pointer select-none shrink-0 flex items-center justify-center p-1',
          isSelected(img)
            ? 'border-primary ring-2 ring-primary/20 shadow-xs'
            : 'border-border hover:border-primary/50 hover:shadow-xs'
        )"
        :title="img.alt_text ? `${img.alt_text}${img.is_default ? ' (Default)' : ''}` : `Product Image ${idx + 1}${img.is_default ? ' (Default)' : ''}`"
        :aria-label="img.alt_text ? `Select ${img.alt_text}` : `Select product image ${idx + 1}`"
      >
        <img
          :src="imageErrorMap[img.image || ''] ? 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&h=600&fit=crop&q=80' : img.image"
          :alt="img.alt_text || `Product image ${idx + 1}`"
          @error="handleImageError(img.image)"
          class="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
        />

        <!-- Default Badge -->
        <span
          v-if="img.is_default && !(idx === 3 && remainingImagesCount > 0)"
          class="absolute top-1 left-1 bg-primary text-primary-foreground text-[8px] font-bold px-1 py-0.2 rounded shadow-xs uppercase tracking-wider leading-none"
          title="Default product image"
        >
          Default
        </span>

        <!-- Selected Checkmark indicator -->
        <span
          v-if="isSelected(img) && !(idx === 3 && remainingImagesCount > 0)"
          class="absolute bottom-1 right-1 bg-primary text-primary-foreground p-0.5 rounded shadow-xs"
          title="Selected"
        >
          <Check class="w-2.5 h-2.5 stroke-[3]" />
        </span>

        <!-- 4th thumbnail overlay when more than 4 images exist -->
        <div
          v-if="idx === 3 && remainingImagesCount > 0"
          @click.stop="onPreviewOverflowClick(img)"
          role="button"
          tabindex="0"
          @keydown.enter.stop="onPreviewOverflowClick(img)"
          @keydown.space.prevent.stop="onPreviewOverflowClick(img)"
          class="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] flex flex-col items-center justify-center text-white text-center transition-colors hover:bg-slate-950/85 cursor-pointer p-0.5"
          :title="`+${remainingImagesCount} more images in gallery. Click to view all.`"
          aria-label="View all gallery images"
        >
          <span class="text-xs sm:text-sm font-extrabold tracking-tight font-mono leading-none">+{{ remainingImagesCount }}</span>
          <span class="text-[8px] font-bold text-slate-300 uppercase tracking-wider leading-tight mt-0.5">more</span>
        </div>
      </div>
    </div>

    <!-- Compact Empty State -->
    <div v-else class="p-3.5 rounded-xl border border-dashed border-border bg-muted/20 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
          <ImageIcon class="w-4 h-4" />
        </div>
        <div>
          <p class="text-xs font-semibold text-foreground">No gallery images</p>
          <p class="text-[11px] text-muted-foreground">No images have been added to this product's catalog.</p>
        </div>
      </div>
      <button
        v-if="canAddImageComputed"
        type="button"
        @click="openFullGalleryAndAdd"
        class="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
      >
        <Upload class="w-3.5 h-3.5" />
        <span>Add Images</span>
      </button>
    </div>

    <!-- 2. Dedicated Full Gallery Modal -->
    <UiAdminModal
      :is-open="isFullGalleryOpen"
      max-width="max-w-4xl"
      :title="modalTitle"
      :subtitle="modalSubtitle"
      :close-on-escape="!imageToDelete"
      :close-on-backdrop="!imageToDelete"
      @close="closeFullGallery"
    >
      <div class="p-6 space-y-6 overflow-y-auto max-h-[75vh] flex flex-col cursor-default">
        <!-- Gallery Action Bar inside modal -->
        <div class="flex items-center justify-between border-b border-border pb-3 shrink-0">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-foreground">Catalog Images</span>
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground font-mono">
              {{ galleryImages.length }} {{ galleryImages.length === 1 ? 'image' : 'images' }}
            </span>
            <div v-if="isLoading" class="flex items-center gap-1.5 text-xs text-muted-foreground ml-2">
              <Loader2 class="w-3.5 h-3.5 animate-spin text-primary" />
              <span class="text-[11px] font-medium hidden xs:inline">Updating...</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button 
              v-if="canAddImageComputed"
              type="button" 
              @click="isAddingImage ? cancelAddImage() : (isAddingImage = true)" 
              :class="cn(
                'text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs',
                isAddingImage ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary hover:bg-primary/20'
              )"
            >
              <Upload class="w-3.5 h-3.5" />
              <span>{{ isAddingImage ? 'Cancel Upload' : 'Upload Images' }}</span>
            </button>
          </div>
        </div>

        <!-- Bulk Upload Form (Inline inside modal) -->
        <div 
          v-if="isAddingImage" 
          :class="cn(
            'p-4 border rounded-xl space-y-4 transition-colors',
            isDragging ? 'border-primary bg-primary/10' : 'border-primary/20 bg-primary/5'
          )"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
          @drop="onDrop"
        >
          <input 
            type="file" 
            ref="imageFileInput" 
            accept="image/jpeg,image/png,image/webp,image/gif" 
            multiple
            class="hidden" 
            @change="onImageFileChange" 
          />
          
          <!-- Dropzone (Shown when no images have been staged yet) -->
          <div 
            v-if="pendingImages.length === 0" 
            @click="triggerImageUpload"
            :class="cn(
              'flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl bg-background/50 cursor-pointer transition-colors',
              isDragging ? 'border-primary bg-primary/15' : 'border-primary/30 hover:bg-primary/10'
            )"
          >
            <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-3">
              <Upload class="w-5 h-5" />
            </div>
            <p class="text-sm font-semibold text-primary">Click or drop images to upload</p>
            <p class="text-[11px] text-muted-foreground mt-1">Select multiple images at once (JPG, PNG, WEBP, GIF — Max 5MB each)</p>
          </div>

          <!-- Staged Images List (When 1 or more images are selected) -->
          <div v-else class="space-y-4">
            <!-- Staged Queue Header -->
            <div class="flex items-center justify-between pb-2 border-b border-primary/15">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-foreground">Selected Images</span>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary font-mono">
                  {{ pendingImages.length }} {{ pendingImages.length === 1 ? 'file' : 'files' }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  @click="triggerImageUpload"
                  :disabled="isUploadingImage"
                  class="h-7 px-2.5 rounded-lg border border-input bg-background hover:bg-muted text-foreground text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="Add more images to queue"
                >
                  <Plus class="w-3 h-3" />
                  <span>Add More</span>
                </button>
                <button
                  type="button"
                  @click="cancelAddImage"
                  :disabled="isUploadingImage"
                  class="h-7 px-2.5 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="Clear all selected images"
                >
                  <X class="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              </div>
            </div>

            <!-- Staged items list -->
            <div class="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              <div
                v-for="(item, idx) in pendingImages"
                :key="item.id"
                class="p-3 bg-background border border-border/80 rounded-xl flex flex-col sm:flex-row gap-3 relative shadow-xs hover:border-primary/30 transition-colors"
              >
                <!-- Thumbnail -->
                <div class="w-20 h-20 bg-muted/20 border border-border rounded-lg flex items-center justify-center p-1 shrink-0 overflow-hidden relative group">
                  <img :src="item.previewUrl" alt="Staged image preview" class="w-full h-full object-contain" />
                  <!-- Display Order Sequence Badge -->
                  <span class="absolute top-1 left-1 bg-background/90 text-muted-foreground text-[9px] font-mono font-bold px-1 rounded shadow-xs">
                    #{{ idx + 1 }}
                  </span>
                  <!-- Remove Item Button -->
                  <button 
                    type="button" 
                    @click.stop="removePendingImage(idx)"
                    :disabled="isUploadingImage"
                    class="absolute top-1 right-1 bg-background/90 hover:bg-destructive hover:text-destructive-foreground text-foreground p-1 rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    title="Remove image from upload queue"
                    aria-label="Remove image from upload queue"
                  >
                    <X class="w-3.5 h-3.5" />
                  </button>
                </div>

                <!-- Metadata Inputs -->
                <div class="flex-1 space-y-2.5 min-w-0">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-xs font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs" :title="item.file.name">
                      {{ item.file.name }}
                    </span>
                    <span class="text-[10px] text-muted-foreground font-mono shrink-0">
                      {{ formatFileSize(item.file.size) }}
                    </span>
                  </div>

                  <div class="space-y-1">
                    <input 
                      v-model="item.altText" 
                      type="text" 
                      class="w-full h-8 px-2.5 bg-background border border-input rounded-lg outline-none text-xs text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20" 
                      placeholder="Alt text / description (SEO & accessibility)..."
                      :disabled="isUploadingImage"
                    />
                  </div>

                  <div class="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      :id="`default-image-${galleryInstanceId}-${item.id}`" 
                      :checked="item.isDefault"
                      @change="(e: any) => setDefaultPendingImage(item.id, e.target.checked)"
                      class="w-3.5 h-3.5 rounded border-input text-primary focus:ring-primary cursor-pointer"
                      :disabled="isUploadingImage"
                    />
                    <label :for="`default-image-${galleryInstanceId}-${item.id}`" class="text-[11px] font-medium text-foreground cursor-pointer select-none flex items-center gap-1.5">
                      <span>Set as Default Image</span>
                      <span v-if="item.isDefault" class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-primary text-primary-foreground uppercase tracking-wider">
                        Default
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Upload Action Footer -->
            <div class="pt-2 border-t border-primary/15 flex items-center justify-between gap-3">
              <p class="text-[11px] text-muted-foreground hidden xs:inline">
                Sequence order is automatically preserved from this queue.
              </p>
              <div class="flex items-center gap-2 ml-auto shrink-0">
                <button 
                  type="button" 
                  @click="cancelAddImage" 
                  :disabled="isUploadingImage"
                  class="h-8 px-3 rounded-lg border border-input bg-background hover:bg-muted text-foreground text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  @click="confirmBulkUpload" 
                  :disabled="isUploadingImage || pendingImages.length === 0" 
                  class="h-8 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
                >
                  <Loader2 v-if="isUploadingImage" class="w-3.5 h-3.5 animate-spin" />
                  <Upload v-else class="w-3.5 h-3.5" />
                  <span>{{ isUploadingImage ? 'Uploading...' : `Upload All (${pendingImages.length})` }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading Skeleton in Full Modal -->
        <div v-if="isLoading && galleryImages.length === 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <div v-for="i in 4" :key="i" class="aspect-square rounded-xl bg-muted/40 animate-pulse border border-border flex items-center justify-center">
            <Loader2 class="w-5 h-5 animate-spin text-muted-foreground/50" />
          </div>
        </div>

        <!-- Full Gallery Cards Grid -->
        <div v-else-if="galleryImages.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <div
            v-for="(img, idx) in galleryImages"
            :key="img.id ?? idx"
            @click="selectImage(img)"
            role="button"
            tabindex="0"
            @keydown.enter="selectImage(img)"
            @keydown.space.prevent="selectImage(img)"
            :class="cn(
              'group relative flex flex-col rounded-xl border bg-card overflow-hidden transition-all cursor-pointer select-none',
              isSelected(img)
                ? 'border-primary ring-2 ring-primary/20 shadow-xs'
                : 'border-border hover:border-primary/50 hover:shadow-xs'
            )"
            :title="img.alt_text ? `${img.alt_text}${img.is_default ? ' (Default)' : ''}` : `Product Image ${idx + 1}${img.is_default ? ' (Default)' : ''}`"
            :aria-label="img.alt_text ? `Select ${img.alt_text}` : `Select product image ${idx + 1}`"
          >
            <!-- Image Container with aspect ratio -->
            <div class="aspect-square bg-muted/20 relative flex items-center justify-center p-3 overflow-hidden">
              <img
                :src="imageErrorMap[img.image || ''] ? 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&h=600&fit=crop&q=80' : img.image"
                :alt="img.alt_text || `Product image ${idx + 1}`"
                @error="handleImageError(img.image)"
                class="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
              />
              <!-- Default Badge -->
              <span
                v-if="img.is_default"
                class="absolute top-2 left-2 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs uppercase tracking-wider leading-none"
                title="Default product image"
              >
                Default
              </span>
              <!-- Display Order Badge -->
              <span
                v-if="img.display_order !== undefined && img.display_order !== null"
                class="absolute top-2 right-2 bg-background/80 backdrop-blur-xs text-muted-foreground border border-border/60 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded leading-none"
                title="Display order"
              >
                #{{ img.display_order }}
              </span>
            </div>

            <!-- Card Footer / Caption -->
            <div class="p-2 bg-card border-t border-border/60 flex items-center justify-between gap-1 text-xs">
              <span class="truncate text-[11px] font-medium text-foreground" :title="img.alt_text || `Image ${idx + 1}`">
                {{ img.alt_text || `Image ${idx + 1}` }}
              </span>
              <div class="flex items-center gap-1 shrink-0">
                <span
                  v-if="isSelected(img)"
                  class="text-[10px] font-bold text-primary flex items-center gap-0.5"
                >
                  <Check class="w-3 h-3 stroke-[2.5]" />
                  <span class="hidden xs:inline">Selected</span>
                </span>
                <button
                  v-if="canEditImageComputed && img.id !== undefined && img.id !== null"
                  type="button"
                  @click.stop="promptEditProductImage(img)"
                  class="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                  title="Edit alt text"
                  aria-label="Edit alt text"
                >
                  <Pencil class="w-3.5 h-3.5" />
                </button>
                <button
                  v-if="canDeleteImageComputed && img.id !== undefined && img.id !== null"
                  type="button"
                  @click.stop="promptDeleteProductImage(img)"
                  class="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  title="Delete image"
                  aria-label="Delete image"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State in Full Modal -->
        <div v-else class="p-8 rounded-xl border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center text-center gap-2">
          <div class="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
            <ImageIcon class="w-6 h-6" />
          </div>
          <p class="text-sm font-semibold text-foreground">No images available</p>
          <p class="text-xs text-muted-foreground max-w-sm">No gallery images have been recorded for this product yet. Click "Add Image" above to upload images.</p>
        </div>

        <!-- Modal Footer -->
        <div class="pt-4 border-t border-border flex items-center justify-between shrink-0 bg-card">
          <span class="text-xs text-muted-foreground">
            {{ canManageComputed ? 'Select an image to preview it as the main product image.' : 'Click any image to view it as the main image.' }}
          </span>
          <UiButton 
            variant="outline" 
            class="rounded-xl h-9 px-4 text-xs font-bold cursor-pointer"
            @click="closeFullGallery"
          >
            Done
          </UiButton>
        </div>
      </div>
    </UiAdminModal>

    <!-- 3. Product Image Delete Confirmation Modal -->
    <UiAdminModal 
      :is-open="!!imageToDelete"
      max-width="max-w-md"
      :show-close-button="false"
      @close="cancelDeleteProductImage"
    >
      <div class="p-6 space-y-6">
        <div class="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <Trash2 class="w-6 h-6" />
        </div>

        <div>
          <h3 class="text-lg font-bold text-foreground">Confirm Image Deletion</h3>
          <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Are you sure you want to delete this product image from the gallery? This action cannot be undone.
          </p>
          <div v-if="imageToDelete?.image" class="mt-4 flex items-center gap-3 p-2.5 rounded-xl border border-border bg-muted/20">
            <div class="w-12 h-12 rounded-lg border border-border overflow-hidden bg-muted/40 p-1 flex items-center justify-center shrink-0">
              <img 
                :src="imageErrorMap[imageToDelete.image] ? 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&h=600&fit=crop&q=80' : imageToDelete.image" 
                :alt="imageToDelete.alt_text || 'Image to delete'" 
                class="w-full h-full object-contain" 
              />
            </div>
            <div class="min-w-0 flex-1 text-xs">
              <p class="font-medium text-foreground truncate">
                {{ imageToDelete.alt_text || 'Product Image' }}
              </p>
              <div class="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                <span v-if="imageToDelete.is_default" class="text-primary font-bold uppercase text-[9px]">Default Image</span>
                <span v-if="imageToDelete.display_order !== undefined">Order #{{ imageToDelete.display_order }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <UiButton 
            variant="outline" 
            class="rounded-xl h-10 px-5 text-xs font-bold cursor-pointer"
            @click="cancelDeleteProductImage"
            :disabled="isDeletingImage"
          >
            Cancel
          </UiButton>

          <UiButton 
            class="rounded-xl h-10 px-5 text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2 cursor-pointer"
            @click="confirmDeleteProductImage"
            :disabled="isDeletingImage"
          >
            <Loader2 v-if="isDeletingImage" class="w-4 h-4 animate-spin" />
            <Trash2 v-else class="w-3.5 h-3.5" />
            <span>{{ isDeletingImage ? 'Deleting...' : 'Delete Image' }}</span>
          </UiButton>
        </div>
      </div>
    </UiAdminModal>

    <!-- 4. Product Image Edit Alt Text Modal -->
    <UiAdminModal 
      :is-open="!!imageToEdit"
      max-width="max-w-md"
      :show-close-button="false"
      @close="cancelEditProductImage"
    >
      <div class="p-6 space-y-6">
        <div class="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Pencil class="w-6 h-6" />
        </div>

        <div>
          <h3 class="text-lg font-bold text-foreground">Edit Image Alt Text</h3>
          <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Update the descriptive alt text for accessibility and SEO.
          </p>

          <div v-if="imageToEdit?.image" class="mt-4 flex items-center gap-3 p-2.5 rounded-xl border border-border bg-muted/20">
            <div class="w-12 h-12 rounded-lg border border-border overflow-hidden bg-muted/40 p-1 flex items-center justify-center shrink-0">
              <img 
                :src="imageErrorMap[imageToEdit.image] ? 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&h=600&fit=crop&q=80' : imageToEdit.image" 
                :alt="imageToEdit.alt_text || 'Image to edit'" 
                class="w-full h-full object-contain" 
              />
            </div>
            <div class="min-w-0 flex-1 text-xs">
              <p class="font-medium text-foreground truncate">
                {{ imageToEdit.alt_text || 'Product Image' }}
              </p>
              <div class="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                <span v-if="imageToEdit.is_default" class="text-primary font-bold uppercase text-[9px]">Default Image</span>
                <span v-if="imageToEdit.display_order !== undefined">Order #{{ imageToEdit.display_order }}</span>
              </div>
            </div>
          </div>

          <div class="mt-4 space-y-1.5">
            <label class="text-xs font-semibold text-foreground">Alt Text</label>
            <input 
              v-model="editAltTextVal" 
              type="text" 
              class="w-full h-10 px-3 bg-background border border-input rounded-xl outline-none text-xs text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20" 
              placeholder="e.g. Front view of product in studio lighting"
              :disabled="isUpdatingImage"
              @keydown.enter.prevent="confirmEditProductImage"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <UiButton 
            variant="outline" 
            class="rounded-xl h-10 px-5 text-xs font-bold cursor-pointer"
            @click="cancelEditProductImage"
            :disabled="isUpdatingImage"
          >
            Cancel
          </UiButton>

          <UiButton 
            class="rounded-xl h-10 px-5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 gap-2 cursor-pointer"
            @click="confirmEditProductImage"
            :disabled="isUpdatingImage"
          >
            <Loader2 v-if="isUpdatingImage" class="w-4 h-4 animate-spin" />
            <Check v-else class="w-3.5 h-3.5" />
            <span>{{ isUpdatingImage ? 'Saving...' : 'Save Changes' }}</span>
          </UiButton>
        </div>
      </div>
    </UiAdminModal>
  </div>
</template>
