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
  formatDeliveredRevenuePercentage
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

test('DashboardStatCard compiles with optional #footer slot and Admin Dashboard renders delivered revenue breakdown', () => {
  const cardSource = readFileSync(resolve('features/admin/components/DashboardStatCard.vue'), 'utf8');
  const cardParsed = parse(cardSource);
  assert.ok(cardParsed.descriptor.template, 'DashboardStatCard.vue should have a template');
  const cardCompiled = compileTemplate({
    source: cardParsed.descriptor.template.content,
    filename: 'DashboardStatCard.vue',
    id: 'DashboardStatCard.vue'
  });
  assert.equal(cardCompiled.errors.length, 0);
  assert.match(cardSource, /v-if="\$slots\.footer"/);
  assert.match(cardSource, /<slot name="footer" \/>/);

  const pageSource = readFileSync(resolve('pages/admin/index.vue'), 'utf8');
  const pageParsed = parse(pageSource);
  assert.ok(pageParsed.descriptor.template, 'pages/admin/index.vue should have a template');
  const pageCompiled = compileTemplate({
    source: pageParsed.descriptor.template.content,
    filename: 'pages/admin/index.vue',
    id: 'pages/admin/index.vue'
  });
  assert.equal(pageCompiled.errors.length, 0);

  assert.match(pageSource, /label="Total Revenue"/);
  assert.match(pageSource, /:value="formatCurrency\(totalRevenueAmount\)"/);
  assert.match(pageSource, /Delivered Amount/);
  assert.match(pageSource, /formatCurrency\(deliveredOrderAmount\)/);
  assert.match(pageSource, /Delivered Revenue/);
  assert.match(pageSource, /deliveredRevenuePercentage/);
  assert.match(pageSource, /formatDeliveredRevenuePercentage\(overview\.value\.delivered_order_amount,\s*overview\.value\.total_revenue\)/);
});
