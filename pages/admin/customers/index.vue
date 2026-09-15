<!-- File: /pages/admin/customers/index.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { refDebounced } from '@vueuse/core';
import { 
  Mail, 
  Phone, 
  ExternalLink, 
  Calendar, 
  RefreshCw 
} from 'lucide-vue-next';
import { useCustomerService } from '@/composables/useCustomerService';
import { useAdminPermissions } from '@/composables/useAdminPermissions';
import { extractErrorMessage, toastError } from '@/composables/useToast';
import { cn } from '@/utils';
import UiTable, { type UiTableColumn } from '@/components/ui/UiTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import UiSearchInput from '@/components/ui/UiSearchInput.vue';
import type { CustomerItem, CustomerType } from '@/types';

definePageMeta({
  layout: false
});

const route = useRoute();
const router = useRouter();

const customerService = useCustomerService();
const { canViewModule, hasPermission } = useAdminPermissions();

const canViewCustomers = computed(() => hasPermission('customer_api.view_customerprofile') || canViewModule('/admin/customers'));

// Page filter and pagination state initialized from URL query parameters
const searchQuery = ref<string>(route.query.search ? String(route.query.search) : '');
const debouncedSearchQuery = refDebounced(searchQuery, 300);

const customerTypeFilter = ref<CustomerType | ''>(
  (route.query.customer_type as CustomerType) || ''
);

const activeStatusFilter = ref<string>(
  route.query.is_active ? String(route.query.is_active) : ''
);

const currentPage = ref<number>(
  route.query.page ? parseInt(String(route.query.page), 10) || 1 : 1
);

const itemsPerPage = ref<number>(
  route.query.pageSize
    ? parseInt(String(route.query.pageSize), 10) || 10
    : route.query.page_size
    ? parseInt(String(route.query.page_size), 10) || 10
    : 10
);

const customers = ref<CustomerItem[]>([]);
const totalCount = ref<number>(0);
const isLoading = ref<boolean>(false);
const fetchError = ref<string | null>(null);

const totalPages = computed(() => Math.ceil(totalCount.value / itemsPerPage.value) || 1);

// Table Column Definitions
const columns: UiTableColumn<CustomerItem>[] = [
  { key: 'full_name', label: 'Customer', headerClass: 'px-6 py-3', cellClass: 'px-6 py-4' },
  { key: 'email', label: 'Email', headerClass: 'px-6 py-3', cellClass: 'px-6 py-4' },
  { key: 'phone', label: 'Phone', headerClass: 'px-6 py-3', cellClass: 'px-6 py-4' },
  { key: 'customer_type', label: 'Customer Type', headerClass: 'px-6 py-3', cellClass: 'px-6 py-4' },
  { key: 'facebook_profile_url', label: 'Facebook', headerClass: 'px-6 py-3', cellClass: 'px-6 py-4' },
  { key: 'created_at', label: 'Registration Date', headerClass: 'px-6 py-3', cellClass: 'px-6 py-4' },
  { key: 'is_active', label: 'Status', headerClass: 'px-6 py-3', cellClass: 'px-6 py-4' }
];

// Helper to format date string cleanly
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return '—';
  }
};

// Helper for customer avatar initials
const getCustomerInitials = (customer: CustomerItem): string => {
  const name = (customer.full_name || customer.email || '').trim();
  if (!name) return 'C';
  const parts = name.split(' ').filter(Boolean);
  const p0 = parts[0];
  const p1 = parts[1];
  if (p0 && p1 && p0[0] && p1[0]) {
    return (p0[0] + p1[0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

// Helper for customer type badge color scheme
const getCustomerTypeBadgeClass = (type: CustomerType): string => {
  switch (type) {
    case 'WEBSITE':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900';
    case 'POS':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900';
    case 'FACEBOOK':
      return 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-900';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

// Fetch customer accounts from API
const fetchCustomers = async () => {
  if (!canViewCustomers.value) return;
  isLoading.value = true;
  fetchError.value = null;

  try {
    const res = await customerService.getCustomers({
      page: currentPage.value,
      page_size: itemsPerPage.value,
      customer_type: customerTypeFilter.value || undefined,
      is_active: activeStatusFilter.value || undefined,
      search: debouncedSearchQuery.value || undefined
    });

    customers.value = res.results || [];
    totalCount.value = res.count || 0;
  } catch (err: any) {
    fetchError.value = extractErrorMessage(err, 'Failed to retrieve customer records.');
    toastError(fetchError.value);
  } finally {
    isLoading.value = false;
  }
};

// Update route query parameters to preserve shareable state
const updateUrlQuery = () => {
  const query: Record<string, any> = { ...route.query };

  if (debouncedSearchQuery.value) query.search = debouncedSearchQuery.value;
  else delete query.search;

  if (customerTypeFilter.value) query.customer_type = customerTypeFilter.value;
  else delete query.customer_type;

  if (activeStatusFilter.value) query.is_active = activeStatusFilter.value;
  else delete query.is_active;

  if (currentPage.value > 1) query.page = String(currentPage.value);
  else delete query.page;

  if (itemsPerPage.value !== 10) query.pageSize = String(itemsPerPage.value);
  else delete query.pageSize;

  router.replace({ query });
};

// Filter/Search change watcher resets pagination to page 1
watch([debouncedSearchQuery, customerTypeFilter, activeStatusFilter, itemsPerPage], () => {
  if (currentPage.value !== 1) {
    currentPage.value = 1;
  } else {
    fetchCustomers();
  }
  updateUrlQuery();
});

// Page navigation watcher
watch(currentPage, () => {
  fetchCustomers();
  updateUrlQuery();
});

onMounted(() => {
  fetchCustomers();
});
</script>

<template>
  <NuxtLayout name="admin">
    <template #header-title>
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground/40 font-light select-none">/</span>
        <h1 class="text-xl font-display font-extrabold tracking-tight text-foreground">
          Customers
        </h1>
      </div>
    </template>

    <template #header-actions>
      <button
        @click="fetchCustomers"
        :disabled="isLoading"
        class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground transition-all disabled:opacity-50 cursor-pointer shadow-xs"
        title="Refresh customers list"
        aria-label="Refresh customers list"
      >
        <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading }" />
        <span>Refresh</span>
      </button>
    </template>

    <div class="space-y-4">
      <!-- Filters Container -->
      <div class="bg-card border border-border rounded-xl p-3.5 space-y-3 shadow-xs">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <!-- Search Bar -->
          <div class="flex-1 min-w-[240px]">
            <UiSearchInput
              v-model="searchQuery"
              placeholder="Search customers by name, email, or phone..."
              class="w-full"
            />
          </div>

          <!-- Filters & Select Controls -->
          <div class="flex flex-wrap items-center gap-2.5">
            <!-- Customer Type Filter -->
            <select
              v-model="customerTypeFilter"
              class="h-9 px-3 bg-card border border-border rounded-lg text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
              aria-label="Filter by customer type"
            >
              <option value="">All Customer Types</option>
              <option value="WEBSITE">WEBSITE</option>
              <option value="POS">POS</option>
              <option value="FACEBOOK">FACEBOOK</option>
            </select>

            <!-- Active Status Filter -->
            <select
              v-model="activeStatusFilter"
              class="h-9 px-3 bg-card border border-border rounded-lg text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
              aria-label="Filter by active status"
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            <!-- Page Size Selector -->
            <select
              v-model="itemsPerPage"
              class="h-9 px-3 bg-card border border-border rounded-lg text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
              aria-label="Select items per page"
            >
              <option :value="5">5 / page</option>
              <option :value="10">10 / page</option>
              <option :value="25">25 / page</option>
              <option :value="50">50 / page</option>
              <option :value="100">100 / page</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Customers Table -->
      <UiTable
        :columns="columns"
        :data="customers"
        :is-loading="isLoading"
        key-field="id"
        empty-message="No customer accounts match your search or filter criteria."
      >
        <!-- Customer Name & Avatar Column -->
        <template #cell-full_name="{ item: customer }">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
              {{ getCustomerInitials(customer) }}
            </div>
            <div class="flex flex-col min-w-0">
              <span class="text-sm font-semibold text-foreground truncate">
                {{ customer.full_name || customer.email }}
              </span>
              <span class="text-[11px] text-muted-foreground font-mono">
                ID: #{{ customer.id }}
              </span>
            </div>
          </div>
        </template>

        <!-- Email Column -->
        <template #cell-email="{ item: customer }">
          <div class="flex items-center gap-1.5 text-sm text-foreground font-medium">
            <Mail class="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span class="truncate">{{ customer.email }}</span>
          </div>
        </template>

        <!-- Phone Column -->
        <template #cell-phone="{ item: customer }">
          <div v-if="customer.phone" class="flex items-center gap-1.5 text-xs text-foreground font-medium">
            <Phone class="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span>{{ customer.phone }}</span>
          </div>
          <span v-else class="text-xs text-muted-foreground font-mono">—</span>
        </template>

        <!-- Customer Type Column -->
        <template #cell-customer_type="{ item: customer }">
          <span :class="cn('px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border inline-flex items-center gap-1', getCustomerTypeBadgeClass(customer.customer_type))">
            {{ customer.customer_type }}
          </span>
        </template>

        <!-- Facebook Profile Link Column -->
        <template #cell-facebook_profile_url="{ item: customer }">
          <a
            v-if="customer.facebook_profile_url"
            :href="customer.facebook_profile_url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
            title="View Facebook Profile"
            aria-label="View Facebook Profile"
          >
            <span>View Profile</span>
            <ExternalLink class="w-3.5 h-3.5" />
          </a>
          <span v-else class="text-xs text-muted-foreground font-mono">—</span>
        </template>

        <!-- Registration Date Column -->
        <template #cell-created_at="{ item: customer }">
          <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar class="w-3.5 h-3.5 shrink-0" />
            <span>{{ formatDate(customer.created_at) }}</span>
          </div>
        </template>

        <!-- Status Column (Displayed only if is_active is present) -->
        <template #cell-is_active="{ item: customer }">
          <span
            v-if="customer.is_active !== undefined && customer.is_active !== null"
            :class="cn(
              'px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border inline-block',
              customer.is_active
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900'
            )"
          >
            {{ customer.is_active ? 'Active' : 'Inactive' }}
          </span>
          <span v-else class="text-xs text-muted-foreground font-mono">—</span>
        </template>

        <!-- Footer Pagination -->
        <template #footer>
          <UiPagination
            v-model:current-page="currentPage"
            :total-pages="totalPages"
            :total-count="totalCount"
            :items-per-page="itemsPerPage"
            item-label="customers"
          />
        </template>
      </UiTable>
    </div>
  </NuxtLayout>
</template>
