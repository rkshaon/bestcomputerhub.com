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
  CmsMediaImage,
  CmsMediaDocument,
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
  UploadMediaImagePayload,
  UploadMediaDocumentPayload,
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

  // 2. Sections (/api/v1/cms/sections/)
  const getGlobalSections = async (params: { page?: number; page_size?: number; search?: string } = {}): Promise<PaginatedResponse<GlobalSection>> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<PaginatedResponse<GlobalSection>>('/api/v1/cms/sections/', {
        method: 'GET',
        query: params
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to fetch sections.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const createGlobalSection = async (payload: Partial<GlobalSection>): Promise<GlobalSection> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<GlobalSection>('/api/v1/cms/sections/', {
        method: 'POST',
        body: payload
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to create section.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateGlobalSection = async (id: number | string, payload: Partial<GlobalSection>): Promise<GlobalSection> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<GlobalSection>(`/api/v1/cms/sections/${id}/`, {
        method: 'PUT',
        body: payload
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to update section.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteGlobalSection = async (id: number | string): Promise<void> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      await apiClient.request<void>(`/api/v1/cms/sections/${id}/`, {
        method: 'DELETE'
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to delete section.';
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

  // 4. Page Sections (/api/v1/cms/pages/{id}/sections/)
  const getPageSections = async (pageId: number | string): Promise<PageSectionItem[]> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      const res = await apiClient.request<PageSectionItem[] | { results: PageSectionItem[] }>(`/api/v1/cms/pages/${pageId}/sections/`, {
        method: 'GET'
      });
      return Array.isArray(res) ? res : (res?.results || []);
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to fetch page sections.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const addPageSection = async (pageId: number | string, payload: AddSectionPayload): Promise<PageSectionItem> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<PageSectionItem>(`/api/v1/cms/pages/${pageId}/sections/`, {
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
      return await apiClient.request<PageSectionItem>(`/api/v1/cms/pages/${pageId}/sections/${sectionId}/`, {
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
      await apiClient.request<void>(`/api/v1/cms/pages/${pageId}/sections/${sectionId}/`, {
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
      return await apiClient.request<PageSectionItem[]>(`/api/v1/cms/pages/${pageId}/sections/reorder/`, {
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

  // 7. Navigation (/api/v1/cms/navigation/ and /api/v1/cms/navigation/{menuId}/items/)
  const getNavigationMenus = async (): Promise<CmsNavigationMenu[]> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      const res = await apiClient.request<CmsNavigationMenu[] | { results: CmsNavigationMenu[] }>('/api/v1/cms/navigation/', {
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
      return await apiClient.request<CmsNavigationMenu>('/api/v1/cms/navigation/', {
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
      return await apiClient.request<CmsNavigationMenu>(`/api/v1/cms/navigation/${id}/`, {
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
      return await apiClient.request<CmsNavigationMenu>(`/api/v1/cms/navigation/${id}/`, {
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
      await apiClient.request<void>(`/api/v1/cms/navigation/${id}/`, {
        method: 'DELETE'
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to delete navigation menu.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const addNavigationItem = async (menuId: number | string, payload: CreateNavigationItemPayload): Promise<CmsNavigationItem> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<CmsNavigationItem>(`/api/v1/cms/navigation/${menuId}/items/`, {
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

  const updateNavigationItem = async (menuId: number | string, itemId: number | string, payload: Partial<CmsNavigationItem>): Promise<CmsNavigationItem> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<CmsNavigationItem>(`/api/v1/cms/navigation/${menuId}/items/${itemId}/`, {
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

  const deleteNavigationItem = async (menuId: number | string, itemId: number | string): Promise<void> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      await apiClient.request<void>(`/api/v1/cms/navigation/${menuId}/items/${itemId}/`, {
        method: 'DELETE'
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to delete navigation item.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 8. Media (/api/v1/cms/media/images/ and /api/v1/cms/media/documents/)
  const getMediaImagesList = async (params: { page?: number; page_size?: number; search?: string } = {}): Promise<PaginatedResponse<CmsMediaImage>> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<PaginatedResponse<CmsMediaImage>>('/api/v1/cms/media/images/', {
        method: 'GET',
        query: params
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to fetch media images.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const uploadMediaImage = async (payload: UploadMediaImagePayload): Promise<CmsMediaImage> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      const formData = new FormData();
      formData.append('image', payload.image);
      if (payload.alt_text) {
        formData.append('alt_text', payload.alt_text);
      }
      return await apiClient.request<CmsMediaImage>('/api/v1/cms/media/images/', {
        method: 'POST',
        body: formData
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to upload media image.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteMediaImage = async (id: number | string): Promise<void> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      await apiClient.request<void>(`/api/v1/cms/media/images/${id}/`, {
        method: 'DELETE'
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to delete media image.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const getMediaDocumentsList = async (params: { page?: number; page_size?: number; search?: string } = {}): Promise<PaginatedResponse<CmsMediaDocument>> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<PaginatedResponse<CmsMediaDocument>>('/api/v1/cms/media/documents/', {
        method: 'GET',
        query: params
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to fetch media documents.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const uploadMediaDocument = async (payload: UploadMediaDocumentPayload): Promise<CmsMediaDocument> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      const formData = new FormData();
      formData.append('document', payload.document);
      return await apiClient.request<CmsMediaDocument>('/api/v1/cms/media/documents/', {
        method: 'POST',
        body: formData
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to upload media document.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteMediaDocument = async (id: number | string): Promise<void> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      await apiClient.request<void>(`/api/v1/cms/media/documents/${id}/`, {
        method: 'DELETE'
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to delete media document.';
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
  const getPublicPageByPath = async (path: string): Promise<PublicCmsPage> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<PublicCmsPage>('/api/v1/cms/public/pages/', {
        method: 'GET',
        query: { path }
      });
    } catch (err: any) {
      errorMsg.value = err.message || `Failed to fetch public page for path: ${path}`;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const getPublicNavigation = async (key: string): Promise<CmsNavigationMenu> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<CmsNavigationMenu>(`/api/v1/cms/public/navigation/${key}/`, {
        method: 'GET'
      });
    } catch (err: any) {
      errorMsg.value = err.message || `Failed to fetch public navigation for key: ${key}`;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 11. Redirects & Public Sitemap
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

  const createRedirect = async (payload: Partial<CmsRedirect>): Promise<CmsRedirect> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      return await apiClient.request<CmsRedirect>('/api/v1/cms/redirects/', {
        method: 'POST',
        body: payload
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to create redirect.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteRedirect = async (id: number | string): Promise<void> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      await apiClient.request<void>(`/api/v1/cms/redirects/${id}/`, {
        method: 'DELETE'
      });
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to delete redirect.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const getPublicSitemap = async (): Promise<CmsSitemapEntry[]> => {
    isLoading.value = true;
    errorMsg.value = null;
    try {
      const res = await apiClient.request<CmsSitemapEntry[] | { results: CmsSitemapEntry[] }>('/api/v1/cms/public/sitemap/', {
        method: 'GET'
      });
      return Array.isArray(res) ? res : (res?.results || []);
    } catch (err: any) {
      errorMsg.value = err.message || 'Failed to fetch public sitemap.';
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
    getPageSections,
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
    getMediaImagesList,
    uploadMediaImage,
    deleteMediaImage,
    getMediaDocumentsList,
    uploadMediaDocument,
    deleteMediaDocument,
    getAuditLogs,
    getPublicPageByPath,
    getPublicNavigation,
    getRedirects,
    createRedirect,
    deleteRedirect,
    getPublicSitemap
  };
};
