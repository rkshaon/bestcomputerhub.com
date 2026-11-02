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
  <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
    <UiCard v-for="(status, index) in statuses" :key="status.value" class="p-5 flex flex-col gap-3">
      <h3 class="text-xs font-bold uppercase tracking-widest text-muted-foreground">{{ status.label }}</h3>
      
      <div class="flex flex-col gap-0.5">
        <span class="text-[10px] uppercase font-bold text-muted-foreground">Total Orders</span>
        <span class="text-2xl font-extrabold text-foreground">{{ counts[index] ?? 0 }}</span>
      </div>
      
      <div class="flex flex-col gap-0.5">
        <span class="text-[10px] uppercase font-bold text-muted-foreground">Total Order Amount</span>
        <span class="text-lg font-bold text-primary">{{ formatCurrency(amounts[index] ?? 0) }}</span>
      </div>
    </UiCard>
  </div>
</template>
