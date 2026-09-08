// File: /composables/useBlogService.ts
import { ref } from 'vue';
import { blogPosts } from '@/mock/data';
import { useApiClient } from './useApiClient';
import { extractErrorMessage } from './useToast';
import type { BlogPost, BlogPostItem, BlogTag, BlogTagQueryParams, CreateBlogTagPayload, UpdateBlogTagPayload, PaginatedBlogTags, BlogPostQueryParams, PaginatedBlogPosts } from '@/types';

const isLoading = ref(false);
const errorMsg = ref<string | null>(null);

export const useBlogService = () => {
  const apiClient = useApiClient();

  /**
   * Fetch paginated list of blog posts (GET /api/v1/blog/posts/)
   */
  const getBlogPosts = async (params?: BlogPostQueryParams): Promise<PaginatedBlogPosts> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      const queryObj: Record<string, any> = {};
      if (params) {
        if (params.author) queryObj.author = params.author;
        if (params.category) queryObj.category = params.category;
        if (params.page !== undefined && params.page !== null) queryObj.page = params.page;
        if (params.page_size !== undefined && params.page_size !== null) queryObj.page_size = params.page_size;
        if (params.published_after) queryObj.published_after = params.published_after;
        if (params.published_before) queryObj.published_before = params.published_before;
        if (params.search?.trim()) queryObj.search = params.search.trim();
        if (params.status) queryObj.status = params.status;
        if (params.tag) queryObj.tag = params.tag;
      }

      const data = await apiClient.request<PaginatedBlogPosts>('/api/v1/blog/posts/', {
        method: 'GET',
        params: queryObj
      });

      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to retrieve blog posts.');
      errorMsg.value = msg;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Fetch a single blog post by ID (GET /api/v1/blog/posts/{id}/)
   */
  const getBlogPost = async (id: number | string): Promise<BlogPostItem> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      const data = await apiClient.request<BlogPostItem>(`/api/v1/blog/posts/${id}/`, {
        method: 'GET'
      });
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, `Failed to retrieve blog post #${id}.`);
      errorMsg.value = msg;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Helper to build FormData for blog post requests
   */
  const buildBlogPostFormData = (payload: any): FormData => {
    const formData = new FormData();
    if (payload.title !== undefined) {
      formData.append('title', payload.title.trim());
    }
    if (payload.content !== undefined) {
      formData.append('content', payload.content);
    }
    if (payload.author !== undefined && payload.author !== null) {
      formData.append('author', payload.author.toString());
    }
    if (payload.featured_image instanceof File) {
      formData.append('featured_image', payload.featured_image);
    }
    if (payload.featured_image_alt_text !== undefined) {
      formData.append('featured_image_alt_text', payload.featured_image_alt_text);
    }
    if (payload.seo_title !== undefined) {
      formData.append('seo_title', payload.seo_title);
    }
    if (payload.seo_description !== undefined) {
      formData.append('seo_description', payload.seo_description);
    }
    if (payload.seo_focus_keyword !== undefined) {
      formData.append('seo_focus_keyword', payload.seo_focus_keyword);
    }
    if (payload.seo_noindex !== undefined) {
      formData.append('seo_noindex', payload.seo_noindex ? 'true' : 'false');
    }
    if (payload.seo_nofollow !== undefined) {
      formData.append('seo_nofollow', payload.seo_nofollow ? 'true' : 'false');
    }

    if (Array.isArray(payload.categories)) {
      payload.categories.forEach((catId: any) => {
        formData.append('categories', catId.toString());
      });
    }

    if (Array.isArray(payload.tags)) {
      payload.tags.forEach((tagId: any) => {
        formData.append('tags', tagId.toString());
      });
    }

    return formData;
  };

  /**
   * Update an existing blog post (PATCH /api/v1/blog/posts/{id}/)
   */
  const updateBlogPost = async (id: number | string, payload: any): Promise<BlogPostItem> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      const formData = buildBlogPostFormData(payload);
      const data = await apiClient.request<BlogPostItem>(`/api/v1/blog/posts/${id}/`, {
        method: 'PATCH',
        body: formData
      });
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, `Failed to update blog post #${id}.`);
      errorMsg.value = msg;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Create a new blog post (POST /api/v1/blog/posts/)
   */
  const createBlogPost = async (payload: any): Promise<BlogPostItem> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      const formData = buildBlogPostFormData(payload);
      const data = await apiClient.request<BlogPostItem>('/api/v1/blog/posts/', {
        method: 'POST',
        body: formData
      });
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to create blog post.');
      errorMsg.value = msg;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Fetch paginated list of blog tags (GET /api/v1/blog/tags/)
   */
  const getBlogTags = async (params?: BlogTagQueryParams): Promise<PaginatedBlogTags> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      const queryObj: Record<string, any> = {};
      if (params) {
        if (params.page !== undefined && params.page !== null) queryObj.page = params.page;
        if (params.page_size !== undefined && params.page_size !== null) queryObj.page_size = params.page_size;
        if (params.search?.trim()) queryObj.search = params.search.trim();
        if (params.is_active !== undefined && params.is_active !== null) queryObj.is_active = params.is_active;
      }

      const data = await apiClient.request<PaginatedBlogTags | BlogTag[]>('/api/v1/blog/tags/', {
        method: 'GET',
        params: queryObj
      });

      let results: BlogTag[] = [];
      let count = 0;
      let nextUrl: string | null = null;
      let previousUrl: string | null = null;

      if (Array.isArray(data)) {
        results = data;
        count = data.length;
      } else if (data && typeof data === 'object' && 'results' in data) {
        results = data.results || [];
        count = typeof data.count === 'number' ? data.count : results.length;
        nextUrl = data.next || null;
        previousUrl = data.previous || null;
      }

      return {
        count,
        next: nextUrl,
        previous: previousUrl,
        results
      };
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to retrieve blog tags.');
      errorMsg.value = msg;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Create a new blog tag (POST /api/v1/blog/tags/)
   */
  const createBlogTag = async (payload: CreateBlogTagPayload): Promise<BlogTag> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      const data = await apiClient.request<BlogTag>('/api/v1/blog/tags/', {
        method: 'POST',
        body: payload
      });
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to create blog tag.');
      errorMsg.value = msg;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Update an existing blog tag (PATCH /api/v1/blog/tags/{id}/)
   */
  const updateBlogTag = async (id: number, payload: UpdateBlogTagPayload): Promise<BlogTag> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      const data = await apiClient.request<BlogTag>(`/api/v1/blog/tags/${id}/`, {
        method: 'PATCH',
        body: payload
      });
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to update blog tag.');
      errorMsg.value = msg;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Delete a blog tag (DELETE /api/v1/blog/tags/{id}/)
   */
  const deleteBlogTag = async (id: number): Promise<void> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      await apiClient.request<void>(`/api/v1/blog/tags/${id}/`, {
        method: 'DELETE'
      });
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to delete blog tag.');
      errorMsg.value = msg;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Delete an existing blog post (DELETE /api/v1/blog/posts/{id}/)
   */
  const deleteBlogPost = async (id: number | string): Promise<void> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      await apiClient.request<void>(`/api/v1/blog/posts/${id}/`, {
        method: 'DELETE'
      });
    } catch (err: any) {
      const msg = extractErrorMessage(err, `Failed to delete blog post #${id}.`);
      errorMsg.value = msg;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Unpublish an existing blog post (POST /api/v1/blog/posts/{id}/unpublish/)
   */
  const unpublishBlogPost = async (id: number | string): Promise<BlogPostItem> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      const data = await apiClient.request<BlogPostItem>(`/api/v1/blog/posts/${id}/unpublish/`, {
        method: 'POST'
      });
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, `Failed to unpublish blog post #${id}.`);
      errorMsg.value = msg;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Publish an existing blog post (POST /api/v1/blog/posts/{id}/publish/)
   */
  const publishBlogPost = async (id: number | string): Promise<BlogPostItem> => {
    isLoading.value = true;
    errorMsg.value = null;

    try {
      const data = await apiClient.request<BlogPostItem>(`/api/v1/blog/posts/${id}/publish/`, {
        method: 'POST'
      });
      return data;
    } catch (err: any) {
      const msg = extractErrorMessage(err, `Failed to publish blog post #${id}.`);
      errorMsg.value = msg;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const getPosts = (params?: { 
    category?: string; 
    query?: string;
    tag?: string;
  }) => {
    let filtered = [...blogPosts];

    if (params?.category) {
      filtered = filtered.filter(p => p.category.toLowerCase() === params.category?.toLowerCase());
    }

    if (params?.tag) {
      filtered = filtered.filter(p => p.tags.includes(params.tag!));
    }

    if (params?.query) {
      const q = params.query.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.excerpt.toLowerCase().includes(q)
      );
    }

    return filtered;
  };

  const getPostBySlug = (slug: string): BlogPost | undefined => {
    return blogPosts.find(p => p.slug === slug);
  };

  const getRecentPosts = (limit = 3): BlogPost[] => {
    return [...blogPosts].sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    ).slice(0, limit);
  };

  const getCategories = (): string[] => {
    return Array.from(new Set(blogPosts.map(p => p.category)));
  };

  return {
    getBlogPosts,
    getBlogPost,
    updateBlogPost,
    createBlogPost,
    deleteBlogPost,
    unpublishBlogPost,
    publishBlogPost,
    getBlogTags,
    createBlogTag,
    updateBlogTag,
    deleteBlogTag,
    getPosts,
    getPostBySlug,
    getRecentPosts,
    getCategories,
    isLoading,
    errorMsg
  };
};

