<!-- File: /pages/admin/roles/index.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { refDebounced } from '@vueuse/core';
import { 
  Shield, 
  ShieldCheck, 
  Plus, 
  Search, 
  Edit, 
  Eye,
  Trash2, 
  Loader2, 
  AlertCircle, 
  Key, 
  RefreshCw,
  X
} from 'lucide-vue-next';
import { useRoleService } from '@/composables/useRoleService';
import { useAdminModalState } from '@/composables/useAdminModalState';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useToast } from '@/composables/useToast';
import UiAdminModal from '@/components/ui/UiAdminModal.vue';
import RoleFormModal from '@/components/admin/RoleFormModal.vue';
import type { Role } from '@/types';

definePageMeta({
  layout: 'admin'
});

useSeoMeta({
  title: 'Roles & Access Permissions - Admin',
  robots: 'noindex, nofollow'
});

const roleService = useRoleService();
const { canViewModule, canCreateInModule, canEditInModule, canDeleteInModule } = useAdminPermissions();
const { toastSuccess, toastError } = useToast();

const searchQuery = ref('');
const debouncedSearchQuery = refDebounced(searchQuery, 300);

watch(debouncedSearchQuery, (newVal) => {
  roleService.getRoles({ search: newVal });
});

const canViewRoles = computed(() => canViewModule('/admin/roles'));
const canCreateRole = computed(() => canCreateInModule('/admin/roles'));
const canEditRole = computed(() => canEditInModule('/admin/roles'));
const canDeleteRole = computed(() => canDeleteInModule('/admin/roles'));

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

// Delete operation submitting state
const isDeleting = ref(false);

const roles = computed(() => roleService.roles.value || []);
const isLoading = computed(() => roleService.isLoading.value);
const errorMsg = computed(() => roleService.error.value);

const loadRolesData = async () => {
  if (!canViewRoles.value) return;
  await roleService.getRoles({ search: searchQuery.value });
};

onMounted(() => {
  loadRolesData();
});

const handleSearch = () => {
  roleService.getRoles({ search: searchQuery.value });
};

const handleRoleSaved = async () => {
  await roleService.getRoles({ search: searchQuery.value });
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
    await roleService.getRoles({ search: searchQuery.value });
  } catch (err: any) {
    toastError(err.message || 'Failed to delete role.');
  } finally {
    isDeleting.value = false;
  }
};

const filteredRoles = computed(() => {
  if (!searchQuery.value.trim()) return roles.value;
  const q = searchQuery.value.toLowerCase().trim();
  return roles.value.filter(r => 
    r.name.toLowerCase().includes(q) || 
    r.permissions.some(p => p.name.toLowerCase().includes(q) || p.codename.toLowerCase().includes(q))
  );
});
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <div class="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-2">
          <ShieldCheck class="w-3.5 h-3.5" />
          Access Control Infrastructure
        </div>
        <h1 class="text-3xl font-display font-extrabold tracking-tight text-foreground">
          Roles & Permissions
        </h1>
        <p class="text-muted-foreground text-sm mt-1">
          Configure security groups, define granular authority matrix, and manage personnel access limits.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <UiButton 
          variant="outline" 
          class="rounded-2xl h-11 px-5 gap-2 border-border font-bold text-xs"
          @click="loadRolesData"
          :disabled="isLoading"
        >
          <RefreshCw :class="['w-4 h-4', isLoading && 'animate-spin']" />
          <span>Refresh</span>
        </UiButton>

        <UiButton 
          v-if="canCreateRole"
          class="rounded-2xl h-11 px-6 gap-2 shadow-xl shadow-primary/20 bg-primary text-primary-foreground font-bold text-xs"
          @click="modalState.openCreate()"
        >
          <Plus class="w-4 h-4" />
          <span>Create New Role</span>
        </UiButton>
      </div>
    </div>

    <!-- Search & Metric Bar -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border p-4 rounded-3xl shadow-sm">
      <div class="relative w-full sm:w-96">
        <Search class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input 
          v-model="searchQuery" 
          type="text"
          placeholder="Search roles by title or permission..."
          class="w-full h-11 pl-10 pr-4 rounded-2xl border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
        <button 
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="flex items-center gap-4 text-xs font-bold text-muted-foreground w-full sm:w-auto justify-between sm:justify-end">
        <div class="flex items-center gap-2">
          <Key class="w-4 h-4 text-primary" />
          <span>{{ roleService.totalCount.value }} Security Roles Defined</span>
        </div>
      </div>
    </div>

    <!-- Loading Skeleton State -->
    <div v-if="isLoading && roles.length === 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    <div v-else-if="errorMsg && roles.length === 0" class="bg-card border border-destructive/20 rounded-[2.5rem] p-12 text-center max-w-xl mx-auto shadow-sm">
      <div class="w-16 h-16 rounded-3xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
        <AlertCircle class="w-8 h-8" />
      </div>
      <h3 class="text-xl font-bold text-foreground mb-2">Unable to load security roles</h3>
      <p class="text-muted-foreground text-xs mb-6">{{ errorMsg }}</p>
      <UiButton @click="loadRolesData" class="rounded-2xl px-6 h-11 font-bold">
        Retry Connection
      </UiButton>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredRoles.length === 0" class="bg-card border border-border rounded-[2.5rem] p-12 text-center max-w-md mx-auto shadow-sm">
      <div class="w-16 h-16 rounded-3xl bg-muted text-muted-foreground flex items-center justify-center mx-auto mb-4">
        <Shield class="w-8 h-8" />
      </div>
      <h3 class="text-lg font-bold text-foreground mb-1">
        {{ searchQuery ? 'No roles matched' : 'No roles found' }}
      </h3>
      <p class="text-xs text-muted-foreground mb-6">
        {{ searchQuery ? `No role found matching "${searchQuery}".` : 'Create your first role to get started.' }}
      </p>
      <UiButton v-if="searchQuery" variant="outline" @click="searchQuery = ''; handleSearch()" class="rounded-2xl h-10 px-5 text-xs font-bold">
        Clear Filter
      </UiButton>
      <UiButton v-else @click="modalState.openCreate()" class="rounded-2xl h-10 px-5 text-xs font-bold">
        Create First Role
      </UiButton>
    </div>

    <!-- Roles Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="role in filteredRoles" 
        :key="role.id"
        class="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between group hover:border-primary/40 hover:shadow-md transition-all duration-300"
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
            <p class="text-xs text-muted-foreground mt-1 font-medium">
              System access authority token #{{ role.id }}
            </p>
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
        <div class="pt-6 mt-6 border-t border-border/60 flex items-center justify-end gap-2">
          <button 
            type="button" 
            @click="modalState.openView(role.id)"
            class="px-3.5 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted text-foreground transition-all flex items-center gap-1.5"
            title="View Role Details"
          >
            <Eye class="w-3.5 h-3.5 text-muted-foreground" />
            <span>View</span>
          </button>

          <button 
            v-if="canEditRole"
            type="button" 
            @click="modalState.openEdit(role.id)"
            class="px-3.5 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted text-foreground transition-all flex items-center gap-1.5"
          >
            <Edit class="w-3.5 h-3.5 text-muted-foreground" />
            <span>Edit</span>
          </button>

          <button 
            v-if="canDeleteRole"
            type="button" 
            @click="modalState.openDelete(role.id)"
            class="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Delete Role"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>

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
</template>
