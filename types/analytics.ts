// File: /types/analytics.ts
// GA4 event contracts pushed to the Google Tag Manager dataLayer.
// GA4 itself is configured inside the GTM container; see /docs/analytics/google-tag-manager.md.

/** Single GA4 e-commerce item. Values come from backend product/order data only. */
export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  item_list_id?: string;
  item_list_name?: string;
  index?: number;
  price?: number;
  quantity?: number;
}

/** GA4 `ecommerce` object. `value` is only set from backend-confirmed totals. */
export interface AnalyticsEcommerce {
  currency?: string;
  value?: number;
  items: AnalyticsItem[];
  item_list_id?: string;
  item_list_name?: string;
  shipping_tier?: string;
  transaction_id?: string;
  tax?: number;
  shipping?: number;
}

export type AnalyticsEcommerceEvent =
  | 'view_item_list'
  | 'select_item'
  | 'view_item'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'view_cart'
  | 'begin_checkout'
  | 'add_shipping_info'
  | 'purchase';

export interface AnalyticsPageViewPayload {
  event: 'page_view';
  page_location: string;
  page_path: string;
  page_title: string;
}

export interface AnalyticsEcommercePayload {
  event: AnalyticsEcommerceEvent;
  ecommerce: AnalyticsEcommerce;
}

export interface AnalyticsSearchPayload {
  event: 'search';
  search_term: string;
}

export interface AnalyticsAuthPayload {
  event: 'login' | 'sign_up';
  method: string;
}

/** GTM bootstrap and reset entries pushed alongside the GA4 events. */
export type AnalyticsInternalPayload =
  | { event: 'gtm.js'; 'gtm.start': number }
  | { ecommerce: null };

export type DataLayerEntry =
  | AnalyticsPageViewPayload
  | AnalyticsEcommercePayload
  | AnalyticsSearchPayload
  | AnalyticsAuthPayload
  | AnalyticsInternalPayload;

declare global {
  interface Window {
    dataLayer?: DataLayerEntry[];
  }
}
