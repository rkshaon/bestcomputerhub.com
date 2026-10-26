<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useOrderService } from '@/composables/useOrderService';
import { formatCurrency, cn } from '@/utils';
import type { Order } from '@/types/order';
import { ArrowRight, Package, ChevronRight } from 'lucide-vue-next';

const orderService = useOrderService();
const orders = ref<Order[]>([]);
const isLoadingOrders = ref(false);

const fetchOrders = async () => {
  isLoadingOrders.value = true;
  try {
    const res = await orderService.getOrders();
    orders.value = res.results || [];
  } catch (err) {
    console.error('Failed to load order history.', err);
  } finally {
    isLoadingOrders.value = false;
  }
};

onMounted(fetchOrders);
</script>

<template>
  <div class="space-y-6 animate-in fade-in duration-500">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-display font-bold">Recent Orders</h2>
      <UiButton variant="ghost" size="sm" class="rounded-full font-bold">Filter By <ChevronRight class="w-4 h-4 rotate-90 ml-1" /></UiButton>
    </div>

    <div v-if="isLoadingOrders" class="py-12 text-center text-muted-foreground text-sm">
      Loading your order history...
    </div>
    <div v-else-if="orders.length === 0" class="py-12 text-center text-muted-foreground text-sm bg-card border rounded-[2rem]">
      You haven't placed any orders yet.
    </div>
    <div v-else class="grid grid-cols-1 gap-4">
      <div 
        v-for="order in orders" 
        :key="order.id"
        class="bg-card border rounded-[2rem] p-6 hover:border-primary/40 transition-colors group"
      >
        <div class="flex flex-col md:flex-row gap-6">
          <div class="w-full md:w-24 h-24 bg-muted rounded-2xl overflow-hidden shrink-0">
            <img v-if="order.items?.length > 0 && order.items[0]?.product" :src="order.items[0].product.images?.[0]" :alt="order.items[0].product?.name || 'Product'" class="w-full h-full object-cover" />
          </div>
          
          <div class="flex-grow space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div class="space-y-1">
                <p class="text-xs font-bold text-muted-foreground uppercase tracking-widest">{{ order.orderNumber }}</p>
                <p class="font-bold">Ordered on {{ new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }}</p>
              </div>
              
              <div class="flex items-center gap-6">
                <div class="text-right">
                  <p class="text-xs text-muted-foreground font-bold uppercase tracking-tight">Total Value</p>
                  <p class="text-lg font-bold">{{ formatCurrency(order.totalAmount) }}</p>
                </div>
                <span :class="cn(
                  'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border',
                  order.status === 'delivered' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 
                  order.status === 'shipped' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 
                  'bg-amber-500/10 text-amber-600 border-amber-500/20'
                )">
                  {{ order.status }}
                </span>
              </div>
            </div>

            <div class="flex items-center justify-between pt-4 border-t">
              <p class="text-sm text-muted-foreground">{{ order.itemCount ?? order.items?.length ?? 0 }} items in this package</p>
              <div class="flex items-center gap-2">
                <NuxtLink :to="`/my-account/orders/${order.id}`" class="inline-flex items-center justify-center rounded-full text-xs font-bold gap-1.5 px-4 py-2 hover:bg-muted transition-colors">
                    View Details <ArrowRight class="w-3 h-3" />
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
