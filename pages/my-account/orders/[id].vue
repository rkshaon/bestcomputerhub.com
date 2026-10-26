<!-- File: /pages/account/orders/[id].vue -->
<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next';
import { useOrderService } from '@/composables/useOrderService';
import OrderDetailView from '@/components/commerce/OrderDetailView.vue';
import type { Order } from '@/types/order';

const route = useRoute();
const orderId = route.params.id as string;
const orderService = useOrderService();
const order = ref<Order | null>(null);
const isLoading = ref(true);

onMounted(async () => {
  try {
    order.value = await orderService.getOrderDetails(orderId);
  } catch (err) {
    handleApiError(err, 'Failed to load order details.');
    navigateTo('/account');
  } finally {
    isLoading.value = false;
  }
});

const handleCancelOrder = async () => {
  if (!confirm('Are you sure you want to cancel this order?')) return;
  
  try {
    await orderService.cancelOrder(orderId);
    // The cancel endpoint returns only { id, status, message }; reload the full order.
    order.value = await orderService.getOrderDetails(orderId);
  } catch (err) {
    handleApiError(err, 'Failed to cancel order.');
  }
};
</script>

<template>
  <div class="min-h-screen py-20 bg-muted/20">
    <div v-if="isLoading" class="container mx-auto px-4 text-center">Loading...</div>
    <div v-else-if="order" class="container mx-auto px-4 max-w-4xl space-y-8 animate-in fade-in duration-700">
      <div class="flex items-center gap-4">
        <NuxtLink to="/account" class="w-10 h-10 border rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary">
          <ChevronLeft class="w-5 h-5" />
        </NuxtLink>
        <h1 class="text-3xl font-display font-extrabold">Order Details: {{ order.orderNumber }}</h1>
      </div>
      <OrderDetailView :order="order" @cancel="handleCancelOrder" />
    </div>
  </div>
</template>
