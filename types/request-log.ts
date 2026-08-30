// File: /types/request-log.ts

export interface RequestLog {
  id: number | string;
  user?: number | string | { id: number | string; username?: string; email?: string; first_name?: string; last_name?: string } | null;
  user_id?: number | string | null;
  user_email?: string | null;
  username?: string | null;
  path?: string;
  method?: string;
  status_code?: number;
  ip_address?: string | null;
  remote_addr?: string | null;
  response_time?: number | null;
  duration?: number | null;
  execution_time?: number | null;
  created_at?: string | null;
  timestamp?: string | null;
  requested_at?: string | null;
  query_params?: string | Record<string, any> | null;
  request_data?: any;
  response_data?: any;
  user_agent?: string | null;
}

export interface PaginatedRequestLogs {
  count: number;
  next: string | null;
  previous: string | null;
  results: RequestLog[];
  page?: number;
  pages?: number;
}

export interface RequestLogQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  user?: number | string;
  status_code?: number | string;
  method?: string;
  path?: string;
  ordering?: string;
  created_at_after?: string;
  created_at_before?: string;
  start_date?: string;
  end_date?: string;
  [key: string]: any;
}

export type RequestLogsQueryParams = RequestLogQueryParams;
