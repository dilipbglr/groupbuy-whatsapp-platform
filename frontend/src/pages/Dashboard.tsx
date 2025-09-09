// src/pages/Dashboard.tsx
import { useAnalytics } from '../hooks/useAnalytics';
import { useDeals } from '../hooks/useDeals';
import { useAuth } from '../hooks/useAuth';
import AnalyticsChart from '../components/Analytics/AnalyticsChart';
import Layout from '../components/Layout/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const Dashboard = () => {
  const { user, isLoading, isAuthenticated, error: authError } = useAuth();
  const { analytics, loading: analyticsLoading, error: analyticsError } = useAnalytics();
  const { deals, loading: dealsLoading, error: dealsError } = useDeals();

  // ✅ 1. Prevent render crash while loading
  if (isLoading || analyticsLoading || dealsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading dashboard..." size="md" />
      </div>
    );
  }

  // ✅ 2. Session error handling
  if (!user && isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center">Session error. Please login again.</div>;
  }

  // ✅ 3. Redirect or show message if not logged in or error
  if (!user || authError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorMessage message={authError || 'You must be logged in to view this page'} />
      </div>
    );
  }

  // ✅ 3. Safe fallback values to prevent undefined render crash
  const safeAnalytics = analytics || {
    activeDeals: 0,
    totalParticipants: 0,
    totalRevenue: 0,
    successRate: 0,
    dealsByStatus: {},
    revenueByMonth: [],
  };

  const safeDeals = deals || [];
  const activeDealsCount = safeDeals.filter(d => d?.status === 'active').length || 0;

  // ✅ 4. Pie chart: Deals by Status
  const chartDealsByStatus = Object.entries(safeAnalytics.dealsByStatus || {}).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count || 0,
  }));

  // ✅ 5. Bar chart: Revenue by Month
  const chartRevenueByMonth = (safeAnalytics.revenueByMonth || []).map(item => ({
    name: item?.month ?? 'Unknown',
    value: item?.revenue ?? 0,
  }));

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back, {user.name || user.email || 'Admin'}!</p>
        </div>

        {/* ✅ 6. Error message block */}
        {(analyticsError || dealsError) && (
          <ErrorMessage message={analyticsError || dealsError || 'Error loading data'} />
        )}

        {/* ✅ 7. Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard title="Active Deals" icon="🛍️" value={safeAnalytics.activeDeals || activeDealsCount} />
          <SummaryCard title="Total Participants" icon="👥" value={safeAnalytics.totalParticipants} />
          <SummaryCard title="Revenue" icon="💰" value={`$${safeAnalytics.totalRevenue?.toLocaleString?.() || '0'}`} />
          <SummaryCard
            title="Success Rate"
            icon="📈"
            value={`${safeAnalytics.successRate?.toFixed?.(1) ?? '0'}%`}
          />
        </div>

        {/* ✅ 8. Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {chartDealsByStatus.length > 0 && (
            <AnalyticsChart
              type="pie"
              data={chartDealsByStatus}
              title="Deals by Status"
              dataKey="value"
              nameKey="name"
            />
          )}
          {chartRevenueByMonth.length > 0 && (
            <AnalyticsChart
              type="bar"
              data={chartRevenueByMonth}
              title="Revenue by Month"
              dataKey="value"
              nameKey="name"
            />
          )}
        </div>

        {/* ✅ 9. Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {safeDeals.length > 0 ? (
                safeDeals.slice(0, 5).map((deal, index) => (
                  <div key={deal?.id || index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                        <span className="text-sm font-medium text-blue-800">🛍️</span>
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        Deal "{deal?.product_name || 'Unknown'}" - {deal?.status || 'unknown'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(deal?.current_participants || 0)} / {deal?.max_participants || 0} participants
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <span className="text-4xl mb-2 block">📊</span>
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// ✅ 10. Small reusable card component
const SummaryCard = ({ title, icon, value }: { title: string; icon: string; value: React.ReactNode }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0 text-2xl">{icon}</div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="text-lg font-medium text-gray-900">{value}</dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
);

export default Dashboard;