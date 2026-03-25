import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { subscriptionsApi } from '@/services';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getSubscriptionStatusString } from '@/lib/enum-mappings';
import { Calendar, CheckCircle, AlertCircle, TrendingUp, Clock, Zap, X, RefreshCw, Pause, Play, XCircle, History } from 'lucide-react';
import type { Subscription, SubscriptionHistory } from '@/types';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/PaginationControls';

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

function changeTypeColor(type: string) {
  switch (type) {
    case 'Created': return 'bg-emerald-500';
    case 'Renewed': return 'bg-blue-500';
    case 'Cancelled': return 'bg-red-500';
    case 'Suspended': return 'bg-amber-500';
    case 'Reactivated': return 'bg-green-500';
    case 'Expired': return 'bg-gray-500';
    case 'VariantChanged': return 'bg-purple-500';
    default: return 'bg-gray-400';
  }
}

// Confirmation Modal Component
function ConfirmModal({
  title,
  message,
  confirmLabel,
  confirmColor = 'bg-red-600 hover:bg-red-700',
  onClose,
  onConfirm,
  isLoading,
  children,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor?: string;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-2">{message}</p>
        {children}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-xl disabled:opacity-50 ${confirmColor}`}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}

// History Panel Component
function HistoryPanel({ sub, onClose }: { sub: Subscription; onClose: () => void }) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['subscription-history', sub.subscriptionId],
    queryFn: () => subscriptionsApi.getHistory(sub.subscriptionId),
  });

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Subscription History</h2>
            <p className="text-xs text-gray-400 mt-0.5">{sub.subscriptionNumber}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <p className="text-sm text-gray-400">Loading history...</p>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No history entries found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry: SubscriptionHistory) => (
                <div key={entry.historyId} className="flex gap-4">
                  <div className="flex-shrink-0 relative">
                    <div className={`w-3 h-3 rounded-full mt-1.5 ${changeTypeColor(entry.changeType as string)}`} />
                    <div className="absolute top-4 left-1.5 w-px h-full bg-gray-200 -z-10" />
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">{entry.changeType}</p>
                      <p className="text-xs text-gray-400">{formatDate(entry.changedAt)}</p>
                    </div>
                    {entry.description && (
                      <p className="text-xs text-gray-500 mt-1">{entry.description}</p>
                    )}
                    {entry.relatedOrderNumber && (
                      <p className="text-xs text-indigo-600 mt-1">Order: {entry.relatedOrderNumber}</p>
                    )}
                    {(entry.oldValue || entry.newValue) && (
                      <div className="text-xs text-gray-400 mt-1">
                        {entry.oldValue && <span>From: {entry.oldValue}</span>}
                        {entry.oldValue && entry.newValue && <span> → </span>}
                        {entry.newValue && <span>To: {entry.newValue}</span>}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">By: {entry.changedByUserName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Detail Panel Component
function DetailPanel({
  sub,
  onClose,
  onRenew,
  onSuspend,
  onReactivate,
  onCancel,
  onViewHistory,
}: {
  sub: Subscription;
  onClose: () => void;
  onRenew: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
  onCancel: () => void;
  onViewHistory: () => void;
}) {
  const days = getDaysUntilRenewal(sub.renewalDate);
  const statusStr = getSubscriptionStatusString(sub.status ?? 0);

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
              {statusStr}
            </span>
            <span className={`px-3 py-1 rounded-xl text-xs font-semibold ${daysCls(days)}`}>
              {days} days left
            </span>
          </div>
          <div className="space-y-3">
            <Row label="Customer" value={sub.customer?.companyName || 'N/A'} />
            <Row label="Product" value={sub.productVariant?.variantName || 'N/A'} />
            <Row label="Auto-Renew" value={sub.autoRenew ? 'Yes' : 'No'} />
            <Row label="Renewal Count" value={String(sub.renewalCount || 0)} />
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Dates</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Start Date</span>
              <span className="font-semibold text-gray-900">{formatDate(sub.startDate)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Current Period End</span>
              <span className="font-semibold text-gray-900">{formatDate(sub.currentPeriodEnd)}</span>
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

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Actions</p>

            {/* Renew button - for Active or Expired */}
            {(statusStr === 'Active' || statusStr === 'Expired') && (
              <button
                onClick={onRenew}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Renew Subscription
              </button>
            )}

            {/* Suspend button - only for Active */}
            {statusStr === 'Active' && (
              <button
                onClick={onSuspend}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Pause className="w-4 h-4" />
                Suspend Subscription
              </button>
            )}

            {/* Reactivate button - only for Suspended */}
            {statusStr === 'Suspended' && (
              <button
                onClick={onReactivate}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Play className="w-4 h-4" />
                Reactivate Subscription
              </button>
            )}

            {/* Cancel button - for Active or Suspended */}
            {(statusStr === 'Active' || statusStr === 'Suspended') && (
              <button
                onClick={onCancel}
                className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Cancel Subscription
              </button>
            )}

            {/* View History button */}
            <button
              onClick={onViewHistory}
              className="w-full py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <History className="w-4 h-4" />
              View History
            </button>
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [showHistory, setShowHistory] = useState<Subscription | null>(null);
  const [cancelModal, setCancelModal] = useState<Subscription | null>(null);
  const [suspendModal, setSuspendModal] = useState<Subscription | null>(null);
  const [reactivateModal, setReactivateModal] = useState<Subscription | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [suspendReason, setSuspendReason] = useState('');

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

  const cancelMutation = useMutation({
    mutationFn: (params: { id: number; reason: string }) =>
      subscriptionsApi.cancel(params.id, { cancellationReason: params.reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setCancelModal(null);
      setSelectedSub(null);
      setCancelReason('');
    },
  });

  const suspendMutation = useMutation({
    mutationFn: (params: { id: number; reason: string }) =>
      subscriptionsApi.suspend(params.id, { suspensionReason: params.reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setSuspendModal(null);
      setSelectedSub(null);
      setSuspendReason('');
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: number) => subscriptionsApi.reactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setReactivateModal(null);
      setSelectedSub(null);
    },
  });

  const stats = useMemo(() => ({
    totalRevenue: subscriptions.reduce((sum, s) => sum + (s.annualFee || 0), 0),
    activeCount: subscriptions.filter(s => getSubscriptionStatusString(s.status ?? 0) === 'Active').length,
    renewalCount: upcomingRenewals.length,
    churnRisk: subscriptions.filter(s => !s.autoRenew).length,
  }), [subscriptions, upcomingRenewals]);

  const pagination = usePagination(subscriptions, 10);

  const handleRenew = (sub: Subscription) => {
    setSelectedSub(null);
    navigate('/dashboard/orders', {
      state: {
        renewalMode: true,
        subscriptionId: sub.subscriptionId,
      },
    });
  };

  const handleCancel = (sub: Subscription) => {
    setSelectedSub(null);
    setCancelModal(sub);
  };

  const handleSuspend = (sub: Subscription) => {
    setSelectedSub(null);
    setSuspendModal(sub);
  };

  const handleReactivate = (sub: Subscription) => {
    setSelectedSub(null);
    setReactivateModal(sub);
  };

  const handleViewHistory = (sub: Subscription) => {
    setSelectedSub(null);
    setShowHistory(sub);
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6 lg:p-8">
      {/* Detail Panel */}
      {selectedSub && (
        <DetailPanel
          sub={selectedSub}
          onClose={() => setSelectedSub(null)}
          onRenew={() => handleRenew(selectedSub)}
          onSuspend={() => handleSuspend(selectedSub)}
          onReactivate={() => handleReactivate(selectedSub)}
          onCancel={() => handleCancel(selectedSub)}
          onViewHistory={() => handleViewHistory(selectedSub)}
        />
      )}

      {/* History Panel */}
      {showHistory && <HistoryPanel sub={showHistory} onClose={() => setShowHistory(null)} />}

      {/* Cancel Modal */}
      {cancelModal && (
        <ConfirmModal
          title="Cancel Subscription"
          message={`Are you sure you want to cancel ${cancelModal.subscriptionNumber}? This action cannot be undone.`}
          confirmLabel="Confirm Cancellation"
          onClose={() => { setCancelModal(null); setCancelReason(''); }}
          onConfirm={() => cancelMutation.mutate({ id: cancelModal.subscriptionId, reason: cancelReason })}
          isLoading={cancelMutation.isPending}
        >
          <div className="mt-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
              Cancellation Reason *
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Please provide a reason for cancellation..."
            />
          </div>
        </ConfirmModal>
      )}

      {/* Suspend Modal */}
      {suspendModal && (
        <ConfirmModal
          title="Suspend Subscription"
          message={`Are you sure you want to suspend ${suspendModal.subscriptionNumber}?`}
          confirmLabel="Confirm Suspension"
          confirmColor="bg-amber-500 hover:bg-amber-600"
          onClose={() => { setSuspendModal(null); setSuspendReason(''); }}
          onConfirm={() => suspendMutation.mutate({ id: suspendModal.subscriptionId, reason: suspendReason })}
          isLoading={suspendMutation.isPending}
        >
          <div className="mt-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
              Suspension Reason *
            </label>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Please provide a reason for suspension..."
            />
          </div>
        </ConfirmModal>
      )}

      {/* Reactivate Modal */}
      {reactivateModal && (
        <ConfirmModal
          title="Reactivate Subscription"
          message={`Are you sure you want to reactivate ${reactivateModal.subscriptionNumber}? This will resume the subscription.`}
          confirmLabel="Confirm Reactivation"
          confirmColor="bg-blue-600 hover:bg-blue-700"
          onClose={() => setReactivateModal(null)}
          onConfirm={() => reactivateMutation.mutate(reactivateModal.subscriptionId)}
          isLoading={reactivateMutation.isPending}
        />
      )}

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
                ) : pagination.paginatedItems.map((sub) => {
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
                          className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 rounded-lg shadow-sm transition-all"
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

          {/* Pagination */}
          {subscriptions.length > 0 && (
            <div className="px-5 py-4 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between flex-col sm:flex-row gap-4">
              <p className="text-sm text-gray-500">
                Showing <span className="font-semibold">{(pagination.currentPage - 1) * pagination.itemsPerPage + 1}</span> to <span className="font-semibold">{Math.min(pagination.currentPage * pagination.itemsPerPage, subscriptions.length)}</span> of <span className="font-semibold">{subscriptions.length}</span> subscriptions
              </p>
              <PaginationControls
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                itemsPerPage={pagination.itemsPerPage}
                totalItems={subscriptions.length}
                onPageChange={pagination.goToPage}
                onItemsPerPageChange={pagination.setItemsPerPage}
                pageNumbers={pagination.pageNumbers}
                hasNextPage={pagination.currentPage < pagination.totalPages}
                hasPreviousPage={pagination.currentPage > 1}
              />
            </div>
          )}
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
