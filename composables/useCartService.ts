// File: /composables/useCartService.ts
import { useApiClient } from './useApiClient';
import type { CartItem } from '@/types';

export const useCartService = () => {
  const { request } = useApiClient();

  const getCartItems = async (): Promise<CartItem[]> => {
    return await request<CartItem[]>('/api/v1/cart/items/');
  };

  const addToCart = async (productId: number, quantity: number): Promise<void> => {
    await request('/api/v1/cart/items/', { method: 'POST', body: { product: productId, quantity } });
  };

  const updateCartItem = async (itemId: number, quantity: number): Promise<void> => {
    await request(`/api/v1/cart/items/${itemId}/`, { method: 'PATCH', body: { quantity } });
  };

  const removeFromCart = async (itemId: number): Promise<void> => {
    await request(`/api/v1/cart/items/${itemId}/`, { method: 'DELETE' });
  };

  return {
    getCartItems,
    addToCart,
    updateCartItem,
    removeFromCart,
  };
};
