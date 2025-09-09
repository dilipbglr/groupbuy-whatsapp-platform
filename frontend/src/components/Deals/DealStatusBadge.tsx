import { Deal } from '../../types';

interface DealStatusBadgeProps {
  status: Deal['status'];
}

const DealStatusBadge = ({ status }: DealStatusBadgeProps) => {
  const getStatusConfig = (status: Deal['status']) => {
    switch (status) {
      case 'scheduled':
        return {
          color: 'bg-blue-100 text-blue-800',
          text: 'Scheduled',
          icon: '📅'
        };
      case 'active':
        return {
          color: 'bg-green-100 text-green-800',
          text: 'Active',
          icon: '🟢'
        };
      case 'completed':
        return {
          color: 'bg-gray-100 text-gray-800',
          text: 'Completed',
          icon: '✅'
        };
      case 'failed':
        return {
          color: 'bg-red-100 text-red-800',
          text: 'Failed',
          icon: '❌'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          text: 'Unknown',
          icon: '❓'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <span className="mr-1">{config.icon}</span>
      {config.text}
    </span>
  );
};

export default DealStatusBadge;