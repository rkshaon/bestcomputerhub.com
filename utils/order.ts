// File: /utils/order.ts
// Pure normalizers from the backend storefront order contract
// (ZayrahLife-Backend/docs/checkout-api.md) to the frontend `Order` model.
import type { Order, OrderItem, OrderStatus, OrderPaymentStatus } from '@/types/order';
import type {
  ApiMoney,
  BackendOrderDetail,
  BackendOrderItem,
  BackendOrderSummary
} from '@/types/checkout';

/** Converts a backend money value (number or decimal string) to a number. */
export function toMoney(value: ApiMoney | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Lower-cases a backend status (`OUT_OF_DELIVERY` → `out_of_delivery`). */
export function normalizeOrderStatus(status: string | null | undefined): OrderStatus {
  return String(status || 'PENDING').toLowerCase() as OrderStatus;
}

export function normalizePaymentStatus(status: string | null | undefined): OrderPaymentStatus {
  return String(status || 'UNPAID').toLowerCase() as OrderPaymentStatus;
}

function mapOrderItem(item: BackendOrderItem): OrderItem {
  const unitPrice = toMoney(item.unit_price);
  const variantId = item.product_variant?.id;
  const productName = item.product_variant?.name 
    || item.product_variant?.product?.name 
    || item.product_name;

  return {
    id: String(item.id),
    productId: variantId !== undefined && variantId !== null ? String(variantId) : '',
    product: {
      id: variantId !== undefined && variantId !== null ? String(variantId) : '',
      name: productName,
      price: unitPrice,
      images: []
    },
    quantity: item.quantity,
    price: unitPrice,
    lineTotal: toMoney(item.line_total),
    sku: item.product_variant.sku || undefined
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
    customerName: raw.customer?.user?.username ?? '',
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
    createdAt: raw.created_at,
    updatedAt: raw.created_at,
    notes: '',
    shippingAddress: null,
    shippingMethod: null,
    allowedNextStatuses: [],
    customerId: '',
    customerName: raw.customer?.user?.username ?? 'NA',
    items: [],
    itemCount: Number(raw.item_count) || 0,
    subtotal: 0,
    shippingCharge: 0,
    discountTotal: 0,
    taxTotal: 0,
    totalAmount: toMoney(raw.total_amount),
    status: normalizeOrderStatus(raw.status),
    paymentStatus: normalizePaymentStatus(raw.payment_status)
  };
}
