import { useState, useEffect } from 'react';
import { participantsApi } from '../services/api';
import { Participant, JoinDealRequest } from '../types';
// @cursor edit: Add logger import
import { logger } from '../utils/logger';

export const useParticipants = (dealId?: string) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchParticipants = async () => {
    if (!dealId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      logger.info('Fetching participants for deal', { 
        source: 'useParticipants.fetchParticipants',
        dealId 
      });
      const res = await participantsApi.getDealParticipants(dealId);
      const data = await res.json();
      
      if (data.success) {
        setParticipants(data.data || []);
        logger.info('Participants loaded successfully', { 
          source: 'useParticipants.fetchParticipants',
          dealId, 
          count: data.data?.length || 0 
        });
      } else {
        logger.warn('Failed to fetch participants', { 
          source: 'useParticipants.fetchParticipants',
          dealId, 
          message: data.message 
        });
      }
    } catch (err: any) {
      logger.error('Failed to fetch participants', err, { 
        source: 'useParticipants.fetchParticipants',
        dealId,
        code: err?.code,
        message: err?.message,
      });
      setError(err.message || 'Failed to fetch participants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dealId) {
      logger.info('useParticipants hook initialized, fetching participants...', { 
        source: 'useParticipants.useEffect',
        dealId 
      });
      fetchParticipants();
    }
  }, [dealId]);

  const joinDeal = async (participantData: JoinDealRequest) => {
    if (!dealId) throw new Error('Deal ID is required');
    
    try {
      logger.info('User joining deal', { 
        source: 'useParticipants.joinDeal',
        dealId, 
        participantData 
      });
      const res = await participantsApi.joinDeal(dealId, participantData);
      const data = await res.json();
      
      if (data.success) {
        logger.info('User joined deal successfully', { 
          source: 'useParticipants.joinDeal',
          dealId, 
          participantId: data.data?.id 
        });
        await fetchParticipants(); // Refresh the list
        return data.data;
      } else {
        logger.warn('Failed to join deal', { 
          source: 'useParticipants.joinDeal',
          dealId, 
          message: data.message 
        });
      }
    } catch (err: any) {
      logger.error('Failed to join deal', err, { 
        source: 'useParticipants.joinDeal',
        dealId, 
        participantData,
        code: err?.code,
        message: err?.message,
      });
      throw new Error(err.message || 'Failed to join deal');
    }
  };

  return {
    participants,
    loading,
    error,
    fetchParticipants,
    joinDeal,
  };
};

export const useUserDeals = (phoneNumber?: string) => {
  const [userDeals, setUserDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserDeals = async () => {
    if (!phoneNumber) return;
    
    try {
      setLoading(true);
      setError(null);
      
      logger.info('Fetching user deals', { 
        source: 'useParticipants.fetchUserDeals',
        phoneNumber 
      });
      const res = await participantsApi.getUserDeals(phoneNumber);
      const data = await res.json();
      
      if (data.success) {
        setUserDeals(data.data || []);
        logger.info('User deals loaded successfully', { 
          source: 'useParticipants.fetchUserDeals',
          phoneNumber, 
          count: data.data?.length || 0 
        });
      } else {
        logger.warn('Failed to fetch user deals', { 
          source: 'useParticipants.fetchUserDeals',
          phoneNumber, 
          message: data.message 
        });
      }
    } catch (err: any) {
      logger.error('Failed to fetch user deals', err, { 
        source: 'useParticipants.fetchUserDeals',
        phoneNumber,
        code: err?.code,
        message: err?.message,
      });
      setError(err.message || 'Failed to fetch user deals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (phoneNumber) {
      logger.info('useUserDeals hook initialized, fetching user deals...', { 
        source: 'useParticipants.useUserDeals.useEffect',
        phoneNumber 
      });
      fetchUserDeals();
    }
  }, [phoneNumber]);

  return {
    userDeals,
    loading,
    error,
    fetchUserDeals,
  };
};