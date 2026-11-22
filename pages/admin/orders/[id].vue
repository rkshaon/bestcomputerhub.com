<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next';
import OrderDetailView from '@/components/commerce/OrderDetailView.vue';
import AdminOrderActions from '@/components/admin/AdminOrderActions.vue';
import { useSalesService } from '@/composables/useSalesService';
import type { Order, OrderStatusOption } from '@/types/order';

definePageMeta({
  layout: 'admin'
});

const route = useRoute();
const orderId = route.params.id as string;
const salesService = useSalesService();
const order = ref<Order | null>(null);
const statuses = ref<OrderStatusOption[]>([]);
const transitions = ref<Record<string, string[]>>({});

const fetchOrder = async () => {
  try {
    order.value = await salesService.getSaleDetails(orderId);
  } catch (err) {
    console.error('Failed to fetch order details:', err);
    navigateTo('/admin/orders');
  }
};

const fetchStatuses = async () => {
  try {
    const data = await salesService.getStatuses();
    statuses.value = Array.isArray(data?.statuses) ? data.statuses : [];
    transitions.value = data?.transitions || {};
  } catch (err) {
    console.error('Failed to fetch order statuses:', err);
  }
};

onMounted(() => {
  fetchOrder();
  fetchStatuses();
});
</script>

<template>
  <div v-if="order" class="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
    <div class="flex items-center gap-4">
        <NuxtLink to="/admin/orders" class="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-primary">
          <ChevronLeft class="w-5 h-5" />
        </NuxtLink>
        <h1 class="text-3xl font-display font-extrabold">Order Details: {{ order.orderNumber }}</h1>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="md:col-span-2">
        <OrderDetailView :order="order" />
      </div>
      <div>
        <AdminOrderActions :order="order" :statuses="statuses" :transitions="transitions" @updated="fetchOrder" />
      </div>
    </div>
  </div>
</template>
