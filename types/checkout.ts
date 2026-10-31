// File: /types/checkout.ts
// Backend contracts for the storefront checkout flow.
// Authoritative source: ZayrahLife-Backend/docs/checkout-api.md

/** Money values arrive as JSON numbers from dict responses and as
 *  strings from DRF DecimalField serializers; always `Number()` them. */
export type ApiMoney = number | string;

export type BackendOrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PACKAGED'
  | 'SHIPPED'
  | 'OUT_OF_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type BackendPaymentStatus = 'UNPAID' | 'COLLECTED';

// ── POST /api/v1/checkout/validate/ ──────────────────────────────

export interface CheckoutValidatePayload {
  shipping_address_id: number;
  shipping_method_id: number;
}

export interface CheckoutCartItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: ApiMoney;
  line_total: ApiMoney;
}

export interface CheckoutCart {
  id: number;
  items: CheckoutCartItem[];
}

export interface CheckoutPricing {
  subtotal: ApiMoney;
  shipping_charge: ApiMoney;
  discount_total: ApiMoney;
  tax_total: ApiMoney;
  grand_total: ApiMoney;
}

export interface CheckoutShipping {
  address_id: number;
  method_id: number;
  method_name: string;
  method_code: string;
  zone_name: string;
  zone_code: string;
  base_charge: ApiMoney;
  is_free_shipping: boolean;
  free_shipping_threshold: ApiMoney | null;
}

export interface CheckoutValidateResponse {
  is_valid: boolean;
  cart: CheckoutCart | null;
  pricing: CheckoutPricing | null;
  shipping: CheckoutShipping | null;
  errors: string[];
}

// ── POST /api/v1/checkout/confirm/ ───────────────────────────────

export interface CheckoutConfirmPayload {
  shipping_address_id: number;
  shipping_method_id: number;
  /** One key per checkout attempt; reuse it for retries of that attempt. */
  idempotency_key: string;
  notes?: string;
}

// ── GET /api/v1/orders/ and /api/v1/orders/{id}/ ─────────────────

export interface BackendOrderSummary {
  id: number;
  invoice_number: string | null;
  status: BackendOrderStatus;
  payment_status: BackendPaymentStatus;
  total_amount: ApiMoney;
  item_count: number;
  created_at: string;
  customer: { user: { username: string } } | null;
}

export interface BackendOrderItemVariant {
  id: number;
  sku: string;
  name: string | null;
}

export interface BackendOrderItem {
  id: number;
  product_variant: BackendOrderItemVariant;
  product_name: string;
  quantity: number;
  unit_price: ApiMoney;
  line_total: ApiMoney;
}

export interface BackendOrderShippingAddress {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
}

export interface BackendOrderShippingMethod {
  id: number;
  name: string;
  code: string;
}

export interface BackendOrderStatusOption {
  value: BackendOrderStatus;
  label: string;
}

export interface BackendOrderDetail {
  id: number;
  invoice_number: string | null;
  status: BackendOrderStatus;
  payment_status: BackendPaymentStatus;
  channel: string;
  customer: {
    id: number;
    user: { id: number; username: string } | null;
  } | null;
  items: BackendOrderItem[];
  shipping_address: BackendOrderShippingAddress | null;
  subtotal_amount: ApiMoney;
  discount_amount: ApiMoney;
  tax_amount: ApiMoney;
  shipping_amount: ApiMoney;
  total_amount: ApiMoney;
  shipping_method: BackendOrderShippingMethod | null;
  notes: string;
  created_at: string;
  updated_at: string;
  allowed_next_statuses: BackendOrderStatusOption[];
  account: { id: number; code: string; name: string; account_type: string } | null;
  accounting_transaction: { id: number; transaction_no: string; transaction_type: string; status: string; reference: string } | null;
  return_transaction: any | null;
  collection_transaction: any | null;
}

// ── POST /api/v1/orders/{id}/cancel/ ─────────────────────────────

export interface BackendOrderCancelResponse {
  id: number;
  status: BackendOrderStatus;
  message: string;
}
