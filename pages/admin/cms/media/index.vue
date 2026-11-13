<!-- File: /pages/admin/cms/media/index.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { 
  Image as ImageIcon, 
  Upload, 
  RefreshCw, 
  Trash2, 
  AlertCircle,
  FileText
} from 'lucide-vue-next';
import { refDebounced } from '@vueuse/core';
import { useCmsService } from '@/composables/useCmsService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useAdminModalState } from '@/composables/useAdminModalState';
import { toastSuccess, toastError, extractErrorMessage } from '@/composables/useToast';
import type { CmsMedia } from '@/types/cms';
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

const mediaList = ref<CmsMedia[]>([]);
const totalCount = ref(0);
const totalPages = ref(1);
const isLoading = ref(false);
const fetchError = ref<string | null>(null);
const isDeleting = ref(false);

const searchQuery = ref(route.query.search ? String(route.query.search) : '');
const debouncedSearchQuery = refDebounced(searchQuery, 300);
const currentPage = ref(route.query.page ? parseInt(String(route.query.page)) || 1 : 1);
const itemsPerPage = ref(route.query.pageSize ? parseInt(String(route.query.pageSize)) || 12 : 12);

const modalState = useAdminModalState<CmsMedia>({
  getItems: async (id) => {
    const res = await cmsService.getMediaList({ page_size: 100 });
    const found = (res.results || []).find(m => String(m.id) === String(id));
    if (!found) throw new Error('Media not found');
    return found;
  },
  onResolveError: (id) => {
    toastError(`Media item #${id} could not be retrieved.`);
    modalState.closeModal({ replace: true });
  }
});

const selectedMedia = computed(() => modalState.activeEntity.value);

const fetchMedia = async () => {
  isLoading.value = true;
  fetchError.value = null;
  try {
    const res = await cmsService.getMediaList({
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

const handleDeleteMedia = async () => {
  const m = selectedMedia.value;
  if (!m) return;
  if (!canDelete.value) {
    toastError('You do not have permission to delete media.');
    return;
  }
  isDeleting.value = true;
  try {
    await cmsService.deleteMedia(m.id);
    toastSuccess('Media item deleted.');
    await modalState.closeModal();
    if (mediaList.value.length === 1 && currentPage.value > 1) currentPage.value--;
    await fetchMedia();
  } catch (err: any) {
    toastError(extractErrorMessage(err, 'Failed to delete media item.'));
  } finally {
    isDeleting.value = false;
  }
};

const tableColumns = computed<UiTableColumn<CmsMedia>[]>(() => [
  { key: 'preview', label: 'Preview', width: '100px', align: 'center' },
  { key: 'title', label: 'Title & Filename', width: '320px' },
  { key: 'file_size', label: 'Size', width: '120px' },
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
          CMS Media Library
        </h1>
      </div>
    </template>

    <template #header-actions>
      <div class="flex items-center gap-2">
        <UiButton variant="outline" class="rounded-xl h-9 px-3.5 gap-1.5 border-border font-bold text-xs" @click="fetchMedia" :disabled="isLoading">
          <RefreshCw :class="['w-3.5 h-3.5', isLoading && 'animate-spin']" />
          <span>Refresh</span>
        </UiButton>
        <UiButton v-if="canCreate" class="rounded-xl h-9 px-3.5 gap-1.5 shadow-md shadow-primary/10 bg-primary text-primary-foreground font-bold text-xs" @click="toastSuccess('Upload media modal')">
          <Upload class="w-3.5 h-3.5" />
          <span>Upload Media</span>
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
        <UiSearchInput v-model="searchQuery" placeholder="Search media by filename..." class="w-full sm:w-80" />
      </div>

      <div v-if="fetchError" class="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center justify-between text-destructive">
        <div class="flex items-center gap-3">
          <AlertCircle class="w-5 h-5 shrink-0" />
          <span class="text-xs font-medium">{{ fetchError }}</span>
        </div>
        <UiButton variant="outline" size="sm" class="h-8 text-xs border-destructive/30" @click="fetchMedia">Retry</UiButton>
      </div>

      <div class="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <UiTable :columns="tableColumns" :data="mediaList" :loading="isLoading" key-field="id" empty-text="No media items found">
          <template #cell-preview="{ item }">
            <div class="w-12 h-12 rounded-lg bg-muted border border-border overflow-hidden flex items-center justify-center">
              <img v-if="item.file" :src="item.file" :alt="item.alt_text || 'Media'" class="w-full h-full object-cover" />
              <ImageIcon v-else class="w-5 h-5 text-muted-foreground" />
            </div>
          </template>
          <template #cell-title="{ item }">
            <div class="space-y-0.5 py-1">
              <p class="font-bold text-xs text-foreground">{{ item.filename || 'Untitled' }}</p>
              <p class="font-mono text-[10px] text-muted-foreground truncate max-w-[240px]">{{ item.file }}</p>
            </div>
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
          <UiPagination v-model:current-page="currentPage" :total-pages="totalPages" :total-count="totalCount" :items-per-page="itemsPerPage" item-label="media items" />
        </div>
      </div>
    </div>

    <UiAdminModal :is-open="modalState.isDelete.value" title="Delete Media Item" subtitle="Are you sure you want to delete this media item?" @close="modalState.closeModal()">
      <div v-if="selectedMedia" class="space-y-4">
        <div class="p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3">
          <div class="w-12 h-12 rounded-lg bg-background border border-border overflow-hidden shrink-0 flex items-center justify-center">
            <img v-if="selectedMedia.file" :src="selectedMedia.file" class="w-full h-full object-cover" />
            <ImageIcon v-else class="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p class="font-bold text-sm text-foreground">{{ selectedMedia.filename || 'Untitled' }}</p>
            <p class="text-xs text-muted-foreground font-mono truncate max-w-[200px]">{{ selectedMedia.file }}</p>
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
