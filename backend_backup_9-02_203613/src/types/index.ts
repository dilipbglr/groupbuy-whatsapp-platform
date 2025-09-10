// Re-export all types from database.ts
export * from './database';

// Additional utility types
export type DealStatus = 'scheduled' | 'active' | 'completed' | 'failed';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// Common request/response patterns
export interface BaseEntity {
  id: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}