import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, ShoppingCart, RefreshCw, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Activity } from '@/types';

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: () => dashboardApi.getRecentActivities(10),
  });

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  const getActivityIcon = (activity: Activity) => {
    switch (activity.activityType) {
      case 'LeadCreated':
        return '📝';
      case 'LeadConverted':
        return '✅';
      case 'OrderCreated':
        return '📦';
      case 'OrderConfirmed':
        return '✔️';
      case 'SubscriptionCreated':
        return '🔄';
      default:
        return '📌';
    }
  };

  return (
    <div className="p-8 space-y-8 min-h-full">
      {/* Page Header */}
      <div className="animate-in fade-in duration-500">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Dashboard</h1>
        <p className="text-slate-600 mt-2">Your CRM overview and key metrics</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Leads */}
        <Card className="rounded-xl border-2 border-slate-200 hover:shadow-lg transition-all duration-300 hover:border-blue-300 animate-in fade-in slide-in-from-bottom-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Total Leads</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats?.totalLeads || 0}</div>
            <p className="text-xs text-slate-600 mt-1">
              {stats?.qualifiedLeads || 0} qualified • {stats?.convertedLeads || 0} converted
            </p>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card className="rounded-xl border-2 border-slate-200 hover:shadow-lg transition-all duration-300 hover:border-green-300 animate-in fade-in slide-in-from-bottom-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Total Revenue</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {formatCurrency(stats?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              From {stats?.confirmedOrders || 0} confirmed orders
            </p>
          </CardContent>
        </Card>

        {/* Subscriptions */}
        <Card className="rounded-xl border-2 border-slate-200 hover:shadow-lg transition-all duration-300 hover:border-cyan-300 animate-in fade-in slide-in-from-bottom-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Active Subscriptions</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-cyan-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats?.activeSubscriptions || 0}</div>
            <p className="text-xs text-slate-600 mt-1">
              {stats?.upcomingRenewals30Days || 0} renewals (30 days)
            </p>
          </CardContent>
        </Card>

        {/* Customers */}
        <Card className="rounded-xl border-2 border-slate-200 hover:shadow-lg transition-all duration-300 hover:border-amber-300 animate-in fade-in slide-in-from-bottom-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Total Customers</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats?.totalCustomers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.leadConversionRate?.toFixed(1) || 0}% conversion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lead Status & Order Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lead Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">New</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${stats?.totalLeads ? (stats.newLeads / stats.totalLeads) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="font-semibold text-sm">{stats?.newLeads}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Qualified</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{
                        width: `${stats?.totalLeads ? (stats.qualifiedLeads / stats.totalLeads) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="font-semibold text-sm">{stats?.qualifiedLeads}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Converted</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${stats?.totalLeads ? (stats.convertedLeads / stats.totalLeads) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="font-semibold text-sm">{stats?.convertedLeads}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Pending</span>
                <span className="font-semibold">{stats?.pendingOrders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Confirmed</span>
                <span className="font-semibold text-green-600">{stats?.confirmedOrders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Delivered</span>
                <span className="font-semibold text-blue-600">{stats?.deliveredOrders}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-semibold">Total</span>
                <span className="font-bold">{stats?.totalOrders}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Renewal Alerts & Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Upcoming Renewals */}
        {(stats?.upcomingRenewals30Days || 0) > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Upcoming Renewals (30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-orange-600">
                  {stats?.upcomingRenewals30Days}
                </p>
                <p className="text-xs text-orange-700">
                  {stats?.upcomingRenewals90Days &&
                    stats.upcomingRenewals90Days > stats.upcomingRenewals30Days
                    ? `+ ${stats.upcomingRenewals90Days - stats.upcomingRenewals30Days} more in 60 days`
                    : 'No additional renewals in 90 days'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Subscription Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Active</span>
                <span className="font-semibold text-green-600">
                  {stats?.activeSubscriptions}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Expired</span>
                <span className="font-semibold text-red-600">
                  {stats?.expiredSubscriptions}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-semibold">Total</span>
                <span className="font-bold">{stats?.totalSubscriptions}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="rounded-xl border-2 border-slate-200 hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg text-slate-900">Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {activitiesLoading ? (
            <p className="text-slate-600">Loading activities...</p>
          ) : activities && activities.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activities.map((activity, idx) => (
                <div
                  key={activity.activityId}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                    idx % 2 === 0 ? 'bg-slate-50 hover:bg-blue-50' : 'bg-white hover:bg-blue-50'
                  }`}
                >
                  <span className="text-2xl mt-0.5">{getActivityIcon(activity)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {activity.createdByUser?.name || 'System'} • {formatDate(activity.activityDate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No recent activities</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
