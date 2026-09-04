<!-- File: /components/admin/ProductImageGallery.vue -->
<script setup lang="ts">
import { ref, computed, watch, useId } from 'vue';
import { 
  Upload, 
  Trash2, 
  Loader2, 
  Check, 
  X, 
  Image as ImageIcon 
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
  (e: 'image-deleted', id: string | number): void;
}>();

const galleryInstanceId = useId ? useId() : Math.random().toString(36).substring(2, 9);
const productService = useProductService();
const { hasPermission, canEditInModule, canDeleteInModule } = useAdminPermissions();

// Permissions
const canAddImageComputed = computed(() => {
  if (props.canAdd !== undefined) return props.canAdd;
  return hasPermission('product_api.add_productimage') || canEditInModule('/admin/products');
});

const canDeleteImageComputed = computed(() => {
  if (props.canDelete !== undefined) return props.canDelete;
  return hasPermission('product_api.add_productimage') || canDeleteInModule('/admin/products');
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
      cancelAddImage();
      cancelDeleteProductImage();
      return;
    }

    const currentId = newId ?? newProdId;
    const prevId = oldId ?? oldProdId;

    if (currentId) {
      if (currentId !== prevId || (isOpen && !prevIsOpen)) {
        fetchProductImages(currentId);
      }
    } else {
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

// Upload State & Handlers
const isAddingImage = ref(false);
const newImageFile = ref<File | null>(null);
const newImagePreview = ref<string | null>(null);
const newImageAltText = ref('');
const newImageIsDefault = ref(false);
const isUploadingImage = ref(false);
const imageFileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);

const triggerImageUpload = () => {
  imageFileInput.value?.click();
};

const handleSelectedFile = (file: File) => {
  newImageFile.value = file;
  newImagePreview.value = URL.createObjectURL(file);
  newImageAltText.value = '';
  newImageIsDefault.value = galleryImages.value.length === 0;
  isAddingImage.value = true;
  if (imageFileInput.value) {
    imageFileInput.value.value = '';
  }
};

const onImageFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    if (file) {
      handleSelectedFile(file);
    }
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
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleSelectedFile(file);
    }
  }
};

const cancelAddImage = () => {
  isAddingImage.value = false;
  newImageFile.value = null;
  if (newImagePreview.value) {
    URL.revokeObjectURL(newImagePreview.value);
    newImagePreview.value = null;
  }
  newImageAltText.value = '';
  newImageIsDefault.value = false;
  isDragging.value = false;
};

const confirmAddImage = async () => {
  const targetProductId = props.productId ?? props.product?.id;
  if (!newImageFile.value || !targetProductId) return;

  isUploadingImage.value = true;
  try {
    const result = await productService.createProductImage({
      product: targetProductId,
      image: newImageFile.value,
      alt_text: newImageAltText.value,
      display_order: galleryImages.value.length,
      is_default: newImageIsDefault.value
    });

    toastSuccess('Product image added to gallery successfully');
    emit('image-uploaded', result);
    await fetchProductImages(targetProductId);
    cancelAddImage();
  } catch (error: any) {
    handleApiError(error, 'Failed to upload product image');
  } finally {
    isUploadingImage.value = false;
  }
};

// Delete State & Handlers
const imageToDelete = ref<ProductImage | null>(null);
const isDeletingImage = ref(false);

watch(imageToDelete, (val) => {
  isSubmodalOpen.value = !!val;
});

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

defineExpose({
  fetchProductImages,
  refresh: fetchProductImages,
  galleryImages,
  productImages
});
</script>

<template>
  <div :class="cn('space-y-3', props.class)">
    <!-- Header with count, loading indicator, and Add Image trigger -->
    <div class="flex items-center justify-between border-b border-border pb-1.5">
      <div class="flex items-center gap-2">
        <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product Image Gallery</span>
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground font-mono">
          {{ galleryImages.length }} {{ galleryImages.length === 1 ? 'image' : 'images' }}
        </span>
      </div>
      <div class="flex items-center gap-3">
        <div v-if="isLoading" class="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 class="w-3.5 h-3.5 animate-spin text-primary" />
          <span class="text-[11px] font-medium hidden xs:inline">Fetching...</span>
        </div>
        <button 
          v-if="canAddImageComputed"
          type="button" 
          @click="isAddingImage = !isAddingImage" 
          :class="cn('text-xs font-semibold px-2 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer', isAddingImage ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary hover:bg-primary/20')"
        >
          <Upload class="w-3.5 h-3.5" />
          <span>{{ isAddingImage ? 'Cancel Upload' : 'Add Image' }}</span>
        </button>
      </div>
    </div>

    <!-- Upload Form (Inline) -->
    <div v-if="isAddingImage" class="p-4 border border-primary/20 bg-primary/5 rounded-xl space-y-4 mb-4">
      <input 
        type="file" 
        ref="imageFileInput" 
        accept="image/jpeg,image/png,image/webp,image/gif" 
        class="hidden" 
        @change="onImageFileChange" 
      />
      
      <div 
        v-if="!newImageFile" 
        @click="triggerImageUpload"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
        :class="cn(
          'flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl bg-background/50 cursor-pointer transition-colors',
          isDragging ? 'border-primary bg-primary/10' : 'border-primary/30 hover:bg-primary/5'
        )"
      >
        <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-3">
          <Upload class="w-5 h-5" />
        </div>
        <p class="text-sm font-semibold text-primary">Click or drop to select an image</p>
        <p class="text-[11px] text-muted-foreground mt-1">Supports JPG, PNG, WEBP, GIF (Max 5MB)</p>
      </div>

      <div v-else class="flex gap-4">
        <div class="w-24 h-24 sm:w-32 sm:h-32 bg-background border border-border rounded-xl flex items-center justify-center p-1.5 shadow-xs shrink-0 overflow-hidden relative">
          <img :src="newImagePreview!" alt="Preview" class="w-full h-full object-contain" />
          <button 
            type="button" 
            @click.stop="cancelAddImage" 
            class="absolute top-1 right-1 bg-background/80 hover:bg-destructive hover:text-destructive-foreground text-foreground backdrop-blur-xs p-1 rounded-md shadow-xs transition-colors cursor-pointer"
            title="Remove image"
            aria-label="Remove image"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        
        <div class="flex-1 space-y-3 min-w-0">
          <div class="space-y-1">
            <label class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-1">Alt Text (Optional)</label>
            <input 
              v-model="newImageAltText" 
              type="text" 
              class="w-full h-9 px-3 bg-background border border-input rounded-lg outline-none text-xs text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20" 
              placeholder="Describe the image for accessibility and SEO..."
              :disabled="isUploadingImage"
            />
          </div>
          
          <div class="flex items-center gap-2">
            <input 
              type="checkbox" 
              :id="`new-image-default-${galleryInstanceId}`" 
              v-model="newImageIsDefault"
              class="w-3.5 h-3.5 rounded border-input text-primary focus:ring-primary cursor-pointer"
              :disabled="isUploadingImage || galleryImages.length === 0"
            />
            <label :for="`new-image-default-${galleryInstanceId}`" class="text-[11px] font-medium text-foreground cursor-pointer select-none">
              Set as Default Image
            </label>
          </div>

          <div class="pt-1">
            <button 
              type="button"
              @click="confirmAddImage"
              :disabled="isUploadingImage"
              class="h-8 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Loader2 v-if="isUploadingImage" class="w-3.5 h-3.5 animate-spin" />
              <Upload v-else class="w-3.5 h-3.5" />
              <span>{{ isUploadingImage ? 'Uploading...' : 'Upload Image' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Skeleton State -->
    <div v-if="isLoading && galleryImages.length === 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      <div v-for="i in 4" :key="i" class="aspect-square rounded-xl bg-muted/40 animate-pulse border border-border flex items-center justify-center">
        <Loader2 class="w-5 h-5 animate-spin text-muted-foreground/50" />
      </div>
    </div>

    <!-- Gallery Cards Grid -->
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

    <!-- Empty State -->
    <div v-else class="p-6 rounded-xl border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center text-center gap-2">
      <div class="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
        <ImageIcon class="w-5 h-5" />
      </div>
      <p class="text-xs font-semibold text-foreground">No images available</p>
      <p class="text-[11px] text-muted-foreground">No gallery images have been recorded for this product.</p>
    </div>

    <!-- Product Image Delete Confirmation Modal -->
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
  </div>
</template>
