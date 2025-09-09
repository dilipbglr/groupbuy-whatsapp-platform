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

export interface Analytics {
  totalDeals: number;
  activeDeals: number;
  totalParticipants: number;
  totalRevenue: number;
  successRate: number;
  dealsByStatus: Array<{
    status: string;
    count: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
  }>;
}

export interface JoinDealRequest {
  phone_number: string;
  user_name?: string;
  quantity?: number;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
  };
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface LoginCredentials {
  phone_number: string;
  password: string;
}

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