// File: /types/order.ts
// Frontend order model. Populated from the backend contract in
// `/types/checkout.ts` through the normalizers in `/utils/order.ts`.

/** Lower-cased backend `Sale.status`. */
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packaged'
  | 'shipped'
  | 'out_of_delivery'
  | 'delivered'
  | 'returned'
  | 'cancelled'
  | 'refunded';

/** Lower-cased backend `Sale.payment_status`. */
export type OrderPaymentStatus = 'unpaid' | 'collected' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug?: string;
    price: number;
    images: string[];
  };
  quantity: number;
  price: number;
  lineTotal?: number;
  sku?: string | null;
}

export interface OrderShippingAddress {
  firstName?: string;
  lastName?: string;
  company?: string;
  street: string;
  street2?: string;
  city: string;
  state?: string;
  zipCode: string;
  country: string;
  phone?: string;
}

export interface OrderStatusOption {
  value: string;
  label: string;
}

export interface OrderStatusResponse {
  default: string;
  statuses: OrderStatusOption[];
  transitions: Record<string, string[]>;
}

export interface Order {
  id: string;
  /** Backend `invoice_number` (e.g. `SALE-20261013-000041`). */
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerType?: string;
  customerStatus?: string;
  customerNotes?: string;
  items: OrderItem[];
  /** Number of lines; set from `item_count` on list rows that carry no items. */
  itemCount?: number;
  subtotal?: number;
  shippingCharge?: number;
  discountTotal?: number;
  taxTotal?: number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  createdAt: string;
  updatedAt?: string;
  notes?: string;
  shippingAddress: OrderShippingAddress | null;
  shippingMethod: {
    id: string;
    name: string;
    code?: string;
  } | null;
  allowedNextStatuses?: OrderStatusOption[];
  accounting?: {
    account: { name: string; type: string };
    transaction: { no: string; type: string; status: string; reference: string };
  };
}

/** Item row returned by `GET /api/v1/sales/track/{invoice_number}/`. */
export interface BackendSaleTrackingItem {
  product_name: string;
  variant_name: string | null;
  sku: string;
  quantity: number;
  unit_price: string;
  line_total: string;
}

export type BackendShippingMethodSnapshot =
  | string
  | {
      name?: string | null;
      title?: string | null;
      label?: string | null;
      code?: string | null;
      [key: string]: unknown;
    }
  | null;

/** Public response returned by `GET /api/v1/sales/track/{invoice_number}/`. */
export interface BackendSaleTrackingResponse {
  invoice_number: string | null;
  sale_date: string;
  created_at: string;
  status?: string | null;
  status_label: string;
  subtotal_amount?: string;
  discount_amount?: string;
  tax_amount?: string;
  shipping_amount?: string;
  total_amount?: string;
  shipping_method_snapshot?: BackendShippingMethodSnapshot;
  items: BackendSaleTrackingItem[];
}

export interface TrackedOrderItem {
  productName: string;
  variantName: string | null;
  sku: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

export interface TrackedOrder {
  invoiceNumber: string;
  saleDate: string;
  createdAt: string;
  status: OrderStatus;
  rawStatus: string;
  statusLabel: string;
  subtotalAmount: string;
  discountAmount: string;
  taxAmount: string;
  shippingAmount: string;
  totalAmount: string;
  shippingMethodLabel: string | null;
  items: TrackedOrderItem[];
}
