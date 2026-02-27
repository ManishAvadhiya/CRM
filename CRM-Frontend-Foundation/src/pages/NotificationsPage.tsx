import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { Bell, CheckCircle, AlertCircle, Info } from 'lucide-react';
import type { Notification } from '@/types';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', showUnreadOnly],
    queryFn: () => notificationsApi.getAll(showUnreadOnly),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleMarkAsRead = (notification: Notification) => {
    setSelectedNotification(notification);
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.notificationId);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'LeadAssigned':
      case 'LeadUpdated':
        return <Info className="w-5 h-5 text-blue-600" />;
      case 'LeadConverted':
      case 'CustomerConverted':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'LeadLost':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'OrderCreated':
      case 'OrderConfirmed':
        return <Bell className="w-5 h-5 text-purple-600" />;
      case 'SubscriptionCreated':
      case 'SubscriptionRenewal':
        return <CheckCircle className="w-5 h-5 text-cyan-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationStyles = (type: string, isRead: boolean) => {
    if (isRead) {
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        badge: 'bg-gray-100 text-gray-700',
      };
    }

    switch (type) {
      case 'LeadAssigned':
      case 'LeadUpdated':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          badge: 'bg-blue-100 text-blue-800',
        };
      case 'LeadConverted':
      case 'CustomerConverted':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          badge: 'bg-green-100 text-green-800',
        };
      case 'LeadLost':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          badge: 'bg-red-100 text-red-800',
        };
      case 'OrderCreated':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          badge: 'bg-purple-100 text-purple-800',
        };
      case 'OrderConfirmed':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          badge: 'bg-emerald-100 text-emerald-800',
        };
      case 'SubscriptionCreated':
      case 'SubscriptionRenewal':
        return {
          bg: 'bg-cyan-50',
          border: 'border-cyan-200',
          badge: 'bg-cyan-100 text-cyan-800',
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          badge: 'bg-gray-100 text-gray-700',
        };
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'LeadAssigned': '📝 Lead Assigned',
      'LeadUpdated': '✏️ Lead Updated',
      'LeadConverted': '✅ Lead Converted',
      'LeadLost': '❌ Lead Lost',
      'CustomerConverted': '🎉 Customer Converted',
      'OrderCreated': '📦 Order Created',
      'OrderConfirmed': '✔️ Order Confirmed',
      'SubscriptionCreated': '🔄 Subscription Created',
      'SubscriptionRenewal': '📅 Subscription Renewal',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return <div className="p-8 flex items-center justify-center min-h-[500px]">
      <div className="text-center">
        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-muted-foreground">Loading notifications...</p>
      </div>
    </div>;
  }

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? (
              <span>
                You have <span className="font-semibold text-slate-900">{unreadCount}</span> unread notification{unreadCount !== 1 ? 's' : ''}
              </span>
            ) : (
              'All caught up!'
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showUnreadOnly ? 'default' : 'outline'}
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className={showUnreadOnly ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600' : ''}
          >
            {showUnreadOnly ? '👁️ All Notifications' : '⭐ Unread Only'}
          </Button>
          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllAsRead}
              variant="outline"
              className="hover:bg-slate-100"
            >
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {notifications && notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const styles = getNotificationStyles(notification.notificationType, notification.isRead);
            return (
              <Card
                key={notification.notificationId}
                className={`border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${styles.border} ${styles.bg}`}
                onClick={() => handleMarkAsRead(notification)}
              >
                <CardContent className="pt-6 pb-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 pt-1">
                      {getNotificationIcon(notification.notificationType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 text-base mb-1">
                            {notification.title}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex-shrink-0 flex flex-col gap-2 items-end">
                          {!notification.isRead && (
                            <Badge className={`${styles.badge} font-semibold`}>
                              New
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-3 mt-3 text-xs text-slate-500 flex-wrap">
                        <span className="font-medium">{getNotificationTypeLabel(notification.notificationType)}</span>
                        <span className="flex items-center gap-1">
                          🕐 {formatDate(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed border-2">
          <CardContent className="pt-12 pb-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No notifications</h3>
            <p className="text-muted-foreground">
              {showUnreadOnly 
                ? 'You have no unread notifications. Great work! 🎉'
                : 'All notifications will appear here. Stay tuned! 👀'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
