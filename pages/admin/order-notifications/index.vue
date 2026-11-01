<!-- File: /pages/admin/order-notifications/index.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { Mail, Search, RefreshCw, AlertCircle, Plus, X, Loader2, Pencil, Trash2, Info } from 'lucide-vue-next';
import { refDebounced } from '@vueuse/core';
import { useOrderNotificationService } from '@/composables/useOrderNotificationService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { useAdminModalState } from '@/composables/useAdminModalState';
import { useToast } from '@/composables/useToast';
import { cn } from '@/utils';
import type { OrderNotificationRecipient } from '@/types';
import type { UiTableColumn } from '@/components/ui/UiTable.vue';
import UiTable from '@/components/ui/UiTable.vue';
import UiSearchInput from '@/components/ui/UiSearchInput.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import UiButton from '@/components/ui/Button.vue';
import UiAdminModal from '@/components/ui/UiAdminModal.vue';

definePageMeta({
  layout: false
});

useSeoMeta({ title: 'Order Notifications', robots: 'noindex, nofollow' });

const PERM_VIEW = 'email_api.view_ordernotificationrecipient';
const PERM_ADD = 'email_api.add_ordernotificationrecipient';
const PERM_CHANGE = 'email_api.change_ordernotificationrecipient';
const PERM_DELETE = 'email_api.delete_ordernotificationrecipient';

type StatusFilter = 'all' | 'active' | 'inactive';

const recipientService = useOrderNotificationService();
const recipients = ref<OrderNotificationRecipient[]>([]);
const modalState = useAdminModalState<OrderNotificationRecipient>({ getItems: recipients });
const { toastSuccess, handleApiError, extractErrorMessage } = useToast();
const { hasPermission } = useAdminPermissions();
const route = useRoute();
const router = useRouter();

const canCreate = computed(() => hasPermission(PERM_ADD));
const canEdit = computed(() => hasPermission(PERM_CHANGE));
const canDelete = computed(() => hasPermission(PERM_DELETE));

// List state
const totalCount = ref(0);
const isLoading = ref(false);
const errorMsg = ref<string | null>(null);
const togglingId = ref<number | null>(null);

const parseStatus = (value: unknown): StatusFilter =>
  value === 'active' || value === 'inactive' ? value : 'all';
const parsePositiveInt = (value: unknown, fallback: number): number => {
  const parsed = parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const searchQuery = ref(route.query.search ? String(route.query.search) : '');
const debouncedSearchQuery = refDebounced(searchQuery, 300);
const statusFilter = ref<StatusFilter>(parseStatus(route.query.status));
const currentPage = ref(parsePositiveInt(route.query.page, 1));
const itemsPerPage = ref(parsePositiveInt(route.query.pageSize, 10));

// Create / edit form state (one form serves both modals)
const formEmail = ref('');
const formName = ref('');
const formIsActive = ref(true);
const formError = ref<string | null>(null);
const isSubmitting = ref(false);

// Delete state
const deleteError = ref<string | null>(null);
const isDeleting = ref(false);

const isFormOpen = computed(() =>
  modalState.isCreate.value || (modalState.isEdit.value && !!modalState.activeEntity.value)
);

const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
};

const fetchRecipients = async () => {
  if (!hasPermission(PERM_VIEW)) {
    errorMsg.value = `Access denied. The ${PERM_VIEW} permission is required to view order notification recipients.`;
    recipients.value = [];
    totalCount.value = 0;
    return;
  }

  isLoading.value = true;
  errorMsg.value = null;

  try {
    const res = await recipientService.getRecipients({
      page: currentPage.value,
      page_size: itemsPerPage.value,
      search: debouncedSearchQuery.value,
      is_active: statusFilter.value === 'all' ? undefined : statusFilter.value === 'active'
    });
    recipients.value = res.results;
    totalCount.value = res.count;
  } catch {
    errorMsg.value = recipientService.errorMsg.value || 'Failed to load order notification recipients.';
    recipients.value = [];
    totalCount.value = 0;
  } finally {
    isLoading.value = false;
  }
};

const resetForm = (entity?: OrderNotificationRecipient | null) => {
  formEmail.value = entity?.email ?? '';
  formName.value = entity?.name ?? '';
  formIsActive.value = entity ? entity.is_active : true;
  formError.value = null;
};

watch(() => modalState.isCreate.value, (isOpen) => {
  if (isOpen) resetForm();
});

watch([() => modalState.isEdit.value, () => modalState.activeEntity.value], ([isEdit, entity]) => {
  if (isEdit && entity) resetForm(entity);
}, { immediate: true });

watch(() => modalState.isDelete.value, (isOpen) => {
  if (isOpen) deleteError.value = null;
});

const handleSubmit = async () => {
  const editing = modalState.isEdit.value ? modalState.activeEntity.value : null;
  const requiredPermission = editing ? PERM_CHANGE : PERM_ADD;

  if (!hasPermission(requiredPermission)) {
    formError.value = `Access denied. The ${requiredPermission} permission is required.`;
    return;
  }

  const email = formEmail.value.trim();
  if (!email) {
    formError.value = 'Email address is required.';
    return;
  }

  if (isSubmitting.value) return;
  isSubmitting.value = true;
  formError.value = null;

  const payload = { email, name: formName.value.trim(), is_active: formIsActive.value };
  const fallback = editing ? 'Failed to update recipient.' : 'Failed to add recipient.';

  try {
    if (editing) {
      await recipientService.updateRecipient(editing.id, payload);
      toastSuccess('Recipient updated.');
    } else {
      await recipientService.createRecipient(payload);
      toastSuccess('Recipient added.');
    }
    modalState.closeModal();
    await fetchRecipients();
  } catch (err: unknown) {
    formError.value = extractErrorMessage(err, fallback);
    handleApiError(err, fallback);
  } finally {
    isSubmitting.value = false;
  }
};

const handleToggleActive = async (recipient: OrderNotificationRecipient) => {
  if (!canEdit.value || togglingId.value !== null) return;

  togglingId.value = recipient.id;
  const nextActive = !recipient.is_active;

  try {
    const updated = await recipientService.updateRecipient(recipient.id, { is_active: nextActive });
    recipient.is_active = updated.is_active;
    toastSuccess(nextActive ? 'Notifications resumed.' : 'Notifications paused.');
    if (statusFilter.value !== 'all') await fetchRecipients();
  } catch (err: unknown) {
    handleApiError(err, 'Failed to update recipient.');
  } finally {
    togglingId.value = null;
  }
};

const handleDelete = async () => {
  if (!hasPermission(PERM_DELETE)) {
    deleteError.value = `Access denied. The ${PERM_DELETE} permission is required.`;
    return;
  }

  const recipient = modalState.activeEntity.value;
  if (!recipient || isDeleting.value) return;

  isDeleting.value = true;
  deleteError.value = null;

  try {
    await recipientService.deleteRecipient(recipient.id);
    toastSuccess('Recipient removed.');
    modalState.closeModal();

    if (recipients.value.length === 1 && currentPage.value > 1) {
      currentPage.value -= 1;
    } else {
      await fetchRecipients();
    }
  } catch (err: unknown) {
    deleteError.value = extractErrorMessage(err, 'Failed to remove recipient.');
    handleApiError(err, 'Failed to remove recipient.');
  } finally {
    isDeleting.value = false;
  }
};

const totalPages = computed(() => Math.ceil(totalCount.value / itemsPerPage.value) || 1);

// Filters reset to page 1; page changes refetch directly.
watch([debouncedSearchQuery, statusFilter, itemsPerPage], () => {
  if (currentPage.value !== 1) {
    currentPage.value = 1;
  } else {
    fetchRecipients();
  }
});

watch(currentPage, () => {
  fetchRecipients();
});

// Keep list state in the URL.
watch([searchQuery, statusFilter, currentPage, itemsPerPage], () => {
  const query: Record<string, string | string[] | undefined> = {};
  for (const [key, value] of Object.entries(route.query)) {
    if (typeof value === 'string') query[key] = value;
  }

  query.search = searchQuery.value || undefined;
  query.status = statusFilter.value !== 'all' ? statusFilter.value : undefined;
  query.page = currentPage.value !== 1 ? String(currentPage.value) : undefined;
  query.pageSize = itemsPerPage.value !== 10 ? String(itemsPerPage.value) : undefined;

  router.replace({ query });
});

// Browser back / forward.
watch(() => route.query, (q) => {
  const nextSearch = q.search ? String(q.search) : '';
  if (searchQuery.value !== nextSearch) searchQuery.value = nextSearch;

  const nextStatus = parseStatus(q.status);
  if (statusFilter.value !== nextStatus) statusFilter.value = nextStatus;

  const nextPage = parsePositiveInt(q.page, 1);
  if (currentPage.value !== nextPage) currentPage.value = nextPage;

  const nextPageSize = parsePositiveInt(q.pageSize, 10);
  if (itemsPerPage.value !== nextPageSize) itemsPerPage.value = nextPageSize;
});

onMounted(() => {
  fetchRecipients();
});

const tableColumns = computed<UiTableColumn<OrderNotificationRecipient>[]>(() => {
  const cols: UiTableColumn<OrderNotificationRecipient>[] = [
    { key: 'email', label: 'Email', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
    { key: 'name', label: 'Label', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
    { key: 'is_active', label: 'Status', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' },
    { key: 'created_at', label: 'Added', headerClass: 'px-4 py-3', cellClass: 'px-4 py-2.5' }
  ];

  if (canEdit.value || canDelete.value) {
    cols.push({
      key: 'actions',
      label: 'Actions',
      align: 'right',
      headerClass: 'px-4 py-3 text-right',
      cellClass: 'px-4 py-2.5 text-right'
    });
  }

  return cols;
});
</script>

<template>
  <NuxtLayout name="admin">
    <template #header-title>
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground/40 font-light select-none">/</span>
        <h1 class="text-2xl sm:text-[26px] font-display font-extrabold tracking-tight text-foreground">
          Order Notifications
        </h1>
      </div>
    </template>

    <template #header-actions>
      <div class="flex flex-wrap items-center gap-2">
        <UiButton
          v-if="canCreate"
          variant="primary"
          class="rounded-xl h-9 px-3.5 gap-1.5 font-bold text-xs"
          @click="modalState.openCreate()"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Add Recipient</span>
        </UiButton>
        <UiButton
          variant="outline"
          class="rounded-xl h-9 px-3.5 gap-1.5 border-border font-bold text-xs"
          :disabled="isLoading"
          @click="fetchRecipients"
        >
          <RefreshCw :class="['w-3.5 h-3.5', isLoading && 'animate-spin']" />
          <span>Refresh</span>
        </UiButton>
      </div>
    </template>

    <div class="space-y-4 animate-in fade-in duration-500">
      <!-- What this list does -->
      <div class="flex items-start gap-3 bg-card border border-border px-3.5 py-2.5 rounded-xl text-xs text-muted-foreground leading-relaxed">
        <Info class="w-4 h-4 shrink-0 mt-0.5 text-primary" />
        <p>
          Every active address below gets a short email when an order is placed (any channel) and when an order is
          cancelled by a customer or staff. The email links to the order in the admin; it is not a copy of the order.
        </p>
      </div>

      <!-- Search & filters -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border px-3.5 py-2.5 rounded-xl shadow-xs">
        <UiSearchInput
          v-model="searchQuery"
          placeholder="Search email or label..."
          class="w-full sm:w-80"
        />

        <div class="flex items-center gap-3 self-end sm:self-center">
          <div class="flex items-center gap-2 border-l border-border pl-3">
            <label for="recipient-status-filter" class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Status:</label>
            <select
              id="recipient-status-filter"
              v-model="statusFilter"
              class="h-9 px-3 bg-background border border-input rounded-lg outline-none text-[10px] font-bold uppercase tracking-wider cursor-pointer text-foreground focus:ring-2 focus:ring-ring/20 transition-all"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Paused</option>
            </select>
          </div>

          <div class="flex items-center gap-1.5 border-l border-border pl-2.5">
            <label for="recipient-page-size" class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground hidden sm:inline">Show:</label>
            <select
              id="recipient-page-size"
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
        </div>
      </div>

      <!-- Error state -->
      <div v-if="errorMsg" class="h-64 flex flex-col items-center justify-center gap-4 p-6 text-center bg-card border border-border rounded-2xl">
        <div class="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle class="w-6 h-6" />
        </div>
        <div>
          <p class="text-lg font-bold text-foreground">Failed to Load Recipients</p>
          <p class="text-xs text-muted-foreground max-w-md mx-auto mt-1">{{ errorMsg }}</p>
        </div>
        <UiButton variant="primary" class="rounded-xl h-9 px-4 font-bold text-xs" @click="fetchRecipients">
          Try Again
        </UiButton>
      </div>

      <UiTable
        v-else
        :columns="tableColumns"
        :data="recipients"
        :loading="isLoading"
        key-field="id"
      >
        <template #cell-email="{ item }">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-primary/10 text-primary border border-primary/20 rounded-lg flex items-center justify-center shrink-0">
              <Mail class="w-4 h-4" />
            </div>
            <span class="text-xs font-bold text-foreground break-all">{{ item.email }}</span>
          </div>
        </template>

        <template #cell-name="{ item }">
          <span class="text-xs text-muted-foreground">{{ item.name || '—' }}</span>
        </template>

        <template #cell-is_active="{ item }">
          <button
            v-if="canEdit"
            type="button"
            role="switch"
            :aria-checked="item.is_active"
            :aria-label="item.is_active ? `Pause notifications for ${item.email}` : `Resume notifications for ${item.email}`"
            :title="item.is_active ? 'Pause notifications' : 'Resume notifications'"
            :disabled="togglingId !== null"
            class="inline-flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-muted/60 transition-colors disabled:opacity-60"
            @click="handleToggleActive(item)"
          >
            <span
              :class="cn(
                'relative inline-flex h-5 w-9 shrink-0 rounded-full border border-border transition-colors',
                item.is_active ? 'bg-primary' : 'bg-muted'
              )"
            >
              <span
                :class="cn(
                  'absolute top-0.5 h-3.5 w-3.5 rounded-full bg-background shadow transition-transform',
                  item.is_active ? 'translate-x-[18px]' : 'translate-x-0.5'
                )"
              />
            </span>
            <Loader2 v-if="togglingId === item.id" class="w-3.5 h-3.5 animate-spin text-muted-foreground" />
            <span v-else class="text-[10px] uppercase font-bold tracking-widest" :class="item.is_active ? 'text-primary' : 'text-muted-foreground'">
              {{ item.is_active ? 'Active' : 'Paused' }}
            </span>
          </button>
          <span v-else class="text-[10px] uppercase font-bold tracking-widest" :class="item.is_active ? 'text-primary' : 'text-muted-foreground'">
            {{ item.is_active ? 'Active' : 'Paused' }}
          </span>
        </template>

        <template #cell-created_at="{ item }">
          <span class="font-mono text-xs text-muted-foreground">{{ formatDate(item.created_at) }}</span>
        </template>

        <template #cell-actions="{ item }">
          <div class="flex items-center justify-end gap-1.5">
            <button
              v-if="canEdit"
              type="button"
              class="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title="Edit recipient"
              aria-label="Edit recipient"
              @click="modalState.openEdit(item.id)"
            >
              <Pencil class="w-4 h-4" />
            </button>
            <button
              v-if="canDelete"
              type="button"
              class="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Remove recipient"
              aria-label="Remove recipient"
              @click="modalState.openDelete(item.id)"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </template>

        <template #empty>
          <div class="flex flex-col items-center justify-center gap-4 text-muted-foreground py-12">
            <div class="w-16 h-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center">
              <Search class="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p class="font-display font-medium text-lg text-foreground">No Recipients</p>
              <p class="text-xs max-w-sm mx-auto mt-1">
                Nobody is notified about orders yet. Add an email address to start.
              </p>
            </div>
          </div>
        </template>

        <template #footer>
          <UiPagination
            v-model:current-page="currentPage"
            :total-pages="totalPages"
            :total-count="totalCount"
            :items-per-page="itemsPerPage"
            item-label="recipients"
            prefix-label="Showing"
            variant="footer"
          />
        </template>
      </UiTable>
    </div>

    <!-- Create / Edit modal -->
    <UiAdminModal
      :is-open="isFormOpen"
      max-width="max-w-md"
      :show-close-button="false"
      @close="modalState.closeModal()"
    >
      <form class="w-full relative overflow-hidden flex flex-col cursor-default" @submit.prevent="handleSubmit">
        <div class="p-6 border-b border-border flex items-center justify-between">
          <div>
            <span class="text-[10px] uppercase font-bold tracking-[0.2em] text-primary">Order Notifications</span>
            <h2 class="text-[20px] font-display font-black tracking-tight text-foreground mt-0.5">
              {{ modalState.isEdit.value ? 'Edit Recipient' : 'Add Recipient' }}
            </h2>
          </div>
          <button
            type="button"
            class="w-9 h-9 border border-border rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Close"
            aria-label="Close"
            @click="modalState.closeModal()"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="p-6 space-y-4">
          <div v-if="formError" class="p-3.5 bg-destructive/10 border border-destructive/20 flex items-start gap-3 rounded-xl text-destructive">
            <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
            <p class="text-xs font-semibold leading-relaxed">{{ formError }}</p>
          </div>

          <div>
            <label for="recipient-email" class="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Email <span class="text-destructive">*</span>
            </label>
            <input
              id="recipient-email"
              v-model="formEmail"
              type="email"
              autocomplete="off"
              placeholder="orders@example.com"
              class="w-full h-10 px-3.5 bg-background border border-input rounded-xl text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
              :disabled="isSubmitting"
              required
            />
          </div>

          <div>
            <label for="recipient-name" class="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Label
            </label>
            <input
              id="recipient-name"
              v-model="formName"
              type="text"
              maxlength="120"
              placeholder="e.g. Warehouse"
              class="w-full h-10 px-3.5 bg-background border border-input rounded-xl text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all"
              :disabled="isSubmitting"
            />
          </div>

          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="formIsActive"
              type="checkbox"
              class="rounded border-input text-primary focus:ring-ring w-4 h-4"
              :disabled="isSubmitting"
            />
            <span class="text-sm font-medium text-foreground">Send notifications to this address</span>
          </label>
        </div>

        <div class="p-6 border-t border-border bg-muted/20 flex items-center justify-end gap-3">
          <UiButton
            type="button"
            variant="outline"
            class="rounded-xl h-9 px-4 font-bold text-xs"
            :disabled="isSubmitting"
            @click="modalState.closeModal()"
          >
            Cancel
          </UiButton>
          <UiButton
            type="submit"
            variant="primary"
            class="rounded-xl h-9 px-5 gap-2 font-bold text-xs"
            :disabled="isSubmitting || !formEmail.trim()"
          >
            <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmitting ? 'Saving...' : (modalState.isEdit.value ? 'Save Changes' : 'Add Recipient') }}</span>
          </UiButton>
        </div>
      </form>
    </UiAdminModal>

    <!-- Delete confirmation -->
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
          <h2 class="text-[18px] font-bold text-foreground">Remove Recipient</h2>
          <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            <span class="font-bold text-foreground">{{ modalState.activeEntity.value?.email }}</span>
            will stop receiving order notifications. To stop them only for a while, pause the address instead.
          </p>
        </div>

        <div v-if="deleteError" class="p-3.5 bg-destructive/10 border border-destructive/20 flex items-start gap-3 rounded-xl text-destructive">
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
          <p class="text-xs font-semibold leading-relaxed">{{ deleteError }}</p>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <UiButton
            type="button"
            variant="outline"
            class="rounded-xl h-9 px-4 font-bold text-xs"
            :disabled="isDeleting"
            @click="modalState.closeModal()"
          >
            Cancel
          </UiButton>
          <UiButton
            type="button"
            variant="destructive"
            class="rounded-xl h-9 px-5 gap-2 font-bold text-xs"
            :disabled="isDeleting"
            @click="handleDelete"
          >
            <Loader2 v-if="isDeleting" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isDeleting ? 'Removing...' : 'Remove' }}</span>
          </UiButton>
        </div>
      </div>
    </UiAdminModal>
  </NuxtLayout>
</template>
