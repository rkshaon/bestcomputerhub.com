import { defineStore } from 'pinia';
import { type Product } from '~/mock/data';

export interface CartItem {
  product: Product;
  quantity: number;
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
  }),
  getters: {
    itemCount: (state) => state.items.reduce((acc, item) => acc + item.quantity, 0),
    subtotal: (state) => state.items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0),
    shipping: (state) => {
      const sub = state.items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
      if (sub === 0) return 0;
      return sub > 500 ? 0 : 15; // Free shipping over $500
    },
    tax: (state) => {
      const sub = state.items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
      return Math.round(sub * 0.0825 * 100) / 100; // 8.25% Tax
    },
    total: (state) => {
      const sub = state.items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
      const ship = sub === 0 ? 0 : (sub > 500 ? 0 : 15);
      const tx = Math.round(sub * 0.0825 * 100) / 100;
      return Math.round((sub + ship + tx) * 100) / 100;
    }
  },
  actions: {
    addToCart(product: Product, quantity = 1) {
      const existing = this.items.find(item => item.product.id === product.id);
      if (existing) {
        existing.quantity = Math.min(product.stock, existing.quantity + quantity);
      } else {
        this.items.push({ product, quantity: Math.min(product.stock, quantity) });
      }
      this.saveToStorage();
    },
    updateQuantity(productId: string, quantity: number) {
      const item = this.items.find(item => item.product.id === productId);
      if (item) {
        item.quantity = Math.max(1, Math.min(item.product.stock, quantity));
      }
      this.saveToStorage();
    },
    removeFromCart(productId: string) {
      this.items = this.items.filter(item => item.product.id !== productId);
      this.saveToStorage();
    },
    clearCart() {
      this.items = [];
      this.saveToStorage();
    },
    initCart() {
      if (process.client) {
        const saved = localStorage.getItem('techcore-cart');
        if (saved) {
          try {
            this.items = JSON.parse(saved);
          } catch (e) {
            this.items = [];
          }
        }
      }
    },
    saveToStorage() {
      if (process.client) {
        localStorage.setItem('techcore-cart', JSON.stringify(this.items));
      }
    }
  }
});
