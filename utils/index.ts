// File: /utils/index.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Component } from 'vue';
import { 
  Cpu, 
  Server, 
  HardDrive, 
  Layers, 
  CircuitBoard, 
  Database, 
  Monitor, 
  ShieldCheck, 
  Zap,
  Box,
  Terminal
} from 'lucide-vue-next';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCategoryIcon(slug: string, name: string): Component {
  const s = (slug || '').toLowerCase();
  const n = (name || '').toLowerCase();

  if (s.includes('gpu') || n.includes('graphic')) return Monitor;
  if (s.includes('processor') || s.includes('cpu') || n.includes('processor')) return Cpu;
  if (s.includes('server') || n.includes('server')) return Server;
  if (s.includes('memory') || n.includes('ram')) return Layers;
  if (s.includes('storage') || s.includes('ssd') || n.includes('drive')) return HardDrive;
  if (s.includes('motherboard') || s.includes('chassis')) return CircuitBoard;
  if (s.includes('datacenter') || s.includes('accelerator')) return Database;
  if (s.includes('cooling') || s.includes('fan')) return Zap;
  if (s.includes('power') || s.includes('psu')) return ShieldCheck;
  if (s.includes('network') || s.includes('switch')) return Terminal;

  return Box; // Fallback icon
}

export function formatCurrency(value: number): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return 'Tk 0';
  }
  const roundedValue = Math.round(value);
  return `Tk ${roundedValue.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&#039;': "'",
  '&#39;': "'",
  '&nbsp;': ' ',
  '&copy;': '©',
  '&reg;': '®',
  '&trade;': '™',
  '&ndash;': '–',
  '&mdash;': '—',
  '&hellip;': '…',
  '&lsquo;': '‘',
  '&rsquo;': '’',
  '&ldquo;': '“',
  '&rdquo;': '”',
  '&bull;': '•',
  '&deg;': '°',
  '&plusmn;': '±',
  '&times;': '×',
  '&divide;': '÷',
  '&cent;': '¢',
  '&pound;': '£',
  '&euro;': '€',
  '&yen;': '¥',
  '&laquo;': '«',
  '&raquo;': '»',
  '&frac12;': '½',
  '&frac14;': '¼',
  '&frac34;': '¾',
};

const ENTITY_REGEX = /&(?:amp|lt|gt|quot|apos|nbsp|copy|reg|trade|ndash|mdash|hellip|lsquo|rsquo|ldquo|rdquo|bull|deg|plusmn|times|divide|cent|pound|euro|yen|laquo|raquo|frac12|frac14|frac34);|&#039;|&#39;/g;

/**
 * Decodes HTML entities in a plain-text string or object (e.g. `Surveillance &amp; Security` -> `Surveillance & Security`).
 * Safely handles null, undefined, objects with name attributes, and non-string or empty values.
 */
export function decodeHtmlEntities(value: string | { name?: string } | any): string {
  if (!value) {
    return '';
  }
  if (typeof value === 'object' && value !== null) {
    value = value.name || '';
  }
  if (typeof value !== 'string') {
    return '';
  }
  return value
    .replace(ENTITY_REGEX, (match) => HTML_ENTITIES[match] || match)
    .replace(/&#(\d+);/g, (match, dec) => {
      try {
        const code = parseInt(dec, 10);
        return code ? String.fromCodePoint(code) : match;
      } catch {
        return match;
      }
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
      try {
        const code = parseInt(hex, 16);
        return code ? String.fromCodePoint(code) : match;
      } catch {
        return match;
      }
    });
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month}, ${year}`;
}

export type RelativeTimeInput =
  | string
  | number
  | Date
  | null
  | undefined;

export interface FormatRelativeTimeOptions {
  now?: number | Date;
  fallback?: string;
}

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

function parseRelativeTimeInput(value: RelativeTimeInput): number {
  if (value === null || value === undefined) {
    return NaN;
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : NaN;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return NaN;
    }
    return Date.parse(trimmed);
  }
  return NaN;
}

function resolveReferenceTime(nowOption: number | Date | undefined): number {
  if (nowOption instanceof Date) {
    const ms = nowOption.getTime();
    if (Number.isFinite(ms)) {
      return ms;
    }
  } else if (typeof nowOption === 'number' && Number.isFinite(nowOption)) {
    return nowOption;
  }
  return Date.now();
}

export function formatRelativeTime(
  value: RelativeTimeInput,
  options?: FormatRelativeTimeOptions
): string {
  const fallback = options?.fallback ?? 'N/A';
  const targetMs = parseRelativeTimeInput(value);
  if (!Number.isFinite(targetMs)) {
    return fallback;
  }

  const nowMs = resolveReferenceTime(options?.now);
  const diffMs = nowMs - targetMs;

  if (diffMs < 0) {
    return 'Just now';
  }

  const diffMinutes = Math.floor(diffMs / MS_PER_MINUTE);
  if (diffMinutes < 1) {
    return 'Just now';
  }

  if (diffMinutes < 60) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  }

  const diffHours = Math.floor(diffMs / MS_PER_HOUR);
  if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }

  const diffDays = Math.floor(diffMs / MS_PER_DAY);
  return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
}

