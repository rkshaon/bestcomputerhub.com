<!-- File: /features/admin/banners/components/BannerFormModal.vue -->
<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { 
  AlertCircle, 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  Clock, 
  X, 
  RefreshCw 
} from 'lucide-vue-next';
import { useBannerService } from '@/composables/useBannerService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { toastSuccess, extractErrorMessage } from '@/composables/useToast';
import type { Banner, BannerPlacement } from '@/types';
import UiAdminModal from '@/components/ui/UiAdminModal.vue';
import UiButton from '@/components/ui/Button.vue';

const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    mode?: 'create' | 'edit';
    banner?: Banner | null;
    placements?: BannerPlacement[];
    isResolving?: boolean;
  }>(),
  {
    mode: 'create',
    banner: null,
    placements: () => [],
    isResolving: false
  }
);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved'): void;
}>();

const bannerService = useBannerService();
const { canCreateInModule, canEditInModule } = useAdminPermissions();

const canCreate = computed(() => canCreateInModule('/admin/banners'));
const canEdit = computed(() => canEditInModule('/admin/banners'));

// Form & Image State
const isSubmitting = ref(false);
const formError = ref<string | null>(null);
const fieldErrors = ref<Record<string, string>>({});

const formPayload = ref({
  placement: '',
  title: '',
  subtitle: '',
  cta_text: '',
  cta_url: '',
  display_order: 0,
  is_active: true,
  start_at: '',
  end_at: ''
});

// Desktop Main Image
const selectedDesktopFile = ref<File | null>(null);
const desktopPreviewUrl = ref<string | null>(null);
const isDesktopDragOver = ref(false);
const desktopFileInputRef = ref<HTMLInputElement | null>(null);

// Mobile Optional Image
const selectedMobileFile = ref<File | null>(null);
const mobilePreviewUrl = ref<string | null>(null);
const isMobileDragOver = ref(false);
const mobileFileInputRef = ref<HTMLInputElement | null>(null);

// Cleanup Object URLs to prevent memory leaks
const cleanupObjectUrls = () => {
  if (desktopPreviewUrl.value && desktopPreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(desktopPreviewUrl.value);
  }
  if (mobilePreviewUrl.value && mobilePreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(mobilePreviewUrl.value);
  }
};

onBeforeUnmount(() => {
  cleanupObjectUrls();
});

// Convert ISO strings to datetime-local string format
const toDatetimeLocalValue = (isoStr: string | null | undefined): string => {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return '';
  }
};

// Convert datetime-local string value to ISO String or null
const toIsoStringOrNull = (datetimeLocalStr: string): string | null => {
  if (!datetimeLocalStr || !datetimeLocalStr.trim()) return null;
  try {
    const d = new Date(datetimeLocalStr);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
};

// File Selectors & Drag-and-Drop
const setDesktopFile = (file: File) => {
  if (!file.type.startsWith('image/')) {
    fieldErrors.value.image = 'Selected file must be an image (PNG, JPG, WebP, SVG).';
    return;
  }
  if (desktopPreviewUrl.value && desktopPreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(desktopPreviewUrl.value);
  }
  selectedDesktopFile.value = file;
  desktopPreviewUrl.value = URL.createObjectURL(file);
  if (fieldErrors.value.image) {
    delete fieldErrors.value.image;
  }
};

const handleDesktopFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    setDesktopFile(target.files[0]);
  }
};

const handleDesktopDrop = (e: DragEvent) => {
  isDesktopDragOver.value = false;
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    setDesktopFile(e.dataTransfer.files[0]);
  }
};

const removeDesktopImage = () => {
  if (desktopPreviewUrl.value && desktopPreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(desktopPreviewUrl.value);
  }
  selectedDesktopFile.value = null;
  desktopPreviewUrl.value = null;
  if (desktopFileInputRef.value) {
    desktopFileInputRef.value.value = '';
  }
};

const setMobileFile = (file: File) => {
  if (!file.type.startsWith('image/')) {
    fieldErrors.value.mobile_image = 'Selected file must be an image (PNG, JPG, WebP, SVG).';
    return;
  }
  if (mobilePreviewUrl.value && mobilePreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(mobilePreviewUrl.value);
  }
  selectedMobileFile.value = file;
  mobilePreviewUrl.value = URL.createObjectURL(file);
  if (fieldErrors.value.mobile_image) {
    delete fieldErrors.value.mobile_image;
  }
};

const handleMobileFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    setMobileFile(target.files[0]);
  }
};

const handleMobileDrop = (e: DragEvent) => {
  isMobileDragOver.value = false;
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    setMobileFile(e.dataTransfer.files[0]);
  }
};

const removeMobileImage = () => {
  if (mobilePreviewUrl.value && mobilePreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(mobilePreviewUrl.value);
  }
  selectedMobileFile.value = null;
  mobilePreviewUrl.value = null;
  if (mobileFileInputRef.value) {
    mobileFileInputRef.value.value = '';
  }
};

// Sync form state when modal open status, mode, or active banner changes
watch(
  [() => props.isOpen, () => props.mode, () => props.banner],
  ([isOpen, mode, banner]) => {
    if (!isOpen) return;

    formError.value = null;
    fieldErrors.value = {};

    if (mode === 'create') {
      cleanupObjectUrls();
      selectedDesktopFile.value = null;
      desktopPreviewUrl.value = null;
      selectedMobileFile.value = null;
      mobilePreviewUrl.value = null;

      formPayload.value = {
        placement: props.placements && props.placements[0]?.id ? String(props.placements[0].id) : '',
        title: '',
        subtitle: '',
        cta_text: '',
        cta_url: '',
        display_order: 0,
        is_active: true,
        start_at: '',
        end_at: ''
      };
    } else if (mode === 'edit' && banner) {
      cleanupObjectUrls();
      selectedDesktopFile.value = null;
      desktopPreviewUrl.value = null;
      selectedMobileFile.value = null;
      mobilePreviewUrl.value = null;

      formPayload.value = {
        placement: String(banner.placement),
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        cta_text: banner.cta_text || '',
        cta_url: banner.cta_url || '',
        display_order: banner.display_order ?? 0,
        is_active: banner.is_active ?? true,
        start_at: toDatetimeLocalValue(banner.start_at),
        end_at: toDatetimeLocalValue(banner.end_at)
      };

      if (banner.image) {
        desktopPreviewUrl.value = banner.image;
      }
      if (banner.mobile_image) {
        mobilePreviewUrl.value = banner.mobile_image;
      }
    }
  },
  { immediate: true }
);

// Fallback to auto-select initial placement if placements load asynchronously
watch(
  () => props.placements,
  (newPlacements) => {
    if (props.mode === 'create' && !formPayload.value.placement && newPlacements && newPlacements.length > 0 && newPlacements[0]) {
      formPayload.value.placement = String(newPlacements[0].id);
    }
  },
  { immediate: true }
);

// Form Validation Logic
const validateForm = (): boolean => {
  fieldErrors.value = {};
  formError.value = null;
  let isValid = true;

  if (!formPayload.value.placement) {
    fieldErrors.value.placement = 'Placement selection is required.';
    isValid = false;
  }

  if (props.mode === 'create' && !selectedDesktopFile.value) {
    fieldErrors.value.image = 'Desktop main image is required for new banners.';
    isValid = false;
  }

  const parsedOrder = Number(formPayload.value.display_order);
  if (isNaN(parsedOrder) || parsedOrder < 0 || !Number.isInteger(parsedOrder)) {
    fieldErrors.value.display_order = 'Display order must be a non-negative integer.';
    isValid = false;
  }

  if (formPayload.value.start_at && formPayload.value.end_at) {
    const startDate = new Date(formPayload.value.start_at);
    const endDate = new Date(formPayload.value.end_at);
    if (endDate <= startDate) {
      fieldErrors.value.end_at = 'Schedule End date/time must be later than Start date/time.';
      isValid = false;
    }
  }

  return isValid;
};

// Form Submission Handler (Create & Edit)
const handleFormSubmit = async () => {
  if (!validateForm()) {
    formError.value = 'Please fix the highlighted errors before submitting.';
    return;
  }

  isSubmitting.value = true;
  formError.value = null;

  try {
    if (props.mode === 'create') {
      if (!canCreate.value) {
        formError.value = 'You do not have permission to create banners.';
        isSubmitting.value = false;
        return;
      }

      const formData = new FormData();
      formData.append('placement', String(formPayload.value.placement));
      formData.append('title', formPayload.value.title.trim());
      formData.append('subtitle', formPayload.value.subtitle.trim());
      formData.append('cta_text', formPayload.value.cta_text.trim());
      formData.append('cta_url', formPayload.value.cta_url.trim());
      formData.append('display_order', String(formPayload.value.display_order));
      formData.append('is_active', formPayload.value.is_active ? 'true' : 'false');

      const startIso = toIsoStringOrNull(formPayload.value.start_at);
      if (startIso) formData.append('start_at', startIso);

      const endIso = toIsoStringOrNull(formPayload.value.end_at);
      if (endIso) formData.append('end_at', endIso);

      if (selectedDesktopFile.value) {
        formData.append('image', selectedDesktopFile.value);
      }
      if (selectedMobileFile.value) {
        formData.append('mobile_image', selectedMobileFile.value);
      }

      await bannerService.createBanner(formData);
      toastSuccess('New banner successfully created.');
      cleanupObjectUrls();
      emit('saved');
      emit('close');
    } else if (props.mode === 'edit' && props.banner) {
      if (!canEdit.value) {
        formError.value = 'You do not have permission to edit banners.';
        isSubmitting.value = false;
        return;
      }

      const targetId = props.banner.id;
      const startIso = toIsoStringOrNull(formPayload.value.start_at);
      const endIso = toIsoStringOrNull(formPayload.value.end_at);

      if (selectedDesktopFile.value || selectedMobileFile.value) {
        // Multipart payload if files were replaced
        const formData = new FormData();
        formData.append('placement', String(formPayload.value.placement));
        formData.append('title', formPayload.value.title.trim());
        formData.append('subtitle', formPayload.value.subtitle.trim());
        formData.append('cta_text', formPayload.value.cta_text.trim());
        formData.append('cta_url', formPayload.value.cta_url.trim());
        formData.append('display_order', String(formPayload.value.display_order));
        formData.append('is_active', formPayload.value.is_active ? 'true' : 'false');

        if (startIso !== null) formData.append('start_at', startIso);
        else formData.append('start_at', '');

        if (endIso !== null) formData.append('end_at', endIso);
        else formData.append('end_at', '');

        if (selectedDesktopFile.value) {
          formData.append('image', selectedDesktopFile.value);
        }
        if (selectedMobileFile.value) {
          formData.append('mobile_image', selectedMobileFile.value);
        }

        await bannerService.updateBanner(targetId, formData);
      } else {
        // JSON payload if images were preserved
        const payload = {
          placement: Number(formPayload.value.placement),
          title: formPayload.value.title.trim(),
          subtitle: formPayload.value.subtitle.trim(),
          cta_text: formPayload.value.cta_text.trim(),
          cta_url: formPayload.value.cta_url.trim(),
          display_order: Number(formPayload.value.display_order),
          is_active: formPayload.value.is_active,
          start_at: startIso,
          end_at: endIso
        };
        await bannerService.updateBanner(targetId, payload);
      }

      toastSuccess(`Banner #${targetId} updated successfully.`);
      cleanupObjectUrls();
      emit('saved');
      emit('close');
    }
  } catch (err: any) {
    formError.value = extractErrorMessage(err, 'Failed to save banner.');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <UiAdminModal
    :is-open="isOpen"
    :title="mode === 'create' ? 'Add New Banner' : 'Edit Banner'"
    :subtitle="mode === 'create' ? 'Configure placement, layout, creative assets, and scheduling.' : 'Update banner details, imagery, schedule, or status.'"
    max-width="max-w-3xl"
    @close="emit('close')"
  >
    <form @submit.prevent="handleFormSubmit" class="w-full relative overflow-hidden flex flex-col cursor-default">
      <!-- Scrollable Form Fields -->
      <div class="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[60vh]">
        <!-- Error Banner -->
        <div v-if="formError" class="p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive text-xs font-medium">
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ formError }}</span>
        </div>

        <!-- Section 1: Placement, Order & Status -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-muted/30 p-3.5 rounded-xl border border-border">
          <!-- Placement Selection -->
          <div class="sm:col-span-2 space-y-1.5">
            <label class="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Placement Zone <span class="text-destructive">*</span></span>
            </label>
            <select
              v-model="formPayload.placement"
              class="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
            >
              <option value="" disabled>Select Placement</option>
              <option v-for="p in placements" :key="p.id" :value="String(p.id)">
                {{ p.name }} ({{ p.code }})
              </option>
            </select>
            <p v-if="fieldErrors.placement" class="text-[11px] text-destructive font-medium">{{ fieldErrors.placement }}</p>
          </div>

          <!-- Display Order -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">
              Display Order
            </label>
            <input
              type="number"
              v-model.number="formPayload.display_order"
              min="0"
              class="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <p v-if="fieldErrors.display_order" class="text-[11px] text-destructive font-medium">{{ fieldErrors.display_order }}</p>
          </div>

          <!-- Active Status Toggle -->
          <div class="sm:col-span-3 pt-1 flex items-center justify-between bg-card p-2.5 rounded-lg border border-border">
            <div class="space-y-0.5">
              <span class="text-xs font-bold text-foreground">Is Active</span>
              <p class="text-[11px] text-muted-foreground">Unchecking hides this banner from the storefront when available.</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="formPayload.is_active" class="sr-only peer" />
              <div class="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        <!-- Section 2: Banner Text & Call to Action -->
        <div class="space-y-3.5">
          <h3 class="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <FileText class="w-3.5 h-3.5" />
            <span>Copywriting & Action Link</span>
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <!-- Title -->
            <div class="space-y-1.5 sm:col-span-2">
              <label class="text-xs font-bold text-foreground">Main Title / Headline</label>
              <input
                type="text"
                v-model="formPayload.title"
                placeholder="e.g., Summer Gaming Sale 2026"
                class="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <!-- Subtitle -->
            <div class="space-y-1.5 sm:col-span-2">
              <label class="text-xs font-bold text-foreground">Subtitle / Promotional Description</label>
              <textarea
                v-model="formPayload.subtitle"
                rows="2"
                placeholder="e.g., Get up to 40% off top gaming laptops & high-performance components."
                class="w-full p-2.5 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              ></textarea>
            </div>

            <!-- CTA Text -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-foreground">CTA Button Label</label>
              <input
                type="text"
                v-model="formPayload.cta_text"
                placeholder="e.g., Shop Now"
                class="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <!-- CTA URL -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-foreground">Target Action URL</label>
              <input
                type="text"
                v-model="formPayload.cta_url"
                placeholder="e.g., /product-category/gaming-component/laptop/"
                class="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
        </div>

        <!-- Section 3: Creative Imagery (Desktop & Mobile Upload) -->
        <div class="space-y-3.5">
          <h3 class="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <ImageIcon class="w-3.5 h-3.5" />
            <span>Banner Imagery</span>
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Desktop / Main Image Upload Zone -->
            <div class="space-y-2">
              <label class="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Desktop Image <span class="text-destructive" v-if="mode === 'create'">*</span></span>
                <span class="text-[10px] text-muted-foreground font-normal">High-res landscape</span>
              </label>

              <div
                @dragover.prevent="isDesktopDragOver = true"
                @dragleave.prevent="isDesktopDragOver = false"
                @drop.prevent="handleDesktopDrop"
                :class="[
                  'relative min-h-[140px] rounded-xl border-2 border-dashed p-3 transition-all flex flex-col items-center justify-center text-center',
                  isDesktopDragOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 hover:bg-muted/40',
                  fieldErrors.image ? 'border-destructive' : ''
                ]"
              >
                <input
                  ref="desktopFileInputRef"
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  class="sr-only"
                  @change="handleDesktopFileChange"
                />

                <!-- Image Preview State -->
                <div v-if="desktopPreviewUrl" class="w-full space-y-2">
                  <div class="relative w-full h-24 rounded-lg bg-black/5 overflow-hidden border border-border group">
                    <img :src="desktopPreviewUrl" alt="Desktop Preview" class="w-full h-full object-cover" />
                    <button
                      type="button"
                      class="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background text-foreground shadow-xs transition-all"
                      title="Remove Image"
                      @click="removeDesktopImage"
                    >
                      <X class="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div class="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                    <span class="truncate max-w-[180px] font-mono">{{ selectedDesktopFile?.name || 'Existing Image' }}</span>
                    <button
                      type="button"
                      class="text-primary font-bold hover:underline"
                      @click="desktopFileInputRef?.click()"
                    >
                      Replace
                    </button>
                  </div>
                </div>

                <!-- Empty Upload Prompt -->
                <div v-else class="space-y-2 py-2 cursor-pointer" @click="desktopFileInputRef?.click()">
                  <div class="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <UploadCloud class="w-5 h-5" />
                  </div>
                  <div>
                    <p class="text-xs font-semibold text-foreground">Click or drag image here</p>
                    <p class="text-[10px] text-muted-foreground">PNG, JPG, WebP, SVG up to 10MB</p>
                  </div>
                </div>
              </div>
              <p v-if="fieldErrors.image" class="text-[11px] text-destructive font-medium">{{ fieldErrors.image }}</p>
            </div>

            <!-- Mobile Optional Image Upload Zone -->
            <div class="space-y-2">
              <label class="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Mobile Image</span>
                <span class="text-[10px] text-muted-foreground font-normal">Optional aspect portrait</span>
              </label>

              <div
                @dragover.prevent="isMobileDragOver = true"
                @dragleave.prevent="isMobileDragOver = false"
                @drop.prevent="handleMobileDrop"
                :class="[
                  'relative min-h-[140px] rounded-xl border-2 border-dashed p-3 transition-all flex flex-col items-center justify-center text-center',
                  isMobileDragOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 hover:bg-muted/40',
                  fieldErrors.mobile_image ? 'border-destructive' : ''
                ]"
              >
                <input
                  ref="mobileFileInputRef"
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  class="sr-only"
                  @change="handleMobileFileChange"
                />

                <!-- Image Preview State -->
                <div v-if="mobilePreviewUrl" class="w-full space-y-2">
                  <div class="relative w-full h-24 rounded-lg bg-black/5 overflow-hidden border border-border group">
                    <img :src="mobilePreviewUrl" alt="Mobile Preview" class="w-full h-full object-cover" />
                    <button
                      type="button"
                      class="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background text-foreground shadow-xs transition-all"
                      title="Remove Mobile Image"
                      @click="removeMobileImage"
                    >
                      <X class="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div class="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                    <span class="truncate max-w-[180px] font-mono">{{ selectedMobileFile?.name || 'Existing Mobile Image' }}</span>
                    <button
                      type="button"
                      class="text-primary font-bold hover:underline"
                      @click="mobileFileInputRef?.click()"
                    >
                      Replace
                    </button>
                  </div>
                </div>

                <!-- Empty Upload Prompt -->
                <div v-else class="space-y-2 py-2 cursor-pointer" @click="mobileFileInputRef?.click()">
                  <div class="w-9 h-9 rounded-full bg-muted text-muted-foreground flex items-center justify-center mx-auto">
                    <UploadCloud class="w-5 h-5" />
                  </div>
                  <div>
                    <p class="text-xs font-semibold text-foreground">Click or drag mobile image</p>
                    <p class="text-[10px] text-muted-foreground">Falls back to desktop image if omitted</p>
                  </div>
                </div>
              </div>
              <p v-if="fieldErrors.mobile_image" class="text-[11px] text-destructive font-medium">{{ fieldErrors.mobile_image }}</p>
            </div>
          </div>
        </div>

        <!-- Section 4: Schedule Display Window -->
        <div class="space-y-3.5 pt-1">
          <h3 class="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Clock class="w-3.5 h-3.5" />
            <span>Schedule Window (Optional)</span>
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-muted/20 p-3.5 rounded-xl border border-border">
            <!-- Start At -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-foreground">Publish Start Date & Time</label>
              <input
                type="datetime-local"
                v-model="formPayload.start_at"
                class="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <p class="text-[10px] text-muted-foreground">Leave empty to activate immediately.</p>
            </div>

            <!-- End At -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-foreground">Expiration End Date & Time</label>
              <input
                type="datetime-local"
                v-model="formPayload.end_at"
                class="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <p v-if="fieldErrors.end_at" class="text-[11px] text-destructive font-medium">{{ fieldErrors.end_at }}</p>
              <p v-else class="text-[10px] text-muted-foreground">Leave empty to keep published indefinitely.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Footer Actions (Fixed) -->
      <div class="flex items-center justify-end gap-2.5 px-6 md:px-8 py-4 border-t border-border bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
        <UiButton 
          type="button" 
          variant="outline" 
          class="h-9 px-4 text-xs font-semibold rounded-xl"
          @click="emit('close')"
          :disabled="isSubmitting"
        >
          Cancel
        </UiButton>
        <UiButton 
          type="submit" 
          class="h-9 px-4 text-xs font-bold rounded-xl shadow-md bg-primary text-primary-foreground gap-1.5"
          :disabled="isSubmitting"
        >
          <RefreshCw v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
          <span>{{ mode === 'create' ? 'Create Banner' : 'Save Changes' }}</span>
        </UiButton>
      </div>
    </form>
  </UiAdminModal>
</template>
