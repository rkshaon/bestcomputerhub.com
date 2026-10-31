<!-- File: /components/commerce/OrderDetailView.vue -->
<script setup lang="ts">
import { 
  Truck, 
  CheckCircle2, 
  Clock, 
  CreditCard,
  MapPin,
  Package,
  AlertCircle
} from 'lucide-vue-next';
import { formatCurrency, cn, decodeHtmlEntities } from '@/utils';
import type { Order } from '@/types/order';

const props = defineProps<{
  order: Order;
}>();

defineEmits<{
  (e: 'cancel'): void;
}>();

const statusConfig = {
  pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Awaiting Confirmation' },
  confirmed: { icon: CheckCircle2, color: 'text-sky-600', bg: 'bg-sky-50', label: 'Confirmed' },
  processing: { icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Processing' },
  packaged: { icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Packaged' },
  shipped: { icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'In Transit' },
  out_of_delivery: { icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Out for Delivery' },
  delivered: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Delivered' },
  cancelled: { icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', label: 'Cancelled' },
  refunded: { icon: CreditCard, color: 'text-slate-600', bg: 'bg-slate-50', label: 'Refunded' },
};

const currentStatus = computed(() => {
  const st = props.order?.status || 'pending';
  return statusConfig[st as keyof typeof statusConfig] || statusConfig.pending;
});
</script>

<template>
  <div class="space-y-8" v-if="order">
    <div :class="cn('p-6 rounded-[2rem] border flex items-center justify-between', currentStatus.bg)">
      <div class="flex items-center gap-5">
        <div :class="cn('w-12 h-12 rounded-2xl flex items-center justify-center bg-white')">
          <component :is="currentStatus.icon" :class="cn('w-6 h-6', currentStatus.color)" />
        </div>
        <div>
          <p class="text-[10px] font-bold uppercase tracking-widest opacity-60">Status</p>
          <h3 :class="cn('text-xl font-display font-black', currentStatus.color)">
            {{ currentStatus.label }}
          </h3>
        </div>
      </div>
    </div>

    <div class="bg-card border rounded-[2rem] p-8 shadow-sm space-y-6">
      <h3 class="text-lg font-bold border-b pb-4">Order Items</h3>
      <div v-for="item in (order.items || [])" :key="item.id" class="flex gap-4">
        <div class="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
          <Package class="w-6 h-6 text-muted-foreground" />
        </div>
        <div class="flex-grow">
          <p class="font-bold text-sm">{{ decodeHtmlEntities(item.product?.name || 'Product') }}</p>
          <p class="text-xs text-muted-foreground">SKU: {{ item.sku || 'N/A' }} | Qty: {{ item.quantity }}</p>
        </div>
        <div class="text-right">
          <p class="font-bold text-sm">{{ formatCurrency(item.lineTotal || 0) }}</p>
          <p class="text-[10px] text-muted-foreground">@ {{ formatCurrency(item.price || 0) }}</p>
        </div>
      </div>
      <div class="space-y-2 pt-4 border-t text-sm">
        <div class="flex justify-between text-muted-foreground"><p>Subtotal</p><p>{{ formatCurrency(order.subtotal || 0) }}</p></div>
        <div class="flex justify-between text-muted-foreground"><p>Shipping</p><p>{{ formatCurrency(order.shippingCharge || 0) }}</p></div>
        <div class="flex justify-between text-muted-foreground"><p>Discount</p><p>-{{ formatCurrency(order.discountTotal || 0) }}</p></div>
        <div class="flex justify-between text-muted-foreground"><p>Tax</p><p>{{ formatCurrency(order.taxTotal || 0) }}</p></div>
        <div class="flex justify-between font-black text-lg pt-2"><p>Grand Total</p><p>{{ formatCurrency(order.totalAmount || 0) }}</p></div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="bg-card border rounded-[2rem] p-8 shadow-sm space-y-4">
        <h3 class="text-lg font-bold">Shipping Information</h3>
        <div class="text-sm text-muted-foreground" v-if="order.shippingAddress">
          <p class="font-bold text-foreground">{{ order.shippingAddress.firstName }} {{ order.shippingAddress.lastName }}</p>
          <p>{{ order.shippingAddress.street }}</p>
          <p>{{ order.shippingAddress.city }}, {{ order.shippingAddress.zipCode }}</p>
          <p>{{ order.shippingAddress.country }}</p>
          <p class="mt-2">{{ order.shippingAddress.phone }}</p>
        </div>
        <p class="text-sm font-bold mt-4">Shipping Method: <span class="font-normal">{{ order.shippingMethod?.name || 'Standard' }}</span></p>
      </div>
      <div class="bg-card border rounded-[2rem] p-8 shadow-sm space-y-4">
        <h3 class="text-lg font-bold">Payment Information</h3>
        <p class="text-sm font-bold text-muted-foreground">Status: <span class="text-foreground uppercase">{{ order.paymentStatus }}</span></p>
      </div>
    </div>
    
    <div v-if="order.notes" class="bg-card border rounded-[2rem] p-8 shadow-sm space-y-2">
        <h3 class="text-lg font-bold">Order Notes</h3>
        <p class="text-sm text-muted-foreground">{{ order.notes }}</p>
    </div>
  </div>
</template>
