// File: /composables/useBlogService.ts
import { ref } from 'vue';
import { blogPosts } from '@/mock/data';
import { useApiClient } from './useApiClient';
import { extractErrorMessage } from './useToast';
import type { BlogPost, BlogTag, BlogTagQueryParams, CreateBlogTagPayload, PaginatedBlogTags } from '@/types';

const isLoading = ref(false);
const errorMsg = ref<string | null>(null);

export const useBlogService = () => {
  const apiClient = useApiClient();

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
    getBlogTags,
    createBlogTag,
    getPosts,
    getPostBySlug,
    getRecentPosts,
    getCategories,
    isLoading,
    errorMsg
  };
};

