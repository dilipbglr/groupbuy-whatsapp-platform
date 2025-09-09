// Database entity interfaces
export interface User {
  id: string;
  phone_number: string;
  name?: string;
  email?: string;
  is_admin?: boolean;
  created_at?: string;
}

export interface Deal {
  id: string;
  product_name: string;
  description?: string;
  original_price: number;
  group_price: number;
  min_participants: number;
  max_participants: number;
  current_participants?: number;
  start_time: string;
  end_time: string;
  status?: 'scheduled' | 'active' | 'completed' | 'failed';
  created_at?: string;
  updated_at?: string;
}

export interface Participant {
  id: string;
  deal_id?: string;
  phone_number: string;
  user_name?: string;
  quantity?: number;
  payment_status?: 'pending' | 'completed' | 'failed' | 'refunded';
  amount_paid?: number;
  joined_at?: string;
}

export interface DealHistory {
  id: string;
  deal_id?: string;
  action_type: string;
  actor_phone?: string;
  old_status?: string;
  new_status?: string;
  details?: Record<string, any>;
  created_at?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode?: number;
}

// Request types
export interface CreateDealRequest {
  product_name: string;
  description?: string;
  original_price: number;
  group_price: number;
  min_participants: number;
  max_participants: number;
  start_time: string;
  end_time: string;
}

export interface UpdateDealRequest {
  product_name?: string;
  description?: string;
  original_price?: number;
  group_price?: number;
  min_participants?: number;
  max_participants?: number;
  start_time?: string;
  end_time?: string;
  status?: 'scheduled' | 'active' | 'completed' | 'failed';
}

export interface JoinDealRequest {
  phone_number: string;
  user_name?: string;
  quantity?: number;
}