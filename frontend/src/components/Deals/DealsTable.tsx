import { useState } from 'react';
import { Deal } from '../../types';
import DealStatusBadge from './DealStatusBadge';
import { formatDate, formatPrice } from '../../utils/formatters';

interface DealsTableProps {
  deals: Deal[];
  loading?: boolean;
  onEdit: (deal: Deal) => void;
  onDelete: (dealId: string) => void;
  onStatusChange: (dealId: string, status: string) => void;
  onViewParticipants?: (deal: Deal) => void;
}

type SortField = 'product_name' | 'original_price' | 'group_price' | 'start_time' | 'status';
type SortOrder = 'asc' | 'desc';

const DealsTable = ({ deals, loading, onEdit, onDelete, onStatusChange, onViewParticipants }: DealsTableProps) => {
  const [sortField, setSortField] = useState<SortField>('start_time');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedDeals = [...deals].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    // Handle different data types
    if (sortField === 'start_time') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    } else if (sortField === 'original_price' || sortField === 'group_price') {
      aValue = parseFloat(aValue);
      bValue = parseFloat(bValue);
    } else if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <div className="text-gray-500">
          <span className="text-4xl mb-4 block">📦</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No deals found</h3>
          <p className="text-gray-500">Get started by creating your first deal.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('product_name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Product</span>
                  <span>{getSortIcon('product_name')}</span>
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('original_price')}
              >
                <div className="flex items-center space-x-1">
                  <span>Original Price</span>
                  <span>{getSortIcon('original_price')}</span>
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('group_price')}
              >
                <div className="flex items-center space-x-1">
                  <span>Group Price</span>
                  <span>{getSortIcon('group_price')}</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Participants
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('start_time')}
              >
                <div className="flex items-center space-x-1">
                  <span>Start Time</span>
                  <span>{getSortIcon('start_time')}</span>
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  <span>{getSortIcon('status')}</span>
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedDeals.map((deal) => (
              <tr key={deal.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {deal.product_name}
                    </div>
                    {deal.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {deal.description}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatPrice(deal.original_price)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex flex-col">
                    <span className="font-medium text-green-600">
                      {formatPrice(deal.group_price)}
                    </span>
                    <span className="text-xs text-gray-500">
                      Save {formatPrice(deal.original_price - deal.group_price)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex flex-col">
                    <button
                      onClick={() => onViewParticipants?.(deal)}
                      className="text-blue-600 hover:text-blue-800 text-left"
                    >
                      {deal.current_participants || 0} / {deal.max_participants}
                    </button>
                    <span className="text-xs text-gray-500">
                      Min: {deal.min_participants}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex flex-col">
                    <span>{formatDate(deal.start_time)}</span>
                    <span className="text-xs text-gray-500">
                      Ends: {formatDate(deal.end_time)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <DealStatusBadge status={deal.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    {onViewParticipants && (
                      <button
                        onClick={() => onViewParticipants(deal)}
                        className="text-purple-600 hover:text-purple-900 transition-colors"
                        title="View participants"
                      >
                        👥
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(deal)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="Edit deal"
                    >
                      ✏️
                    </button>
                    <select
                      value={deal.status}
                      onChange={(e) => onStatusChange(deal.id, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1"
                      title="Change status"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                    </select>
                    <button
                      onClick={() => onDelete(deal.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                      title="Delete deal"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DealsTable;