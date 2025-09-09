// vite-env.d.ts should be in the root to support import.meta.env
// Ensure vite-env.d.ts contains: /// <reference types="vite/client" />

// @cursor edit: Add logger import
import { logger } from '../utils/logger';

// Define a custom error class to include the response property
class ApiError extends Error {
  response: Response;
  constructor(message: string, response: Response) {
    super(message);
    this.name = 'ApiError';
    this.response = response;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// API utility functions
// @cursor edit: Enhance apiRequest with logger usage
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${endpoint}`;

  try {
    logger.info('API request', { 
      source: 'api.fetch', 
      url, 
      method: options?.method || 'GET' 
    });

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If JSON parsing fails, use the default error message
      }
      
      logger.warn('API response error', {
        source: 'api.fetch',
        status: response.status,
        errorMessage,
        url: response.url,
      });
      throw new ApiError(errorMessage, response);
    }

    logger.info('API response received', { 
      source: 'api.fetch',
      url, 
      status: response.status 
    });
    return response; // Return raw response to allow parsing in calling function
  } catch (error) {
    logger.error('API request failed', error, { 
      source: 'api.fetch',
      url,
    });
    throw error;
  }
};

// Deals API
export const dealsApi = {
  getDeals: async (params?: { status?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const query = searchParams.toString();
    return apiRequest(`/api/deals${query ? `?${query}` : ''}`);
  },

  getDeal: async (id: string) => {
    return apiRequest(`/api/deals/${id}`);
  },

  createDeal: async (dealData: any) => {
    return apiRequest('/api/deals', {
      method: 'POST',
      body: JSON.stringify(dealData),
    });
  },

  updateDeal: async (id: string, dealData: any) => {
    return apiRequest(`/api/deals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dealData),
    });
  },

  deleteDeal: async (id: string) => {
    return apiRequest(`/api/deals/${id}`, {
      method: 'DELETE',
    });
  },

  updateDealStatus: async (id: string, status: string) => {
    return apiRequest(`/api/deals/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// Participants API
export const participantsApi = {
  getDealParticipants: async (dealId: string) => {
    return apiRequest(`/api/deals/${dealId}/participants`);
  },

  joinDeal: async (dealId: string, participantData: any) => {
    return apiRequest(`/api/deals/${dealId}/join`, {
      method: 'POST',
      body: JSON.stringify(participantData),
    });
  },

  getUserDeals: async (phoneNumber: string) => {
    return apiRequest(`/api/users/${phoneNumber}/deals`);
  },
};

// Analytics API
export const analyticsApi = {
  getAnalytics: async () => {
    return apiRequest('/api/analytics');
  },

  getDealAnalytics: async (dealId: string) => {
    return apiRequest(`/api/deals/${dealId}/analytics`);
  },
};