// File: /utils/order.ts
// Pure normalizers from the backend storefront order contract
// (ZayrahLife-Backend/docs/checkout-api.md) to the frontend `Order` model.
import type {
  Order,
  OrderItem,
  OrderStatus,
  OrderPaymentStatus,
  OrderStatusOption,
  TrackedOrder,
  TrackedOrderItem
} from '@/types/order';
import type {
  ApiMoney,
  BackendOrderDetail,
  BackendOrderItem,
  BackendOrderSummary
} from '@/types/checkout';

/** Converts a backend money value (number or decimal string) to a finite number. */
export function toMoney(value: ApiMoney | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value !== 'number' && typeof value !== 'string') return 0;
  const parsed = typeof value === 'string' ? Number(value.trim()) : value;
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Calculates the percentage of total revenue represented by delivered orders:
 * `delivered_order_amount / total_revenue * 100`.
 * Safely handles string/number/missing inputs and prevents division by zero or non-finite results.
 */
export function calculateDeliveredRevenuePercentage(
  deliveredOrderAmount: number | string | null | undefined,
  totalRevenue: number | string | null | undefined
): number {
  const total = toMoney(totalRevenue);
  if (total <= 0) return 0;
  const delivered = toMoney(deliveredOrderAmount);
  const rawPercentage = (delivered / total) * 100;
  if (!Number.isFinite(rawPercentage)) return 0;
  const rounded = Math.round(rawPercentage * 10) / 10;
  return Object.is(rounded, -0) ? 0 : rounded;
}

/** Formats the delivered revenue percentage as a clean display string (e.g., `75%`, `33.3%`, `0%`). */
export function formatDeliveredRevenuePercentage(
  deliveredOrderAmount: number | string | null | undefined,
  totalRevenue: number | string | null | undefined
): string {
  return `${calculateDeliveredRevenuePercentage(deliveredOrderAmount, totalRevenue)}%`;
}

/**
 * Normalizes a percentage comparison metric (`number | string | null | undefined`) for badge display.
 * Returns `undefined` when missing/empty/non-finite so unavailable comparisons are not shown as `+0%`,
 * while preserving legitimate numeric `0` values.
 */
export function normalizeComparisonGrowth(
  value: number | string | null | undefined
): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== 'number' && typeof value !== 'string') return undefined;
  const trimmed = typeof value === 'string' ? value.trim() : value;
  if (trimmed === '') return undefined;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return undefined;
  return Object.is(parsed, -0) ? 0 : parsed;
}

function getCustomerName(customer: BackendOrderDetail['customer']): string {
  if (!customer) return 'Guest';
  if (customer.full_name && customer.full_name.trim()) return customer.full_name.trim();
  const names = [customer.first_name, customer.middle_name, customer.last_name].filter(Boolean);
  if (names.length > 0) return names.filter((n): n is string => typeof n === 'string').map(n => n.trim()).join(' ');
  return 'Guest';
}

/** Lower-cases a backend status (`OUT_OF_DELIVERY` → `out_of_delivery`). */
export function normalizeOrderStatus(status: string | null | undefined): OrderStatus {
  const normalized = String(status ?? '').trim().toLowerCase();
  return (normalized || 'pending') as OrderStatus;
}

export function normalizePaymentStatus(status: string | null | undefined): OrderPaymentStatus {
  return String(status || 'UNPAID').toLowerCase() as OrderPaymentStatus;
}

function normalizeSlug(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const cleaned = value.trim().replace(/^\/+|\/+$/g, '');
  return cleaned || undefined;
}

function extractOrderItemProductName(item: BackendOrderItem): string {
  const variantProduct = item.product_variant?.product;
  if (typeof variantProduct === 'string' && variantProduct.trim()) {
    return variantProduct;
  }
  if (
    variantProduct &&
    typeof variantProduct === 'object' &&
    typeof variantProduct.name === 'string' &&
    variantProduct.name.trim()
  ) {
    return variantProduct.name;
  }
  if (item.product_variant?.name) {
    return item.product_variant.name;
  }
  if (
    item.product &&
    typeof item.product === 'object' &&
    typeof item.product.name === 'string' &&
    item.product.name.trim()
  ) {
    return item.product.name;
  }
  return item.product_name;
}

function extractOrderItemProductSlug(item: BackendOrderItem): string | undefined {
  const variantProduct = item.product_variant?.product;
  const nestedVariantProductSlug =
    variantProduct && typeof variantProduct === 'object' ? variantProduct.slug : undefined;
  const nestedItemProductSlug =
    item.product && typeof item.product === 'object' ? item.product.slug : undefined;

  return (
    normalizeSlug(item.product_slug) ||
    normalizeSlug(item.product_variant?.product_slug) ||
    normalizeSlug(nestedVariantProductSlug) ||
    normalizeSlug(nestedItemProductSlug) ||
    normalizeSlug(item.slug) ||
    normalizeSlug(item.product_variant?.slug)
  );
}

function mapOrderItem(item: BackendOrderItem): OrderItem {
  const unitPrice = toMoney(item.unit_price);
  const variantId = item.product_variant?.id;
  const slug = extractOrderItemProductSlug(item);
  return {
    id: String(item.id),
    productId: variantId !== undefined && variantId !== null ? String(variantId) : '',
    product: {
      id: variantId !== undefined && variantId !== null ? String(variantId) : '',
      name: extractOrderItemProductName(item),
      ...(slug ? { slug } : {}),
      price: unitPrice,
      images: []
    },
    quantity: item.quantity,
    price: unitPrice,
    lineTotal: toMoney(item.line_total),
    sku: item.product_variant?.sku || undefined
  };
}

/** Maps `GET /api/v1/orders/{id}/` or the `POST /checkout/confirm/` body. */
export function mapOrderDetail(raw: BackendOrderDetail): Order {
  const address = raw.shipping_address;
  const items = Array.isArray(raw.items) ? raw.items.map(mapOrderItem) : [];
  return {
    id: String(raw.id),
    orderNumber: raw.invoice_number || `#${raw.id}`,
    customerId: raw.customer?.id !== undefined ? String(raw.customer.id) : '',
    customerName: getCustomerName(raw.customer),
    customerEmail: raw.customer?.email ?? undefined,
    customerPhone: raw.customer?.phone ?? undefined,
    customerType: raw.customer?.type ?? undefined,
    customerStatus: raw.customer?.status ?? undefined,
    customerNotes: raw.customer?.notes ?? undefined,
    items,
    itemCount: items.length,
    subtotal: toMoney(raw.subtotal_amount),
    shippingCharge: toMoney(raw.shipping_amount),
    discountTotal: toMoney(raw.discount_amount),
    taxTotal: toMoney(raw.tax_amount),
    totalAmount: toMoney(raw.total_amount),
    accounting: raw.accounting_transaction ? {
      account: { name: raw.account?.name || 'N/A', type: raw.account?.account_type || 'N/A' },
      transaction: { no: raw.accounting_transaction.transaction_no, type: raw.accounting_transaction.transaction_type, status: raw.accounting_transaction.status, reference: raw.accounting_transaction.reference }
    } : undefined,
    status: normalizeOrderStatus(raw.status),
    paymentStatus: normalizePaymentStatus(raw.payment_status),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    notes: raw.notes ?? '',
    shippingAddress: address
      ? {
          firstName: address.first_name,
          lastName: address.last_name,
          company: address.company,
          street: address.address_1,
          street2: address.address_2,
          city: address.city,
          state: address.state,
          zipCode: address.postcode,
          country: address.country,
          phone: address.phone
        }
      : null,
    shippingMethod: raw.shipping_method
      ? {
          id: String(raw.shipping_method.id),
          name: raw.shipping_method.name,
          code: raw.shipping_method.code
        }
      : null,
    allowedNextStatuses: Array.isArray(raw.allowed_next_statuses)
      ? raw.allowed_next_statuses.map((s) => ({ value: normalizeOrderStatus(s.value), label: s.label }))
      : []
  };
}

/** Maps one row of `GET /api/v1/orders/` (no items or address). */
export function mapOrderSummary(raw: BackendOrderSummary): Order {
  return {
    id: String(raw.id),
    orderNumber: raw.invoice_number || `#${raw.id}`,
    createdAt: raw.sale_date || raw.created_at,
    updatedAt: raw.sale_date || raw.created_at,
    notes: '',
    shippingAddress: null,
    shippingMethod: null,
    allowedNextStatuses: [],
    customerId: '',
    customerName: raw.customer?.full_name?.trim() || raw.customer?.user?.username || 'Guest',
    items: [],
    // If itemCount is not provided (0), it might be missing from API response.
    // Displaying 0 is the current fallback.
    itemCount: Number(raw.item_count),
    subtotal: 0,
    shippingCharge: 0,
    discountTotal: 0,
    taxTotal: 0,
    totalAmount: toMoney(raw.total_amount),
    status: normalizeOrderStatus(raw.status),
    paymentStatus: normalizePaymentStatus(raw.payment_status)
  };
}

/**
 * Resolves available next status options for an order from `/api/v1/sales/statuses/`
 * (`statuses` + `transitions`), preserving uppercase backend status values and
 * handling every order state case-insensitively.
 */
export function getAvailableOrderStatusOptions(params: {
  currentStatus: string;
  statuses?: OrderStatusOption[];
  transitions?: Record<string, string[]>;
  fallbackNextStatuses?: OrderStatusOption[];
}): OrderStatusOption[] {
  const { currentStatus, statuses = [], transitions, fallbackNextStatuses = [] } = params;
  const currentLower = String(currentStatus || '').trim().toLowerCase();

  if (statuses.length > 0) {
    if (transitions && Object.keys(transitions).length > 0) {
      const transitionKey = Object.keys(transitions).find(
        (key) => key.trim().toLowerCase() === currentLower
      );
      if (transitionKey) {
        const allowedTargets = Array.isArray(transitions[transitionKey]) ? transitions[transitionKey] : [];
        const allowedLower = new Set(allowedTargets.map((target) => String(target).trim().toLowerCase()));
        const statusByLower = new Map(
          statuses.map((option) => [
            String(option.value).trim().toLowerCase(),
            { ...option, value: String(option.value).trim().toUpperCase() }
          ])
        );

        const matchedFromStatuses = statuses
          .filter((option) => allowedLower.has(String(option.value).trim().toLowerCase()))
          .map((option) => ({
            ...option,
            value: String(option.value).trim().toUpperCase()
          }));

        for (const target of allowedTargets) {
          const targetLower = String(target).trim().toLowerCase();
          if (!statusByLower.has(targetLower) && targetLower !== currentLower) {
            matchedFromStatuses.push({
              value: String(target).trim().toUpperCase(),
              label: String(target)
            });
          }
        }

        return matchedFromStatuses;
      }
    }

    return statuses
      .filter((option) => String(option.value).trim().toLowerCase() !== currentLower)
      .map((option) => ({
        ...option,
        value: String(option.value).trim().toUpperCase()
      }));
  }

  return fallbackNextStatuses.map((option) => ({
    ...option,
    value: String(option.value).trim().toUpperCase()
  }));
}

function normalizeDecimalString(value: unknown, fallback = '0.00'): string {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : fallback;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(trimmed)) {
      return trimmed;
    }
  }
  return fallback;
}

/** Checks whether a decimal string or number represents a value strictly greater than zero. */
export function isPositiveDecimalString(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined) return false;
  const raw = typeof value === 'number' ? (Number.isFinite(value) ? String(value) : '') : String(value).trim();
  if (!raw) return false;
  const match = raw.match(/^([+-])?(?:(\d+)(?:\.(\d*))?|\.(\d+))$/);
  if (!match || match[1] === '-') return false;
  const intDigits = match[2] ?? '0';
  const fracDigits = match[3] ?? match[4] ?? '';
  return /[1-9]/.test(intDigits) || /[1-9]/.test(fracDigits);
}

/** Extracts a human-readable shipping method label from `shipping_method_snapshot`. */
export function extractShippingMethodSnapshotLabel(snapshot: unknown): string | null {
  if (typeof snapshot === 'string') {
    const trimmed = snapshot.trim();
    return trimmed || null;
  }
  if (snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot)) {
    const record = snapshot as Record<string, unknown>;
    for (const key of ['name', 'title', 'label', 'code']) {
      const candidate = record[key];
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }
  }
  return null;
}

function formatFallbackStatusLabel(status: string | null | undefined): string {
  const cleaned = String(status ?? '').trim();
  if (!cleaned) return 'Pending';
  return cleaned
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Validates and normalizes `GET /api/v1/sales/track/{invoice_number}/` responses.
 * Throws an error with `isUnexpectedPayload = true` on empty or malformed payloads.
 */
export function mapTrackedOrder(raw: unknown, requestedInvoice?: string): TrackedOrder {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    const err = new Error('Received an unexpected order tracking response.') as Error & { isUnexpectedPayload?: boolean };
    err.isUnexpectedPayload = true;
    throw err;
  }

  const record = raw as Record<string, unknown>;
  const hasInvoice = typeof record.invoice_number === 'string' && record.invoice_number.trim().length > 0;
  const hasStatusLabel = typeof record.status_label === 'string' && record.status_label.trim().length > 0;
  const hasStatus = typeof record.status === 'string' && record.status.trim().length > 0;
  const hasItems = Array.isArray(record.items);

  if (!hasItems || (!hasInvoice && !hasStatusLabel && !hasStatus)) {
    const err = new Error('Received an unexpected order tracking response.') as Error & { isUnexpectedPayload?: boolean };
    err.isUnexpectedPayload = true;
    throw err;
  }

  const items: TrackedOrderItem[] = (record.items as unknown[]).map((rawItem) => {
    const item = rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem)
      ? (rawItem as Record<string, unknown>)
      : {};
    const productName = typeof item.product_name === 'string' && item.product_name.trim()
      ? item.product_name.trim()
      : 'Product';
    const variantName = typeof item.variant_name === 'string' && item.variant_name.trim()
      ? item.variant_name.trim()
      : null;
    const sku = typeof item.sku === 'string' && item.sku.trim() ? item.sku.trim() : 'N/A';
    const parsedQty = typeof item.quantity === 'number' ? item.quantity : Number(item.quantity);
    const quantity = Number.isFinite(parsedQty) && parsedQty >= 0 ? Math.trunc(parsedQty) : 0;

    return {
      productName,
      variantName,
      sku,
      quantity,
      unitPrice: normalizeDecimalString(item.unit_price),
      lineTotal: normalizeDecimalString(item.line_total)
    };
  });

  const rawStatus = typeof record.status === 'string' ? record.status.trim() : '';
  const status = normalizeOrderStatus(rawStatus);
  const statusLabel = typeof record.status_label === 'string' && record.status_label.trim()
    ? record.status_label.trim()
    : formatFallbackStatusLabel(rawStatus);
  const invoiceNumber = typeof record.invoice_number === 'string' && record.invoice_number.trim()
    ? record.invoice_number.trim()
    : (requestedInvoice?.trim() || 'N/A');

  return {
    invoiceNumber,
    saleDate: typeof record.sale_date === 'string' ? record.sale_date.trim() : '',
    createdAt: typeof record.created_at === 'string' ? record.created_at.trim() : '',
    status,
    rawStatus: rawStatus || status.toUpperCase(),
    statusLabel,
    subtotalAmount: normalizeDecimalString(record.subtotal_amount),
    discountAmount: normalizeDecimalString(record.discount_amount),
    taxAmount: normalizeDecimalString(record.tax_amount),
    shippingAmount: normalizeDecimalString(record.shipping_amount),
    totalAmount: normalizeDecimalString(record.total_amount),
    shippingMethodLabel: extractShippingMethodSnapshotLabel(record.shipping_method_snapshot),
    items
  };
}
