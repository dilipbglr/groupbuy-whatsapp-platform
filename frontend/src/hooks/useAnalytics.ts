import { useState, useEffect } from 'react';
import { analyticsApi } from '../services/api';
import { logger } from '../utils/logger';

interface Analytics {
  totalDeals?: number;
  activeDeals?: number;
  totalParticipants?: number;
  totalRevenue?: number;
  successRate?: number;
  dealsByStatus?: { [key: string]: number };
  revenueByMonth?: { month: string; revenue: number }[];
}

export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // @cursor edit: Wrap analytics fetch with logger
      logger.info('Loading dashboard data', { 
        source: 'useAnalytics.fetchAnalytics' 
      });
      const response = await analyticsApi.getAnalytics();

      // ✅ Safely handle 304 or unexpected response types
      if (response.status === 304) {
        logger.info('Dashboard data unchanged (304)', { 
          source: 'useAnalytics.fetchAnalytics',
          status: response.status 
        });
        setAnalytics(null); // no updates
        return;
      }

      const result = await response.json();

      if (result.success) {
        setAnalytics(result.data || {
          totalDeals: 0,
          activeDeals: 0,
          totalParticipants: 0,
          totalRevenue: 0,
          successRate: 0,
          dealsByStatus: {},
          revenueByMonth: [],
        });
        logger.info('Dashboard data loaded', { 
          source: 'useAnalytics.fetchAnalytics',
          data: result.data 
        });
      } else {
        logger.warn('Dashboard data fetch failed', { 
          source: 'useAnalytics.fetchAnalytics',
          message: result.message 
        });
        setAnalytics({
          totalDeals: 0,
          activeDeals: 0,
          totalParticipants: 0,
          totalRevenue: 0,
          successRate: 0,
          dealsByStatus: {},
          revenueByMonth: [],
        });
        setError(result.message || 'Failed to fetch analytics');
      }
    } catch (err: any) {
      logger.error('Failed to load dashboard data', err, {
        source: 'useAnalytics.fetchAnalytics',
        code: err?.code,
        message: err?.message,
      });
      setAnalytics({
        totalDeals: 0,
        activeDeals: 0,
        totalParticipants: 0,
        totalRevenue: 0,
        successRate: 0,
        dealsByStatus: {},
        revenueByMonth: [],
      });
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    logger.info('useAnalytics hook initialized, fetching data...', { 
      source: 'useAnalytics.useEffect' 
    });
    fetchAnalytics();
  }, []);

  return { analytics, loading, error, refetch: fetchAnalytics };
};
