// File: /utils/analytics.ts
// Pure mappers from storefront entities to GA4 e-commerce items.
import type { Product, CartItem } from '@/types';
import type { OrderItem } from '@/types/order';
import type { AnalyticsItem } from '@/types/analytics';
import { decodeHtmlEntities } from '@/utils';

/** Storefront prices are in Bangladeshi Taka. */
export const ANALYTICS_CURRENCY = 'BDT';

/** Admin pages are never tracked. */
export function isTrackedPath(path: string): boolean {
  return path !== '/admin' && !path.startsWith('/admin/');
}

function toPrice(value: number | undefined | null): number | undefined {
  const price = Number(value);
  return Number.isFinite(price) && price > 0 ? price : undefined;
}

/** SKU is the shared identifier across product, cart and order data. */
export function productToAnalyticsItem(
  product: Product,
  extras: Partial<AnalyticsItem> = {}
): AnalyticsItem {
  const brand = decodeHtmlEntities(product.brand);
  const category = decodeHtmlEntities(product.category);
  return {
    item_id: product.sku || String(product.id),
    item_name: decodeHtmlEntities(product.name),
    ...(brand ? { item_brand: brand } : {}),
    ...(category ? { item_category: category } : {}),
    price: toPrice(product.current_selling_price ?? product.price),
    ...extras
  };
}

export function cartItemToAnalyticsItem(item: CartItem): AnalyticsItem {
  return productToAnalyticsItem(item.product, { quantity: item.quantity });
}

export function orderItemToAnalyticsItem(item: OrderItem): AnalyticsItem {
  return {
    item_id: item.sku || item.productId || item.id,
    item_name: decodeHtmlEntities(item.product.name),
    price: toPrice(item.price),
    quantity: item.quantity
  };
}
