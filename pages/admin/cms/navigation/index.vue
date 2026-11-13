<!-- File: /pages/admin/cms/navigation/index.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { 
  Menu, 
  Plus, 
  RefreshCw, 
  Edit2, 
  Trash2, 
  AlertCircle
} from 'lucide-vue-next';
import { refDebounced } from '@vueuse/core';
import { useCmsService } from '@/composables/useCmsService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useAdminModalState } from '@/composables/useAdminModalState';
import { toastSuccess, toastError, extractErrorMessage } from '@/composables/useToast';
import type { CmsNavigationMenu } from '@/types/cms';
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

const canView = computed(() => canViewModule('/admin/cms/navigation'));
const canCreate = computed(() => canCreateInModule('/admin/cms/navigation'));
const canEdit = computed(() => canEditInModule('/admin/cms/navigation'));
const canDelete = computed(() => canDeleteInModule('/admin/cms/navigation'));

const menusList = ref<CmsNavigationMenu[]>([]);
const totalCount = ref(0);
const totalPages = ref(1);
const isLoading = ref(false);
const fetchError = ref<string | null>(null);
const isDeleting = ref(false);

const searchQuery = ref(route.query.search ? String(route.query.search) : '');
const debouncedSearchQuery = refDebounced(searchQuery, 300);
const currentPage = ref(route.query.page ? parseInt(String(route.query.page)) || 1 : 1);
const itemsPerPage = ref(route.query.pageSize ? parseInt(String(route.query.pageSize)) || 10 : 10);

const modalState = useAdminModalState<CmsNavigationMenu>({
  getItems: async (id) => {
    return await cmsService.getNavigationMenu(id);
  },
  onResolveError: (id) => {
    toastError(`Navigation Menu #${id} could not be retrieved.`);
    modalState.closeModal({ replace: true });
  }
});

const selectedMenu = computed(() => modalState.activeEntity.value);

const fetchMenus = async () => {
  isLoading.value = true;
  fetchError.value = null;
  try {
    const res = await cmsService.getNavigationMenus({
      page: currentPage.value,
      page_size: itemsPerPage.value,
      search: debouncedSearchQuery.value || undefined
    });
    menusList.value = res.results || [];
    totalCount.value = res.count || 0;
    totalPages.value = res.pages || Math.ceil(totalCount.value / itemsPerPage.value) || 1;
  } catch (err: any) {
    fetchError.value = extractErrorMessage(err, 'Failed to retrieve navigation menus.');
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
  fetchMenus();
};

watch(debouncedSearchQuery, () => {
  currentPage.value = 1;
  updateRouteAndFetch();
});

watch(currentPage, () => {
  updateRouteAndFetch();
});

const handleDeleteMenu = async () => {
  const m = selectedMenu.value;
  if (!m) return;
  if (!canDelete.value) {
    toastError('You do not have permission to delete navigation menus.');
    return;
  }
  isDeleting.value = true;
  try {
    await cmsService.deleteNavigationMenu(m.id);
    toastSuccess(`Navigation Menu "${m.name}" deleted.`);
    await modalState.closeModal();
    if (menusList.value.length === 1 && currentPage.value > 1) currentPage.value--;
    await fetchMenus();
  } catch (err: any) {
    toastError(extractErrorMessage(err, 'Failed to delete navigation menu.'));
  } finally {
    isDeleting.value = false;
  }
};

const tableColumns = computed<UiTableColumn<CmsNavigationMenu>[]>(() => [
  { key: 'name', label: 'Menu Name & Key', width: '320px' },
  { key: 'items_count', label: 'Items', width: '120px', align: 'center' },
  { key: 'updated_at', label: 'Last Updated', width: '180px' },
  { key: 'actions', label: 'Actions', width: '120px', align: 'right' }
]);

onMounted(async () => {
  if (canView.value) await fetchMenus();
});
</script>

<template>
  <NuxtLayout name="admin">
    <template #header-title>
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground/40 font-light select-none">/</span>
        <h1 class="text-xl font-display font-extrabold tracking-tight text-foreground">
          Navigation Menus
        </h1>
      </div>
    </template>

    <template #header-actions>
      <div class="flex items-center gap-2">
        <UiButton variant="outline" class="rounded-xl h-9 px-3.5 gap-1.5 border-border font-bold text-xs" @click="fetchMenus" :disabled="isLoading">
          <RefreshCw :class="['w-3.5 h-3.5', isLoading && 'animate-spin']" />
          <span>Refresh</span>
        </UiButton>
        <UiButton v-if="canCreate" class="rounded-xl h-9 px-3.5 gap-1.5 shadow-md shadow-primary/10 bg-primary text-primary-foreground font-bold text-xs" @click="toastSuccess('Create Navigation Menu modal')">
          <Plus class="w-3.5 h-3.5" />
          <span>New Menu</span>
        </UiButton>
      </div>
    </template>

    <div v-if="!canView" class="p-8 text-center bg-card border border-border rounded-2xl shadow-xs">
      <AlertCircle class="w-12 h-12 text-destructive mx-auto mb-3" />
      <h2 class="text-lg font-bold text-foreground mb-1">Access Restricted</h2>
      <p class="text-sm text-muted-foreground">You do not have permission to view Navigation Menus.</p>
    </div>

    <div v-else class="space-y-4 animate-in fade-in duration-500">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border px-3.5 py-2.5 rounded-xl shadow-xs">
        <UiSearchInput v-model="searchQuery" placeholder="Search menus by name or key..." class="w-full sm:w-80" />
      </div>

      <div v-if="fetchError" class="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center justify-between text-destructive">
        <div class="flex items-center gap-3">
          <AlertCircle class="w-5 h-5 shrink-0" />
          <span class="text-xs font-medium">{{ fetchError }}</span>
        </div>
        <UiButton variant="outline" size="sm" class="h-8 text-xs border-destructive/30" @click="fetchMenus">Retry</UiButton>
      </div>

      <div class="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <UiTable :columns="tableColumns" :data="menusList" :loading="isLoading" key-field="id" empty-text="No navigation menus found">
          <template #cell-name="{ item }">
            <div class="space-y-1 py-1">
              <p class="font-bold text-xs text-foreground">{{ item.name }}</p>
              <span class="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{{ item.key }}</span>
            </div>
          </template>
          <template #cell-items_count="{ item }">
            <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-muted text-foreground">
              {{ item.items?.length || 0 }} items
            </span>
          </template>
          <template #cell-updated_at="{ item }">
            <span class="text-xs text-muted-foreground font-mono">{{ new Date(item.updated_at).toLocaleString() }}</span>
          </template>
          <template #cell-actions="{ item }">
            <div class="flex items-center justify-end gap-1">
              <UiButton v-if="canEdit" variant="ghost" size="sm" class="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg" title="Edit" @click="toastSuccess(`Editing ${item.name}`)">
                <Edit2 class="w-3.5 h-3.5" />
              </UiButton>
              <UiButton v-if="canDelete" variant="ghost" size="sm" class="h-8 w-8 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-lg" title="Delete" @click="modalState.openDelete(item.id)">
                <Trash2 class="w-3.5 h-3.5" />
              </UiButton>
            </div>
          </template>
        </UiTable>
        <div v-if="totalCount > 0" class="border-t border-border px-3.5 py-2 bg-card">
          <UiPagination v-model:current-page="currentPage" :total-pages="totalPages" :total-count="totalCount" :items-per-page="itemsPerPage" item-label="menus" />
        </div>
      </div>
    </div>

    <UiAdminModal :is-open="modalState.isDelete.value" title="Delete Navigation Menu" subtitle="Are you sure you want to delete this navigation menu?" @close="modalState.closeModal()">
      <div v-if="selectedMenu" class="space-y-4">
        <div class="p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3">
          <Menu class="w-6 h-6 text-destructive shrink-0" />
          <div>
            <p class="font-bold text-sm text-foreground">{{ selectedMenu.name }}</p>
            <p class="text-xs text-muted-foreground font-mono">{{ selectedMenu.key }}</p>
          </div>
        </div>
        <div class="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <UiButton variant="outline" class="h-9 px-4 text-xs font-semibold rounded-xl" @click="modalState.closeModal()" :disabled="isDeleting">Cancel</UiButton>
          <UiButton variant="destructive" class="h-9 px-4 text-xs font-semibold rounded-xl" @click="handleDeleteMenu" :disabled="isDeleting">Confirm Delete</UiButton>
        </div>
      </div>
    </UiAdminModal>
  </NuxtLayout>
</template>
