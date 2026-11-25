// File: /tests/order-status.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { getAvailableOrderStatusOptions, mapOrderDetail, mapOrderSummary, normalizeOrderStatus } from '../utils/order';
import type { OrderStatusOption } from '../types/order';
import type { BackendOrderDetail, BackendOrderSummary } from '../types/checkout';

const ALL_BACKEND_STATUSES: OrderStatusOption[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'PACKAGED', label: 'Packaged' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'OUT_OF_DELIVERY', label: 'Out for Delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'RETURNED', label: 'Returned' },
  { value: 'CANCELLED', label: 'Cancelled' }
];

const BACKEND_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['PACKAGED', 'CANCELLED'],
  PACKAGED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_OF_DELIVERY', 'DELIVERED'],
  OUT_OF_DELIVERY: ['DELIVERED', 'RETURNED'],
  DELIVERED: ['RETURNED'],
  RETURNED: [],
  CANCELLED: []
};

test('resolves uppercase status options for every non-terminal order state from GET /api/v1/sales/statuses/', () => {
  const cases: Array<{ current: string; expectedValues: string[] }> = [
    { current: 'pending', expectedValues: ['CONFIRMED', 'CANCELLED'] },
    { current: 'confirmed', expectedValues: ['PROCESSING', 'CANCELLED'] },
    { current: 'processing', expectedValues: ['PACKAGED', 'CANCELLED'] },
    { current: 'packaged', expectedValues: ['SHIPPED', 'CANCELLED'] },
    { current: 'shipped', expectedValues: ['OUT_OF_DELIVERY', 'DELIVERED'] },
    { current: 'out_of_delivery', expectedValues: ['DELIVERED', 'RETURNED'] },
    { current: 'delivered', expectedValues: ['RETURNED'] }
  ];

  for (const testCase of cases) {
    const options = getAvailableOrderStatusOptions({
      currentStatus: testCase.current,
      statuses: ALL_BACKEND_STATUSES,
      transitions: BACKEND_TRANSITIONS
    });
    assert.deepEqual(
      options.map((o) => o.value),
      testCase.expectedValues,
      `Expected uppercase transitions for state ${testCase.current}`
    );
  }
});

test('preserves exact uppercase CANCELLED value rather than lowercase', () => {
  const options = getAvailableOrderStatusOptions({
    currentStatus: 'confirmed',
    statuses: ALL_BACKEND_STATUSES,
    transitions: BACKEND_TRANSITIONS
  });

  const cancelledOption = options.find((o) => o.value === 'CANCELLED');
  assert.ok(cancelledOption, 'Expected CANCELLED option to be present');
  assert.equal(cancelledOption.value, 'CANCELLED');
  assert.notEqual(cancelledOption.value, 'cancelled');
});

test('returns empty array for terminal states with explicit empty transitions', () => {
  for (const terminalState of ['returned', 'cancelled']) {
    const options = getAvailableOrderStatusOptions({
      currentStatus: terminalState,
      statuses: ALL_BACKEND_STATUSES,
      transitions: BACKEND_TRANSITIONS
    });
    assert.deepEqual(options, []);
  }
});

test('falls back to all non-current statuses in uppercase when transitions are absent or omit current status', () => {
  const withoutTransitions = getAvailableOrderStatusOptions({
    currentStatus: 'processing',
    statuses: ALL_BACKEND_STATUSES
  });
  assert.equal(withoutTransitions.length, ALL_BACKEND_STATUSES.length - 1);
  assert.ok(!withoutTransitions.some((o) => o.value === 'PROCESSING'));
  assert.ok(withoutTransitions.every((o) => o.value === o.value.toUpperCase()));
});

test('falls back to uppercase-normalized order.allowedNextStatuses when statuses API list is empty', () => {
  const options = getAvailableOrderStatusOptions({
    currentStatus: 'pending',
    statuses: [],
    transitions: {},
    fallbackNextStatuses: [
      { value: 'confirmed', label: 'Confirmed' },
      { value: 'cancelled', label: 'Cancelled' }
    ]
  });

  assert.deepEqual(options, [
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ]);
});

test('normalizes and maps RETURNED and CANCELLED order details cleanly', () => {
  assert.equal(normalizeOrderStatus('RETURNED'), 'returned');
  assert.equal(normalizeOrderStatus('CANCELLED'), 'cancelled');

  const rawDetail: BackendOrderDetail = {
    id: 42,
    invoice_number: 'SALE-20261122-000042',
    status: 'RETURNED',
    payment_status: 'UNPAID',
    channel: 'WEBSITE',
    customer: { id: 7, user: { id: 7, username: 'alice' }, full_name: 'Alice' },
    items: [],
    shipping_address: null,
    subtotal_amount: '1000.00',
    discount_amount: '0.00',
    tax_amount: '0.00',
    shipping_amount: '50.00',
    total_amount: '1050.00',
    shipping_method: null,
    notes: '',
    created_at: '2026-11-22T06:22:24.771895Z',
    updated_at: '2026-11-22T07:00:00.000000Z',
    allowed_next_statuses: [],
    account: null,
    accounting_transaction: null,
    return_transaction: null,
    collection_transaction: null
  };

  const mapped = mapOrderDetail(rawDetail);
  assert.equal(mapped.status, 'returned');
  assert.equal(mapped.orderNumber, 'SALE-20261122-000042');
});

test('useSalesService.updateStatus sends POST to /api/v1/sales/{id}/update-status/ with uppercase status payload', async () => {
  const { registerHooks } = await import('node:module');
  const { pathToFileURL } = await import('node:url');
  const path = await import('node:path');

  const capturedRequests: Array<{ url: string; options: any }> = [];
  (globalThis as any).__mockUseApiClient = () => ({
    isLoading: { value: false },
    errorMsg: { value: null },
    request: async (url: string, options: any) => {
      capturedRequests.push({ url, options });
      if (url === '/api/v1/sales/pending-count/') {
        return { pending_orders: 0 };
      }
      return { id: '42', status: options?.body?.status };
    }
  });

  const utilsOrderUrl = pathToFileURL(path.resolve(process.cwd(), 'utils/order.ts')).href;
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === './useApiClient' && context.parentURL?.includes('/composables/useSalesService.ts')) {
        return { url: 'mock:useApiClient', shortCircuit: true };
      }
      if (specifier === '@/utils/order') {
        return { url: utilsOrderUrl, shortCircuit: true };
      }
      return nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
      if (url === 'mock:useApiClient') {
        return {
          format: 'module',
          source: 'export const useApiClient = () => globalThis.__mockUseApiClient();',
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

    await salesService.updateStatus('42', 'CANCELLED');
    await salesService.updateStatus('42', 'cancelled');

    const updateCalls = capturedRequests.filter((r) => r.url === '/api/v1/sales/42/update-status/');
    assert.equal(updateCalls.length, 2);
    assert.equal(updateCalls[0]!.options.method, 'POST');
    assert.deepEqual(updateCalls[0]!.options.body, { status: 'CANCELLED' });
    assert.equal(updateCalls[1]!.options.method, 'POST');
    assert.deepEqual(updateCalls[1]!.options.body, { status: 'CANCELLED' });
  } finally {
    hooks.deregister();
    delete (globalThis as any).__mockUseApiClient;
  }
});

test('mapOrderSummary normalizes whitespace/case and assigns orders accurately across Kanban columns', () => {
  const summaries: BackendOrderSummary[] = [
    {
      id: 1,
      invoice_number: 'SALE-001',
      status: 'PENDING',
      payment_status: 'UNPAID',
      total_amount: '100.00',
      item_count: 1,
      created_at: '2026-11-22T06:00:00Z',
      sale_date: '2026-11-22T06:00:00Z',
      customer: { full_name: 'Alice', user: { username: 'alice' } }
    },
    {
      id: 2,
      invoice_number: 'SALE-002',
      status: ' OUT_OF_DELIVERY ' as any,
      payment_status: 'UNPAID',
      total_amount: '200.00',
      item_count: 2,
      created_at: '2026-11-22T06:00:00Z',
      sale_date: '2026-11-22T06:00:00Z',
      customer: { full_name: 'Bob', user: { username: 'bob' } }
    },
    {
      id: 3,
      invoice_number: 'SALE-003',
      status: 'delivered' as any,
      payment_status: 'COLLECTED',
      total_amount: '300.00',
      item_count: 3,
      created_at: '2026-11-22T06:00:00Z',
      sale_date: '2026-11-22T06:00:00Z',
      customer: { full_name: 'Carol', user: { username: 'carol' } }
    }
  ];

  const mappedOrders = summaries.map(mapOrderSummary);
  assert.deepEqual(
    mappedOrders.map((o) => o.status),
    ['pending', 'out_of_delivery', 'delivered']
  );

  const normalizeStatus = (status: string | null | undefined): string =>
    String(status ?? '').trim().toLowerCase();

  const statusesWithWhitespace: OrderStatusOption[] = ALL_BACKEND_STATUSES.map((s) =>
    s.value === 'OUT_OF_DELIVERY' ? { ...s, value: ' OUT_OF_DELIVERY ' } : s
  );

  const columns = statusesWithWhitespace.map((status) => {
    const columnStatus = normalizeStatus(status.value);
    return {
      ...status,
      orders: mappedOrders.filter((o) => normalizeStatus(o.status) === columnStatus)
    };
  });

  assert.equal(columns.find((c) => c.label === 'Pending')?.orders.length, 1);
  assert.equal(columns.find((c) => c.label === 'Out for Delivery')?.orders.length, 1);
  assert.equal(columns.find((c) => c.label === 'Delivered')?.orders.length, 1);
  assert.equal(columns.find((c) => c.label === 'Cancelled')?.orders.length, 0);
});

test('mapOrderDetail preserves real product slugs from order items and omits slug when unavailable', () => {
  const rawDetail: BackendOrderDetail = {
    id: 77,
    invoice_number: 'SALE-20261125-000077',
    status: 'CONFIRMED',
    payment_status: 'UNPAID',
    channel: 'WEBSITE',
    customer: { id: 9, user: { id: 9, username: 'bob' }, full_name: 'Bob' },
    items: [
      {
        id: 101,
        product_variant: {
          id: 501,
          sku: 'GPU-4070',
          name: 'RTX 4070',
          product: 'ASUS RTX 4070',
          product_slug: 'asus-rtx-4070'
        },
        product_name: 'ASUS RTX 4070',
        quantity: 1,
        unit_price: '85000.00',
        line_total: '85000.00'
      },
      {
        id: 102,
        product_variant: {
          id: 502,
          sku: 'RAM-32GB',
          name: '32GB DDR5',
          product: { id: 88, name: 'Corsair 32GB DDR5', slug: 'corsair-32gb-ddr5' }
        },
        product_name: 'Corsair 32GB DDR5',
        quantity: 2,
        unit_price: '12000.00',
        line_total: '24000.00'
      },
      {
        id: 103,
        product_variant: {
          id: 503,
          sku: 'LEGACY-SKU',
          name: 'Legacy Item',
          product: 'Legacy Item'
        },
        product_name: 'Legacy Item',
        quantity: 1,
        unit_price: '500.00',
        line_total: '500.00'
      }
    ],
    shipping_address: null,
    subtotal_amount: '109500.00',
    discount_amount: '0.00',
    tax_amount: '0.00',
    shipping_amount: '0.00',
    total_amount: '109500.00',
    shipping_method: null,
    notes: '',
    created_at: '2026-11-25T10:00:00Z',
    updated_at: '2026-11-25T10:00:00Z',
    allowed_next_statuses: [],
    account: null,
    accounting_transaction: null,
    return_transaction: null,
    collection_transaction: null
  };

  const mapped = mapOrderDetail(rawDetail);
  assert.equal(mapped.items.length, 3);
  assert.equal(mapped.items[0]!.product.slug, 'asus-rtx-4070');
  assert.equal(mapped.items[1]!.product.name, 'Corsair 32GB DDR5');
  assert.equal(mapped.items[1]!.product.slug, 'corsair-32gb-ddr5');
  assert.equal(mapped.items[2]!.product.slug, undefined);
});
