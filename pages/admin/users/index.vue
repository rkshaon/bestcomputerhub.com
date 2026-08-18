<!-- File: /pages/admin/users/index.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { refDebounced } from '@vueuse/core';
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  Shield, 
  Crown, 
  Loader2, 
  AlertCircle, 
  RefreshCw,
  User as UserIcon,
  CheckCircle2,
  Edit,
  Trash2,
  Eye,
  LayoutGrid,
  List
} from 'lucide-vue-next';
import { useUserService } from '@/composables/useUserService';
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
import Button from '@/components/ui/Button.vue';
import UserFormModal from '@/components/admin/UserFormModal.vue';
import type { UserItem, UserGroup, Role } from '@/types';

definePageMeta({
  layout: false
});

const tableColumns: UiTableColumn<UserItem>[] = [
  { key: 'user', label: 'User', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
  { key: 'status', label: 'Status', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
  { key: 'contact', label: 'Email / Username', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
  { key: 'groups', label: 'Security Groups', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
  { key: 'actions', label: 'Actions', align: 'right', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
];

useSeoMeta({
  title: 'User Accounts & Personnel Access - Admin',
  robots: 'noindex, nofollow'
});

const route = useRoute();
const router = useRouter();

const userService = useUserService();
const roleService = useRoleService();
const { canViewModule, canCreateInModule, canEditInModule, canDeleteInModule } = useAdminPermissions();
const { toastSuccess, toastError } = useToast();

const searchQuery = ref(String(route.query.search || ''));
const debouncedSearchQuery = refDebounced(searchQuery, 300);
const isDeleting = ref(false);
const viewMode = ref<'grid' | 'list'>('list');

const canViewUsers = computed(() => canViewModule('/admin/users'));
const canCreateUser = computed(() => canCreateInModule('/admin/users'));
const canEditUser = computed(() => canEditInModule('/admin/users'));
const canDeleteUser = computed(() => canDeleteInModule('/admin/users'));

// --- LIST VIEW NUMBERED PAGINATION STATE ---
const currentPage = ref(route.query.page ? parseInt(String(route.query.page)) || 1 : 1);
const itemsPerPage = ref(route.query.pageSize ? parseInt(String(route.query.pageSize)) || 10 : 10);
const listUsers = ref<UserItem[]>([]);
const listTotalCount = ref<number>(0);
const isListLoading = ref<boolean>(false);
const listError = ref<string | null>(null);

const listTotalPages = computed(() => {
  return Math.ceil(listTotalCount.value / itemsPerPage.value) || 1;
});

const fetchListUsers = async () => {
  if (viewMode.value !== 'list') return;
  isListLoading.value = true;
  listError.value = null;
  try {
    const res = await userService.getUsers({
      page: currentPage.value,
      page_size: itemsPerPage.value,
      search: searchQuery.value
    });
    listUsers.value = res.results;
    listTotalCount.value = res.count;
  } catch (err: any) {
    listError.value = extractErrorMessage(err, 'Failed to retrieve user accounts catalog.');
    listUsers.value = [];
    listTotalCount.value = 0;
  } finally {
    isListLoading.value = false;
  }
};

// --- GRID VIEW INFINITE PAGINATION STATE ---
const {
  items: gridUsers,
  totalCount: gridTotalCount,
  isLoading: isGridLoading,
  isFetchingNextPage: isGridFetchingNext,
  hasMore: gridHasMore,
  error: gridError,
  fetchFirstPage: fetchGridFirstPage,
  loadNextPage: loadGridNextPage,
  refresh: refreshGridPagination,
  reset: resetGridPagination
} = useInfinitePagination<UserItem>({
  fetcher: async (params): Promise<PaginatedResponse<UserItem>> => {
    if (viewMode.value !== 'grid') {
      return { results: [], count: 0, next: null, previous: null };
    }
    const res = await userService.getUsers({
      page: params.page,
      page_size: 12,
      search: searchQuery.value
    });
    const totalPages = Math.ceil(res.count / 12) || 1;
    return {
      results: res.results,
      count: res.count,
      next: params.page < totalPages ? `?page=${params.page + 1}` : null,
      previous: params.page > 1 ? `?page=${params.page - 1}` : null
    };
  },
  search: searchQuery,
  autoFetch: false
});

// Reusable URL-driven modal state infrastructure for users CRUD dialogs
const modalState = useAdminModalState<UserItem>({
  getItems: async (id) => {
    return await userService.getUserById(Number(id));
  },
  onResolveError: (id) => {
    toastError(`User account #${id} could not be found.`);
    modalState.closeModal({ replace: true });
  }
});

// Watch permission enforcement for URL modal triggers
watch(
  [() => modalState.activeMode.value, canEditUser, canDeleteUser],
  ([mode, editAllowed, deleteAllowed]) => {
    if (mode === 'edit' && !editAllowed) {
      toastError('You do not have permission to edit user accounts.');
      modalState.closeModal({ replace: true });
    } else if (mode === 'delete' && !deleteAllowed) {
      toastError('You do not have permission to delete user accounts.');
      modalState.closeModal({ replace: true });
    }
  }
);

// Load available roles to resolve group IDs to group names
const rolesMap = computed(() => {
  const map = new Map<number, string>();
  if (roleService.roles.value) {
    roleService.roles.value.forEach(r => map.set(r.id, r.name));
  }
  return map;
});

onMounted(async () => {
  roleService.getRoles();
  if (viewMode.value === 'grid') {
    await fetchGridFirstPage();
  } else {
    await fetchListUsers();
  }
});

// Watch view mode toggles to reset and isolate pagination strategies
watch(viewMode, async (newMode) => {
  if (newMode === 'grid') {
    resetGridPagination();
    await fetchGridFirstPage();
  } else if (newMode === 'list') {
    currentPage.value = 1;
    await fetchListUsers();
  }
});

// Watch debounced search
watch(debouncedSearchQuery, async () => {
  if (viewMode.value === 'grid') {
    await fetchGridFirstPage();
  } else if (viewMode.value === 'list') {
    currentPage.value = 1;
    await fetchListUsers();
  }
});

// Watch pagination state for List view
watch([currentPage, itemsPerPage], async () => {
  if (viewMode.value === 'list') {
    await fetchListUsers();
  }
});

// Sync route parameters
watch([searchQuery, currentPage, itemsPerPage, viewMode], () => {
  const query: Record<string, any> = { ...route.query };

  if (searchQuery.value) query.search = searchQuery.value;
  else delete query.search;

  if (viewMode.value === 'list' && currentPage.value !== 1) query.page = String(currentPage.value);
  else delete query.page;

  if (itemsPerPage.value !== 10) query.pageSize = String(itemsPerPage.value);
  else delete query.pageSize;

  router.replace({ query });
});

const refreshActiveView = async () => {
  if (viewMode.value === 'grid') {
    await refreshGridPagination();
  } else {
    await fetchListUsers();
  }
};

const handleUserSaved = async () => {
  await refreshActiveView();
};

const executeDeleteUser = async () => {
  if (!modalState.activeEntity.value) return;
  const targetUser = modalState.activeEntity.value;

  if (!canDeleteUser.value) {
    toastError('You do not have permission to delete user accounts.');
    await modalState.closeModal();
    return;
  }

  isDeleting.value = true;
  try {
    await userService.deleteUser(targetUser.id);
    const displayName = getUserDisplayName(targetUser);
    toastSuccess(`User account "${displayName}" removed successfully.`);
    await modalState.closeModal();
    await refreshActiveView();
  } catch (err: any) {
    handleApiError(err, 'Failed to delete user account.');
  } finally {
    isDeleting.value = false;
  }
};

// Helper to format display name
const getUserDisplayName = (user: UserItem | null | undefined): string => {
  if (!user) return 'User Account';
  if (user.full_name) return user.full_name;
  const parts = [user.first_name, user.middle_name, user.last_name].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  return user.username || user.email || 'User Account';
};

// Helper to format role names from group IDs or objects
const getUserGroupNames = (user: UserItem): string[] => {
  if (!user.groups || !Array.isArray(user.groups) || user.groups.length === 0) {
    return ['No groups assigned'];
  }

  return user.groups.map(g => {
    if (typeof g === 'object' && g !== null && 'name' in g) {
      return (g as UserGroup).name || `Role #${(g as UserGroup).id}`;
    }
    const groupId = Number(g);
    return rolesMap.value.get(groupId) || `Role #${groupId}`;
  });
};

// --- STATS COMPUTED AGGREGATES ---
const totalPersonnel = computed(() => {
  if (viewMode.value === 'grid') {
    return gridTotalCount.value;
  }
  return listTotalCount.value;
});

const superadminsCount = computed(() => {
  const source = viewMode.value === 'grid' ? gridUsers.value : listUsers.value;
  return source.filter(u => u.is_superuser).length;
});

const staffAccountsCount = computed(() => {
  const source = viewMode.value === 'grid' ? gridUsers.value : listUsers.value;
  return source.filter(u => !u.is_superuser).length;
});
</script>

<template>
  <NuxtLayout name="admin">
    <template #header-title>
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground/40 font-light select-none">/</span>
        <h1 class="text-xl font-display font-extrabold tracking-tight text-foreground">
          Users
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
          v-if="canCreateUser"
          class="rounded-xl h-9 px-3.5 gap-1.5 shadow-md shadow-primary/10 bg-primary text-primary-foreground font-bold text-xs"
          @click="modalState.openModal('create')"
        >
          <UserPlus class="w-3.5 h-3.5" />
          <span>Add User</span>
        </UiButton>
      </div>
    </template>

    <div class="space-y-4 animate-in fade-in duration-500">
      
      <!-- Active Analytics row -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <UiCard class="flex items-center gap-3.5 p-3.5">
          <div class="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-inner">
            <Users class="w-5 h-5" />
          </div>
          <div>
            <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Total Personnel</p>
            <p class="text-2xl font-display font-extrabold tracking-tight text-foreground leading-tight">{{ totalPersonnel }}</p>
          </div>
        </UiCard>
        <UiCard class="flex items-center gap-3.5 p-3.5">
          <div class="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
            <Crown class="w-5 h-5" />
          </div>
          <div>
            <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Superadmins</p>
            <p class="text-2xl font-display font-extrabold tracking-tight text-foreground leading-tight">{{ superadminsCount }}</p>
          </div>
        </UiCard>
        <UiCard class="flex items-center gap-3.5 p-3.5">
          <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
            <Shield class="w-5 h-5" />
          </div>
          <div>
            <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Staff Accounts</p>
            <p class="text-2xl font-display font-extrabold tracking-tight text-foreground leading-tight">{{ staffAccountsCount }}</p>
          </div>
        </UiCard>
      </div>

      <!-- Search & Filter Bar -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border px-3.5 py-2.5 rounded-xl shadow-xs">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <UiSearchInput 
            v-model="searchQuery"
            placeholder="Search by name, email, or username..."
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
      </div>

    <!-- Loading State (First Page) -->
    <div v-if="(viewMode === 'list' && isListLoading && listUsers.length === 0) || (viewMode === 'grid' && isGridLoading && gridUsers.length === 0)" class="py-16 text-center space-y-3">
      <Loader2 class="w-8 h-8 animate-spin text-primary mx-auto" />
      <p class="text-xs font-semibold text-muted-foreground">Retrieving user accounts catalog...</p>
    </div>

    <!-- Error Banner -->
    <div v-else-if="(viewMode === 'list' && listError && listUsers.length === 0) || (viewMode === 'grid' && gridError && gridUsers.length === 0)" class="p-6 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-center space-y-3">
      <AlertCircle class="w-8 h-8 mx-auto" />
      <p class="text-xs font-semibold">{{ viewMode === 'list' ? listError : gridError }}</p>
      <Button variant="outline" size="sm" @click="refreshActiveView" class="gap-1.5">
        <RefreshCw class="w-3.5 h-3.5" />
        <span>Try Again</span>
      </Button>
    </div>

    <!-- Empty State -->
    <div v-else-if="(viewMode === 'list' && listUsers.length === 0) || (viewMode === 'grid' && gridUsers.length === 0)" class="py-16 text-center border-2 border-dashed border-border rounded-3xl bg-card/50 p-8 space-y-4">
      <div class="w-12 h-12 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mx-auto text-muted-foreground">
        <Users class="w-6 h-6" />
      </div>
      <div>
        <h3 class="text-base font-bold text-foreground">
          {{ searchQuery ? `No results match "${searchQuery}"` : 'No users found' }}
        </h3>
        <p class="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          {{ searchQuery ? 'Try broadening your search query or clear filters.' : 'Create your first user to get started.' }}
        </p>
      </div>
      <Button v-if="!searchQuery && canCreateUser" variant="primary" size="sm" @click="modalState.openModal('create')" class="gap-2">
        <UserPlus class="w-4 h-4" />
        <span>Create User</span>
      </Button>
    </div>

    <!-- Users Display Modes -->
    <template v-else>
      <!-- Users Grid Mode -->
      <div v-if="viewMode === 'grid'" class="space-y-8">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="user in gridUsers" 
            :key="user.id"
            class="bg-card border border-border rounded-2xl p-6 shadow-sm hover:border-primary/30 transition-all duration-300 flex flex-col justify-between group"
          >
            <div class="space-y-5">
              
              <!-- Card Top Bar -->
              <div class="flex items-start justify-between gap-3">
                <div class="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-display font-extrabold text-lg shrink-0 overflow-hidden">
                  <UserIcon class="w-7 h-7" />
                </div>

                <div class="flex items-center gap-1.5">
                  <span 
                    v-if="user.is_superuser"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  >
                    <Crown class="w-3 h-3" /> Superadmin
                  </span>
                  <span 
                    v-else
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  >
                    <CheckCircle2 class="w-3 h-3" /> Active
                  </span>
                </div>
              </div>

              <!-- User Info -->
              <div>
                <h3 class="text-base font-display font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                  {{ getUserDisplayName(user) }}
                </h3>
                
                <div class="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 font-medium">
                  <Mail class="w-3.5 h-3.5 text-muted-foreground/70" />
                  <span class="truncate">{{ user.email }}</span>
                </div>

                <div v-if="user.username" class="text-[11px] font-mono text-muted-foreground/80 mt-1">
                  @{{ user.username }}
                </div>
              </div>

              <!-- Roles / Groups List -->
              <div class="pt-4 border-t border-border/60">
                <div class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                  <Shield class="w-3 h-3 text-primary" /> Security Groups & Scope
                </div>

                <div class="flex flex-wrap gap-1.5">
                  <span 
                    v-for="(groupName, idx) in getUserGroupNames(user)" 
                    :key="idx"
                    :class="[
                      'inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-semibold border',
                      groupName === 'No groups assigned'
                        ? 'bg-muted/40 text-muted-foreground border-border/40 italic'
                        : 'bg-muted text-foreground border-border'
                    ]"
                  >
                    {{ groupName }}
                  </span>
                </div>
              </div>

            </div>

            <div class="mt-5 pt-3 border-t border-border/40 text-[10px] font-semibold text-muted-foreground flex items-center justify-end">
              <!-- Action Controls (View, Edit & Delete) -->
              <div class="flex items-center gap-1">
                <button 
                  type="button" 
                  @click="modalState.openView(user.id)"
                  class="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  title="View User Details"
                  aria-label="View user details"
                >
                  <Eye class="w-4 h-4" />
                </button>

                <button 
                  v-if="canEditUser"
                  type="button" 
                  @click="modalState.openEdit(user.id)"
                  class="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  title="Edit User Account"
                  aria-label="Edit user account"
                >
                  <Edit class="w-4 h-4" />
                </button>

                <button 
                  v-if="canDeleteUser"
                  type="button" 
                  @click="modalState.openDelete(user.id)"
                  class="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Delete User Account"
                  aria-label="Delete user account"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Infinite Scroll Pagination Control for Grid Mode -->
        <UiInfiniteScroll 
          :has-more="gridHasMore"
          :is-loading="isGridFetchingNext"
          :error="gridError"
          @load-more="loadGridNextPage"
          @retry="loadGridNextPage"
        />
      </div>

      <!-- Users List/Table Mode -->
      <div v-else-if="viewMode === 'list'">
        <UiTable
          :columns="tableColumns"
          :data="listUsers"
          key-field="id"
        >
          <!-- User Info Column -->
          <template #cell-user="{ item: user }">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-display font-extrabold text-xs shrink-0">
                <UserIcon class="w-4 h-4" />
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                  {{ getUserDisplayName(user) }}
                </span>
                <span class="text-[10px] text-muted-foreground font-medium">ID: #{{ user.id }}</span>
              </div>
            </div>
          </template>

          <!-- Status Column -->
          <template #cell-status="{ item: user }">
            <span 
              v-if="user.is_superuser"
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
            >
              <Crown class="w-2.5 h-2.5" /> Superadmin
            </span>
            <span 
              v-else
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
            >
              <CheckCircle2 class="w-2.5 h-2.5" /> Active
            </span>
          </template>

          <!-- Contact Column -->
          <template #cell-contact="{ item: user }">
            <div class="flex flex-col max-w-[200px] sm:max-w-xs">
              <span class="text-xs text-foreground font-medium truncate">{{ user.email }}</span>
              <span v-if="user.username" class="text-[10px] font-mono text-muted-foreground">@{{ user.username }}</span>
            </div>
          </template>

          <!-- Security Groups Column -->
          <template #cell-groups="{ item: user }">
            <div class="flex flex-wrap gap-1">
              <span 
                v-for="(groupName, idx) in getUserGroupNames(user)" 
                :key="idx"
                :class="[
                  'inline-flex items-center px-2 py-0.5 rounded text-[9px] font-semibold border',
                  groupName === 'No groups assigned'
                    ? 'bg-muted/40 text-muted-foreground border-border/40 italic'
                    : 'bg-muted text-foreground border-border'
                ]"
              >
                {{ groupName }}
              </span>
            </div>
          </template>

          <!-- Actions Column -->
          <template #cell-actions="{ item: user }">
            <div class="flex items-center justify-end gap-1 font-medium">
              <button 
                type="button" 
                @click="modalState.openView(user.id)"
                class="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors cursor-pointer"
                title="View User Details"
                aria-label="View user details"
              >
                <Eye class="w-3.5 h-3.5" />
              </button>

              <button 
                v-if="canEditUser"
                type="button" 
                @click="modalState.openEdit(user.id)"
                class="p-1.5 rounded-md text-muted-foreground hover:text-yellow-500 hover:bg-muted transition-colors cursor-pointer"
                title="Edit User Account"
                aria-label="Edit user account"
              >
                <Edit class="w-3.5 h-3.5" />
              </button>

              <button 
                v-if="canDeleteUser"
                type="button" 
                @click="modalState.openDelete(user.id)"
                class="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors cursor-pointer"
                title="Delete User Account"
                aria-label="Delete user account"
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
              item-label="users"
              prefix-label="Showing"
              variant="footer"
            />
          </template>
        </UiTable>
      </div>
    </template>

    <!-- User Form Modal (Create / Edit / View) -->
    <UserFormModal 
      :is-open="modalState.isCreate.value || modalState.isEdit.value || modalState.isView.value"
      :is-edit="modalState.isEdit.value"
      :is-view="modalState.isView.value"
      :is-resolving="modalState.isResolving.value"
      :user="(modalState.isEdit.value || modalState.isView.value) ? modalState.activeEntity.value : null"
      @close="modalState.closeModal()"
      @saved="handleUserSaved"
    />

    <!-- Delete Confirmation Modal -->
    <UiAdminModal 
      :is-open="modalState.isDelete.value && !!modalState.activeEntity.value && canDeleteUser"
      max-width="max-w-md"
      :show-close-button="false"
      @close="modalState.closeModal()"
    >
      <div class="p-6 space-y-6">
        <div class="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <Trash2 class="w-6 h-6" />
        </div>

        <div>
          <h3 class="text-lg font-bold text-foreground">Confirm User Account Deletion</h3>
          <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Are you sure you want to delete the user account 
            <span class="font-bold text-foreground">"{{ getUserDisplayName(modalState.activeEntity.value) }}"</span>
            <span v-if="modalState.activeEntity.value?.username"> (@{{ modalState.activeEntity.value.username }})</span>?
            This personnel record and system credentials will be permanently removed.
          </p>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <Button 
            variant="outline" 
            size="sm"
            @click="modalState.closeModal()"
            :disabled="isDeleting"
          >
            Cancel
          </Button>

          <Button 
            variant="primary"
            size="sm"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            @click="executeDeleteUser"
            :disabled="isDeleting"
          >
            <Loader2 v-if="isDeleting" class="w-4 h-4 animate-spin" />
            <span>{{ isDeleting ? 'Deleting...' : 'Delete User Account' }}</span>
          </Button>
        </div>
      </div>
    </UiAdminModal>

    </div>
  </NuxtLayout>
</template>

