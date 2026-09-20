<!-- File: /features/admin/categories/components/CategoryFeaturedIconModal.vue -->
<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Trash2, 
  Loader2, 
  AlertCircle 
} from 'lucide-vue-next';
import UiAdminModal from '@/components/ui/UiAdminModal.vue';
import UiButton from '@/components/ui/Button.vue';
import { cn, decodeHtmlEntities } from '@/utils';
import { validateFeaturedCategoryIcon } from '@/utils/imageValidation';
import { useCategoryService } from '@/composables/useCategoryService';
import { toastSuccess, toastError, handleApiError, extractErrorMessage } from '@/composables/useToast';
import type { Category } from '@/types';

interface Props {
  isOpen: boolean;
  category: Category | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'updated', updatedCategory: Category): void;
}>();

const categoryService = useCategoryService();

// Local state for Icon Upload & Management
const selectedIconFile = ref<File | null>(null);
const selectedIconPreviewUrl = ref<string | null>(null);
const iconValidationError = ref<string | null>(null);
const isIconUploading = ref(false);
const isIconDeleting = ref(false);
const isDeleteIconConfirmOpen = ref(false);
const isIconDragActive = ref(false);
const iconFileInput = ref<HTMLInputElement | null>(null);

const clearIconPreview = () => {
  if (selectedIconPreviewUrl.value) {
    URL.revokeObjectURL(selectedIconPreviewUrl.value);
    selectedIconPreviewUrl.value = null;
  }
};

const handleClose = () => {
  selectedIconFile.value = null;
  clearIconPreview();
  iconValidationError.value = null;
  isDeleteIconConfirmOpen.value = false;
  isIconDragActive.value = false;
  emit('close');
};

watch(() => props.isOpen, (newVal) => {
  if (!newVal) {
    selectedIconFile.value = null;
    clearIconPreview();
    iconValidationError.value = null;
    isDeleteIconConfirmOpen.value = false;
    isIconDragActive.value = false;
  }
});

watch(() => props.category, () => {
  selectedIconFile.value = null;
  clearIconPreview();
  iconValidationError.value = null;
});

onBeforeUnmount(() => {
  clearIconPreview();
});

const handleIconFileChange = async (file: File | null) => {
  clearIconPreview();
  iconValidationError.value = null;
  selectedIconFile.value = null;

  if (!file) return;

  const valResult = await validateFeaturedCategoryIcon(file);
  if (!valResult.valid) {
    iconValidationError.value = valResult.error || 'Invalid icon file.';
    return;
  }

  selectedIconFile.value = file;
  selectedIconPreviewUrl.value = URL.createObjectURL(file);
};

const onIconDragOver = (e: DragEvent) => {
  e.preventDefault();
  isIconDragActive.value = true;
};

const onIconDragLeave = (e: DragEvent) => {
  e.preventDefault();
  isIconDragActive.value = false;
};

const onIconDrop = (e: DragEvent) => {
  e.preventDefault();
  isIconDragActive.value = false;
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    handleIconFileChange(e.dataTransfer.files[0] ?? null);
  }
};

const handleUploadFeaturedIcon = async () => {
  if (!props.category || !selectedIconFile.value || iconValidationError.value) return;

  const categoryId = props.category.id;
  try {
    isIconUploading.value = true;
    const updatedCategory = await categoryService.uploadFeaturedCategoryIcon(categoryId, selectedIconFile.value);

    toastSuccess('Featured icon updated successfully.');

    emit('updated', updatedCategory);
    handleClose();
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to upload featured icon.');
    toastError(msg);
    iconValidationError.value = msg;
  } finally {
    isIconUploading.value = false;
  }
};

const handleDeleteFeaturedIcon = async () => {
  if (!props.category) return;

  if (props.category.is_featured === true) {
    toastError('Cannot delete icon while category is featured. Unfeature the category first.');
    return;
  }

  const categoryId = props.category.id;
  try {
    isIconDeleting.value = true;
    const res = await categoryService.deleteFeaturedCategoryIcon(categoryId);

    toastSuccess('Featured icon deleted successfully.');

    isDeleteIconConfirmOpen.value = false;
    const updatedCat: Category = (typeof res === 'object' && res !== null) 
      ? res 
      : { ...props.category, featured_icon: null };
    emit('updated', updatedCat);
    handleClose();
  } catch (err: any) {
    handleApiError(err, 'Failed to delete featured icon.');
  } finally {
    isIconDeleting.value = false;
  }
};
</script>

<template>
  <div>
    <!-- Featured Icon Management Modal -->
    <UiAdminModal
      :is-open="isOpen && !!category"
      max-width="max-w-lg"
      title="Manage Featured Icon"
      @close="handleClose"
    >
      <div class="p-6 space-y-6">
        <!-- Category Summary Header -->
        <div class="flex items-center gap-4 p-4 bg-muted/40 rounded-2xl border border-border">
          <div class="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center text-xl shrink-0 overflow-hidden p-1">
            <img v-if="category?.featured_icon" :src="category.featured_icon" alt="Featured Icon" class="w-full h-full object-contain" />
            <span v-else>{{ category?.icon || '📁' }}</span>
          </div>
          <div class="min-w-0 flex-1">
            <h4 class="text-sm font-bold text-foreground truncate">{{ decodeHtmlEntities(category?.name || '') }}</h4>
            <div class="flex items-center gap-2 mt-1 flex-wrap">
              <span class="text-[10px] font-mono text-muted-foreground uppercase font-semibold">/{{ category?.slug }}</span>
              <span v-if="category?.is_featured" class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Featured Category
              </span>
              <span v-else class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-muted text-muted-foreground border border-border">
                Not Featured
              </span>
            </div>
          </div>
        </div>

        <!-- Current Icon Status & Delete Action -->
        <div class="space-y-2">
          <label class="text-[10px] uppercase font-bold tracking-widest text-muted-foreground ml-0.5">Current Featured Icon</label>
          <div v-if="category?.featured_icon" class="p-4 bg-background border border-border rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-12 h-12 rounded-xl border border-border bg-muted/30 p-1 flex items-center justify-center overflow-hidden shrink-0">
                <img :src="category.featured_icon" alt="Current Featured Icon" class="w-full h-full object-contain" />
              </div>
              <div class="min-w-0">
                <p class="text-xs font-bold text-foreground">Custom Featured Icon Active</p>
                <p class="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">{{ category.featured_icon }}</p>
              </div>
            </div>

            <!-- Delete Icon Action -->
            <div class="flex flex-col items-end gap-1 shrink-0">
              <UiButton
                type="button"
                size="sm"
                variant="outline"
                class="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 h-8 px-3 text-xs font-bold gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="category?.is_featured === true || isIconDeleting"
                @click="isDeleteIconConfirmOpen = true"
                title="Delete featured icon"
              >
                <Trash2 class="w-3.5 h-3.5" />
                <span>Delete Icon</span>
              </UiButton>
              <span v-if="category?.is_featured === true" class="text-[9px] text-amber-600 dark:text-amber-400 font-semibold max-w-[160px] text-right leading-tight">
                Cannot delete icon while category is featured. Unfeature first.
              </span>
            </div>
          </div>
          <div v-else class="p-4 bg-muted/20 border border-dashed border-border rounded-2xl flex items-center gap-3 text-xs text-muted-foreground">
            <div class="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <ImageIcon class="w-4 h-4 text-muted-foreground" />
            </div>
            <span>No custom featured icon uploaded yet for this category.</span>
          </div>
        </div>

        <!-- Selected New File Preview -->
        <div v-if="selectedIconFile && selectedIconPreviewUrl" class="space-y-2 animate-in fade-in duration-200">
          <label class="text-[10px] uppercase font-bold tracking-widest text-primary font-bold ml-0.5">New Icon Selected for Upload</label>
          <div class="p-4 bg-primary/5 border border-primary/30 rounded-2xl flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-12 h-12 rounded-xl border border-primary/30 bg-background p-1 flex items-center justify-center overflow-hidden shrink-0">
                <img :src="selectedIconPreviewUrl" alt="Selected Icon Preview" class="w-full h-full object-contain" />
              </div>
              <div class="min-w-0">
                <p class="text-xs font-bold text-foreground truncate">{{ selectedIconFile.name }}</p>
                <p class="text-[10px] text-muted-foreground font-mono">
                  Size: {{ (selectedIconFile.size / 1024).toFixed(1) }} KB
                </p>
              </div>
            </div>
            <button
              type="button"
              @click="selectedIconFile = null; clearIconPreview(); iconValidationError = null;"
              class="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors cursor-pointer"
              title="Remove selected file"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- File Upload Dropzone -->
        <div class="space-y-2">
          <label class="text-[10px] uppercase font-bold tracking-widest text-muted-foreground ml-0.5">
            {{ category?.featured_icon ? 'Replace Icon File' : 'Upload Icon File' }}
          </label>
          <div
            @dragover="onIconDragOver"
            @dragleave="onIconDragLeave"
            @drop="onIconDrop"
            @click="iconFileInput?.click()"
            :class="cn(
              'border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all space-y-2 min-h-[140px]',
              isIconDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50 bg-muted/20'
            )"
          >
            <input
              ref="iconFileInput"
              type="file"
              class="hidden"
              accept="image/png,image/webp,image/svg+xml,.png,.webp,.svg"
              @change="(e) => { const files = (e.target as HTMLInputElement).files; if (files && files.length) handleIconFileChange(files[0] ?? null); }"
            />
            <div class="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-muted-foreground shadow-2xs">
              <Upload class="w-5 h-5" />
            </div>
            <div class="space-y-0.5">
              <p class="text-xs font-bold text-foreground">
                Drag & drop icon file here, or <span class="text-primary hover:underline">browse</span>
              </p>
              <p class="text-[10px] text-muted-foreground">
                Supported: <span class="font-bold uppercase text-foreground">PNG, WebP, SVG</span> (Max: 100KB)
              </p>
              <p class="text-[10px] text-muted-foreground font-medium">
                PNG/WebP required dimensions: <span class="font-bold text-foreground">64×64 px (Square)</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Validation Error Banner -->
        <div v-if="iconValidationError" class="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2.5 text-xs text-destructive font-medium animate-in fade-in duration-200">
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ iconValidationError }}</span>
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <UiButton
            type="button"
            variant="outline"
            class="rounded-xl h-10 px-5 text-xs font-bold cursor-pointer"
            @click="handleClose"
            :disabled="isIconUploading"
          >
            Cancel
          </UiButton>
          <UiButton
            type="button"
            class="rounded-xl h-10 px-5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 gap-2 cursor-pointer disabled:opacity-50"
            :disabled="!selectedIconFile || !!iconValidationError || isIconUploading"
            @click="handleUploadFeaturedIcon"
          >
            <Loader2 v-if="isIconUploading" class="w-4 h-4 animate-spin" />
            <Upload v-else class="w-3.5 h-3.5" />
            <span>{{ category?.featured_icon ? 'Replace Featured Icon' : 'Upload Featured Icon' }}</span>
          </UiButton>
        </div>
      </div>
    </UiAdminModal>

    <!-- Delete Featured Icon Confirmation Modal -->
    <UiAdminModal
      :is-open="isDeleteIconConfirmOpen && !!category"
      max-width="max-w-md"
      :show-close-button="false"
      @close="isDeleteIconConfirmOpen = false"
    >
      <div class="p-6 space-y-6">
        <div class="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <Trash2 class="w-6 h-6" />
        </div>

        <div>
          <h3 class="text-lg font-bold text-foreground">Delete Featured Icon</h3>
          <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Are you sure you want to delete the featured icon for Category <span class="font-bold text-foreground">"{{ decodeHtmlEntities(category?.name || '') }}"</span>? This will remove the icon asset from the category.
          </p>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <UiButton
            variant="outline"
            class="rounded-xl h-10 px-5 text-xs font-bold cursor-pointer"
            @click="isDeleteIconConfirmOpen = false"
            :disabled="isIconDeleting"
          >
            Cancel
          </UiButton>

          <UiButton
            class="rounded-xl h-10 px-5 text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2 cursor-pointer"
            @click="handleDeleteFeaturedIcon"
            :disabled="isIconDeleting"
          >
            <Loader2 v-if="isIconDeleting" class="w-4 h-4 animate-spin" />
            <Trash2 v-else class="w-3.5 h-3.5" />
            <span>Delete Icon</span>
          </UiButton>
        </div>
      </div>
    </UiAdminModal>
  </div>
</template>
