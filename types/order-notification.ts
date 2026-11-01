// File: /types/order-notification.ts

/**
 * Internal email address alerted when an order is placed or cancelled.
 * Backend: /api/v1/email/order-notification-recipients/
 */
export interface OrderNotificationRecipient {
  id: number;
  email: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface OrderNotificationRecipientQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
}

export interface PaginatedOrderNotificationRecipients {
  count: number;
  next: string | null;
  previous: string | null;
  results: OrderNotificationRecipient[];
}

export interface CreateOrderNotificationRecipientPayload {
  email: string;
  name?: string;
  is_active?: boolean;
}

export type UpdateOrderNotificationRecipientPayload = Partial<CreateOrderNotificationRecipientPayload>;
