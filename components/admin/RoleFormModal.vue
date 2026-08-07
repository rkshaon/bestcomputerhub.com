<!-- File: /components/admin/RoleFormModal.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { X, Search, Check, Shield, Loader2, CheckSquare, Square, AlertCircle } from 'lucide-vue-next';
import { usePermissionService } from '@/composables/usePermissionService';
import { useRoleService } from '@/composables/useRoleService';
import { useInfinitePagination } from '@/composables/useInfinitePagination';
import { useToast } from '@/composables/useToast';
import UiAdminModal from '@/components/ui/UiAdminModal.vue';
import UiInfiniteScroll from '@/components/ui/UiInfiniteScroll.vue';
import type { Role, Permission } from '@/types';

interface Props {
  isOpen: boolean;
  role?: Role | null;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  role: null
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved', role: Role): void;
}>();

const permissionService = usePermissionService();
const roleService = useRoleService();
const { toastSuccess, toastError } = useToast();

const formName = ref('');
const selectedPermissionIds = ref<number[]>([]);
const searchQuery = ref('');
const activeCategory = ref('all');
const formError = ref('');

const isEdit = computed(() => !!props.role);

// Reusable infinite pagination composable
const {
  items: paginatedPermissions,
  isLoading: isLoadingPermissions,
  isFetchingNextPage,
  hasMore,
  error: paginationError,
  loadNextPage,
  fetchFirstPage
} = useInfinitePagination<Permission>({
  fetcher: permissionService.getPermissionsPage,
  search: searchQuery,
  pageSize: 10,
  dedupeKey: p => p.id,
  autoFetch: false
});

// Merged permissions list ensuring role's assigned permissions are always included
const permissionsList = computed(() => {
  const map = new Map<number, Permission>();

  if (props.role?.permissions) {
    props.role.permissions.forEach(p => map.set(p.id, p));
  }

  paginatedPermissions.value.forEach(p => map.set(p.id, p));

  return Array.from(map.values());
});

onMounted(() => {
  if (props.isOpen) {
    fetchFirstPage();
  }
});

watch(() => props.isOpen, async (newVal) => {
  if (newVal) {
    formError.value = '';
    searchQuery.value = '';
    activeCategory.value = 'all';

    fetchFirstPage();

    if (props.role) {
      formName.value = props.role.name;
      selectedPermissionIds.value = props.role.permissions ? props.role.permissions.map(p => p.id) : [];
    } else {
      formName.value = '';
      selectedPermissionIds.value = [];
    }
  }
});

// Category grouping helper
const getPermissionCategory = (codename: string): string => {
  if (codename.includes('user')) return 'Users';
  if (codename.includes('product')) return 'Products';
  if (codename.includes('category')) return 'Categories';
  if (codename.includes('brand')) return 'Brands';
  if (codename.includes('order')) return 'Orders';
  if (codename.includes('group') || codename.includes('role')) return 'Roles';
  if (codename.includes('logentry')) return 'Audit Logs';
  return 'General';
};

const availableCategories = computed(() => {
  const cats = new Set<string>();
  permissionsList.value.forEach(p => {
    cats.add(getPermissionCategory(p.codename));
  });
  return ['all', ...Array.from(cats)];
});

const filteredPermissions = computed(() => {
  return permissionsList.value.filter(p => {
    const matchesSearch = searchQuery.value === '' || 
      p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
      p.codename.toLowerCase().includes(searchQuery.value.toLowerCase());
    
    const cat = getPermissionCategory(p.codename);
    const matchesCategory = activeCategory.value === 'all' || cat === activeCategory.value;

    return matchesSearch && matchesCategory;
  });
});

const togglePermission = (id: number) => {
  const index = selectedPermissionIds.value.indexOf(id);
  if (index === -1) {
    selectedPermissionIds.value.push(id);
  } else {
    selectedPermissionIds.value.splice(index, 1);
  }
};

const isPermissionSelected = (id: number) => {
  return selectedPermissionIds.value.includes(id);
};

const toggleSelectAllFiltered = () => {
  const filteredIds = filteredPermissions.value.map(p => p.id);
  const allFilteredSelected = filteredIds.every(id => selectedPermissionIds.value.includes(id));

  if (allFilteredSelected) {
    selectedPermissionIds.value = selectedPermissionIds.value.filter(id => !filteredIds.includes(id));
  } else {
    const newSet = new Set([...selectedPermissionIds.value, ...filteredIds]);
    selectedPermissionIds.value = Array.from(newSet);
  }
};

const isAllFilteredSelected = computed(() => {
  if (filteredPermissions.value.length === 0) return false;
  return filteredPermissions.value.every(p => selectedPermissionIds.value.includes(p.id));
});

const handleSubmit = async () => {
  formError.value = '';
  
  if (!formName.value.trim()) {
    formError.value = 'Role name is required.';
    return;
  }

  try {
    let savedRole: Role;
    if (isEdit.value && props.role) {
      savedRole = await roleService.updateRole(props.role.id, {
        name: formName.value.trim(),
        permission_ids: selectedPermissionIds.value
      });
      toastSuccess(`Role "${savedRole.name}" updated successfully.`);
    } else {
      savedRole = await roleService.createRole({
        name: formName.value.trim(),
        permission_ids: selectedPermissionIds.value
      });
      toastSuccess(`Role "${savedRole.name}" created successfully.`);
    }

    emit('saved', savedRole);
    emit('close');
  } catch (err: any) {
    formError.value = err.message || 'Failed to save role.';
    toastError(formError.value);
  }
};
</script>

<template>
  <UiAdminModal
    :is-open="isOpen"
    max-width="max-w-2xl"
    :show-close-button="false"
    @close="emit('close')"
  >
      <!-- Modal Header -->
      <div class="px-6 py-5 border-b border-border flex items-center justify-between shrink-0 bg-muted/20">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Shield class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-lg font-display font-extrabold text-foreground">
              {{ isEdit ? 'Edit Role Authority' : 'Create New Role' }}
            </h2>
            <p class="text-xs text-muted-foreground font-medium">
              {{ isEdit ? 'Update role title and permission matrix' : 'Define access scope and assign functional permissions' }}
            </p>
          </div>
        </div>

        <button 
          type="button"
          @click="emit('close')"
          aria-label="Close dialog"
          class="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 overflow-y-auto space-y-6 flex-1">
        
        <!-- Error Banner -->
        <div v-if="formError" class="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive text-xs font-semibold">
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
          <span>{{ formError }}</span>
        </div>

        <!-- Role Name Input -->
        <div class="space-y-2">
          <label class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Role Name <span class="text-destructive">*</span></span>
            <span class="text-[10px] font-normal lowercase text-muted-foreground">Unique authority identifier</span>
          </label>
          <input 
            v-model="formName" 
            type="text" 
            placeholder="e.g. Catalog Editor, Support Lead, Inventory Auditor"
            class="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        <!-- Permissions Section -->
        <div class="space-y-3 pt-2">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <span>Permissions Matrix</span>
              <span class="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black">
                {{ selectedPermissionIds.length }} Selected
              </span>
            </label>

            <button 
              type="button" 
              @click="toggleSelectAllFiltered"
              class="text-xs font-bold text-primary hover:underline flex items-center gap-1.5 self-start sm:self-auto"
            >
              <CheckSquare v-if="!isAllFilteredSelected" class="w-3.5 h-3.5" />
              <Square v-else class="w-3.5 h-3.5" />
              <span>{{ isAllFilteredSelected ? 'Deselect Visible' : 'Select All Visible' }}</span>
            </button>
          </div>

          <!-- Search & Filter Controls -->
          <div class="flex flex-col sm:flex-row items-center gap-3">
            <div class="relative w-full sm:flex-1">
              <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                v-model="searchQuery" 
                type="text" 
                placeholder="Search permissions by name or codename..." 
                class="w-full h-9 pl-9 pr-4 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <!-- Category Pills -->
            <div class="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              <button 
                v-for="cat in availableCategories" 
                :key="cat"
                type="button"
                @click="activeCategory = cat"
                :class="[
                  'px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all',
                  activeCategory === cat 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                ]"
              >
                {{ cat }}
              </button>
            </div>
          </div>

          <!-- Permissions Checklist Grid -->
          <div class="border border-border rounded-2xl p-3 bg-muted/10 max-h-64 overflow-y-auto space-y-2">
            <div v-if="isLoadingPermissions && permissionsList.length === 0" class="p-8 text-center text-muted-foreground text-xs flex flex-col items-center justify-center gap-2">
              <Loader2 class="w-5 h-5 animate-spin text-primary" />
              <span>Loading permission catalog...</span>
            </div>

            <div v-else-if="filteredPermissions.length === 0" class="p-8 text-center text-muted-foreground text-xs">
              No permissions found matching "{{ searchQuery }}".
            </div>

            <template v-else>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <label 
                  v-for="perm in filteredPermissions" 
                  :key="perm.id"
                  :class="[
                    'flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer select-none',
                    isPermissionSelected(perm.id) 
                      ? 'bg-primary/5 border-primary/40 text-foreground' 
                      : 'bg-card border-border/60 hover:border-border text-muted-foreground hover:text-foreground'
                  ]"
                >
                  <input 
                    type="checkbox" 
                    :checked="isPermissionSelected(perm.id)"
                    @change="togglePermission(perm.id)"
                    class="mt-0.5 rounded border-border text-primary focus:ring-primary/20"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-bold leading-tight truncate text-foreground">{{ perm.name }}</p>
                    <p class="text-[10px] font-mono text-muted-foreground truncate mt-0.5">{{ perm.codename }}</p>
                  </div>
                </label>
              </div>

              <!-- Reusable Infinite Scroll Sentinel Component -->
              <UiInfiniteScroll 
                :has-more="hasMore" 
                :is-loading="isFetchingNextPage" 
                :error="paginationError" 
                @load-more="loadNextPage"
                @retry="loadNextPage"
              />
            </template>
          </div>

        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0 bg-muted/20">
        <UiButton 
          type="button" 
          variant="outline" 
          class="rounded-xl h-10 px-5 text-xs font-bold"
          @click="emit('close')"
          :disabled="roleService.isSubmitting.value"
        >
          Cancel
        </UiButton>

        <UiButton 
          type="button" 
          class="rounded-xl h-10 px-6 text-xs font-bold gap-2"
          @click="handleSubmit"
          :disabled="roleService.isSubmitting.value"
        >
          <Loader2 v-if="roleService.isSubmitting.value" class="w-4 h-4 animate-spin" />
          <span>{{ isEdit ? 'Save Changes' : 'Create Role' }}</span>
        </UiButton>
      </div>

  </UiAdminModal>
</template>
