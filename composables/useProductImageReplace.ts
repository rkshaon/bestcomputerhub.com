// File: /composables/useProductImageReplace.ts
import { ref, computed } from 'vue';
import { useProductService } from '@/composables/useProductService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { toastSuccess, toastError, handleApiError } from '@/composables/useToast';
import type { ProductImage } from '@/types';

export interface UseProductImageReplaceOptions {
  onSuccess?: (updated: ProductImage, previousImage?: ProductImage | null) => void | Promise<void>;
}

export const useProductImageReplace = (options: UseProductImageReplaceOptions = {}) => {
  const productService = useProductService();
  const { hasPermission } = useAdminPermissions();

  const canReplaceImage = computed(() => hasPermission('product_api.change_productimage'));
  const isReplacingImage = ref(false);
  const replacingImageId = ref<string | number | null>(null);
  const targetReplaceImageId = ref<string | number | null>(null);
  const targetReplaceImageItem = ref<ProductImage | null>(null);
  const replaceFileInput = ref<HTMLInputElement | null>(null);

  const handleReplaceProductImage = async (imageId: string | number, file: File): Promise<ProductImage | null> => {
    if (!hasPermission('product_api.change_productimage')) {
      toastError('You do not have permission to replace product images.');
      return null;
    }
    if (isReplacingImage.value || imageId === undefined || imageId === null) {
      return null;
    }

    const previousItem = targetReplaceImageItem.value;
    isReplacingImage.value = true;
    replacingImageId.value = imageId;

    try {
      // Exact endpoint POST /api/v1/product-images/{id}/replace-image/
      const updated = await productService.replaceProductImage(imageId, file);
      toastSuccess('Product image replaced successfully.');
      if (options.onSuccess) {
        await options.onSuccess(updated, previousItem);
      }
      return updated;
    } catch (error: any) {
      handleApiError(error, 'Failed to replace product image');
      return null;
    } finally {
      isReplacingImage.value = false;
      replacingImageId.value = null;
      targetReplaceImageId.value = null;
      targetReplaceImageItem.value = null;
      if (replaceFileInput.value) {
        replaceFileInput.value.value = '';
      }
    }
  };

  const triggerReplaceImage = (img: ProductImage) => {
    if (!canReplaceImage.value) {
      toastError('You do not have permission to replace product images.');
      return;
    }
    if (isReplacingImage.value || img.id === undefined || img.id === null) {
      return;
    }
    targetReplaceImageId.value = img.id;
    targetReplaceImageItem.value = img;
    if (replaceFileInput.value) {
      replaceFileInput.value.value = '';
      replaceFileInput.value.click();
    }
  };

  const onReplaceFileChange = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target?.files?.[0];
    const targetId = targetReplaceImageId.value;

    if (!file || targetId === null || targetId === undefined) {
      targetReplaceImageId.value = null;
      targetReplaceImageItem.value = null;
      return;
    }

    if (!file.type.startsWith('image/')) {
      toastError('Please select a valid image file (JPEG, PNG, WebP, GIF).');
      targetReplaceImageId.value = null;
      targetReplaceImageItem.value = null;
      if (replaceFileInput.value) replaceFileInput.value.value = '';
      return;
    }

    await handleReplaceProductImage(targetId, file);
  };

  return {
    canReplaceImage,
    isReplacingImage,
    replacingImageId,
    targetReplaceImageId,
    replaceFileInput,
    triggerReplaceImage,
    onReplaceFileChange,
    handleReplaceProductImage
  };
};
