import type { CmsContentBlock, SectionTypeKey, RichTextBlockValue } from '@/types/cms';

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
