// File: /types/cart.ts
import type { Product } from './product';

export interface CartItem {
  productId: string;
  quantity: number;
  product: Product;
}
