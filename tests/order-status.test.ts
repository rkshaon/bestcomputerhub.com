// File: /tests/order-status.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { getAvailableOrderStatusOptions, mapOrderDetail, normalizeOrderStatus } from '../utils/order';
import type { OrderStatusOption } from '../types/order';
import type { BackendOrderDetail } from '../types/checkout';

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
