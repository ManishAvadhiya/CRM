import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subscriptionsApi } from '@/services';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Calendar, CheckCircle, AlertCircle, TrendingUp, Clock, Zap } from 'lucide-react';
import type { Subscription } from '@/types';

export default function SubscriptionsPage() {
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: subscriptions = [], isLoading, refetch: refetchSubscriptions } = useQuery({
    queryKey: ['subscriptions', statusFilter],
    queryFn: () => statusFilter ? subscriptionsApi.getAll(statusFilter) : subscriptionsApi.getAll(),
    refetchInterval: 5000, // Auto-refresh every 5 seconds for real-time updates
  });

  const { data: upcomingRenewals = [] } = useQuery({
    queryKey: ['upcoming-renewals'],
    queryFn: () => subscriptionsApi.getUpcomingRenewals(30),
    refetchInterval: 5000,
  });

  const stats = useMemo(() => {
    return {
      totalRevenue: subscriptions.reduce((sum, sub) => sum + (sub.annualFee || 0), 0),
      activeCount: subscriptions.filter(s => s.status === 'Active').length,
      renewalCount: upcomingRenewals.length,
      churnRisk: subscriptions.filter(s => !s.autoRenew).length,
    };
  }, [subscriptions, upcomingRenewals]);

  const getDaysUntilRenewal = (renewalDate: string): number => {
    const renewal = new Date(renewalDate);
    const today = new Date();
    const diffTime = renewal.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Expired':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'Suspended':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className={`bg-white rounded-xl border-2 ${color} p-6 hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-spin" />
          <p className="text-muted-foreground">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 min-h-full">
      {/* Page Header */}
      <div className="animate-in fade-in duration-500">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Subscriptions</h1>
        <p className="text-slate-600 mt-2">Manage your active subscriptions and track renewal dates</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Annual Revenue"
          value={formatCurrency(stats.totalRevenue)}
          color="border-blue-300 bg-blue-50"
        />
        <StatCard
          icon={CheckCircle}
          label="Active Subscriptions"
          value={stats.activeCount}
          color="border-green-300 bg-green-50"
        />
        <StatCard
          icon={Clock}
          label="Upcoming Renewals"
          value={stats.renewalCount}
          color="border-amber-300 bg-amber-50"
        />
        <StatCard
          icon={AlertCircle}
          label="Churn Risk"
          value={stats.churnRisk}
          color="border-red-300 bg-red-50"
        />
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={statusFilter === '' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('')}
          className={`transition-all ${
            statusFilter === ''
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
              : 'hover:bg-slate-50'
          }`}
        >
          All Subscriptions
        </Button>
        {['Active', 'Expired', 'Cancelled', 'Suspended'].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            onClick={() => setStatusFilter(status)}
            className={`transition-all ${
              statusFilter === status
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                : 'hover:bg-slate-50'
            }`}
          >
            {status}
          </Button>
        ))}
      </div>

      {/* Subscriptions Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 bg-white">
        {/* Horizontal Scroll Wrapper */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
          <table className="w-full min-w-max">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 sticky left-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">Subscription</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">Product</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">Renewal Date</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">Days Left</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">Annual Fee</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap sticky right-0 bg-gradient-to-l from-slate-50 to-slate-100">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {subscriptions && subscriptions.length > 0 ? (
                subscriptions.map((sub, idx) => {
                  const daysUntilRenewal = getDaysUntilRenewal(sub.renewalDate);
                  return (
                    <tr
                      key={sub.subscriptionId}
                      className={`transition-all duration-200 hover:bg-blue-50 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-900">{sub.subscriptionNumber}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {sub.customer?.companyName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {sub.productVariant?.variantName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(sub.status)}`}>
                          {sub.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {formatDate(sub.startDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {formatDate(sub.renewalDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            daysUntilRenewal <= 7
                              ? 'bg-red-100 text-red-700'
                              : daysUntilRenewal <= 30
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {daysUntilRenewal} days
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-slate-900">
                        {formatCurrency(sub.annualFee)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right sticky right-0 bg-white hover:bg-blue-50">
                        <Dialog open={isDetailOpen && selectedSubscription?.subscriptionId === sub.subscriptionId} onOpenChange={setIsDetailOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedSubscription(sub)}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 text-xs"
                              title="View Details"
                            >
                              👁️
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                              <DialogTitle className="text-2xl">Subscription Details</DialogTitle>
                            </DialogHeader>
                            {selectedSubscription && (
                              <div className="space-y-6">
                                {/* Subscription Info */}
                                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4 space-y-3">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-slate-600">Subscription Number:</span>
                                    <span className="font-bold text-slate-900">{selectedSubscription.subscriptionNumber}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-slate-600">Status:</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedSubscription.status)}`}>
                                      {selectedSubscription.status}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-slate-600">Auto-Renew:</span>
                                    <span className="font-semibold text-slate-900">
                                      {selectedSubscription.autoRenew ? '✅ Yes' : '❌ No'}
                                    </span>
                                  </div>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-xs text-slate-600 mb-1">Start Date</p>
                                    <p className="font-semibold text-slate-900">{formatDate(selectedSubscription.startDate)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-600 mb-1">Renewal Date</p>
                                    <p className="font-semibold text-slate-900">{formatDate(selectedSubscription.renewalDate)}</p>
                                  </div>
                                </div>

                                {/* Annual Fee */}
                                <div>
                                  <p className="text-xs text-slate-600 mb-1">Annual Fee</p>
                                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(selectedSubscription.annualFee)}</p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                  <Button className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white">
                                    Manage Subscription
                                  </Button>
                                  <Button variant="outline" className="flex-1">
                                    Renew Now
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Zap className="w-8 h-8 text-slate-300" />
                      <p className="text-muted-foreground">
                        No {statusFilter ? statusFilter.toLowerCase() : ''} subscriptions found {statusFilter ? '- try a different filter' : '- create orders and confirm them to add subscriptions'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming Renewals */}
      {upcomingRenewals.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-slate-900">Upcoming Renewals (Next 30 Days)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingRenewals.slice(0, 6).map((sub) => (
              <div key={sub.subscriptionId} className="border border-amber-200 rounded-lg p-4 hover:bg-amber-50 transition-colors">
                <p className="font-semibold text-slate-900">{sub.customer?.companyName}</p>
                <p className="text-sm text-slate-600 mt-1">{sub.subscriptionNumber}</p>
                <p className="text-xs text-slate-500 mt-2">Renews: {formatDate(sub.renewalDate)}</p>
                <p className="text-sm font-bold text-amber-600 mt-2">{formatCurrency(sub.annualFee)}/year</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
