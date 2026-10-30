// File: /composables/useAnalytics.ts
import type { Product, CartItem } from '@/types';
import type { Order } from '@/types/order';
import type {
  AnalyticsEcommerce,
  AnalyticsEcommerceEvent,
  AnalyticsItem,
  DataLayerEntry
} from '@/types/analytics';
import {
  ANALYTICS_CURRENCY,
  cartItemToAnalyticsItem,
  isTrackedPath,
  orderItemToAnalyticsItem,
  productToAnalyticsItem
} from '@/utils/analytics';

const PURCHASE_STORAGE_KEY = 'analytics_tracked_orders';

/**
 * Pushes GA4 events to the Google Tag Manager dataLayer.
 *
 * Safe to call anywhere (components, stores, after awaits): it needs no Nuxt
 * context and is a no-op on the server, on admin routes, and whenever
 * `plugins/tag-manager.ts` has not created the dataLayer (no GTM ID set).
 */
export const useAnalytics = () => {
  const push = (entry: DataLayerEntry) => {
    if (!import.meta.client || !window.dataLayer) return;
    if (!isTrackedPath(window.location.pathname)) return;
    window.dataLayer.push(entry);
  };

  const pushEcommerce = (event: AnalyticsEcommerceEvent, ecommerce: AnalyticsEcommerce) => {
    if (ecommerce.items.length === 0) return;
    // Clear the previous ecommerce object so GTM does not merge item arrays.
    push({ ecommerce: null });
    push({ event, ecommerce: { currency: ANALYTICS_CURRENCY, ...ecommerce } });
  };

  const trackPageView = (path: string) => {
    push({
      event: 'page_view',
      page_location: window.location.href,
      page_path: path,
      page_title: document.title
    });
  };

  const trackViewItemList = (listId: string, listName: string, products: Product[]) => {
    pushEcommerce('view_item_list', {
      item_list_id: listId,
      item_list_name: listName,
      items: products.map((product, index) =>
        productToAnalyticsItem(product, { item_list_id: listId, item_list_name: listName, index })
      )
    });
  };

  const trackSelectItem = (listId: string, listName: string, product: Product, index?: number) => {
    pushEcommerce('select_item', {
      item_list_id: listId,
      item_list_name: listName,
      items: [productToAnalyticsItem(product, { item_list_id: listId, item_list_name: listName, index })]
    });
  };

  const trackViewItem = (product: Product) => {
    pushEcommerce('view_item', { items: [productToAnalyticsItem(product)] });
  };

  const trackAddToCart = (product: Product, quantity: number) => {
    pushEcommerce('add_to_cart', { items: [productToAnalyticsItem(product, { quantity })] });
  };

  const trackRemoveFromCart = (product: Product, quantity: number) => {
    pushEcommerce('remove_from_cart', { items: [productToAnalyticsItem(product, { quantity })] });
  };

  const trackViewCart = (items: CartItem[]) => {
    pushEcommerce('view_cart', { items: items.map(cartItemToAnalyticsItem) });
  };

  const trackBeginCheckout = (items: CartItem[]) => {
    pushEcommerce('begin_checkout', { items: items.map(cartItemToAnalyticsItem) });
  };

  /** `value` must be a backend-confirmed total (checkout validation). */
  const trackAddShippingInfo = (items: CartItem[], shippingTier: string, value: number) => {
    pushEcommerce('add_shipping_info', {
      value,
      shipping_tier: shippingTier,
      items: items.map(cartItemToAnalyticsItem)
    });
  };

  const hasTrackedPurchase = (transactionId: string): boolean => {
    try {
      const tracked: unknown = JSON.parse(localStorage.getItem(PURCHASE_STORAGE_KEY) || '[]');
      return Array.isArray(tracked) && tracked.includes(transactionId);
    } catch {
      return false;
    }
  };

  const rememberPurchase = (transactionId: string) => {
    try {
      const tracked: unknown = JSON.parse(localStorage.getItem(PURCHASE_STORAGE_KEY) || '[]');
      const list = Array.isArray(tracked) ? tracked.filter((id): id is string => typeof id === 'string') : [];
      localStorage.setItem(PURCHASE_STORAGE_KEY, JSON.stringify([...list, transactionId].slice(-20)));
    } catch {
      // Storage unavailable: the order is still tracked once for this call.
    }
  };

  /** Sent once per order, using the backend order totals. */
  const trackPurchase = (order: Order) => {
    const transactionId = order.orderNumber || order.id;
    if (!transactionId || order.status === 'cancelled' || hasTrackedPurchase(transactionId)) return;

    const items: AnalyticsItem[] = order.items.map(orderItemToAnalyticsItem);
    pushEcommerce('purchase', {
      transaction_id: transactionId,
      value: order.totalAmount,
      ...(order.taxTotal !== undefined ? { tax: order.taxTotal } : {}),
      ...(order.shippingCharge !== undefined ? { shipping: order.shippingCharge } : {}),
      items
    });
    rememberPurchase(transactionId);
  };

  const trackSearch = (searchTerm: string) => {
    const term = searchTerm.trim();
    if (term) push({ event: 'search', search_term: term });
  };

  const trackLogin = (method: string) => {
    push({ event: 'login', method });
  };

  const trackSignUp = (method: string) => {
    push({ event: 'sign_up', method });
  };

  return {
    trackPageView,
    trackViewItemList,
    trackSelectItem,
    trackViewItem,
    trackAddToCart,
    trackRemoveFromCart,
    trackViewCart,
    trackBeginCheckout,
    trackAddShippingInfo,
    trackPurchase,
    trackSearch,
    trackLogin,
    trackSignUp
  };
};
