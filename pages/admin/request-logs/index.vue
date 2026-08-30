<!-- File: /pages/admin/request-logs/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { refDebounced } from '@vueuse/core';
import { 
  Terminal, 
  Search, 
  RefreshCcw, 
  Filter, 
  Clock, 
  Globe, 
  User as UserIcon,
  ShieldCheck,
  Activity,
  ArrowUpDown
} from 'lucide-vue-next';
import { cn } from '@/utils';
import { useRequestLogService } from '@/composables/useRequestLogService';
import UiTable, { type UiTableColumn } from '@/components/ui/UiTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import type { RequestLog } from '@/types';

definePageMeta({
  layout: 'admin'
});

const route = useRoute();
const router = useRouter();
const { getRequestLogs, requestLogs, totalCount, isLoading, error } = useRequestLogService();

const searchQuery = ref('');
const debouncedSearch = refDebounced(searchQuery, 300);
const methodFilter = ref('all');
const statusFilter = ref('all');

const currentPage = ref(route.query.page ? parseInt(String(route.query.page)) || 1 : 1);
const itemsPerPage = ref(route.query.pageSize ? parseInt(String(route.query.pageSize)) || 10 : 10);

const tableColumns: UiTableColumn<RequestLog>[] = [
  { key: 'id', label: 'ID / Time', headerClass: 'px-6 py-3.5', cellClass: 'px-6 py-4' },
  { key: 'method', label: 'Method & Path', headerClass: 'px-6 py-3.5', cellClass: 'px-6 py-4' },
  { key: 'status_code', label: 'Status', headerClass: 'px-6 py-3.5', cellClass: 'px-6 py-4' },
  { key: 'user', label: 'User / Identity', headerClass: 'px-6 py-3.5', cellClass: 'px-6 py-4' },
  { key: 'ip_address', label: 'Origin IP', headerClass: 'px-6 py-3.5', cellClass: 'px-6 py-4' },
  { key: 'response_time', label: 'Duration', align: 'right', headerClass: 'px-6 py-3.5', cellClass: 'px-6 py-4 text-right' }
];

const fetchLogs = async () => {
  const params: Record<string, any> = {
    page: currentPage.value,
    page_size: itemsPerPage.value
  };

  if (debouncedSearch.value.trim()) {
    params.search = debouncedSearch.value.trim();
  }
  if (methodFilter.value !== 'all') {
    params.method = methodFilter.value;
  }
  if (statusFilter.value !== 'all') {
    params.status_code = statusFilter.value;
  }

  try {
    await getRequestLogs(params);
  } catch (err) {
    // Handled in service
  }
};

onMounted(() => {
  fetchLogs();
});

watch([currentPage, itemsPerPage], () => {
  router.replace({
    query: {
      ...route.query,
      page: currentPage.value !== 1 ? currentPage.value : undefined,
      pageSize: itemsPerPage.value !== 10 ? itemsPerPage.value : undefined
    }
  });
  fetchLogs();
});

watch([debouncedSearch, methodFilter, statusFilter], () => {
  currentPage.value = 1;
  fetchLogs();
});

const totalPages = computed(() => Math.ceil(totalCount.value / itemsPerPage.value) || 1);

const getMethodBadgeClass = (method?: string) => {
  switch (method?.toUpperCase()) {
    case 'GET': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'POST': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    case 'PUT':
    case 'PATCH': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'DELETE': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

const getStatusBadgeClass = (code?: number) => {
  if (!code) return 'bg-muted text-muted-foreground border-border';
  if (code >= 200 && code < 300) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  if (code >= 300 && code < 400) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
  if (code >= 400 && code < 500) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
};

const getUserDisplay = (log: RequestLog) => {
  if (typeof log.user === 'object' && log.user !== null) {
    return log.user.email || log.user.username || `User #${log.user.id}`;
  }
  return log.user_email || log.username || (log.user ? `User #${log.user}` : 'Anonymous / Guest');
};

const formatTime = (log: RequestLog) => {
  const ts = log.created_at || log.timestamp || log.requested_at;
  if (!ts) return 'N/A';
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
};
</script>

<template>
  <div class="space-y-6 animate-in fade-in duration-500">
    <!-- Single-Row Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="p-2.5 rounded-xl bg-primary/10 text-primary">
          <Terminal class="w-5 h-5" />
        </div>
        <div>
          <h1 class="text-xl font-display font-extrabold tracking-tight">Request Logs</h1>
          <p class="text-xs text-muted-foreground">HTTP requests and operational API telemetry stream</p>
        </div>
      </div>

      <div class="flex items-center gap-2.5">
        <button 
          @click="fetchLogs" 
          :disabled="isLoading"
          class="h-9 px-4 rounded-xl border border-border bg-card hover:bg-muted/50 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCcw :class="cn('w-3.5 h-3.5', isLoading && 'animate-spin')" />
          <span>Refresh</span>
        </button>
      </div>
    </div>

    <!-- Main Table Container -->
    <div class="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
      <!-- Search & Filters Bar -->
      <div class="p-3.5 border-b border-border bg-muted/20 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div class="flex-1 w-full relative">
          <Search class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Filter request logs by path, user, IP, or ID..." 
            class="w-full h-9 pl-9 pr-3 bg-background border border-input rounded-xl text-xs outline-none focus:ring-2 focus:ring-ring/20 transition-all placeholder:text-muted-foreground"
          />
        </div>

        <div class="flex items-center gap-2 w-full md:w-auto">
          <!-- Method Filter -->
          <select 
            v-model="methodFilter"
            class="h-9 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
          >
            <option value="all">All Methods</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>

          <!-- Status Filter -->
          <select 
            v-model="statusFilter"
            class="h-9 px-3 bg-background border border-input rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="200">200 OK</option>
            <option value="201">201 Created</option>
            <option value="400">400 Bad Request</option>
            <option value="401">401 Unauthorized</option>
            <option value="403">403 Forbidden</option>
            <option value="404">404 Not Found</option>
            <option value="500">500 Server Error</option>
          </select>

          <!-- Page-Size Selector -->
          <div class="border-l border-border pl-2.5 flex items-center gap-1.5 shrink-0">
            <span class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground hidden sm:inline">Show:</span>
            <select 
              v-model="itemsPerPage"
              class="h-9 px-2.5 bg-background border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
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

      <!-- UiTable -->
      <UiTable
        :columns="tableColumns"
        :data="requestLogs"
        :loading="isLoading"
        key-field="id"
        empty-text="No request logs found"
        empty-description="Try adjusting your filter parameters or search terms."
      >
        <!-- Log ID & Time -->
        <template #cell-id="{ item: log }">
          <div class="space-y-0.5">
            <p class="text-xs font-mono font-bold text-foreground">#{{ log.id }}</p>
            <p class="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock class="w-3 h-3 shrink-0" />
              {{ formatTime(log) }}
            </p>
          </div>
        </template>

        <!-- Method & Path -->
        <template #cell-method="{ item: log }">
          <div class="flex items-center gap-2.5">
            <span :class="cn('px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold uppercase border', getMethodBadgeClass(log.method))">
              {{ log.method || 'GET' }}
            </span>
            <code class="text-xs font-mono font-semibold text-foreground truncate max-w-xs lg:max-w-md" :title="log.path">
              {{ log.path || '/' }}
            </code>
          </div>
        </template>

        <!-- Status Code -->
        <template #cell-status_code="{ item: log }">
          <span :class="cn('px-2.5 py-1 rounded-lg text-xs font-mono font-bold border inline-flex items-center gap-1.5', getStatusBadgeClass(log.status_code))">
            <span class="w-1.5 h-1.5 rounded-full fill-current bg-current"></span>
            {{ log.status_code || 200 }}
          </span>
        </template>

        <!-- User Identity -->
        <template #cell-user="{ item: log }">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
              <UserIcon class="w-3.5 h-3.5" />
            </div>
            <span class="text-xs font-medium text-foreground truncate max-w-[160px]" :title="getUserDisplay(log)">
              {{ getUserDisplay(log) }}
            </span>
          </div>
        </template>

        <!-- IP Address -->
        <template #cell-ip_address="{ item: log }">
          <div class="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
            <Globe class="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
            <span>{{ log.ip_address || log.remote_addr || '127.0.0.1' }}</span>
          </div>
        </template>

        <!-- Response Time -->
        <template #cell-response_time="{ item: log }">
          <span class="text-xs font-mono text-muted-foreground">
            {{ log.response_time !== undefined && log.response_time !== null ? `${log.response_time}ms` : log.duration !== undefined && log.duration !== null ? `${log.duration}ms` : '—' }}
          </span>
        </template>

        <!-- Pagination -->
        <template #footer>
          <UiPagination
            v-model:current-page="currentPage"
            :total-pages="totalPages"
            :total-count="totalCount"
            :items-per-page="itemsPerPage"
            item-label="request logs"
          />
        </template>
      </UiTable>
    </div>
  </div>
</template>
