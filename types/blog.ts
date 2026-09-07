// File: /types/blog.ts

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  publishedAt: string;
  readingTime: string;
  tags: string[];
}

export interface BlogTag {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
}

export interface BlogTagQueryParams {
  is_active?: boolean;
  page?: number;
  page_size?: number;
  search?: string;
}

export interface PaginatedBlogTags {
  count: number;
  next: string | null;
  previous: string | null;
  results: BlogTag[];
}

export interface CreateBlogTagPayload {
  name: string;
}

export interface UpdateBlogTagPayload {
  name: string;
}

