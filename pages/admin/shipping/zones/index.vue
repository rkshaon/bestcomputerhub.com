<!-- File: /pages/admin/shipping/zones/index.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { 
  Globe, 
  Plus, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  Edit2, 
  Trash2, 
  Loader2,
  CheckCircle2 
} from 'lucide-vue-next';
import { refDebounced } from '@vueuse/core';
import { useShippingService } from '@/composables/useShippingService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useAdminModalState } from '@/composables/useAdminModalState';
import { useToast } from '@/composables/useToast';
import { cn, decodeHtmlEntities } from '@/utils';
import type { ShippingZone, CreateShippingZonePayload } from '@/types';
import type { UiTableColumn } from '@/components/ui/UiTable.vue';
import UiTable from '@/components/ui/UiTable.vue';
import UiSearchInput from '@/components/ui/UiSearchInput.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiButton from '@/components/ui/Button.vue';
import UiAdminModal from '@/components/ui/UiAdminModal.vue';

definePageMeta({
  layout: false
});

const shippingService = useShippingService();
const zonesList = ref<ShippingZone[]>([]);
const modalState = useAdminModalState<ShippingZone>({
  getItems: async (id) => {
    return await shippingService.getShippingZone(id);
  },
  onResolveError: (id) => {
    toastError(`Shipping zone #${id} could not be retrieved.`);
    modalState.closeModal({ replace: true });
  }
});

const { toastSuccess, toastError, handleApiError, extractErrorMessage } = useToast();
const route = useRoute();
const router = useRouter();

// State management
const totalCount = ref<number>(0);
const totalPages = computed(() => Math.ceil(totalCount.value / itemsPerPage.value) || 1);
const isLoading = ref<boolean>(false);
const errorMsg = ref<string | null>(null);

// Form states
const formPayload = ref<CreateShippingZonePayload>({
  name: '',
  code: '',
  description: '',
  is_default: false,
  is_active: true,
  display_order: 0
});
const formError = ref<string | null>(null);
const isSubmitting = ref(false);

// Delete state
const zoneToDelete = ref<ShippingZone | null>(null);
const isDeleting = ref(false);

const searchQuery = ref(route.query.search ? String(route.query.search) : '');
const debouncedSearchQuery = refDebounced(searchQuery, 300);

const statusFilter = ref<'all' | 'active' | 'inactive'>(
  (route.query.status as 'all' | 'active' | 'inactive') ||
  (route.query.is_active === 'true' ? 'active' : route.query.is_active === 'false' ? 'inactive' : 'all')
);

const currentPage = ref(route.query.page ? parseInt(String(route.query.page)) || 1 : 1);
const itemsPerPage = ref(route.query.pageSize ? parseInt(String(route.query.pageSize)) || 10 : 10);

const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  } catch {
    return dateStr;
  }
};

const { hasPermission, canViewModule, canCreateInModule, canEditInModule, canDeleteInModule } = useAdminPermissions();

const canView = computed(() => hasPermission('shipping_api.view_shippingzone') || canViewModule('/admin/shipping/zones'));
const canCreate = computed(() => hasPermission('shipping_api.add_shippingzone') || canCreateInModule('/admin/shipping/zones'));
const canEdit = computed(() => hasPermission('shipping_api.change_shippingzone') || canEditInModule('/admin/shipping/zones'));
const canDelete = computed(() => hasPermission('shipping_api.delete_shippingzone') || canDeleteInModule('/admin/shipping/zones'));

const fetchZones = async () => {
  if (!canView.value) {
    errorMsg.value = 'Access denied. You do not have permission to view shipping zones.';
    zonesList.value = [];
    totalCount.value = 0;
    return;
  }

  isLoading.value = true;
  errorMsg.value = null;

  try {
    let isActiveParam: boolean | undefined = undefined;
    if (statusFilter.value === 'active') {
      isActiveParam = true;
    } else if (statusFilter.value === 'inactive') {
      isActiveParam = false;
    }

    const res = await shippingService.getShippingZones({
      page: currentPage.value,
      page_size: itemsPerPage.value,
      search: debouncedSearchQuery.value,
      is_active: isActiveParam
    });

    zonesList.value = res.results || [];
    totalCount.value = res.count || 0;
  } catch (err: any) {
    errorMsg.value = shippingService.errorMsg.value || 'Failed to fetch shipping zones.';
    zonesList.value = [];
    totalCount.value = 0;
  } finally {
    isLoading.value = false;
  }
};

// Watchers for refetching
watch([debouncedSearchQuery, statusFilter, currentPage, itemsPerPage], () => {
  fetchZones();
  const query: Record<string, any> = { ...route.query };
  if (debouncedSearchQuery.value) query.search = debouncedSearchQuery.value;
  else delete query.search;

  if (statusFilter.value !== 'all') query.status = statusFilter.value;
  else delete query.status;

  if (currentPage.value > 1) query.page = currentPage.value;
  else delete query.page;

  if (itemsPerPage.value !== 10) query.pageSize = itemsPerPage.value;
  else delete query.pageSize;

  router.replace({ query });
});

onMounted(() => {
  fetchZones();
});

// Watch active entity for edit modal
watch(() => modalState.activeEntity.value, (entity) => {
  if (entity && modalState.isEdit.value) {
    formPayload.value = {
      name: entity.name || '',
      code: entity.code || '',
      description: entity.description || '',
      is_default: entity.is_default || false,
      is_active: entity.is_active !== false,
      display_order: entity.display_order ?? 0
    };
    formError.value = null;
  }
}, { immediate: true });

watch(() => modalState.isCreate.value, (isCr) => {
  if (isCr) {
    formPayload.value = {
      name: '',
      code: '',
      description: '',
      is_default: false,
      is_active: true,
      display_order: 0
    };
    formError.value = null;
  }
});

const handleSaveZone = async () => {
  const trimmedName = formPayload.value.name.trim();
  const trimmedCode = formPayload.value.code.trim();

  if (!trimmedName) {
    formError.value = 'Zone name is required.';
    return;
  }
  if (!trimmedCode) {
    formError.value = 'Zone code is required.';
    return;
  }

  const codeRegex = /^[-a-zA-Z0-9_]+$/;
  if (!codeRegex.test(trimmedCode)) {
    formError.value = 'Code must contain only letters, numbers, underscores, or hyphens.';
    return;
  }

  if (isSubmitting.value) return;

  isSubmitting.value = true;
  formError.value = null;

  try {
    const payload: CreateShippingZonePayload = {
      name: trimmedName,
      code: trimmedCode,
      description: formPayload.value.description?.trim() || '',
      is_default: formPayload.value.is_default || false,
      is_active: formPayload.value.is_active ?? true,
      display_order: Number(formPayload.value.display_order) || 0
    };

    if (modalState.isEdit.value && modalState.activeEntity.value) {
      const id = modalState.activeEntity.value.id;
      await shippingService.updateShippingZone(id, payload, true);
      toastSuccess('Shipping zone updated successfully.');
    } else {
      await shippingService.createShippingZone(payload);
      toastSuccess('Shipping zone created successfully.');
    }

    modalState.closeModal();
    await fetchZones();
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to save shipping zone.');
    formError.value = msg;
    handleApiError(err, 'Failed to save shipping zone.');
  } finally {
    isSubmitting.value = false;
  }
};

const confirmDelete = (zone: ShippingZone) => {
  zoneToDelete.value = zone;
};

const handleDeleteZone = async () => {
  if (!zoneToDelete.value) return;
  const id = zoneToDelete.value.id;

  if (isDeleting.value) return;
  isDeleting.value = true;

  try {
    await shippingService.deleteShippingZone(id);
    toastSuccess('Shipping zone deleted successfully.');
    zoneToDelete.value = null;
    await fetchZones();
  } catch (err: any) {
    handleApiError(err, 'Failed to delete shipping zone.');
  } finally {
    isDeleting.value = false;
  }
};

const tableColumns: UiTableColumn[] = [
  { key: 'name', label: 'Shipping Zone Name' },
  { key: 'code', label: 'Code' },
  { key: 'is_default', label: 'Default' },
  { key: 'display_order', label: 'Order' },
  { key: 'is_active', label: 'Status' },
  { key: 'created_at', label: 'Created' },
  { key: 'actions', label: 'Actions', align: 'right' }
];
</script>

<template>
  <NuxtLayout name="admin">
    <div class="space-y-6">
      <!-- Header row -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-[26px] font-bold text-foreground tracking-tight flex items-center gap-2">
            <Globe class="w-7 h-7 text-primary" />
            Shipping Zones
          </h1>
          <p class="text-sm text-muted-foreground mt-1">
            Manage geographic delivery zones and shipping regions across the store.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <UiButton variant="outline" size="sm" @click="fetchZones" :disabled="isLoading">
            <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': isLoading }" />
            Refresh
          </UiButton>
          <UiButton v-if="canCreate" variant="primary" size="sm" @click="modalState.openCreate()">
            <Plus class="w-4 h-4 mr-2" />
            Add Shipping Zone
          </UiButton>
        </div>
      </div>

      <!-- Filters & Search bar -->
      <UiCard class="p-3.5">
        <div class="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div class="w-full md:w-80">
            <UiSearchInput 
              v-model="searchQuery" 
              placeholder="Search shipping zones..." 
            />
          </div>
          <div class="flex items-center gap-3 w-full md:w-auto justify-end">
            <select 
              v-model="statusFilter" 
              class="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </UiCard>

      <!-- Error banner if any -->
      <div v-if="errorMsg" class="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3 text-sm">
        <AlertCircle class="w-5 h-5 shrink-0" />
        <span>{{ errorMsg }}</span>
      </div>

      <!-- Table Card -->
      <UiCard class="overflow-hidden">
        <UiTable 
          :columns="tableColumns" 
          :data="zonesList" 
          :loading="isLoading"
          empty-text="No shipping zones found."
        >
          <!-- Name Cell -->
          <template #cell(name)="{ item }">
            <div>
              <span class="font-semibold text-foreground">{{ item.name }}</span>
              <p v-if="item.description" class="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {{ item.description }}
              </p>
            </div>
          </template>

          <!-- Code Cell -->
          <template #cell(code)="{ item }">
            <code class="px-2 py-0.5 bg-muted rounded text-xs font-mono text-foreground">
              {{ item.code }}
            </code>
          </template>

          <!-- Default Cell -->
          <template #cell(is_default)="{ item }">
            <span 
              v-if="item.is_default"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
            >
              <CheckCircle2 class="w-3.5 h-3.5" />
              Default
            </span>
            <span v-else class="text-xs text-muted-foreground">—</span>
          </template>

          <!-- Display Order Cell -->
          <template #cell(display_order)="{ item }">
            <span class="text-sm font-medium text-foreground">{{ item.display_order ?? 0 }}</span>
          </template>

          <!-- Status Cell -->
          <template #cell(is_active)="{ item }">
            <span 
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              :class="item.is_active !== false ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="item.is_active !== false ? 'bg-emerald-500' : 'bg-muted-foreground'"></span>
              {{ item.is_active !== false ? 'Active' : 'Inactive' }}
            </span>
          </template>

          <!-- Created Date Cell -->
          <template #cell(created_at)="{ item }">
            <span class="text-xs text-muted-foreground">{{ formatDate(item.created_at) }}</span>
          </template>

          <!-- Actions Cell -->
          <template #cell(actions)="{ item }">
            <div class="flex items-center justify-end gap-1.5">
              <button 
                v-if="canEdit"
                @click="modalState.openModal(item)" 
                class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Edit Zone"
                aria-label="Edit Zone"
              >
                <Edit2 class="w-4 h-4" />
              </button>
              <button 
                v-if="canDelete"
                @click="confirmDelete(item)" 
                class="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Delete Zone"
                aria-label="Delete Zone"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </template>

          <!-- Pagination Footer -->
          <template #footer>
            <UiPagination 
              v-model:current-page="currentPage"
              :total-pages="totalPages"
              :total-count="totalCount"
              :items-per-page="itemsPerPage"
              item-label="shipping zones"
              prefix-label="Showing"
              variant="footer"
            />
          </template>
        </UiTable>
      </UiCard>

      <!-- Create / Edit Modal -->
      <UiAdminModal 
        :isOpen="modalState.isCreate.value || modalState.isEdit.value"
        :title="modalState.isEdit.value ? 'Edit Shipping Zone' : 'Add Shipping Zone'"
        @close="modalState.closeModal()"
      >
        <form @submit.prevent="handleSaveZone">
          <div class="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
            <div v-if="formError" class="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle class="w-4 h-4 shrink-0" />
              <span>{{ formError }}</span>
            </div>

            <div>
              <label class="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Zone Name <span class="text-destructive">*</span>
              </label>
              <input 
                v-model="formPayload.name"
                type="text"
                required
                maxlength="255"
                placeholder="e.g. Domestic Standard"
                class="w-full h-10 rounded-xl border border-input bg-background px-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Zone Code <span class="text-destructive">*</span>
              </label>
              <input 
                v-model="formPayload.code"
                type="text"
                required
                maxlength="255"
                placeholder="e.g. domestic"
                class="w-full h-10 rounded-xl border border-input bg-background px-3.5 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p class="text-[11px] text-muted-foreground mt-1">
                Must be unique and contain only letters, numbers, underscores, or hyphens.
              </p>
            </div>

            <div>
              <label class="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea 
                v-model="formPayload.description"
                rows="3"
                placeholder="Geographic coverage or region details..."
                class="w-full rounded-xl border border-input bg-background p-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                  Display Order
                </label>
                <input 
                  v-model.number="formPayload.display_order"
                  type="number"
                  min="0"
                  class="w-full h-10 rounded-xl border border-input bg-background px-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div class="flex flex-col justify-center gap-2 pt-4">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input 
                    v-model="formPayload.is_active"
                    type="checkbox"
                    class="rounded border-input text-primary focus:ring-ring w-4 h-4"
                  />
                  <span class="text-sm font-medium text-foreground">Active Zone</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input 
                    v-model="formPayload.is_default"
                    type="checkbox"
                    class="rounded border-input text-primary focus:ring-ring w-4 h-4"
                  />
                  <span class="text-sm font-medium text-foreground">Default Zone</span>
                </label>
              </div>
            </div>
          </div>

          <div class="p-6 border-t border-border bg-muted/20 flex items-center justify-end gap-3">
            <UiButton type="button" variant="outline" size="sm" class="rounded-xl h-10 px-5 text-xs font-bold" @click="modalState.closeModal()" :disabled="isSubmitting">
              Cancel
            </UiButton>
            <UiButton type="submit" variant="primary" size="sm" class="rounded-xl h-10 px-6 text-xs font-bold" :disabled="isSubmitting">
              <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
              {{ modalState.isEdit.value ? 'Save Changes' : 'Create Zone' }}
            </UiButton>
          </div>
        </form>
      </UiAdminModal>

      <!-- Delete Confirmation Modal -->
      <UiAdminModal 
        :isOpen="!!zoneToDelete"
        title="Delete Shipping Zone"
        @close="zoneToDelete = null"
        maxWidth="max-w-md"
      >
        <div class="p-6 space-y-6">
          <div class="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3">
            <AlertCircle class="w-5 h-5 shrink-0" />
            <span>Are you sure you want to delete shipping zone <strong>{{ zoneToDelete?.name }}</strong>? This action cannot be undone.</span>
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            <UiButton variant="outline" size="sm" class="rounded-xl h-10 px-5 text-xs font-bold" @click="zoneToDelete = null" :disabled="isDeleting">
              Cancel
            </UiButton>
            <UiButton variant="destructive" size="sm" class="rounded-xl h-10 px-6 text-xs font-bold" @click="handleDeleteZone" :disabled="isDeleting">
              <Loader2 v-if="isDeleting" class="w-4 h-4 mr-2 animate-spin" />
              Delete Zone
            </UiButton>
          </div>
        </div>
      </UiAdminModal>
    </div>
  </NuxtLayout>
</template>
