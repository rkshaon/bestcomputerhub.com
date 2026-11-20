<!-- File: /pages/admin/cms/redirects/index.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { 
  Globe, 
  Plus, 
  RefreshCw, 
  Edit2, 
  Trash2, 
  AlertCircle,
  ArrowRight
} from 'lucide-vue-next';
import { refDebounced } from '@vueuse/core';
import { useCmsService } from '@/composables/useCmsService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useAdminModalState } from '@/composables/useAdminModalState';
import { toastSuccess, toastError, extractErrorMessage } from '@/composables/useToast';
import type { CmsRedirect } from '@/types/cms';
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
const { canViewModule, canCreateInModule, canEditInModule, canDeleteInModule } = useAdminPermissions();

const canView = computed(() => canViewModule('/admin/cms/redirects'));
const canCreate = computed(() => canCreateInModule('/admin/cms/redirects'));
const canEdit = computed(() => canEditInModule('/admin/cms/redirects'));
const canDelete = computed(() => canDeleteInModule('/admin/cms/redirects'));

const redirectsList = ref<CmsRedirect[]>([]);
const filteredRedirects = ref<CmsRedirect[]>([]);
const totalCount = ref(0);
const totalPages = ref(1);
const isLoading = ref(false);
const fetchError = ref<string | null>(null);
const isDeleting = ref(false);

const searchQuery = ref(route.query.search ? String(route.query.search) : '');
const debouncedSearchQuery = refDebounced(searchQuery, 300);
const currentPage = ref(route.query.page ? parseInt(String(route.query.page)) || 1 : 1);
const itemsPerPage = ref(route.query.pageSize ? parseInt(String(route.query.pageSize)) || 10 : 10);

const modalState = useAdminModalState<CmsRedirect>({
  getItems: async (id) => {
    const list = await cmsService.getRedirects();
    const found = list.find(r => String(r.id) === String(id));
    if (!found) throw new Error('Redirect not found');
    return found;
  },
  onResolveError: (id) => {
    toastError(`Redirect #${id} could not be retrieved.`);
    modalState.closeModal({ replace: true });
  }
});

const selectedRedirect = computed(() => modalState.activeEntity.value);

const fetchRedirects = async () => {
  isLoading.value = true;
  fetchError.value = null;
  try {
    const all = await cmsService.getRedirects();
    const query = debouncedSearchQuery.value.trim().toLowerCase();
    const filtered = query 
      ? all.filter(r => r.old_path.toLowerCase().includes(query) || r.new_path.toLowerCase().includes(query))
      : all;

    totalCount.value = filtered.length;
    totalPages.value = Math.ceil(totalCount.value / itemsPerPage.value) || 1;

    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    redirectsList.value = all;
    filteredRedirects.value = filtered.slice(start, end);
  } catch (err: any) {
    fetchError.value = extractErrorMessage(err, 'Failed to retrieve redirects.');
  } finally {
    isLoading.value = false;
  }
};

const updateRouteAndFetch = () => {
  const query: Record<string, string | number | undefined> = {
    ...route.query,
    page: currentPage.value > 1 ? currentPage.value : undefined,
    pageSize: itemsPerPage.value !== 10 ? itemsPerPage.value : undefined,
    search: searchQuery.value.trim() || undefined
  };
  Object.keys(query).forEach((key) => {
    if (query[key] === undefined) delete query[key];
  });
  router.push({ query });
  fetchRedirects();
};

watch(debouncedSearchQuery, () => {
  currentPage.value = 1;
  updateRouteAndFetch();
});

watch(currentPage, () => {
  updateRouteAndFetch();
});

const handleDeleteRedirect = async () => {
  const r = selectedRedirect.value;
  if (!r) return;
  if (!canDelete.value) {
    toastError('You do not have permission to delete redirects.');
    return;
  }
  isDeleting.value = true;
  try {
    await cmsService.deleteRedirect(r.id);
    toastSuccess('Redirect deleted.');
    await modalState.closeModal();
    if (filteredRedirects.value.length === 1 && currentPage.value > 1) currentPage.value--;
    await fetchRedirects();
  } catch (err: any) {
    toastError(extractErrorMessage(err, 'Failed to delete redirect.'));
  } finally {
    isDeleting.value = false;
  }
};

const tableColumns = computed<UiTableColumn<CmsRedirect>[]>(() => [
  { key: 'old_path', label: 'Source Path', width: '250px' },
  { key: 'new_path', label: 'Destination Path', width: '250px' },
  { key: 'is_permanent', label: 'Permanent (301)', width: '130px', align: 'center' },
  { key: 'created_at', label: 'Created At', width: '180px' },
  { key: 'actions', label: 'Actions', width: '100px', align: 'right' }
]);

onMounted(async () => {
  if (canView.value) await fetchRedirects();
});
</script>

<template>
  <NuxtLayout name="admin">
    <template #header-title>
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground/40 font-light select-none">/</span>
        <h1 class="text-xl font-display font-extrabold tracking-tight text-foreground">
          CMS Redirects
        </h1>
      </div>
    </template>

    <template #header-actions>
      <div class="flex items-center gap-2">
        <UiButton variant="outline" class="rounded-xl h-9 px-3.5 gap-1.5 border-border font-bold text-xs" @click="fetchRedirects" :disabled="isLoading">
          <RefreshCw :class="['w-3.5 h-3.5', isLoading && 'animate-spin']" />
          <span>Refresh</span>
        </UiButton>
        <UiButton v-if="canCreate" class="rounded-xl h-9 px-3.5 gap-1.5 shadow-md shadow-primary/10 bg-primary text-primary-foreground font-bold text-xs" @click="toastSuccess('Create Redirect modal')">
          <Plus class="w-3.5 h-3.5" />
          <span>New Redirect</span>
        </UiButton>
      </div>
    </template>

    <div v-if="!canView" class="p-8 text-center bg-card border border-border rounded-2xl shadow-xs">
      <AlertCircle class="w-12 h-12 text-destructive mx-auto mb-3" />
      <h2 class="text-lg font-bold text-foreground mb-1">Access Restricted</h2>
      <p class="text-sm text-muted-foreground">You do not have permission to view CMS Redirects.</p>
    </div>

    <div v-else class="space-y-4 animate-in fade-in duration-500">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border px-3.5 py-2.5 rounded-xl shadow-xs">
        <UiSearchInput v-model="searchQuery" placeholder="Search redirects by path..." class="w-full sm:w-80" />
      </div>

      <div v-if="fetchError" class="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center justify-between text-destructive">
        <div class="flex items-center gap-3">
          <AlertCircle class="w-5 h-5 shrink-0" />
          <span class="text-xs font-medium">{{ fetchError }}</span>
        </div>
        <UiButton variant="outline" size="sm" class="h-8 text-xs border-destructive/30" @click="fetchRedirects">Retry</UiButton>
      </div>

      <div class="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <UiTable :columns="tableColumns" :data="filteredRedirects" :loading="isLoading" key-field="id" empty-text="No redirects found">
          <template #cell-old_path="{ item }">
            <span class="font-mono text-xs text-foreground bg-muted px-2 py-1 rounded">{{ item.old_path }}</span>
          </template>
          <template #cell-new_path="{ item }">
            <div class="flex items-center gap-1.5">
              <ArrowRight class="w-3 h-3 text-muted-foreground shrink-0" />
              <span class="font-mono text-xs text-primary truncate max-w-[200px]">{{ item.new_path }}</span>
            </div>
          </template>
          <template #cell-is_permanent="{ item }">
            <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border', item.is_permanent ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/50' : 'bg-muted text-muted-foreground']">
              {{ item.is_permanent ? '301 Permanent' : '302 Temporary' }}
            </span>
          </template>
          <template #cell-created_at="{ item }">
            <span class="text-xs text-muted-foreground font-mono">{{ item.created_at ? new Date(item.created_at).toLocaleString() : '—' }}</span>
          </template>
          <template #cell-actions="{ item }">
            <div class="flex items-center justify-end gap-1">
              <UiButton v-if="canEdit" variant="ghost" size="sm" class="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg" title="Edit" @click="toastSuccess(`Editing redirect`)">
                <Edit2 class="w-3.5 h-3.5" />
              </UiButton>
              <UiButton v-if="canDelete" variant="ghost" size="sm" class="h-8 w-8 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-lg" title="Delete" @click="modalState.openDelete(item.id)">
                <Trash2 class="w-3.5 h-3.5" />
              </UiButton>
            </div>
          </template>
        </UiTable>
        <div v-if="totalCount > 0" class="border-t border-border px-3.5 py-2 bg-card">
          <UiPagination v-model:current-page="currentPage" :total-pages="totalPages" :total-count="totalCount" :items-per-page="itemsPerPage" item-label="redirects" />
        </div>
      </div>
    </div>

    <UiAdminModal :is-open="modalState.isDelete.value" title="Delete Redirect" subtitle="Are you sure you want to delete this redirect rule?" @close="modalState.closeModal()">
      <div v-if="selectedRedirect" class="space-y-4">
        <div class="p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl space-y-1">
          <p class="font-mono text-xs text-foreground">From: {{ selectedRedirect.old_path }}</p>
          <p class="font-mono text-xs text-primary">To: {{ selectedRedirect.new_path }}</p>
        </div>
        <div class="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <UiButton variant="outline" class="h-9 px-4 text-xs font-semibold rounded-xl" @click="modalState.closeModal()" :disabled="isDeleting">Cancel</UiButton>
          <UiButton variant="destructive" class="h-9 px-4 text-xs font-semibold rounded-xl" @click="handleDeleteRedirect" :disabled="isDeleting">Confirm Delete</UiButton>
        </div>
      </div>
    </UiAdminModal>
  </NuxtLayout>
</template>
