<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSalesService } from '@/composables/useSalesService';
import { formatCurrency } from '@/utils';
import UiCard from '@/components/ui/UiCard.vue';
import type { OrderStatusOption } from '@/types/order';

const props = defineProps<{
  statuses: OrderStatusOption[];
}>();

const salesService = useSalesService();
const counts = ref<number[]>([]);
const amounts = ref<number[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

const fetchData = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const [summary, amountSummary] = await Promise.all([
      salesService.getSalesSummary(),
      salesService.getSalesAmountSummary()
    ]);
    
    counts.value = Object.values(summary.data);
    amounts.value = Object.values(amountSummary.data);
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
  <div v-else class="flex overflow-x-auto pb-4 gap-4 animate-in fade-in duration-500 lg:grid lg:grid-cols-9 lg:overflow-visible lg:pb-0">
    <UiCard v-for="(status, index) in statuses" :key="status.value" class="p-3 flex flex-col gap-1 min-w-[160px] lg:min-w-0">
      <h3 class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">{{ status.label }}</h3>
      
      <div class="flex flex-col gap-0">
        <span class="text-[9px] uppercase font-bold text-muted-foreground">Total Orders</span>
        <span class="text-xl font-extrabold text-foreground">{{ counts[index] ?? 0 }}</span>
      </div>
      
      <div class="flex flex-col gap-0">
        <span class="text-[9px] uppercase font-bold text-muted-foreground">Total Order Amount</span>
        <span class="text-sm font-bold text-primary truncate">{{ formatCurrency(amounts[index] ?? 0) }}</span>
      </div>
    </UiCard>
  </div>
</template>
