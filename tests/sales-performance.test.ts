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
  assert.match(cardSource, /v-if="\$slots\.background"/);
  assert.match(cardSource, /<slot name="background" \/>/);
  assert.match(cardSource, /relative z-10/);
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
  assert.match(pageSource, /<template #background>/);
  assert.doesNotMatch(pageSource, /Delivered Amount/);
  assert.doesNotMatch(pageSource, /Delivered Revenue/);
  assert.match(pageSource, />Delivered<\/span>/);
  assert.match(pageSource, /formatCurrency\(deliveredOrderAmount\)/);
  assert.match(pageSource, /calculateDeliveredRevenuePercentage\(overview\.value\?\.delivered_order_amount,\s*overview\.value\?\.total_revenue\)/);
  assert.match(pageSource, /formatDeliveredRevenuePercentage\(overview\.value\?\.delivered_order_amount,\s*overview\.value\?\.total_revenue\)/);
  assert.match(pageSource, /if \(pct > 75\)/);
  assert.match(pageSource, /if \(pct > 50\)/);
  assert.equal((pageSource.match(/<template #background>/g) || []).length, 1);
});

test('Total Revenue KPI card renders oversized watermark behind content with accurate green/yellow/red boundaries', async () => {
  const { createSSRApp, defineComponent, h } = await import('vue');
  const { renderToString } = await import('vue/server-renderer');
  const { compileScript } = await import('@vue/compiler-sfc');
  const { DollarSign } = await import('lucide-vue-next');
  const { cn } = await import('../utils/index');

  const cardPath = resolve('features/admin/components/DashboardStatCard.vue');
  const cardSource = readFileSync(cardPath, 'utf8');
  const cardParsed = parse(cardSource, { filename: cardPath });
  const cardScript = compileScript(cardParsed.descriptor, { id: 'stat-card-ssr', inlineTemplate: false });
  const cardRenderFn = new Function('Vue', compileTemplate({
    source: cardParsed.descriptor.template!.content,
    filename: cardPath,
    id: 'stat-card-ssr',
    compilerOptions: { mode: 'function', bindingMetadata: cardScript.bindings }
  }).code)(await import('vue'));

  const uiCardStub = defineComponent({
    setup(_, { slots, attrs }) {
      return () => h('div', { class: attrs.class }, slots.default?.());
    }
  });

  const StatCardHost = defineComponent({
    props: ['label', 'value', 'icon', 'trend', 'color', 'cardClass', 'iconBoxClass', 'iconClass', 'valueClass'],
    setup(props) {
      return { ...props, cn, UiCard: uiCardStub };
    },
    render: cardRenderFn
  });

  const colorForPercentage = (pct: number) => {
    if (pct > 75) return 'text-green-700/[0.18] dark:text-green-400/[0.18]';
    if (pct > 50) return 'text-yellow-600/[0.22] dark:text-yellow-400/[0.18]';
    return 'text-red-700/[0.18] dark:text-red-400/[0.18]';
  };

  const cases: Array<{ delivered: number; total: number; expectedPct: string; expectedClass: string }> = [
    { delivered: 99900, total: 100000, expectedPct: '99.9%', expectedClass: 'text-green-700/[0.18]' },
    { delivered: 75100, total: 100000, expectedPct: '75.1%', expectedClass: 'text-green-700/[0.18]' },
    { delivered: 75000, total: 100000, expectedPct: '75%', expectedClass: 'text-yellow-600/[0.22]' },
    { delivered: 60000, total: 100000, expectedPct: '60%', expectedClass: 'text-yellow-600/[0.22]' },
    { delivered: 50100, total: 100000, expectedPct: '50.1%', expectedClass: 'text-yellow-600/[0.22]' },
    { delivered: 50000, total: 100000, expectedPct: '50%', expectedClass: 'text-red-700/[0.18]' },
    { delivered: 35000, total: 100000, expectedPct: '35%', expectedClass: 'text-red-700/[0.18]' },
    { delivered: 0, total: 0, expectedPct: '0%', expectedClass: 'text-red-700/[0.18]' },
  ];

  for (const testCase of cases) {
    const pctNum = calculateDeliveredRevenuePercentage(testCase.delivered, testCase.total);
    const pctText = formatDeliveredRevenuePercentage(testCase.delivered, testCase.total);
    const colorClass = colorForPercentage(pctNum);
    assert.equal(pctText, testCase.expectedPct);
    assert.ok(colorClass.includes(testCase.expectedClass));

    const app = createSSRApp({
      render: () => h(
        StatCardHost,
        {
          label: 'Total Revenue',
          value: formatCurrency(testCase.total),
          icon: DollarSign,
          color: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600'
        },
        {
          background: () => h('div', { class: 'w-full h-full flex items-center justify-center [container-type:size]' }, [
            h('span', { class: colorClass }, pctText)
          ]),
          footer: () => h('div', { class: 'pt-2 border-t border-border/70' }, [
            h('span', 'Delivered'),
            h('span', formatCurrency(testCase.delivered))
          ])
        }
      )
    });
    app.component('UiCard', uiCardStub);
    const html = await renderToString(app);

    assert.ok(html.includes('aria-hidden="true"'));
    assert.ok(html.includes('z-0') && html.includes('z-10'));
    assert.ok(html.indexOf(pctText) < html.indexOf('Total Revenue'), 'Watermark must precede foreground content in stacking order');
    assert.ok(html.includes(testCase.expectedClass), `Expected ${testCase.expectedClass} for ${pctText}`);
    assert.ok(html.includes('Delivered'));
  }

  // Cards omitting #background render no watermark wrapper
  const plainCardApp = createSSRApp({
    render: () => h(StatCardHost, { label: 'Total Orders', value: '42', icon: DollarSign })
  });
  plainCardApp.component('UiCard', uiCardStub);
  const plainHtml = await renderToString(plainCardApp);
  assert.equal(plainHtml.includes('z-0'), false);
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
