import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/services';
import { formatDate } from '@/lib/utils';
import { Bell, CheckCircle, AlertCircle, Info, BellOff } from 'lucide-react';
import type { Notification } from '@/types';

function NotifIcon({ type }: { type: string }) {
  switch (type) {
    case 'LeadAssigned': case 'LeadUpdated': return <Info className="w-4 h-4 text-blue-500" />;
    case 'LeadConverted': case 'CustomerConverted': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    case 'LeadLost': return <AlertCircle className="w-4 h-4 text-red-500" />;
    case 'OrderCreated': case 'OrderConfirmed': return <Bell className="w-4 h-4 text-violet-500" />;
    default: return <Bell className="w-4 h-4 text-gray-400" />;
  }
}

const TYPE_LABELS: Record<string, string> = {
  LeadAssigned: 'Lead Assigned', LeadUpdated: 'Lead Updated', LeadConverted: 'Lead Converted',
  LeadLost: 'Lead Lost', CustomerConverted: 'Customer Converted', OrderCreated: 'Order Created',
  OrderConfirmed: 'Order Confirmed', SubscriptionCreated: 'Subscription Created', SubscriptionRenewal: 'Renewal',
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', showUnreadOnly],
    queryFn: () => notificationsApi.getAll(showUnreadOnly),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <div className="bg-gray-50 min-h-screen p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notifications</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={`px-4 py-2 text-sm font-semibold rounded-xl border transition-colors ${showUnreadOnly ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'}`}
            >
              {showUnreadOnly ? 'Show All' : 'Unread Only'}
            </button>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Mark All Read
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-48 text-sm text-gray-400">Loading...</div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                <BellOff className="w-5 h-5 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {notifications.map((n: Notification) => (
                <div
                  key={n.notificationId}
                  onClick={() => !n.isRead && markAsReadMutation.mutate(n.notificationId)}
                  className={`flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50/70 transition-colors ${!n.isRead ? 'bg-indigo-50/30' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${!n.isRead ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                    <NotifIcon type={n.notificationType} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{n.title}</p>
                      <span className="text-[11px] text-gray-400 flex-shrink-0">{formatDate(n.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{TYPE_LABELS[n.notificationType] || n.notificationType}</span>
                      {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
