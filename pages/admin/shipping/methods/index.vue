<!-- File: /pages/admin/shipping/methods/index.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { 
  Truck, 
  Plus, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  Edit2, 
  Trash2, 
  Loader2 
} from 'lucide-vue-next';
import { refDebounced } from '@vueuse/core';
import { useShippingService } from '@/composables/useShippingService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useAdminModalState } from '@/composables/useAdminModalState';
import { useToast } from '@/composables/useToast';
import { cn, decodeHtmlEntities } from '@/utils';
import type { ShippingMethod, CreateShippingMethodPayload } from '@/types';
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
const methodsList = ref<ShippingMethod[]>([]);
const modalState = useAdminModalState<ShippingMethod>({
  getItems: async (id) => {
    return await shippingService.getShippingMethod(id);
  },
  onResolveError: (id) => {
    toastError(`Shipping method #${id} could not be retrieved.`);
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
const formPayload = ref<CreateShippingMethodPayload>({
  name: '',
  code: '',
  description: '',
  is_active: true,
  display_order: 0
});
const formError = ref<string | null>(null);
const isSubmitting = ref(false);

// Delete state
const methodToDelete = ref<ShippingMethod | null>(null);
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

const canView = computed(() => hasPermission('shipping_api.view_shippingmethod') || canViewModule('/admin/shipping/methods'));
const canCreate = computed(() => hasPermission('shipping_api.add_shippingmethod') || canCreateInModule('/admin/shipping/methods'));
const canEdit = computed(() => hasPermission('shipping_api.change_shippingmethod') || canEditInModule('/admin/shipping/methods'));
const canDelete = computed(() => hasPermission('shipping_api.delete_shippingmethod') || canDeleteInModule('/admin/shipping/methods'));

const fetchMethods = async () => {
  if (!canView.value) {
    errorMsg.value = 'Access denied. You do not have permission to view shipping methods.';
    methodsList.value = [];
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

    const res = await shippingService.getShippingMethods({
      page: currentPage.value,
      page_size: itemsPerPage.value,
      search: debouncedSearchQuery.value,
      is_active: isActiveParam
    });

    methodsList.value = res.results || [];
    totalCount.value = res.count || 0;
  } catch (err: any) {
    errorMsg.value = shippingService.errorMsg.value || 'Failed to fetch shipping methods.';
    methodsList.value = [];
    totalCount.value = 0;
  } finally {
    isLoading.value = false;
  }
};

// Watchers for refetching
watch([debouncedSearchQuery, statusFilter, currentPage, itemsPerPage], () => {
  fetchMethods();
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
  fetchMethods();
});

// Watch active entity for edit modal
watch(() => modalState.activeEntity.value, (entity) => {
  if (entity && modalState.isEdit.value) {
    formPayload.value = {
      name: entity.name || '',
      code: entity.code || '',
      description: entity.description || '',
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
      is_active: true,
      display_order: 0
    };
    formError.value = null;
  }
});

const handleSaveMethod = async () => {
  const trimmedName = formPayload.value.name.trim();
  const trimmedCode = formPayload.value.code.trim();

  if (!trimmedName) {
    formError.value = 'Method name is required.';
    return;
  }
  if (!trimmedCode) {
    formError.value = 'Method code is required.';
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
    const payload: CreateShippingMethodPayload = {
      name: trimmedName,
      code: trimmedCode,
      description: formPayload.value.description?.trim() || '',
      is_active: formPayload.value.is_active ?? true,
      display_order: Number(formPayload.value.display_order) || 0
    };

    if (modalState.isEdit.value && modalState.activeEntity.value) {
      const id = modalState.activeEntity.value.id;
      await shippingService.updateShippingMethod(id, payload, true);
      toastSuccess('Shipping method updated successfully.');
    } else {
      await shippingService.createShippingMethod(payload);
      toastSuccess('Shipping method created successfully.');
    }

    modalState.closeModal();
    await fetchMethods();
  } catch (err: any) {
    const msg = extractErrorMessage(err, 'Failed to save shipping method.');
    formError.value = msg;
    handleApiError(err, 'Failed to save shipping method.');
  } finally {
    isSubmitting.value = false;
  }
};

const confirmDelete = (method: ShippingMethod) => {
  methodToDelete.value = method;
};

const handleDeleteMethod = async () => {
  if (!methodToDelete.value) return;
  const id = methodToDelete.value.id;

  if (isDeleting.value) return;
  isDeleting.value = true;

  try {
    await shippingService.deleteShippingMethod(id);
    toastSuccess('Shipping method deleted successfully.');
    methodToDelete.value = null;
    await fetchMethods();
  } catch (err: any) {
    handleApiError(err, 'Failed to delete shipping method.');
  } finally {
    isDeleting.value = false;
  }
};

const tableColumns: UiTableColumn[] = [
  { key: 'name', label: 'Shipping Method Name' },
  { key: 'code', label: 'Code' },
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
            <Truck class="w-7 h-7 text-primary" />
            Shipping Methods
          </h1>
          <p class="text-sm text-muted-foreground mt-1">
            Manage delivery carriers and shipping methods available in the store.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <UiButton variant="outline" size="sm" @click="fetchMethods" :disabled="isLoading">
            <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': isLoading }" />
            Refresh
          </UiButton>
          <UiButton v-if="canCreate" variant="primary" size="sm" @click="modalState.openCreate()">
            <Plus class="w-4 h-4 mr-2" />
            Add Shipping Method
          </UiButton>
        </div>
      </div>

      <!-- Filters & Search bar -->
      <UiCard class="p-3.5">
        <div class="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div class="w-full md:w-80">
            <UiSearchInput 
              v-model="searchQuery" 
              placeholder="Search shipping methods..." 
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
          :data="methodsList" 
          :loading="isLoading"
          empty-text="No shipping methods found."
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
                @click="modalState.openEdit(item.id)" 
                class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Edit Method"
                aria-label="Edit Method"
              >
                <Edit2 class="w-4 h-4" />
              </button>
              <button 
                v-if="canDelete"
                @click="confirmDelete(item)" 
                class="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Delete Method"
                aria-label="Delete Method"
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
              item-label="shipping methods"
              prefix-label="Showing"
              variant="footer"
            />
          </template>
        </UiTable>
      </UiCard>

      <!-- Create / Edit Modal -->
      <UiAdminModal 
        :isOpen="modalState.isCreate.value || modalState.isEdit.value"
        :title="modalState.isEdit.value ? 'Edit Shipping Method' : 'Add Shipping Method'"
        @close="modalState.closeModal()"
      >
        <form @submit.prevent="handleSaveMethod">
          <div class="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
            <div v-if="formError" class="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle class="w-4 h-4 shrink-0" />
              <span>{{ formError }}</span>
            </div>

            <div>
              <label class="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Method Name <span class="text-destructive">*</span>
              </label>
              <input 
                v-model="formPayload.name"
                type="text"
                required
                maxlength="255"
                placeholder="e.g. Express Air Freight"
                class="w-full h-10 rounded-xl border border-input bg-background px-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Method Code <span class="text-destructive">*</span>
              </label>
              <input 
                v-model="formPayload.code"
                type="text"
                required
                maxlength="255"
                placeholder="e.g. express_air"
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
                placeholder="Brief details about transit times or carrier specifics..."
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
              <div class="flex items-center pt-6">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input 
                    v-model="formPayload.is_active"
                    type="checkbox"
                    class="rounded border-input text-primary focus:ring-ring w-4 h-4"
                  />
                  <span class="text-sm font-medium text-foreground">Active Method</span>
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
              {{ modalState.isEdit.value ? 'Save Changes' : 'Create Method' }}
            </UiButton>
          </div>
        </form>
      </UiAdminModal>

      <!-- Delete Confirmation Modal -->
      <UiAdminModal 
        :isOpen="!!methodToDelete"
        title="Delete Shipping Method"
        @close="methodToDelete = null"
        maxWidth="max-w-md"
      >
        <div class="p-6 space-y-6">
          <div class="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3">
            <AlertCircle class="w-5 h-5 shrink-0" />
            <span>Are you sure you want to delete shipping method <strong>{{ methodToDelete?.name }}</strong>? This action cannot be undone.</span>
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            <UiButton variant="outline" size="sm" class="rounded-xl h-10 px-5 text-xs font-bold" @click="methodToDelete = null" :disabled="isDeleting">
              Cancel
            </UiButton>
            <UiButton variant="destructive" size="sm" class="rounded-xl h-10 px-6 text-xs font-bold" @click="handleDeleteMethod" :disabled="isDeleting">
              <Loader2 v-if="isDeleting" class="w-4 h-4 mr-2 animate-spin" />
              Delete Method
            </UiButton>
          </div>
        </div>
      </UiAdminModal>
    </div>
  </NuxtLayout>
</template>
