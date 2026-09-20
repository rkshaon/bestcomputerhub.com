<!-- File: /pages/admin/placements/index.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  Loader2
} from 'lucide-vue-next';
import { refDebounced } from '@vueuse/core';
import { useBannerService } from '@/composables/useBannerService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useAdminModalState } from '@/composables/useAdminModalState';
import { toastSuccess, toastError, extractErrorMessage } from '@/composables/useToast';
import type { BannerPlacement } from '@/types';
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
const placementsList = ref<BannerPlacement[]>([]);
const totalCount = ref(0);
const totalPages = ref(1);
const isLoading = ref(false);
const fetchError = ref<string | null>(null);
const isDeleting = ref(false);

// Query & Filter Parameters initialized from URL
const searchQuery = ref(route.query.search ? String(route.query.search) : '');
const debouncedSearchQuery = refDebounced(searchQuery, 300);
const statusFilter = ref<'all' | 'active' | 'inactive'>((route.query.status as 'all' | 'active' | 'inactive') || 'all');
const currentPage = ref(route.query.page ? parseInt(String(route.query.page)) || 1 : 1);
const itemsPerPage = ref(route.query.pageSize ? parseInt(String(route.query.pageSize)) || 10 : 10);

// URL-Driven Modal State Manager
const modalState = useAdminModalState<BannerPlacement>({
  getItems: async (id) => {
    return await bannerService.getPlacement(id);
  },
  onResolveError: (id) => {
    toastError(`Placement #${id} could not be retrieved.`);
    modalState.closeModal({ replace: true });
  }
});

const selectedPlacement = computed(() => modalState.activeEntity.value);

// Form & Input State
const isSubmitting = ref(false);
const formError = ref<string | null>(null);
const fieldErrors = ref<Record<string, string>>({});

const formPayload = ref({
  id: '',
  name: '',
  code: '',
  description: '',
  is_active: true
});

const nameInputRef = ref<HTMLInputElement | null>(null);

// Reset / Bind form on modal state transitions
watch(() => modalState.activeEntity.value, (newPlacement) => {
  if (newPlacement && modalState.isEdit.value) {
    formPayload.value = {
      id: String(newPlacement.id),
      name: newPlacement.name || '',
      code: newPlacement.code || '',
      description: newPlacement.description || '',
      is_active: newPlacement.is_active !== false
    };
    formError.value = null;
    fieldErrors.value = {};
  }
}, { immediate: true });

watch(() => modalState.isCreate.value, (isCr) => {
  if (isCr) {
    formPayload.value = {
      id: '',
      name: '',
      code: '',
      description: '',
      is_active: true
    };
    formError.value = null;
    fieldErrors.value = {};
    
    nextTick(() => {
      nameInputRef.value?.focus();
    });
  }
});

// Auto-focus on edit
watch(() => modalState.isEdit.value, (isEd) => {
  if (isEd) {
    nextTick(() => {
      nameInputRef.value?.focus();
    });
  }
});

// Sync Query Filters with URL route
const updateRouteQuery = () => {
  const query: Record<string, any> = {};
  if (searchQuery.value) query.search = searchQuery.value;
  if (statusFilter.value !== 'all') query.status = statusFilter.value;
  if (currentPage.value !== 1) query.page = currentPage.value;
  if (itemsPerPage.value !== 10) query.pageSize = itemsPerPage.value;
  
  router.replace({ query });
};

// Fetch placements with criteria
const fetchPlacements = async () => {
  if (!canView.value) return;
  isLoading.value = true;
  fetchError.value = null;
  
  try {
    const activeParam = statusFilter.value === 'active' ? 'true' : statusFilter.value === 'inactive' ? 'false' : undefined;
    const res = await bannerService.getPlacementsList({
      page: currentPage.value,
      page_size: itemsPerPage.value,
      is_active: activeParam,
      search: debouncedSearchQuery.value
    });
    placementsList.value = res.results;
    totalCount.value = res.count;
    totalPages.value = res.pages;
  } catch (err) {
    fetchError.value = extractErrorMessage(err, 'Failed to retrieve banner placements.');
  } finally {
    isLoading.value = false;
  }
};

// Reset page when search changes
watch(searchQuery, () => {
  currentPage.value = 1;
});

// Watch trigger triggers
watch([debouncedSearchQuery, statusFilter, currentPage, itemsPerPage], () => {
  updateRouteQuery();
  fetchPlacements();
});

// Table columns
const tableColumns = computed<UiTableColumn<BannerPlacement>[]>(() => [
  { key: 'id', label: 'ID', width: '80px', align: 'center' },
  { key: 'code', label: 'Placement Code', width: '200px' },
  { key: 'name', label: 'Placement Name', width: '220px' },
  { key: 'description', label: 'Description', minWidth: '250px' },
  { key: 'status', label: 'Status', width: '120px', align: 'center' },
  { key: 'actions', label: 'Actions', width: '110px', align: 'right' }
]);

// Handlers for submission & deletion
const handleFormSubmit = async () => {
  if (isSubmitting.value) return;
  
  fieldErrors.value = {};
  formError.value = null;
  
  const nameTrim = formPayload.value.name.trim();
  const codeTrim = formPayload.value.code.trim();
  
  if (!nameTrim) {
    fieldErrors.value.name = 'Placement Name is required.';
  }
  if (!codeTrim) {
    fieldErrors.value.code = 'Placement Code is required.';
  } else if (!/^[a-z0-9_-]+$/i.test(codeTrim)) {
    fieldErrors.value.code = 'Placement Code must contain only letters, numbers, hyphens or underscores.';
  }
  
  if (Object.keys(fieldErrors.value).length > 0) {
    formError.value = 'Please resolve validation errors before saving.';
    return;
  }
  
  isSubmitting.value = true;
  try {
    const payload: Partial<BannerPlacement> = {
      name: nameTrim,
      code: codeTrim.toLowerCase(),
      description: formPayload.value.description.trim(),
      is_active: formPayload.value.is_active
    };
    
    if (modalState.isCreate.value) {
      await bannerService.createPlacement(payload);
      toastSuccess('Banner Placement created successfully.');
    } else {
      await bannerService.updatePlacement(formPayload.value.id, payload);
      toastSuccess('Banner Placement updated successfully.');
    }
    
    modalState.closeModal();
    await fetchPlacements();
  } catch (err: any) {
    formError.value = extractErrorMessage(err, 'Failed to save banner placement.');
    if (err.response?._data) {
      const data = err.response._data;
      if (typeof data === 'object') {
        for (const [key, val] of Object.entries(data)) {
          if (Array.isArray(val) && val.length > 0) {
            fieldErrors.value[key] = String(val[0]);
          } else if (typeof val === 'string') {
            fieldErrors.value[key] = val;
          }
        }
      }
    }
  } finally {
    isSubmitting.value = false;
  }
};

const handleConfirmDelete = async () => {
  const id = modalState.activeId.value;
  if (!id || isDeleting.value) return;
  
  isDeleting.value = true;
  try {
    await bannerService.deletePlacement(id);
    toastSuccess('Banner Placement deleted successfully.');
    modalState.closeModal();
    await fetchPlacements();
  } catch (err) {
    toastError(extractErrorMessage(err, 'Failed to delete banner placement. Confirm that no active banners rely on this placement before deletion.'));
  } finally {
    isDeleting.value = false;
  }
};

const activePlacementsCount = computed(() => {
  return placementsList.value.filter(p => p.is_active).length;
});

onMounted(async () => {
  if (canView.value) {
    await fetchPlacements();
  }
});
</script>

<template>
  <NuxtLayout name="admin">
    <template #header-title>
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground/40 font-light select-none">/</span>
        <NuxtLink to="/admin/banners/" class="text-muted-foreground hover:text-foreground">Banner Management</NuxtLink>
        <span class="text-muted-foreground/40 font-light select-none">/</span>
        <h1 class="text-xl font-display font-extrabold tracking-tight text-foreground">
          Placements
        </h1>
      </div>
    </template>

    <template #header-actions>
      <div class="flex flex-wrap items-center gap-2">
        <UiButton 
          variant="outline" 
          class="rounded-xl h-9 px-3.5 gap-1.5 border-border font-bold text-xs"
          to="/admin/banners/"
        >
          <ArrowLeft class="w-3.5 h-3.5" />
          <span>Back to Banners</span>
        </UiButton>

        <UiButton 
          variant="outline" 
          class="rounded-xl h-9 px-3.5 gap-1.5 border-border font-bold text-xs"
          @click="fetchPlacements"
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
          <span>Add Placement</span>
        </UiButton>
      </div>
    </template>

    <!-- Permission Guard for Unprivileged Users -->
    <div v-if="!canView" class="p-8 text-center bg-card border border-border rounded-2xl shadow-xs">
      <AlertCircle class="w-12 h-12 text-destructive mx-auto mb-3" />
      <h2 class="text-lg font-bold text-foreground mb-1">Access Restricted</h2>
      <p class="text-sm text-muted-foreground">You do not have permission to view the Placement Management module.</p>
    </div>

    <div v-else class="space-y-4 animate-in fade-in duration-500">
      
      <!-- Summary Analytics Row -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <UiCard class="flex items-center gap-3.5 p-3.5">
          <div class="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-inner">
            <Layers class="w-5 h-5" />
          </div>
          <div>
            <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Total Placements</p>
            <p class="text-2xl font-display font-extrabold tracking-tight text-foreground leading-tight">{{ totalCount }}</p>
          </div>
        </UiCard>

        <UiCard class="flex items-center gap-3.5 p-3.5">
          <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
            <CheckCircle2 class="w-5 h-5" />
          </div>
          <div>
            <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Active Placements</p>
            <p class="text-2xl font-display font-extrabold tracking-tight text-foreground leading-tight">{{ activePlacementsCount }}</p>
          </div>
        </UiCard>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border px-3.5 py-2.5 rounded-xl shadow-xs">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
          <!-- Search Box -->
          <UiSearchInput 
            v-model="searchQuery" 
            placeholder="Search placement code, name, description..." 
            class="w-full sm:w-96"
          />

          <!-- Active Status Filter -->
          <div class="flex items-center gap-2">
            <label class="text-xs font-semibold text-muted-foreground shrink-0 hidden md:inline">Status:</label>
            <select
              v-model="statusFilter"
              class="h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer w-full sm:w-44"
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
        <UiButton variant="outline" size="sm" class="h-8 text-xs border-destructive/30 hover:bg-destructive/10" @click="fetchPlacements">
          Retry
        </UiButton>
      </div>

      <!-- Main Data Table -->
      <div class="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <UiTable
          :columns="tableColumns"
          :data="placementsList"
          :loading="isLoading"
          key-field="id"
          empty-text="No banner placements found"
          empty-description="Adjust your search criteria or create a new placement."
        >
          <!-- Custom Column: Code -->
          <template #cell-code="{ item }">
            <span class="font-mono text-xs font-bold text-foreground">
              {{ item.code }}
            </span>
          </template>

          <!-- Custom Column: Name -->
          <template #cell-name="{ item }">
            <span class="text-xs font-semibold text-foreground">
              {{ item.name }}
            </span>
          </template>

          <!-- Custom Column: Description -->
          <template #cell-description="{ item }">
            <p class="text-xs text-muted-foreground line-clamp-2 max-w-md py-1">
              {{ item.description || 'No description provided.' }}
            </p>
          </template>

          <!-- Custom Column: Status -->
          <template #cell-status="{ item }">
            <div class="flex items-center justify-center">
              <span 
                :class="[
                  'inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                  item.is_active 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40' 
                    : 'bg-muted text-muted-foreground border border-border'
                ]"
              >
                <Check v-if="item.is_active" class="w-3 h-3" />
                <X v-else class="w-3 h-3" />
                <span>{{ item.is_active ? 'Active' : 'Inactive' }}</span>
              </span>
            </div>
          </template>

          <!-- Custom Column: Actions -->
          <template #cell-actions="{ item }">
            <div class="flex items-center justify-end gap-1.5">
              <UiButton
                v-if="canEdit"
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                title="Edit Placement"
                @click="modalState.openEdit(item.id)"
              >
                <Edit2 class="w-3.5 h-3.5" />
              </UiButton>

              <UiButton
                v-if="canDelete"
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-lg"
                title="Delete Placement"
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
            item-label="placements"
          />
        </div>
      </div>
    </div>

    <!-- Create & Edit Placement Modal -->
    <UiAdminModal
      :is-open="modalState.isCreate.value || modalState.isEdit.value"
      :title="modalState.isCreate.value ? 'Add New Placement' : 'Edit Placement'"
      :subtitle="modalState.isCreate.value ? 'Create a new banner placement location for mapping storefront assets.' : 'Update code, name, description, or status details for this placement.'"
      max-width="max-w-xl"
      @close="modalState.closeModal()"
    >
      <form @submit.prevent="handleFormSubmit" class="space-y-4 py-1">
        <!-- Error Banner -->
        <div v-if="formError" class="p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive text-xs font-medium animate-shake">
          <AlertCircle class="w-4.5 h-4.5 shrink-0" />
          <span>{{ formError }}</span>
        </div>

        <div class="grid grid-cols-1 gap-4">
          <!-- Name Field -->
          <div class="space-y-1.5">
            <label for="placement-name" class="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Placement Name <span class="text-destructive">*</span>
            </label>
            <input
              id="placement-name"
              ref="nameInputRef"
              v-model="formPayload.name"
              type="text"
              placeholder="e.g., Homepage Hero Slider"
              class="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
              required
            />
            <p v-if="fieldErrors.name" class="text-[11px] text-destructive font-medium pl-0.5">
              {{ fieldErrors.name }}
            </p>
          </div>

          <!-- Code Field (slug) -->
          <div class="space-y-1.5">
            <label for="placement-code" class="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Placement Code <span class="text-destructive">*</span>
            </label>
            <input
              id="placement-code"
              v-model="formPayload.code"
              type="text"
              placeholder="e.g., homepage_hero"
              class="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all uppercase"
              required
            />
            <p class="text-[10px] text-muted-foreground pl-0.5">
              Unique programmatic identifier used by developers to query active banners in specific zones. Matches alphanumeric characters, underscores, and hyphens.
            </p>
            <p v-if="fieldErrors.code" class="text-[11px] text-destructive font-medium pl-0.5">
              {{ fieldErrors.code }}
            </p>
          </div>

          <!-- Description Field -->
          <div class="space-y-1.5">
            <label for="placement-desc" class="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Description
            </label>
            <textarea
              id="placement-desc"
              v-model="formPayload.description"
              rows="3"
              placeholder="Provide a detailed description of where this placement is located on the storefront..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all resize-none"
            ></textarea>
            <p v-if="fieldErrors.description" class="text-[11px] text-destructive font-medium pl-0.5">
              {{ fieldErrors.description }}
            </p>
          </div>

          <!-- Status Toggle -->
          <div class="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
            <div class="space-y-0.5">
              <span class="text-xs font-bold uppercase tracking-wider text-foreground">Is Active</span>
              <p class="text-[10px] text-muted-foreground">Enable or disable this entire placement zone across the storefront.</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer select-none">
              <input 
                type="checkbox" 
                v-model="formPayload.is_active" 
                class="sr-only peer"
              />
              <div class="w-10 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        <!-- Form Actions Footer -->
        <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-border mt-5">
          <UiButton
            type="button"
            variant="outline"
            class="rounded-xl h-10 px-4 text-xs font-bold border-border"
            @click="modalState.closeModal()"
            :disabled="isSubmitting"
          >
            Cancel
          </UiButton>
          <UiButton
            type="submit"
            class="rounded-xl h-10 px-5 text-xs font-bold bg-primary text-primary-foreground shadow-md shadow-primary/10 gap-1.5"
            :disabled="isSubmitting"
          >
            <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
            <span v-else>{{ modalState.isCreate.value ? 'Create Placement' : 'Save Changes' }}</span>
          </UiButton>
        </div>
      </form>
    </UiAdminModal>

    <!-- Delete Confirmation Modal -->
    <UiAdminModal
      :is-open="modalState.isDelete.value"
      title="Delete Placement"
      subtitle="Verify details carefully before proceeding."
      max-width="max-w-md"
      @close="modalState.closeModal()"
    >
      <div class="space-y-4 py-1">
        <div class="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive flex gap-3">
          <AlertCircle class="w-5 h-5 shrink-0 mt-0.5" />
          <div class="text-xs leading-relaxed">
            <p class="font-bold mb-1">Warning: Irreversible Operation</p>
            <p>Deleting a placement zone is permanent. Before completing deletion, you must ensure that no active banners are assigned to this placement, or they will fail to render on the storefront.</p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
          <UiButton
            type="button"
            variant="outline"
            class="rounded-xl h-10 px-4 text-xs font-bold border-border"
            @click="modalState.closeModal()"
            :disabled="isDeleting"
          >
            Cancel
          </UiButton>
          <UiButton
            type="button"
            variant="outline"
            class="rounded-xl h-10 px-5 text-xs font-bold bg-destructive border-destructive text-destructive-foreground hover:bg-destructive/95 hover:border-destructive/95 shadow-md shadow-destructive/10 gap-1.5"
            @click="handleConfirmDelete"
            :disabled="isDeleting"
          >
            <Loader2 v-if="isDeleting" class="w-3.5 h-3.5 animate-spin" />
            <span v-else>Confirm Delete</span>
          </UiButton>
        </div>
      </div>
    </UiAdminModal>
  </NuxtLayout>
</template>
