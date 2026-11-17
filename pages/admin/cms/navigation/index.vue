<!-- File: /pages/admin/cms/navigation/index.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted, provide } from 'vue';
import {
  Menu,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  ChevronRight,
  ListTree,
  FolderOpen,
  X,
  CheckCircle2,
  FileText,
  Globe,
  Check,
  ChevronsUpDown,
  ChevronsDownUp
} from 'lucide-vue-next';
import { refDebounced } from '@vueuse/core';
import { useCmsService } from '@/composables/useCmsService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useAdminModalState } from '@/composables/useAdminModalState';
import { useInfinitePagination } from '@/composables/useInfinitePagination';
import { toastSuccess, toastError, extractErrorMessage, handleApiError } from '@/composables/useToast';
import type {
  CmsNavigationMenu,
  CmsNavigationItem,
  CmsPage,
  NavigationLinkType,
  CreateNavigationMenuPayload,
  UpdateNavigationMenuPayload,
  CreateNavigationItemPayload,
  UpdateNavigationItemPayload
} from '@/types/cms';
import type { UiTableColumn } from '@/components/ui/UiTable.vue';
import type { NavigationTreeItem } from '@/components/admin/NavigationTreeNode.vue';
import NavigationTreeNode from '@/components/admin/NavigationTreeNode.vue';
import UiTable from '@/components/ui/UiTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import UiSearchInput from '@/components/ui/UiSearchInput.vue';
import UiAdminModal from '@/components/ui/UiAdminModal.vue';
import UiInfiniteScroll from '@/components/ui/UiInfiniteScroll.vue';
import UiButton from '@/components/ui/Button.vue';

definePageMeta({
  layout: false
});

const NAV_PERMISSION = ['cms.manage_cms_navigation', 'cms_api.manage_cms_navigation', 'manage_cms_navigation'];

const route = useRoute();
const router = useRouter();
const cmsService = useCmsService();
const {
  canViewModule,
  canCreateInModule,
  canEditInModule,
  canDeleteInModule,
  hasPermission
} = useAdminPermissions();

const hasManagePermission = computed(() => hasPermission(NAV_PERMISSION));
const canView = computed(() => canViewModule('/admin/cms/navigation') && hasManagePermission.value);
const canCreate = computed(() => canCreateInModule('/admin/cms/navigation') && hasManagePermission.value);
const canEdit = computed(() => canEditInModule('/admin/cms/navigation') && hasManagePermission.value);
const canDelete = computed(() => canDeleteInModule('/admin/cms/navigation') && hasManagePermission.value);

// ---------------------------------------------------------------------------
// Menus List State & Filtering / Pagination
// ---------------------------------------------------------------------------
const menusList = ref<CmsNavigationMenu[]>([]);
const isLoading = ref(false);
const fetchError = ref<string | null>(null);

const initialStatus = route.query.status === 'active' || route.query.status === 'inactive' ? route.query.status : 'all';
const searchQuery = ref(route.query.search ? String(route.query.search) : '');
const debouncedSearchQuery = refDebounced(searchQuery, 300);
const statusFilter = ref<'all' | 'active' | 'inactive'>(initialStatus);
const currentPage = ref(route.query.page ? parseInt(String(route.query.page), 10) || 1 : 1);
const itemsPerPage = ref(route.query.pageSize ? parseInt(String(route.query.pageSize), 10) || 10 : 10);

const filteredAllMenus = computed<CmsNavigationMenu[]>(() => {
  const q = debouncedSearchQuery.value.trim().toLowerCase();
  return menusList.value.filter((m) => {
    if (statusFilter.value === 'active' && !m.is_active) return false;
    if (statusFilter.value === 'inactive' && m.is_active) return false;
    if (q) {
      const nameMatch = m.name.toLowerCase().includes(q);
      const keyMatch = m.key.toLowerCase().includes(q);
      if (!nameMatch && !keyMatch) return false;
    }
    return true;
  });
});

const totalCount = computed(() => filteredAllMenus.value.length);
const totalPages = computed(() => Math.ceil(totalCount.value / itemsPerPage.value) || 1);
const paginatedMenus = computed<CmsNavigationMenu[]>(() => {
  const safePage = Math.min(Math.max(currentPage.value, 1), totalPages.value);
  const start = (safePage - 1) * itemsPerPage.value;
  return filteredAllMenus.value.slice(start, start + itemsPerPage.value);
});

const fetchMenus = async () => {
  if (!canView.value) return;
  isLoading.value = true;
  fetchError.value = null;
  try {
    menusList.value = await cmsService.getNavigationMenus();
  } catch (err: any) {
    fetchError.value = extractErrorMessage(err, 'Failed to retrieve navigation menus.');
  } finally {
    isLoading.value = false;
  }
};

const syncMenuListQuery = () => {
  const query: Record<string, string | number | undefined> = {
    ...route.query,
    page: currentPage.value > 1 ? currentPage.value : undefined,
    pageSize: itemsPerPage.value !== 10 ? itemsPerPage.value : undefined,
    search: debouncedSearchQuery.value.trim() || undefined,
    status: statusFilter.value !== 'all' ? statusFilter.value : undefined
  };
  Object.keys(query).forEach((k) => {
    if (query[k] === undefined) delete query[k];
  });
  router.replace({ query });
};

watch(debouncedSearchQuery, () => {
  currentPage.value = 1;
  syncMenuListQuery();
});

watch(statusFilter, () => {
  currentPage.value = 1;
  syncMenuListQuery();
});

watch(itemsPerPage, () => {
  currentPage.value = 1;
  syncMenuListQuery();
});

watch(currentPage, () => {
  syncMenuListQuery();
});

// ---------------------------------------------------------------------------
// Menu CRUD Modals (URL-driven via useAdminModalState)
// ---------------------------------------------------------------------------
const modalState = useAdminModalState<CmsNavigationMenu>({
  getItems: async (id) => {
    return await cmsService.getNavigationMenuDetail(id);
  },
  onResolveError: (id) => {
    toastError(`Navigation Menu #${id} could not be retrieved.`);
    modalState.closeModal({ replace: true });
  }
});

const modalMenuEntity = computed(() => modalState.activeEntity.value);

const isMenuSubmitting = ref(false);
const isDeletingMenu = ref(false);
const menuFormError = ref<string | null>(null);
const hasManuallyEditedMenuKey = ref(false);

const menuForm = ref<CreateNavigationMenuPayload>({
  name: '',
  key: ''
});

const slugifyKey = (val: string): string => {
  return val
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '');
};

const handleMenuNameInput = () => {
  if (modalState.isCreate.value && !hasManuallyEditedMenuKey.value) {
    menuForm.value.key = slugifyKey(menuForm.value.name);
  }
};

const handleMenuKeyInput = () => {
  hasManuallyEditedMenuKey.value = true;
};

const openCreateMenuModal = () => {
  if (!canCreate.value) {
    toastError('You do not have permission to create navigation menus.');
    return;
  }
  menuFormError.value = null;
  hasManuallyEditedMenuKey.value = false;
  menuForm.value = { name: '', key: '' };
  modalState.openCreate();
};

const openEditMenuModal = (menu: CmsNavigationMenu) => {
  if (!canEdit.value) {
    toastError('You do not have permission to edit navigation menus.');
    return;
  }
  menuFormError.value = null;
  hasManuallyEditedMenuKey.value = true;
  menuForm.value = { name: menu.name, key: menu.key };
  modalState.openEdit(menu.id);
};

const openDeleteMenuModal = (menu: CmsNavigationMenu) => {
  if (!canDelete.value) {
    toastError('You do not have permission to delete navigation menus.');
    return;
  }
  modalState.openDelete(menu.id);
};

watch(
  () => [modalState.isCreate.value, modalState.isEdit.value, modalState.isDelete.value] as const,
  ([isCreate, isEdit, isDelete]) => {
    if (isCreate) {
      if (!canCreate.value) {
        toastError('You do not have permission to create navigation menus.');
        modalState.closeModal({ replace: true });
        return;
      }
      menuFormError.value = null;
      hasManuallyEditedMenuKey.value = false;
      menuForm.value = { name: '', key: '' };
    } else if (isEdit) {
      if (!canEdit.value) {
        toastError('You do not have permission to edit navigation menus.');
        modalState.closeModal({ replace: true });
        return;
      }
      menuFormError.value = null;
      hasManuallyEditedMenuKey.value = true;
    } else if (isDelete) {
      if (!canDelete.value) {
        toastError('You do not have permission to delete navigation menus.');
        modalState.closeModal({ replace: true });
      }
    }
  },
  { immediate: true }
);

watch(modalMenuEntity, (menu) => {
  if (menu && modalState.isEdit.value) {
    menuForm.value = {
      name: menu.name || '',
      key: menu.key || ''
    };
    menuFormError.value = null;
    hasManuallyEditedMenuKey.value = true;
  }
}, { immediate: true });

const validateMenuForm = (): boolean => {
  const trimmedName = menuForm.value.name.trim();
  const trimmedKey = menuForm.value.key.trim();

  if (!trimmedName) {
    menuFormError.value = 'Menu name is required.';
    return false;
  }
  if (!trimmedKey) {
    menuFormError.value = 'Menu key is required.';
    return false;
  }
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(trimmedKey)) {
    menuFormError.value = 'Menu key may only contain letters, numbers, hyphens, and underscores (starting with a letter or number).';
    return false;
  }
  menuFormError.value = null;
  return true;
};

const handleSubmitMenu = async () => {
  if (isMenuSubmitting.value) return;
  const isEditMode = modalState.isEdit.value;

  if (isEditMode && !canEdit.value) {
    toastError('You do not have permission to edit navigation menus.');
    return;
  }
  if (!isEditMode && !canCreate.value) {
    toastError('You do not have permission to create navigation menus.');
    return;
  }
  if (!validateMenuForm()) return;

  isMenuSubmitting.value = true;
  menuFormError.value = null;

  try {
    if (isEditMode) {
      const targetMenu = modalMenuEntity.value;
      if (!targetMenu) {
        menuFormError.value = 'Unable to resolve the selected navigation menu.';
        return;
      }
      const patchPayload: UpdateNavigationMenuPayload = {};
      const nextName = menuForm.value.name.trim();
      const nextKey = menuForm.value.key.trim();
      if (nextName !== targetMenu.name) patchPayload.name = nextName;
      if (nextKey !== targetMenu.key) patchPayload.key = nextKey;

      if (Object.keys(patchPayload).length === 0) {
        await modalState.closeModal();
        return;
      }

      const updated = await cmsService.updateNavigationMenu(targetMenu.id, patchPayload);
      toastSuccess(`Navigation Menu "${updated.name}" updated.`);
      await modalState.closeModal();
      await fetchMenus();
      if (selectedMenuId.value === updated.id) {
        await loadSelectedMenuDetail(updated.id, { silent: true });
      }
    } else {
      const payload: CreateNavigationMenuPayload = {
        name: menuForm.value.name.trim(),
        key: menuForm.value.key.trim()
      };
      const created = await cmsService.createNavigationMenu(payload);
      toastSuccess(`Navigation Menu "${created.name}" created.`);
      await modalState.closeModal();
      await fetchMenus();
      await selectMenuById(created.id);
    }
  } catch (err: any) {
    menuFormError.value = extractErrorMessage(err, `Failed to ${isEditMode ? 'update' : 'create'} navigation menu.`);
  } finally {
    isMenuSubmitting.value = false;
  }
};

const handleDeleteMenu = async () => {
  if (isDeletingMenu.value) return;
  const m = modalMenuEntity.value;
  if (!m) return;
  if (!canDelete.value) {
    toastError('You do not have permission to delete navigation menus.');
    return;
  }

  isDeletingMenu.value = true;
  try {
    const deletedId = m.id;
    const deletedName = m.name;
    await cmsService.deleteNavigationMenu(deletedId);
    toastSuccess(`Navigation Menu "${deletedName}" deleted.`);
    await modalState.closeModal();

    if (selectedMenuId.value === deletedId) {
      clearSelectedMenu();
    }
    await fetchMenus();
    if (paginatedMenus.value.length === 0 && currentPage.value > 1) {
      currentPage.value--;
    }
  } catch (err: any) {
    toastError(extractErrorMessage(err, 'Failed to delete navigation menu.'));
  } finally {
    isDeletingMenu.value = false;
  }
};

// ---------------------------------------------------------------------------
// Selected Menu & Navigation Items Tree Workspace
// ---------------------------------------------------------------------------
const initialMenuId = route.query.menuId ? parseInt(String(route.query.menuId), 10) || null : null;
const selectedMenuId = ref<number | null>(initialMenuId);
const selectedMenuDetail = ref<CmsNavigationMenu | null>(null);
const isLoadingItems = ref(false);
const itemsError = ref<string | null>(null);
const itemSearchQuery = ref('');
const expandedItemIds = ref<number[]>([]);
const isReordering = ref(false);
const togglingVisibilityId = ref<number | null>(null);
const itemsWorkspaceRef = ref<HTMLElement | null>(null);

const draggedNavItem = ref<NavigationTreeItem | null>(null);
const dragOverNavItemId = ref<number | null>(null);
provide('draggedNavItem', draggedNavItem);
provide('dragOverNavItemId', dragOverNavItemId);

const syncSelectedMenuQuery = (menuId: number | null) => {
  const query: Record<string, string | number | undefined> = {
    ...route.query,
    menuId: menuId !== null ? menuId : undefined
  };
  Object.keys(query).forEach((k) => {
    if (query[k] === undefined) delete query[k];
  });
  router.replace({ query });
};

const flatMenuItems = computed<CmsNavigationItem[]>(() => {
  const raw = selectedMenuDetail.value?.items;
  if (!Array.isArray(raw)) return [];
  return [...raw].sort((a, b) => {
    const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0);
    return orderDiff !== 0 ? orderDiff : a.id - b.id;
  });
});

const buildNavigationTree = (flatItems: CmsNavigationItem[]): NavigationTreeItem[] => {
  const byParent = new Map<number | null, CmsNavigationItem[]>();
  const itemById = new Map<number, CmsNavigationItem>();

  for (const item of flatItems) {
    itemById.set(item.id, item);
  }

  for (const item of flatItems) {
    const parentId = item.parent !== null && item.parent !== undefined && itemById.has(item.parent)
      ? item.parent
      : null;
    const bucket = byParent.get(parentId) || [];
    bucket.push(item);
    byParent.set(parentId, bucket);
  }

  const visited = new Set<number>();

  const buildBranch = (parentId: number | null): NavigationTreeItem[] => {
    const children = byParent.get(parentId) || [];
    const sorted = [...children].sort((a, b) => {
      const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0);
      return orderDiff !== 0 ? orderDiff : a.id - b.id;
    });

    const nodes: NavigationTreeItem[] = [];
    for (const child of sorted) {
      if (visited.has(child.id)) continue;
      visited.add(child.id);
      nodes.push({
        ...child,
        children: buildBranch(child.id)
      });
    }
    return nodes;
  };

  return buildBranch(null);
};

const fullNavigationTree = computed<NavigationTreeItem[]>(() => {
  return buildNavigationTree(flatMenuItems.value);
});

const hasActiveItemSearch = computed(() => itemSearchQuery.value.trim().length > 0);

const filterNavigationTree = (nodes: NavigationTreeItem[], q: string): NavigationTreeItem[] => {
  if (!q) return nodes;
  const term = q.toLowerCase();
  const result: NavigationTreeItem[] = [];

  for (const node of nodes) {
    const filteredChildren = filterNavigationTree(node.children, q);
    const pageInfo = node.page ? pageLookup.value[node.page] : undefined;
    const matchesSelf =
      node.label.toLowerCase().includes(term) ||
      (node.external_url && node.external_url.toLowerCase().includes(term)) ||
      (pageInfo && (pageInfo.title.toLowerCase().includes(term) || pageInfo.slug.toLowerCase().includes(term)));

    if (matchesSelf || filteredChildren.length > 0) {
      result.push({
        ...node,
        children: filteredChildren
      });
    }
  }
  return result;
};

const visibleNavigationTree = computed<NavigationTreeItem[]>(() => {
  const q = itemSearchQuery.value.trim();
  return filterNavigationTree(fullNavigationTree.value, q);
});

const allParentItemIds = computed<number[]>(() => {
  const ids: number[] = [];
  const walk = (nodes: NavigationTreeItem[]) => {
    for (const node of nodes) {
      if (node.children.length > 0) {
        ids.push(node.id);
        walk(node.children);
      }
    }
  };
  walk(fullNavigationTree.value);
  return ids;
});

const expandAllItems = () => {
  expandedItemIds.value = [...allParentItemIds.value];
};

const collapseAllItems = () => {
  expandedItemIds.value = [];
};

const toggleExpandItem = (id: number) => {
  if (expandedItemIds.value.includes(id)) {
    expandedItemIds.value = expandedItemIds.value.filter(existing => existing !== id);
  } else {
    expandedItemIds.value = [...expandedItemIds.value, id];
  }
};

const loadSelectedMenuDetail = async (menuId: number, options: { silent?: boolean; autoExpandRoots?: boolean } = {}) => {
  if (!canView.value) return;
  if (!options.silent) {
    isLoadingItems.value = true;
  }
  itemsError.value = null;

  try {
    const detail = await cmsService.getNavigationMenuDetail(menuId);
    selectedMenuDetail.value = detail;

    // Keep menusList item count synced cleanly
    menusList.value = menusList.value.map(m => (m.id === detail.id ? { ...m, ...detail } : m));

    if (options.autoExpandRoots) {
      const parentIdsWithChildren = new Set<number>();
      for (const item of detail.items || []) {
        if (item.parent !== null && item.parent !== undefined) {
          parentIdsWithChildren.add(item.parent);
        }
      }
      expandedItemIds.value = Array.from(parentIdsWithChildren);
    }
  } catch (err: any) {
    itemsError.value = extractErrorMessage(err, 'Failed to load navigation menu items.');
  } finally {
    if (!options.silent) {
      isLoadingItems.value = false;
    }
  }
};

const selectMenuById = async (menuId: number) => {
  selectedMenuId.value = menuId;
  itemSearchQuery.value = '';
  syncSelectedMenuQuery(menuId);
  await loadSelectedMenuDetail(menuId, { autoExpandRoots: true });
};

const clearSelectedMenu = () => {
  selectedMenuId.value = null;
  selectedMenuDetail.value = null;
  itemsError.value = null;
  itemSearchQuery.value = '';
  expandedItemIds.value = [];
  syncSelectedMenuQuery(null);
};

// ---------------------------------------------------------------------------
// Sibling-Only Reordering
// ---------------------------------------------------------------------------
const submitSiblingReorder = async (parentId: number | null, orderedSiblingIds: number[]) => {
  if (!selectedMenuDetail.value || !canEdit.value || isReordering.value) return;

  const menuId = selectedMenuDetail.value.id;
  const previousDetail = selectedMenuDetail.value;

  // Apply immediate optimistic sort_order update for smooth UI feedback
  const orderIndexMap = new Map<number, number>();
  orderedSiblingIds.forEach((id, idx) => orderIndexMap.set(id, idx));

  if (selectedMenuDetail.value.items) {
    selectedMenuDetail.value = {
      ...selectedMenuDetail.value,
      items: selectedMenuDetail.value.items.map((item) => {
        const nextIdx = orderIndexMap.get(item.id);
        return nextIdx !== undefined ? { ...item, sort_order: nextIdx } : item;
      })
    };
  }

  isReordering.value = true;
  try {
    await cmsService.reorderNavigationItems(menuId, {
      parent: parentId,
      order: orderedSiblingIds
    });
    toastSuccess('Navigation item order updated.');
    await loadSelectedMenuDetail(menuId, { silent: true });
  } catch (err: any) {
    selectedMenuDetail.value = previousDetail;
    handleApiError(err, 'Failed to reorder navigation items.');
    await loadSelectedMenuDetail(menuId, { silent: true });
  } finally {
    isReordering.value = false;
  }
};

const getSortedSiblings = (parentId: number | null): CmsNavigationItem[] => {
  return flatMenuItems.value
    .filter(i => (i.parent ?? null) === parentId)
    .sort((a, b) => {
      const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0);
      return orderDiff !== 0 ? orderDiff : a.id - b.id;
    });
};

const handleMoveSibling = async ({ item, direction }: { item: NavigationTreeItem; direction: 'up' | 'down' }) => {
  if (!canEdit.value) {
    toastError('You do not have permission to reorder navigation items.');
    return;
  }
  if (hasActiveItemSearch.value || isReordering.value) return;

  const parentId = item.parent ?? null;
  const siblings = getSortedSiblings(parentId);
  const currentIdx = siblings.findIndex(s => s.id === item.id);
  if (currentIdx === -1) return;

  const targetIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;
  if (targetIdx < 0 || targetIdx >= siblings.length) return;

  const reordered = [...siblings];
  const [moved] = reordered.splice(currentIdx, 1);
  if (!moved) return;
  reordered.splice(targetIdx, 0, moved);

  await submitSiblingReorder(parentId, reordered.map(s => s.id));
};

const handleReorderDrop = async ({ source, target }: { source: NavigationTreeItem; target: NavigationTreeItem }) => {
  if (!canEdit.value) {
    toastError('You do not have permission to reorder navigation items.');
    return;
  }
  if (hasActiveItemSearch.value || isReordering.value) return;

  const sourceParent = source.parent ?? null;
  const targetParent = target.parent ?? null;

  if (sourceParent !== targetParent) {
    toastError('Items can only be reordered within the same parent level. Use Edit to change an item’s parent.');
    return;
  }

  const siblings = getSortedSiblings(sourceParent);
  const sourceIdx = siblings.findIndex(s => s.id === source.id);
  const targetIdx = siblings.findIndex(s => s.id === target.id);
  if (sourceIdx === -1 || targetIdx === -1 || sourceIdx === targetIdx) return;

  const reordered = [...siblings];
  const [moved] = reordered.splice(sourceIdx, 1);
  if (!moved) return;
  reordered.splice(targetIdx, 0, moved);

  await submitSiblingReorder(sourceParent, reordered.map(s => s.id));
};

// ---------------------------------------------------------------------------
// Quick Visibility Toggle (PATCH)
// ---------------------------------------------------------------------------
const handleToggleVisibility = async (item: NavigationTreeItem) => {
  if (!selectedMenuDetail.value || !canEdit.value) {
    toastError('You do not have permission to update navigation items.');
    return;
  }
  if (togglingVisibilityId.value === item.id) return;

  togglingVisibilityId.value = item.id;
  try {
    await cmsService.updateNavigationItem(selectedMenuDetail.value.id, item.id, {
      is_visible: !item.is_visible
    });
    toastSuccess(`"${item.label}" is now ${!item.is_visible ? 'visible' : 'hidden'}.`);
    await loadSelectedMenuDetail(selectedMenuDetail.value.id, { silent: true });
  } catch (err: any) {
    handleApiError(err, 'Failed to update item visibility.');
  } finally {
    togglingVisibilityId.value = null;
  }
};

// ---------------------------------------------------------------------------
// Paginated CMS Page Selector (useInfinitePagination + <UiInfiniteScroll />)
// ---------------------------------------------------------------------------
const pageSearchQuery = ref('');
const hasLoadedPagesOnce = ref(false);
const resolvedPageCache = ref<Record<number, Pick<CmsPage, 'id' | 'title' | 'slug' | 'url_path'>>>({});

const pagePagination = useInfinitePagination<CmsPage>({
  fetcher: async (params) => {
    return await cmsService.getPagesList({
      page: params.page,
      page_size: 10,
      search: params.search?.trim() || undefined,
      archived: false
    });
  },
  search: pageSearchQuery,
  pageSize: 10,
  autoFetch: false
});

watch(() => pagePagination.items.value, (list) => {
  if (!list || list.length === 0) return;
  const nextCache = { ...resolvedPageCache.value };
  for (const p of list) {
    const numId = Number(p.id);
    if (!Number.isNaN(numId)) {
      nextCache[numId] = {
        id: numId,
        title: p.title,
        slug: p.slug,
        url_path: p.url_path
      };
    }
  }
  resolvedPageCache.value = nextCache;
}, { deep: true });

const pageLookup = computed(() => resolvedPageCache.value);

const ensurePagesLoaded = async () => {
  if (!hasLoadedPagesOnce.value && !pagePagination.isLoading.value) {
    hasLoadedPagesOnce.value = true;
    await pagePagination.fetchFirstPage();
  }
};

// ---------------------------------------------------------------------------
// Create / Edit / Delete Navigation Item Modals
// ---------------------------------------------------------------------------
const isItemModalOpen = ref(false);
const editingItem = ref<CmsNavigationItem | null>(null);
const isItemSubmitting = ref(false);
const isLoadingEditItem = ref(false);
const itemFormError = ref<string | null>(null);
const isPagePickerOpen = ref(false);

interface ItemFormState {
  label: string;
  parent: number | null;
  link_type: NavigationLinkType;
  page: number | null;
  external_url: string;
  is_visible: boolean;
  open_in_new_tab: boolean;
}

const itemForm = ref<ItemFormState>({
  label: '',
  parent: null,
  link_type: 'PAGE',
  page: null,
  external_url: '',
  is_visible: true,
  open_in_new_tab: false
});

const selectedPageSummary = computed(() => {
  if (!itemForm.value.page) return null;
  return resolvedPageCache.value[itemForm.value.page] || null;
});

const getDescendantIds = (items: CmsNavigationItem[], rootId: number): Set<number> => {
  const descendants = new Set<number>();
  const queue = [rootId];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    for (const candidate of items) {
      if (candidate.parent === currentId && !descendants.has(candidate.id)) {
        descendants.add(candidate.id);
        queue.push(candidate.id);
      }
    }
  }
  return descendants;
};

interface ParentSelectOption {
  id: number;
  label: string;
  depth: number;
}

const availableParentOptions = computed<ParentSelectOption[]>(() => {
  const excluded = new Set<number>();
  if (editingItem.value) {
    excluded.add(editingItem.value.id);
    for (const descId of getDescendantIds(flatMenuItems.value, editingItem.value.id)) {
      excluded.add(descId);
    }
  }

  const options: ParentSelectOption[] = [];
  const walk = (nodes: NavigationTreeItem[], depth: number) => {
    for (const node of nodes) {
      if (excluded.has(node.id)) continue;
      options.push({
        id: node.id,
        label: node.label,
        depth
      });
      walk(node.children, depth + 1);
    }
  };
  walk(fullNavigationTree.value, 0);
  return options;
});

const handleLinkTypeChange = async (nextType: NavigationLinkType) => {
  if (itemForm.value.link_type === nextType) return;
  itemForm.value.link_type = nextType;
  itemFormError.value = null;

  if (nextType === 'PAGE') {
    itemForm.value.external_url = '';
    isPagePickerOpen.value = true;
    await ensurePagesLoaded();
  } else {
    itemForm.value.page = null;
    isPagePickerOpen.value = false;
  }
};

const selectCmsPageOption = (page: CmsPage) => {
  const numId = Number(page.id);
  if (Number.isNaN(numId)) return;
  resolvedPageCache.value = {
    ...resolvedPageCache.value,
    [numId]: {
      id: numId,
      title: page.title,
      slug: page.slug,
      url_path: page.url_path
    }
  };
  itemForm.value.page = numId;
  isPagePickerOpen.value = false;
  itemFormError.value = null;
};

const clearSelectedCmsPage = async () => {
  itemForm.value.page = null;
  isPagePickerOpen.value = true;
  await ensurePagesLoaded();
};

const resolveAssignedPageSummary = async (pageId: number) => {
  if (resolvedPageCache.value[pageId]) return;
  try {
    const detail = await cmsService.getPageDetail(pageId);
    const numId = Number(detail.id);
    if (!Number.isNaN(numId)) {
      resolvedPageCache.value = {
        ...resolvedPageCache.value,
        [numId]: {
          id: numId,
          title: detail.title,
          slug: detail.slug,
          url_path: detail.url_path
        }
      };
    }
  } catch {
    // Non-fatal fallback: tree/form renders "CMS Page #{pageId}"
  }
};

const openCreateItemModal = async (parentId: number | null = null) => {
  if (!selectedMenuDetail.value) return;
  if (!canCreate.value) {
    toastError('You do not have permission to create navigation items.');
    return;
  }

  editingItem.value = null;
  itemFormError.value = null;
  pageSearchQuery.value = '';
  itemForm.value = {
    label: '',
    parent: parentId,
    link_type: 'PAGE',
    page: null,
    external_url: '',
    is_visible: true,
    open_in_new_tab: false
  };
  isPagePickerOpen.value = true;
  isItemModalOpen.value = true;
  await ensurePagesLoaded();
};

const openEditItemModal = async (item: NavigationTreeItem) => {
  if (!selectedMenuDetail.value) return;
  if (!canEdit.value) {
    toastError('You do not have permission to edit navigation items.');
    return;
  }

  editingItem.value = item;
  itemFormError.value = null;
  pageSearchQuery.value = '';
  itemForm.value = {
    label: item.label,
    parent: item.parent ?? null,
    link_type: item.link_type,
    page: item.link_type === 'PAGE' ? item.page : null,
    external_url: item.link_type === 'EXTERNAL' ? (item.external_url || '') : '',
    is_visible: item.is_visible,
    open_in_new_tab: item.open_in_new_tab
  };
  isPagePickerOpen.value = item.link_type === 'PAGE' && !item.page;
  isItemModalOpen.value = true;

  // Fetch authoritative item detail & assigned page label if needed
  isLoadingEditItem.value = true;
  try {
    const freshItem = await cmsService.getNavigationItem(selectedMenuDetail.value.id, item.id);
    editingItem.value = freshItem;
    itemForm.value = {
      label: freshItem.label,
      parent: freshItem.parent ?? null,
      link_type: freshItem.link_type,
      page: freshItem.link_type === 'PAGE' ? freshItem.page : null,
      external_url: freshItem.link_type === 'EXTERNAL' ? (freshItem.external_url || '') : '',
      is_visible: freshItem.is_visible,
      open_in_new_tab: freshItem.open_in_new_tab
    };
    if (freshItem.link_type === 'PAGE') {
      await ensurePagesLoaded();
      if (freshItem.page) {
        await resolveAssignedPageSummary(freshItem.page);
      } else {
        isPagePickerOpen.value = true;
      }
    }
  } catch (err: any) {
    toastError(extractErrorMessage(err, 'Failed to load navigation item details.'));
    isItemModalOpen.value = false;
    editingItem.value = null;
    isPagePickerOpen.value = false;
    pageSearchQuery.value = '';
  } finally {
    isLoadingEditItem.value = false;
  }
};

const closeItemModal = () => {
  if (isItemSubmitting.value) return;
  isItemModalOpen.value = false;
  editingItem.value = null;
  itemFormError.value = null;
  isPagePickerOpen.value = false;
  pageSearchQuery.value = '';
};

const isValidHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const validateItemForm = (): boolean => {
  if (!itemForm.value.label.trim()) {
    itemFormError.value = 'Item label is required.';
    return false;
  }

  if (itemForm.value.link_type === 'PAGE') {
    if (!itemForm.value.page || Number.isNaN(Number(itemForm.value.page))) {
      itemFormError.value = 'Please select a CMS page for this navigation item.';
      return false;
    }
  } else {
    const trimmedUrl = itemForm.value.external_url.trim();
    if (!trimmedUrl) {
      itemFormError.value = 'External URL is required.';
      return false;
    }
    if (!isValidHttpUrl(trimmedUrl)) {
      itemFormError.value = 'External URL must be a valid http:// or https:// URL.';
      return false;
    }
  }

  itemFormError.value = null;
  return true;
};

const handleSubmitItem = async () => {
  if (isItemSubmitting.value || !selectedMenuDetail.value) return;

  const isEditMode = editingItem.value !== null;
  if (isEditMode && !canEdit.value) {
    toastError('You do not have permission to edit navigation items.');
    return;
  }
  if (!isEditMode && !canCreate.value) {
    toastError('You do not have permission to create navigation items.');
    return;
  }

  if (!validateItemForm()) return;

  const menuId = selectedMenuDetail.value.id;
  isItemSubmitting.value = true;
  itemFormError.value = null;

  try {
    if (isEditMode && editingItem.value) {
      const linkTypeChanged = editingItem.value.link_type !== itemForm.value.link_type;
      const payload: UpdateNavigationItemPayload =
        itemForm.value.link_type === 'PAGE'
          ? {
              label: itemForm.value.label.trim(),
              parent: itemForm.value.parent ?? null,
              link_type: 'PAGE',
              page: Number(itemForm.value.page),
              ...(linkTypeChanged ? { external_url: null } : {}),
              is_visible: itemForm.value.is_visible,
              open_in_new_tab: itemForm.value.open_in_new_tab
            }
          : {
              label: itemForm.value.label.trim(),
              parent: itemForm.value.parent ?? null,
              link_type: 'EXTERNAL',
              external_url: itemForm.value.external_url.trim(),
              ...(linkTypeChanged ? { page: null } : {}),
              is_visible: itemForm.value.is_visible,
              open_in_new_tab: itemForm.value.open_in_new_tab
            };

      const updated = await cmsService.updateNavigationItem(menuId, editingItem.value.id, payload);
      toastSuccess(`Navigation item "${updated.label}" updated.`);
    } else {
      const payload: CreateNavigationItemPayload =
        itemForm.value.link_type === 'PAGE'
          ? {
              label: itemForm.value.label.trim(),
              parent: itemForm.value.parent ?? null,
              link_type: 'PAGE',
              page: Number(itemForm.value.page),
              is_visible: itemForm.value.is_visible,
              open_in_new_tab: itemForm.value.open_in_new_tab
            }
          : {
              label: itemForm.value.label.trim(),
              parent: itemForm.value.parent ?? null,
              link_type: 'EXTERNAL',
              external_url: itemForm.value.external_url.trim(),
              is_visible: itemForm.value.is_visible,
              open_in_new_tab: itemForm.value.open_in_new_tab
            };

      const created = await cmsService.addNavigationItem(menuId, payload);
      toastSuccess(`Navigation item "${created.label}" added.`);

      if (created.parent && !expandedItemIds.value.includes(created.parent)) {
        expandedItemIds.value = [...expandedItemIds.value, created.parent];
      }
    }

    isItemModalOpen.value = false;
    editingItem.value = null;
    isPagePickerOpen.value = false;
    pageSearchQuery.value = '';
    await loadSelectedMenuDetail(menuId, { silent: true });
  } catch (err: any) {
    itemFormError.value = extractErrorMessage(
      err,
      `Failed to ${isEditMode ? 'update' : 'create'} navigation item.`
    );
  } finally {
    isItemSubmitting.value = false;
  }
};

// Delete Navigation Item Confirmation
const isDeleteItemModalOpen = ref(false);
const deletingItem = ref<NavigationTreeItem | null>(null);
const isDeletingItem = ref(false);

const openDeleteItemModal = (item: NavigationTreeItem) => {
  if (!canDelete.value) {
    toastError('You do not have permission to delete navigation items.');
    return;
  }
  deletingItem.value = item;
  isDeleteItemModalOpen.value = true;
};

const closeDeleteItemModal = () => {
  if (isDeletingItem.value) return;
  isDeleteItemModalOpen.value = false;
  deletingItem.value = null;
};

const handleDeleteItem = async () => {
  if (isDeletingItem.value || !selectedMenuDetail.value || !deletingItem.value) return;
  if (!canDelete.value) {
    toastError('You do not have permission to delete navigation items.');
    return;
  }

  const menuId = selectedMenuDetail.value.id;
  const target = deletingItem.value;
  isDeletingItem.value = true;

  try {
    await cmsService.deleteNavigationItem(menuId, target.id);
    toastSuccess(`Navigation item "${target.label}" deleted.`);
    isDeleteItemModalOpen.value = false;
    deletingItem.value = null;
    await loadSelectedMenuDetail(menuId, { silent: true });
  } catch (err: any) {
    toastError(extractErrorMessage(err, 'Failed to delete navigation item.'));
  } finally {
    isDeletingItem.value = false;
  }
};

// ---------------------------------------------------------------------------
// Table Columns & Lifecycle
// ---------------------------------------------------------------------------
const tableColumns = computed<UiTableColumn<CmsNavigationMenu>[]>(() => [
  { key: 'name', label: 'Menu Name & Key', width: '300px' },
  { key: 'is_active', label: 'Status', width: '120px', align: 'center' },
  { key: 'items_count', label: 'Navigation Items', width: '190px', align: 'center' },
  { key: 'updated_at', label: 'Last Updated', width: '180px' },
  { key: 'actions', label: 'Actions', width: '110px', align: 'right' }
]);

const refreshAll = async () => {
  await fetchMenus();
  if (selectedMenuId.value !== null) {
    await loadSelectedMenuDetail(selectedMenuId.value);
  }
};

onMounted(async () => {
  if (!canView.value) return;
  await fetchMenus();
  if (selectedMenuId.value !== null) {
    await loadSelectedMenuDetail(selectedMenuId.value, { autoExpandRoots: true });
  }
});
</script>

<template>
  <NuxtLayout name="admin">
    <template #header-title>
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground/40 font-light select-none">/</span>
        <h1 class="text-[20px] sm:text-[26px] font-display font-extrabold tracking-tight text-foreground">
          Navigation Menus
        </h1>
      </div>
    </template>

    <template #header-actions>
      <div class="flex items-center gap-2">
        <UiButton
          variant="outline"
          class="rounded-xl h-9 px-3.5 gap-1.5 border-border font-bold text-xs"
          @click="refreshAll"
          :disabled="isLoading || isLoadingItems"
        >
          <RefreshCw :class="['w-3.5 h-3.5', (isLoading || isLoadingItems) && 'animate-spin']" />
          <span>Refresh</span>
        </UiButton>
        <UiButton
          v-if="canCreate"
          class="rounded-xl h-9 px-3.5 gap-1.5 shadow-md shadow-primary/10 bg-primary text-primary-foreground font-bold text-xs"
          @click="openCreateMenuModal"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>New Menu</span>
        </UiButton>
      </div>
    </template>

    <!-- Permission Denied State -->
    <div v-if="!canView" class="p-8 text-center bg-card border border-border rounded-2xl shadow-xs">
      <AlertCircle class="w-12 h-12 text-destructive mx-auto mb-3" />
      <h2 class="text-[20px] font-bold text-foreground mb-1">Access Restricted</h2>
      <p class="text-sm text-muted-foreground">
        You do not have the required <span class="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">manage_cms_navigation</span> permission to manage CMS navigation menus.
      </p>
    </div>

    <div v-else class="space-y-5 animate-in fade-in duration-500">
      <!-- Filter & Page Size Bar -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border border-border px-3.5 py-2.5 rounded-xl shadow-xs">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          <UiSearchInput
            v-model="searchQuery"
            placeholder="Search menus by name or key..."
            class="w-full sm:w-80"
          />

          <select
            v-model="statusFilter"
            aria-label="Filter menus by status"
            class="h-9 px-3 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        <div class="flex items-center gap-1.5 self-end sm:self-center border-l-0 sm:border-l border-border sm:pl-3">
          <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground hidden sm:inline">Show:</span>
          <select
            v-model.number="itemsPerPage"
            aria-label="Menus per page"
            class="h-9 px-2.5 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
          >
            <option :value="5">5 / page</option>
            <option :value="10">10 / page</option>
            <option :value="25">25 / page</option>
            <option :value="50">50 / page</option>
            <option :value="100">100 / page</option>
            <option :value="1000">1000 / page</option>
          </select>
        </div>
      </div>

      <!-- Fetch Error Banner -->
      <div v-if="fetchError" class="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center justify-between gap-4 text-destructive">
        <div class="flex items-center gap-3">
          <AlertCircle class="w-5 h-5 shrink-0" />
          <span class="text-xs font-medium">{{ fetchError }}</span>
        </div>
        <UiButton variant="outline" size="sm" class="h-8 text-xs border-destructive/30 shrink-0" @click="fetchMenus">
          Retry
        </UiButton>
      </div>

      <!-- Menus Table -->
      <div class="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <UiTable
          :columns="tableColumns"
          :data="paginatedMenus"
          :loading="isLoading"
          key-field="id"
          empty-text="No navigation menus found"
          empty-description="Create a navigation menu (e.g., header or footer) to start organizing storefront links."
          :row-class="(item) => selectedMenuId === item.id ? 'bg-primary/5 hover:bg-primary/10 cursor-pointer' : 'cursor-pointer'"
          @row-click="(item) => selectMenuById(item.id)"
        >
          <template #cell-name="{ item }">
            <div class="space-y-1 py-0.5">
              <div class="flex items-center gap-2">
                <p class="font-bold text-xs sm:text-sm text-foreground">{{ item.name }}</p>
                <span
                  v-if="selectedMenuId === item.id"
                  class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/20"
                >
                  Selected
                </span>
              </div>
              <span class="inline-block font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/60">
                {{ item.key }}
              </span>
            </div>
          </template>

          <template #cell-is_active="{ item }">
            <span
              :class="[
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                item.is_active
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-muted text-muted-foreground border-border'
              ]"
            >
              <span :class="['w-1.5 h-1.5 rounded-full', item.is_active ? 'bg-emerald-500' : 'bg-muted-foreground/50']"></span>
              <span>{{ item.is_active ? 'Active' : 'Inactive' }}</span>
            </span>
          </template>

          <template #cell-items_count="{ item }">
            <div class="flex items-center justify-center gap-2">
              <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-muted text-foreground">
                {{ Array.isArray(item.items) ? item.items.length : 0 }} items
              </span>
              <UiButton
                type="button"
                variant="outline"
                size="sm"
                class="h-7 px-2.5 text-[11px] font-bold rounded-lg gap-1 border-border"
                @click.stop="selectMenuById(item.id)"
              >
                <ListTree class="w-3 h-3" />
                <span>Manage</span>
              </UiButton>
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
                class="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                title="Manage Navigation Items"
                aria-label="Manage Navigation Items"
                @click="selectMenuById(item.id)"
              >
                <ListTree class="w-3.5 h-3.5" />
              </UiButton>
              <UiButton
                v-if="canEdit"
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                title="Edit Menu"
                aria-label="Edit Menu"
                @click="openEditMenuModal(item)"
              >
                <Edit2 class="w-3.5 h-3.5" />
              </UiButton>
              <UiButton
                v-if="canDelete"
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-lg"
                title="Delete Menu"
                aria-label="Delete Menu"
                @click="openDeleteMenuModal(item)"
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
            item-label="menus"
          />
        </div>
      </div>

      <!-- Selected Menu Prompt (when no menu is open) -->
      <div
        v-if="selectedMenuId === null"
        class="p-6 bg-card border border-dashed border-border rounded-2xl text-center space-y-2"
      >
        <ListTree class="w-8 h-8 text-muted-foreground/50 mx-auto" />
        <h2 class="text-[18px] font-bold text-foreground">Select a Menu to Manage Items</h2>
        <p class="text-xs text-muted-foreground max-w-md mx-auto">
          Click any navigation menu row or choose <span class="font-semibold text-foreground">Manage</span> to organize nested items, link CMS pages or external URLs, and reorder siblings.
        </p>
      </div>

      <!-- Selected Menu Navigation Items Management Workspace -->
      <div
        v-else
        ref="itemsWorkspaceRef"
        class="bg-card border border-border rounded-2xl shadow-xs overflow-hidden"
      >
        <!-- Workspace Header -->
        <div class="px-4 sm:px-5 py-4 border-b border-border bg-muted/20 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div class="space-y-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <Menu class="w-4 h-4 text-primary shrink-0" />
              <h2 class="text-[20px] font-display font-extrabold text-foreground truncate">
                {{ selectedMenuDetail?.name || `Menu #${selectedMenuId}` }}
              </h2>
              <span
                v-if="selectedMenuDetail?.key"
                class="font-mono text-[11px] bg-muted px-2 py-0.5 rounded border border-border text-muted-foreground"
              >
                {{ selectedMenuDetail.key }}
              </span>
              <span
                v-if="selectedMenuDetail"
                :class="[
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                  selectedMenuDetail.is_active
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-muted text-muted-foreground border-border'
                ]"
              >
                {{ selectedMenuDetail.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>
            <p class="text-xs text-muted-foreground">
              Manage hierarchical links, visibility, and sibling display order ({{ flatMenuItems.length }} {{ flatMenuItems.length === 1 ? 'item' : 'items' }}).
            </p>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <UiButton
              v-if="allParentItemIds.length > 0"
              type="button"
              variant="outline"
              size="sm"
              class="h-8 px-2.5 text-xs font-semibold rounded-lg gap-1"
              @click="expandedItemIds.length === allParentItemIds.length ? collapseAllItems() : expandAllItems()"
            >
              <ChevronsDownUp v-if="expandedItemIds.length === allParentItemIds.length" class="w-3.5 h-3.5" />
              <ChevronsUpDown v-else class="w-3.5 h-3.5" />
              <span>{{ expandedItemIds.length === allParentItemIds.length ? 'Collapse All' : 'Expand All' }}</span>
            </UiButton>

            <UiButton
              type="button"
              variant="outline"
              size="sm"
              class="h-8 px-2.5 text-xs font-semibold rounded-lg gap-1"
              :disabled="isLoadingItems"
              @click="selectedMenuId !== null && loadSelectedMenuDetail(selectedMenuId)"
            >
              <RefreshCw :class="['w-3.5 h-3.5', isLoadingItems && 'animate-spin']" />
              <span>Reload</span>
            </UiButton>

            <UiButton
              v-if="canCreate"
              type="button"
              size="sm"
              class="h-8 px-3 text-xs font-bold rounded-lg gap-1 bg-primary text-primary-foreground shadow-xs"
              :disabled="isLoadingItems || !selectedMenuDetail"
              @click="openCreateItemModal(null)"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>Add Root Item</span>
            </UiButton>

            <button
              type="button"
              @click="clearSelectedMenu"
              class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Close items panel"
              aria-label="Close items panel"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Item Search & Reorder Guard Notice -->
        <div class="px-4 sm:px-5 py-3 border-b border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <UiSearchInput
            v-model="itemSearchQuery"
            placeholder="Filter navigation items by label, page, or URL..."
            class="w-full sm:w-80"
          />

          <div class="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Loader2 v-if="isReordering" class="w-3.5 h-3.5 animate-spin text-primary" />
            <span v-if="isReordering" class="font-semibold text-primary">Saving sibling order...</span>
            <span v-else-if="hasActiveItemSearch" class="text-amber-600 dark:text-amber-400 font-medium">
              Reordering is disabled while filtering. Clear search to reorder siblings.
            </span>
            <span v-else-if="canEdit">
              Drag siblings or use arrows to reorder within the same parent level.
            </span>
          </div>
        </div>

        <!-- Workspace Body -->
        <div class="p-4 sm:p-5">
          <!-- Loading State -->
          <div v-if="isLoadingItems" class="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 class="w-7 h-7 animate-spin text-primary" />
            <p class="text-xs font-medium">Loading navigation items...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="itemsError" class="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center justify-between gap-4 text-destructive">
            <div class="flex items-center gap-2.5">
              <AlertCircle class="w-5 h-5 shrink-0" />
              <span class="text-xs font-medium">{{ itemsError }}</span>
            </div>
            <UiButton
              variant="outline"
              size="sm"
              class="h-8 text-xs border-destructive/30 shrink-0"
              @click="selectedMenuId !== null && loadSelectedMenuDetail(selectedMenuId, { autoExpandRoots: true })"
            >
              Retry
            </UiButton>
          </div>

          <!-- Empty Items State -->
          <div v-else-if="flatMenuItems.length === 0" class="py-12 px-4 text-center bg-muted/20 border border-dashed border-border rounded-2xl">
            <FolderOpen class="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
            <h3 class="text-[18px] font-bold text-foreground">No navigation items yet</h3>
            <p class="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Add top-level navigation links to CMS pages or external URLs, then nest child items underneath.
            </p>
            <UiButton
              v-if="canCreate"
              type="button"
              class="mt-4 h-9 px-4 text-xs font-bold rounded-xl bg-primary text-primary-foreground gap-1.5"
              @click="openCreateItemModal(null)"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>Add First Item</span>
            </UiButton>
          </div>

          <!-- Filtered Empty State -->
          <div v-else-if="visibleNavigationTree.length === 0" class="py-10 px-4 text-center bg-muted/20 border border-dashed border-border rounded-2xl">
            <p class="text-sm font-bold text-foreground">No matching navigation items</p>
            <p class="text-xs text-muted-foreground mt-1">Try adjusting or clearing your item filter query.</p>
            <UiButton
              type="button"
              variant="outline"
              size="sm"
              class="mt-3 h-8 px-3 text-xs rounded-lg"
              @click="itemSearchQuery = ''"
            >
              Clear Filter
            </UiButton>
          </div>

          <!-- Hierarchical Tree -->
          <div v-else class="space-y-1">
            <NavigationTreeNode
              v-for="(rootNode, idx) in visibleNavigationTree"
              :key="rootNode.id"
              :node="rootNode"
              :depth="0"
              :sibling-index="idx"
              :sibling-count="visibleNavigationTree.length"
              :expanded-ids="expandedItemIds"
              :page-lookup="pageLookup"
              :can-create="canCreate"
              :can-edit="canEdit"
              :can-delete="canDelete"
              :is-reordering="isReordering"
              :has-active-search="hasActiveItemSearch"
              :toggling-visibility-id="togglingVisibilityId"
              @toggle-expand="toggleExpandItem"
              @add-child="(item) => openCreateItemModal(item.id)"
              @edit="openEditItemModal"
              @delete="openDeleteItemModal"
              @toggle-visibility="handleToggleVisibility"
              @move-sibling="handleMoveSibling"
              @reorder-drop="handleReorderDrop"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- Create / Edit Navigation Menu Modal (URL-driven via useAdminModalState) -->
    <!-- =================================================================== -->
    <UiAdminModal
      :is-open="modalState.isCreate.value || modalState.isEdit.value"
      :title="modalState.isEdit.value ? 'Edit Navigation Menu' : 'Create Navigation Menu'"
      :subtitle="modalState.isEdit.value ? 'Update the menu display name or lookup key.' : 'Define a new CMS navigation menu container.'"
      max-width="max-w-lg"
      @close="!isMenuSubmitting && modalState.closeModal()"
    >
      <div class="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div v-if="modalState.isEdit.value && modalState.isResolving.value && !modalMenuEntity" class="p-10 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2 class="w-6 h-6 animate-spin text-primary" />
          <p class="text-xs font-medium">Loading navigation menu details...</p>
        </div>

        <form v-else id="navigation-menu-form" class="flex-1 min-h-0 overflow-y-auto p-6 space-y-4" @submit.prevent="handleSubmitMenu">
          <div v-if="menuFormError" class="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive flex items-center gap-2">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{{ menuFormError }}</span>
          </div>

          <div class="space-y-1.5">
            <label for="menu-name-input" class="text-xs font-bold text-foreground">Menu Name *</label>
            <input
              id="menu-name-input"
              v-model="menuForm.name"
              type="text"
              placeholder="e.g. Footer Navigation"
              class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              @input="handleMenuNameInput"
            />
          </div>

          <div class="space-y-1.5">
            <label for="menu-key-input" class="text-xs font-bold text-foreground">Menu Key *</label>
            <input
              id="menu-key-input"
              v-model="menuForm.key"
              type="text"
              placeholder="e.g. footer"
              class="w-full h-10 px-3 rounded-xl border border-input bg-background font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              @input="handleMenuKeyInput"
            />
            <p class="text-[11px] text-muted-foreground">
              Unique machine key used by the public API (<span class="font-mono">/api/v1/cms/public/navigation/{key}/</span>).
            </p>
          </div>

          <!-- Read-only status display when editing -->
          <div v-if="modalState.isEdit.value && modalMenuEntity" class="p-3 bg-muted/30 border border-border rounded-xl flex items-center justify-between">
            <div>
              <p class="text-xs font-bold text-foreground">Menu Status</p>
              <p class="text-[11px] text-muted-foreground">Managed by the backend (read-only).</p>
            </div>
            <span
              :class="[
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                modalMenuEntity.is_active
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-muted text-muted-foreground border-border'
              ]"
            >
              {{ modalMenuEntity.is_active ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </form>

        <div class="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-card shrink-0">
          <UiButton
            type="button"
            variant="outline"
            class="h-10 px-4 text-xs font-semibold rounded-xl"
            @click="modalState.closeModal()"
            :disabled="isMenuSubmitting"
          >
            Cancel
          </UiButton>
          <UiButton
            type="submit"
            form="navigation-menu-form"
            class="h-10 px-4 text-xs font-bold rounded-xl bg-primary text-primary-foreground shadow-sm"
            :disabled="isMenuSubmitting || (modalState.isEdit.value && modalState.isResolving.value)"
          >
            <Loader2 v-if="isMenuSubmitting" class="w-3.5 h-3.5 animate-spin mr-1.5" />
            <span>{{ modalState.isEdit.value ? 'Save Changes' : 'Create Menu' }}</span>
          </UiButton>
        </div>
      </div>
    </UiAdminModal>

    <!-- =================================================================== -->
    <!-- Delete Navigation Menu Modal (URL-driven via useAdminModalState)    -->
    <!-- =================================================================== -->
    <UiAdminModal
      :is-open="modalState.isDelete.value"
      title="Delete Navigation Menu"
      subtitle="Confirm soft deletion of this navigation menu."
      max-width="max-w-md"
      @close="modalState.closeModal()"
    >
      <div v-if="modalMenuEntity" class="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div class="p-6 space-y-4">
          <div class="p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3">
            <Menu class="w-6 h-6 text-destructive shrink-0" />
            <div class="min-w-0">
              <p class="font-bold text-sm text-foreground truncate">{{ modalMenuEntity.name }}</p>
              <p class="text-xs text-muted-foreground font-mono truncate">{{ modalMenuEntity.key }}</p>
            </div>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            Deleting this menu marks it inactive and removes it from management and public navigation listings. There is no restore action in the admin panel.
          </p>
        </div>

        <div class="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-card shrink-0">
          <UiButton
            type="button"
            variant="outline"
            class="h-9 px-4 text-xs font-semibold rounded-xl"
            @click="modalState.closeModal()"
            :disabled="isDeletingMenu"
          >
            Cancel
          </UiButton>
          <UiButton
            type="button"
            variant="destructive"
            class="h-9 px-4 text-xs font-semibold rounded-xl"
            @click="handleDeleteMenu"
            :disabled="isDeletingMenu"
          >
            <Loader2 v-if="isDeletingMenu" class="w-3.5 h-3.5 animate-spin mr-1.5" />
            <span>Confirm Delete</span>
          </UiButton>
        </div>
      </div>
    </UiAdminModal>

    <!-- =================================================================== -->
    <!-- Create / Edit Navigation Item Modal                                 -->
    <!-- =================================================================== -->
    <UiAdminModal
      :is-open="isItemModalOpen"
      :title="editingItem ? 'Edit Navigation Item' : 'Add Navigation Item'"
      :subtitle="selectedMenuDetail ? `Menu: ${selectedMenuDetail.name} (${selectedMenuDetail.key})` : ''"
      max-width="max-w-xl"
      @close="closeItemModal"
    >
      <div class="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div v-if="isLoadingEditItem" class="p-10 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2 class="w-6 h-6 animate-spin text-primary" />
          <p class="text-xs font-medium">Loading navigation item details...</p>
        </div>

        <form v-else id="navigation-item-form" class="flex-1 min-h-0 overflow-y-auto p-6 space-y-4" @submit.prevent="handleSubmitItem">
          <div v-if="itemFormError" class="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive flex items-center gap-2">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{{ itemFormError }}</span>
          </div>

          <!-- Label -->
          <div class="space-y-1.5">
            <label for="nav-item-label" class="text-xs font-bold text-foreground">Label *</label>
            <input
              id="nav-item-label"
              v-model="itemForm.label"
              type="text"
              placeholder="e.g. About Us"
              class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <!-- Parent Item (Cycle-safe options) -->
          <div class="space-y-1.5">
            <label for="nav-item-parent" class="text-xs font-bold text-foreground">Parent Item</label>
            <select
              id="nav-item-parent"
              v-model="itemForm.parent"
              class="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option :value="null">Top-level (Root)</option>
              <option
                v-for="opt in availableParentOptions"
                :key="opt.id"
                :value="opt.id"
              >
                {{ `${'— '.repeat(opt.depth)}${opt.label}` }}
              </option>
            </select>
            <p v-if="editingItem" class="text-[11px] text-muted-foreground">
              This item and its descendants are excluded to prevent circular hierarchies.
            </p>
          </div>

          <!-- Link Type Switcher -->
          <div class="space-y-1.5">
            <span class="text-xs font-bold text-foreground block">Link Type *</span>
            <div class="grid grid-cols-2 gap-2 p-1 bg-muted/40 border border-border rounded-xl">
              <button
                type="button"
                @click="handleLinkTypeChange('PAGE')"
                :class="[
                  'h-9 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                  itemForm.link_type === 'PAGE'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                ]"
              >
                <FileText class="w-3.5 h-3.5" />
                <span>CMS Page</span>
              </button>
              <button
                type="button"
                @click="handleLinkTypeChange('EXTERNAL')"
                :class="[
                  'h-9 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                  itemForm.link_type === 'EXTERNAL'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                ]"
              >
                <Globe class="w-3.5 h-3.5" />
                <span>External URL</span>
              </button>
            </div>
          </div>

          <!-- CMS Page Picker (link_type === 'PAGE') -->
          <div v-if="itemForm.link_type === 'PAGE'" class="space-y-2.5">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-foreground">Target CMS Page *</label>
              <button
                v-if="itemForm.page"
                type="button"
                class="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                @click="isPagePickerOpen = !isPagePickerOpen; if (isPagePickerOpen) ensurePagesLoaded();"
              >
                {{ isPagePickerOpen ? 'Hide list' : 'Change page' }}
              </button>
            </div>

            <!-- Selected Page Preview Card -->
            <div
              v-if="itemForm.page"
              class="p-3 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between gap-2"
            >
              <div class="min-w-0">
                <p class="text-xs font-bold text-foreground truncate">
                  {{ selectedPageSummary ? selectedPageSummary.title : `CMS Page #${itemForm.page}` }}
                </p>
                <p v-if="selectedPageSummary" class="text-[11px] font-mono text-muted-foreground truncate">
                  {{ selectedPageSummary.url_path || `/${selectedPageSummary.slug}/` }}
                </p>
              </div>
              <button
                type="button"
                @click="clearSelectedCmsPage"
                class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background transition-colors cursor-pointer shrink-0"
                title="Clear selected page"
                aria-label="Clear selected page"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Searchable Paginated CMS Page List -->
            <div v-if="isPagePickerOpen || !itemForm.page" class="border border-border rounded-xl bg-background overflow-hidden">
              <div class="p-2.5 border-b border-border bg-muted/20">
                <UiSearchInput
                  v-model="pageSearchQuery"
                  placeholder="Search CMS pages by title or slug..."
                  class="w-full"
                />
              </div>

              <div class="max-h-56 overflow-y-auto divide-y divide-border/60">
                <div v-if="pagePagination.isLoading.value && pagePagination.items.value.length === 0" class="py-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 class="w-4 h-4 animate-spin text-primary" />
                  <span>Loading CMS pages...</span>
                </div>

                <div v-else-if="pagePagination.error.value && pagePagination.items.value.length === 0" class="p-4 text-center space-y-2">
                  <p class="text-xs text-destructive font-medium">{{ pagePagination.error.value }}</p>
                  <UiButton type="button" variant="outline" size="sm" class="h-7 text-xs" @click="pagePagination.fetchFirstPage()">
                    Retry
                  </UiButton>
                </div>

                <div v-else-if="pagePagination.items.value.length === 0" class="py-8 px-4 text-center text-xs text-muted-foreground">
                  No matching CMS pages found.
                </div>

                <template v-else>
                  <button
                    v-for="page in pagePagination.items.value"
                    :key="page.id"
                    type="button"
                    @click="selectCmsPageOption(page)"
                    :class="[
                      'w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer',
                      Number(itemForm.page) === Number(page.id)
                        ? 'bg-primary/10 text-foreground'
                        : 'hover:bg-muted/60 text-foreground'
                    ]"
                  >
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-bold truncate">{{ page.title }}</span>
                        <span
                          :class="[
                            'px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border shrink-0',
                            page.live
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          ]"
                        >
                          {{ page.live ? 'Published' : 'Draft' }}
                        </span>
                      </div>
                      <p class="text-[11px] font-mono text-muted-foreground truncate mt-0.5">
                        {{ page.url_path || `/${page.slug}/` }}
                      </p>
                    </div>
                    <Check
                      v-if="Number(itemForm.page) === Number(page.id)"
                      class="w-4 h-4 text-primary shrink-0"
                    />
                  </button>

                  <UiInfiniteScroll
                    :has-more="pagePagination.hasMore.value"
                    :is-loading="pagePagination.isFetchingNextPage.value"
                    :error="pagePagination.error.value"
                    end-text="All CMS pages loaded"
                    @load-more="pagePagination.loadNextPage()"
                    @retry="pagePagination.loadNextPage()"
                  />
                </template>
              </div>
            </div>
          </div>

          <!-- External URL Input (link_type === 'EXTERNAL') -->
          <div v-else class="space-y-1.5">
            <label for="nav-item-external-url" class="text-xs font-bold text-foreground">External URL *</label>
            <input
              id="nav-item-external-url"
              v-model="itemForm.external_url"
              type="url"
              placeholder="https://example.com/support"
              class="w-full h-10 px-3 rounded-xl border border-input bg-background font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p class="text-[11px] text-muted-foreground">
              Enter an absolute HTTP or HTTPS URL (for example, <span class="font-mono">https://...</span>).
            </p>
          </div>

          <!-- Flags -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label class="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
              <input
                v-model="itemForm.is_visible"
                type="checkbox"
                class="w-4 h-4 rounded border-input accent-primary cursor-pointer"
              />
              <div>
                <p class="text-xs font-bold text-foreground">Visible</p>
                <p class="text-[11px] text-muted-foreground">Show in public navigation</p>
              </div>
            </label>

            <label class="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
              <input
                v-model="itemForm.open_in_new_tab"
                type="checkbox"
                class="w-4 h-4 rounded border-input accent-primary cursor-pointer"
              />
              <div>
                <p class="text-xs font-bold text-foreground">Open in New Tab</p>
                <p class="text-[11px] text-muted-foreground">Add target="_blank"</p>
              </div>
            </label>
          </div>
        </form>

        <div class="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-card shrink-0">
          <UiButton
            type="button"
            variant="outline"
            class="h-10 px-4 text-xs font-semibold rounded-xl"
            @click="closeItemModal"
            :disabled="isItemSubmitting"
          >
            Cancel
          </UiButton>
          <UiButton
            type="submit"
            form="navigation-item-form"
            class="h-10 px-4 text-xs font-bold rounded-xl bg-primary text-primary-foreground shadow-sm"
            :disabled="isItemSubmitting || isLoadingEditItem"
          >
            <Loader2 v-if="isItemSubmitting" class="w-3.5 h-3.5 animate-spin mr-1.5" />
            <span>{{ editingItem ? 'Save Changes' : 'Add Item' }}</span>
          </UiButton>
        </div>
      </div>
    </UiAdminModal>

    <!-- =================================================================== -->
    <!-- Delete Navigation Item Confirmation Modal                           -->
    <!-- =================================================================== -->
    <UiAdminModal
      :is-open="isDeleteItemModalOpen"
      title="Delete Navigation Item"
      subtitle="Are you sure you want to remove this navigation item?"
      max-width="max-w-md"
      @close="closeDeleteItemModal"
    >
      <div v-if="deletingItem" class="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div class="p-6 space-y-4">
          <div class="p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl space-y-1">
            <p class="font-bold text-sm text-foreground">{{ deletingItem.label }}</p>
            <p class="text-xs text-muted-foreground font-mono">
              {{ deletingItem.link_type === 'PAGE' ? `CMS Page #${deletingItem.page}` : deletingItem.external_url }}
            </p>
          </div>

          <p v-if="deletingItem.children.length > 0" class="text-xs text-amber-600 dark:text-amber-400 font-medium">
            Note: This item currently has {{ deletingItem.children.length }} child {{ deletingItem.children.length === 1 ? 'item' : 'items' }}.
          </p>
        </div>

        <div class="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-card shrink-0">
          <UiButton
            type="button"
            variant="outline"
            class="h-9 px-4 text-xs font-semibold rounded-xl"
            @click="closeDeleteItemModal"
            :disabled="isDeletingItem"
          >
            Cancel
          </UiButton>
          <UiButton
            type="button"
            variant="destructive"
            class="h-9 px-4 text-xs font-semibold rounded-xl"
            @click="handleDeleteItem"
            :disabled="isDeletingItem"
          >
            <Loader2 v-if="isDeletingItem" class="w-3.5 h-3.5 animate-spin mr-1.5" />
            <span>Confirm Delete</span>
          </UiButton>
        </div>
      </div>
    </UiAdminModal>
  </NuxtLayout>
</template>
