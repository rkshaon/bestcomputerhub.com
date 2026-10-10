// File: /stores/cart.ts
import { defineStore } from 'pinia';
import type { Product, CartItem } from '@/types';
import { useCartService } from '@/composables/useCartService';
import { useToast } from '@/composables/useToast';

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
    isLoading: false,
  }),
  getters: {
    totalItems: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: (state) => state.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
  },
  actions: {
    async fetchCart() {
      const cartService = useCartService();
      try {
        this.items = await cartService.getCartItems();
      } catch (err) {
        useToast().toastError('Failed to load cart items.');
      }
    },
    async addToCart(product: Product, quantity = 1) {
      const cartService = useCartService();
      try {
        this.isLoading = true;
        await cartService.addToCart(Number(product.id), quantity);
        await this.fetchCart();
        useToast().toastSuccess('Item added to cart.');
      } catch (err) {
        useToast().toastError('Failed to add item to cart.');
      } finally {
        this.isLoading = false;
      }
    },
    async removeFromCart(itemId: number) {
      const cartService = useCartService();
      try {
        await cartService.removeFromCart(itemId);
        await this.fetchCart();
        useToast().toastSuccess('Item removed from cart.');
      } catch (err) {
        useToast().toastError('Failed to remove item from cart.');
      }
    },
    async updateQuantity(itemId: number, quantity: number) {
      const cartService = useCartService();
      try {
        await cartService.updateCartItem(itemId, quantity);
        await this.fetchCart();
      } catch (err) {
        useToast().toastError('Failed to update quantity.');
      }
    },
    clearCart() {
      this.items = [];
    }
  },
});
