# Google Tag Manager & GA4 Setup

The storefront loads **Google Tag Manager** only. **GA4** is configured inside the GTM container, so the GA4 Measurement ID never appears in the code or environment, and pages are never double-counted.

```text
Storefront ──(NUXT_PUBLIC_GTM_ID)──► Google Tag Manager ──(GA4 Measurement ID)──► Google Analytics 4
```

## 1. Environment

| Variable | Example | Notes |
| :--- | :--- | :--- |
| `NUXT_PUBLIC_GTM_ID` | `GTM-ABC1234` | GTM container ID. Empty (or not `GTM-…`) disables GTM entirely, so development and staging stay out of production data. |

Nuxt reads `NUXT_PUBLIC_*` at server start (`runtimeConfig.public.gtmId`), so the ID can be changed without rebuilding; restart the server after changing it.

## 2. Import the container

1. Tag Manager → **Admin → Import Container**.
2. Choose `docs/analytics/gtm-container.json`.
3. Workspace: **Existing → Default Workspace**. Option: **Merge → Rename conflicting tags, triggers, and variables**.
4. Open **Variables → `GA4 Measurement ID`** and replace `G-XXXXXXXXXX` with the Measurement ID from GA4 (**Admin → Data streams → Web stream**).
5. **Preview** on the live site to confirm tags fire (see §4), then **Submit → Publish**.

### What the container contains

| Tag | Trigger (dataLayer `event`) | Sends |
| :--- | :--- | :--- |
| Google tag - GA4 | Initialization - All Pages | GA4 config with `send_page_view: false` (the site sends page views itself) |
| GA4 - page_view | `page_view` | `page_location`, `page_title` |
| GA4 - ecommerce | `view_item_list`, `select_item`, `view_item`, `add_to_cart`, `remove_from_cart`, `view_cart`, `begin_checkout`, `add_shipping_info`, `purchase` | the `ecommerce` object from the dataLayer |
| GA4 - search | `search` | `search_term` |
| GA4 - login and sign_up | `login`, `sign_up` | `method` |

## 3. Events sent by the storefront

All events are pushed by `useAnalytics()` (`/composables/useAnalytics.ts`). Admin routes (`/admin/*`) are never tracked. No names, emails, phone numbers or addresses are sent. Currency is `BDT`.

| Event | Where | Notes |
| :--- | :--- | :--- |
| `page_view` | `plugins/tag-manager.ts` | Landing page plus every client-side navigation |
| `view_item_list` / `select_item` | Shop, category, brand pages, home product sections | `item_list_id` e.g. `shop`, `category:{slug}`, `brand:{slug}`, `home:{section}` |
| `view_item` | Product page | |
| `add_to_cart` / `remove_from_cart` | `stores/cart.ts` | Quantity changes are reported as the delta |
| `view_cart` | Cart page | |
| `begin_checkout` | Checkout page load | Logged-in customers with a loaded cart |
| `add_shipping_info` | Checkout delivery step | `value` = backend-validated `grand_total` |
| `purchase` | Checkout order confirmation | `transaction_id` = invoice number, backend totals; sent once per order |
| `search` | Header search submit | |
| `login` / `sign_up` | Login and signup pages | `method`: `password` / `email` |

Item IDs use the product **SKU** (falling back to the product ID) so product, cart and order events match.

Cart-level events (`add_to_cart`, `view_cart`, `begin_checkout`, …) carry item prices but no `value`: the frontend never computes cart totals. `value` is only sent where the backend returns a total (`add_shipping_info`, `purchase`).

Payment is cash on delivery, so `purchase` revenue is **ordered** revenue; cancelled orders are not subtracted.

## 4. Verifying

1. Tag Manager → **Preview**, enter the site URL.
2. Browse a category, open a product, add it to the cart, check out. Each step should show the matching tag as **Fired**.
3. GA4 → **Admin → DebugView** shows the incoming events.
4. In the browser console, `window.dataLayer` lists every pushed event.

## 5. GA4 settings to configure in the GA UI

- Mark `purchase` (and optionally `sign_up`) as **key events**.
- Add internal traffic filters for office IPs.
- Link Search Console and Google Ads if used.

## 6. Adding more tags later

Other platforms (Meta Pixel, Google Ads conversions, Microsoft Clarity, …) should be added in GTM and triggered by the same dataLayer events. No storefront code change is needed.
