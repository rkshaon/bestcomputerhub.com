// File: /types/cart.ts
import type { Product } from './product';

export interface CartItem {
  id?: string | number;
  productId?: string | number;
  quantity: number;
  product: Product;
}
