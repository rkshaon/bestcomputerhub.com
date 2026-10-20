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
