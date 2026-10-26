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
  value: OrderStatus;
  label: string;
}

export interface OrderStatusResponse {
  default: string;
  statuses: OrderStatusOption[];
  transitions: Record<OrderStatus, OrderStatus[]>;
}

export interface Order {
  id: string;
  /** Backend `invoice_number` (e.g. `SALE-20261013-000041`). */
  orderNumber: string;
  customerId: string;
  customerName: string;
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
}
