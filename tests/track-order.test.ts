// File: /tests/track-order.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { formatCalendarDate, formatDateTime, formatDecimalCurrency } from '../utils/index';
import {
  extractShippingMethodSnapshotLabel,
  isPositiveDecimalString,
  mapTrackedOrder
} from '../utils/order';

test('formatDecimalCurrency formats decimal strings losslessly without float drift or NaN', () => {
  assert.equal(formatDecimalCurrency('1500.00'), 'Tk 1,500.00');
  assert.equal(formatDecimalCurrency('1500.50'), 'Tk 1,500.50');
  assert.equal(formatDecimalCurrency('1500.5'), 'Tk 1,500.50');
  assert.equal(formatDecimalCurrency('1500'), 'Tk 1,500.00');
  assert.equal(formatDecimalCurrency('0.00'), 'Tk 0.00');
  assert.equal(formatDecimalCurrency('-0.00'), 'Tk 0.00');
  assert.equal(formatDecimalCurrency('-250.75'), '-Tk 250.75');
  assert.equal(formatDecimalCurrency('9999999999999.99'), 'Tk 9,999,999,999,999.99');
  assert.equal(formatDecimalCurrency('125.125'), 'Tk 125.125');
  assert.equal(formatDecimalCurrency(''), 'Tk 0.00');
  assert.equal(formatDecimalCurrency(null), 'Tk 0.00');
  assert.equal(formatDecimalCurrency(undefined), 'Tk 0.00');
  assert.equal(formatDecimalCurrency('not-a-number'), 'Tk 0.00');
  assert.equal(formatDecimalCurrency(Number.NaN), 'Tk 0.00');
  assert.equal(formatDecimalCurrency(Number.POSITIVE_INFINITY), 'Tk 0.00');
});

test('isPositiveDecimalString identifies strictly positive decimal values', () => {
  assert.equal(isPositiveDecimalString('0.00'), false);
  assert.equal(isPositiveDecimalString('-50.00'), false);
  assert.equal(isPositiveDecimalString('0.01'), true);
  assert.equal(isPositiveDecimalString('100.00'), true);
  assert.equal(isPositiveDecimalString('invalid'), false);
});

test('formatCalendarDate formats YYYY-MM-DD without timezone off-by-one shift', () => {
  assert.equal(formatCalendarDate('2026-11-26'), '26 Nov, 2026');
  assert.equal(formatCalendarDate('2026-01-01'), '1 Jan, 2026');
  assert.equal(formatCalendarDate(''), 'N/A');
  assert.equal(formatCalendarDate(null), 'N/A');
  assert.equal(formatDateTime('invalid-date'), 'N/A');
});

test('extractShippingMethodSnapshotLabel handles string, object, and null values', () => {
  assert.equal(extractShippingMethodSnapshotLabel('Inside Dhaka Express'), 'Inside Dhaka Express');
  assert.equal(extractShippingMethodSnapshotLabel({ name: 'Outside Dhaka Courier', code: 'OUTSIDE' }), 'Outside Dhaka Courier');
  assert.equal(extractShippingMethodSnapshotLabel({ title: 'Store Pickup' }), 'Store Pickup');
  assert.equal(extractShippingMethodSnapshotLabel(null), null);
  assert.equal(extractShippingMethodSnapshotLabel('   '), null);
});

test('mapTrackedOrder normalizes valid tracking payloads and rejects empty/unexpected responses', () => {
  const mapped = mapTrackedOrder({
    invoice_number: 'SALE-20261126-000010',
    sale_date: '2026-11-26',
    created_at: '2026-11-26T10:15:00Z',
    status: 'OUT_OF_DELIVERY',
    status_label: 'Out of Delivery',
    subtotal_amount: '45999.50',
    discount_amount: '500.00',
    tax_amount: '0.00',
    shipping_amount: '120.00',
    total_amount: '45619.50',
    shipping_method_snapshot: { name: 'Dhaka Same-Day' },
    items: [
      {
        product_name: 'AMD Ryzen 7 &amp; Cooler Bundle',
        variant_name: 'Boxed Edition',
        sku: 'CPU-R7-7800X3D',
        quantity: 1,
        unit_price: '45999.50',
        line_total: '45999.50'
      },
      {
        product_name: 'Thermal Paste',
        variant_name: null,
        sku: 'TP-01',
        quantity: 2,
        unit_price: '250.00',
        line_total: '500.00'
      }
    ]
  });

  assert.equal(mapped.invoiceNumber, 'SALE-20261126-000010');
  assert.equal(mapped.status, 'out_of_delivery');
  assert.equal(mapped.rawStatus, 'OUT_OF_DELIVERY');
  assert.equal(mapped.statusLabel, 'Out of Delivery');
  assert.equal(mapped.shippingMethodLabel, 'Dhaka Same-Day');
  assert.equal(mapped.subtotalAmount, '45999.50');
  assert.equal(mapped.totalAmount, '45619.50');
  assert.equal(mapped.items.length, 2);
  assert.equal(mapped.items[0]!.variantName, 'Boxed Edition');
  assert.equal(mapped.items[1]!.variantName, null);

  for (const unexpected of [null, undefined, [], {}, { foo: 'bar' }]) {
    assert.throws(
      () => mapTrackedOrder(unexpected),
      (err: any) => err?.isUnexpectedPayload === true
    );
  }
});

test('useSalesService.trackOrderByInvoice issues public GET /api/v1/sales/track/{invoice_number}/ without auth', async () => {
  const capturedRequests: Array<{ url: string; options: any }> = [];
  (globalThis as any).__mockUseApiClientTrack = () => ({
    isLoading: { value: false },
    errorMsg: { value: null },
    request: async (url: string, options: any) => {
      capturedRequests.push({ url, options });
      return {
        invoice_number: 'SALE-20261126-000099',
        sale_date: '2026-11-26',
        created_at: '2026-11-26T12:00:00Z',
        status: 'SHIPPED',
        status_label: 'Shipped',
        subtotal_amount: '1500.50',
        discount_amount: '0.00',
        tax_amount: '0.00',
        shipping_amount: '60.00',
        total_amount: '1560.50',
        shipping_method_snapshot: null,
        items: [
          {
            product_name: 'NVMe SSD 1TB',
            variant_name: null,
            sku: 'SSD-1TB',
            quantity: 1,
            unit_price: '1500.50',
            line_total: '1500.50'
          }
        ]
      };
    }
  });

  const utilsOrderUrl = pathToFileURL(path.resolve(process.cwd(), 'utils/order.ts')).href;
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === './useApiClient' && context.parentURL?.includes('/composables/useSalesService.ts')) {
        return { url: 'mock:useApiClientTrack', shortCircuit: true };
      }
      if (specifier === '@/utils/order') {
        return { url: utilsOrderUrl, shortCircuit: true };
      }
      return nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
      if (url === 'mock:useApiClientTrack') {
        return {
          format: 'module',
          source: 'export const useApiClient = () => globalThis.__mockUseApiClientTrack();',
          shortCircuit: true
        };
      }
      return nextLoad(url, context);
    }
  });

  try {
    const salesServiceUrl = pathToFileURL(path.resolve(process.cwd(), 'composables/useSalesService.ts')).href;
    const { useSalesService } = await import(`${salesServiceUrl}?t=${Date.now()}`);
    const salesService = useSalesService();

    const controller = new AbortController();
    const tracked = await salesService.trackOrderByInvoice(' SALE-20261126-000099 ', { signal: controller.signal });

    assert.equal(capturedRequests.length, 1);
    assert.equal(capturedRequests[0]!.url, '/api/v1/sales/track/SALE-20261126-000099/');
    assert.equal(capturedRequests[0]!.options.method, 'GET');
    assert.equal(capturedRequests[0]!.options.isPublic, true);
    assert.equal(capturedRequests[0]!.options.signal, controller.signal);
    assert.equal(tracked.invoiceNumber, 'SALE-20261126-000099');
    assert.equal(tracked.statusLabel, 'Shipped');

    await assert.rejects(() => salesService.trackOrderByInvoice('   '), /Invoice number is required/);
  } finally {
    hooks.deregister();
    delete (globalThis as any).__mockUseApiClientTrack;
  }
});
