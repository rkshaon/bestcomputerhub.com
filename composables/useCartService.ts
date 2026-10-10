// File: /composables/useCartService.ts
import { useApiClient } from './useApiClient';
import type { CartItem } from '@/types';

export const useCartService = () => {
  const { api } = useApiClient();

  const getCartItems = async (): Promise<CartItem[]> => {
    const response = await api.get('/api/v1/cart/items/');
    return response.data;
  };

  const addToCart = async (productId: number, quantity: number): Promise<void> => {
    await api.post('/api/v1/cart/items/', { product: productId, quantity });
  };

  const updateCartItem = async (itemId: number, quantity: number): Promise<void> => {
    await api.patch(`/api/v1/cart/items/${itemId}/`, { quantity });
  };

  const removeFromCart = async (itemId: number): Promise<void> => {
    await api.delete(`/api/v1/cart/items/${itemId}/`);
  };

  return {
    getCartItems,
    addToCart,
    updateCartItem,
    removeFromCart,
  };
};
