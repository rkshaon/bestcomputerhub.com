// File: /stores/cart.ts
import { defineStore } from 'pinia';
import type { Product, CartItem } from '@/types';
import { useCartService } from '@/composables/useCartService';
import { useToast } from '@/composables/useToast';
import { useAuthStore } from '@/stores/auth';

const GUEST_CART_STORAGE_KEY = 'techcore_guest_cart';

export const useCartStore = defineStore('cart', {
  state: () => {
    let initialItems: CartItem[] = [];
    if (typeof window !== 'undefined' || import.meta.client) {
      try {
        const authStore = useAuthStore();
        if (!authStore.isLoggedIn) {
          const raw = localStorage.getItem(GUEST_CART_STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              initialItems = parsed.filter((item: any) =>
                item &&
                item.product &&
                item.product.id !== undefined &&
                typeof item.product.price === 'number' &&
                Number.isInteger(item.quantity) &&
                item.quantity > 0
              );
            }
          }
        }
      } catch (err) {
        console.error('Failed to load guest cart from localStorage during initialization', err);
      }
    }

    return {
      items: initialItems,
      isLoading: false,
    };
  },
  getters: {
    totalItems: (state) => {
      const list = Array.isArray(state.items) ? state.items : [];
      return list.reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0);
    },
    totalPrice: (state) => {
      const list = Array.isArray(state.items) ? state.items : [];
      return list.reduce((sum, item) => sum + ((Number(item?.product?.price) || 0) * (Number(item?.quantity) || 0)), 0);
    },
  },
  actions: {
    _isLoggedIn() {
      const authStore = useAuthStore();
      return authStore.isLoggedIn;
    },

    _loadGuestCart() {
      if (typeof window === 'undefined' && !import.meta.client) return;
      try {
        const raw = localStorage.getItem(GUEST_CART_STORAGE_KEY);
        if (!raw) {
          this.items = [];
          return;
        }
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.items = parsed.filter((item: any) =>
            item &&
            item.product &&
            item.product.id !== undefined &&
            typeof item.product.price === 'number' &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0
          );
        } else {
          this.items = [];
        }
      } catch (err) {
        console.error('Failed to parse guest cart from localStorage', err);
        this.items = [];
      }
    },

    _saveGuestCart() {
      if (typeof window === 'undefined' && !import.meta.client) return;
      try {
        localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(this.items));
      } catch (err) {
        console.error('Failed to save guest cart to localStorage', err);
      }
    },

    async fetchCart() {
      if (this._isLoggedIn()) {
        const cartService = useCartService();
        try {
          this.isLoading = true;
          const res = await cartService.getCartItems();
          this.items = Array.isArray(res) ? res : [];
        } catch (err) {
          useToast().toastError('Failed to load cart items.');
          this.items = [];
        } finally {
          this.isLoading = false;
        }
      } else {
        this._loadGuestCart();
      }
    },

    async addToCart(product: Product, quantity = 1) {
      const qty = Math.max(1, Math.floor(Number(quantity) || 1));
      if (this._isLoggedIn()) {
        const cartService = useCartService();
        try {
          this.isLoading = true;
          await cartService.addToCart(Number(product.id), qty);
          await this.fetchCart();
          useToast().toastSuccess('Item added to cart.');
        } catch (err) {
          useToast().toastError('Failed to add item to cart.');
        } finally {
          this.isLoading = false;
        }
      } else {
        this._loadGuestCart();
        const existingIndex = this.items.findIndex(i => String(i.product.id) === String(product.id) || String(i.productId) === String(product.id));
        if (existingIndex > -1 && this.items[existingIndex]) {
          this.items[existingIndex]!.quantity += qty;
        } else {
          this.items.push({ productId: String(product.id), product, quantity: qty });
        }
        this._saveGuestCart();
        useToast().toastSuccess('Item added to cart.');
      }
    },

    async removeFromCart(itemId: number | string) {
      if (this._isLoggedIn()) {
        const cartService = useCartService();
        try {
          this.isLoading = true;
          await cartService.removeFromCart(Number(itemId));
          await this.fetchCart();
          useToast().toastSuccess('Item removed from cart.');
        } catch (err) {
          useToast().toastError('Failed to remove item from cart.');
        } finally {
          this.isLoading = false;
        }
      } else {
        this._loadGuestCart();
        this.items = this.items.filter(i => String(i.product.id) !== String(itemId) && String(i.productId) !== String(itemId));
        this._saveGuestCart();
        useToast().toastSuccess('Item removed from cart.');
      }
    },

    async updateQuantity(itemId: number | string, quantity: number) {
      const qty = Math.max(1, Math.floor(Number(quantity) || 1));
      if (this._isLoggedIn()) {
        const cartService = useCartService();
        try {
          this.isLoading = true;
          await cartService.updateCartItem(Number(itemId), qty);
          await this.fetchCart();
        } catch (err) {
          useToast().toastError('Failed to update quantity.');
        } finally {
          this.isLoading = false;
        }
      } else {
        this._loadGuestCart();
        const item = this.items.find(i => String(i.product.id) === String(itemId) || String(i.productId) === String(itemId));
        if (item) {
          item.quantity = qty;
          this._saveGuestCart();
        }
      }
    },

    clearCart() {
      this.items = [];
      if (!this._isLoggedIn()) {
        if (typeof window !== 'undefined' || import.meta.client) {
          try {
            localStorage.removeItem(GUEST_CART_STORAGE_KEY);
          } catch {}
        }
      }
    },

    clearAuthCart() {
      this.items = [];
    },

    async mergeGuestCartToBackend() {
      if (!this._isLoggedIn()) return;
      if (typeof window === 'undefined' && !import.meta.client) return;

      try {
        const raw = localStorage.getItem(GUEST_CART_STORAGE_KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          localStorage.removeItem(GUEST_CART_STORAGE_KEY);
          return;
        }

        const guestItems = parsed.filter((item: any) =>
          item &&
          item.product &&
          item.product.id !== undefined &&
          typeof item.product.price === 'number' &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0
        );

        if (guestItems.length === 0) {
          localStorage.removeItem(GUEST_CART_STORAGE_KEY);
          return;
        }

        const cartService = useCartService();
        this.isLoading = true;

        let backendItems: CartItem[] = [];
        try {
          backendItems = await cartService.getCartItems();
        } catch (err) {
          console.error('Failed to fetch backend cart items during merge', err);
          this.isLoading = false;
          return;
        }

        let hasError = false;

        for (const guestItem of guestItems) {
          const productId = Number(guestItem.product.id || guestItem.productId);
          const guestQty = Number(guestItem.quantity);
          if (!productId || isNaN(productId) || guestQty <= 0) continue;

          const existingBackendItem = backendItems.find(
            bi => bi && bi.product && String(bi.product.id) === String(productId)
          );

          try {
            if (existingBackendItem && existingBackendItem.id !== undefined) {
              const newQty = Number(existingBackendItem.quantity || 0) + guestQty;
              await cartService.updateCartItem(Number(existingBackendItem.id), newQty);
              existingBackendItem.quantity = newQty;
            } else {
              await cartService.addToCart(productId, guestQty);
              backendItems.push({
                id: Date.now(),
                product: guestItem.product,
                quantity: guestQty
              });
            }
          } catch (itemErr) {
            console.error(`Failed to merge product ${productId} to backend cart`, itemErr);
            hasError = true;
          }
        }

        await this.fetchCart();

        if (!hasError) {
          localStorage.removeItem(GUEST_CART_STORAGE_KEY);
          useToast().toastSuccess('Guest cart successfully merged to your account.');
        } else {
          useToast().toastWarning('Some guest cart items could not be fully merged. Guest cart retained.');
        }
      } catch (err) {
        console.error('Error during guest cart merge', err);
        useToast().toastError('Failed to synchronize guest cart.');
      } finally {
        this.isLoading = false;
      }
    }
  },
});

