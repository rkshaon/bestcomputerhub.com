// File: /types/blog.ts

export interface BlogAuthor {
  id: number;
  full_name: string;
  email: string;
  username: string;
}

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
}

// Mock interface for existing storefront blog
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

// Backend interface for admin blog posts
export interface BlogPostItem {
  id: number;
  title: string;
  slug: string;
  author: BlogAuthor;
  status: string;
  published_at: string | null;
  featured_image: string;
  featured_image_alt_text: string;
  categories: BlogCategory[];
  tags: BlogTag[];
  created_at: string;
}

export interface BlogPostQueryParams {
  page?: number;
  page_size?: number;
}

export interface PaginatedBlogPosts {
  count: number;
  next: string | null;
  previous: string | null;
  results: BlogPostItem[];
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
