import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services';
import { useAuthStore } from '@/store/authStore';
import { Users, TrendingUp, ShoppingCart, RefreshCw, AlertCircle, Activity, ArrowUpRight, Package, Clock } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Activity as ActivityType } from '@/types';

// ─── helpers ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, accent,
}: { label: string; value: string | number; sub: string; icon: React.ElementType; accent: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-400 mt-1 truncate">{sub}</p>
      </div>
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isPartner = user?.role === 'Partner';

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: () => dashboardApi.getRecentActivities(10),
  });

  const getActivityIcon = (activity: ActivityType) => {
    switch (activity.activityType as string) {
      case 'LeadCreated': return '📝';
      case 'LeadConverted': return '✅';
      case 'OrderCreated': return '📦';
      case 'OrderConfirmed': return '✔️';
      case 'SubscriptionCreated': return '🔄';
      default: return '📌';
    }
  };

  const convRate = stats ? Math.round((stats.convertedLeads / Math.max(stats.totalLeads, 1)) * 100) : 0;
  const demoRate = stats ? Math.round((stats.demoLeads / Math.max(stats.totalLeads, 1)) * 100) : 0;
  const deliveredRate = stats ? Math.round((stats.deliveredOrders / Math.max(stats.totalOrders, 1)) * 100) : 0;

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen p-6 lg:p-8">
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded-xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6 lg:p-8">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {isPartner ? 'Partner Dashboard' : 'Dashboard'}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {isPartner ? 'Overview of your sales and leads' : 'Overview of your NexCRM pipeline'}
            </p>
          </div>
          <div className="text-xs text-gray-400 mt-1">Live data</div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isPartner ? (
            <>
              <StatCard
                label="My Leads"
                value={stats?.totalLeads ?? 0}
                sub={`${stats?.convertedLeads ?? 0} converted · ${convRate}%`}
                icon={Users}
                accent="bg-indigo-50 text-indigo-600"
              />
              <StatCard
                label="My Sales"
                value={formatCurrency(stats?.totalRevenue ?? 0)}
                sub={`${stats?.confirmedOrders ?? 0} confirmed orders`}
                icon={TrendingUp}
                accent="bg-emerald-50 text-emerald-600"
              />
              <StatCard
                label="Active Subscriptions"
                value={stats?.activeSubscriptions ?? 0}
                sub={`${stats?.upcomingRenewals30Days ?? 0} renewals in 30 days`}
                icon={RefreshCw}
                accent="bg-blue-50 text-blue-600"
              />
              <StatCard
                label="Conversion Rate"
                value={`${convRate}%`}
                sub={`${stats?.demoLeads ?? 0} in demo · ${stats?.newLeads ?? 0} new`}
                icon={Activity}
                accent="bg-violet-50 text-violet-600"
              />
            </>
          ) : (
            <>
              <StatCard
                label="Total Leads"
                value={stats?.totalLeads ?? 0}
                sub={`${stats?.newLeads ?? 0} new · ${stats?.demoLeads ?? 0} in demo`}
                icon={Users}
                accent="bg-indigo-50 text-indigo-600"
              />
              <StatCard
                label="Total Revenue"
                value={formatCurrency(stats?.totalRevenue ?? 0)}
                sub={`${stats?.confirmedOrders ?? 0} confirmed orders`}
                icon={TrendingUp}
                accent="bg-emerald-50 text-emerald-600"
              />
              <StatCard
                label="Active Subscriptions"
                value={stats?.activeSubscriptions ?? 0}
                sub={`${stats?.upcomingRenewals30Days ?? 0} renewals in 30 days`}
                icon={RefreshCw}
                accent="bg-blue-50 text-blue-600"
              />
              <StatCard
                label="Total Customers"
                value={stats?.totalCustomers ?? 0}
                sub={`${convRate}% lead conversion rate`}
                icon={Activity}
                accent="bg-violet-50 text-violet-600"
              />
            </>
          )}
        </div>

        {/* Middle Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Lead Pipeline */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Lead Pipeline</h2>
                <p className="text-xs text-gray-400 mt-0.5">{stats?.totalLeads ?? 0} total leads</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300" />
            </div>
            <div className="space-y-4">
              {[
                { label: 'New', value: stats?.newLeads ?? 0, pct: Math.round(((stats?.newLeads ?? 0) / Math.max(stats?.totalLeads ?? 1, 1)) * 100), color: 'bg-blue-500', textColor: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'In Demo', value: stats?.demoLeads ?? 0, pct: demoRate, color: 'bg-violet-500', textColor: 'text-violet-600', bg: 'bg-violet-50' },
                { label: 'Converted', value: stats?.convertedLeads ?? 0, pct: convRate, color: 'bg-emerald-500', textColor: 'text-emerald-600', bg: 'bg-emerald-50' },
              ].map(({ label, value, pct, color, textColor, bg }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-gray-600">{label}</span>
                    <span className={`text-xs font-semibold ${textColor}`}>{value} ({pct}%)</span>
                  </div>
                  <div className={`h-2 ${bg} rounded-full overflow-hidden`}>
                    <div className={`h-2 ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-gray-900">Alerts</h2>
            </div>
            <div className="space-y-3">
              {(stats?.upcomingRenewals30Days ?? 0) > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-amber-800">{stats?.upcomingRenewals30Days} renewals in 30 days</p>
                  <p className="text-[11px] text-amber-600 mt-0.5">Action needed soon</p>
                </div>
              )}
              {(stats?.upcomingRenewals90Days ?? 0) > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-blue-800">{stats?.upcomingRenewals90Days} renewals in 90 days</p>
                  <p className="text-[11px] text-blue-600 mt-0.5">Plan ahead</p>
                </div>
              )}
              {(stats?.pendingOrders ?? 0) > 0 && (
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-orange-800">{stats?.pendingOrders} pending orders</p>
                  <p className="text-[11px] text-orange-600 mt-0.5">Awaiting confirmation</p>
                </div>
              )}
              {(stats?.expiredSubscriptions ?? 0) > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-red-800">{stats?.expiredSubscriptions} expired subscriptions</p>
                  <p className="text-[11px] text-red-600 mt-0.5">Need renewal</p>
                </div>
              )}
              {(stats?.upcomingRenewals30Days ?? 0) === 0 && (stats?.pendingOrders ?? 0) === 0 && (stats?.expiredSubscriptions ?? 0) === 0 && (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mb-2">
                    <Activity className="w-5 h-5 text-emerald-500" />
                  </div>
                  <p className="text-xs font-medium text-gray-600">All clear!</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">No urgent actions</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Orders Overview */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-4 h-4 text-indigo-500" />
              <h2 className="text-sm font-semibold text-gray-900">Orders</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Total', value: stats?.totalOrders ?? 0, color: 'text-gray-900', dot: 'bg-gray-400' },
                { label: 'Pending', value: stats?.pendingOrders ?? 0, color: 'text-amber-600', dot: 'bg-amber-400' },
                { label: 'Confirmed', value: stats?.confirmedOrders ?? 0, color: 'text-blue-600', dot: 'bg-blue-500' },
                { label: 'Delivered', value: stats?.deliveredOrders ?? 0, color: 'text-emerald-600', dot: 'bg-emerald-500' },
              ].map(({ label, value, color, dot }) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    <span className="text-xs text-gray-500">{label}</span>
                  </div>
                  <span className={`text-sm font-semibold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-gray-400">Delivery rate</span>
                <span className="text-[11px] font-semibold text-emerald-600">{deliveredRate}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full">
                <div className="h-1.5 bg-emerald-500 rounded-full" style={{ width: `${deliveredRate}%` }} />
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Recent Activity</h2>
            </div>
            {activitiesLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-9 bg-gray-50 rounded-xl animate-pulse" />)}
              </div>
            ) : (activities?.length ?? 0) === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-gray-400">No recent activity</div>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                {(activities ?? []).map((activity: ActivityType) => (
                  <div key={activity.activityId} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                    <span className="text-base leading-none mt-0.5">{getActivityIcon(activity)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-800 truncate">{activity.description}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(activity.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
