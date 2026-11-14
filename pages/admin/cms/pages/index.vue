<!-- File: /pages/admin/cms/pages/index.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { 
  FileCode, 
  Plus, 
  Search, 
  RefreshCw, 
  Edit2, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Globe,
  FileText,
  Loader2,
  Archive,
  RotateCcw
} from 'lucide-vue-next';
import { refDebounced } from '@vueuse/core';
import { useCmsService } from '@/composables/useCmsService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useAdminModalState } from '@/composables/useAdminModalState';
import { toastSuccess, toastError, extractErrorMessage } from '@/composables/useToast';
import type { CmsPage, CreatePagePayload, UpdatePagePayload } from '@/types/cms';
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

const canView = computed(() => canViewModule('/admin/cms/pages'));
const canCreate = computed(() => canCreateInModule('/admin/cms/pages'));
const canEdit = computed(() => canEditInModule('/admin/cms/pages'));
const canDelete = computed(() => canDeleteInModule('/admin/cms/pages'));

const pagesList = ref<CmsPage[]>([]);
const totalCount = ref(0);
const totalPages = ref(1);
const isLoading = ref(false);
const fetchError = ref<string | null>(null);
const isDeleting = ref(false);
const isSubmitting = ref(false);
const formError = ref<string | null>(null);

const searchQuery = ref(route.query.search ? String(route.query.search) : '');
const debouncedSearchQuery = refDebounced(searchQuery, 300);
const statusFilter = ref<'all' | 'published' | 'draft' | 'archived'>((route.query.status as 'all' | 'published' | 'draft' | 'archived') || 'all');
const currentPage = ref(route.query.page ? parseInt(String(route.query.page)) || 1 : 1);
const itemsPerPage = ref(route.query.pageSize ? parseInt(String(route.query.pageSize)) || 10 : 10);

const newPageForm = ref<CreatePagePayload>({
  title: '',
  slug: '',
  status: 'draft',
  template: 'default',
  meta_title: '',
  meta_description: '',
  is_homepage: false
});

const editPageForm = ref<UpdatePagePayload>({
  title: '',
  slug: '',
  status: 'draft',
  template: 'default',
  meta_title: '',
  meta_description: '',
  is_homepage: false
});

const modalState = useAdminModalState<CmsPage>({
  getItems: async (id) => {
    return await cmsService.getPageDetail(id);
  },
  onResolveError: (id) => {
    toastError(`CMS Page #${id} could not be retrieved.`);
    modalState.closeModal({ replace: true });
  }
});

const selectedPage = computed(() => modalState.activeEntity.value);

watch(selectedPage, (page) => {
  if (page && modalState.isEdit.value) {
    editPageForm.value = {
      title: page.title || '',
      slug: page.slug || '',
      status: page.status || 'draft',
      template: page.template || 'default',
      meta_title: page.meta_title || '',
      meta_description: page.meta_description || '',
      is_homepage: !!page.is_homepage
    };
    formError.value = null;
  }
}, { immediate: true });

const fetchPages = async () => {
  isLoading.value = true;
  fetchError.value = null;
  try {
    const statusParam = statusFilter.value !== 'all' ? statusFilter.value : undefined;
    const res = await cmsService.getPagesList({
      page: currentPage.value,
      page_size: itemsPerPage.value,
      search: debouncedSearchQuery.value || undefined,
      status: statusParam
    });
    pagesList.value = res.results || [];
    totalCount.value = res.count || 0;
    totalPages.value = res.pages || Math.ceil(totalCount.value / itemsPerPage.value) || 1;
  } catch (err: any) {
    fetchError.value = extractErrorMessage(err, 'Failed to retrieve CMS pages list.');
  } finally {
    isLoading.value = false;
  }
};

const updateRouteAndFetch = () => {
  const query: Record<string, string | number | undefined> = {
    ...route.query,
    page: currentPage.value > 1 ? currentPage.value : undefined,
    pageSize: itemsPerPage.value !== 10 ? itemsPerPage.value : undefined,
    search: searchQuery.value.trim() || undefined,
    status: statusFilter.value !== 'all' ? statusFilter.value : undefined
  };

  Object.keys(query).forEach((key) => {
    if (query[key] === undefined) delete query[key];
  });

  router.push({ query });
  fetchPages();
};

watch(debouncedSearchQuery, () => {
  currentPage.value = 1;
  updateRouteAndFetch();
});

watch(statusFilter, () => {
  currentPage.value = 1;
  updateRouteAndFetch();
});

watch(currentPage, () => {
  updateRouteAndFetch();
});

watch(() => modalState.isCreate.value, (isCr) => {
  if (isCr) {
    newPageForm.value = {
      title: '',
      slug: '',
      status: 'draft',
      template: 'default',
      meta_title: '',
      meta_description: '',
      is_homepage: false
    };
    formError.value = null;
  }
});

const handleCreatePage = async () => {
  if (!newPageForm.value.title?.trim() || !newPageForm.value.slug?.trim()) {
    formError.value = 'Title and slug are required fields.';
    return;
  }
  if (!canCreate.value) {
    toastError('You do not have permission to create CMS pages.');
    return;
  }

  isSubmitting.value = true;
  formError.value = null;

  try {
    await cmsService.createPage(newPageForm.value);
    toastSuccess(`CMS Page "${newPageForm.value.title}" successfully created.`);
    modalState.closeModal();
    await fetchPages();
  } catch (err: any) {
    formError.value = extractErrorMessage(err, 'Failed to create CMS page.');
    toastError(formError.value);
  } finally {
    isSubmitting.value = false;
  }
};

const handleUpdatePage = async () => {
  if (!selectedPage.value) return;
  if (!editPageForm.value.title?.trim() || !editPageForm.value.slug?.trim()) {
    formError.value = 'Title and slug are required fields.';
    return;
  }
  if (!canEdit.value) {
    toastError('You do not have permission to update CMS pages.');
    return;
  }

  isSubmitting.value = true;
  formError.value = null;

  try {
    await cmsService.updatePage(selectedPage.value.id, editPageForm.value);
    toastSuccess(`CMS Page "${editPageForm.value.title}" successfully updated.`);
    modalState.closeModal();
    await fetchPages();
  } catch (err: any) {
    formError.value = extractErrorMessage(err, 'Failed to update CMS page.');
    toastError(formError.value);
  } finally {
    isSubmitting.value = false;
  }
};

const handleArchivePage = async (page: CmsPage) => {
  if (!canEdit.value) {
    toastError('You do not have permission to archive CMS pages.');
    return;
  }
  if (!window.confirm(`Are you sure you want to archive page "${page.title}"?`)) return;

  try {
    await cmsService.updatePage(page.id, { status: 'archived' });
    toastSuccess(`CMS Page "${page.title}" has been archived.`);
    await fetchPages();
  } catch (err: any) {
    toastError(extractErrorMessage(err, 'Failed to archive CMS page.'));
  }
};

const handleRestorePage = async (page: CmsPage) => {
  if (!canEdit.value) {
    toastError('You do not have permission to restore CMS pages.');
    return;
  }
  try {
    await cmsService.updatePage(page.id, { status: 'draft' });
    toastSuccess(`CMS Page "${page.title}" has been restored to draft.`);
    await fetchPages();
  } catch (err: any) {
    toastError(extractErrorMessage(err, 'Failed to restore CMS page.'));
  }
};

const handleDeletePage = async () => {
  const page = selectedPage.value;
  if (!page) return;
  if (!canDelete.value) {
    toastError('You do not have permission to delete CMS pages.');
    return;
  }
  isDeleting.value = true;
  try {
    await cmsService.deletePage(page.id);
    toastSuccess(`CMS Page "${page.title}" has been deleted.`);
    await modalState.closeModal();
    if (pagesList.value.length === 1 && currentPage.value > 1) {
      currentPage.value--;
    }
    await fetchPages();
  } catch (err: any) {
    toastError(extractErrorMessage(err, 'Failed to delete CMS page.'));
  } finally {
    isDeleting.value = false;
  }
};

const tableColumns = computed<UiTableColumn<CmsPage>[]>(() => [
  { key: 'title', label: 'Page Title & Slug', width: '320px' },
  { key: 'template', label: 'Template', width: '150px' },
  { key: 'status', label: 'Status', width: '120px', align: 'center' },
  { key: 'updated_at', label: 'Last Updated', width: '180px' },
  { key: 'actions', label: 'Actions', width: '150px', align: 'right' }
]);

const publishedCount = computed(() => pagesList.value.filter(p => p.status === 'published').length);

onMounted(async () => {
  if (canView.value) {
    await fetchPages();
  }
});
</script>

<template>
  <NuxtLayout name="admin">
    <template #header-title>
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground/40 font-light select-none">/</span>
        <h1 class="text-xl font-display font-extrabold tracking-tight text-foreground">
          CMS Pages
        </h1>
      </div>
    </template>

    <template #header-actions>
      <div class="flex items-center gap-2">
        <UiButton 
          variant="outline" 
          class="rounded-xl h-9 px-3.5 gap-1.5 border-border font-bold text-xs"
          @click="fetchPages"
          :disabled="isLoading"
        >
          <RefreshCw :class="['w-3.5 h-3.5', isLoading && 'animate-spin']" />
          <span>Refresh</span>
        </UiButton>

        <UiButton 
          v-if="canCreate"
          class="rounded-xl h-9 px-3.5 gap-1.5 shadow-md shadow-primary/10 bg-primary text-primary-foreground font-bold text-xs"
          @click="modalState.openCreate()"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>New Page</span>
        </UiButton>
      </div>
    </template>

    <!-- Permission Guard -->
    <div v-if="!canView" class="p-8 text-center bg-card border border-border rounded-2xl shadow-xs">
      <AlertCircle class="w-12 h-12 text-destructive mx-auto mb-3" />
      <h2 class="text-lg font-bold text-foreground mb-1">Access Restricted</h2>
      <p class="text-sm text-muted-foreground">You do not have permission to view CMS Pages.</p>
    </div>

    <div v-else class="space-y-4 animate-in fade-in duration-500">
      <!-- Analytics Summary Row -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <UiCard class="flex items-center gap-3.5 p-3.5">
          <div class="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <FileCode class="w-5 h-5" />
          </div>
          <div>
            <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Total CMS Pages</p>
            <p class="text-2xl font-display font-extrabold tracking-tight text-foreground leading-tight">{{ totalCount }}</p>
          </div>
        </UiCard>

        <UiCard class="flex items-center gap-3.5 p-3.5">
          <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 class="w-5 h-5" />
          </div>
          <div>
            <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Published Pages</p>
            <p class="text-2xl font-display font-extrabold tracking-tight text-foreground leading-tight">{{ publishedCount }}</p>
          </div>
        </UiCard>
      </div>

      <!-- Filters Toolbar -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border px-3.5 py-2.5 rounded-xl shadow-xs">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
          <UiSearchInput 
            v-model="searchQuery" 
            placeholder="Search pages by title or slug..." 
            class="w-full sm:w-80"
          />

          <div class="flex items-center gap-2">
            <label class="text-xs font-semibold text-muted-foreground shrink-0 hidden md:inline">Status:</label>
            <select
              v-model="statusFilter"
              class="h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 cursor-pointer w-full sm:w-36"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-if="fetchError" class="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center justify-between text-destructive">
        <div class="flex items-center gap-3">
          <AlertCircle class="w-5 h-5 shrink-0" />
          <span class="text-xs font-medium">{{ fetchError }}</span>
        </div>
        <UiButton variant="outline" size="sm" class="h-8 text-xs border-destructive/30" @click="fetchPages">
          Retry
        </UiButton>
      </div>

      <!-- Data Table -->
      <div class="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <UiTable
          :columns="tableColumns"
          :data="pagesList"
          :loading="isLoading"
          key-field="id"
          empty-text="No CMS pages found"
          empty-description="Create your first CMS page to begin publishing dynamic layouts."
        >
          <template #cell-title="{ item }">
            <div class="space-y-1 py-1">
              <p class="font-bold text-xs text-foreground">{{ item.title }}</p>
              <div class="flex items-center gap-2">
                <span class="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">/{{ item.slug }}</span>
                <NuxtLink 
                  v-if="item.status === 'published'"
                  :to="`/${item.slug}/`" 
                  target="_blank"
                  class="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
                >
                  <Globe class="w-2.5 h-2.5" />
                  <span>Preview</span>
                </NuxtLink>
              </div>
            </div>
          </template>

          <template #cell-template="{ item }">
            <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-muted text-foreground border border-border">
              {{ item.template || 'default' }}
            </span>
          </template>

          <template #cell-status="{ item }">
            <div class="flex items-center justify-center">
              <span :class="['inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border', item.status === 'published' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/50' : item.status === 'archived' ? 'bg-muted text-muted-foreground border-border' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/50']">
                <span :class="['w-1.5 h-1.5 rounded-full', item.status === 'published' ? 'bg-emerald-500' : item.status === 'archived' ? 'bg-muted-foreground' : 'bg-amber-500']"></span>
                {{ item.status }}
              </span>
            </div>
          </template>

          <template #cell-updated_at="{ item }">
            <span class="text-xs text-muted-foreground font-mono">
              {{ item.updated_at ? new Date(item.updated_at).toLocaleString() : '—' }}
            </span>
          </template>

          <template #cell-actions="{ item }">
            <div class="flex items-center justify-end gap-1">
              <UiButton
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                title="View Page Details"
                @click="modalState.openView(item.id)"
              >
                <Eye class="w-3.5 h-3.5" />
              </UiButton>
              <UiButton
                v-if="canEdit"
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                title="Edit Page"
                @click="modalState.openEdit(item.id)"
              >
                <Edit2 class="w-3.5 h-3.5" />
              </UiButton>
              <UiButton
                v-if="canEdit && item.status !== 'archived'"
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 rounded-lg"
                title="Archive Page"
                @click="handleArchivePage(item)"
              >
                <Archive class="w-3.5 h-3.5" />
              </UiButton>
              <UiButton
                v-if="canEdit && item.status === 'archived'"
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 rounded-lg"
                title="Restore Page"
                @click="handleRestorePage(item)"
              >
                <RotateCcw class="w-3.5 h-3.5" />
              </UiButton>
              <UiButton
                v-if="canDelete"
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-lg"
                title="Delete Page"
                @click="modalState.openDelete(item.id)"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </UiButton>
            </div>
          </template>
        </UiTable>

        <div v-if="totalCount > 0" class="border-t border-border px-3.5 py-2 bg-card">
          <UiPagination
            v-model:current-page="currentPage"
            :total-pages="totalPages"
            :total-count="totalCount"
            :items-per-page="itemsPerPage"
            item-label="pages"
          />
        </div>
      </div>
    </div>

    <!-- Create Page Modal -->
    <UiAdminModal
      :is-open="modalState.isCreate.value"
      title="Create New CMS Page"
      subtitle="Configure basic metadata and slug for the new page."
      @close="modalState.closeModal()"
    >
      <div class="p-6 space-y-4">
        <div v-if="formError" class="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive flex items-center gap-2">
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ formError }}</span>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Page Title *</label>
          <input 
            v-model="newPageForm.title" 
            type="text" 
            placeholder="e.g. About Us" 
            class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">URL Slug *</label>
          <input 
            v-model="newPageForm.slug" 
            type="text" 
            placeholder="e.g. about-us" 
            class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Status</label>
            <select 
              v-model="newPageForm.status" 
              class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Template</label>
            <input 
              v-model="newPageForm.template" 
              type="text" 
              placeholder="default" 
              class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Meta Title</label>
          <input 
            v-model="newPageForm.meta_title" 
            type="text" 
            placeholder="SEO Meta Title" 
            class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Meta Description</label>
          <textarea 
            v-model="newPageForm.meta_description" 
            rows="2" 
            placeholder="SEO Meta Description" 
            class="w-full p-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          ></textarea>
        </div>

        <div class="flex items-center gap-2 pt-1">
          <input id="is_homepage" v-model="newPageForm.is_homepage" type="checkbox" class="rounded border-input text-primary focus:ring-primary/20 w-4 h-4" />
          <label for="is_homepage" class="text-xs font-semibold text-foreground select-none cursor-pointer">Set as Homepage</label>
        </div>

        <div class="flex items-center justify-end gap-2 pt-4 border-t border-border">
          <UiButton variant="outline" class="h-10 px-4 text-xs font-semibold rounded-xl" @click="modalState.closeModal()" :disabled="isSubmitting">Cancel</UiButton>
          <UiButton class="h-10 px-4 text-xs font-bold rounded-xl bg-primary text-primary-foreground shadow-sm" @click="handleCreatePage" :disabled="isSubmitting">
            <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin mr-1.5" />
            <span>Create Page</span>
          </UiButton>
        </div>
      </div>
    </UiAdminModal>

    <!-- Edit Page Modal -->
    <UiAdminModal
      :is-open="modalState.isEdit.value"
      title="Edit CMS Page"
      subtitle="Modify page properties, metadata, and status."
      @close="modalState.closeModal()"
    >
      <div class="p-6 space-y-4">
        <div v-if="formError" class="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive flex items-center gap-2">
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ formError }}</span>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Page Title *</label>
          <input 
            v-model="editPageForm.title" 
            type="text" 
            placeholder="e.g. About Us" 
            class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">URL Slug *</label>
          <input 
            v-model="editPageForm.slug" 
            type="text" 
            placeholder="e.g. about-us" 
            class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Status</label>
            <select 
              v-model="editPageForm.status" 
              class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Template</label>
            <input 
              v-model="editPageForm.template" 
              type="text" 
              placeholder="default" 
              class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Meta Title</label>
          <input 
            v-model="editPageForm.meta_title" 
            type="text" 
            placeholder="SEO Meta Title" 
            class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Meta Description</label>
          <textarea 
            v-model="editPageForm.meta_description" 
            rows="2" 
            placeholder="SEO Meta Description" 
            class="w-full p-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          ></textarea>
        </div>

        <div class="flex items-center gap-2 pt-1">
          <input id="edit_is_homepage" v-model="editPageForm.is_homepage" type="checkbox" class="rounded border-input text-primary focus:ring-primary/20 w-4 h-4" />
          <label for="edit_is_homepage" class="text-xs font-semibold text-foreground select-none cursor-pointer">Set as Homepage</label>
        </div>

        <div class="flex items-center justify-end gap-2 pt-4 border-t border-border">
          <UiButton variant="outline" class="h-10 px-4 text-xs font-semibold rounded-xl" @click="modalState.closeModal()" :disabled="isSubmitting">Cancel</UiButton>
          <UiButton class="h-10 px-4 text-xs font-bold rounded-xl bg-primary text-primary-foreground shadow-sm" @click="handleUpdatePage" :disabled="isSubmitting">
            <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin mr-1.5" />
            <span>Save Changes</span>
          </UiButton>
        </div>
      </div>
    </UiAdminModal>

    <!-- View Details Modal -->
    <UiAdminModal
      :is-open="modalState.isView.value"
      title="CMS Page Details"
      subtitle="Complete overview of page configuration and metadata."
      @close="modalState.closeModal()"
    >
      <div v-if="selectedPage" class="p-6 space-y-4 text-xs">
        <div class="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border">
          <div>
            <p class="text-muted-foreground uppercase font-bold text-[10px]">Title</p>
            <p class="text-sm font-bold text-foreground mt-0.5">{{ selectedPage.title }}</p>
          </div>
          <div>
            <p class="text-muted-foreground uppercase font-bold text-[10px]">Slug</p>
            <p class="text-sm font-mono text-primary mt-0.5">/{{ selectedPage.slug }}</p>
          </div>
          <div>
            <p class="text-muted-foreground uppercase font-bold text-[10px]">Status</p>
            <p class="font-bold text-foreground mt-0.5 capitalize">{{ selectedPage.status }}</p>
          </div>
          <div>
            <p class="text-muted-foreground uppercase font-bold text-[10px]">Template</p>
            <p class="font-mono text-foreground mt-0.5">{{ selectedPage.template || 'default' }}</p>
          </div>
          <div>
            <p class="text-muted-foreground uppercase font-bold text-[10px]">Homepage</p>
            <p class="font-bold text-foreground mt-0.5">{{ selectedPage.is_homepage ? 'Yes' : 'No' }}</p>
          </div>
          <div>
            <p class="text-muted-foreground uppercase font-bold text-[10px]">Updated At</p>
            <p class="font-mono text-foreground mt-0.5">{{ selectedPage.updated_at ? new Date(selectedPage.updated_at).toLocaleString() : '—' }}</p>
          </div>
        </div>

        <div class="space-y-1">
          <p class="text-muted-foreground uppercase font-bold text-[10px]">Meta Title</p>
          <p class="p-2.5 rounded-lg bg-background border border-border text-foreground">{{ selectedPage.meta_title || '—' }}</p>
        </div>

        <div class="space-y-1">
          <p class="text-muted-foreground uppercase font-bold text-[10px]">Meta Description</p>
          <p class="p-2.5 rounded-lg bg-background border border-border text-foreground">{{ selectedPage.meta_description || '—' }}</p>
        </div>

        <div class="flex items-center justify-end pt-4 border-t border-border">
          <UiButton variant="outline" class="h-9 px-4 text-xs font-semibold rounded-xl" @click="modalState.closeModal()">Close</UiButton>
        </div>
      </div>
    </UiAdminModal>

    <!-- Delete Confirmation Modal -->
    <UiAdminModal
      :is-open="modalState.isDelete.value"
      title="Delete CMS Page"
      subtitle="Are you sure you want to permanently delete this CMS page?"
      @close="modalState.closeModal()"
    >
      <div v-if="selectedPage" class="space-y-4 p-6">
        <div class="p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3">
          <FileText class="w-6 h-6 text-destructive shrink-0" />
          <div>
            <p class="font-bold text-sm text-foreground">{{ selectedPage.title }}</p>
            <p class="text-xs text-muted-foreground font-mono">/{{ selectedPage.slug }}</p>
          </div>
        </div>
        <div class="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <UiButton variant="outline" class="h-9 px-4 text-xs font-semibold rounded-xl" @click="modalState.closeModal()" :disabled="isDeleting">Cancel</UiButton>
          <UiButton variant="destructive" class="h-9 px-4 text-xs font-semibold rounded-xl" @click="handleDeletePage" :disabled="isDeleting">
            <RefreshCw v-if="isDeleting" class="w-3.5 h-3.5 animate-spin mr-1" />
            <span>Confirm Delete</span>
          </UiButton>
        </div>
      </div>
    </UiAdminModal>
  </NuxtLayout>
</template>
