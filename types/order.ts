// File: /types/order.ts

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
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
}
