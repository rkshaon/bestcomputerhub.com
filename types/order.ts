// File: /types/order.ts

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
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'paid' | 'unpaid' | 'failed' | 'refunded';
  createdAt: string;
  shippingAddress: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
  };
  shippingMethod: {
    id: string;
    name: string;
  } | null;
}
