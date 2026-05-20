import { defineStore } from 'pinia';
import type { Product } from '@/types';

export const useWishlistStore = defineStore('wishlist', {
  state: () => ({
    items: [] as Product[],
  }),
  getters: {
    isInWishlist: (state) => (productId: string) => {
      return state.items.some(item => item.id === productId);
    },
    wishlistCount: (state) => state.items.length,
  },
  actions: {
    toggleWishlist(product: Product) {
      const index = this.items.findIndex(item => item.id === product.id);
      if (index === -1) {
        this.items.push(product);
      } else {
        this.items.splice(index, 1);
      }
    },
    removeFromWishlist(productId: string) {
      this.items = this.items.filter(item => item.id !== productId);
    },
    clearWishlist() {
      this.items = [];
    }
  }
});
