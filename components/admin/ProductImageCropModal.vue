<!-- File: /components/admin/ProductImageCropModal.vue -->
<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue';
import UiAdminModal from '@/components/ui/UiAdminModal.vue';
import UiButton from '@/components/ui/Button.vue';
import { useProductService } from '@/composables/useProductService';
import { useToast } from '@/composables/useToast';
import { cropAndResizeSquareImage } from '@/utils/imageCropper';
import type { ProductImage } from '@/types';
import {
  Crop,
  ZoomIn,
  Move,
  Loader2,
  AlertCircle,
  Check,
  AlignCenter,
  Maximize2
} from 'lucide-vue-next';

interface Props {
  isOpen: boolean;
  imageItem: ProductImage | null;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  imageItem: null
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success', updated: ProductImage): void;
}>();

const productService = useProductService();
const { toastSuccess, handleApiError } = useToast();

const isSubmitting = ref(false);
const imageLoaded = ref(false);
const loadError = ref<string | null>(null);

const naturalWidth = ref(0);
const naturalHeight = ref(0);

// Crop rectangle state (in source image pixels)
const cropX = ref(0);
const cropY = ref(0);
const cropSize = ref(0);
const zoomScale = ref(1.0); // 1.0 to 3.0

// Dragging state for pan/repositioning
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const initialCropX = ref(0);
const initialCropY = ref(0);

const sourceImgRef = ref<HTMLImageElement | null>(null);

// Reset state when modal opens with a new image
watch(
  () => [props.isOpen, props.imageItem],
  async ([open, item]) => {
    if (open && item && (item as ProductImage).image) {
      imageLoaded.value = false;
      loadError.value = null;
      zoomScale.value = 1.0;
      isSubmitting.value = false;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        naturalWidth.value = img.naturalWidth || img.width;
        naturalHeight.value = img.naturalHeight || img.height;
        sourceImgRef.value = img;

        // Default 1:1 crop size is min dimension
        const baseSize = Math.min(naturalWidth.value, naturalHeight.value);
        cropSize.value = baseSize;
        cropX.value = Math.round((naturalWidth.value - baseSize) / 2);
        cropY.value = Math.round((naturalHeight.value - baseSize) / 2);

        imageLoaded.value = true;
      };
      img.onerror = () => {
        loadError.value = 'Failed to load source image for cropping.';
        imageLoaded.value = false;
      };
      const imgSrc = (item as ProductImage).image;
      if (imgSrc) {
        img.src = imgSrc;
      } else {
        loadError.value = 'No image URL provided.';
      }
    }
  },
  { immediate: true }
);

// Effective crop size given current zoom scale
const effectiveCropSize = computed(() => {
  if (!naturalWidth.value || !naturalHeight.value) return 0;
  const baseSize = Math.min(naturalWidth.value, naturalHeight.value);
  return Math.max(10, Math.round(baseSize / zoomScale.value));
});

// Output resolution (capped at 500px)
const outputResolution = computed(() => {
  if (!effectiveCropSize.value) return 500;
  return Math.min(500, effectiveCropSize.value);
});

// Update crop position when zoom scale changes
watch(zoomScale, (newScale, oldScale) => {
  if (!naturalWidth.value || !naturalHeight.value) return;
  const oldSize = Math.round(Math.min(naturalWidth.value, naturalHeight.value) / oldScale);
  const newSize = effectiveCropSize.value;

  // Keep center fixed
  const centerX = cropX.value + oldSize / 2;
  const centerY = cropY.value + oldSize / 2;

  let nextX = Math.round(centerX - newSize / 2);
  let nextY = Math.round(centerY - newSize / 2);

  // Clamp within image bounds
  cropX.value = Math.max(0, Math.min(nextX, naturalWidth.value - newSize));
  cropY.value = Math.max(0, Math.min(nextY, naturalHeight.value - newSize));
});

// Center alignment preset
const alignCenter = () => {
  if (!naturalWidth.value || !naturalHeight.value) return;
  const size = effectiveCropSize.value;
  cropX.value = Math.round((naturalWidth.value - size) / 2);
  cropY.value = Math.round((naturalHeight.value - size) / 2);
};

// Corner alignment presets
const alignCorner = (corner: 'tl' | 'tr' | 'bl' | 'br') => {
  if (!naturalWidth.value || !naturalHeight.value) return;
  const size = effectiveCropSize.value;
  if (corner === 'tl') {
    cropX.value = 0;
    cropY.value = 0;
  } else if (corner === 'tr') {
    cropX.value = naturalWidth.value - size;
    cropY.value = 0;
  } else if (corner === 'bl') {
    cropX.value = 0;
    cropY.value = naturalHeight.value - size;
  } else if (corner === 'br') {
    cropX.value = naturalWidth.value - size;
    cropY.value = naturalHeight.value - size;
  }
};

// Drag handlers for viewport panning
const startDrag = (e: MouseEvent | TouchEvent) => {
  if (!imageLoaded.value) return;
  isDragging.value = true;
  const touch = 'touches' in e && e.touches[0] ? e.touches[0] : null;
  const clientX = touch ? touch.clientX : (e as MouseEvent).clientX;
  const clientY = touch ? touch.clientY : (e as MouseEvent).clientY;
  dragStartX.value = clientX;
  dragStartY.value = clientY;
  initialCropX.value = cropX.value;
  initialCropY.value = cropY.value;
};

const onDrag = (e: MouseEvent | TouchEvent) => {
  if (!isDragging.value || !naturalWidth.value || !naturalHeight.value) return;
  const touch = 'touches' in e && e.touches[0] ? e.touches[0] : null;
  const clientX = touch ? touch.clientX : (e as MouseEvent).clientX;
  const clientY = touch ? touch.clientY : (e as MouseEvent).clientY;

  const dx = clientX - dragStartX.value;
  const dy = clientY - dragStartY.value;

  // Convert viewport movement to original image pixel delta
  const viewportElem = document.getElementById('crop-viewport-container');
  if (!viewportElem) return;
  const rect = viewportElem.getBoundingClientRect();
  const scaleRatioX = naturalWidth.value / rect.width;
  const scaleRatioY = naturalHeight.value / rect.height;

  // Calculate crop box target position based on pointer delta
  let nextX = Math.round(initialCropX.value + dx * scaleRatioX);
  let nextY = Math.round(initialCropY.value + dy * scaleRatioY);

  const size = effectiveCropSize.value;
  cropX.value = Math.max(0, Math.min(nextX, naturalWidth.value - size));
  cropY.value = Math.max(0, Math.min(nextY, naturalHeight.value - size));
};

const endDrag = () => {
  isDragging.value = false;
};

// Execute crop and save replacement image
const handleCropAndSave = async () => {
  if (!props.imageItem || !props.imageItem.id || !sourceImgRef.value || !imageLoaded.value || isSubmitting.value) return;

  isSubmitting.value = true;
  try {
    const croppedFile = await cropAndResizeSquareImage(sourceImgRef.value, {
      cropX: cropX.value,
      cropY: cropY.value,
      cropSize: effectiveCropSize.value,
      maxOutputSize: 500,
      mimeType: 'image/jpeg',
      fileName: `product-image-${props.imageItem.id}-cropped.jpg`
    });

    const updated = await productService.replaceProductImage(props.imageItem.id, croppedFile);
    toastSuccess('Product image cropped and replaced successfully.');
    emit('success', updated);
    emit('close');
  } catch (err: any) {
    handleApiError(err, 'Failed to crop and replace product image.');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <UiAdminModal
    :is-open="isOpen"
    title="Crop Product Image"
    subtitle="Reposition and crop image to a 1:1 square ratio (max 500×500px output)"
    max-width="max-w-xl"
    @close="emit('close')"
  >
    <div class="flex flex-col max-h-[80vh]">
      <!-- Scrollable Main Content -->
      <div class="p-6 space-y-5 overflow-y-auto flex-1">
        <!-- Loading & Error States -->
        <div v-if="!imageLoaded && !loadError" class="py-16 flex flex-col items-center justify-center text-center">
          <Loader2 class="w-8 h-8 animate-spin text-primary mb-3" />
          <p class="text-sm font-medium text-muted-foreground">Loading image for cropping...</p>
        </div>

        <div v-else-if="loadError" class="p-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium flex items-center gap-2">
          <AlertCircle class="w-5 h-5 shrink-0" />
          <span>{{ loadError }}</span>
        </div>

        <!-- Main Cropper Interface -->
        <template v-else>
          <div class="space-y-4">
            <!-- Viewport Box with 1:1 Overlay -->
            <div
              id="crop-viewport-container"
              class="relative w-full aspect-square max-h-[340px] bg-slate-950/90 rounded-2xl overflow-hidden cursor-move border border-border select-none flex items-center justify-center mx-auto"
              @mousedown="startDrag"
              @mousemove="onDrag"
              @mouseup="endDrag"
              @mouseleave="endDrag"
              @touchstart="startDrag"
              @touchmove="onDrag"
              @touchend="endDrag"
            >
              <!-- Background Image with Dim Overlay -->
              <img
                v-if="imageItem?.image"
                :src="imageItem.image"
                alt="Source crop target"
                class="w-full h-full object-contain pointer-events-none opacity-40 blur-[1px]"
              />

              <!-- Highlighted Crop Bounding Box -->
              <div
                class="absolute border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] pointer-events-none transition-all duration-75 flex items-center justify-center"
                :style="{
                  left: `${(cropX / naturalWidth) * 100}%`,
                  top: `${(cropY / naturalHeight) * 100}%`,
                  width: `${(effectiveCropSize / naturalWidth) * 100}%`,
                  height: `${(effectiveCropSize / naturalHeight) * 100}%`
                }"
              >
                <!-- 1:1 Grid Lines -->
                <div class="w-full h-full grid grid-cols-3 grid-rows-3 border border-white/20">
                  <div v-for="i in 9" :key="i" class="border border-white/10"></div>
                </div>
                <span class="absolute bottom-1 right-1.5 px-1.5 py-0.5 text-[9px] font-mono font-bold bg-primary text-primary-foreground rounded shadow-xs">
                  1:1 Square
                </span>
              </div>

              <!-- Hint overlay -->
              <div class="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-slate-200 text-[10px] font-medium flex items-center gap-1.5 pointer-events-none">
                <Move class="w-3 h-3 text-primary" />
                <span>Drag the crop box to select the area to keep.</span>
              </div>
            </div>

            <!-- Zoom & Reposition Controls -->
            <div class="p-4 bg-muted/30 border border-border rounded-xl space-y-3">
              <!-- Zoom Slider -->
              <div class="flex items-center justify-between gap-4">
                <label class="text-xs font-bold text-foreground flex items-center gap-1.5 shrink-0">
                  <ZoomIn class="w-3.5 h-3.5 text-primary" />
                  <span>Zoom Scale</span>
                </label>
                <div class="flex items-center gap-3 flex-1 max-w-xs">
                  <input
                    type="range"
                    v-model.number="zoomScale"
                    min="1.0"
                    max="3.0"
                    step="0.05"
                    class="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
                  />
                  <span class="text-xs font-mono font-bold text-foreground w-10 text-right">
                    {{ zoomScale.toFixed(2) }}x
                  </span>
                </div>
              </div>

              <!-- Alignment Presets -->
              <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50">
                <span class="text-[11px] font-semibold text-muted-foreground">Quick Align:</span>
                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    @click="alignCenter"
                    class="h-7 px-2.5 text-[11px] font-semibold rounded-lg border border-border bg-background hover:bg-muted text-foreground flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <AlignCenter class="w-3 h-3 text-primary" />
                    Center
                  </button>
                  <button
                    type="button"
                    @click="alignCorner('tl')"
                    class="h-7 px-2 font-mono text-[10px] font-semibold rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                    title="Top-Left"
                  >
                    Top-L
                  </button>
                  <button
                    type="button"
                    @click="alignCorner('tr')"
                    class="h-7 px-2 font-mono text-[10px] font-semibold rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                    title="Top-Right"
                  >
                    Top-R
                  </button>
                  <button
                    type="button"
                    @click="alignCorner('bl')"
                    class="h-7 px-2 font-mono text-[10px] font-semibold rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                    title="Bottom-Left"
                  >
                    Bot-L
                  </button>
                  <button
                    type="button"
                    @click="alignCorner('br')"
                    class="h-7 px-2 font-mono text-[10px] font-semibold rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                    title="Bottom-Right"
                  >
                    Bot-R
                  </button>
                </div>
              </div>
            </div>

            <!-- Metadata & Output Spec Summary -->
            <div class="flex items-center justify-between px-1 text-xs text-muted-foreground font-medium">
              <span class="inline-flex items-center gap-1">
                <span>Original:</span>
                <span class="font-mono font-bold text-foreground">{{ naturalWidth }} × {{ naturalHeight }} px</span>
              </span>
              <span class="inline-flex items-center gap-1">
                <span>Output Size:</span>
                <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {{ outputResolution }} × {{ outputResolution }} px (1:1)
                </span>
              </span>
            </div>
          </div>
        </template>
      </div>

      <!-- Pinned Dialog Footer Actions -->
      <div class="px-6 py-4 border-t border-border bg-card shrink-0 flex items-center justify-end gap-3">
        <UiButton
          variant="outline"
          class="h-9 px-4 text-xs font-bold rounded-xl"
          @click="emit('close')"
          :disabled="isSubmitting"
        >
          Cancel
        </UiButton>
        <UiButton
          variant="primary"
          class="h-9 px-4 text-xs font-bold rounded-xl gap-1.5"
          @click="handleCropAndSave"
          :disabled="isSubmitting || !imageLoaded || !imageItem || Boolean(loadError)"
        >
          <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
          <Crop v-else class="w-3.5 h-3.5" />
          <span>{{ isSubmitting ? 'Replacing...' : 'Crop & Replace' }}</span>
        </UiButton>
      </div>
    </div>
  </UiAdminModal>
</template>
