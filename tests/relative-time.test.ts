// File: /tests/relative-time.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { formatRelativeTime } from '../utils/index';

const BASE_NOW = Date.parse('2026-11-22T06:22:24.771Z');
const SECOND_MS = 1_000;
const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

test('formats elapsed seconds under 1 minute as "Just now"', () => {
  assert.equal(formatRelativeTime(BASE_NOW, { now: BASE_NOW }), 'Just now');
  assert.equal(formatRelativeTime(BASE_NOW - 30 * SECOND_MS, { now: BASE_NOW }), 'Just now');
  assert.equal(formatRelativeTime(BASE_NOW - 59 * SECOND_MS, { now: BASE_NOW }), 'Just now');
  assert.equal(formatRelativeTime(BASE_NOW - (MINUTE_MS - 1), { now: BASE_NOW }), 'Just now');
});

test('formats elapsed minutes from 1 to 59 with singular and plural wording', () => {
  assert.equal(formatRelativeTime(BASE_NOW - 1 * MINUTE_MS, { now: BASE_NOW }), '1 minute ago');
  assert.equal(formatRelativeTime(BASE_NOW - (2 * MINUTE_MS - 1), { now: BASE_NOW }), '1 minute ago');
  assert.equal(formatRelativeTime(BASE_NOW - 5 * MINUTE_MS, { now: BASE_NOW }), '5 minutes ago');
  assert.equal(formatRelativeTime(BASE_NOW - 59 * MINUTE_MS, { now: BASE_NOW }), '59 minutes ago');
  assert.equal(formatRelativeTime(BASE_NOW - (HOUR_MS - 1), { now: BASE_NOW }), '59 minutes ago');
});

test('formats elapsed hours from 1 to 23 with singular and plural wording', () => {
  assert.equal(formatRelativeTime(BASE_NOW - 1 * HOUR_MS, { now: BASE_NOW }), '1 hour ago');
  assert.equal(formatRelativeTime(BASE_NOW - (2 * HOUR_MS - 1), { now: BASE_NOW }), '1 hour ago');
  assert.equal(formatRelativeTime(BASE_NOW - 3 * HOUR_MS, { now: BASE_NOW }), '3 hours ago');
  assert.equal(formatRelativeTime(BASE_NOW - 23 * HOUR_MS, { now: BASE_NOW }), '23 hours ago');
  assert.equal(formatRelativeTime(BASE_NOW - (DAY_MS - 1), { now: BASE_NOW }), '23 hours ago');
});

test('formats elapsed days from 1 day and beyond without larger units', () => {
  assert.equal(formatRelativeTime(BASE_NOW - 1 * DAY_MS, { now: BASE_NOW }), '1 day ago');
  assert.equal(formatRelativeTime(BASE_NOW - (2 * DAY_MS - 1), { now: BASE_NOW }), '1 day ago');
  assert.equal(formatRelativeTime(BASE_NOW - 4 * DAY_MS, { now: BASE_NOW }), '4 days ago');
  assert.equal(formatRelativeTime(BASE_NOW - 30 * DAY_MS, { now: BASE_NOW }), '30 days ago');
  assert.equal(formatRelativeTime(BASE_NOW - 45 * DAY_MS, { now: BASE_NOW }), '45 days ago');
  assert.equal(formatRelativeTime(BASE_NOW - 400 * DAY_MS, { now: BASE_NOW }), '400 days ago');
});

test('parses backend UTC ISO timestamp with microseconds', () => {
  const createdAt = '2026-11-22T06:22:24.771895Z';
  const createdMs = Date.parse(createdAt);

  assert.equal(formatRelativeTime(createdAt, { now: createdMs + 10 * SECOND_MS }), 'Just now');
  assert.equal(formatRelativeTime(createdAt, { now: createdMs + 5 * MINUTE_MS }), '5 minutes ago');
  assert.equal(formatRelativeTime(createdAt, { now: createdMs + 3 * HOUR_MS }), '3 hours ago');
  assert.equal(formatRelativeTime(createdAt, { now: createdMs + 4 * DAY_MS }), '4 days ago');
});

test('parses ISO timestamps with explicit timezone offsets', () => {
  // 2026-11-22T12:22:24+06:00 equals 2026-11-22T06:22:24Z
  const offsetTimestamp = '2026-11-22T12:22:24+06:00';
  const utcReference = Date.parse('2026-11-22T09:22:24Z');

  assert.equal(formatRelativeTime(offsetTimestamp, { now: utcReference }), '3 hours ago');
  assert.equal(
    formatRelativeTime('2026-11-22T01:22:24-05:00', { now: Date.parse('2026-11-22T06:27:24Z') }),
    '5 minutes ago'
  );
});

test('accepts valid Date objects and Date reference times', () => {
  const target = new Date('2026-11-22T03:22:24.000Z');
  const nowDate = new Date('2026-11-22T06:22:24.000Z');

  assert.equal(formatRelativeTime(target, { now: nowDate }), '3 hours ago');
  assert.equal(formatRelativeTime(target, { now: nowDate.getTime() }), '3 hours ago');
});

test('accepts finite epoch-millisecond numbers including 0', () => {
  assert.equal(formatRelativeTime(0, { now: 4 * DAY_MS }), '4 days ago');
  assert.equal(formatRelativeTime(1_700_000_000_000, { now: 1_700_000_000_000 + 5 * MINUTE_MS }), '5 minutes ago');
});

test('returns default and custom fallback for null, undefined, empty, whitespace, and malformed strings', () => {
  assert.equal(formatRelativeTime(null, { now: BASE_NOW }), 'N/A');
  assert.equal(formatRelativeTime(undefined, { now: BASE_NOW }), 'N/A');
  assert.equal(formatRelativeTime('', { now: BASE_NOW }), 'N/A');
  assert.equal(formatRelativeTime('   \t\n ', { now: BASE_NOW }), 'N/A');
  assert.equal(formatRelativeTime('not-a-timestamp', { now: BASE_NOW }), 'N/A');
  assert.equal(formatRelativeTime('2026-99-99T99:99:99Z', { now: BASE_NOW }), 'N/A');

  assert.equal(formatRelativeTime(null, { now: BASE_NOW, fallback: 'Unknown' }), 'Unknown');
  assert.equal(formatRelativeTime('bad-date', { now: BASE_NOW, fallback: '' }), '');
});

test('returns fallback for NaN, Invalid Date, and non-finite numeric inputs', () => {
  assert.equal(formatRelativeTime(NaN, { now: BASE_NOW }), 'N/A');
  assert.equal(formatRelativeTime(Infinity, { now: BASE_NOW }), 'N/A');
  assert.equal(formatRelativeTime(-Infinity, { now: BASE_NOW }), 'N/A');
  assert.equal(formatRelativeTime(new Date('invalid'), { now: BASE_NOW }), 'N/A');
  assert.equal(formatRelativeTime(Number.NaN, { now: BASE_NOW, fallback: '—' }), '—');
});

test('returns "Just now" for future timestamps and negative clock differences', () => {
  assert.equal(formatRelativeTime(BASE_NOW + 5 * SECOND_MS, { now: BASE_NOW }), 'Just now');
  assert.equal(formatRelativeTime(BASE_NOW + 2 * HOUR_MS, { now: BASE_NOW }), 'Just now');
  assert.equal(formatRelativeTime('2026-11-25T06:22:24Z', { now: BASE_NOW }), 'Just now');
});

test('falls back to Date.now() when options.now is invalid or omitted', () => {
  const fiveMinutesAgo = Date.now() - 5 * MINUTE_MS;

  assert.equal(formatRelativeTime(fiveMinutesAgo), '5 minutes ago');
  assert.equal(formatRelativeTime(fiveMinutesAgo, { now: NaN }), '5 minutes ago');
  assert.equal(formatRelativeTime(fiveMinutesAgo, { now: Infinity }), '5 minutes ago');
  assert.equal(formatRelativeTime(fiveMinutesAgo, { now: new Date('invalid') }), '5 minutes ago');
});
