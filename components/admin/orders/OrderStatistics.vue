<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSalesService } from '@/composables/useSalesService';
import UiCard from '@/components/ui/UiCard.vue';
import type { OrderStatusOption } from '@/types/order';
import {
  Clock,
  RefreshCcw,
  Truck,
  CheckCircle2,
  XCircle,
  type LucideIcon
} from 'lucide-vue-next';

const props = defineProps<{
  statuses: OrderStatusOption[];
}>();

const statusConfig: Record<string, { icon: LucideIcon, color: string, bg: string }> = {
  pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-950/30' },
  processing: { icon: RefreshCcw, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-950/30' },
  shipped: { icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-950/30' },
  delivered: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-950/30' },
  cancelled: { icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-950/30' },
  refunded: { icon: RefreshCcw, color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-950/30' },
};

const getStatusConfig = (status: string) => statusConfig[status.toLowerCase()] ?? statusConfig.pending;

const salesService = useSalesService();
const counts = ref<number[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

const fetchData = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const summary = await salesService.getSalesSummary();
    counts.value = Object.values(summary.data);
  } catch (err: any) {
    error.value = 'Failed to load statistics';
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};

const refresh = () => fetchData();

defineExpose({ refresh });

onMounted(() => fetchData());
</script>

<template>
  <div v-if="error" class="text-rose-600 text-sm p-4 bg-rose-50 rounded-xl border border-rose-200">
    {{ error }}
  </div>
  <div v-else class="flex overflow-x-auto pb-4 gap-3 animate-in fade-in duration-500 lg:grid lg:grid-cols-9 lg:overflow-visible lg:pb-0">
    <UiCard v-for="(status, index) in statuses" :key="status.value" class="flex items-center gap-3 p-3 min-w-[160px] lg:min-w-0">
      <div :class="['w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-inner', getStatusConfig(status.value)?.bg, getStatusConfig(status.value)?.color]">
        <component :is="getStatusConfig(status.value)?.icon" class="w-4 h-4" />
      </div>
      <div class="min-w-0">
        <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground truncate">{{ status.label }}</p>
        <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground truncate">Total Orders</p>
        <p class="text-xl font-display font-bold tracking-tight text-foreground leading-tight">{{ (counts && counts[index] !== undefined) ? counts[index] : 0 }}</p>
      </div>
    </UiCard>
  </div>
</template>
