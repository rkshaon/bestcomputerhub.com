// File: /composables/useCmsService.ts
import { ref } from 'vue';
import { useApiClient } from './useApiClient';
import type {
  SectionTypeDefinition,
  GlobalSection,
  CmsPage,
  CmsPageDetail,
  PageSectionItem,
  CmsRevision,
  CmsNavigationMenu,
  CmsNavigationItem,
  CmsMedia,
  CmsAuditLog,
  CmsRedirect,
  CmsSitemapEntry,
  PublicCmsPage,
  CreatePagePayload,
  UpdatePagePayload,
  AddSectionPayload,
  UpdateSectionPayload,
  ReorderSectionsPayload,
  CreateNavigationMenuPayload,
  CreateNavigationItemPayload,
  UploadMediaPayload,
  PaginatedResponse
} from '@/types';

export const useCmsService = () => {
  const apiClient = useApiClient();
  const isLoading = ref(false);
  const errorMsg = ref<string | null>(null);

  // 1. Section Types
  const getSectionTypes = async (): Promise<SectionTypeDefinition[]> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      const res = await apiClient.request<SectionTypeDefinition[] | { results: SectionTypeDefinition[] }>('/api/v1/cms/section-types/', {
        method: 'GET'
      });
      return Array.isArray(res) ? res : (res?.results || []);
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to fetch section types.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 2. Global Sections
  const getGlobalSections = async (params: { page?: number; page_size?: number; search?: string } = {}): Promise<PaginatedResponse<GlobalSection>> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<PaginatedResponse<GlobalSection>>('/api/v1/cms/global-sections/', {
        method: 'GET',
        query: params
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to fetch global sections.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const createGlobalSection = async (payload: Partial<GlobalSection>): Promise<GlobalSection> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<GlobalSection>('/api/v1/cms/global-sections/', {
        method: 'POST',
        body: payload
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to create global section.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateGlobalSection = async (id: number | string, payload: Partial<GlobalSection>): Promise<GlobalSection> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<GlobalSection>(`/api/v1/cms/global-sections/${id}/`, {
        method: 'PUT',
        body: payload
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to update global section.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteGlobalSection = async (id: number | string): Promise<void> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      await apiClient.request<void>(`/api/v1/cms/global-sections/${id}/`, {
        method: 'DELETE'
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to delete global section.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 3. Pages
  const getPagesList = async (params: { page?: number; page_size?: number; search?: string; status?: string } = {}): Promise<PaginatedResponse<CmsPage>> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<PaginatedResponse<CmsPage>>('/api/v1/cms/pages/', {
        method: 'GET',
        query: params
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to fetch pages list.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const createPage = async (payload: CreatePagePayload): Promise<CmsPageDetail> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<CmsPageDetail>('/api/v1/cms/pages/', {
        method: 'POST',
        body: payload
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to create page.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const getPageDetail = async (id: number | string): Promise<CmsPageDetail> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<CmsPageDetail>(`/api/v1/cms/pages/${id}/`, {
        method: 'GET'
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to fetch page detail.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updatePage = async (id: number | string, payload: UpdatePagePayload): Promise<CmsPageDetail> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<CmsPageDetail>(`/api/v1/cms/pages/${id}/`, {
        method: 'PUT',
        body: payload
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to update page.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deletePage = async (id: number | string): Promise<void> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      await apiClient.request<void>(`/api/v1/cms/pages/${id}/`, {
        method: 'DELETE'
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to delete page.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 4. Page Composition & Sections
  const getPageComposition = async (pageId: number | string): Promise<PageSectionItem[]> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      const res = await apiClient.request<PageSectionItem[] | { results: PageSectionItem[] }>(`/api/v1/cms/pages/${pageId}/composition/`, {
        method: 'GET'
      });
      return Array.isArray(res) ? res : (res?.results || []);
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to fetch page composition.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const addPageSection = async (pageId: number | string, payload: AddSectionPayload): Promise<PageSectionItem> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<PageSectionItem>(`/api/v1/cms/pages/${pageId}/composition/`, {
        method: 'POST',
        body: payload
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to add section to page.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updatePageSection = async (pageId: number | string, sectionId: number | string, payload: UpdateSectionPayload): Promise<PageSectionItem> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<PageSectionItem>(`/api/v1/cms/pages/${pageId}/composition/${sectionId}/`, {
        method: 'PUT',
        body: payload
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to update page section.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deletePageSection = async (pageId: number | string, sectionId: number | string): Promise<void> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      await apiClient.request<void>(`/api/v1/cms/pages/${pageId}/composition/${sectionId}/`, {
        method: 'DELETE'
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to delete page section.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const reorderPageSections = async (pageId: number | string, payload: ReorderSectionsPayload): Promise<PageSectionItem[]> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<PageSectionItem[]>(`/api/v1/cms/pages/${pageId}/composition/reorder/`, {
        method: 'POST',
        body: payload
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to reorder page sections.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 5. Revisions
  const getPageRevisions = async (pageId: number | string): Promise<CmsRevision[]> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      const res = await apiClient.request<CmsRevision[] | { results: CmsRevision[] }>(`/api/v1/cms/pages/${pageId}/revisions/`, {
        method: 'GET'
      });
      return Array.isArray(res) ? res : (res?.results || []);
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to fetch page revisions.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const rollbackPageRevision = async (pageId: number | string, revisionId: number | string): Promise<CmsPageDetail> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<CmsPageDetail>(`/api/v1/cms/pages/${pageId}/revisions/${revisionId}/rollback/`, {
        method: 'POST'
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to rollback page revision.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 6. Publishing & Preview
  const publishPage = async (pageId: number | string): Promise<CmsPageDetail> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<CmsPageDetail>(`/api/v1/cms/pages/${pageId}/publish/`, {
        method: 'POST'
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to publish page.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const unpublishPage = async (pageId: number | string): Promise<CmsPageDetail> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<CmsPageDetail>(`/api/v1/cms/pages/${pageId}/unpublish/`, {
        method: 'POST'
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to unpublish page.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const previewPage = async (pageId: number | string): Promise<PublicCmsPage> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<PublicCmsPage>(`/api/v1/cms/pages/${pageId}/preview/`, {
        method: 'GET'
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to preview page.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 7. Navigation
  const getNavigationMenus = async (): Promise<CmsNavigationMenu[]> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      const res = await apiClient.request<CmsNavigationMenu[] | { results: CmsNavigationMenu[] }>('/api/v1/cms/navigation-menus/', {
        method: 'GET'
      });
      return Array.isArray(res) ? res : (res?.results || []);
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to fetch navigation menus.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const createNavigationMenu = async (payload: CreateNavigationMenuPayload): Promise<CmsNavigationMenu> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<CmsNavigationMenu>('/api/v1/cms/navigation-menus/', {
        method: 'POST',
        body: payload
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to create navigation menu.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const getNavigationMenuDetail = async (id: number | string): Promise<CmsNavigationMenu> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<CmsNavigationMenu>(`/api/v1/cms/navigation-menus/${id}/`, {
        method: 'GET'
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to fetch navigation menu detail.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateNavigationMenu = async (id: number | string, payload: Partial<CmsNavigationMenu>): Promise<CmsNavigationMenu> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<CmsNavigationMenu>(`/api/v1/cms/navigation-menus/${id}/`, {
        method: 'PUT',
        body: payload
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to update navigation menu.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteNavigationMenu = async (id: number | string): Promise<void> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      await apiClient.request<void>(`/api/v1/cms/navigation-menus/${id}/`, {
        method: 'DELETE'
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to delete navigation menu.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const addNavigationItem = async (payload: CreateNavigationItemPayload): Promise<CmsNavigationItem> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<CmsNavigationItem>('/api/v1/cms/navigation-items/', {
        method: 'POST',
        body: payload
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to add navigation item.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateNavigationItem = async (id: number | string, payload: Partial<CmsNavigationItem>): Promise<CmsNavigationItem> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<CmsNavigationItem>(`/api/v1/cms/navigation-items/${id}/`, {
        method: 'PUT',
        body: payload
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to update navigation item.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteNavigationItem = async (id: number | string): Promise<void> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      await apiClient.request<void>(`/api/v1/cms/navigation-items/${id}/`, {
        method: 'DELETE'
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to delete navigation item.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 8. Media
  const getMediaList = async (params: { page?: number; page_size?: number; search?: string } = {}): Promise<PaginatedResponse<CmsMedia>> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<PaginatedResponse<CmsMedia>>('/api/v1/cms/media/', {
        method: 'GET',
        query: params
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to fetch media list.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const uploadMedia = async (payload: UploadMediaPayload): Promise<CmsMedia> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      const formData = new FormData();
      formData.append('file', payload.file);
      if (payload.alt_text) {
        formData.append('alt_text', payload.alt_text);
      }
      return await apiClient.request<CmsMedia>('/api/v1/cms/media/', {
        method: 'POST',
        body: formData
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to upload media.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteMedia = async (id: number | string): Promise<void> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      await apiClient.request<void>(`/api/v1/cms/media/${id}/`, {
        method: 'DELETE'
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to delete media.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 9. Audit Logs
  const getAuditLogs = async (params: { page?: number; page_size?: number } = {}): Promise<PaginatedResponse<CmsAuditLog>> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<PaginatedResponse<CmsAuditLog>>('/api/v1/cms/audit-logs/', {
        method: 'GET',
        query: params
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to fetch audit logs.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 10. Public CMS Endpoints
  const getPublicPageBySlug = async (slug: string): Promise<PublicCmsPage> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<PublicCmsPage>(`/api/v1/cms/public/pages/${slug}/`, {
        method: 'GET'
      });
    } catch (err: any) {
      errorMsg.value = err.message || `Failed to fetch public page for slug: ${slug}`;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const getPublicGlobalSections = async (): Promise<GlobalSection[]> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      const res = await apiClient.request<GlobalSection[] | { results: GlobalSection[] }>('/api/v1/cms/public/global-sections/', {
        method: 'GET'
      });
      return Array.isArray(res) ? res : (res?.results || []);
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to fetch public global sections.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const getPublicNavigation = async (slug: string): Promise<CmsNavigationMenu> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<CmsNavigationMenu>(`/api/v1/cms/public/navigation/${slug}/`, {
        method: 'GET'
      });
    } catch (err: any) {
      errorMsg.value = err.message || `Failed to fetch public navigation for slug: ${slug}`;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 11. Redirects & Sitemap
  const getRedirects = async (): Promise<CmsRedirect[]> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      const res = await apiClient.request<CmsRedirect[] | { results: CmsRedirect[] }>('/api/v1/cms/redirects/', {
        method: 'GET'
      });
      return Array.isArray(res) ? res : (res?.results || []);
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to fetch redirects.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const getSitemap = async (): Promise<CmsSitemapEntry[]> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      const res = await apiClient.request<CmsSitemapEntry[] | { results: CmsSitemapEntry[] }>('/api/v1/cms/sitemap/', {
        method: 'GET'
      });
      return Array.isArray(res) ? res : (res?.results || []);
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to fetch sitemap.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isLoading,
    errorMsg,
    getSectionTypes,
    getGlobalSections,
    createGlobalSection,
    updateGlobalSection,
    deleteGlobalSection,
    getPagesList,
    createPage,
    getPageDetail,
    updatePage,
    deletePage,
    getPageComposition,
    addPageSection,
    updatePageSection,
    deletePageSection,
    reorderPageSections,
    getPageRevisions,
    rollbackPageRevision,
    publishPage,
    unpublishPage,
    previewPage,
    getNavigationMenus,
    createNavigationMenu,
    getNavigationMenuDetail,
    updateNavigationMenu,
    deleteNavigationMenu,
    addNavigationItem,
    updateNavigationItem,
    deleteNavigationItem,
    getMediaList,
    uploadMedia,
    deleteMedia,
    getAuditLogs,
    getPublicPageBySlug,
    getPublicGlobalSections,
    getPublicNavigation,
    getRedirects,
    getSitemap
  };
};
