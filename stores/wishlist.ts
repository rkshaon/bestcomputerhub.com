import { defineStore } from 'pinia';
import { type Product } from '~/mock/data';

export const useWishlistStore = defineStore('wishlist', {
  state: () => ({
    items: [] as Product[],
  }),
  getters: {
    wishlistCount: (state) => state.items.length,
    isInWishlist: (state) => (productId: string) => state.items.some(p => p.id === productId)
  },
  actions: {
    toggleWishlist(product: Product) {
      const idx = this.items.findIndex(p => p.id === product.id);
      if (idx > -1) {
        this.items.splice(idx, 1);
      } else {
        this.items.push(product);
      }
      this.saveToStorage();
    },
    removeFromWishlist(productId: string) {
      this.items = this.items.filter(p => p.id !== productId);
      this.saveToStorage();
    },
    initWishlist() {
      if (process.client) {
        const saved = localStorage.getItem('techcore-wishlist');
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
        localStorage.setItem('techcore-wishlist', JSON.stringify(this.items));
      }
    }
  }
});
