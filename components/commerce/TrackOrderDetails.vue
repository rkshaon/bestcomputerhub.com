<!-- File: /components/commerce/TrackOrderDetails.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCcw,
  Receipt,
  Calendar
} from 'lucide-vue-next';
import {
  cn,
  decodeHtmlEntities,
  formatCalendarDate,
  formatDateTime,
  formatDecimalCurrency
} from '@/utils';
import { isPositiveDecimalString } from '@/utils/order';
import type { OrderStatus, TrackedOrder } from '@/types/order';

const props = defineProps<{
  order: TrackedOrder;
}>();

interface StatusStyle {
  icon: typeof Package;
  badgeClass: string;
  iconBgClass: string;
  iconColorClass: string;
}

const STATUS_STYLES: Record<OrderStatus, StatusStyle> = {
  pending: {
    icon: Clock,
    badgeClass: 'bg-warning/10 text-warning border-warning/25',
    iconBgClass: 'bg-warning/10',
    iconColorClass: 'text-warning'
  },
  confirmed: {
    icon: CheckCircle2,
    badgeClass: 'bg-info/10 text-info border-info/25',
    iconBgClass: 'bg-info/10',
    iconColorClass: 'text-info'
  },
  processing: {
    icon: Package,
    badgeClass: 'bg-primary/10 text-primary border-primary/25',
    iconBgClass: 'bg-primary/10',
    iconColorClass: 'text-primary'
  },
  packaged: {
    icon: Package,
    badgeClass: 'bg-primary/10 text-primary border-primary/25',
    iconBgClass: 'bg-primary/10',
    iconColorClass: 'text-primary'
  },
  shipped: {
    icon: Truck,
    badgeClass: 'bg-info/10 text-info border-info/25',
    iconBgClass: 'bg-info/10',
    iconColorClass: 'text-info'
  },
  out_of_delivery: {
    icon: Truck,
    badgeClass: 'bg-info/10 text-info border-info/25',
    iconBgClass: 'bg-info/10',
    iconColorClass: 'text-info'
  },
  delivered: {
    icon: CheckCircle2,
    badgeClass: 'bg-success/10 text-success border-success/25',
    iconBgClass: 'bg-success/10',
    iconColorClass: 'text-success'
  },
  returned: {
    icon: RefreshCcw,
    badgeClass: 'bg-warning/10 text-warning border-warning/25',
    iconBgClass: 'bg-warning/10',
    iconColorClass: 'text-warning'
  },
  cancelled: {
    icon: AlertCircle,
    badgeClass: 'bg-destructive/10 text-destructive border-destructive/25',
    iconBgClass: 'bg-destructive/10',
    iconColorClass: 'text-destructive'
  },
  refunded: {
    icon: RefreshCcw,
    badgeClass: 'bg-secondary text-secondary-foreground border-border',
    iconBgClass: 'bg-secondary',
    iconColorClass: 'text-secondary-foreground'
  }
};

const statusStyle = computed<StatusStyle>(() => {
  return STATUS_STYLES[props.order.status] || STATUS_STYLES.pending;
});

const formattedSaleDate = computed(() => formatCalendarDate(props.order.saleDate));
const formattedCreatedAt = computed(() => formatDateTime(props.order.createdAt));
const hasDiscount = computed(() => isPositiveDecimalString(props.order.discountAmount));
</script>

<template>
  <div class="space-y-6" data-testid="tracked-order-details">
    <!-- Order Information Card -->
    <section
      class="bg-card text-card-foreground border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-5"
      aria-labelledby="track-order-info-heading"
    >
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div class="flex items-start sm:items-center gap-3.5">
          <div :class="cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', statusStyle.iconBgClass)">
            <component :is="statusStyle.icon" :class="cn('w-5 h-5', statusStyle.iconColorClass)" aria-hidden="true" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoice Number</p>
            <h2
              id="track-order-info-heading"
              class="text-xl sm:text-[24px] font-bold text-foreground tracking-tight break-all"
              data-testid="tracked-invoice-number"
            >
              {{ order.invoiceNumber }}
            </h2>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 sm:justify-end">
          <span
            :class="cn(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border',
              statusStyle.badgeClass
            )"
            data-testid="tracked-status-label"
          >
            <span>{{ order.statusLabel }}</span>
            <span
              v-if="order.rawStatus"
              class="opacity-75 font-mono text-[11px] uppercase"
              data-testid="tracked-status-code"
            >
              ({{ order.rawStatus }})
            </span>
          </span>
        </div>
      </div>

      <div>
        <h3 class="text-base sm:text-[20px] font-bold text-foreground mb-3">Order Information</h3>
        <dl class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="rounded-xl bg-muted/40 border border-border/70 p-3.5">
            <dt class="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Receipt class="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Status</span>
            </dt>
            <dd class="mt-1 text-sm font-semibold text-foreground">
              {{ order.statusLabel }}
              <span v-if="order.rawStatus" class="text-xs font-normal text-muted-foreground ml-1">
                [{{ order.rawStatus }}]
              </span>
            </dd>
          </div>

          <div class="rounded-xl bg-muted/40 border border-border/70 p-3.5">
            <dt class="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Calendar class="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Order Date</span>
            </dt>
            <dd class="mt-1 text-sm font-semibold text-foreground" data-testid="tracked-sale-date">
              {{ formattedSaleDate }}
            </dd>
          </div>

          <div class="rounded-xl bg-muted/40 border border-border/70 p-3.5">
            <dt class="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Clock class="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Placed At</span>
            </dt>
            <dd class="mt-1 text-sm font-semibold text-foreground" data-testid="tracked-created-at">
              {{ formattedCreatedAt }}
            </dd>
          </div>

          <div
            v-if="order.shippingMethodLabel"
            class="rounded-xl bg-muted/40 border border-border/70 p-3.5"
            data-testid="tracked-shipping-method"
          >
            <dt class="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Truck class="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Shipping Method</span>
            </dt>
            <dd class="mt-1 text-sm font-semibold text-foreground">
              {{ order.shippingMethodLabel }}
            </dd>
          </div>
        </dl>
      </div>
    </section>

    <!-- Items & Summary Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Order Items -->
      <section
        class="lg:col-span-8 bg-card text-card-foreground border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4"
        aria-labelledby="track-order-items-heading"
      >
        <div class="flex items-center justify-between gap-2 pb-3 border-b border-border">
          <h3 id="track-order-items-heading" class="text-base sm:text-[20px] font-bold text-foreground">
            Order Items ({{ order.items.length }})
          </h3>
        </div>

        <div v-if="order.items.length === 0" class="py-8 text-center text-sm text-muted-foreground">
          No items were listed for this order.
        </div>

        <template v-else>
          <!-- Desktop Table -->
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr class="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th scope="col" class="py-2.5 pr-4">Product</th>
                  <th scope="col" class="py-2.5 px-3">SKU</th>
                  <th scope="col" class="py-2.5 px-3 text-right">Qty</th>
                  <th scope="col" class="py-2.5 px-3 text-right">Unit Price</th>
                  <th scope="col" class="py-2.5 pl-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border/70">
                <tr v-for="(item, index) in order.items" :key="`${item.sku}-${index}`" data-testid="tracked-order-item-row">
                  <td class="py-3.5 pr-4 align-top">
                    <p class="font-semibold text-foreground leading-snug">
                      {{ decodeHtmlEntities(item.productName) }}
                    </p>
                    <p v-if="item.variantName" class="text-xs text-muted-foreground mt-0.5">
                      Variant: {{ decodeHtmlEntities(item.variantName) }}
                    </p>
                  </td>
                  <td class="py-3.5 px-3 align-top font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {{ item.sku }}
                  </td>
                  <td class="py-3.5 px-3 align-top text-right font-medium text-foreground whitespace-nowrap">
                    {{ item.quantity }}
                  </td>
                  <td class="py-3.5 px-3 align-top text-right text-muted-foreground whitespace-nowrap">
                    {{ formatDecimalCurrency(item.unitPrice) }}
                  </td>
                  <td class="py-3.5 pl-3 align-top text-right font-semibold text-foreground whitespace-nowrap">
                    {{ formatDecimalCurrency(item.lineTotal) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile Stacked Cards -->
          <div class="md:hidden divide-y divide-border/70">
            <div
              v-for="(item, index) in order.items"
              :key="`mobile-${item.sku}-${index}`"
              class="py-3.5 first:pt-1 last:pb-1 space-y-2"
              data-testid="tracked-order-item-mobile"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="font-semibold text-sm text-foreground leading-snug">
                    {{ decodeHtmlEntities(item.productName) }}
                  </p>
                  <p v-if="item.variantName" class="text-xs text-muted-foreground mt-0.5">
                    Variant: {{ decodeHtmlEntities(item.variantName) }}
                  </p>
                  <p class="text-xs font-mono text-muted-foreground mt-1">
                    SKU: {{ item.sku }}
                  </p>
                </div>
                <p class="font-bold text-sm text-foreground shrink-0">
                  {{ formatDecimalCurrency(item.lineTotal) }}
                </p>
              </div>
              <div class="flex items-center justify-between text-xs text-muted-foreground">
                <span>Qty: {{ item.quantity }}</span>
                <span>Unit Price: {{ formatDecimalCurrency(item.unitPrice) }}</span>
              </div>
            </div>
          </div>
        </template>
      </section>

      <!-- Order Summary -->
      <section
        class="lg:col-span-4 bg-card text-card-foreground border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4"
        aria-labelledby="track-order-summary-heading"
      >
        <h3 id="track-order-summary-heading" class="text-base sm:text-[20px] font-bold text-foreground pb-3 border-b border-border">
          Order Summary
        </h3>

        <dl class="space-y-2.5 text-sm">
          <div class="flex items-center justify-between gap-4">
            <dt class="text-muted-foreground">Subtotal</dt>
            <dd class="font-medium text-foreground" data-testid="tracked-subtotal">
              {{ formatDecimalCurrency(order.subtotalAmount) }}
            </dd>
          </div>
          <div class="flex items-center justify-between gap-4">
            <dt class="text-muted-foreground">Discount</dt>
            <dd class="font-medium text-foreground" data-testid="tracked-discount">
              {{ hasDiscount ? `-${formatDecimalCurrency(order.discountAmount)}` : formatDecimalCurrency(order.discountAmount) }}
            </dd>
          </div>
          <div class="flex items-center justify-between gap-4">
            <dt class="text-muted-foreground">Tax</dt>
            <dd class="font-medium text-foreground" data-testid="tracked-tax">
              {{ formatDecimalCurrency(order.taxAmount) }}
            </dd>
          </div>
          <div class="flex items-center justify-between gap-4">
            <dt class="text-muted-foreground">Shipping</dt>
            <dd class="font-medium text-foreground" data-testid="tracked-shipping">
              {{ formatDecimalCurrency(order.shippingAmount) }}
            </dd>
          </div>
          <div class="flex items-center justify-between gap-4 pt-3 border-t border-border text-base">
            <dt class="font-bold text-foreground">Total</dt>
            <dd class="font-bold text-primary text-lg" data-testid="tracked-total">
              {{ formatDecimalCurrency(order.totalAmount) }}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  </div>
</template>
