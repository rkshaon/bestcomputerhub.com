<script setup lang="ts">
import { ChevronLeft, Printer } from 'lucide-vue-next';
import { useAdminStore } from '@/stores/admin';
import OrderDetailView from '@/components/commerce/OrderDetailView.vue';
import type { Order } from '@/types';

definePageMeta({
  layout: 'admin'
});

const route = useRoute();
const orderId = route.params.id as string;
const adminStore = useAdminStore();
const order = ref<Order | null>(adminStore.recentOrders.find(o => o.id === orderId) || null);

if (!order.value) {
  navigateTo('/admin/orders');
}
</script>

<template>
  <div v-if="order" class="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
    <div class="flex items-center gap-4">
        <NuxtLink to="/admin/orders" class="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-primary">
          <ChevronLeft class="w-5 h-5" />
        </NuxtLink>
        <h1 class="text-3xl font-display font-extrabold">Order Details: {{ order.orderNumber }}</h1>
    </div>
    <OrderDetailView :order="order" />
  </div>
</template>
