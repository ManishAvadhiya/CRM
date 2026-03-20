import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subscriptionsApi } from '@/services';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getSubscriptionStatusString } from '@/lib/enum-mappings';
import { Calendar, CheckCircle, AlertCircle, TrendingUp, Clock, Zap, X } from 'lucide-react';
import type { Subscription } from '@/types';

function getDaysUntilRenewal(renewalDate: string): number {
  const renewal = new Date(renewalDate);
  const today = new Date();
  return Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function statusCls(status: string | number) {
  const s = getSubscriptionStatusString(status);
  switch (s) {
    case 'Active': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Expired': return 'bg-red-50 text-red-600 border-red-200';
    case 'Cancelled': return 'bg-gray-100 text-gray-500 border-gray-200';
    case 'Suspended': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'PendingRenewal': return 'bg-blue-50 text-blue-700 border-blue-200';
    default: return 'bg-gray-100 text-gray-500 border-gray-200';
  }
}

function daysCls(days: number) {
  if (days <= 7) return 'bg-red-50 text-red-600';
  if (days <= 30) return 'bg-amber-50 text-amber-700';
  return 'bg-emerald-50 text-emerald-700';
}

function DetailPanel({ sub, onClose }: { sub: Subscription; onClose: () => void }) {
  const days = getDaysUntilRenewal(sub.renewalDate);
  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">{sub.subscriptionNumber}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Subscription details</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1 rounded-xl text-xs font-semibold border ${statusCls(sub.status)}`}>
              {getSubscriptionStatusString(sub.status ?? 0)}
            </span>
            <span className={`px-3 py-1 rounded-xl text-xs font-semibold ${daysCls(days)}`}>
              {days} days left
            </span>
          </div>
          <div className="space-y-3">
            <Row label="Customer" value={sub.customer?.companyName || 'N/A'} />
            <Row label="Product" value={sub.productVariant?.variantName || 'N/A'} />
            <Row label="Auto-Renew" value={sub.autoRenew ? 'Yes' : 'No'} />
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Dates</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Start Date</span>
              <span className="font-semibold text-gray-900">{formatDate(sub.startDate)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Renewal Date</span>
              <span className="font-semibold text-gray-900">{formatDate(sub.renewalDate)}</span>
            </div>
          </div>
          <div className="bg-indigo-50 rounded-2xl p-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Annual Fee</p>
            <p className="text-2xl font-bold text-indigo-700">{formatCurrency(sub.annualFee)}</p>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm py-1 border-b border-gray-50">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

const STATUS_FILTERS = ['All', 'Active', 'Expired', 'Cancelled', 'Suspended'];

export default function SubscriptionsPage() {
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['subscriptions', statusFilter],
    queryFn: () => statusFilter ? subscriptionsApi.getAll(statusFilter) : subscriptionsApi.getAll(),
    refetchInterval: 5000,
  });

  const { data: upcomingRenewals = [] } = useQuery({
    queryKey: ['upcoming-renewals'],
    queryFn: () => subscriptionsApi.getUpcomingRenewals(30),
    refetchInterval: 5000,
  });

  const stats = useMemo(() => ({
    totalRevenue: subscriptions.reduce((sum, s) => sum + (s.annualFee || 0), 0),
    activeCount: subscriptions.filter(s => getSubscriptionStatusString(s.status ?? 0) === 'Active').length,
    renewalCount: upcomingRenewals.length,
    churnRisk: subscriptions.filter(s => !s.autoRenew).length,
  }), [subscriptions, upcomingRenewals]);

  return (
    <div className="bg-gray-50 min-h-screen p-6 lg:p-8">
      {selectedSub && <DetailPanel sub={selectedSub} onClose={() => setSelectedSub(null)} />}
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Subscriptions</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage active subscriptions and renewal tracking</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Annual Revenue', value: formatCurrency(stats.totalRevenue), icon: TrendingUp, accent: 'bg-indigo-50 text-indigo-600' },
            { label: 'Active', value: stats.activeCount, icon: CheckCircle, accent: 'bg-emerald-50 text-emerald-600' },
            { label: 'Upcoming Renewals', value: stats.renewalCount, icon: Clock, accent: 'bg-amber-50 text-amber-600' },
            { label: 'Churn Risk', value: stats.churnRisk, icon: AlertCircle, accent: 'bg-red-50 text-red-600' },
          ].map(({ label, value, icon: Icon, accent }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s === 'All' ? '' : s)}
              className={`px-4 py-2 text-sm font-semibold rounded-xl border transition-colors ${(s === 'All' ? statusFilter === '' : statusFilter === s) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Subscription', 'Customer', 'Product', 'Status', 'Start Date', 'Renewal', 'Days Left', 'Annual Fee', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr><td colSpan={9} className="py-12 text-center text-sm text-gray-400">Loading...</td></tr>
                ) : subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <Zap className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No subscriptions found</p>
                    </td>
                  </tr>
                ) : subscriptions.map((sub) => {
                  const days = getDaysUntilRenewal(sub.renewalDate);
                  return (
                    <tr key={sub.subscriptionId} className="group hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">{sub.subscriptionNumber}</td>
                      <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">{sub.customer?.companyName || 'N/A'}</td>
                      <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">{sub.productVariant?.variantName || 'N/A'}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-semibold border ${statusCls(sub.status)}`}>
                          {getSubscriptionStatusString(sub.status ?? 0)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(sub.startDate)}</td>
                      <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(sub.renewalDate)}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-semibold ${daysCls(days)}`}>{days}d</span>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(sub.annualFee)}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedSub(sub)}
                          className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Renewals */}
        {upcomingRenewals.length > 0 && (
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-gray-900">Upcoming Renewals — Next 30 Days</h2>
              <span className="ml-auto text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">{upcomingRenewals.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {upcomingRenewals.slice(0, 6).map((sub) => (
                <div key={sub.subscriptionId} className="border border-amber-100 rounded-xl p-4 hover:bg-amber-50/50 transition-colors cursor-pointer" onClick={() => setSelectedSub(sub)}>
                  <p className="text-sm font-semibold text-gray-900">{sub.customer?.companyName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{sub.subscriptionNumber}</p>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-gray-400">{formatDate(sub.renewalDate)}</p>
                    <p className="text-sm font-bold text-indigo-600">{formatCurrency(sub.annualFee)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
