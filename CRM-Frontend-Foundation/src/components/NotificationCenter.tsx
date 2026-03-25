import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '@/services';
import { Bell, X, Package, Users, FileText, CreditCard, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import type { Notification } from '@/types';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll(true), // Only unread
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => notificationsApi.getCount(),
    refetchInterval: 5000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
      setIsOpen(false);
    },
  });

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read (will also delete from backend)
    await markAsReadMutation.mutateAsync(notification.notificationId);

    // Navigate to related page
    if (notification.relatedToType && notification.relatedToId) {
      switch (notification.relatedToType) {
        case 'Lead':
          navigate('/dashboard/leads');
          break;
        case 'Customer':
          navigate('/dashboard/customers');
          break;
        case 'Order':
          navigate('/dashboard/orders');
          break;
        case 'Subscription':
          navigate('/dashboard/subscriptions');
          break;
        default:
          break;
      }
    }

    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'OrderCreated':
      case 'OrderConfirmed':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'PaymentReceived':
        return <CreditCard className="w-5 h-5 text-green-500" />;
      case 'LeadAssigned':
      case 'LeadConverted':
        return <Users className="w-5 h-5 text-purple-500" />;
      case 'FollowUpDue':
        return <Calendar className="w-5 h-5 text-orange-500" />;
      case 'SubscriptionRenewalDue':
      case 'SubscriptionExpired':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'SubscriptionCreated':
      case 'SubscriptionRenewed':
      case 'SubscriptionReactivated':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'SubscriptionCancelled':
      case 'SubscriptionSuspended':
        return <Clock className="w-5 h-5 text-amber-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'OrderCreated':
      case 'OrderConfirmed':
        return 'border-l-4 border-blue-500 bg-blue-50 hover:bg-blue-100';
      case 'PaymentReceived':
        return 'border-l-4 border-green-500 bg-green-50 hover:bg-green-100';
      case 'LeadAssigned':
      case 'LeadConverted':
        return 'border-l-4 border-purple-500 bg-purple-50 hover:bg-purple-100';
      case 'FollowUpDue':
        return 'border-l-4 border-orange-500 bg-orange-50 hover:bg-orange-100';
      case 'SubscriptionRenewalDue':
      case 'SubscriptionExpired':
        return 'border-l-4 border-red-500 bg-red-50 hover:bg-red-100';
      case 'SubscriptionCreated':
      case 'SubscriptionRenewed':
      case 'SubscriptionReactivated':
        return 'border-l-4 border-green-500 bg-green-50 hover:bg-green-100';
      case 'SubscriptionCancelled':
      case 'SubscriptionSuspended':
        return 'border-l-4 border-amber-500 bg-amber-50 hover:bg-amber-100';
      default:
        return 'border-l-4 border-gray-300 bg-gray-50 hover:bg-gray-100';
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative hover:bg-slate-100 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Notification Drawer */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 max-h-[32rem] bg-white border border-slate-200 rounded-lg shadow-xl z-50 flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                >
                  Clear all
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-slate-500">
                <div className="text-center">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No new notifications</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.notificationId}
                    className={`p-3 transition-colors cursor-pointer ${getNotificationColor(notification.notificationType)}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.notificationType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {notification.title}
                        </p>
                        <p className="text-sm text-slate-600 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

