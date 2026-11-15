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
  RotateCcw,
  Copy
} from 'lucide-vue-next';
import { refDebounced } from '@vueuse/core';
import { useCmsService } from '@/composables/useCmsService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useAdminModalState } from '@/composables/useAdminModalState';
import { toastSuccess, toastError, extractErrorMessage } from '@/composables/useToast';
import type { CmsPage, CmsPageDetail, PageSectionItem, SectionTypeKey, CreatePagePayload, UpdatePagePayload } from '@/types/cms';
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

const activeCompositionPage = ref<CmsPageDetail | null>(null);
const compositionSections = ref<PageSectionItem[]>([]);
const isCompositionOpen = ref(false);
const compositionError = ref<string | null>(null);
const isSectionSubmitting = ref(false);
const sectionFormModalOpen = ref(false);
const editingSectionId = ref<number | string | null>(null);

const sectionForm = ref({
  section_type: 'hero_banner' as SectionTypeKey,
  title: '',
  display_order: 0,
  is_active: true,
  contentJson: '{\n  "title": "Section Title"\n}'
});

const openComposition = async (page: CmsPage) => {
  compositionError.value = null;
  try {
    const detail = await cmsService.getPageDetail(page.id);
    activeCompositionPage.value = detail;
    compositionSections.value = detail.sections || [];
    isCompositionOpen.value = true;
  } catch (err: any) {
    toastError(extractErrorMessage(err, 'Failed to load page composition sections.'));
  }
};

const openAddSectionModal = () => {
  editingSectionId.value = null;
  sectionForm.value = {
    section_type: 'hero_banner',
    title: '',
    display_order: compositionSections.value.length + 1,
    is_active: true,
    contentJson: '{\n  "title": "New Section"\n}'
  };
  sectionFormModalOpen.value = true;
};

const openEditSectionModal = (sec: PageSectionItem) => {
  editingSectionId.value = sec.id;
  sectionForm.value = {
    section_type: sec.section_type || 'hero_banner',
    title: sec.title || '',
    display_order: sec.display_order || 0,
    is_active: sec.is_active !== false,
    contentJson: JSON.stringify(sec.content || {}, null, 2)
  };
  sectionFormModalOpen.value = true;
};

const handleSaveSection = async () => {
  const page = activeCompositionPage.value;
  if (!page) return;

  let parsedContent: Record<string, any> = {};
  try {
    parsedContent = JSON.parse(sectionForm.value.contentJson || '{}');
  } catch {
    toastError('Invalid JSON format in section content.');
    return;
  }

  isSectionSubmitting.value = true;
  compositionError.value = null;

  try {
    if (editingSectionId.value) {
      const updated = await cmsService.updatePageSection(page.id, editingSectionId.value, {
        section_type: sectionForm.value.section_type,
        title: sectionForm.value.title,
        display_order: sectionForm.value.display_order,
        is_active: sectionForm.value.is_active,
        content: parsedContent,
        base_revision_id: page.id
      });
      const idx = compositionSections.value.findIndex(s => String(s.id) === String(updated?.id));
      if (idx !== -1 && updated) compositionSections.value[idx] = updated as PageSectionItem;
      toastSuccess('Section successfully updated.');
    } else {
      const created = await cmsService.addPageSection(page.id, {
        section_type: sectionForm.value.section_type,
        title: sectionForm.value.title,
        display_order: sectionForm.value.display_order,
        is_active: sectionForm.value.is_active,
        content: parsedContent
      });
      if (created) compositionSections.value.push(created as PageSectionItem);
      toastSuccess('Section successfully added.');
    }
    sectionFormModalOpen.value = false;
    const fresh = await cmsService.getPageDetail(page.id);
    activeCompositionPage.value = fresh;
    compositionSections.value = fresh.sections || [];
  } catch (err: any) {
    const status = err.response?.status || err.status;
    if (status === 409 || (err.message && err.message.includes('409'))) {
      compositionError.value = 'Revision conflict detected (409): Another user has modified this page. Please refresh to load the latest revision before saving.';
      toastError('Revision conflict (409) detected.');
    } else {
      const msg = extractErrorMessage(err, 'Failed to save section.');
      compositionError.value = msg;
      toastError(msg);
    }
  } finally {
    isSectionSubmitting.value = false;
  }
};

const handleDeleteSection = async (sec: PageSectionItem) => {
  const page = activeCompositionPage.value;
  if (!page) return;
  if (!confirm(`Are you sure you want to remove section "${sec.title || sec.section_type}"?`)) return;

  try {
    await cmsService.deletePageSection(page.id, sec.id);
    compositionSections.value = compositionSections.value.filter(s => String(s.id) !== String(sec.id));
    toastSuccess('Section removed successfully.');
  } catch (err: any) {
    toastError(extractErrorMessage(err, 'Failed to remove section.'));
  }
};

const handleDuplicateSection = async (sec: PageSectionItem) => {
  const page = activeCompositionPage.value;
  if (!page) return;

  try {
    const duplicated = await cmsService.duplicatePageSection(page.id, sec.id);
    if (duplicated) compositionSections.value.push(duplicated as PageSectionItem);
    toastSuccess('Section duplicated successfully.');
  } catch (err: any) {
    toastError(extractErrorMessage(err, 'Failed to duplicate section.'));
  }
};

const handleMoveSection = async (index: number, direction: 'up' | 'down') => {
  const page = activeCompositionPage.value;
  if (!page) return;
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= compositionSections.value.length) return;

  const temp = compositionSections.value[index]!;
  compositionSections.value[index] = compositionSections.value[targetIndex]!;
  compositionSections.value[targetIndex] = temp!;

  const sectionIds = compositionSections.value.map((s, idx) => {
    s.display_order = idx + 1;
    return s.id;
  });

  try {
    await cmsService.reorderPageSections(page.id, { section_ids: sectionIds });
    toastSuccess('Sections reordered successfully.');
  } catch (err: any) {
    toastError(extractErrorMessage(err, 'Failed to reorder sections.'));
  }
};

export interface VisualCreateSection {
  id: string;
  name: string;
  section_type: SectionTypeKey;
  value: Record<string, any>;
}

const createSections = ref<VisualCreateSection[]>([]);
const isCreateSectionModalOpen = ref(false);
const editingCreateSectionIndex = ref<number | null>(null);

const currentCreateSection = ref({
  name: 'Hero Banner Section',
  section_type: 'hero_banner' as SectionTypeKey,
  value: {
    title: 'Upgrade Your Tech Experience',
    subtitle: 'Discover the latest technology.',
    button_text: 'Explore Products',
    button_url: '/products/',
    image: '',
    mobile_image: '',
    text_alignment: 'left'
  } as Record<string, any>
});

const getDefaultValueForType = (type: SectionTypeKey) => {
  switch (type) {
    case 'hero_banner':
      return { title: 'Upgrade Your Tech Experience', subtitle: 'Discover the latest technology.', button_text: 'Explore Products', button_url: '/products/', image: '', mobile_image: '', text_alignment: 'left' };
    case 'rich_text':
      return { content: '<p>Enter rich text content here...</p>', alignment: 'left' };
    case 'product_collection':
      return { title: 'Featured Products', mode: 'ALL', limit: 8 };
    case 'brand_collection':
      return { mode: 'ALL', limit: 8 };
    case 'faq':
      return { items: [{ question: 'Sample Question?', answer: 'Sample answer...' }] };
    case 'image_gallery':
      return { images: [], columns: 3 };
    case 'cta':
      return { headline: 'Ready to upgrade?', description: 'Discover our collection.', button_text: 'Shop Now', button_url: '/shop-now/' };
    default:
      return {};
  }
};

const handleSectionTypeChange = (newType: SectionTypeKey) => {
  currentCreateSection.value.value = getDefaultValueForType(newType);
};

const openAddCreateSectionModal = () => {
  editingCreateSectionIndex.value = null;
  currentCreateSection.value = {
    name: 'Section ' + (createSections.value.length + 1),
    section_type: 'hero_banner',
    value: getDefaultValueForType('hero_banner')
  };
  isCreateSectionModalOpen.value = true;
};

const openEditCreateSectionModal = (index: number) => {
  editingCreateSectionIndex.value = index;
  const sec = createSections.value[index]!;
  currentCreateSection.value = {
    name: sec.name,
    section_type: sec.section_type,
    value: JSON.parse(JSON.stringify(sec.value))
  };
  isCreateSectionModalOpen.value = true;
};

const saveCreateSection = () => {
  if (!currentCreateSection.value.name.trim()) {
    currentCreateSection.value.name = 'Section';
  }
  const payloadItem: VisualCreateSection = {
    id: Math.random().toString(36).substring(2, 9),
    name: currentCreateSection.value.name,
    section_type: currentCreateSection.value.section_type,
    value: currentCreateSection.value.value
  };

  if (editingCreateSectionIndex.value !== null) {
    createSections.value[editingCreateSectionIndex.value] = payloadItem;
  } else {
    createSections.value.push(payloadItem);
  }
  isCreateSectionModalOpen.value = false;
};

const removeCreateSection = (index: number) => {
  createSections.value.splice(index, 1);
};

const duplicateCreateSection = (index: number) => {
  const sec = createSections.value[index]!;
  createSections.value.splice(index + 1, 0, {
    id: Math.random().toString(36).substring(2, 9),
    name: sec.name + ' (Copy)',
    section_type: sec.section_type,
    value: JSON.parse(JSON.stringify(sec.value))
  });
};

const moveCreateSection = (index: number, direction: 'up' | 'down') => {
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= createSections.value.length) return;
  const temp = createSections.value[index]!;
  createSections.value[index] = createSections.value[targetIndex]!;
  createSections.value[targetIndex] = temp!;
};

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
    createSections.value = [];
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
    const payload: CreatePagePayload = {
      title: newPageForm.value.title,
      slug: newPageForm.value.slug,
      status: newPageForm.value.status,
      meta_title: newPageForm.value.meta_title,
      meta_description: newPageForm.value.meta_description,
      is_homepage: newPageForm.value.is_homepage
    };

    if (createSections.value.length > 0) {
      payload.sections = createSections.value.map(s => ({
        name: s.name || 'Section',
        global_section: null,
        content: [
          {
            type: s.section_type,
            value: s.value
          }
        ]
      }));
    } else {
      payload.template = newPageForm.value.template || 'default';
    }

    await cmsService.createPage(payload);
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
                v-if="canEdit"
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10 rounded-lg"
                title="Manage Page Composition & Sections"
                @click="openComposition(item)"
              >
                <FileCode class="w-3.5 h-3.5" />
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

        <!-- Page-Specific Content Sections Builder -->
        <div class="space-y-3 pt-3 border-t border-border">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-xs font-bold uppercase tracking-wider text-foreground">Page Content Sections</h3>
              <p class="text-[11px] text-muted-foreground">Add custom sections to compose this page layout (leaves template empty).</p>
            </div>
            <UiButton type="button" size="sm" class="h-8 px-3 gap-1.5 text-xs font-bold rounded-xl bg-primary text-primary-foreground shadow-sm" @click="openAddCreateSectionModal">
              <Plus class="w-3.5 h-3.5" />
              <span>Add Content Section</span>
            </UiButton>
          </div>

          <div v-if="createSections.length === 0" class="p-4 text-center bg-muted/30 border border-dashed border-border rounded-xl">
            <p class="text-xs text-muted-foreground">No custom sections added. The selected template default sections will be used.</p>
          </div>

          <div v-else class="space-y-2 max-h-48 overflow-y-auto pr-1">
            <div v-for="(sec, idx) in createSections" :key="sec.id" class="p-2.5 bg-card border border-border rounded-xl flex items-center justify-between gap-2 shadow-xs">
              <div class="flex items-center gap-2 min-w-0">
                <div class="flex flex-col gap-0.5 shrink-0 text-[10px]">
                  <button type="button" :disabled="idx === 0" class="hover:text-foreground disabled:opacity-30" @click="moveCreateSection(idx, 'up')">▲</button>
                  <button type="button" :disabled="idx === createSections.length - 1" class="hover:text-foreground disabled:opacity-30" @click="moveCreateSection(idx, 'down')">▼</button>
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class="font-bold text-xs text-foreground truncate">{{ sec.name }}</span>
                    <span class="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-primary/10 text-primary border border-primary/20">{{ sec.section_type }}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <UiButton type="button" variant="ghost" size="sm" class="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg" title="Edit Section" @click="openEditCreateSectionModal(idx)">
                  <Edit2 class="w-3 h-3" />
                </UiButton>
                <UiButton type="button" variant="ghost" size="sm" class="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg" title="Duplicate Section" @click="duplicateCreateSection(idx)">
                  <Copy class="w-3 h-3" />
                </UiButton>
                <UiButton type="button" variant="ghost" size="sm" class="h-7 w-7 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-lg" title="Remove Section" @click="removeCreateSection(idx)">
                  <Trash2 class="w-3 h-3" />
                </UiButton>
              </div>
            </div>
          </div>
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

    <!-- Add/Edit Visual Create Section Sub-Modal -->
    <UiAdminModal
      :is-open="isCreateSectionModalOpen"
      :title="editingCreateSectionIndex !== null ? 'Configure Section' : 'Add Content Section'"
      subtitle="Select section type and fill in the visual form fields."
      @close="isCreateSectionModalOpen = false"
    >
      <div class="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Section Name *</label>
          <input v-model="currentCreateSection.name" type="text" placeholder="e.g. Hero Banner" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Section Type *</label>
          <select v-model="currentCreateSection.section_type" @change="handleSectionTypeChange(currentCreateSection.section_type)" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="hero_banner">Hero Banner</option>
            <option value="rich_text">Rich Text</option>
            <option value="product_collection">Product Collection</option>
            <option value="brand_collection">Brand Collection</option>
            <option value="faq">FAQ</option>
            <option value="image_gallery">Image Gallery</option>
            <option value="cta">CTA</option>
          </select>
        </div>

        <div class="space-y-3 pt-2 border-t border-border">
          <h4 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">Section Configuration</h4>

          <!-- hero_banner -->
          <template v-if="currentCreateSection.section_type === 'hero_banner'">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-foreground">Title *</label>
              <input v-model="currentCreateSection.value.title" type="text" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-foreground">Subtitle</label>
              <input v-model="currentCreateSection.value.subtitle" type="text" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-foreground">Button Text</label>
                <input v-model="currentCreateSection.value.button_text" type="text" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-foreground">Button URL</label>
                <input v-model="currentCreateSection.value.button_url" type="text" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground" />
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-foreground">Image URL</label>
              <input v-model="currentCreateSection.value.image" type="text" placeholder="/media/banner.jpg" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-foreground">Text Alignment</label>
              <select v-model="currentCreateSection.value.text_alignment" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground">
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </template>

          <!-- rich_text -->
          <template v-else-if="currentCreateSection.section_type === 'rich_text'">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-foreground">Content (HTML) *</label>
              <textarea v-model="currentCreateSection.value.content" rows="4" class="w-full p-3 rounded-xl border border-input bg-background font-mono text-xs text-foreground"></textarea>
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-foreground">Alignment</label>
              <select v-model="currentCreateSection.value.alignment" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground">
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </template>

          <!-- product_collection -->
          <template v-else-if="currentCreateSection.section_type === 'product_collection'">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-foreground">Collection Title</label>
              <input v-model="currentCreateSection.value.title" type="text" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-foreground">Mode</label>
                <select v-model="currentCreateSection.value.mode" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground">
                  <option value="ALL">All Products</option>
                  <option value="FEATURED">Featured</option>
                  <option value="CATEGORY">Category</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-foreground">Limit</label>
                <input v-model.number="currentCreateSection.value.limit" type="number" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground" />
              </div>
            </div>
          </template>

          <!-- brand_collection -->
          <template v-else-if="currentCreateSection.section_type === 'brand_collection'">
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-foreground">Mode</label>
                <select v-model="currentCreateSection.value.mode" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground">
                  <option value="ALL">All Brands</option>
                  <option value="FEATURED">Featured</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-foreground">Limit</label>
                <input v-model.number="currentCreateSection.value.limit" type="number" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground" />
              </div>
            </div>
          </template>

          <!-- faq -->
          <template v-else-if="currentCreateSection.section_type === 'faq'">
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-foreground">FAQ Items</label>
                <UiButton type="button" size="sm" variant="outline" class="h-7 text-xs" @click="currentCreateSection.value.items.push({ question: '', answer: '' })">Add Item</UiButton>
              </div>
              <div v-for="(item, i) in currentCreateSection.value.items" :key="i" class="p-3 bg-muted/40 rounded-xl space-y-2 relative">
                <input v-model="item.question" type="text" placeholder="Question..." class="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs" />
                <textarea v-model="item.answer" rows="2" placeholder="Answer..." class="w-full p-2.5 rounded-lg border border-input bg-background text-xs"></textarea>
                <UiButton type="button" variant="ghost" size="sm" class="h-7 text-xs text-destructive hover:bg-destructive/10" @click="currentCreateSection.value.items.splice(i, 1)">Remove</UiButton>
              </div>
            </div>
          </template>

          <!-- image_gallery -->
          <template v-else-if="currentCreateSection.section_type === 'image_gallery'">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-foreground">Columns</label>
              <input v-model.number="currentCreateSection.value.columns" type="number" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground" />
            </div>
            <div class="space-y-3 pt-2">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-foreground">Gallery Images</label>
                <UiButton type="button" size="sm" variant="outline" class="h-7 text-xs" @click="currentCreateSection.value.images.push({ image: '', caption: '' })">Add Image</UiButton>
              </div>
              <div v-for="(img, i) in currentCreateSection.value.images" :key="i" class="p-3 bg-muted/40 rounded-xl space-y-2">
                <input v-model="img.image" type="text" placeholder="Image URL..." class="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs" />
                <input v-model="img.caption" type="text" placeholder="Caption..." class="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs" />
                <UiButton type="button" variant="ghost" size="sm" class="h-7 text-xs text-destructive hover:bg-destructive/10" @click="currentCreateSection.value.images.splice(i, 1)">Remove</UiButton>
              </div>
            </div>
          </template>

          <!-- cta -->
          <template v-else-if="currentCreateSection.section_type === 'cta'">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-foreground">Headline *</label>
              <input v-model="currentCreateSection.value.headline" type="text" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-foreground">Description</label>
              <input v-model="currentCreateSection.value.description" type="text" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-foreground">Button Text *</label>
                <input v-model="currentCreateSection.value.button_text" type="text" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-foreground">Button URL *</label>
                <input v-model="currentCreateSection.value.button_url" type="text" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground" />
              </div>
            </div>
          </template>
        </div>

        <div class="flex items-center justify-end gap-2 pt-4 border-t border-border">
          <UiButton type="button" variant="outline" class="h-10 px-4 text-xs font-semibold rounded-xl" @click="isCreateSectionModalOpen = false">Cancel</UiButton>
          <UiButton type="button" class="h-10 px-4 text-xs font-bold rounded-xl bg-primary text-primary-foreground shadow-sm" @click="saveCreateSection">
            <span>{{ editingCreateSectionIndex !== null ? 'Save Section' : 'Add Section' }}</span>
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

    <!-- Page Composition / Sections Manager Modal -->
    <UiAdminModal
      :is-open="isCompositionOpen"
      :title="activeCompositionPage ? `Manage Sections: ${activeCompositionPage.title}` : 'Page Composition'"
      subtitle="Configure, order, and edit sections assigned to this CMS page."
      @close="isCompositionOpen = false"
    >
      <div class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
        <div v-if="compositionError" class="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive flex items-center justify-between">
          <div class="flex items-center gap-2">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{{ compositionError }}</span>
          </div>
          <UiButton v-if="compositionError.includes('409')" size="sm" variant="outline" class="h-7 text-xs border-destructive/30" @click="openComposition(activeCompositionPage!)">Refresh</UiButton>
        </div>

        <div class="flex items-center justify-between">
          <h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assigned Sections ({{ compositionSections.length }})</h3>
          <UiButton class="h-8 px-3 gap-1.5 text-xs font-bold rounded-xl bg-primary text-primary-foreground shadow-sm" @click="openAddSectionModal">
            <Plus class="w-3.5 h-3.5" />
            <span>Add Section</span>
          </UiButton>
        </div>

        <div v-if="compositionSections.length === 0" class="p-8 text-center bg-muted/30 border border-dashed border-border rounded-2xl">
          <FileCode class="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p class="text-sm font-semibold text-foreground">No sections assigned yet</p>
          <p class="text-xs text-muted-foreground mt-0.5">Add page-specific sections to compose this page layout.</p>
        </div>

        <div v-else class="space-y-2.5">
          <div v-for="(sec, idx) in compositionSections" :key="sec.id" class="p-3.5 bg-card border border-border rounded-xl flex items-center justify-between gap-3 shadow-xs">
            <div class="flex items-center gap-3 min-w-0">
              <div class="flex flex-col gap-0.5 shrink-0">
                <button :disabled="idx === 0" class="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground disabled:opacity-30" title="Move Up" @click="handleMoveSection(idx, 'up')">▲</button>
                <button :disabled="idx === compositionSections.length - 1" class="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground disabled:opacity-30" title="Move Down" @click="handleMoveSection(idx, 'down')">▼</button>
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-xs text-foreground truncate">{{ sec.title || `Section #${sec.id}` }}</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">{{ sec.section_type }}</span>
                  <span v-if="sec.is_active === false" class="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">Inactive</span>
                </div>
                <p class="text-[11px] text-muted-foreground font-mono mt-0.5">Order: {{ sec.display_order }}</p>
              </div>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <UiButton variant="ghost" size="sm" class="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg" title="Edit Section" @click="openEditSectionModal(sec)">
                <Edit2 class="w-3.5 h-3.5" />
              </UiButton>
              <UiButton variant="ghost" size="sm" class="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg" title="Duplicate Section" @click="handleDuplicateSection(sec)">
                <Copy class="w-3.5 h-3.5" />
              </UiButton>
              <UiButton variant="ghost" size="sm" class="h-8 w-8 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-lg" title="Remove Section" @click="handleDeleteSection(sec)">
                <Trash2 class="w-3.5 h-3.5" />
              </UiButton>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end pt-4 border-t border-border">
          <UiButton variant="outline" class="h-9 px-4 text-xs font-semibold rounded-xl" @click="isCompositionOpen = false">Close</UiButton>
        </div>
      </div>
    </UiAdminModal>

    <!-- Section Add/Edit Form Modal -->
    <UiAdminModal
      :is-open="sectionFormModalOpen"
      :title="editingSectionId ? 'Edit Page Section' : 'Add Page Section'"
      subtitle="Configure section type, title, ordering, and content JSON."
      @close="sectionFormModalOpen = false"
    >
      <div class="p-6 space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Section Type *</label>
          <select v-model="sectionForm.section_type" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="hero_banner">Hero Banner</option>
            <option value="rich_text">Rich Text</option>
            <option value="product_collection">Product Collection</option>
            <option value="brand_collection">Brand Collection</option>
            <option value="faq">FAQ</option>
            <option value="image_gallery">Image Gallery</option>
            <option value="cta">CTA</option>
          </select>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Section Title</label>
          <input v-model="sectionForm.title" type="text" placeholder="e.g. Summer Promo Banner" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Display Order</label>
            <input v-model.number="sectionForm.display_order" type="number" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div class="flex items-center h-10 pt-5">
            <input id="sec_active" v-model="sectionForm.is_active" type="checkbox" class="rounded border-input text-primary focus:ring-primary/20 w-4 h-4 mr-2" />
            <label for="sec_active" class="text-xs font-semibold text-foreground select-none cursor-pointer">Active</label>
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Content (JSON) *</label>
          <textarea v-model="sectionForm.contentJson" rows="6" class="w-full p-3 rounded-xl border border-input bg-background font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"></textarea>
        </div>

        <div class="flex items-center justify-end gap-2 pt-4 border-t border-border">
          <UiButton variant="outline" class="h-10 px-4 text-xs font-semibold rounded-xl" @click="sectionFormModalOpen = false" :disabled="isSectionSubmitting">Cancel</UiButton>
          <UiButton class="h-10 px-4 text-xs font-bold rounded-xl bg-primary text-primary-foreground shadow-sm" @click="handleSaveSection" :disabled="isSectionSubmitting">
            <Loader2 v-if="isSectionSubmitting" class="w-3.5 h-3.5 animate-spin mr-1.5" />
            <span>{{ editingSectionId ? 'Save Changes' : 'Add Section' }}</span>
          </UiButton>
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
