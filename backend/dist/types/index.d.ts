export * from './database';
export type DealStatus = 'scheduled' | 'active' | 'completed' | 'failed';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
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
//# sourceMappingURL=index.d.ts.map