<!-- File: /pages/admin/users/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  ShieldCheck, 
  Shield, 
  Crown, 
  Loader2, 
  AlertCircle, 
  RefreshCw,
  User as UserIcon,
  CheckCircle2
} from 'lucide-vue-next';
import { useUserService } from '@/composables/useUserService';
import { useRoleService } from '@/composables/useRoleService';
import { useInfinitePagination } from '@/composables/useInfinitePagination';
import { useAdminModalState } from '@/composables/useAdminModalState';
import { useToast } from '@/composables/useToast';
import UiInfiniteScroll from '@/components/ui/UiInfiniteScroll.vue';
import Button from '@/components/ui/Button.vue';
import UserFormModal from '@/components/admin/UserFormModal.vue';
import type { UserItem, Role } from '@/types';

definePageMeta({
  layout: 'admin'
});

useSeoMeta({
  title: 'User Accounts & Personnel Access - Admin',
  robots: 'noindex, nofollow'
});

const userService = useUserService();
const roleService = useRoleService();
const { toastSuccess, toastError } = useToast();

const searchQuery = ref('');

// Reusable URL-driven modal state infrastructure for create user dialog
const modalState = useAdminModalState<UserItem>();

// Reusable infinite pagination composable
const {
  items: userList,
  totalCount,
  isLoading,
  isFetchingNextPage,
  hasMore,
  error: paginationError,
  fetchFirstPage,
  loadNextPage,
  refresh: refreshPagination
} = useInfinitePagination<UserItem>({
  fetcher: userService.getUsers,
  search: searchQuery,
  pageSize: 12
});

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
});

const handleSearch = () => {
  fetchFirstPage();
};

const handleUserSaved = async () => {
  await refreshPagination();
};

// Helper to format display name
const getUserDisplayName = (user: UserItem): string => {
  if (user.full_name) return user.full_name;
  const parts = [user.first_name, user.middle_name, user.last_name].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  return user.username || user.email;
};

// Helper to format role names from group IDs or objects
const getUserGroupNames = (user: UserItem): string[] => {
  if (!user.groups || !Array.isArray(user.groups) || user.groups.length === 0) {
    return user.is_superuser ? ['Super Administrator'] : ['Standard User'];
  }

  return user.groups.map(g => {
    if (typeof g === 'object' && g !== null && 'name' in g) {
      return (g as any).name;
    }
    const groupId = Number(g);
    return rolesMap.value.get(groupId) || `Role #${groupId}`;
  });
};
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <div class="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-2">
          <ShieldCheck class="w-3.5 h-3.5" />
          Personnel & Access Governance
        </div>
        <h1 class="text-3xl font-display font-extrabold tracking-tight text-foreground">
          User Accounts & Access
        </h1>
        <p class="text-muted-foreground text-sm mt-1">
          Manage system personnel, assign security roles, and provision admin access scope.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <Button 
          variant="outline" 
          size="sm"
          @click="refreshPagination"
          :disabled="isLoading"
          class="gap-1.5"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading }" />
          <span>Refresh</span>
        </Button>

        <Button 
          variant="primary"
          size="md"
          @click="modalState.openModal('create')"
          class="gap-2 shadow-lg shadow-primary/20"
        >
          <UserPlus class="w-4 h-4" />
          <span>Provision User Account</span>
        </Button>
      </div>
    </div>

    <!-- Search & Filter Bar -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
      <div class="relative w-full sm:w-96">
        <Search class="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Search by name, email, or username..."
          @keyup.enter="handleSearch"
          class="w-full pl-10 pr-4 py-2 rounded-xl bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>

      <div class="text-xs font-semibold text-muted-foreground self-end sm:self-center">
        Total Accounts: <span class="text-foreground font-bold">{{ totalCount }}</span>
      </div>
    </div>

    <!-- Loading State (First Page) -->
    <div v-if="isLoading && userList.length === 0" class="py-16 text-center space-y-3">
      <Loader2 class="w-8 h-8 animate-spin text-primary mx-auto" />
      <p class="text-xs font-semibold text-muted-foreground">Retrieving user accounts catalog...</p>
    </div>

    <!-- Error Banner -->
    <div v-else-if="paginationError && userList.length === 0" class="p-6 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-center space-y-3">
      <AlertCircle class="w-8 h-8 mx-auto" />
      <p class="text-xs font-semibold">{{ paginationError }}</p>
      <Button variant="outline" size="sm" @click="fetchFirstPage" class="gap-1.5">
        <RefreshCw class="w-3.5 h-3.5" />
        <span>Try Again</span>
      </Button>
    </div>

    <!-- Empty State -->
    <div v-else-if="userList.length === 0" class="py-16 text-center border-2 border-dashed border-border rounded-3xl bg-card/50 p-8 space-y-4">
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
      <Button v-if="!searchQuery" variant="primary" size="sm" @click="modalState.openModal('create')" class="gap-2">
        <UserPlus class="w-4 h-4" />
        <span>Create User</span>
      </Button>
    </div>

    <!-- Users Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="user in userList" 
        :key="user.id"
        class="bg-card border border-border rounded-[2.5rem] p-6 shadow-sm hover:border-primary/30 transition-all duration-300 flex flex-col justify-between group"
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
                class="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-muted text-foreground border border-border"
              >
                {{ groupName }}
              </span>
            </div>
          </div>

        </div>

        <div class="mt-5 pt-3 border-t border-border/40 text-[10px] font-semibold text-muted-foreground flex items-center justify-between">
          <span>Account ID: #{{ user.id }}</span>
          <span class="text-primary font-bold">DRF Verified</span>
        </div>
      </div>
    </div>

    <!-- Infinite Scroll Pagination Control -->
    <UiInfiniteScroll 
      :has-more="hasMore"
      :is-loading="isFetchingNextPage"
      :error="paginationError"
      @load-more="loadNextPage"
      @retry="loadNextPage"
    />

    <!-- User Form Modal (Create) -->
    <UserFormModal 
      :is-open="modalState.isCreate.value"
      @close="modalState.closeModal()"
      @saved="handleUserSaved"
    />

  </div>
</template>
