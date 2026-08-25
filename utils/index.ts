// File: /utils/index.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
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
 * Decodes HTML entities in a plain-text string (e.g. `Surveillance &amp; Security` -> `Surveillance & Security`).
 * Safely handles null, undefined, and non-string or empty values.
 */
export function decodeHtmlEntities(value: string | null | undefined): string {
  if (!value || typeof value !== 'string') {
    return '';
  }
  if (!value.includes('&')) {
    return value;
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
