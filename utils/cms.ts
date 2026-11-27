import type { CmsContentBlock, SectionTypeKey, RichTextBlockValue } from '@/types/cms';
import DOMPurify from 'isomorphic-dompurify';

export function buildSectionContentBlock(type: SectionTypeKey, value: Record<string, any>): CmsContentBlock[] {
  return [{ type, value }];
}

export function getRichTextBlockValue(value: RichTextBlockValue | Record<string, any> | null | undefined): { body: string; alignment: string } {
  return {
    body: value?.body || (value as any)?.content || '',
    alignment: value?.alignment || 'left'
  };
}

/**
 * Normalizes a storefront/CMS page path to ensure it has both leading and trailing slashes.
 * Conforms to AGENTS.md §9 (Storefront URL Route Convention: Trailing Slashes).
 *
 * @example
 * normalizeCmsPath('about-us') // '/about-us/'
 * normalizeCmsPath('/about-us') // '/about-us/'
 * normalizeCmsPath('/about-us/') // '/about-us/'
 * normalizeCmsPath('/') // '/'
 * normalizeCmsPath('') // '/'
 */
export function normalizeCmsPath(path: string | null | undefined): string {
  if (!path) return '/';
  const trimmed = path.trim();
  const withoutQuery = (trimmed.split('?')[0] ?? '').trim();
  let clean = (withoutQuery.split('#')[0] ?? '').trim();
  if (!clean || clean === '/') return '/';
  if (!clean.startsWith('/')) clean = `/${clean}`;
  if (!clean.endsWith('/')) clean = `${clean}/`;
  return clean;
}

/**
 * Extracts a safe http/https origin (scheme + host + port) from a URL string.
 * Returns an empty string for empty, relative, or invalid URLs.
 */
export function resolveOriginFromUrl(urlStr: string | null | undefined): string {
  if (!urlStr || typeof urlStr !== 'string') return '';
  const trimmed = urlStr.trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.origin;
    }
    return '';
  } catch {
    return '';
  }
}

export interface NavigationLinkInput {
  url?: string | null;
  slug?: string | null;
}

export interface ResolvedNavigationLink {
  href: string;
  external: boolean;
}

export interface ResolveNavigationLinkOptions {
  currentOrigin?: string | null;
}

const CONTROL_CHAR_OR_BACKSLASH_RE = /[\u0000-\u001f\u007f\\]/;
const SCHEME_PREFIX_RE = /^([a-z][a-z0-9+.-]*):/;

function resolveSafeCmsSlugPath(rawSlug: string | null | undefined): string | null {
  if (typeof rawSlug !== 'string') return null;
  const trimmed = rawSlug.trim();
  if (!trimmed || CONTROL_CHAR_OR_BACKSLASH_RE.test(trimmed)) return null;
  if (trimmed.replace(/\s+/g, '').startsWith('//')) return null;
  const cleaned = trimmed.replace(/^\/+|\/+$/g, '');
  if (!cleaned) return null;
  const collapsed = cleaned.replace(/[\u0000-\u0020]+/g, '').toLowerCase();
  if (SCHEME_PREFIX_RE.test(collapsed)) return null;
  return normalizeCmsPath(cleaned);
}

/**
 * Validates an Admin CMS Navigation external/custom link target.
 * Accepts root-relative internal paths (e.g. `/blog/`, `/blog?category=news#latest`)
 * and absolute HTTP/HTTPS URLs, while rejecting protocol-relative URLs,
 * backslashes, control characters, and unsupported URI schemes.
 */
export function isValidNavigationTargetUrl(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || CONTROL_CHAR_OR_BACKSLASH_RE.test(trimmed)) {
    return false;
  }

  if (trimmed.startsWith('/')) {
    const collapsed = trimmed.replace(/\s+/g, '');
    if (collapsed.startsWith('//')) {
      return false;
    }
    try {
      const parsed = new URL(trimmed, 'https://placeholder.invalid');
      return parsed.origin === 'https://placeholder.invalid';
    } catch {
      return false;
    }
  }

  try {
    const parsed = new URL(trimmed);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * Normalizes an internal navigation path to include leading and trailing slashes
 * while preserving query strings (`?...`) and hash fragments (`#...`).
 */
export function normalizeInternalNavigationPath(rawPath: string): string {
  const trimmed = rawPath.trim();
  if (!trimmed) return '/';
  if (trimmed.startsWith('#') || trimmed.startsWith('?')) {
    return trimmed;
  }

  const hashIndex = trimmed.indexOf('#');
  const beforeHash = hashIndex >= 0 ? trimmed.slice(0, hashIndex) : trimmed;
  const hash = hashIndex >= 0 ? trimmed.slice(hashIndex) : '';
  const queryIndex = beforeHash.indexOf('?');
  const pathname = queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash;
  const search = queryIndex >= 0 ? beforeHash.slice(queryIndex) : '';

  return `${normalizeCmsPath(pathname)}${search}${hash}`;
}

/**
 * Resolves a CMS or external navigation link into a safe href and classifies
 * whether it should render as an internal `<NuxtLink>` or an external `<a>`.
 * Same-origin HTTP/HTTPS URLs are converted to normalized internal paths.
 */
export function resolveNavigationLink(
  item: NavigationLinkInput,
  options: ResolveNavigationLinkOptions = {}
): ResolvedNavigationLink | null {
  const slugPath = resolveSafeCmsSlugPath(item.slug);
  if (slugPath) {
    return { href: slugPath, external: false };
  }

  const rawUrl = item.url;
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed === '#' || CONTROL_CHAR_OR_BACKSLASH_RE.test(trimmed)) {
    return null;
  }

  const collapsed = trimmed.replace(/[\u0000-\u0020]+/g, '').toLowerCase();
  if (
    collapsed.startsWith('//') ||
    collapsed.startsWith('/\\') ||
    collapsed.startsWith('\\')
  ) {
    return null;
  }

  const schemeMatch = collapsed.match(SCHEME_PREFIX_RE);
  if (schemeMatch && schemeMatch[1]) {
    const scheme = schemeMatch[1];
    if (scheme === 'mailto' || scheme === 'tel') {
      return { href: trimmed, external: true };
    }
    if (scheme !== 'http' && scheme !== 'https') {
      return null;
    }

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return null;
      }
      const currentOrigin = resolveOriginFromUrl(options.currentOrigin);
      if (currentOrigin && parsed.origin === currentOrigin && !parsed.username && !parsed.password) {
        return {
          href: `${normalizeCmsPath(parsed.pathname)}${parsed.search}${parsed.hash}`,
          external: false
        };
      }
      return { href: trimmed, external: true };
    } catch {
      return null;
    }
  }

  if (trimmed.startsWith('#') || trimmed.startsWith('?')) {
    return { href: trimmed, external: false };
  }

  const candidatePath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  try {
    const parsed = new URL(candidatePath, 'https://placeholder.invalid');
    if (parsed.origin !== 'https://placeholder.invalid') {
      return null;
    }
  } catch {
    return null;
  }

  return {
    href: normalizeInternalNavigationPath(candidatePath),
    external: false
  };
}

export interface SanitizeCmsHtmlOptions {
  mediaOrigin?: string;
}

const CMS_ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr', 'div', 'span', 'blockquote', 'pre', 'code',
  'figure', 'figcaption',
  'b', 'strong', 'i', 'em', 'u', 's', 'del', 'ins', 'sub', 'sup', 'small', 'mark',
  'ul', 'ol', 'li',
  'a', 'img',
  'table', 'caption', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'colgroup', 'col'
];

const CMS_ALLOWED_ATTR = [
  'href', 'target', 'rel', 'title',
  'src', 'alt', 'width', 'height', 'loading',
  'class', 'id', 'align',
  'colspan', 'rowspan', 'scope', 'start'
];

let cmsSanitizerHooksRegistered = false;
let activeCmsMediaOrigin = '';

function ensureCmsSanitizerHooks(): void {
  if (cmsSanitizerHooksRegistered) return;
  cmsSanitizerHooksRegistered = true;

  DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
    const attrName = (data.attrName || '').toLowerCase();
    const rawVal = (data.attrValue || '').trim();
    if (!attrName) return;

    // Strip ASCII control characters and whitespace before scheme inspection
    const collapsed = rawVal.replace(/[\u0000-\u0020]+/g, '').toLowerCase();
    const schemeMatch = collapsed.match(/^([a-z][a-z0-9+.-]*):/);

    if (attrName === 'src') {
      // Reject protocol-relative // URLs and all non-http(s) schemes (including data:, javascript:, vbscript:)
      if (rawVal.startsWith('//') || (schemeMatch && schemeMatch[1] !== 'http' && schemeMatch[1] !== 'https')) {
        data.keepAttr = false;
        return;
      }

      if (activeCmsMediaOrigin && rawVal.startsWith('/media/')) {
        data.attrValue = `${activeCmsMediaOrigin}${rawVal}`;
      }
    } else if (attrName === 'href') {
      // Allow relative paths (not //), anchors (#), http(s):, mailto:, tel:
      if (
        rawVal.startsWith('//') ||
        (schemeMatch && schemeMatch[1] && !['http', 'https', 'mailto', 'tel'].includes(schemeMatch[1]))
      ) {
        data.keepAttr = false;
      }
    }
  });

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
      const existingRel = (node.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
      const relSet = new Set(existingRel);
      relSet.add('noopener');
      relSet.add('noreferrer');
      node.setAttribute('rel', Array.from(relSet).join(' '));
    }
  });
}

/**
 * Sanitizes rich text HTML using isomorphic DOMPurify (compatible with Node.js SSR and client DOM).
 * Rejects scriptable SVG/MathML, forms, dangerous executable tags, event handlers, data: URLs,
 * protocol-relative URLs, and unsafe URI schemes while preserving Wagtail-expanded formatting,
 * tables, internal links, and /media/ images.
 */
export function sanitizeCmsHtml(
  rawHtml: string | null | undefined,
  options: SanitizeCmsHtmlOptions = {}
): string {
  if (!rawHtml || typeof rawHtml !== 'string') {
    return '';
  }
  const trimmed = rawHtml.trim();
  if (!trimmed) {
    return '';
  }

  ensureCmsSanitizerHooks();
  activeCmsMediaOrigin = (options.mediaOrigin || '').replace(/\/+$/, '');

  try {
    return DOMPurify.sanitize(trimmed, {
      ALLOWED_TAGS: CMS_ALLOWED_TAGS,
      ALLOWED_ATTR: CMS_ALLOWED_ATTR,
      ALLOW_DATA_ATTR: false
    });
  } finally {
    activeCmsMediaOrigin = '';
  }
}
