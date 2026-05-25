// File: /stores/cart.ts
import { defineStore } from 'pinia';
import type { Product, CartItem } from '@/types';

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
  }),
  getters: {
    totalItems: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: (state) => state.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
  },
  actions: {
    addToCart(product: Product, quantity = 1) {
      const existingItem = this.items.find(item => item.productId === product.id);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        this.items.push({ productId: product.id, quantity, product });
      }
    },
    removeFromCart(productId: string) {
      this.items = this.items.filter(item => item.productId !== productId);
    },
    updateQuantity(productId: string, quantity: number) {
      const item = this.items.find(item => item.productId === productId);
      if (item) {
        item.quantity = Math.max(1, quantity);
      }
    },
    clearCart() {
      this.items = [];
    }
  },
  // In a real app, we'd use persistent storage plugin
});
