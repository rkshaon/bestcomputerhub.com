// File: /tests/sales-performance.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse, compileTemplate } from '@vue/compiler-sfc';
import { formatCurrency } from '../utils/index';
import {
  toMoney,
  calculateDeliveredRevenuePercentage,
  formatDeliveredRevenuePercentage,
  normalizeComparisonGrowth
} from '../utils/order';

test('toMoney parses numeric strings and numbers safely while rejecting invalid values', () => {
  assert.equal(toMoney('250000.50'), 250000.5);
  assert.equal(toMoney(' 125000 '), 125000);
  assert.equal(toMoney(98765.4), 98765.4);
  assert.equal(toMoney(0), 0);
  assert.equal(toMoney('0.00'), 0);
  assert.equal(toMoney(null), 0);
  assert.equal(toMoney(undefined), 0);
  assert.equal(toMoney(''), 0);
  assert.equal(toMoney('not-a-number'), 0);
  assert.equal(toMoney('Infinity'), 0);
  assert.equal(toMoney(Infinity), 0);
  assert.equal(toMoney(-Infinity), 0);
  assert.equal(toMoney(NaN), 0);
});

test('calculateDeliveredRevenuePercentage computes delivered_order_amount / total_revenue * 100', () => {
  assert.equal(calculateDeliveredRevenuePercentage('75000.00', '100000.00'), 75);
  assert.equal(calculateDeliveredRevenuePercentage(50000, 50000), 100);
  assert.equal(calculateDeliveredRevenuePercentage('100000.00', '300000.00'), 33.3);
  assert.equal(calculateDeliveredRevenuePercentage('12500', '100000'), 12.5);
  assert.equal(calculateDeliveredRevenuePercentage(0, '100000.00'), 0);
});

test('calculateDeliveredRevenuePercentage prevents division by zero and non-finite edge cases', () => {
  assert.equal(calculateDeliveredRevenuePercentage('50000.00', '0.00'), 0);
  assert.equal(calculateDeliveredRevenuePercentage(50000, 0), 0);
  assert.equal(calculateDeliveredRevenuePercentage(50000, -100), 0);
  assert.equal(calculateDeliveredRevenuePercentage(null, '100000.00'), 0);
  assert.equal(calculateDeliveredRevenuePercentage(undefined, undefined), 0);
  assert.equal(calculateDeliveredRevenuePercentage('invalid', '100000.00'), 0);
  assert.equal(calculateDeliveredRevenuePercentage('50000', 'invalid'), 0);
  assert.equal(calculateDeliveredRevenuePercentage('Infinity', '100000'), 0);
  assert.equal(calculateDeliveredRevenuePercentage('50000', 'Infinity'), 0);
});

test('formatDeliveredRevenuePercentage and formatCurrency render clean dashboard strings', () => {
  assert.equal(formatDeliveredRevenuePercentage('75000.00', '100000.00'), '75%');
  assert.equal(formatDeliveredRevenuePercentage('100000.00', '300000.00'), '33.3%');
  assert.equal(formatDeliveredRevenuePercentage('0', '0'), '0%');
  assert.equal(formatDeliveredRevenuePercentage(undefined, null), '0%');

  assert.equal(formatCurrency(toMoney('100000.00')), 'Tk 100,000');
  assert.equal(formatCurrency(toMoney('75000.00')), 'Tk 75,000');
  assert.equal(formatCurrency(toMoney(undefined)), 'Tk 0');
  assert.equal(formatCurrency(toMoney('Infinity')), 'Tk 0');
});

test('normalizeComparisonGrowth distinguishes legitimate numeric zero from missing or invalid values', () => {
  assert.equal(normalizeComparisonGrowth(0), 0);
  assert.equal(normalizeComparisonGrowth('0'), 0);
  assert.equal(normalizeComparisonGrowth('0.0'), 0);
  assert.equal(normalizeComparisonGrowth(-0), 0);
  assert.equal(normalizeComparisonGrowth(12.5), 12.5);
  assert.equal(normalizeComparisonGrowth('-4.2'), -4.2);

  assert.equal(normalizeComparisonGrowth(undefined), undefined);
  assert.equal(normalizeComparisonGrowth(null), undefined);
  assert.equal(normalizeComparisonGrowth(''), undefined);
  assert.equal(normalizeComparisonGrowth('   '), undefined);
  assert.equal(normalizeComparisonGrowth('invalid'), undefined);
  assert.equal(normalizeComparisonGrowth(NaN), undefined);
  assert.equal(normalizeComparisonGrowth(Infinity), undefined);
  assert.equal(normalizeComparisonGrowth(-Infinity), undefined);
});

test('DashboardStatCard, admin layout, and Admin Dashboard SFCs compile cleanly without removed placeholders', () => {
  const cardSource = readFileSync(resolve('features/admin/components/DashboardStatCard.vue'), 'utf8');
  const cardParsed = parse(cardSource);
  assert.ok(cardParsed.descriptor.template, 'DashboardStatCard.vue should have a template');
  const cardCompiled = compileTemplate({
    source: cardParsed.descriptor.template.content,
    filename: 'DashboardStatCard.vue',
    id: 'DashboardStatCard.vue'
  });
  assert.equal(cardCompiled.errors.length, 0);
  assert.doesNotMatch(cardSource, /defaultSeries/);
  assert.doesNotMatch(cardSource, /getSparklinePath/);
  assert.doesNotMatch(cardSource, /sparklineClass/);
  assert.match(cardSource, /v-if="typeof trend === 'number' && Number\.isFinite\(trend\)"/);
  assert.match(cardSource, /trend > 0/);
  assert.match(cardSource, /v-if="\$slots\.footer"/);
  assert.match(cardSource, /<slot name="footer" \/>/);

  const layoutSource = readFileSync(resolve('layouts/admin.vue'), 'utf8');
  const layoutParsed = parse(layoutSource);
  assert.ok(layoutParsed.descriptor.template, 'layouts/admin.vue should have a template');
  const layoutCompiled = compileTemplate({
    source: layoutParsed.descriptor.template.content,
    filename: 'layouts/admin.vue',
    id: 'layouts/admin.vue'
  });
  assert.equal(layoutCompiled.errors.length, 0);
  assert.doesNotMatch(layoutSource, /Search operations\.\.\./);
  assert.doesNotMatch(layoutSource, /⌘K/);

  const pageSource = readFileSync(resolve('pages/admin/index.vue'), 'utf8');
  const pageParsed = parse(pageSource);
  assert.ok(pageParsed.descriptor.template, 'pages/admin/index.vue should have a template');
  const pageCompiled = compileTemplate({
    source: pageParsed.descriptor.template.content,
    filename: 'pages/admin/index.vue',
    id: 'pages/admin/index.vue'
  });
  assert.equal(pageCompiled.errors.length, 0);

  assert.doesNotMatch(pageSource, /v4\.2\.1/);
  assert.doesNotMatch(pageSource, /Optimization Pulse/);
  assert.doesNotMatch(pageSource, /Export Report/);
  assert.match(pageSource, /<template #header-title>/);
  assert.match(pageSource, /System Overview/);
  assert.match(pageSource, /extractErrorMessage\(err,\s*'Failed to load sales performance report\.'\)/);
  assert.match(pageSource, /formatCurrency\(averageOrderValueAmount\)/);
  assert.match(pageSource, /formatCurrency\(toMoney\(lastOrder\.total_amount\)\)/);
  assert.match(pageSource, /Sales Performance Restricted/);
  assert.match(pageSource, /label="Total Revenue"/);
  assert.match(pageSource, /:value="formatCurrency\(totalRevenueAmount\)"/);
  assert.match(pageSource, /Delivered Amount/);
  assert.match(pageSource, /formatCurrency\(deliveredOrderAmount\)/);
  assert.match(pageSource, /Delivered Revenue/);
  assert.match(pageSource, /deliveredRevenuePercentage/);
  assert.match(pageSource, /formatDeliveredRevenuePercentage\(overview\.value\?\.delivered_order_amount,\s*overview\.value\?\.total_revenue\)/);
});

test('useSalesService.getPendingOrdersCount preserves null on error and distinguishes genuine zero', async () => {
  const { registerHooks } = await import('node:module');
  const { pathToFileURL } = await import('node:url');
  const path = await import('node:path');

  let nextBehavior: 'zero' | 'five' | 'malformed' | 'error' = 'five';
  (globalThis as any).__mockPendingClient = () => ({
    isLoading: { value: false },
    errorMsg: { value: null },
    request: async () => {
      if (nextBehavior === 'error') {
        throw new Error('Network unavailable');
      }
      if (nextBehavior === 'malformed') {
        return { data: 'Success (Simulated Mode)' };
      }
      if (nextBehavior === 'zero') {
        return { data: { pending_orders: 0 } };
      }
      return { pending_orders: 5 };
    }
  });

  const utilsOrderUrl = pathToFileURL(path.resolve(process.cwd(), 'utils/order.ts')).href;
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === './useApiClient' && context.parentURL?.includes('/composables/useSalesService.ts')) {
        return { url: 'mock:useApiClientPending', shortCircuit: true };
      }
      if (specifier === '@/utils/order') {
        return { url: utilsOrderUrl, shortCircuit: true };
      }
      return nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
      if (url === 'mock:useApiClientPending') {
        return {
          format: 'module',
          source: 'export const useApiClient = () => globalThis.__mockPendingClient();',
          shortCircuit: true
        };
      }
      return nextLoad(url, context);
    }
  });

  try {
    const salesServiceUrl = pathToFileURL(path.resolve(process.cwd(), 'composables/useSalesService.ts')).href;
    const { useSalesService, pendingOrdersCount } = await import(`${salesServiceUrl}?t=${Date.now()}`);
    const salesService = useSalesService();

    nextBehavior = 'five';
    assert.equal(await salesService.getPendingOrdersCount(), 5);
    assert.equal(pendingOrdersCount.value, 5);

    nextBehavior = 'error';
    await assert.rejects(() => salesService.getPendingOrdersCount(), /Network unavailable/);
    assert.equal(pendingOrdersCount.value, null);

    nextBehavior = 'zero';
    assert.equal(await salesService.getPendingOrdersCount(), 0);
    assert.equal(pendingOrdersCount.value, 0);

    nextBehavior = 'malformed';
    assert.equal(await salesService.getPendingOrdersCount(), null);
    assert.equal(pendingOrdersCount.value, null);
  } finally {
    hooks.deregister();
    delete (globalThis as any).__mockPendingClient;
  }
});
