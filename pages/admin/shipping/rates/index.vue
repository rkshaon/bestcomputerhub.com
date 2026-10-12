<!-- File: /pages/admin/shipping/rates/index.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { 
  Coins, 
  Plus, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  Edit2, 
  Trash2, 
  Loader2,
  Globe,
  Truck
} from 'lucide-vue-next';
import { refDebounced } from '@vueuse/core';
import { useShippingService } from '@/composables/useShippingService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useAdminModalState } from '@/composables/useAdminModalState';
import { useToast } from '@/composables/useToast';
import { cn, decodeHtmlEntities } from '@/utils';
import type { ShippingRate, CreateShippingRatePayload, ShippingZone, ShippingMethod } from '@/types';
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
const ratesList = ref<ShippingRate[]>([]);
const zonesList = ref<ShippingZone[]>([]);
const methodsList = ref<ShippingMethod[]>([]);

const modalState = useAdminModalState<ShippingRate>({
  getItems: async (id) => {
    return await shippingService.getShippingRate(id);
  },
  onResolveError: (id) => {
    toastError(`Shipping rate #${id} could not be retrieved.`);
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
const formPayload = ref<CreateShippingRatePayload>({
  zone: '',
  method: '',
  base_charge: '0.00',
  free_shipping_threshold: null,
  is_active: true
});
const formError = ref<string | null>(null);
const isSubmitting = ref(false);

// Delete state
const rateToDelete = ref<ShippingRate | null>(null);
const isDeleting = ref(false);

const searchQuery = ref(route.query.search ? String(route.query.search) : '');
const debouncedSearchQuery = refDebounced(searchQuery, 300);

const statusFilter = ref<'all' | 'active' | 'inactive'>(
  (route.query.status as 'all' | 'active' | 'inactive') ||
  (route.query.is_active === 'true' ? 'active' : route.query.is_active === 'false' ? 'inactive' : 'all')
);

const zoneFilter = ref<string | number>(route.query.zone ? String(route.query.zone) : '');
const methodFilter = ref<string | number>(route.query.method ? String(route.query.method) : '');

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

const canView = computed(() => hasPermission('shipping_api.view_shippingrate') || canViewModule('/admin/shipping/rates'));
const canCreate = computed(() => hasPermission('shipping_api.add_shippingrate') || canCreateInModule('/admin/shipping/rates'));
const canEdit = computed(() => hasPermission('shipping_api.change_shippingrate') || canEditInModule('/admin/shipping/rates'));
const canDelete = computed(() => hasPermission('shipping_api.delete_shippingrate') || canDeleteInModule('/admin/shipping/rates'));

const fetchDropdownOptions = async () => {
  try {
    const [zonesRes, methodsRes] = await Promise.all([
      shippingService.getShippingZones({ page_size: 1000 }),
      shippingService.getShippingMethods({ page_size: 1000 })
    ]);
    zonesList.value = zonesRes.results || [];
    methodsList.value = methodsRes.results || [];
  } catch (err) {
    console.error('Failed to load zones or methods for selectors:', err);
  }
};

const fetchRates = async () => {
  if (!canView.value) {
    errorMsg.value = 'Access denied. You do not have permission to view shipping rates.';
    ratesList.value = [];
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

    const res = await shippingService.getShippingRates({
      page: currentPage.value,
      page_size: itemsPerPage.value,
      search: debouncedSearchQuery.value,
      zone: zoneFilter.value !== '' ? zoneFilter.value : undefined,
      method: methodFilter.value !== '' ? methodFilter.value : undefined,
      is_active: isActiveParam
    });

    ratesList.value = res.results || [];
    totalCount.value = res.count || 0;
  } catch (err: any) {
    errorMsg.value = shippingService.errorMsg.value || 'Failed to fetch shipping rates.';
    ratesList.value = [];
    totalCount.value = 0;
  } finally {
    isLoading.value = false;
  }
};

// Watchers for refetching
watch([debouncedSearchQuery, statusFilter, zoneFilter, methodFilter, currentPage, itemsPerPage], () => {
  fetchRates();
  const query: Record<string, any> = { ...route.query };
  if (debouncedSearchQuery.value) query.search = debouncedSearchQuery.value;
  else delete query.search;

  if (statusFilter.value !== 'all') query.status = statusFilter.value;
  else delete query.status;

  if (zoneFilter.value !== '') query.zone = zoneFilter.value;
  else delete query.zone;

  if (methodFilter.value !== '') query.method = methodFilter.value;
  else delete query.method;

  if (currentPage.value > 1) query.page = currentPage.value;
  else delete query.page;

  if (itemsPerPage.value !== 10) query.pageSize = itemsPerPage.value;
  else delete query.pageSize;

  router.replace({ query });
});

onMounted(() => {
  fetchDropdownOptions();
  fetchRates();
});

// Watch active entity for edit modal
watch(() => modalState.activeEntity.value, (entity) => {
  if (entity && modalState.isEdit.value) {
    formPayload.value = {
      zone: entity.zone || '',
      method: entity.method || '',
      base_charge: entity.base_charge ?? '0.00',
      free_shipping_threshold: entity.free_shipping_threshold !== undefined ? entity.free_shipping_threshold : null,
      is_active: entity.is_active !== false
    };
    formError.value = null;
  }
}, { immediate: true });

watch(() => modalState.isCreate.value, (isCr) => {
  if (isCr) {
    formPayload.value = {
      zone: zonesList.value[0]?.id || '',
      method: methodsList.value[0]?.id || '',
      base_charge: '0.00',
      free_shipping_threshold: null,
      is_active: true
    };
    formError.value = null;
  }
});

const handleSaveRate = async () => {
  if (!formPayload.value.zone) {
    formError.value = 'Shipping zone is required.';
    return;
  }
  if (!formPayload.value.method) {
    formError.value = 'Shipping method is required.';
    return;
  }
  if (formPayload.value.base_charge === undefined || formPayload.value.base_charge === '') {
    formError.value = 'Base charge is required.';
    return;
  }

  if (isSubmitting.value) return;

  isSubmitting.value = true;
  formError.value = null;

  try {
    const payload: CreateShippingRatePayload = {
      zone: Number(formPayload.value.zone),
      method: Number(formPayload.value.method),
      base_charge: formPayload.value.base_charge,
      free_shipping_threshold: formPayload.value.free_shipping_threshold !== '' && formPayload.value.free_shipping_threshold !== null 
        ? formPayload.value.free_shipping_threshold 
        : null,
      is_active: formPayload.value.is_active ?? true
    };

    if (modalState.isEdit.value && modalState.activeEntity.value) {
      const id = modalState.activeEntity.value.id;
      await shippingService.updateShippingRate(id, payload, true);
      toastSuccess('Shipping rate updated successfully.');
    } else {
      await shippingService.createShippingRate(payload);
      toastSuccess('Shipping rate created successfully.');
    }

    modalState.closeModal();
    await fetchRates();
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to save shipping rate.');
    formError.value = msg;
    handleApiError(err, 'Failed to save shipping rate.');
  } finally {
    isSubmitting.value = false;
  }
};

const confirmDelete = (rate: ShippingRate) => {
  rateToDelete.value = rate;
};

const handleDeleteRate = async () => {
  if (!rateToDelete.value) return;
  const id = rateToDelete.value.id;

  if (isDeleting.value) return;
  isDeleting.value = true;

  try {
    await shippingService.deleteShippingRate(id);
    toastSuccess('Shipping rate deleted successfully.');
    rateToDelete.value = null;
    await fetchRates();
  } catch (err: any) {
    handleApiError(err, 'Failed to delete shipping rate.');
  } finally {
    isDeleting.value = false;
  }
};

const getZoneName = (zoneId: number | string): string => {
  const found = zonesList.value.find(z => String(z.id) === String(zoneId));
  return found?.name || `Zone #${zoneId}`;
};

const getMethodName = (methodId: number | string): string => {
  const found = methodsList.value.find(m => String(m.id) === String(methodId));
  return found?.name || `Method #${methodId}`;
};

const tableColumns: UiTableColumn[] = [
  { key: 'zone', label: 'Shipping Zone' },
  { key: 'method', label: 'Shipping Method' },
  { key: 'base_charge', label: 'Base Charge' },
  { key: 'free_shipping_threshold', label: 'Free Shipping Threshold' },
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
            <Coins class="w-7 h-7 text-primary" />
            Shipping Rates
          </h1>
          <p class="text-sm text-muted-foreground mt-1">
            Configure pricing rates and thresholds for shipping zones and methods.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <UiButton variant="outline" size="sm" @click="fetchRates" :disabled="isLoading">
            <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': isLoading }" />
            Refresh
          </UiButton>
          <UiButton v-if="canCreate" variant="primary" size="sm" @click="modalState.openCreate()">
            <Plus class="w-4 h-4 mr-2" />
            Add Shipping Rate
          </UiButton>
        </div>
      </div>

      <!-- Filters & Search bar -->
      <UiCard class="p-3.5">
        <div class="flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div class="w-full lg:w-72">
            <UiSearchInput 
              v-model="searchQuery" 
              placeholder="Search shipping rates..." 
            />
          </div>
          <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
            <!-- Zone Filter -->
            <select 
              v-model="zoneFilter" 
              class="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All Zones</option>
              <option v-for="z in zonesList" :key="z.id" :value="z.id">{{ z.name }}</option>
            </select>

            <!-- Method Filter -->
            <select 
              v-model="methodFilter" 
              class="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All Methods</option>
              <option v-for="m in methodsList" :key="m.id" :value="m.id">{{ m.name }}</option>
            </select>

            <!-- Status Filter -->
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
          :data="ratesList" 
          :loading="isLoading"
          empty-text="No shipping rates found."
        >
          <!-- Zone Cell -->
          <template #cell(zone)="{ item }">
            <div class="flex items-center gap-2">
              <Globe class="w-4 h-4 text-muted-foreground shrink-0" />
              <span class="font-semibold text-foreground">{{ item.zone_name || getZoneName(item.zone) }}</span>
            </div>
          </template>

          <!-- Method Cell -->
          <template #cell(method)="{ item }">
            <div class="flex items-center gap-2">
              <Truck class="w-4 h-4 text-muted-foreground shrink-0" />
              <span class="font-medium text-foreground">{{ item.method_name || getMethodName(item.method) }}</span>
            </div>
          </template>

          <!-- Base Charge Cell -->
          <template #cell(base_charge)="{ item }">
            <span class="font-mono font-medium text-foreground">${{ Number(item.base_charge).toFixed(2) }}</span>
          </template>

          <!-- Free Shipping Threshold Cell -->
          <template #cell(free_shipping_threshold)="{ item }">
            <span v-if="item.free_shipping_threshold !== null && item.free_shipping_threshold !== undefined && item.free_shipping_threshold !== ''" class="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
              ${{ Number(item.free_shipping_threshold).toFixed(2) }}
            </span>
            <span v-else class="text-xs text-muted-foreground">—</span>
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
                @click="modalState.openEdit(item.id)" 
                class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Edit Rate"
                aria-label="Edit Rate"
              >
                <Edit2 class="w-4 h-4" />
              </button>
              <button 
                v-if="canDelete"
                @click="confirmDelete(item)" 
                class="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Delete Rate"
                aria-label="Delete Rate"
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
              item-label="shipping rates"
              prefix-label="Showing"
              variant="footer"
            />
          </template>
        </UiTable>
      </UiCard>

      <!-- Create / Edit Modal -->
      <UiAdminModal 
        :isOpen="modalState.isCreate.value || modalState.isEdit.value"
        :title="modalState.isEdit.value ? 'Edit Shipping Rate' : 'Add Shipping Rate'"
        @close="modalState.closeModal()"
      >
        <form @submit.prevent="handleSaveRate">
          <div class="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
            <div v-if="formError" class="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle class="w-4 h-4 shrink-0" />
              <span>{{ formError }}</span>
            </div>

            <div>
              <label class="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Shipping Zone <span class="text-destructive">*</span>
              </label>
              <select 
                v-model="formPayload.zone"
                required
                class="w-full h-10 rounded-xl border border-input bg-background px-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="" disabled>Select shipping zone...</option>
                <option v-for="z in zonesList" :key="z.id" :value="z.id">{{ z.name }}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Shipping Method <span class="text-destructive">*</span>
              </label>
              <select 
                v-model="formPayload.method"
                required
                class="w-full h-10 rounded-xl border border-input bg-background px-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="" disabled>Select shipping method...</option>
                <option v-for="m in methodsList" :key="m.id" :value="m.id">{{ m.name }}</option>
              </select>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                  Base Charge ($) <span class="text-destructive">*</span>
                </label>
                <input 
                  v-model="formPayload.base_charge"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  class="w-full h-10 rounded-xl border border-input bg-background px-3.5 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                  Free Shipping Threshold ($)
                </label>
                <input 
                  v-model="formPayload.free_shipping_threshold"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Optional (e.g. 100.00)"
                  class="w-full h-10 rounded-xl border border-input bg-background px-3.5 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div class="pt-2">
              <label class="flex items-center gap-2 cursor-pointer">
                <input 
                  v-model="formPayload.is_active"
                  type="checkbox"
                  class="rounded border-input text-primary focus:ring-ring w-4 h-4"
                />
                <span class="text-sm font-medium text-foreground">Active Rate</span>
              </label>
            </div>
          </div>

          <div class="p-6 border-t border-border bg-muted/20 flex items-center justify-end gap-3">
            <UiButton type="button" variant="outline" size="sm" class="rounded-xl h-10 px-5 text-xs font-bold" @click="modalState.closeModal()" :disabled="isSubmitting">
              Cancel
            </UiButton>
            <UiButton type="submit" variant="primary" size="sm" class="rounded-xl h-10 px-6 text-xs font-bold" :disabled="isSubmitting">
              <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
              {{ modalState.isEdit.value ? 'Save Changes' : 'Create Rate' }}
            </UiButton>
          </div>
        </form>
      </UiAdminModal>

      <!-- Delete Confirmation Modal -->
      <UiAdminModal 
        :isOpen="!!rateToDelete"
        title="Delete Shipping Rate"
        @close="rateToDelete = null"
        maxWidth="max-w-md"
      >
        <div class="p-6 space-y-6">
          <div class="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3">
            <AlertCircle class="w-5 h-5 shrink-0" />
            <span>Are you sure you want to delete this shipping rate for <strong>{{ getZoneName(rateToDelete?.zone || '') }}</strong> / <strong>{{ getMethodName(rateToDelete?.method || '') }}</strong>? This action cannot be undone.</span>
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            <UiButton variant="outline" size="sm" class="rounded-xl h-10 px-5 text-xs font-bold" @click="rateToDelete = null" :disabled="isDeleting">
              Cancel
            </UiButton>
            <UiButton variant="destructive" size="sm" class="rounded-xl h-10 px-6 text-xs font-bold" @click="handleDeleteRate" :disabled="isDeleting">
              <Loader2 v-if="isDeleting" class="w-4 h-4 mr-2 animate-spin" />
              Delete Rate
            </UiButton>
          </div>
        </div>
      </UiAdminModal>
    </div>
  </NuxtLayout>
</template>
