import { defineStore } from 'pinia';
import { type Product } from '~/mock/data';

export interface UserProfile {
  name: string;
  email: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
}

export interface Order {
  id: string;
  date: string;
  items: Array<{
    product: Product;
    quantity: number;
  }>;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  shippingAddress: UserProfile;
}

const DEFAULT_USER: UserProfile = {
  name: 'RK Shaon',
  email: 'rkshaon.ist@gmail.com',
  address: '123 Tech Central Pkwy, Suite 404',
  city: 'Frankfurt',
  country: 'DE',
  postalCode: '60311'
};

const DEFAULT_ORDERS: Order[] = [
  {
    id: 'ORD-88402',
    date: '2026-05-10',
    items: [
      {
        product: {
          id: 'prod-003',
          name: 'SoundWave Elite ANC Headphones',
          slug: 'soundwave-elite-anc-headphones',
          category: 'audio',
          brand: 'Wave',
          price: 349,
          rating: 4.7,
          reviewCount: 89,
          stock: 18,
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
          images: [],
          description: '',
          features: [],
          specs: {}
        },
        quantity: 1
      }
    ],
    subtotal: 349,
    tax: 28.79,
    shipping: 0,
    total: 377.79,
    status: 'Delivered',
    shippingAddress: DEFAULT_USER
  }
];

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as UserProfile | null,
    orders: [] as Order[],
  }),
  getters: {
    isLoggedIn: (state) => state.user !== null,
  },
  actions: {
    initAuth() {
      if (process.client) {
        // Hydrate from localStorage
        const savedUser = localStorage.getItem('techcore-user');
        const savedOrders = localStorage.getItem('techcore-orders');

        this.user = savedUser ? JSON.parse(savedUser) : DEFAULT_USER; // Default-logged in for better UI testing
        this.orders = savedOrders ? JSON.parse(savedOrders) : DEFAULT_ORDERS;

        this.saveToStorage();
      }
    },
    login(email: string, name = 'RK Shaon') {
      this.user = {
        name,
        email,
        address: '123 Tech Central Pkwy, Suite 404',
        city: 'Frankfurt',
        country: 'Germany',
        postalCode: '60311'
      };
      this.saveToStorage();
    },
    signup(name: string, email: string) {
      this.user = {
        name,
        email,
        address: '',
        city: '',
        country: '',
        postalCode: ''
      };
      this.saveToStorage();
    },
    logout() {
      this.user = null;
      this.saveToStorage();
    },
    placeOrder(items: Array<{ product: Product, quantity: number }>, subtotal: number, tax: number, shipping: number, total: number, addressOverride?: UserProfile) {
      const shippingAddress = addressOverride || this.user || DEFAULT_USER;
      const newOrder: Order = {
        id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
        date: new Date().toISOString().split('T')[0],
        items: JSON.parse(JSON.stringify(items)),
        subtotal,
        tax,
        shipping,
        total,
        status: 'Processing',
        shippingAddress
      };
      this.orders.unshift(newOrder);
      this.saveToStorage();
      return newOrder;
    },
    updateProfile(updated: UserProfile) {
      this.user = { ...updated };
      this.saveToStorage();
    },
    saveToStorage() {
      if (process.client) {
        localStorage.setItem('techcore-user', JSON.stringify(this.user));
        localStorage.setItem('techcore-orders', JSON.stringify(this.orders));
      }
    }
  }
});
