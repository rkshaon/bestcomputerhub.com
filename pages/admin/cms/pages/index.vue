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
  Copy,
  Send,
  EyeOff
} from 'lucide-vue-next';
import { refDebounced } from '@vueuse/core';
import { useCmsService } from '@/composables/useCmsService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useAdminModalState } from '@/composables/useAdminModalState';
import { toastSuccess, toastError, extractErrorMessage } from '@/composables/useToast';
import { buildSectionContentBlock, getRichTextBlockValue } from '@/utils/cms';
import type { CmsPage, CmsPageDetail, PageSectionItem, SectionTypeKey, CreatePagePayload, UpdatePagePayload } from '@/types/cms';
import type { UiTableColumn } from '@/components/ui/UiTable.vue';
import UiTable from '@/components/ui/UiTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import UiSearchInput from '@/components/ui/UiSearchInput.vue';
import UiAdminModal from '@/components/ui/UiAdminModal.vue';
import UiButton from '@/components/ui/Button.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiRichTextEditor from '@/components/ui/UiRichTextEditor.vue';

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
const statusFilter = ref<'all' | 'active' | 'archived'>((route.query.status as 'all' | 'active' | 'archived') || 'all');
const currentPage = ref(route.query.page ? parseInt(String(route.query.page)) || 1 : 1);
const itemsPerPage = ref(route.query.pageSize ? parseInt(String(route.query.pageSize)) || 10 : 10);

const newPageForm = ref<CreatePagePayload>({
  title: '',
  slug: '',
  template_key: 'blank',
  seo_title: '',
  seo_description: ''
});

const editPageForm = ref<UpdatePagePayload>({
  title: '',
  slug: '',
  seo_title: '',
  seo_description: ''
});

const modalState = useAdminModalState<CmsPageDetail>({
  getItems: async (id) => {
    return await cmsService.getPageDetail(id);
  },
  onResolveError: (id) => {
    toastError(`CMS Page #${id} could not be retrieved.`);
    modalState.closeModal({ replace: true });
  }
});

const getSectionType = (sec: any): SectionTypeKey => {
  if (Array.isArray(sec?.content) && sec.content.length > 0 && sec.content[0]?.type) {
    return (sec.content[0].type as SectionTypeKey);
  }
  if (sec?.section_type) {
    return (sec.section_type as SectionTypeKey);
  }
  if (sec?.type) {
    return (sec.type as SectionTypeKey);
  }
  return 'hero_banner';
};

const getSectionBlockValue = (sec: any): Record<string, any> => {
  if (sec?.value && typeof sec.value === 'object') {
    return sec.value;
  }
  if (Array.isArray(sec?.content) && sec.content.length > 0) {
    return sec.content[0]?.value || sec.content[0] || {};
  }
  if (sec?.content && typeof sec.content === 'object') {
    return sec.content;
  }
  return {};
};

const getSectionTypeLabel = (type: SectionTypeKey | string): string => {
  const map: Record<string, string> = {
    hero_banner: 'Hero Banner',
    rich_text: 'Rich Text',
    product_collection: 'Product Collection',
    brand_collection: 'Brand Collection',
    faq: 'FAQ',
    image_gallery: 'Image Gallery',
    cta: 'Call To Action'
  };
  return map[type] || type;
};

const getPageStatusKey = (page: Pick<CmsPage, 'live' | 'archived_at'>): 'draft' | 'published' | 'archived' => {
  if (page.archived_at) return 'archived';
  if (page.live) return 'published';
  return 'draft';
};

const getPageStatusLabel = (page: Pick<CmsPage, 'live' | 'archived_at' | 'has_unpublished_changes'>): string => {
  const key = getPageStatusKey(page);
  if (key === 'published' && page.has_unpublished_changes) return 'Published (edited)';
  return key.charAt(0).toUpperCase() + key.slice(1);
};

const selectedPage = computed(() => modalState.activeEntity.value);

const viewSections = computed<PageSectionItem[]>(() => {
  if (!selectedPage.value?.sections || !Array.isArray(selectedPage.value.sections)) {
    return [];
  }
  return [...selectedPage.value.sections].sort((a, b) => {
    const orderA = a.display_order ?? (a as any).sort_order ?? 0;
    const orderB = b.display_order ?? (b as any).sort_order ?? 0;
    return orderA - orderB;
  });
});

watch(selectedPage, (page) => {
  if (page) {
    if (modalState.isEdit.value) {
      editPageForm.value = {
        title: page.title || '',
        slug: page.slug || '',
        seo_title: page.seo_title || '',
        seo_description: page.seo_description || ''
      };
      formError.value = null;
    }
    activeCompositionPage.value = page as CmsPageDetail;
    compositionSections.value = (page.sections || []).map((sec: PageSectionItem) => ({
      ...sec,
      section_type: getSectionType(sec),
      title: sec.title || sec.name || `Section #${sec.id}`,
      display_order: sec.display_order ?? sec.sort_order ?? 0
    }));
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
  is_active: true,
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

const richTextContent = ref('');
const richTextAlignment = ref('left');

const openComposition = async (page: CmsPage) => {
  compositionError.value = null;
  try {
    const detail = await cmsService.getPageDetail(page.id);
    activeCompositionPage.value = detail;
    compositionSections.value = (detail.sections || []).map((sec: PageSectionItem) => ({
      ...sec,
      section_type: getSectionType(sec),
      title: sec.title || sec.name || `Section #${sec.id}`,
      display_order: sec.display_order ?? sec.sort_order ?? 0
    }));
    isCompositionOpen.value = true;
  } catch (err: any) {
    toastError(extractErrorMessage(err, 'Failed to load page composition sections.'));
  }
};

const handleEditSectionTypeChange = (newType: SectionTypeKey) => {
  sectionForm.value.value = getDefaultValueForType(newType);
};

const openAddSectionModal = () => {
  editingSectionId.value = null;
  sectionForm.value = {
    section_type: 'hero_banner',
    title: '',
    is_active: true,
    value: getDefaultValueForType('hero_banner')
  };
  richTextContent.value = '<p>Enter rich text content here...</p>';
  richTextAlignment.value = 'left';
  sectionFormModalOpen.value = true;
};

const openEditSectionModal = (sec: PageSectionItem) => {
  editingSectionId.value = sec.id;
  const sectionType = getSectionType(sec);
  const sectionVal = getSectionBlockValue(sec);

  sectionForm.value = {
    section_type: sectionType,
    title: sec.title || sec.name || '',
    is_active: !sec.archived_at,
    value: sectionType === 'rich_text'
      ? getRichTextBlockValue(sectionVal)
      : JSON.parse(JSON.stringify(sectionVal || {}))
  };
  if (sectionType === 'rich_text') {
    const richValue = getRichTextBlockValue(sectionVal);
    richTextContent.value = richValue.body || '<p>Enter rich text content here...</p>';
    richTextAlignment.value = richValue.alignment;
  } else {
    richTextContent.value = '<p>Enter rich text content here...</p>';
    richTextAlignment.value = 'left';
  }
  sectionFormModalOpen.value = true;
};

const handleSaveSection = async () => {
  const page = activeCompositionPage.value || selectedPage.value;
  if (!page) return;

  const contentObj = sectionForm.value.section_type === 'rich_text'
    ? { body: richTextContent.value, alignment: richTextAlignment.value }
    : sectionForm.value.value;

  isSectionSubmitting.value = true;
  compositionError.value = null;

  try {
    if (editingSectionId.value) {
      const updated = await cmsService.updatePageSection(page.id, editingSectionId.value, {
        name: sectionForm.value.title,
        content: buildSectionContentBlock(sectionForm.value.section_type, contentObj),
        archived: !sectionForm.value.is_active,
        base_revision_id: (page as CmsPageDetail).latest_revision_id
      });
      const idx = compositionSections.value.findIndex(s => String(s.id) === String(updated?.id));
      if (idx !== -1 && updated) compositionSections.value[idx] = updated as PageSectionItem;
      toastSuccess('Section successfully updated.');
    } else {
      const created = await cmsService.addPageSection(page.id, {
        name: sectionForm.value.title,
        content: buildSectionContentBlock(sectionForm.value.section_type, contentObj),
        archived: !sectionForm.value.is_active,
        base_revision_id: (page as CmsPageDetail).latest_revision_id
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
  const page = activeCompositionPage.value || selectedPage.value;
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
  const page = activeCompositionPage.value || selectedPage.value;
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
  const page = activeCompositionPage.value || selectedPage.value;
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
    await cmsService.reorderPageSections(page.id, { order: sectionIds, base_revision_id: (page as CmsPageDetail).latest_revision_id });
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
      return { body: '<p>Enter rich text content here...</p>', alignment: 'left' };
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
    const res = await cmsService.getPagesList({
      page: currentPage.value,
      page_size: itemsPerPage.value,
      search: debouncedSearchQuery.value || undefined,
      archived: statusFilter.value === 'archived' ? true : undefined
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
      template_key: 'blank',
      seo_title: '',
      seo_description: ''
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
      seo_title: newPageForm.value.seo_title,
      seo_description: newPageForm.value.seo_description
    };

    if (createSections.value.length > 0) {
      payload.sections = createSections.value.map(s => ({
        name: s.name || 'Section',
        global_section: null,
        content: buildSectionContentBlock(
          s.section_type,
          s.section_type === 'rich_text' ? getRichTextBlockValue(s.value) : s.value
        )
      }));
    } else {
      payload.template_key = newPageForm.value.template_key || 'blank';
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

const handlePublishPage = async (page: CmsPage) => {
  if (!canEdit.value) {
    toastError('You do not have permission to publish CMS pages.');
    return;
  }
  try {
    await cmsService.publishPage(page.id);
    toastSuccess(`CMS Page "${page.title}" has been published.`);
    await fetchPages();
    if (modalState.isView.value || modalState.isEdit.value) await modalState.resolveEntity();
  } catch (err: any) {
    toastError(extractErrorMessage(err, 'Failed to publish CMS page.'));
  }
};

const handleUnpublishPage = async (page: CmsPage) => {
  if (!canEdit.value) {
    toastError('You do not have permission to unpublish CMS pages.');
    return;
  }
  try {
    await cmsService.unpublishPage(page.id);
    toastSuccess(`CMS Page "${page.title}" has been unpublished.`);
    await fetchPages();
    if (modalState.isView.value || modalState.isEdit.value) await modalState.resolveEntity();
  } catch (err: any) {
    toastError(extractErrorMessage(err, 'Failed to unpublish CMS page.'));
  }
};

const handleArchivePage = async (page: CmsPage) => {
  if (!canEdit.value) {
    toastError('You do not have permission to archive CMS pages.');
    return;
  }
  if (!window.confirm(`Are you sure you want to archive page "${page.title}"?`)) return;

  try {
    await cmsService.archivePage(page.id);
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
    await cmsService.restorePage(page.id);
    toastSuccess(`CMS Page "${page.title}" has been restored.`);
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

const publishedCount = computed(() => pagesList.value.filter(p => getPageStatusKey(p) === 'published').length);

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
              <option value="all">All Pages</option>
              <option value="active">Active</option>
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
                  v-if="getPageStatusKey(item) === 'published'"
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
              {{ item.template_key || 'blank' }}
            </span>
          </template>

          <template #cell-status="{ item }">
            <div class="flex items-center justify-center">
              <span :class="['inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border', getPageStatusKey(item) === 'published' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/50' : getPageStatusKey(item) === 'archived' ? 'bg-muted text-muted-foreground border-border' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/50']">
                <span :class="['w-1.5 h-1.5 rounded-full', getPageStatusKey(item) === 'published' ? 'bg-emerald-500' : getPageStatusKey(item) === 'archived' ? 'bg-muted-foreground' : 'bg-amber-500']"></span>
                {{ getPageStatusLabel(item) }}
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
                v-if="canEdit && !item.archived_at && !item.live"
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 rounded-lg"
                title="Publish Page"
                @click="handlePublishPage(item)"
              >
                <Send class="w-3.5 h-3.5" />
              </UiButton>
              <UiButton
                v-if="canEdit && !item.archived_at && item.live"
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                title="Unpublish Page"
                @click="handleUnpublishPage(item)"
              >
                <EyeOff class="w-3.5 h-3.5" />
              </UiButton>
              <UiButton
                v-if="canEdit && !item.archived_at"
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 rounded-lg"
                title="Archive Page"
                @click="handleArchivePage(item)"
              >
                <Archive class="w-3.5 h-3.5" />
              </UiButton>
              <UiButton
                v-if="canEdit && item.archived_at"
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

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">Template</label>
          <select
            v-model="newPageForm.template_key"
            class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="blank">Blank</option>
            <option value="landing">Landing</option>
            <option value="about">About</option>
            <option value="contact">Contact</option>
            <option value="campaign">Campaign</option>
          </select>
          <p class="text-[11px] text-muted-foreground">Seeds initial sections only; ignored if you add sections below. New pages are created as drafts — publish from the page list once ready.</p>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">SEO Title</label>
          <input
            v-model="newPageForm.seo_title"
            type="text"
            placeholder="SEO Title"
            class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">SEO Description</label>
          <textarea
            v-model="newPageForm.seo_description"
            rows="2"
            placeholder="SEO Description"
            class="w-full p-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          ></textarea>
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
              <label class="text-xs font-bold text-foreground">Rich Text Content *</label>
              <UiRichTextEditor v-model="currentCreateSection.value.body" min-height="min-h-[220px]" placeholder="Enter rich text content..." />
            </div>
            <div class="space-y-1.5 pt-2">
              <label class="text-xs font-bold text-foreground">Alignment</label>
              <select v-model="currentCreateSection.value.alignment" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
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
            <div class="h-10 flex items-center gap-2">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold capitalize"
                :class="selectedPage && getPageStatusKey(selectedPage) === 'published' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : selectedPage && getPageStatusKey(selectedPage) === 'archived' ? 'bg-muted text-muted-foreground' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'"
              >
                {{ selectedPage ? getPageStatusLabel(selectedPage) : '—' }}
              </span>
              <UiButton v-if="selectedPage && !selectedPage.archived_at && !selectedPage.live" size="sm" variant="outline" class="h-7 px-2 text-[11px]" @click="handlePublishPage(selectedPage)">Publish</UiButton>
              <UiButton v-if="selectedPage && !selectedPage.archived_at && selectedPage.live" size="sm" variant="outline" class="h-7 px-2 text-[11px]" @click="handleUnpublishPage(selectedPage)">Unpublish</UiButton>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Template</label>
            <p class="h-10 flex items-center font-mono text-xs text-muted-foreground px-3 rounded-xl border border-input bg-muted/30">
              {{ selectedPage?.template_key || 'blank' }}
            </p>
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">SEO Title</label>
          <input
            v-model="editPageForm.seo_title"
            type="text"
            placeholder="SEO Title"
            class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-foreground">SEO Description</label>
          <textarea
            v-model="editPageForm.seo_description"
            rows="2"
            placeholder="SEO Description"
            class="w-full p-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          ></textarea>
        </div>

        <!-- Page-Specific Content Sections Builder in Edit Modal -->
        <div class="space-y-3 pt-3 border-t border-border">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-xs font-bold uppercase tracking-wider text-foreground">Page Content Sections</h3>
              <p class="text-[11px] text-muted-foreground">Visually manage page content sections.</p>
            </div>
            <UiButton type="button" size="sm" class="h-8 px-3 gap-1.5 text-xs font-bold rounded-xl bg-primary text-primary-foreground shadow-sm" @click="openAddSectionModal">
              <Plus class="w-3.5 h-3.5" />
              <span>Add Content Section</span>
            </UiButton>
          </div>

          <div v-if="compositionSections.length === 0" class="p-4 text-center bg-muted/30 border border-dashed border-border rounded-xl">
            <p class="text-xs text-muted-foreground">No sections assigned yet. Add content sections to build this page.</p>
          </div>

          <div v-else class="space-y-2 max-h-48 overflow-y-auto pr-1">
            <div v-for="(sec, idx) in compositionSections" :key="sec.id" class="p-2.5 bg-card border border-border rounded-xl flex items-center justify-between gap-2 shadow-xs">
              <div class="flex items-center gap-2 min-w-0">
                <div class="flex flex-col gap-0.5 shrink-0 text-[10px]">
                  <button type="button" :disabled="idx === 0" class="hover:text-foreground disabled:opacity-30" @click="handleMoveSection(idx, 'up')">▲</button>
                  <button type="button" :disabled="idx === compositionSections.length - 1" class="hover:text-foreground disabled:opacity-30" @click="handleMoveSection(idx, 'down')">▼</button>
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class="font-bold text-xs text-foreground truncate">{{ sec.title || sec.section_type }}</span>
                    <span class="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-primary/10 text-primary border border-primary/20">{{ sec.section_type }}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <UiButton type="button" variant="ghost" size="sm" class="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg" title="Edit Section" @click="openEditSectionModal(sec)">
                  <Edit2 class="w-3 h-3" />
                </UiButton>
                <UiButton type="button" variant="ghost" size="sm" class="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg" title="Duplicate Section" @click="handleDuplicateSection(sec)">
                  <Copy class="w-3 h-3" />
                </UiButton>
                <UiButton type="button" variant="ghost" size="sm" class="h-7 w-7 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-lg" title="Remove Section" @click="handleDeleteSection(sec)">
                  <Trash2 class="w-3 h-3" />
                </UiButton>
              </div>
            </div>
          </div>
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
      title="CMS Page Preview & Details"
      subtitle="Complete preview of page content and configuration."
      max-width="max-w-4xl"
      @close="modalState.closeModal()"
    >
      <div v-if="selectedPage" class="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
        <!-- Page Overview Header -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/20 p-4 rounded-2xl border border-border">
          <div>
            <p class="text-muted-foreground uppercase font-bold text-[10px]">Page Title</p>
            <p class="text-xs font-bold text-foreground mt-0.5 truncate">{{ selectedPage.title }}</p>
          </div>
          <div>
            <p class="text-muted-foreground uppercase font-bold text-[10px]">Public URL</p>
            <p class="text-xs font-mono text-primary mt-0.5 truncate">/{{ selectedPage.slug }}/</p>
          </div>
          <div>
            <p class="text-muted-foreground uppercase font-bold text-[10px]">Status</p>
            <div class="mt-0.5">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold capitalize"
                :class="getPageStatusKey(selectedPage) === 'published' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : getPageStatusKey(selectedPage) === 'archived' ? 'bg-muted text-muted-foreground' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'"
              >
                {{ getPageStatusLabel(selectedPage) }}
              </span>
            </div>
          </div>
          <div>
            <p class="text-muted-foreground uppercase font-bold text-[10px]">Template</p>
            <p class="font-mono text-xs text-foreground mt-0.5">{{ selectedPage.template_key || 'blank' }}</p>
          </div>
        </div>

        <!-- SEO Metadata Info if available -->
        <div v-if="selectedPage.seo_title || selectedPage.seo_description" class="p-3 bg-muted/10 rounded-xl border border-border/60 text-xs space-y-1">
          <p v-if="selectedPage.seo_title" class="text-foreground text-[11px]"><strong class="text-muted-foreground font-semibold">SEO Title:</strong> {{ selectedPage.seo_title }}</p>
          <p v-if="selectedPage.seo_description" class="text-muted-foreground text-[11px]"><strong class="text-muted-foreground font-semibold">SEO Description:</strong> {{ selectedPage.seo_description }}</p>
        </div>

        <!-- Page Content Preview Header -->
        <div class="pt-2 border-t border-border">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="text-xs font-bold uppercase tracking-wider text-foreground">Page Content Sections</h3>
              <p class="text-[11px] text-muted-foreground">Preview of saved sections in presentation order.</p>
            </div>
            <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-muted text-muted-foreground border border-border">
              {{ viewSections.length }} {{ viewSections.length === 1 ? 'Section' : 'Sections' }}
            </span>
          </div>

          <!-- Empty State -->
          <div v-if="viewSections.length === 0" class="py-12 px-6 text-center bg-muted/20 border border-dashed border-border rounded-2xl my-2">
            <FileText class="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
            <h4 class="text-sm font-bold text-foreground">No content sections saved</h4>
            <p class="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              This page currently has no page-specific sections. You can add sections by editing the page.
            </p>
            <UiButton v-if="canEdit" class="mt-4 h-8 px-3.5 text-xs font-bold rounded-xl bg-primary text-primary-foreground shadow-xs gap-1.5" @click="modalState.openEdit(selectedPage.id)">
              <Edit2 class="w-3 h-3" />
              <span>Edit Page Content</span>
            </UiButton>
          </div>

          <!-- Section Previews List -->
          <div v-else class="space-y-4">
            <div 
              v-for="(sec, idx) in viewSections" 
              :key="sec.id" 
              class="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3"
            >
              <!-- Section Label Header -->
              <div class="flex items-center justify-between text-xs pb-2.5 border-b border-border/50">
                <div class="flex items-center gap-2">
                  <span class="w-5 h-5 rounded-full bg-primary/10 text-primary font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                    {{ idx + 1 }}
                  </span>
                  <h4 class="font-bold text-foreground text-xs truncate">
                    {{ sec.title || sec.name || getSectionTypeLabel(getSectionType(sec)) }}
                  </h4>
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                    {{ getSectionTypeLabel(getSectionType(sec)) }}
                  </span>
                  <span v-if="sec.archived_at" class="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    Inactive
                  </span>
                </div>
              </div>

              <!-- Content Preview by Type -->
              <div class="pt-1">
                <!-- 1. hero_banner -->
                <template v-if="getSectionType(sec) === 'hero_banner'">
                  <div 
                    :class="[
                      'rounded-xl border border-border/80 p-6 bg-gradient-to-br from-card via-muted/20 to-muted/40 relative overflow-hidden',
                      getSectionBlockValue(sec).text_alignment === 'center' ? 'text-center' : getSectionBlockValue(sec).text_alignment === 'right' ? 'text-right' : 'text-left'
                    ]"
                  >
                    <div v-if="getSectionBlockValue(sec).image" class="mb-4 overflow-hidden rounded-xl border border-border max-h-64 bg-black/5">
                      <img :src="getSectionBlockValue(sec).image" :alt="getSectionBlockValue(sec).title || 'Hero Banner'" class="w-full h-full max-h-64 object-cover" />
                    </div>
                    <h3 class="text-xl sm:text-2xl font-display font-extrabold text-foreground tracking-tight">
                      {{ getSectionBlockValue(sec).title || 'Untitled Banner' }}
                    </h3>
                    <p v-if="getSectionBlockValue(sec).subtitle" class="text-xs sm:text-sm text-muted-foreground mt-2 max-w-xl leading-relaxed" :class="getSectionBlockValue(sec).text_alignment === 'center' ? 'mx-auto' : getSectionBlockValue(sec).text_alignment === 'right' ? 'ml-auto' : ''">
                      {{ getSectionBlockValue(sec).subtitle }}
                    </p>
                    <div v-if="getSectionBlockValue(sec).button_text" class="mt-4 flex items-center gap-2 flex-wrap" :class="getSectionBlockValue(sec).text_alignment === 'center' ? 'justify-center' : getSectionBlockValue(sec).text_alignment === 'right' ? 'justify-end' : 'justify-start'">
                      <span class="inline-flex items-center px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs">
                        {{ getSectionBlockValue(sec).button_text }}
                      </span>
                      <span v-if="getSectionBlockValue(sec).button_url" class="text-[11px] font-mono text-muted-foreground bg-muted px-2.5 py-1 rounded-lg border border-border/60">
                        {{ getSectionBlockValue(sec).button_url }}
                      </span>
                    </div>
                  </div>
                </template>

                <!-- 2. rich_text -->
                <template v-else-if="getSectionType(sec) === 'rich_text'">
                  <div 
                    :class="[
                      'p-5 bg-background rounded-xl border border-border/80 text-foreground',
                      getSectionBlockValue(sec).alignment === 'center' ? 'text-center' : getSectionBlockValue(sec).alignment === 'right' ? 'text-right' : 'text-left'
                    ]"
                  >
                    <div 
                      class="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed" 
                      v-html="getSectionBlockValue(sec).body || getSectionBlockValue(sec).content || '<p class=\'text-muted-foreground italic\'>No rich text content.</p>'"
                    ></div>
                  </div>
                </template>

                <!-- 3. product_collection -->
                <template v-else-if="getSectionType(sec) === 'product_collection'">
                  <div class="p-5 bg-muted/20 rounded-xl border border-border/80 space-y-3">
                    <div class="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h4 class="font-bold text-sm text-foreground">{{ getSectionBlockValue(sec).title || 'Product Collection' }}</h4>
                        <p class="text-[11px] text-muted-foreground mt-0.5">
                          Displaying up to {{ getSectionBlockValue(sec).limit || 8 }} products
                          <span v-if="getSectionBlockValue(sec).mode === 'CATEGORY' && getSectionBlockValue(sec).category_id"> from category #{{ getSectionBlockValue(sec).category_id }}</span>
                        </p>
                      </div>
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                        Mode: {{ getSectionBlockValue(sec).mode || 'ALL' }}
                      </span>
                    </div>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                      <div v-for="n in Math.min(Number(getSectionBlockValue(sec).limit) || 4, 4)" :key="n" class="p-3 rounded-xl border border-border bg-card flex flex-col justify-between h-28 shadow-2xs">
                        <div class="w-full h-12 bg-muted/50 rounded-lg flex items-center justify-center text-muted-foreground/50 text-[10px] font-medium">
                          Product Item
                        </div>
                        <div>
                          <div class="h-2.5 w-3/4 bg-foreground/20 rounded mt-1.5"></div>
                          <div class="h-2 w-1/2 bg-primary/30 rounded mt-1"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- 4. brand_collection -->
                <template v-else-if="getSectionType(sec) === 'brand_collection'">
                  <div class="p-5 bg-muted/20 rounded-xl border border-border/80 space-y-3">
                    <div class="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h4 class="font-bold text-sm text-foreground">Brand Showcase</h4>
                        <p class="text-[11px] text-muted-foreground mt-0.5">
                          Featured brands (Limit: {{ getSectionBlockValue(sec).limit || 8 }})
                        </p>
                      </div>
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                        Mode: {{ getSectionBlockValue(sec).mode || 'ALL' }}
                      </span>
                    </div>
                    <div v-if="getSectionBlockValue(sec).brands && getSectionBlockValue(sec).brands.length > 0" class="flex flex-wrap gap-1.5 pt-1">
                      <span v-for="b in getSectionBlockValue(sec).brands" :key="b" class="px-2 py-0.5 rounded-md text-[10px] font-mono bg-background text-foreground border border-border">
                        Brand #{{ b }}
                      </span>
                    </div>
                    <div class="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                      <div v-for="n in Math.min(Number(getSectionBlockValue(sec).limit) || 6, 6)" :key="n" class="h-12 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground/60 text-[10px] font-bold shadow-2xs">
                        Brand {{ n }}
                      </div>
                    </div>
                  </div>
                </template>

                <!-- 5. faq -->
                <template v-else-if="getSectionType(sec) === 'faq'">
                  <div class="p-5 bg-card rounded-xl border border-border/80 space-y-3">
                    <h4 class="font-bold text-sm text-foreground">Frequently Asked Questions</h4>
                    <div v-if="!getSectionBlockValue(sec).items || getSectionBlockValue(sec).items.length === 0" class="text-xs text-muted-foreground italic py-1">
                      No FAQ items configured.
                    </div>
                    <div v-else class="space-y-2">
                      <div v-for="(item, i) in getSectionBlockValue(sec).items" :key="i" class="p-3.5 bg-muted/30 rounded-xl border border-border/60 space-y-1.5">
                        <div class="font-bold text-xs text-foreground flex items-start gap-2">
                          <span class="w-4 h-4 rounded-full bg-primary/15 text-primary text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">Q</span>
                          <span>{{ item.question || 'Untitled Question' }}</span>
                        </div>
                        <div class="text-xs text-muted-foreground pl-6 leading-relaxed">
                          {{ item.answer || 'No answer provided.' }}
                        </div>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- 6. image_gallery -->
                <template v-else-if="getSectionType(sec) === 'image_gallery'">
                  <div class="p-5 bg-card rounded-xl border border-border/80 space-y-3">
                    <div class="flex items-center justify-between">
                      <h4 class="font-bold text-sm text-foreground">Image Gallery</h4>
                      <span class="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border/50">
                        {{ (getSectionBlockValue(sec).images || []).length }} images ({{ getSectionBlockValue(sec).columns || 3 }} cols)
                      </span>
                    </div>
                    <div v-if="!getSectionBlockValue(sec).images || getSectionBlockValue(sec).images.length === 0" class="text-xs text-muted-foreground italic py-1">
                      No gallery images uploaded.
                    </div>
                    <div 
                      v-else 
                      class="grid gap-2.5 pt-1" 
                      :style="{ gridTemplateColumns: `repeat(${Math.min(Math.max(Number(getSectionBlockValue(sec).columns) || 3, 1), 6)}, minmax(0, 1fr))` }"
                    >
                      <div v-for="(img, imgIdx) in getSectionBlockValue(sec).images" :key="imgIdx" class="rounded-xl overflow-hidden border border-border bg-muted/20 flex flex-col shadow-2xs">
                        <img 
                          v-if="img.image || typeof img === 'string'" 
                          :src="img.image || img" 
                          :alt="img.caption || `Gallery Image ${Number(imgIdx) + 1}`" 
                          class="w-full h-32 object-cover" 
                        />
                        <div v-else class="w-full h-32 bg-muted/50 flex items-center justify-center text-muted-foreground text-[10px]">
                          No Image URL
                        </div>
                        <p v-if="img.caption" class="p-2 text-[10px] text-muted-foreground text-center truncate bg-card border-t border-border/50">
                          {{ img.caption }}
                        </p>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- 7. cta -->
                <template v-else-if="getSectionType(sec) === 'cta'">
                  <div 
                    class="p-6 rounded-2xl border border-primary/20 bg-primary/5 text-center space-y-2 relative overflow-hidden"
                    :style="getSectionBlockValue(sec).background_color ? { backgroundColor: getSectionBlockValue(sec).background_color } : {}"
                  >
                    <h4 class="text-lg font-display font-extrabold text-foreground tracking-tight">
                      {{ getSectionBlockValue(sec).headline || 'Call to Action' }}
                    </h4>
                    <p v-if="getSectionBlockValue(sec).description" class="text-xs text-muted-foreground max-w-lg mx-auto leading-relaxed">
                      {{ getSectionBlockValue(sec).description }}
                    </p>
                    <div v-if="getSectionBlockValue(sec).button_text" class="pt-2">
                      <span class="inline-flex items-center px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs">
                        {{ getSectionBlockValue(sec).button_text }}
                      </span>
                      <p v-if="getSectionBlockValue(sec).button_url" class="text-[10px] text-muted-foreground font-mono mt-1.5">
                        {{ getSectionBlockValue(sec).button_url }}
                      </p>
                    </div>
                  </div>
                </template>

                <!-- Fallback for unknown section type -->
                <template v-else>
                  <div class="p-4 bg-muted/20 rounded-xl border border-border">
                    <pre class="font-mono text-[10px] text-muted-foreground whitespace-pre-wrap overflow-x-auto">{{ JSON.stringify(getSectionBlockValue(sec), null, 2) }}</pre>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between pt-4 border-t border-border mt-2">
          <div class="flex items-center gap-2">
            <NuxtLink
              v-if="getPageStatusKey(selectedPage) === 'published'"
              :to="`/${selectedPage.slug}/`"
              target="_blank"
              class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline px-3 py-1.5 rounded-xl hover:bg-primary/5"
            >
              <Globe class="w-3.5 h-3.5" />
              <span>Open Public Page</span>
            </NuxtLink>
          </div>
          <div class="flex items-center gap-2">
            <UiButton v-if="canEdit && !selectedPage.archived_at && !selectedPage.live" variant="outline" class="h-9 px-4 text-xs font-bold rounded-xl gap-1.5" @click="handlePublishPage(selectedPage)">
              <Send class="w-3.5 h-3.5" />
              <span>Publish</span>
            </UiButton>
            <UiButton v-if="canEdit && !selectedPage.archived_at && selectedPage.live" variant="outline" class="h-9 px-4 text-xs font-bold rounded-xl gap-1.5" @click="handleUnpublishPage(selectedPage)">
              <EyeOff class="w-3.5 h-3.5" />
              <span>Unpublish</span>
            </UiButton>
            <UiButton variant="outline" class="h-9 px-4 text-xs font-semibold rounded-xl" @click="modalState.closeModal()">Close</UiButton>
            <UiButton v-if="canEdit" class="h-9 px-4 text-xs font-bold rounded-xl bg-primary text-primary-foreground shadow-xs gap-1.5" @click="modalState.openEdit(selectedPage.id)">
              <Edit2 class="w-3.5 h-3.5" />
              <span>Edit Page</span>
            </UiButton>
          </div>
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
                  <span v-if="sec.archived_at" class="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">Inactive</span>
                </div>
                <p class="text-[11px] text-muted-foreground font-mono mt-0.5">Order: {{ sec.sort_order ?? sec.display_order }}</p>
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
          <select v-model="sectionForm.section_type" @change="handleEditSectionTypeChange(sectionForm.section_type)" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
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

        <div class="flex items-center h-10">
          <input id="sec_active" v-model="sectionForm.is_active" type="checkbox" class="rounded border-input text-primary focus:ring-primary/20 w-4 h-4 mr-2" />
          <label for="sec_active" class="text-xs font-semibold text-foreground select-none cursor-pointer">Active</label>
        </div>

        <div class="space-y-3 pt-2 border-t border-border max-h-[50vh] overflow-y-auto pr-1">
          <h4 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">Section Configuration</h4>

          <!-- hero_banner -->
          <template v-if="sectionForm.section_type === 'hero_banner'">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-foreground">Title *</label>
              <input v-model="sectionForm.value.title" type="text" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-foreground">Subtitle</label>
              <input v-model="sectionForm.value.subtitle" type="text" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-foreground">Button Text</label>
                <input v-model="sectionForm.value.button_text" type="text" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-foreground">Button URL</label>
                <input v-model="sectionForm.value.button_url" type="text" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground" />
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-foreground">Image URL</label>
              <input v-model="sectionForm.value.image" type="text" placeholder="/media/banner.jpg" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-foreground">Text Alignment</label>
              <select v-model="sectionForm.value.text_alignment" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground">
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </template>

          <!-- rich_text -->
          <template v-else-if="sectionForm.section_type === 'rich_text'">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-foreground">Rich Text Content *</label>
              <UiRichTextEditor v-model="richTextContent" min-height="min-h-[220px]" placeholder="Enter rich text content..." />
            </div>
            <div class="space-y-1.5 pt-2">
              <label class="text-xs font-bold text-foreground">Alignment</label>
              <select v-model="richTextAlignment" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </template>

          <!-- product_collection -->
          <template v-else-if="sectionForm.section_type === 'product_collection'">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-foreground">Collection Title</label>
              <input v-model="sectionForm.value.title" type="text" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-foreground">Mode</label>
                <select v-model="sectionForm.value.mode" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground">
                  <option value="ALL">All Products</option>
                  <option value="FEATURED">Featured</option>
                  <option value="CATEGORY">Category</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-foreground">Limit</label>
                <input v-model.number="sectionForm.value.limit" type="number" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground" />
              </div>
            </div>
          </template>

          <!-- brand_collection -->
          <template v-else-if="sectionForm.section_type === 'brand_collection'">
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-foreground">Mode</label>
                <select v-model="sectionForm.value.mode" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground">
                  <option value="ALL">All Brands</option>
                  <option value="FEATURED">Featured</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-foreground">Limit</label>
                <input v-model.number="sectionForm.value.limit" type="number" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground" />
              </div>
            </div>
          </template>

          <!-- faq -->
          <template v-else-if="sectionForm.section_type === 'faq'">
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-foreground">FAQ Items</label>
                <UiButton type="button" size="sm" variant="outline" class="h-7 text-xs" @click="(sectionForm.value.items = sectionForm.value.items || []).push({ question: '', answer: '' })">Add Item</UiButton>
              </div>
              <div v-for="(item, i) in (sectionForm.value.items || [])" :key="i" class="p-3 bg-muted/40 rounded-xl space-y-2 relative">
                <input v-model="item.question" type="text" placeholder="Question..." class="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs" />
                <textarea v-model="item.answer" rows="2" placeholder="Answer..." class="w-full p-2.5 rounded-lg border border-input bg-background text-xs"></textarea>
                <UiButton type="button" variant="ghost" size="sm" class="h-7 text-xs text-destructive hover:bg-destructive/10" @click="sectionForm.value.items.splice(i, 1)">Remove</UiButton>
              </div>
            </div>
          </template>

          <!-- image_gallery -->
          <template v-else-if="sectionForm.section_type === 'image_gallery'">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-foreground">Columns</label>
              <input v-model.number="sectionForm.value.columns" type="number" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground" />
            </div>
            <div class="space-y-3 pt-2">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-foreground">Gallery Images</label>
                <UiButton type="button" size="sm" variant="outline" class="h-7 text-xs" @click="(sectionForm.value.images = sectionForm.value.images || []).push({ image: '', caption: '' })">Add Image</UiButton>
              </div>
              <div v-for="(img, i) in (sectionForm.value.images || [])" :key="i" class="p-3 bg-muted/40 rounded-xl space-y-2">
                <input v-model="img.image" type="text" placeholder="Image URL..." class="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs" />
                <input v-model="img.caption" type="text" placeholder="Caption..." class="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs" />
                <UiButton type="button" variant="ghost" size="sm" class="h-7 text-xs text-destructive hover:bg-destructive/10" @click="sectionForm.value.images.splice(i, 1)">Remove</UiButton>
              </div>
            </div>
          </template>

          <!-- cta -->
          <template v-else-if="sectionForm.section_type === 'cta'">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-foreground">Headline *</label>
              <input v-model="sectionForm.value.headline" type="text" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-foreground">Description</label>
              <input v-model="sectionForm.value.description" type="text" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-foreground">Button Text *</label>
                <input v-model="sectionForm.value.button_text" type="text" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-foreground">Button URL *</label>
                <input v-model="sectionForm.value.button_url" type="text" class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground" />
              </div>
            </div>
          </template>
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
