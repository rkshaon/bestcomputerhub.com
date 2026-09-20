<!-- File: /pages/admin/banners/index.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Eye, 
  RefreshCw, 
  Image as ImageIcon,
  Layers, 
  Calendar, 
  ExternalLink, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Clock,
  ArrowUpDown,
  Upload,
  UploadCloud,
  FileText,
  Link,
  GripVertical,
  Save,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Loader2
} from 'lucide-vue-next';
import { refDebounced } from '@vueuse/core';
import { useBannerService } from '@/composables/useBannerService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useAdminModalState } from '@/composables/useAdminModalState';
import { toastSuccess, toastError, extractErrorMessage } from '@/composables/useToast';
import type { Banner, BannerPlacement } from '@/types';
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
const bannerService = useBannerService();
const { canViewModule, canCreateInModule, canEditInModule, canDeleteInModule } = useAdminPermissions();

// Access permissions
const canView = computed(() => canViewModule('/admin/banners'));
const canCreate = computed(() => canCreateInModule('/admin/banners'));
const canEdit = computed(() => canEditInModule('/admin/banners'));
const canDelete = computed(() => canDeleteInModule('/admin/banners'));

// Reactive State
const bannersList = ref<Banner[]>([]);
const placementsList = ref<BannerPlacement[]>([]);
const totalCount = ref(0);
const totalPages = ref(1);
const isLoading = ref(false);
const isPlacementsLoading = ref(false);
const fetchError = ref<string | null>(null);
const isDeleting = ref(false);

// Query & Filter Parameters initialized from URL
const searchQuery = ref(route.query.search ? String(route.query.search) : '');
const debouncedSearchQuery = refDebounced(searchQuery, 300);
const selectedPlacement = ref<string>(route.query.placement ? String(route.query.placement) : '');
const statusFilter = ref<'all' | 'active' | 'inactive'>((route.query.status as 'all' | 'active' | 'inactive') || 'all');
const currentPage = ref(route.query.page ? parseInt(String(route.query.page)) || 1 : 1);
const itemsPerPage = ref(route.query.pageSize ? parseInt(String(route.query.pageSize)) || 10 : 10);

// URL-Driven Modal State Manager
const modalState = useAdminModalState<Banner>({
  getItems: async (id) => {
    return await bannerService.getBanner(id);
  },
  onResolveError: (id) => {
    toastError(`Banner #${id} could not be retrieved.`);
    modalState.closeModal({ replace: true });
  }
});

const selectedBanner = computed(() => modalState.activeEntity.value);

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

// Image preview error map for table
const imageErrorMap = ref<Record<string | number, boolean>>({});
const handleImageError = (id: string | number) => {
  imageErrorMap.value[id] = true;
};

// Map placement IDs to Placement entities
const placementsMap = computed<Record<number, BannerPlacement>>(() => {
  const map: Record<number, BannerPlacement> = {};
  for (const p of placementsList.value) {
    map[p.id] = p;
  }
  return map;
});

const getPlacementDisplayName = (banner: Banner): string => {
  if (banner.placement_name) return banner.placement_name;
  if (banner.placement && placementsMap.value[banner.placement]) {
    return placementsMap.value[banner.placement]!.name;
  }
  return `Placement #${banner.placement}`;
};

const getPlacementCode = (banner: Banner): string => {
  if (banner.placement_code) return banner.placement_code;
  if (banner.placement && placementsMap.value[banner.placement]) {
    return placementsMap.value[banner.placement]!.code;
  }
  return '';
};

const isCurrentlyScheduled = (banner: Banner): { active: boolean; statusText: string } => {
  if (!banner.is_active) {
    return { active: false, statusText: 'Disabled' };
  }
  const now = new Date();
  if (banner.start_at && new Date(banner.start_at) > now) {
    return { active: false, statusText: 'Scheduled (Future)' };
  }
  if (banner.end_at && new Date(banner.end_at) < now) {
    return { active: false, statusText: 'Expired' };
  }
  return { active: true, statusText: 'Active' };
};

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
};

// Sync form state when modal mode or active banner changes
watch(
  [() => modalState.isCreate.value, () => modalState.isEdit.value, selectedBanner],
  ([isCreate, isEdit, banner]) => {
    formError.value = null;
    fieldErrors.value = {};

    if (isCreate) {
      cleanupObjectUrls();
      selectedDesktopFile.value = null;
      desktopPreviewUrl.value = null;
      selectedMobileFile.value = null;
      mobilePreviewUrl.value = null;

      formPayload.value = {
        placement: placementsList.value[0]?.id ? String(placementsList.value[0].id) : '',
        title: '',
        subtitle: '',
        cta_text: '',
        cta_url: '',
        display_order: 0,
        is_active: true,
        start_at: '',
        end_at: ''
      };
    } else if (isEdit && banner) {
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

// Form Validation Logic
const validateForm = (): boolean => {
  fieldErrors.value = {};
  formError.value = null;
  let isValid = true;

  if (!formPayload.value.placement) {
    fieldErrors.value.placement = 'Placement selection is required.';
    isValid = false;
  }

  if (modalState.isCreate.value && !selectedDesktopFile.value) {
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
    if (modalState.isCreate.value) {
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
      await modalState.closeModal();
      await fetchBanners();
    } else if (modalState.isEdit.value && selectedBanner.value) {
      if (!canEdit.value) {
        formError.value = 'You do not have permission to edit banners.';
        isSubmitting.value = false;
        return;
      }

      const targetId = selectedBanner.value.id;
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
      await modalState.closeModal();
      await fetchBanners();
    }
  } catch (err: any) {
    formError.value = extractErrorMessage(err, 'Failed to save banner.');
  } finally {
    isSubmitting.value = false;
  }
};

// Fetch placements options
const fetchPlacements = async () => {
  isPlacementsLoading.value = true;
  try {
    const res = await bannerService.getPlacementsList({ page_size: 100 });
    placementsList.value = res.results || [];
    if (!formPayload.value.placement && placementsList.value.length > 0 && placementsList.value[0]) {
      formPayload.value.placement = String(placementsList.value[0].id);
    }
  } catch (err: any) {
    console.error('Failed to load placements list:', err);
  } finally {
    isPlacementsLoading.value = false;
  }
};

// Drag & drop / Reordering state
const draggedBannerId = ref<number | string | null>(null);
const dragOverBannerId = ref<number | string | null>(null);
const initialBannerIds = ref<Array<number | string>>([]);
const isSavingOrder = ref(false);

const currentBannerIds = computed(() => bannersList.value.map(b => b.id));

const hasUnsavedOrderChanges = computed(() => {
  if (!selectedPlacement.value) return false;
  if (initialBannerIds.value.length === 0 || currentBannerIds.value.length !== initialBannerIds.value.length) {
    return false;
  }
  return currentBannerIds.value.some((id, index) => String(id) !== String(initialBannerIds.value[index]));
});

// HTML5 Drag and Drop Event Handlers
const handleDragStart = (event: DragEvent, banner: Banner) => {
  if (!selectedPlacement.value || !canEdit.value) return;
  draggedBannerId.value = banner.id;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(banner.id));
  }
};

const handleDragOver = (event: DragEvent, targetBanner: Banner) => {
  event.preventDefault();
  if (!selectedPlacement.value || !canEdit.value) return;
  if (draggedBannerId.value !== null && String(draggedBannerId.value) !== String(targetBanner.id)) {
    dragOverBannerId.value = targetBanner.id;
  }
};

const handleDragLeave = (event: DragEvent, targetBanner: Banner) => {
  if (String(dragOverBannerId.value) === String(targetBanner.id)) {
    dragOverBannerId.value = null;
  }
};

const handleDrop = (event: DragEvent, targetBanner: Banner) => {
  event.preventDefault();
  if (!selectedPlacement.value || !canEdit.value) return;
  if (draggedBannerId.value === null || String(draggedBannerId.value) === String(targetBanner.id)) {
    draggedBannerId.value = null;
    dragOverBannerId.value = null;
    return;
  }

  const srcIndex = bannersList.value.findIndex(b => String(b.id) === String(draggedBannerId.value));
  const tgtIndex = bannersList.value.findIndex(b => String(b.id) === String(targetBanner.id));

  if (srcIndex !== -1 && tgtIndex !== -1) {
    const list = [...bannersList.value];
    const [moved] = list.splice(srcIndex, 1);
    if (moved) {
      list.splice(tgtIndex, 0, moved);
      list.forEach((item, index) => {
        item.display_order = index;
      });
      bannersList.value = list;
    }
  }

  draggedBannerId.value = null;
  dragOverBannerId.value = null;
};

const handleDragEnd = () => {
  draggedBannerId.value = null;
  dragOverBannerId.value = null;
};

// Keyboard & Button-based Reordering
const moveBannerUp = (index: number) => {
  if (index <= 0 || index >= bannersList.value.length || !selectedPlacement.value) return;
  const list = [...bannersList.value];
  const [moved] = list.splice(index, 1);
  if (moved) {
    list.splice(index - 1, 0, moved);
    list.forEach((item, idx) => {
      item.display_order = idx;
    });
    bannersList.value = list;
  }
};

const moveBannerDown = (index: number) => {
  if (index < 0 || index >= bannersList.value.length - 1 || !selectedPlacement.value) return;
  const list = [...bannersList.value];
  const [moved] = list.splice(index, 1);
  if (moved) {
    list.splice(index + 1, 0, moved);
    list.forEach((item, idx) => {
      item.display_order = idx;
    });
    bannersList.value = list;
  }
};

// Discard local order changes
const handleDiscardOrder = () => {
  if (!initialBannerIds.value.length) return;
  const map = new Map(bannersList.value.map(b => [String(b.id), b]));
  const restored: Banner[] = [];
  initialBannerIds.value.forEach((id, idx) => {
    const b = map.get(String(id));
    if (b) {
      b.display_order = idx;
      restored.push(b);
    }
  });
  bannersList.value.forEach(b => {
    if (!initialBannerIds.value.map(String).includes(String(b.id))) {
      restored.push(b);
    }
  });
  bannersList.value = restored;
  toastSuccess('Banner display order changes discarded.');
};

// Save Order API call
const handleSaveOrder = async () => {
  if (!hasUnsavedOrderChanges.value || isSavingOrder.value || !selectedPlacement.value) return;

  if (!canEdit.value) {
    toastError('You do not have permission to reorder banners.');
    return;
  }

  isSavingOrder.value = true;
  try {
    const placementId = Number(selectedPlacement.value);
    const payload = {
      placement: placementId,
      banners: bannersList.value.map((b, idx) => ({
        id: Number(b.id),
        display_order: idx
      }))
    };

    await bannerService.reorderBanners(payload);
    toastSuccess('Banner display order saved successfully.');
    initialBannerIds.value = bannersList.value.map(b => b.id);
    await fetchBanners();
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to save banner display order.');
    toastError(msg);
  } finally {
    isSavingOrder.value = false;
  }
};

const getRowAttrs = (item: Banner) => {
  if (!selectedPlacement.value || !canEdit.value) {
    return {};
  }
  return {
    draggable: true,
    onDragstart: (e: DragEvent) => handleDragStart(e, item),
    onDragover: (e: DragEvent) => handleDragOver(e, item),
    onDragleave: (e: DragEvent) => handleDragLeave(e, item),
    onDrop: (e: DragEvent) => handleDrop(e, item),
    onDragend: handleDragEnd
  };
};

const getRowClass = (item: Banner) => {
  if (draggedBannerId.value !== null && String(draggedBannerId.value) === String(item.id)) {
    return 'opacity-40 bg-muted/60 dark:bg-muted/40';
  }
  if (dragOverBannerId.value !== null && String(dragOverBannerId.value) === String(item.id)) {
    return 'border-t-2 border-primary bg-primary/5 dark:bg-primary/10';
  }
  return '';
};

// Fetch Banners List
const fetchBanners = async () => {
  isLoading.value = true;
  fetchError.value = null;

  try {
    const is_active_param = statusFilter.value === 'active' ? 'true' : statusFilter.value === 'inactive' ? 'false' : undefined;

    const res = await bannerService.getBannersList({
      page: currentPage.value,
      page_size: itemsPerPage.value,
      search: debouncedSearchQuery.value,
      placement: selectedPlacement.value || undefined,
      is_active: is_active_param,
      ordering: 'placement,display_order'
    });

    bannersList.value = res.results || [];
    initialBannerIds.value = bannersList.value.map(b => b.id);
    totalCount.value = res.count || 0;
    totalPages.value = res.pages || Math.ceil(totalCount.value / itemsPerPage.value) || 1;
  } catch (err: any) {
    fetchError.value = extractErrorMessage(err, 'Failed to retrieve banners list.');
  } finally {
    isLoading.value = false;
  }
};

// Sync URL query state on filter changes
const updateRouteAndFetch = () => {
  const query: Record<string, string | number | undefined> = {
    ...route.query,
    page: currentPage.value > 1 ? currentPage.value : undefined,
    pageSize: itemsPerPage.value !== 10 ? itemsPerPage.value : undefined,
    search: searchQuery.value.trim() || undefined,
    placement: selectedPlacement.value || undefined,
    status: statusFilter.value !== 'all' ? statusFilter.value : undefined
  };

  Object.keys(query).forEach((key) => {
    if (query[key] === undefined) {
      delete query[key];
    }
  });

  router.push({ query });
  fetchBanners();
};

watch(debouncedSearchQuery, () => {
  currentPage.value = 1;
  updateRouteAndFetch();
});

watch(selectedPlacement, (newVal, oldVal) => {
  if (oldVal !== undefined && oldVal !== newVal && hasUnsavedOrderChanges.value) {
    const confirmDiscard = window.confirm(
      'You have unsaved banner display order changes. Switching placement will discard these changes. Do you want to proceed?'
    );
    if (!confirmDiscard) {
      selectedPlacement.value = oldVal;
      return;
    }
  }
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

// Delete Banner Confirmation Handler
const handleDeleteBanner = async () => {
  const banner = selectedBanner.value;
  if (!banner) return;

  if (!canDelete.value) {
    toastError('You do not have permission to delete banners.');
    return;
  }

  isDeleting.value = true;
  try {
    await bannerService.deleteBanner(banner.id);
    toastSuccess(`Banner "${banner.title || '#' + banner.id}" has been deleted.`);
    await modalState.closeModal();
    if (bannersList.value.length === 1 && currentPage.value > 1) {
      currentPage.value--;
    }
    await fetchBanners();
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to delete banner.');
    toastError(msg);
  } finally {
    isDeleting.value = false;
  }
};

const activeBannersCount = computed(() => {
  return bannersList.value.filter(b => b.is_active).length;
});

const placementsCount = computed(() => {
  return placementsList.value.length;
});

const tableColumns = computed<UiTableColumn<Banner>[]>(() => {
  const cols: UiTableColumn<Banner>[] = [];
  if (selectedPlacement.value && canEdit.value) {
    cols.push({ key: 'reorder', label: 'Order', width: '90px', align: 'center' });
  }
  cols.push(
    { key: 'preview', label: 'Preview', width: '100px', align: 'center' },
    { key: 'details', label: 'Banner Details', width: '280px' },
    { key: 'placement', label: 'Placement', width: '160px' },
    { key: 'display_order', label: 'Position', width: '90px', align: 'center' },
    { key: 'schedule', label: 'Schedule', width: '170px' },
    { key: 'status', label: 'Status', width: '110px', align: 'center' },
    { key: 'actions', label: 'Actions', width: '110px', align: 'right' }
  );
  return cols;
});

onMounted(async () => {
  if (canView.value) {
    await fetchPlacements();
    await fetchBanners();
  }
});
</script>

<template>
  <NuxtLayout name="admin">
    <template #header-title>
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground/40 font-light select-none">/</span>
        <h1 class="text-xl font-display font-extrabold tracking-tight text-foreground">
          Banner Management
        </h1>
      </div>
    </template>

    <template #header-actions>
      <div class="flex flex-wrap items-center gap-2">
        <UiButton 
          variant="outline" 
          class="rounded-xl h-9 px-3.5 gap-1.5 border-border font-bold text-xs"
          @click="fetchBanners"
          :disabled="isLoading"
        >
          <RefreshCw :class="['w-3.5 h-3.5', isLoading && 'animate-spin']" />
          <span>Refresh</span>
        </UiButton>

        <UiButton 
          variant="outline" 
          class="rounded-xl h-9 px-3.5 gap-1.5 border-border font-bold text-xs"
          to="/admin/placements/"
        >
          <Layers class="w-3.5 h-3.5" />
          <span>Manage Placements</span>
        </UiButton>

        <UiButton 
          v-if="canCreate"
          class="rounded-xl h-9 px-3.5 gap-1.5 shadow-md shadow-primary/10 bg-primary text-primary-foreground font-bold text-xs"
          @click="modalState.openCreate()"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Add Banner</span>
        </UiButton>
      </div>
    </template>

    <!-- Permission Guard for Unprivileged Users -->
    <div v-if="!canView" class="p-8 text-center bg-card border border-border rounded-2xl shadow-xs">
      <AlertCircle class="w-12 h-12 text-destructive mx-auto mb-3" />
      <h2 class="text-lg font-bold text-foreground mb-1">Access Restricted</h2>
      <p class="text-sm text-muted-foreground">You do not have permission to view the Banner Management module.</p>
    </div>

    <div v-else class="space-y-4 animate-in fade-in duration-500">
      
      <!-- Summary Analytics Row -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <UiCard class="flex items-center gap-3.5 p-3.5">
          <div class="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-inner">
            <ImageIcon class="w-5 h-5" />
          </div>
          <div>
            <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Total Banners</p>
            <p class="text-2xl font-display font-extrabold tracking-tight text-foreground leading-tight">{{ totalCount }}</p>
          </div>
        </UiCard>

        <UiCard class="flex items-center gap-3.5 p-3.5">
          <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
            <CheckCircle2 class="w-5 h-5" />
          </div>
          <div>
            <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Active Banners</p>
            <p class="text-2xl font-display font-extrabold tracking-tight text-foreground leading-tight">{{ activeBannersCount }}</p>
          </div>
        </UiCard>

        <UiCard class="flex items-center gap-3.5 p-3.5">
          <div class="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
            <Layers class="w-5 h-5" />
          </div>
          <div>
            <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Total Placements</p>
            <p class="text-2xl font-display font-extrabold tracking-tight text-foreground leading-tight">{{ placementsCount }}</p>
          </div>
        </UiCard>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border px-3.5 py-2.5 rounded-xl shadow-xs">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
          <!-- Search Box -->
          <UiSearchInput 
            v-model="searchQuery" 
            placeholder="Search banner title, subtitle, CTA..." 
            class="w-full sm:w-80"
          />

          <!-- Placement Filter -->
          <div class="flex items-center gap-2">
            <label class="text-xs font-semibold text-muted-foreground shrink-0 hidden md:inline">Placement:</label>
            <select
              v-model="selectedPlacement"
              class="h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer w-full sm:w-48"
            >
              <option value="">All Placements</option>
              <option v-for="p in placementsList" :key="p.id" :value="p.id">
                {{ p.name }} ({{ p.code }})
              </option>
            </select>
          </div>

          <!-- Active Status Filter -->
          <div class="flex items-center gap-2">
            <label class="text-xs font-semibold text-muted-foreground shrink-0 hidden md:inline">Status:</label>
            <select
              v-model="statusFilter"
              class="h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer w-full sm:w-36"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Error State Banner -->
      <div v-if="fetchError" class="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center justify-between text-destructive">
        <div class="flex items-center gap-3">
          <AlertCircle class="w-5 h-5 shrink-0" />
          <span class="text-xs font-medium">{{ fetchError }}</span>
        </div>
        <UiButton variant="outline" size="sm" class="h-8 text-xs border-destructive/30 hover:bg-destructive/10" @click="fetchBanners">
          Retry
        </UiButton>
      </div>

      <!-- Unsaved Reorder Changes Banner -->
      <div v-if="hasUnsavedOrderChanges" class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-wrap items-center justify-between gap-3 text-amber-800 dark:text-amber-300 shadow-xs">
        <div class="flex items-center gap-2.5">
          <AlertCircle class="w-4.5 h-4.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span class="text-xs font-bold">
            You have unsaved display order changes for this placement zone.
          </span>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <UiButton 
            variant="outline" 
            size="sm" 
            class="h-8 px-3 text-xs border-amber-500/30 hover:bg-amber-500/10 text-amber-800 dark:text-amber-200 font-bold" 
            @click="handleDiscardOrder"
            :disabled="isSavingOrder"
          >
            <RotateCcw class="w-3.5 h-3.5 mr-1" />
            <span>Discard</span>
          </UiButton>
          <UiButton 
            size="sm" 
            class="h-8 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs" 
            @click="handleSaveOrder"
            :disabled="isSavingOrder"
          >
            <Loader2 v-if="isSavingOrder" class="w-3.5 h-3.5 mr-1 animate-spin" />
            <Save v-else class="w-3.5 h-3.5 mr-1" />
            <span>Save Order</span>
          </UiButton>
        </div>
      </div>

      <!-- Main Data Table -->
      <div class="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <UiTable
          :columns="tableColumns"
          :data="bannersList"
          :loading="isLoading"
          key-field="id"
          :row-attrs="getRowAttrs"
          :row-class="getRowClass"
          empty-text="No banners found"
          empty-description="Adjust your search criteria or create a new banner to populate this placement."
        >
          <!-- Custom Column: Reorder Drag Handle & Controls -->
          <template #cell-reorder="{ item, index }">
            <div class="flex items-center justify-center gap-1">
              <button
                type="button"
                class="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted cursor-grab active:cursor-grabbing transition-colors"
                title="Drag to reorder banner"
                :disabled="!selectedPlacement || !canEdit"
              >
                <GripVertical class="w-4 h-4" />
              </button>
              <div class="flex flex-col gap-0.5">
                <button
                  type="button"
                  class="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                  :disabled="index === 0 || !canEdit"
                  title="Move up"
                  @click.stop="moveBannerUp(index)"
                >
                  <ArrowUp class="w-3 h-3" />
                </button>
                <button
                  type="button"
                  class="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                  :disabled="index === bannersList.length - 1 || !canEdit"
                  title="Move down"
                  @click.stop="moveBannerDown(index)"
                >
                  <ArrowDown class="w-3 h-3" />
                </button>
              </div>
            </div>
          </template>
          <!-- Custom Column: Image Preview -->
          <template #cell-preview="{ item }">
            <div class="w-16 h-10 rounded-lg bg-muted border border-border/80 overflow-hidden shrink-0 flex items-center justify-center relative group">
              <img
                v-if="item.image && !imageErrorMap[item.id]"
                :src="item.image"
                :alt="item.title || 'Banner Preview'"
                class="w-full h-full object-cover transition-transform group-hover:scale-105"
                @error="handleImageError(item.id)"
              />
              <div v-else class="flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon class="w-4 h-4" />
              </div>
            </div>
          </template>

          <!-- Custom Column: Details -->
          <template #cell-details="{ item }">
            <div class="space-y-1 py-1">
              <p class="font-bold text-xs text-foreground line-clamp-1">
                {{ item.title || 'Untitled Banner' }}
              </p>
              <p v-if="item.subtitle" class="text-[11px] text-muted-foreground line-clamp-1">
                {{ item.subtitle }}
              </p>
              <div v-if="item.cta_text || item.cta_url" class="flex items-center gap-1.5 pt-0.5">
                <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  <ExternalLink class="w-2.5 h-2.5" />
                  {{ item.cta_text || 'Link' }}
                </span>
                <span v-if="item.cta_url" class="text-[10px] font-mono text-muted-foreground/80 truncate max-w-[140px]">
                  {{ item.cta_url }}
                </span>
              </div>
            </div>
          </template>

          <!-- Custom Column: Placement -->
          <template #cell-placement="{ item }">
            <div class="space-y-0.5">
              <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
                {{ getPlacementDisplayName(item) }}
              </span>
              <p v-if="getPlacementCode(item)" class="text-[10px] font-mono text-muted-foreground pl-0.5">
                {{ getPlacementCode(item) }}
              </p>
            </div>
          </template>

          <!-- Custom Column: Display Order -->
          <template #cell-display_order="{ item }">
            <span class="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-mono font-extrabold text-foreground bg-muted rounded-md border border-border">
              {{ item.display_order }}
            </span>
          </template>

          <!-- Custom Column: Schedule -->
          <template #cell-schedule="{ item }">
            <div class="space-y-0.5 text-[11px]">
              <div v-if="item.start_at" class="flex items-center gap-1 text-muted-foreground">
                <span class="text-[9px] uppercase font-bold text-muted-foreground/70">From:</span>
                <span class="font-mono text-[10px]">{{ formatDate(item.start_at) }}</span>
              </div>
              <div v-if="item.end_at" class="flex items-center gap-1 text-muted-foreground">
                <span class="text-[9px] uppercase font-bold text-muted-foreground/70">To:</span>
                <span class="font-mono text-[10px]">{{ formatDate(item.end_at) }}</span>
              </div>
              <div v-if="!item.start_at && !item.end_at" class="text-muted-foreground/80 italic text-[11px]">
                Always active
              </div>
            </div>
          </template>

          <!-- Custom Column: Status -->
          <template #cell-status="{ item }">
            <div class="flex items-center justify-center">
              <span
                :class="[
                  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border',
                  isCurrentlyScheduled(item).active
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/40'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/50 dark:border-rose-800/40'
                ]"
              >
                <span :class="['w-1.5 h-1.5 rounded-full', isCurrentlyScheduled(item).active ? 'bg-emerald-500' : 'bg-rose-500']"></span>
                {{ isCurrentlyScheduled(item).statusText }}
              </span>
            </div>
          </template>

          <!-- Custom Column: Actions -->
          <template #cell-actions="{ item }">
            <div class="flex items-center justify-end gap-1">
              <UiButton
                v-if="canEdit"
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                title="Edit Banner"
                @click="modalState.openEdit(item.id)"
              >
                <Edit2 class="w-3.5 h-3.5" />
              </UiButton>

              <UiButton
                v-if="canDelete"
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-lg"
                title="Delete Banner"
                @click="modalState.openDelete(item.id)"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </UiButton>
            </div>
          </template>
        </UiTable>

        <!-- Pagination Controls -->
        <div v-if="totalCount > 0" class="border-t border-border px-3.5 py-2 bg-card">
          <UiPagination
            v-model:current-page="currentPage"
            :total-pages="totalPages"
            :total-count="totalCount"
            :items-per-page="itemsPerPage"
            item-label="banners"
          />
        </div>
      </div>
    </div>

    <!-- Create & Edit Banner Modal -->
    <UiAdminModal
      :is-open="modalState.isCreate.value || modalState.isEdit.value"
      :title="modalState.isCreate.value ? 'Add New Banner' : 'Edit Banner'"
      :subtitle="modalState.isCreate.value ? 'Configure placement, layout, creative assets, and scheduling.' : 'Update banner details, imagery, schedule, or status.'"
      max-width="max-w-3xl"
      @close="modalState.closeModal()"
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
                <option v-for="p in placementsList" :key="p.id" :value="String(p.id)">
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
                  <span>Desktop Image <span class="text-destructive" v-if="modalState.isCreate.value">*</span></span>
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
            @click="modalState.closeModal()"
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
            <span>{{ modalState.isCreate.value ? 'Create Banner' : 'Save Changes' }}</span>
          </UiButton>
        </div>
      </form>
    </UiAdminModal>

    <!-- Delete Confirmation Modal -->
    <UiAdminModal
      :is-open="modalState.isDelete.value"
      title="Delete Banner"
      subtitle="Are you sure you want to permanently remove this banner?"
      @close="modalState.closeModal()"
    >
      <div v-if="selectedBanner" class="space-y-4">
        <div class="p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3">
          <div class="w-12 h-12 rounded-lg bg-background border border-border overflow-hidden shrink-0 flex items-center justify-center">
            <img 
              v-if="selectedBanner.image" 
              :src="selectedBanner.image" 
              class="w-full h-full object-cover" 
              :alt="selectedBanner.title || 'Banner'"
            />
            <ImageIcon v-else class="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p class="font-bold text-sm text-foreground">{{ selectedBanner.title || 'Untitled Banner #' + selectedBanner.id }}</p>
            <p class="text-xs text-muted-foreground">{{ getPlacementDisplayName(selectedBanner) }} (Order: {{ selectedBanner.display_order }})</p>
          </div>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          This action cannot be undone. Removing this banner will immediately unpublish it from the storefront layout.
        </p>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <UiButton 
            variant="outline" 
            class="h-9 px-4 text-xs font-semibold rounded-xl"
            @click="modalState.closeModal()"
            :disabled="isDeleting"
          >
            Cancel
          </UiButton>
          <UiButton 
            variant="destructive" 
            class="h-9 px-4 text-xs font-semibold rounded-xl"
            @click="handleDeleteBanner"
            :disabled="isDeleting"
          >
            <RefreshCw v-if="isDeleting" class="w-3.5 h-3.5 animate-spin mr-1.5" />
            <span>Confirm Delete</span>
          </UiButton>
        </div>
      </div>
    </UiAdminModal>
  </NuxtLayout>
</template>
