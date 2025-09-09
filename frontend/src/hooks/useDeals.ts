import { useState, useEffect } from 'react';
import { dealsApi } from '../services/api';
import { Deal } from '../types';
import { logger } from '../utils/logger';

interface UseDealsOptions {
  status?: string;
  page?: number;
  limit?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const useDeals = (options: UseDealsOptions = {}) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchDeals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      logger.info('Fetching deals list', { 
        source: 'useDeals.fetchDeals',
        options 
      });
      const response = await dealsApi.getDeals(options);
      const data: ApiResponse<Deal[]> = await response.json(); // Parse the response
      
      if (data.success) {
        setDeals(data.data || []);
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
        logger.info('Deals loaded successfully', { 
          source: 'useDeals.fetchDeals',
          count: data.data?.length || 0 
        });
      } else {
        setDeals([]); // Fallback to empty array
        setPagination({ page: 1, limit: 10, total: 0, totalPages: 0 });
        setError(data.message || 'Failed to fetch deals');
      }
    } catch (err: any) {
      logger.error('Failed to fetch deals', err, {
        source: 'useDeals.fetchDeals',
        options,
        code: err?.code,
        message: err?.message,
      });
      setDeals([]); // Fallback on error
      setPagination({ page: 1, limit: 10, total: 0, totalPages: 0 });
      setError(err.message || 'Failed to fetch deals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    logger.info('useDeals hook initialized, fetching deals...', { 
      source: 'useDeals.useEffect',
      options 
    });
    fetchDeals();
  }, [options.status, options.page, options.limit]);

  const createDeal = async (dealData: any) => {
    try {
      logger.info('Creating new deal', { 
        source: 'useDeals.createDeal',
        dealData 
      });
      const response = await dealsApi.createDeal(dealData);
      const data: ApiResponse<any> = await response.json(); // Parse the response
      if (data.success) {
        logger.info('Deal created successfully', { 
          source: 'useDeals.createDeal',
          dealId: data.data?.id 
        });
        await fetchDeals();
      }
      return data.data;
    } catch (err: any) {
      logger.error('Failed to create deal', err, {
        source: 'useDeals.createDeal',
        dealData,
        code: err?.code,
        message: err?.message,
      });
      throw new Error(err.message || 'Failed to create deal');
    }
  };

  const updateDeal = async (id: string, dealData: any) => {
    try {
      logger.info('Updating deal', { 
        source: 'useDeals.updateDeal',
        dealId: id, 
        dealData 
      });
      const response = await dealsApi.updateDeal(id, dealData);
      const data: ApiResponse<any> = await response.json(); // Parse the response
      if (data.success) {
        logger.info('Deal updated successfully', { 
          source: 'useDeals.updateDeal',
          dealId: id 
        });
        await fetchDeals();
      }
      return data.data;
    } catch (err: any) {
      logger.error('Failed to update deal', err, {
        source: 'useDeals.updateDeal',
        dealId: id,
        dealData,
        code: err?.code,
        message: err?.message,
      });
      throw new Error(err.message || 'Failed to update deal');
    }
  };

  const deleteDeal = async (id: string) => {
    try {
      logger.info('Deleting deal', { 
        source: 'useDeals.deleteDeal',
        dealId: id 
      });
      const response = await dealsApi.deleteDeal(id);
      const data: ApiResponse<any> = await response.json(); // Parse the response
      if (data.success) {
        logger.info('Deal deleted successfully', { 
          source: 'useDeals.deleteDeal',
          dealId: id 
        });
        await fetchDeals();
      }
    } catch (err: any) {
      logger.error('Failed to delete deal', err, {
        source: 'useDeals.deleteDeal',
        dealId: id,
        code: err?.code,
        message: err?.message,
      });
      throw new Error(err.message || 'Failed to delete deal');
    }
  };

  const updateDealStatus = async (id: string, status: string) => {
    try {
      logger.info('Updating deal status', { 
        source: 'useDeals.updateDealStatus',
        dealId: id, 
        status 
      });
      const response = await dealsApi.updateDealStatus(id, status);
      const data: ApiResponse<any> = await response.json(); // Parse the response
      if (data.success) {
        logger.info('Deal status updated successfully', { 
          source: 'useDeals.updateDealStatus',
          dealId: id, 
          status 
        });
        await fetchDeals();
      }
      return data.data;
    } catch (err: any) {
      logger.error('Failed to update deal status', err, {
        source: 'useDeals.updateDealStatus',
        dealId: id,
        status,
        code: err?.code,
        message: err?.message,
      });
      throw new Error(err.message || 'Failed to update deal status');
    }
  };

  return { deals, loading, error, pagination, fetchDeals, createDeal, updateDeal, deleteDeal, updateDealStatus };
};