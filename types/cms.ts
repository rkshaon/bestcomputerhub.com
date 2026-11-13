// File: /types/cms.ts
import type { PaginatedResponse } from './api';

export type SectionTypeKey = 'hero_banner' | 'rich_text' | 'product_collection' | 'faq' | 'image_gallery' | 'cta';

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
  content: Record<string, any>;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CmsPage {
  id: number | string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  template?: string;
  meta_title?: string;
  meta_description?: string;
  is_homepage?: boolean;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PageSectionItem {
  id: number | string;
  page: number | string;
  section_type: SectionTypeKey;
  title?: string;
  display_order: number;
  is_active?: boolean;
  content: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface CmsPageDetail extends CmsPage {
  sections?: PageSectionItem[];
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
  slug: string;
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

export interface CmsMedia {
  id: number | string;
  file: string;
  filename: string;
  file_size?: number;
  mime_type?: string;
  alt_text?: string;
  created_at?: string;
  updated_at?: string;
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

export interface PublicCmsPage {
  title: string;
  slug: string;
  meta_title?: string;
  meta_description?: string;
  sections: PageSectionItem[];
}

export interface CreatePagePayload {
  title: string;
  slug: string;
  status?: 'draft' | 'published' | 'archived';
  template?: string;
  meta_title?: string;
  meta_description?: string;
  is_homepage?: boolean;
}

export interface UpdatePagePayload extends Partial<CreatePagePayload> {}

export interface AddSectionPayload {
  section_type: SectionTypeKey;
  title?: string;
  display_order?: number;
  is_active?: boolean;
  content: Record<string, any>;
}

export interface UpdateSectionPayload extends Partial<AddSectionPayload> {}

export interface ReorderSectionsPayload {
  section_ids: (number | string)[];
}

export interface CreateNavigationMenuPayload {
  name: string;
  slug: string;
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

export interface UploadMediaPayload {
  file: File;
  alt_text?: string;
}
