<!-- File: /pages/admin/cms/media/index.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { 
  Image as ImageIcon, 
  Upload, 
  RefreshCw, 
  Trash2, 
  AlertCircle,
  Loader2,
  FileUp,
  X
} from 'lucide-vue-next';
import { refDebounced } from '@vueuse/core';
import { useCmsService } from '@/composables/useCmsService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useAdminModalState } from '@/composables/useAdminModalState';
import { toastSuccess, toastError, extractErrorMessage } from '@/composables/useToast';
import type { CmsMediaImage } from '@/types/cms';
import type { UiTableColumn } from '@/components/ui/UiTable.vue';
import UiTable from '@/components/ui/UiTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import UiSearchInput from '@/components/ui/UiSearchInput.vue';
import UiAdminModal from '@/components/ui/UiAdminModal.vue';
import UiButton from '@/components/ui/Button.vue';
import UiCard from '@/components/ui/UiCard.vue';

definePageMeta({
  layout: false
});

const route = useRoute();
const router = useRouter();
const cmsService = useCmsService();
const { canViewModule, canCreateInModule, canDeleteInModule } = useAdminPermissions();

const canView = computed(() => canViewModule('/admin/cms/media'));
const canCreate = computed(() => canCreateInModule('/admin/cms/media'));
const canDelete = computed(() => canDeleteInModule('/admin/cms/media'));

const mediaList = ref<CmsMediaImage[]>([]);
const totalCount = ref(0);
const totalPages = ref(1);
const isLoading = ref(false);
const fetchError = ref<string | null>(null);
const isDeleting = ref(false);
const isSubmitting = ref(false);
const formError = ref<string | null>(null);

const searchQuery = ref(route.query.search ? String(route.query.search) : '');
const debouncedSearchQuery = refDebounced(searchQuery, 300);
const currentPage = ref(route.query.page ? parseInt(String(route.query.page)) || 1 : 1);
const itemsPerPage = ref(route.query.pageSize ? parseInt(String(route.query.pageSize)) || 12 : 12);

// Upload form state
const selectedFile = ref<File | null>(null);
const filePreviewUrl = ref<string | null>(null);
const altText = ref('');
const fileInputRef = ref<HTMLInputElement | null>(null);

const modalState = useAdminModalState<CmsMediaImage>({
  getItems: async (id) => {
    const res = await cmsService.getMediaImagesList({ page_size: 100 });
    const found = (res.results || []).find(m => String(m.id) === String(id));
    if (!found) throw new Error('Media not found');
    return found;
  },
  onResolveError: (id) => {
    toastError(`Media image #${id} could not be retrieved.`);
    modalState.closeModal({ replace: true });
  }
});

const selectedMedia = computed(() => modalState.activeEntity.value);

const fetchMedia = async () => {
  isLoading.value = true;
  fetchError.value = null;
  try {
    const res = await cmsService.getMediaImagesList({
      page: currentPage.value,
      page_size: itemsPerPage.value,
      search: debouncedSearchQuery.value || undefined
    });
    mediaList.value = res.results || [];
    totalCount.value = res.count || 0;
    totalPages.value = res.pages || Math.ceil(totalCount.value / itemsPerPage.value) || 1;
  } catch (err: any) {
    fetchError.value = extractErrorMessage(err, 'Failed to retrieve media library.');
  } finally {
    isLoading.value = false;
  }
};

const updateRouteAndFetch = () => {
  const query: Record<string, string | number | undefined> = {
    ...route.query,
    page: currentPage.value > 1 ? currentPage.value : undefined,
    pageSize: itemsPerPage.value !== 12 ? itemsPerPage.value : undefined,
    search: searchQuery.value.trim() || undefined
  };
  Object.keys(query).forEach((key) => {
    if (query[key] === undefined) delete query[key];
  });
  router.push({ query });
  fetchMedia();
};

watch(debouncedSearchQuery, () => {
  currentPage.value = 1;
  updateRouteAndFetch();
});

watch(currentPage, () => {
  updateRouteAndFetch();
});

watch(() => modalState.isCreate.value, (isCr) => {
  if (isCr) {
    selectedFile.value = null;
    filePreviewUrl.value = null;
    altText.value = '';
    formError.value = null;
  }
});

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    if (!file.type.startsWith('image/')) {
      formError.value = 'Please select a valid image file.';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      formError.value = 'File size must not exceed 10MB.';
      return;
    }
    formError.value = null;
    selectedFile.value = file;
    if (filePreviewUrl.value) URL.revokeObjectURL(filePreviewUrl.value);
    filePreviewUrl.value = URL.createObjectURL(file);
  }
};

const handleUploadImage = async () => {
  if (!selectedFile.value) {
    formError.value = 'Please select an image file to upload.';
    return;
  }
  if (!canCreate.value) {
    toastError('You do not have permission to upload media.');
    return;
  }

  isSubmitting.value = true;
  formError.value = null;

  try {
    await cmsService.uploadMediaImage({
      image: selectedFile.value,
      alt_text: altText.value.trim() || undefined
    });
    toastSuccess('Media image successfully uploaded.');
    modalState.closeModal();
    await fetchMedia();
  } catch (err: any) {
    formError.value = extractErrorMessage(err, 'Failed to upload media image.');
    toastError(formError.value);
  } finally {
    isSubmitting.value = false;
  }
};

const handleDeleteMedia = async () => {
  const m = selectedMedia.value;
  if (!m) return;
  if (!canDelete.value) {
    toastError('You do not have permission to delete media.');
    return;
  }
  isDeleting.value = true;
  try {
    await cmsService.deleteMediaImage(m.id);
    toastSuccess('Media image deleted.');
    await modalState.closeModal();
    if (mediaList.value.length === 1 && currentPage.value > 1) currentPage.value--;
    await fetchMedia();
  } catch (err: any) {
    toastError(extractErrorMessage(err, 'Failed to delete media image.'));
  } finally {
    isDeleting.value = false;
  }
};

const tableColumns = computed<UiTableColumn<CmsMediaImage>[]>(() => [
  { key: 'preview', label: 'Preview', width: '100px', align: 'center' },
  { key: 'title', label: 'Filename & Alt Text', width: '320px' },
  { key: 'dimensions', label: 'Dimensions', width: '130px' },
  { key: 'file_size', label: 'Size', width: '100px' },
  { key: 'created_at', label: 'Uploaded At', width: '180px' },
  { key: 'actions', label: 'Actions', width: '100px', align: 'right' }
]);

onMounted(async () => {
  if (canView.value) await fetchMedia();
});
</script>

<template>
  <NuxtLayout name="admin">
    <template #header-title>
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground/40 font-light select-none">/</span>
        <h1 class="text-xl font-display font-extrabold tracking-tight text-foreground">
          CMS Media Library (Images)
        </h1>
      </div>
    </template>

    <template #header-actions>
      <div class="flex items-center gap-2">
        <UiButton variant="outline" class="rounded-xl h-9 px-3.5 gap-1.5 border-border font-bold text-xs" @click="fetchMedia" :disabled="isLoading">
          <RefreshCw :class="['w-3.5 h-3.5', isLoading && 'animate-spin']" />
          <span>Refresh</span>
        </UiButton>
        <UiButton v-if="canCreate" class="rounded-xl h-9 px-3.5 gap-1.5 shadow-md shadow-primary/10 bg-primary text-primary-foreground font-bold text-xs" @click="modalState.openCreate()">
          <Upload class="w-3.5 h-3.5" />
          <span>Upload Image</span>
        </UiButton>
      </div>
    </template>

    <div v-if="!canView" class="p-8 text-center bg-card border border-border rounded-2xl shadow-xs">
      <AlertCircle class="w-12 h-12 text-destructive mx-auto mb-3" />
      <h2 class="text-lg font-bold text-foreground mb-1">Access Restricted</h2>
      <p class="text-sm text-muted-foreground">You do not have permission to view CMS Media Library.</p>
    </div>

    <div v-else class="space-y-4 animate-in fade-in duration-500">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border px-3.5 py-2.5 rounded-xl shadow-xs">
        <UiSearchInput v-model="searchQuery" placeholder="Search media by filename or alt text..." class="w-full sm:w-80" />
      </div>

      <div v-if="fetchError" class="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center justify-between text-destructive">
        <div class="flex items-center gap-3">
          <AlertCircle class="w-5 h-5 shrink-0" />
          <span class="text-xs font-medium">{{ fetchError }}</span>
        </div>
        <UiButton variant="outline" size="sm" class="h-8 text-xs border-destructive/30" @click="fetchMedia">Retry</UiButton>
      </div>

      <div class="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <UiTable :columns="tableColumns" :data="mediaList" :loading="isLoading" key-field="id" empty-text="No media images found">
          <template #cell-preview="{ item }">
            <div class="w-12 h-12 rounded-lg bg-muted border border-border overflow-hidden flex items-center justify-center">
              <img v-if="item.image" :src="item.image" :alt="item.alt_text || 'Media'" class="w-full h-full object-cover" />
              <ImageIcon v-else class="w-5 h-5 text-muted-foreground" />
            </div>
          </template>
          <template #cell-title="{ item }">
            <div class="space-y-0.5 py-1">
              <p class="font-bold text-xs text-foreground">{{ item.filename || 'Untitled' }}</p>
              <p v-if="item.alt_text" class="text-[11px] text-muted-foreground">Alt: {{ item.alt_text }}</p>
              <p class="font-mono text-[10px] text-muted-foreground truncate max-w-[200px]">{{ item.image }}</p>
            </div>
          </template>
          <template #cell-dimensions="{ item }">
            <span class="text-xs font-mono text-muted-foreground">{{ item.width && item.height ? `${item.width} × ${item.height}px` : '—' }}</span>
          </template>
          <template #cell-file_size="{ item }">
            <span class="text-xs font-mono text-muted-foreground">{{ item.file_size ? `${Math.round(item.file_size / 1024)} KB` : '—' }}</span>
          </template>
          <template #cell-created_at="{ item }">
            <span class="text-xs text-muted-foreground font-mono">{{ item.created_at ? new Date(item.created_at).toLocaleString() : '—' }}</span>
          </template>
          <template #cell-actions="{ item }">
            <div class="flex items-center justify-end gap-1">
              <UiButton v-if="canDelete" variant="ghost" size="sm" class="h-8 w-8 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-lg" title="Delete" @click="modalState.openDelete(item.id)">
                <Trash2 class="w-3.5 h-3.5" />
              </UiButton>
            </div>
          </template>
        </UiTable>
        <div v-if="totalCount > 0" class="border-t border-border px-3.5 py-2 bg-card">
          <UiPagination v-model:current-page="currentPage" :total-pages="totalPages" :total-count="totalCount" :items-per-page="itemsPerPage" item-label="media images" />
        </div>
      </div>
    </div>

    <!-- Upload Image Modal -->
    <UiAdminModal
      :is-open="modalState.isCreate.value"
      title="Upload Media Image"
      subtitle="Select an image file and add optional alt text."
      @close="modalState.closeModal()"
    >
      <div class="p-6 space-y-4">
        <div v-if="formError" class="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive flex items-center gap-2">
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ formError }}</span>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Image File *</label>
          <div 
            class="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 bg-muted/20"
            @click="fileInputRef?.click()"
          >
            <div v-if="filePreviewUrl" class="w-24 h-24 rounded-xl overflow-hidden border border-border shadow-xs">
              <img :src="filePreviewUrl" class="w-full h-full object-cover" />
            </div>
            <div v-else class="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <FileUp class="w-6 h-6" />
            </div>
            <div class="space-y-0.5">
              <p class="text-xs font-bold text-foreground">
                {{ selectedFile ? selectedFile.name : 'Click to select image or drag & drop' }}
              </p>
              <p class="text-[10px] text-muted-foreground">PNG, JPG, WEBP, SVG up to 10MB</p>
            </div>
            <input 
              ref="fileInputRef" 
              type="file" 
              accept="image/*" 
              class="hidden" 
              @change="handleFileSelect"
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Alt Text (Optional)</label>
          <input 
            v-model="altText" 
            type="text" 
            placeholder="Describe the image for accessibility..." 
            class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div class="flex items-center justify-end gap-2 pt-4 border-t border-border">
          <UiButton variant="outline" class="h-10 px-4 text-xs font-semibold rounded-xl" @click="modalState.closeModal()" :disabled="isSubmitting">Cancel</UiButton>
          <UiButton class="h-10 px-4 text-xs font-bold rounded-xl bg-primary text-primary-foreground shadow-sm" @click="handleUploadImage" :disabled="isSubmitting || !selectedFile">
            <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin mr-1.5" />
            <span>Upload Image</span>
          </UiButton>
        </div>
      </div>
    </UiAdminModal>

    <!-- Delete Confirmation Modal -->
    <UiAdminModal :is-open="modalState.isDelete.value" title="Delete Media Image" subtitle="Are you sure you want to delete this media image?" @close="modalState.closeModal()">
      <div v-if="selectedMedia" class="space-y-4 p-6">
        <div class="p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3">
          <div class="w-12 h-12 rounded-lg bg-background border border-border overflow-hidden shrink-0 flex items-center justify-center">
            <img v-if="selectedMedia.image" :src="selectedMedia.image" class="w-full h-full object-cover" />
            <ImageIcon v-else class="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p class="font-bold text-sm text-foreground">{{ selectedMedia.filename || 'Untitled' }}</p>
            <p class="text-xs text-muted-foreground font-mono truncate max-w-[200px]">{{ selectedMedia.image }}</p>
          </div>
        </div>
        <div class="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <UiButton variant="outline" class="h-9 px-4 text-xs font-semibold rounded-xl" @click="modalState.closeModal()" :disabled="isDeleting">Cancel</UiButton>
          <UiButton variant="destructive" class="h-9 px-4 text-xs font-semibold rounded-xl" @click="handleDeleteMedia" :disabled="isDeleting">Confirm Delete</UiButton>
        </div>
      </div>
    </UiAdminModal>
  </NuxtLayout>
</template>
