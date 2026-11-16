// File: /types/api.ts

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  page: number;
  pages: number;
  next?: string | null;
  previous?: string | null;
}

export interface ApiRequestOptions {
  method?: string;
  headers?: any;
  query?: Record<string, any>;
  params?: Record<string, any>;
  body?: any;
  isPublic?: boolean;
  [key: string]: any;
}
