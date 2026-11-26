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

export interface FormatDecimalCurrencyOptions {
  fallback?: string;
}

/**
 * Formats a decimal monetary string or number into `Tk X,XXX.XX` without
 * floating-point precision loss or `NaN` output.
 */
export function formatDecimalCurrency(
  value: string | number | null | undefined,
  options: FormatDecimalCurrencyOptions = {}
): string {
  const fallback = options.fallback ?? 'Tk 0.00';
  if (value === null || value === undefined) {
    return fallback;
  }

  let raw = '';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return fallback;
    }
    raw = String(value);
  } else if (typeof value === 'string') {
    raw = value.trim();
  } else {
    return fallback;
  }

  if (!raw) {
    return fallback;
  }

  const match = raw.match(/^([+-])?(?:(\d+)(?:\.(\d*))?|\.(\d+))$/);
  if (!match) {
    return fallback;
  }

  const sign = match[1] === '-' ? '-' : '';
  const rawInt = match[2] ?? '0';
  const rawFrac = match[3] ?? match[4] ?? '';

  const normalizedInt = rawInt.replace(/^0+(?=\d)/, '') || '0';
  const paddedFrac = rawFrac.length >= 2 ? rawFrac : rawFrac.padEnd(2, '0');
  const isAllZero = normalizedInt === '0' && /^0+$/.test(paddedFrac);
  const groupedInt = normalizedInt.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return `${isAllZero ? '' : sign}Tk ${groupedInt}.${paddedFrac}`;
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

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/**
 * Formats a `YYYY-MM-DD` calendar date without local-timezone day shifts,
 * falling back to `formatDate` for full date-time strings.
 */
export function formatCalendarDate(dateString: string | null | undefined): string {
  if (!dateString || typeof dateString !== 'string') return 'N/A';
  const trimmed = dateString.trim();
  if (!trimmed) return 'N/A';

  const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const monthIndex = Number(dateOnlyMatch[2]) - 1;
    const day = Number(dateOnlyMatch[3]);
    const monthName = SHORT_MONTHS[monthIndex];
    if (monthName && day >= 1 && day <= 31) {
      return `${day} ${monthName}, ${year}`;
    }
    return 'N/A';
  }

  return formatDate(trimmed);
}

/**
 * Formats an ISO timestamp string into `D Mon, YYYY, H:MM AM/PM`, returning `'N/A'` if invalid.
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString || typeof dateString !== 'string') return 'N/A';
  const trimmed = dateString.trim();
  if (!trimmed) return 'N/A';
  const date = new Date(trimmed);
  if (isNaN(date.getTime())) return 'N/A';

  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  const time = date.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  return `${day} ${month}, ${year}, ${time}`;
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

