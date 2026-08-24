<!-- File: /pages/admin/roles/index.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { refDebounced } from '@vueuse/core';
import { 
  Shield, 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  Key, 
  RefreshCw,
  X,
  LayoutGrid,
  List
} from 'lucide-vue-next';
import { useRoleService } from '@/composables/useRoleService';
import { useInfinitePagination, type PaginatedResponse } from '@/composables/useInfinitePagination';
import { useAdminModalState } from '@/composables/useAdminModalState';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useToast, extractErrorMessage, handleApiError } from '@/composables/useToast';
import UiInfiniteScroll from '@/components/ui/UiInfiniteScroll.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import UiAdminModal from '@/components/ui/UiAdminModal.vue';
import UiSearchInput from '@/components/ui/UiSearchInput.vue';
import UiTable, { type UiTableColumn } from '@/components/ui/UiTable.vue';
import RoleFormModal from '@/components/admin/RoleFormModal.vue';
import type { Role } from '@/types';

definePageMeta({
  layout: false
});

useSeoMeta({
  title: 'Roles & Access Permissions - Admin',
  robots: 'noindex, nofollow'
});

const route = useRoute();
const router = useRouter();

const tableColumns: UiTableColumn<Role>[] = [
  { key: 'name', label: 'Role Name', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
  { key: 'permissionsCount', label: 'Permissions', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
  { key: 'permissionsPreview', label: 'Assigned Permissions Preview', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
  { key: 'actions', label: 'Actions', align: 'right', headerClass: 'px-4 py-3 text-right', cellClass: 'px-4 py-2.5 text-right font-medium' },
];

const roleService = useRoleService();
const { canViewModule, canCreateInModule, canEditInModule, canDeleteInModule } = useAdminPermissions();
const { toastSuccess, toastError } = useToast();

const searchQuery = ref(String(route.query.search || ''));
const debouncedSearchQuery = refDebounced(searchQuery, 300);
const isDeleting = ref(false);
const viewMode = ref<'grid' | 'list'>('list');

const canViewRoles = computed(() => canViewModule('/admin/roles'));
const canCreateRole = computed(() => canCreateInModule('/admin/roles'));
const canEditRole = computed(() => canEditInModule('/admin/roles'));
const canDeleteRole = computed(() => canDeleteInModule('/admin/roles'));

// --- LIST VIEW NUMBERED PAGINATION STATE ---
const currentPage = ref(route.query.page ? parseInt(String(route.query.page)) || 1 : 1);
const itemsPerPage = ref(route.query.pageSize ? parseInt(String(route.query.pageSize)) || 10 : 10);
const listRoles = ref<Role[]>([]);
const listTotalCount = ref<number>(0);
const isListLoading = ref<boolean>(false);
const listError = ref<string | null>(null);

const listTotalPages = computed(() => {
  return Math.ceil(listTotalCount.value / itemsPerPage.value) || 1;
});

const fetchListRoles = async () => {
  if (viewMode.value !== 'list' || !canViewRoles.value) return;
  isListLoading.value = true;
  listError.value = null;
  try {
    const res = await roleService.getRoles({
      page: currentPage.value,
      page_size: itemsPerPage.value,
      search: searchQuery.value
    });
    listRoles.value = res.results;
    listTotalCount.value = res.count;
  } catch (err: any) {
    listError.value = extractErrorMessage(err, 'Failed to retrieve roles repository.');
    listRoles.value = [];
    listTotalCount.value = 0;
  } finally {
    isListLoading.value = false;
  }
};

// --- GRID VIEW INFINITE PAGINATION STATE ---
const {
  items: gridRoles,
  totalCount: gridTotalCount,
  isLoading: isGridLoading,
  isFetchingNextPage: isGridFetchingNext,
  hasMore: gridHasMore,
  error: gridError,
  fetchFirstPage: fetchGridFirstPage,
  loadNextPage: loadGridNextPage,
  refresh: refreshGridPagination,
  reset: resetGridPagination
} = useInfinitePagination<Role>({
  fetcher: async (params): Promise<PaginatedResponse<Role>> => {
    if (viewMode.value !== 'grid' || !canViewRoles.value) {
      return { results: [], count: 0, next: null, previous: null };
    }
    const res = await roleService.getRoles({
      page: params.page,
      search: searchQuery.value
    });
    const totalPages = Math.ceil(res.count / 10) || 1;
    return {
      results: res.results,
      count: res.count,
      next: res.next ?? (params.page < totalPages ? `?page=${params.page + 1}` : null),
      previous: res.previous ?? (params.page > 1 ? `?page=${params.page - 1}` : null)
    };
  },
  search: searchQuery,
  autoFetch: false
});

// Reusable URL-driven modal state infrastructure
const modalState = useAdminModalState<Role>({
  getItems: async (id) => {
    return await roleService.getRoleById(Number(id));
  },
  onResolveError: (id) => {
    toastError(`Role #${id} could not be found.`);
    modalState.closeModal({ replace: true });
  }
});

// Watch permission enforcement for URL modal triggers
watch(
  [() => modalState.activeMode.value, canEditRole, canDeleteRole],
  ([mode, editAllowed, deleteAllowed]) => {
    if (mode === 'edit' && !editAllowed) {
      toastError('You do not have permission to edit roles.');
      modalState.closeModal({ replace: true });
    } else if (mode === 'delete' && !deleteAllowed) {
      toastError('You do not have permission to delete roles.');
      modalState.closeModal({ replace: true });
    }
  }
);

onMounted(async () => {
  if (viewMode.value === 'grid') {
    await fetchGridFirstPage();
  } else {
    await fetchListRoles();
  }
});

// Watch view mode toggles to reset and isolate pagination strategies
watch(viewMode, async (newMode) => {
  if (newMode === 'grid') {
    resetGridPagination();
    await fetchGridFirstPage();
  } else if (newMode === 'list') {
    currentPage.value = 1;
    await fetchListRoles();
  }
});

// Watch debounced search
watch(debouncedSearchQuery, async () => {
  if (viewMode.value === 'grid') {
    await fetchGridFirstPage();
  } else if (viewMode.value === 'list') {
    currentPage.value = 1;
    await fetchListRoles();
  }
});

// Reset pagination on itemsPerPage change
watch(itemsPerPage, () => {
  currentPage.value = 1;
});

// Watch pagination state for List view
watch([currentPage, itemsPerPage], async () => {
  if (viewMode.value === 'list') {
    await fetchListRoles();
  }
});

// Sync route parameters
watch([searchQuery, currentPage, itemsPerPage, viewMode], () => {
  const query: Record<string, any> = { ...route.query };

  if (searchQuery.value) query.search = searchQuery.value;
  else delete query.search;

  if (viewMode.value === 'list' && currentPage.value !== 1) query.page = String(currentPage.value);
  else delete query.page;

  if (viewMode.value === 'list' && itemsPerPage.value !== 10) query.pageSize = String(itemsPerPage.value);
  else delete query.pageSize;

  router.replace({ query });
});

// Watch route query changes (for browser Back/Forward navigation)
watch(() => route.query, (newQuery) => {
  const newPage = newQuery.page ? parseInt(String(newQuery.page)) || 1 : 1;
  if (currentPage.value !== newPage) currentPage.value = newPage;

  const newPageSize = newQuery.pageSize ? parseInt(String(newQuery.pageSize)) || 10 : 10;
  if (itemsPerPage.value !== newPageSize) itemsPerPage.value = newPageSize;
});

const refreshActiveView = async () => {
  if (viewMode.value === 'grid') {
    await refreshGridPagination();
  } else {
    await fetchListRoles();
  }
};

const handleRoleSaved = async () => {
  await refreshActiveView();
  await modalState.closeModal();
};

const executeDeleteRole = async () => {
  if (!modalState.activeEntity.value) return;
  const targetRole = modalState.activeEntity.value;
  isDeleting.value = true;

  try {
    await roleService.deleteRole(targetRole.id);
    toastSuccess(`Role "${targetRole.name}" removed successfully.`);
    await modalState.closeModal();
    await refreshActiveView();
  } catch (err: any) {
    handleApiError(err, 'Failed to delete role.');
  } finally {
    isDeleting.value = false;
  }
};

// --- STATS COMPUTED AGGREGATES ---
const totalRolesCount = computed(() => {
  if (viewMode.value === 'grid') {
    return gridTotalCount.value;
  }
  return listTotalCount.value;
});

const totalPermissionsCount = computed(() => {
  const source = viewMode.value === 'grid' ? gridRoles.value : listRoles.value;
  return source.reduce((acc, r) => acc + (r.permissions?.length || 0), 0);
});

const avgPermissionsCount = computed(() => {
  const source = viewMode.value === 'grid' ? gridRoles.value : listRoles.value;
  return source.length > 0 ? Math.round(totalPermissionsCount.value / source.length) : 0;
});
</script>

<template>
  <NuxtLayout name="admin">
    <template #header-title>
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground/40 font-light select-none">/</span>
        <h1 class="text-xl font-display font-extrabold tracking-tight text-foreground">
          Roles
        </h1>
      </div>
    </template>

    <template #header-actions>
      <div class="flex flex-wrap items-center gap-2">
        <UiButton 
          variant="outline" 
          class="rounded-xl h-9 px-3.5 gap-1.5 border-border font-bold text-xs"
          @click="refreshActiveView"
          :disabled="isListLoading || isGridLoading"
        >
          <RefreshCw :class="['w-3.5 h-3.5', (isListLoading || isGridLoading) && 'animate-spin']" />
          <span>Refresh</span>
        </UiButton>

        <UiButton 
          v-if="canCreateRole"
          class="rounded-xl h-9 px-3.5 gap-1.5 shadow-md shadow-primary/10 bg-primary text-primary-foreground font-bold text-xs"
          @click="modalState.openCreate()"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Add Role</span>
        </UiButton>
      </div>
    </template>

    <div class="space-y-4 animate-in fade-in duration-500">
      
      <!-- Active Analytics row -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <UiCard class="flex items-center gap-3.5 p-3.5">
          <div class="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-inner">
            <Shield class="w-5 h-5" />
          </div>
          <div>
            <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Total Roles</p>
            <p class="text-2xl font-display font-extrabold tracking-tight text-foreground leading-tight">{{ totalRolesCount }}</p>
          </div>
        </UiCard>
        <UiCard class="flex items-center gap-3.5 p-3.5">
          <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
            <Key class="w-5 h-5" />
          </div>
          <div>
            <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Active Permissions</p>
            <p class="text-2xl font-display font-extrabold tracking-tight text-foreground leading-tight">{{ totalPermissionsCount }}</p>
          </div>
        </UiCard>
        <UiCard class="flex items-center gap-3.5 p-3.5">
          <div class="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
            <Shield class="w-5 h-5" />
          </div>
          <div>
            <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Avg Permissions / Role</p>
            <p class="text-2xl font-display font-extrabold tracking-tight text-foreground leading-tight">{{ avgPermissionsCount }}</p>
          </div>
        </UiCard>
      </div>

      <!-- Search & Metric Bar -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border px-3.5 py-2.5 rounded-xl shadow-xs">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <UiSearchInput 
            v-model="searchQuery" 
            placeholder="Search roles by title or permission..."
            class="w-full sm:w-80"
          />

          <!-- View Toggle Buttons -->
          <div class="flex items-center self-start sm:self-auto bg-muted/60 p-1 rounded-lg border border-border/80">
            <button
              type="button"
              @click="viewMode = 'grid'"
              :class="[
                'h-7 w-7 rounded-md transition-all flex items-center justify-center cursor-pointer',
                viewMode === 'grid'
                  ? 'bg-background text-primary shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              ]"
              title="Grid View"
              aria-label="Grid view"
            >
              <LayoutGrid class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              @click="viewMode = 'list'"
              :class="[
                'h-7 w-7 rounded-md transition-all flex items-center justify-center cursor-pointer',
                viewMode === 'list'
                  ? 'bg-background text-primary shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              ]"
              title="List View"
              aria-label="List view"
            >
              <List class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div class="flex items-center gap-3 self-end sm:self-center">
          <!-- Items per page selector (List view only) -->
          <div v-if="viewMode === 'list'" class="flex items-center gap-1.5 border-l border-border pl-2.5">
            <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground hidden sm:inline">Show:</span>
            <select 
              v-model="itemsPerPage"
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

          <div class="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <Key class="w-4 h-4 text-primary" />
            <span>{{ totalRolesCount }} Security Roles Defined</span>
          </div>
        </div>
      </div>

    <!-- Loading Skeleton State -->
    <div v-if="(viewMode === 'list' && isListLoading && listRoles.length === 0) || (viewMode === 'grid' && isGridLoading && gridRoles.length === 0)" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 3" :key="i" class="bg-card border border-border/60 rounded-[2.5rem] p-8 space-y-6 animate-pulse">
        <div class="flex items-start justify-between">
          <div class="w-12 h-12 rounded-2xl bg-muted"></div>
          <div class="w-16 h-6 rounded-full bg-muted"></div>
        </div>
        <div class="space-y-2">
          <div class="h-6 w-3/4 rounded-lg bg-muted"></div>
          <div class="h-4 w-1/2 rounded-lg bg-muted"></div>
        </div>
        <div class="flex gap-2">
          <div class="h-6 w-20 rounded-full bg-muted"></div>
          <div class="h-6 w-24 rounded-full bg-muted"></div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="(viewMode === 'list' && listError && listRoles.length === 0) || (viewMode === 'grid' && gridError && gridRoles.length === 0)" class="bg-card border border-destructive/20 rounded-[2.5rem] p-12 text-center max-w-xl mx-auto shadow-sm">
      <div class="w-16 h-16 rounded-3xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
        <AlertCircle class="w-8 h-8" />
      </div>
      <h3 class="text-xl font-bold text-foreground mb-2">Unable to load security roles</h3>
      <p class="text-muted-foreground text-xs mb-6">{{ viewMode === 'list' ? listError : gridError }}</p>
      <UiButton @click="refreshActiveView" class="rounded-2xl px-6 h-11 font-bold">
        Retry Connection
      </UiButton>
    </div>

    <!-- Empty State -->
    <div v-else-if="(viewMode === 'list' && listRoles.length === 0) || (viewMode === 'grid' && gridRoles.length === 0)" class="bg-card border border-border rounded-[2.5rem] p-12 text-center max-w-md mx-auto shadow-sm">
      <div class="w-16 h-16 rounded-3xl bg-muted text-muted-foreground flex items-center justify-center mx-auto mb-4">
        <Shield class="w-8 h-8" />
      </div>
      <h3 class="text-lg font-bold text-foreground mb-1">
        {{ searchQuery ? 'No roles matched' : 'No roles found' }}
      </h3>
      <p class="text-xs text-muted-foreground mb-6">
        {{ searchQuery ? `No role found matching "${searchQuery}".` : 'Create your first role to get started.' }}
      </p>
      <UiButton v-if="searchQuery" variant="outline" @click="searchQuery = ''" class="rounded-2xl h-10 px-5 text-xs font-bold">
        Clear Filter
      </UiButton>
      <UiButton v-else @click="modalState.openCreate()" class="rounded-2xl h-10 px-5 text-xs font-bold">
        Create First Role
      </UiButton>
    </div>

    <!-- Roles Display Modes -->
    <template v-else>
      <!-- Roles Grid Mode -->
      <div v-if="viewMode === 'grid'" class="space-y-8">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="role in gridRoles" 
            :key="role.id"
            class="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between group hover:border-primary/40 hover:shadow-md transition-all duration-300"
          >
            <div class="space-y-6">
              <!-- Role Header -->
              <div class="flex items-start justify-between gap-4">
                <div class="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                  <Shield class="w-7 h-7" />
                </div>

                <div class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-wider">
                  <Key class="w-3 h-3 text-primary" />
                  <span>{{ role.permissions ? role.permissions.length : 0 }} Permissions</span>
                </div>
              </div>

              <!-- Role Name -->
              <div>
                <h3 class="text-xl font-display font-extrabold text-foreground group-hover:text-primary transition-colors">
                  {{ role.name }}
                </h3>
              </div>

              <!-- Permission Preview List -->
              <div class="space-y-2 pt-2 border-t border-border/60">
                <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  Assigned Permissions
                </span>

                <div v-if="role.permissions && role.permissions.length > 0" class="flex flex-wrap gap-1.5">
                  <span 
                    v-for="perm in role.permissions.slice(0, 4)" 
                    :key="perm.id"
                    class="px-2.5 py-1 rounded-xl bg-muted/60 text-foreground text-[11px] font-medium border border-border/50 truncate max-w-[180px]"
                    :title="perm.codename"
                  >
                    {{ perm.name }}
                  </span>

                  <span 
                    v-if="role.permissions.length > 4" 
                    class="px-2.5 py-1 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider"
                  >
                    +{{ role.permissions.length - 4 }} more
                  </span>
                </div>

                <p v-else class="text-xs text-muted-foreground italic">
                  No permissions assigned to this role yet.
                </p>
              </div>
            </div>

            <!-- Action Controls -->
            <div class="pt-6 mt-6 border-t border-border/60 flex items-center justify-end gap-1">
              <button 
                type="button" 
                @click="modalState.openView(role.id)"
                class="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="View Role Details"
                aria-label="View role details"
              >
                <Eye class="w-4 h-4" />
              </button>

              <button 
                v-if="canEditRole"
                type="button" 
                @click="modalState.openEdit(role.id)"
                class="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Edit Role"
                aria-label="Edit role"
              >
                <Edit class="w-4 h-4" />
              </button>

              <button 
                v-if="canDeleteRole"
                type="button" 
                @click="modalState.openDelete(role.id)"
                class="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                title="Delete Role"
                aria-label="Delete role"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

        <!-- Infinite Scroll Control for Grid Mode -->
        <UiInfiniteScroll 
          :has-more="gridHasMore"
          :is-loading="isGridFetchingNext"
          :error="gridError"
          @load-more="loadGridNextPage"
          @retry="loadGridNextPage"
        />
      </div>

      <!-- Roles List/Table Mode -->
      <div v-else-if="viewMode === 'list'">
        <UiTable
          :columns="tableColumns"
          :data="listRoles"
          key-field="id"
        >
          <!-- Role Name -->
          <template #cell-name="{ item: role }">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                <Shield class="w-4 h-4" />
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                  {{ role.name }}
                </span>
                <span class="text-[10px] text-muted-foreground font-medium">ID: #{{ role.id }}</span>
              </div>
            </div>
          </template>

          <!-- Permissions Count -->
          <template #cell-permissionsCount="{ item: role }">
            <div class="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-wider w-fit border border-border">
              <Key class="w-3 h-3 text-primary" />
              <span>{{ role.permissions ? role.permissions.length : 0 }} Permissions</span>
            </div>
          </template>

          <!-- Assigned Permissions Preview -->
          <template #cell-permissionsPreview="{ item: role }">
            <div v-if="role.permissions && role.permissions.length > 0" class="flex flex-wrap gap-1">
              <span 
                v-for="perm in role.permissions.slice(0, 4)" 
                :key="perm.id"
                class="px-2 py-0.5 rounded text-[9px] font-semibold border bg-muted text-foreground border-border truncate max-w-[150px]"
                :title="perm.codename"
              >
                {{ perm.name }}
              </span>
              <span 
                v-if="role.permissions.length > 4" 
                class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20"
              >
                +{{ role.permissions.length - 4 }} more
              </span>
            </div>
            <p v-else class="text-[11px] text-muted-foreground italic">
              No permissions assigned.
            </p>
          </template>

          <!-- Actions -->
          <template #cell-actions="{ item: role }">
            <div class="flex items-center justify-end gap-1 font-medium">
              <button 
                type="button" 
                @click="modalState.openView(role.id)"
                class="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors cursor-pointer"
                title="View Role Details"
                aria-label="View role details"
              >
                <Eye class="w-3.5 h-3.5" />
              </button>

              <button 
                v-if="canEditRole"
                type="button" 
                @click="modalState.openEdit(role.id)"
                class="p-1.5 rounded-md text-muted-foreground hover:text-yellow-500 hover:bg-muted transition-colors cursor-pointer"
                title="Edit Role"
                aria-label="Edit role"
              >
                <Edit class="w-3.5 h-3.5" />
              </button>

              <button 
                v-if="canDeleteRole"
                type="button" 
                @click="modalState.openDelete(role.id)"
                class="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors cursor-pointer"
                title="Delete Role"
                aria-label="Delete role"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </template>

          <!-- Pagination Footer System -->
          <template #footer>
            <UiPagination
              v-model:current-page="currentPage"
              :total-pages="listTotalPages"
              :total-count="listTotalCount"
              :items-per-page="itemsPerPage"
              item-label="roles"
              prefix-label="Showing"
              variant="footer"
            />
          </template>
        </UiTable>
      </div>
    </template>

    <!-- Role Form Modal (Create / Edit / View) -->
    <RoleFormModal 
      :is-open="modalState.isCreate.value || modalState.isEdit.value || modalState.isView.value"
      :is-edit="modalState.isEdit.value"
      :is-view="modalState.isView.value"
      :is-resolving="modalState.isResolving.value"
      :role="(modalState.isEdit.value || modalState.isView.value) ? modalState.activeEntity.value : null"
      @close="modalState.closeModal()"
      @saved="handleRoleSaved"
    />

    <!-- Delete Confirmation Modal -->
    <UiAdminModal 
      :is-open="modalState.isDelete.value && !!modalState.activeEntity.value"
      max-width="max-w-md"
      :show-close-button="false"
      @close="modalState.closeModal()"
    >
      <div class="p-6 space-y-6">
        <div class="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <Trash2 class="w-6 h-6" />
        </div>

        <div>
          <h3 class="text-lg font-bold text-foreground">Confirm Role Deletion</h3>
          <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Are you sure you want to delete the role <span class="font-bold text-foreground">"{{ modalState.activeEntity.value?.name }}"</span>? Staff members assigned to this group may lose administrative access.
          </p>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <UiButton 
            variant="outline" 
            class="rounded-xl h-10 px-5 text-xs font-bold"
            @click="modalState.closeModal()"
            :disabled="isDeleting"
          >
            Cancel
          </UiButton>

          <UiButton 
            class="rounded-xl h-10 px-5 text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            @click="executeDeleteRole"
            :disabled="isDeleting"
          >
            <Loader2 v-if="isDeleting" class="w-4 h-4 animate-spin" />
            <span>Delete Role</span>
          </UiButton>
        </div>
      </div>
    </UiAdminModal>

    </div>
  </NuxtLayout>
</template>

