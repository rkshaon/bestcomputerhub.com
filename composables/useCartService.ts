// File: /composables/useCartService.ts
import { useApiClient } from './useApiClient';
import type { CartItem } from '@/types';

export const useCartService = () => {
  const { request } = useApiClient();

  const getCartItems = async (): Promise<CartItem[]> => {
    const res = await request<any>('/api/v1/cart/items/');
    let rawItems = [];
    if (Array.isArray(res)) rawItems = res;
    else if (res && Array.isArray(res.results)) rawItems = res.results;
    else if (res && Array.isArray(res.items)) rawItems = res.items;

    return rawItems.map((item: any) => {
      const p = item.product || {};
      
      const techImages = [
        'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop&q=80'
      ];
      const imageIndex = p.id ? (Math.abs(Number(p.id) || 0) % techImages.length) : 0;
      const fallbackImage = techImages[imageIndex] || techImages[0];

      const priceVal = p.current_selling_price !== undefined && p.current_selling_price !== null 
        ? Number(p.current_selling_price) 
        : Number(p.price ?? 0);

      let primaryImgUrl = '';
      const defaultImg = p.default_image || null;
      if (defaultImg) {
        if (typeof defaultImg === 'object' && defaultImg.image) {
          primaryImgUrl = defaultImg.image;
        } else if (typeof defaultImg === 'string') {
          primaryImgUrl = defaultImg;
        }
      } else if (Array.isArray(p.images) && p.images.length > 0) {
        primaryImgUrl = typeof p.images[0] === 'string' ? p.images[0] : (p.images[0]?.image || '');
      } else if (p.image) {
        primaryImgUrl = typeof p.image === 'string' ? p.image : '';
      }

      const finalImages = primaryImgUrl ? [primaryImgUrl] : [fallbackImage];

      return {
        ...item,
        product: {
          ...p,
          price: priceVal,
          current_selling_price: priceVal,
          images: finalImages
        }
      };
    });
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
