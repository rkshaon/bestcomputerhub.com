import { defineStore } from 'pinia';
import type { CartItem, Product } from '@/types';

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[]
  }),
  getters: {
    totalItems(): number {
      return this.items.reduce((acc, item) => acc + item.quantity, 0);
    },
    totalPrice(): number {
      return this.items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    }
  },
  actions: {
    addToCart(product: Product, quantity = 1) {
      const existing = this.items.find(item => item.productId === product.id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        this.items.push({
          productId: product.id,
          quantity,
          product
        });
      }
      this.saveToStorage();
    },
    removeFromCart(productId: string) {
      this.items = this.items.filter(item => item.productId !== productId);
      this.saveToStorage();
    },
    updateQuantity(productId: string, quantity: number) {
      const existing = this.items.find(item => item.productId === productId);
      if (existing) {
        existing.quantity = quantity;
        if (existing.quantity <= 0) {
          this.removeFromCart(productId);
        } else {
          this.saveToStorage();
        }
      }
    },
    clearCart() {
      this.items = [];
      this.saveToStorage();
    },
    saveToStorage() {
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart-items', JSON.stringify(this.items));
      }
    },
    loadFromStorage() {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('cart-items');
        if (saved) {
          try {
            this.items = JSON.parse(saved);
          } catch (e) {
            console.error('Failed to parse cart items');
          }
        }
      }
    }
  }
});
