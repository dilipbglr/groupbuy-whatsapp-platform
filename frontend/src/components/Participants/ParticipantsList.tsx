import { useState } from 'react';
import { useParticipants } from '../../hooks/useParticipants';
import { Participant } from '../../types';
import ErrorMessage from '../ErrorMessage';
import { formatDate } from '../../utils/formatters';
import JoinDealForm from './JoinDealForm';

interface ParticipantsListProps {
  dealId: string;
  dealName: string;
  maxParticipants: number;
  currentParticipants: number;
}

const ParticipantsList = ({ dealId, dealName, maxParticipants, currentParticipants }: ParticipantsListProps) => {
  const { participants, loading, error, fetchParticipants, joinDeal } = useParticipants(dealId);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleJoinDeal = async (participantData: any) => {
    try {
      setJoinLoading(true);
      setJoinError(null);
      await joinDeal(participantData);
      setShowJoinForm(false);
    } catch (error: any) {
      setJoinError(error.message);
    } finally {
      setJoinLoading(false);
    }
  };

  const getPaymentStatusBadge = (status?: string) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      completed: { color: 'bg-green-100 text-green-800', text: 'Completed' },
      failed: { color: 'bg-red-100 text-red-800', text: 'Failed' },
      refunded: { color: 'bg-gray-100 text-gray-800', text: 'Refunded' },
    };

    const statusConfig = config[status as keyof typeof config] || config.pending;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
        {statusConfig.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Participants - {dealName}
            </h3>
            <p className="text-sm text-gray-500">
              {currentParticipants} / {maxParticipants} participants
            </p>
          </div>
          <button
            onClick={() => setShowJoinForm(true)}
            className="btn-primary"
            disabled={currentParticipants >= maxParticipants}
          >
            Add Participant
          </button>
        </div>
      </div>

      {error && (
        <div className="p-6">
          <ErrorMessage message={error} onRetry={fetchParticipants} />
        </div>
      )}

      {showJoinForm && (
        <div className="p-6 border-b border-gray-200">
          <JoinDealForm
            onSubmit={handleJoinDeal}
            onCancel={() => {
              setShowJoinForm(false);
              setJoinError(null);
            }}
            loading={joinLoading}
            error={joinError}
          />
        </div>
      )}

      <div className="overflow-hidden">
        {participants.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <span className="text-4xl mb-4 block">👥</span>
            <p>No participants yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {participants.map((participant) => (
                  <tr key={participant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {participant.user_name || 'Anonymous'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {participant.phone_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {participant.quantity || 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPaymentStatusBadge(participant.payment_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {participant.joined_at ? formatDate(participant.joined_at) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantsList;