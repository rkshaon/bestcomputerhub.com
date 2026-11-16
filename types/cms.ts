// File: /types/cms.ts
import type { PaginatedResponse } from './api';

export type SectionTypeKey = 'hero_banner' | 'rich_text' | 'product_collection' | 'faq' | 'image_gallery' | 'cta' | 'brand_collection';

export interface CmsContentBlock {
  type: SectionTypeKey;
  value: Record<string, any>;
}

export interface SectionTypeDefinition {
  type: SectionTypeKey;
  name: string;
  description?: string;
  schema?: Record<string, any>;
}

export interface GlobalSection {
  id: number | string;
  name: string;
  code: string;
  section_type: SectionTypeKey;
  content: CmsContentBlock[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type PageTemplateKey = 'blank' | 'landing' | 'about' | 'contact' | 'campaign';

export interface CmsPage {
  id: number | string;
  title: string;
  slug: string;
  url_path?: string;
  template_key?: PageTemplateKey;
  live?: boolean;
  has_unpublished_changes?: boolean;
  archived_at?: string | null;
  last_published_at?: string | null;
  sections?: PageSectionItem[];
  created_at?: string;
  updated_at?: string;
}

export interface PageSectionItem {
  id: number | string;
  page: number | string;
  section_type: SectionTypeKey;
  name?: string;
  title?: string;
  display_order: number;
  sort_order?: number;
  is_active?: boolean;
  archived_at?: string | null;
  content: Record<string, any>;
  base_revision_id?: number | string;
  created_at?: string;
  updated_at?: string;
}

export interface CmsPageDetail extends CmsPage {
  sections?: PageSectionItem[];
  seo_title?: string;
  seo_description?: string;
  latest_revision_id?: number | string;
}

export interface CmsRevision {
  id: number | string;
  page: number | string;
  version_number: number;
  title: string;
  content_snapshot: Record<string, any>;
  created_by?: string | number | null;
  created_at?: string;
}

export interface CmsNavigationMenu {
  id: number | string;
  name: string;
  key: string;
  description?: string;
  is_active?: boolean;
  items?: CmsNavigationItem[];
  created_at?: string;
  updated_at?: string;
}

export interface CmsNavigationItem {
  id: number | string;
  menu: number | string;
  parent?: number | string | null;
  title: string;
  url: string;
  display_order: number;
  is_active?: boolean;
  children?: CmsNavigationItem[];
  created_at?: string;
  updated_at?: string;
}

export interface CmsMediaImage {
  id: number | string;
  image: string;
  filename?: string;
  file_size?: number;
  width?: number;
  height?: number;
  alt_text?: string;
  created_at?: string;
}

export interface CmsMediaDocument {
  id: number | string;
  document: string;
  filename?: string;
  file_size?: number;
  mime_type?: string;
  created_at?: string;
}

export interface CmsAuditLog {
  id: number | string;
  action: string;
  entity_type: string;
  entity_id: string | number;
  user?: string | number | null;
  details?: Record<string, any>;
  created_at?: string;
}

export interface CmsRedirect {
  id: number | string;
  old_path: string;
  new_path: string;
  is_permanent?: boolean;
  created_at?: string;
}

export interface CmsSitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}

export interface RichTextBlockValue {
  body: string;
  alignment?: 'left' | 'center' | 'right' | string;
  [key: string]: any;
}

export interface PublicCmsContentBlock {
  type: SectionTypeKey | string;
  value: RichTextBlockValue | Record<string, any>;
}

export interface PublicPageSection {
  name: string;
  source: string;
  global_section?: number | string | null;
  content: PublicCmsContentBlock[];
}

export type PublicPageSectionItem = PublicPageSection;

export interface PublicCmsPage {
  id?: number | string;
  title: string;
  slug: string;
  url_path?: string;
  seo_title?: string;
  seo_description?: string;
  meta_keywords?: string;
  og_title?: string;
  og_description?: string;
  canonical_url?: string;
  seo_noindex?: boolean;
  seo_nofollow?: boolean;
  og_image?: number | string | null;
  meta_title?: string;
  meta_description?: string;
  sections: PublicPageSection[];
}

export interface CreatePageSectionPayload {
  name: string;
  global_section?: null | number | string;
  content: CmsContentBlock[];
  archived?: boolean;
  base_revision_id?: number | string;
}

export interface CreatePagePayload {
  title: string;
  slug: string;
  template_key?: PageTemplateKey;
  seo_title?: string;
  seo_description?: string;
  sections?: CreatePageSectionPayload[];
}

export interface UpdatePagePayload {
  title?: string;
  slug?: string;
  seo_title?: string;
  seo_description?: string;
  sections?: CreatePageSectionPayload[];
  base_revision_id?: number | string;
}

export interface AddSectionPayload {
  name?: string;
  global_section?: null | number | string;
  content?: CmsContentBlock[];
  archived?: boolean;
  base_revision_id?: number | string;
}

export interface UpdateSectionPayload extends Partial<AddSectionPayload> {}

export interface ReorderSectionsPayload {
  order: (number | string)[];
  base_revision_id?: number | string;
}

export interface CreateNavigationMenuPayload {
  name: string;
  key: string;
  description?: string;
  is_active?: boolean;
}

export interface CreateNavigationItemPayload {
  menu: number | string;
  parent?: number | string | null;
  title: string;
  url: string;
  display_order?: number;
  is_active?: boolean;
}

export interface UploadMediaImagePayload {
  image: File;
  alt_text?: string;
}

export interface UploadMediaDocumentPayload {
  document: File;
}
