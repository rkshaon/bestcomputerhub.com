// File: /composables/useBlogService.ts
import { blogPosts } from '@/mock/data';
import type { BlogPost } from '@/types';

export const useBlogService = () => {
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
    getPosts,
    getPostBySlug,
    getRecentPosts,
    getCategories
  };
};
