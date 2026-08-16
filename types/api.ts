// File: /types/api.ts

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  page: number;
  pages: number;
  next?: string | null;
  previous?: string | null;
}
