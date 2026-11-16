// File: /utils/cms.ts
import type { CmsContentBlock, SectionTypeKey } from '@/types/cms';

export function buildSectionContentBlock(type: SectionTypeKey, value: Record<string, any>): CmsContentBlock[] {
  return [{ type, value }];
}

export function getRichTextBlockValue(value: Record<string, any> | null | undefined): { body: string; alignment: string } {
  return {
    body: value?.body || value?.content || '',
    alignment: value?.alignment || 'left'
  };
}
