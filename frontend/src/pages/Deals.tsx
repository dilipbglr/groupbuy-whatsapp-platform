// src/pages/Deals.tsx - Enhanced Version
import { useState } from 'react';
import Layout from '../components/Layout/Layout';
import DealsTable from '../components/Deals/DealsTable';
import DealForm from '../components/Deals/DealForm';
import ParticipantsList from '../components/Participants/ParticipantsList';
import ErrorMessage from '../components/ErrorMessage';
import ToastContainer from '../components/Toast/ToastContainer';
import { useDeals } from '../hooks/useDeals';
import { useToast } from '../hooks/useToast.ts';
import { Deal, CreateDealRequest, UpdateDealRequest } from '../types';

const Deals = () => {
  const [showForm, setShowForm] = useState(false);
  const [showParticipants, setShowParticipants] = useState<string | null>(null);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [formLoading, setFormLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { deals, loading, error, createDeal, updateDeal, deleteDeal, updateDealStatus } = useDeals({
    status: statusFilter || undefined,
  });

  const { toasts, success, error: toastError, removeToast } = useToast();

  const handleCreateDeal = () => {
    setEditingDeal(null);
    setShowForm(true);
    setShowParticipants(null);
    setActionError(null);
  };

  const handleEditDeal = (deal: Deal) => {
    setEditingDeal(deal);
    setShowForm(true);
    setShowParticipants(null);
    setActionError(null);
  };

  const handleViewParticipants = (deal: Deal) => {
    setShowParticipants(deal.id);
    setShowForm(false);
    setEditingDeal(null);
    setActionError(null);
  };

  const handleFormSubmit = async (dealData: CreateDealRequest | UpdateDealRequest) => {
    try {
      setFormLoading(true);
      setActionError(null);

      if (editingDeal) {
        await updateDeal(editingDeal.id, dealData as UpdateDealRequest);
        success('Deal updated successfully! 🎉'); // ← NEW: Toast notification
      } else {
        await createDeal(dealData as CreateDealRequest);
        success('Deal created successfully! 🎉'); // ← NEW: Toast notification
      }

      setShowForm(false);
      setEditingDeal(null);
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to save deal';
      setActionError(errorMsg);
      toastError(errorMsg); // ← NEW: Error toast
    } finally {
      setFormLoading(false);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingDeal(null);
    setActionError(null);
  };

  const handleParticipantsBack = () => {
    setShowParticipants(null);
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (!window.confirm('Are you sure you want to delete this deal?')) {
      return;
    }

    try {
      setActionError(null);
      await deleteDeal(dealId);
      success('Deal deleted successfully! 🗑️'); // ← NEW: Success toast
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to delete deal';
      setActionError(errorMsg);
      toastError(errorMsg); // ← NEW: Error toast
    }
  };

  const handleStatusChange = async (dealId: string, status: string) => {
    try {
      setActionError(null);
      await updateDealStatus(dealId, status);
      success(`Deal status updated to ${status}! 📋`); // ← NEW: Success toast
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to update status';
      setActionError(errorMsg);
      toastError(errorMsg); // ← NEW: Error toast
    }
  };

  // Loading skeleton for better UX
  const StatsCardSkeleton = () => (
    <div className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-12"></div>
          </div>
        </div>
      </div>
    </div>
  );

  // Stats calculation with error handling
  const calculateStats = () => {
    if (!deals || deals.length === 0) {
      return { scheduled: 0, active: 0, completed: 0, failed: 0, total: 0 };
    }

    return {
      scheduled: deals.filter(d => d.status === 'scheduled').length,
      active: deals.filter(d => d.status === 'active').length,
      completed: deals.filter(d => d.status === 'completed').length,
      failed: deals.filter(d => d.status === 'failed').length,
      total: deals.length
    };
  };

  const stats = calculateStats();

  if (showParticipants) {
    const deal = deals.find(d => d.id === showParticipants);
    if (!deal) {
      setShowParticipants(null);
      return null;
    }

    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={handleParticipantsBack}
                className="text-blue-600 hover:text-blue-800 mb-2 flex items-center transition-colors duration-200 hover:translate-x-1"
                aria-label="Back to Deals"
              >
                ← Back to Deals
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Participants</h1>
              <p className="mt-2 text-gray-600">Managing participants for "{deal.product_name}"</p>
            </div>
          </div>

          {actionError && <ErrorMessage message={actionError} />}

          <ParticipantsList
            dealId={deal.id}
            dealName={deal.product_name}
            maxParticipants={deal.max_participants}
            currentParticipants={deal.current_participants || 0}
          />
        </div>
        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      </Layout>
    );
  }

  if (showForm) {
    return (
      <Layout>
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {editingDeal ? 'Edit Deal' : 'Create New Deal'}
              </h1>
              <p className="mt-2 text-gray-600">
                {editingDeal ? 'Update deal information' : 'Add a new group buying deal to your platform'}
              </p>
            </div>
          </div>

          {actionError && <ErrorMessage message={actionError} />}

          <DealForm
            deal={editingDeal || undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            loading={formLoading}
          />
        </div>
        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Deals Management</h1>
            <p className="mt-2 text-gray-600">Manage your group buying deals and monitor performance</p>
          </div>
          <button
            onClick={handleCreateDeal}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg min-h-[44px]"
            aria-label="Create New Deal"
          >
            <span className="mr-2 text-lg">➕</span>
            Create Deal
          </button>
        </div>

        {/* Filters Section */}
        <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1 min-w-0">
              <label
                htmlFor="status-filter"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Filter by Status
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 min-h-[44px]"
                aria-describedby="status-filter-help"
              >
                <option value="">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
              <p id="status-filter-help" className="mt-1 text-sm text-gray-500">
                Filter deals by their current status
              </p>
            </div>
            <button
              onClick={() => setStatusFilter('')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 min-h-[44px]"
              aria-label="Clear all filters"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Error Display */}
        {(error || actionError) && (
          <ErrorMessage message={error || actionError || ''} />
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, i) => (
              <StatsCardSkeleton key={i} />
            ))
          ) : (
            [
              { key: 'scheduled', value: stats.scheduled, label: 'Scheduled', icon: '📅', color: 'blue' },
              { key: 'active', value: stats.active, label: 'Active', icon: '🟢', color: 'green' },
              { key: 'completed', value: stats.completed, label: 'Completed', icon: '✅', color: 'emerald' },
              { key: 'failed', value: stats.failed, label: 'Failed', icon: '❌', color: 'red' },
              { key: 'total', value: stats.total, label: 'Total Deals', icon: '🛍️', color: 'purple' },
            ].map(({ key, value, label, icon, color }) => (
              <div
                key={key}
                className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-105"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl" role="img" aria-label={label}>
                        {icon}
                      </span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {label}
                        </dt>
                        <dd className="text-2xl font-bold text-gray-900">
                          {value}
                        </dd>
                        {key !== 'total' && stats.total > 0 && (
                          <dd className="mt-2">
                            <div className="flex items-center">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-500 bg-${color}-500`}
                                  style={{
                                    width: `${(value / stats.total) * 100}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">
                                {Math.round((value / stats.total) * 100)}%
                              </span>
                            </div>
                          </dd>
                        )}
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Deals Table */}
        <DealsTable
          deals={deals}
          loading={loading}
          onEdit={handleEditDeal}
          onDelete={handleDeleteDeal}
          onStatusChange={handleStatusChange}
          onViewParticipants={handleViewParticipants}
        />

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      </div>
    </Layout>
  );
};

export default Deals;