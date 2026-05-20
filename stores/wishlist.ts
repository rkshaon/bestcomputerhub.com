import { defineStore } from 'pinia';
import type { Product } from '@/types';

export const useWishlistStore = defineStore('wishlist', {
  state: () => ({
    items: [] as Product[]
  }),
  getters: {
    wishlistCount(): number {
      return this.items.length;
    }
  },
  actions: {
    isInWishlist(productId: string): boolean {
      return this.items.some(p => p.id === productId);
    },
    toggleWishlist(product: Product) {
      const idx = this.items.findIndex(p => p.id === product.id);
      if (idx > -1) {
        this.items.splice(idx, 1);
      } else {
        this.items.push(product);
      }
      this.saveToStorage();
    },
    saveToStorage() {
      if (typeof window !== 'undefined') {
        localStorage.setItem('wishlist-items', JSON.stringify(this.items));
      }
    },
    loadFromStorage() {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('wishlist-items');
        if (saved) {
          try {
            this.items = JSON.parse(saved);
          } catch (e) {
            console.error('Failed to parse wishlist items');
          }
        }
      }
    }
  }
});
