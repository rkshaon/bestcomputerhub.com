<!-- File: /pages/track-order.vue -->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useHead, useRoute, useRouter, useRuntimeConfig, useSeoMeta } from '#app';
import { useSiteConfig } from '#imports';
import { PackageSearch, Search, AlertCircle, WifiOff, RefreshCcw, X } from 'lucide-vue-next';
import { useSalesService } from '@/composables/useSalesService';
import { extractErrorMessage } from '@/composables/useToast';
import { resolveOriginFromUrl } from '@/utils/cms';
import UiBreadcrumbs from '@/components/ui/UiBreadcrumbs.vue';
import UiButton from '@/components/ui/Button.vue';
import UiLoader from '@/components/ui/UiLoader.vue';
import TrackOrderDetails from '@/components/commerce/TrackOrderDetails.vue';
import type { TrackedOrder } from '@/types/order';

interface TrackingErrorState {
  type: 'not_found' | 'network' | 'unexpected' | 'api';
  title: string;
  message: string;
}

const route = useRoute();
const router = useRouter();
const runtimeConfig = useRuntimeConfig();
const siteConfig = useSiteConfig();
const salesService = useSalesService();

const queryInvoice = computed<string>(() => {
  const raw = route.query.invoice_number;
  const first = Array.isArray(raw) ? raw[0] : raw;
  return typeof first === 'string' ? first.trim() : '';
});

const siteOrigin = computed(() => {
  const fromSite = resolveOriginFromUrl((siteConfig as Record<string, any>)?.url);
  if (fromSite) return fromSite;
  const publicCfg = runtimeConfig.public as Record<string, any>;
  const fromAppUrl = resolveOriginFromUrl(publicCfg?.appUrl);
  if (fromAppUrl) return fromAppUrl;
  return 'https://bestcomputerhub.com';
});

useSeoMeta({
  title: 'Track Your Order',
  description: 'Check your Best Computer Hub order status, items, and totals using your invoice number.',
  robots: computed(() => (queryInvoice.value ? 'noindex, nofollow' : 'index, follow'))
});

useHead({
  link: [
    {
      rel: 'canonical',
      href: computed(() => `${siteOrigin.value}/track-order/`)
    }
  ]
});

const invoiceInput = ref<string>(queryInvoice.value);
const inputRef = ref<HTMLInputElement | null>(null);
const validationError = ref<string | null>(null);
const trackedOrder = ref<TrackedOrder | null>(null);
const errorState = ref<TrackingErrorState | null>(null);
const isLoading = ref<boolean>(Boolean(queryInvoice.value));

let activeAbortController: AbortController | null = null;
let latestRequestId = 0;
let inFlightInvoice = '';

function abortActiveRequest() {
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }
  inFlightInvoice = '';
}

function resetTrackingState() {
  abortActiveRequest();
  latestRequestId += 1;
  trackedOrder.value = null;
  errorState.value = null;
  isLoading.value = false;
}

function getHttpStatus(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const e = err as Record<string, any>;
  const candidate = e.status ?? e.statusCode ?? e.response?.status ?? e.data?.statusCode ?? e.data?.status;
  return typeof candidate === 'number' ? candidate : undefined;
}

function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as Record<string, any>;
  return e.name === 'AbortError' || e.cause?.name === 'AbortError';
}

function validateInvoiceInput(raw: string): { valid: boolean; value: string; error?: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      valid: false,
      value: '',
      error: 'Please enter your invoice number to track your order.'
    };
  }
  if (trimmed.length > 100 || /[\u0000-\u001f\u007f<>]/.test(trimmed)) {
    return {
      valid: false,
      value: trimmed,
      error: 'Please enter a valid invoice number (for example, SALE-20261013-000041).'
    };
  }
  return { valid: true, value: trimmed };
}

async function fetchTracking(invoice: string) {
  const trimmed = invoice.trim();
  if (!trimmed) {
    resetTrackingState();
    return;
  }

  if (isLoading.value && inFlightInvoice === trimmed) {
    return;
  }

  abortActiveRequest();
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  activeAbortController = controller;
  inFlightInvoice = trimmed;
  const requestId = ++latestRequestId;

  // Clear stale results and errors immediately before starting the lookup
  trackedOrder.value = null;
  errorState.value = null;
  isLoading.value = true;

  try {
    const result = await salesService.trackOrderByInvoice(trimmed, {
      signal: controller?.signal
    });
    if (requestId !== latestRequestId || controller?.signal.aborted) {
      return;
    }
    trackedOrder.value = result;
  } catch (err: unknown) {
    if (requestId !== latestRequestId || controller?.signal.aborted || isAbortError(err)) {
      return;
    }

    trackedOrder.value = null;
    const status = getHttpStatus(err);

    if (status === 404) {
      errorState.value = {
        type: 'not_found',
        title: 'Order Not Found',
        message: `We could not find an order matching invoice number "${trimmed}". Please verify the invoice number and try again.`
      };
    } else if ((err as any)?.isUnexpectedPayload) {
      errorState.value = {
        type: 'unexpected',
        title: 'Unexpected Order Response',
        message: 'We received an unexpected response while loading your order details. Please try again.'
      };
    } else if (!status) {
      errorState.value = {
        type: 'network',
        title: 'Connection Error',
        message: 'Unable to reach the order tracking service. Please check your internet connection and try again.'
      };
    } else {
      errorState.value = {
        type: 'api',
        title: 'Unable to Load Order',
        message: extractErrorMessage(err, 'Unable to load order tracking details right now. Please try again.')
      };
    }
  } finally {
    if (requestId === latestRequestId) {
      isLoading.value = false;
      inFlightInvoice = '';
      if (activeAbortController === controller) {
        activeAbortController = null;
      }
    }
  }
}

async function handleSubmit() {
  const check = validateInvoiceInput(invoiceInput.value);
  if (!check.valid) {
    validationError.value = check.error || 'Please enter a valid invoice number.';
    inputRef.value?.focus();
    return;
  }

  validationError.value = null;
  invoiceInput.value = check.value;

  if (check.value !== queryInvoice.value) {
    await router.push({
      path: '/track-order/',
      query: { invoice_number: check.value }
    });
    return;
  }

  await fetchTracking(check.value);
}

async function handleClear() {
  invoiceInput.value = '';
  validationError.value = null;
  if (queryInvoice.value) {
    await router.push({ path: '/track-order/' });
  } else {
    resetTrackingState();
  }
  inputRef.value?.focus();
}

function handleRetry() {
  const target = queryInvoice.value || invoiceInput.value.trim();
  if (target) {
    void fetchTracking(target);
  }
}

watch(invoiceInput, () => {
  if (validationError.value) {
    validationError.value = null;
  }
});

watch(queryInvoice, (nextInvoice, prevInvoice) => {
  invoiceInput.value = nextInvoice;
  validationError.value = null;

  if (!nextInvoice) {
    resetTrackingState();
    return;
  }

  if (nextInvoice !== prevInvoice) {
    void fetchTracking(nextInvoice);
  }
});

onMounted(() => {
  if (queryInvoice.value) {
    void fetchTracking(queryInvoice.value);
  }
});

onBeforeUnmount(() => {
  abortActiveRequest();
});
</script>

<template>
  <div class="min-h-screen bg-background py-6 sm:py-10">
    <div class="container mx-auto px-4 max-w-5xl space-y-6 sm:space-y-8">
      <UiBreadcrumbs :items="[{ name: 'Track Order', url: '/track-order/' }]" />

      <!-- Page Header & Search Card -->
      <section class="bg-card text-card-foreground border border-border rounded-2xl p-5 sm:p-8 shadow-sm space-y-6">
        <div class="flex items-start gap-4">
          <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <PackageSearch class="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
          </div>
          <div class="space-y-1">
            <h1 class="text-2xl sm:text-[26px] font-bold tracking-tight text-foreground">
              Track Your Order
            </h1>
            <p class="text-sm text-muted-foreground max-w-2xl">
              Enter your invoice number below to view your current order status, purchased items, and order summary. No login is required.
            </p>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-2" novalidate>
          <label for="track-invoice-input" class="block text-sm font-semibold text-foreground">
            Invoice Number
          </label>
          <div class="flex flex-col sm:flex-row gap-3">
            <div class="relative flex-1">
              <input
                id="track-invoice-input"
                ref="inputRef"
                v-model="invoiceInput"
                type="text"
                name="invoice_number"
                autocomplete="off"
                placeholder="e.g. SALE-20261013-000041"
                :aria-invalid="validationError ? 'true' : 'false'"
                :aria-describedby="validationError ? 'track-invoice-error' : 'track-invoice-hint'"
                class="w-full h-11 px-4 pr-10 rounded-xl border bg-input text-foreground placeholder:text-muted-foreground text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                :class="validationError ? 'border-destructive focus:ring-destructive/40' : 'border-input'"
              />
              <button
                v-if="invoiceInput"
                type="button"
                @click="handleClear"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Clear invoice number"
                title="Clear invoice number"
              >
                <X class="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <UiButton
              type="submit"
              variant="primary"
              :disabled="isLoading"
              :aria-busy="isLoading ? 'true' : 'false'"
              class="h-11 px-6 rounded-xl font-semibold gap-2 w-full sm:w-auto"
            >
              <Search class="w-4 h-4" aria-hidden="true" />
              <span>{{ isLoading ? 'Tracking...' : 'Track Order' }}</span>
            </UiButton>
          </div>

          <p
            v-if="validationError"
            id="track-invoice-error"
            role="alert"
            class="text-xs font-medium text-destructive pt-0.5"
          >
            {{ validationError }}
          </p>
          <p v-else id="track-invoice-hint" class="text-xs text-muted-foreground">
            Your invoice number appears on your order confirmation and invoice receipt.
          </p>
        </form>
      </section>

      <!-- Loading State -->
      <section
        v-if="isLoading"
        role="status"
        aria-live="polite"
        class="bg-card border border-border rounded-2xl p-10 sm:p-12 text-center shadow-sm"
        data-testid="track-order-loading"
      >
        <UiLoader size="md" centered show-label label="Looking up your order details..." />
      </section>

      <!-- Error / Not Found State -->
      <section
        v-else-if="errorState"
        role="alert"
        class="bg-card border rounded-2xl p-6 sm:p-8 shadow-sm"
        :class="errorState.type === 'not_found' ? 'border-border' : 'border-destructive/30'"
        data-testid="track-order-error"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-start gap-3.5">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              :class="errorState.type === 'not_found' ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'"
            >
              <WifiOff v-if="errorState.type === 'network'" class="w-5 h-5" aria-hidden="true" />
              <AlertCircle v-else class="w-5 h-5" aria-hidden="true" />
            </div>
            <div class="space-y-1">
              <h2 class="text-lg sm:text-[20px] font-bold text-foreground">{{ errorState.title }}</h2>
              <p class="text-sm text-muted-foreground leading-relaxed">{{ errorState.message }}</p>
            </div>
          </div>

          <UiButton
            v-if="errorState.type !== 'not_found'"
            type="button"
            variant="outline"
            size="sm"
            class="rounded-xl gap-1.5 shrink-0 self-start sm:self-center"
            @click="handleRetry"
          >
            <RefreshCcw class="w-3.5 h-3.5" aria-hidden="true" />
            <span>Try Again</span>
          </UiButton>
        </div>
      </section>

      <!-- Tracked Order Result -->
      <TrackOrderDetails v-else-if="trackedOrder" :order="trackedOrder" />

      <!-- Initial Empty State -->
      <section
        v-else
        class="bg-card border border-border rounded-2xl p-8 sm:p-12 text-center shadow-sm space-y-3"
        data-testid="track-order-empty"
      >
        <div class="w-12 h-12 rounded-xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
          <PackageSearch class="w-6 h-6" aria-hidden="true" />
        </div>
        <h2 class="text-lg sm:text-[20px] font-bold text-foreground">
          Ready to check your order
        </h2>
        <p class="text-sm text-muted-foreground max-w-md mx-auto">
          Enter your invoice number in the field above and click Track Order to see its current fulfillment status and item breakdown.
        </p>
      </section>
    </div>
  </div>
</template>
