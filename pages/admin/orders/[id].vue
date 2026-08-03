<!-- File: /pages/admin/orders/[id].vue -->
<script setup lang="ts">
import { markRaw } from 'vue';
import { 
  ChevronLeft, 
  Printer, 
  Mail, 
  Truck, 
  CheckCircle2, 
  Clock, 
  CreditCard,
  User,
  MapPin,
  ExternalLink,
  Package,
  AlertCircle,
  FileText
} from 'lucide-vue-next';
import { useAdminStore } from '@/stores/admin';
import { formatCurrency, cn } from '@/utils';
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

const statusConfig = {
  pending: { icon: markRaw(Clock), color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-100 dark:border-amber-900', label: 'Awaiting Fulfillment' },
  processing: { icon: markRaw(Package), color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-100 dark:border-blue-900', label: 'Hardware Preparation' },
  shipped: { icon: markRaw(Truck), color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/20', border: 'border-indigo-100 dark:border-indigo-900', label: 'In Transit' },
  delivered: { icon: markRaw(CheckCircle2), color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-100 dark:border-emerald-900', label: 'Deployment Complete' },
  cancelled: { icon: markRaw(AlertCircle), color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/20', border: 'border-rose-100 dark:border-rose-900', label: 'Operational Void' },
  refunded: { icon: markRaw(CreditCard), color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-950/20', border: 'border-slate-100 dark:border-slate-900', label: 'Capital Reversal' },
};

const timeline = [
  { status: 'Order Placed', date: order.value?.createdAt, completed: true },
  { status: 'Payment Verified', date: order.value?.createdAt, completed: true },
  { status: 'Hardware Allocated', date: null, completed: order.value?.status !== 'pending' },
  { status: 'Shipping Dispatched', date: null, completed: ['shipped', 'delivered'].includes(order.value?.status || '') },
];
</script>

<template>
  <div v-if="order" class="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="flex items-center gap-4">
        <NuxtLink to="/admin/orders" class="w-10 h-10 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-900 transition-all">
          <ChevronLeft class="w-5 h-5" />
        </NuxtLink>
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[10px] uppercase font-bold tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-md">Protocol: {{ order.orderNumber }}</span>
            <span class="text-[10px] uppercase font-bold tracking-widest text-slate-400">Transaction Registry</span>
          </div>
          <h1 class="text-3xl font-display font-extrabold tracking-tight">Order Details</h1>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
          <Printer class="w-4 h-4" /> Print Manifest
        </button>
        <div class="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>
        <button class="bg-primary text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
          Update Status
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left Column: Items & Timeline -->
      <div class="lg:col-span-2 space-y-8">
        <!-- Status Banner -->
        <div :class="cn(
          'p-6 rounded-[2rem] border flex items-center justify-between',
          statusConfig[order.status].bg,
          statusConfig[order.status].border
        )">
          <div class="flex items-center gap-5">
            <div :class="cn('w-12 h-12 rounded-2xl flex items-center justify-center', statusConfig[order.status].bg.replace('50', '200'))">
              <component :is="statusConfig[order.status].icon" :class="cn('w-6 h-6', statusConfig[order.status].color)" />
            </div>
            <div>
              <p class="text-[10px] font-bold uppercase tracking-widest opacity-60">Fulfillment State</p>
              <h3 :class="cn('text-xl font-display font-black tracking-tight', statusConfig[order.status].color)">
                {{ statusConfig[order.status].label }}
              </h3>
            </div>
          </div>
          <div class="text-right hidden sm:block">
            <p class="text-xs font-bold opacity-60 uppercase tracking-widest">Update Efficiency</p>
            <p class="text-xs font-bold">Latency: 24ms</p>
          </div>
        </div>

        <!-- Line Items -->
        <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div class="px-8 py-6 border-b border-slate-100 dark:border-slate-900">
             <h3 class="text-lg font-display font-bold flex items-center gap-3">
               <Package class="w-5 h-5 text-primary" /> Manifest Allocation
             </h3>
          </div>
          <div class="p-0">
            <table class="w-full text-left">
              <thead>
                <tr class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 bg-slate-50/50 dark:bg-slate-900/30">
                  <th class="px-8 py-4">Resource Identification</th>
                  <th class="px-8 py-4 text-center">Qty</th>
                  <th class="px-8 py-4 text-right">Unit Capital</th>
                  <th class="px-8 py-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50 dark:divide-slate-900">
                <tr v-for="i in 3" :key="i" class="group transition-colors hover:bg-slate-50/30">
                  <td class="px-8 py-5">
                    <div class="flex items-center gap-4">
                       <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center grow-0 shrink-0">
                          <Package class="w-6 h-6 text-slate-400" />
                       </div>
                       <div>
                          <p class="text-sm font-bold">Hardware Module-X{{ i }}</p>
                          <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Type: Enterprise Hardware</p>
                       </div>
                    </div>
                  </td>
                  <td class="px-8 py-5 text-center text-sm font-bold">1</td>
                  <td class="px-8 py-5 text-right text-sm font-medium">{{ formatCurrency(order.totalAmount / 3) }}</td>
                  <td class="px-8 py-5 text-right text-sm font-bold">{{ formatCurrency(order.totalAmount / 3) }}</td>
                </tr>
              </tbody>
              <tfoot>
                 <tr class="bg-slate-50/50 dark:bg-slate-900/30">
                    <td colspan="3" class="px-8 py-4 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Cumulative Total</td>
                    <td class="px-8 py-4 text-right text-lg font-black tracking-tight text-primary">{{ formatCurrency(order.totalAmount) }}</td>
                 </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- Right Column: Customer & Shipping -->
      <div class="space-y-8">
        <!-- Customer Intelligence Card -->
        <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
           <div class="flex items-center gap-4 mb-8">
              <div class="w-12 h-12 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center font-black text-primary">
                 {{ order.customerName.split(' ').map(n => n[0]).join('') }}
              </div>
              <div>
                 <h3 class="text-lg font-display font-bold leading-tight">{{ order.customerName }}</h3>
                 <NuxtLink to="/admin/customers" class="text-[10px] text-primary uppercase font-bold tracking-widest flex items-center gap-1 hover:underline">
                   View Profile <ExternalLink class="w-2.5 h-2.5" />
                 </NuxtLink>
              </div>
           </div>

           <div class="space-y-6">
              <div class="flex items-start gap-3">
                 <div class="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center shrink-0">
                    <Mail class="w-4 h-4 text-slate-400" />
                 </div>
                 <div class="flex-1 min-w-0">
                    <p class="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-0.5">Communication</p>
                    <p class="text-sm font-bold truncate">client.protocol@enterprise.com</p>
                 </div>
              </div>
              <div class="flex items-start gap-3">
                 <div class="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center shrink-0">
                    <MapPin class="w-4 h-4 text-slate-400" />
                 </div>
                 <div class="flex-1 min-w-0">
                    <p class="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-0.5">Deployment node</p>
                    <p class="text-sm font-medium leading-relaxed">
                      {{ order.shippingAddress.street }}<br/>
                      {{ order.shippingAddress.city }}, {{ order.shippingAddress.zipCode }}<br/>
                      {{ order.shippingAddress.country }}
                    </p>
                 </div>
              </div>
           </div>
        </div>

        <!-- Payment Analysis -->
        <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
           <h3 class="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 mb-6">
             Capital Settlement
           </h3>
           <div class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <div class="flex items-center justify-between mb-4">
                 <CreditCard class="w-5 h-5 text-slate-400" />
                 <span :class="cn(
                   'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest',
                   order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                 )">{{ order.paymentStatus }}</span>
              </div>
              <div class="space-y-1">
                 <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Electronic Transaction ID</p>
                 <p class="text-xs font-mono font-bold">{{ order.id.toUpperCase() }}-SECURE</p>
              </div>
           </div>
           
           <div class="mt-6 pt-6 border-t border-slate-100 dark:border-slate-900 space-y-3">
              <div class="flex justify-between text-xs">
                 <span class="text-slate-500">Subtotal</span>
                 <span class="font-bold">{{ formatCurrency(order.totalAmount * 0.9) }}</span>
              </div>
              <div class="flex justify-between text-xs">
                 <span class="text-slate-500">Logistics Cost</span>
                 <span class="font-bold">{{ formatCurrency(order.totalAmount * 0.05) }}</span>
              </div>
              <div class="flex justify-between text-xs">
                 <span class="text-slate-500">Federal Tax</span>
                 <span class="font-bold">{{ formatCurrency(order.totalAmount * 0.05) }}</span>
              </div>
              <div class="flex justify-between pt-3 text-sm border-t border-slate-50 dark:border-slate-800">
                 <span class="font-black text-slate-400 uppercase tracking-widest text-[10px] mt-1">Settled Net</span>
                 <span class="text-lg font-black tracking-tight">{{ formatCurrency(order.totalAmount) }}</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  </div>
</template>
