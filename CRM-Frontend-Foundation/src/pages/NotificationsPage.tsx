import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import type { Notification } from '@/types';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

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

  const handleMarkAsRead = (id: number, isRead: boolean) => {
    if (!isRead) {
      markAsReadMutation.mutate(id);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const getNotificationIcon = (notification: Notification) => {
    switch (notification.notificationType) {
      case 'LeadAssigned':
        return '📝';
      case 'LeadConverted':
        return '✅';
      case 'OrderCreated':
        return '📦';
      case 'OrderConfirmed':
        return '✔️';
      case 'SubscriptionCreated':
        return '🔄';
    //   case 'SubscriptionRenewal':
    //     return '📅';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (notification: Notification) => {
    switch (notification.notificationType) {
      case 'LeadAssigned':
        return 'bg-blue-50 border-blue-200';
      case 'LeadConverted':
        return 'bg-green-50 border-green-200';
      case 'OrderCreated':
        return 'bg-purple-50 border-purple-200';
      case 'OrderConfirmed':
        return 'bg-emerald-50 border-emerald-200';
      case 'SubscriptionCreated':
        return 'bg-cyan-50 border-cyan-200';
    //   case 'SubscriptionRenewal':
    //     return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading notifications...</div>;
  }

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showUnreadOnly ? 'default' : 'outline'}
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
          >
            {showUnreadOnly ? 'Show All' : 'Unread Only'}
          </Button>
          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllAsRead}
              variant="outline"
            >
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {notifications && notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.notificationId}
              className={`border rounded-lg p-4 cursor-pointer transition hover:shadow-md ${
                !notification.isRead ? getNotificationColor(notification) : 'bg-gray-50 border-gray-200'
              }`}
              onClick={() => handleMarkAsRead(notification.notificationId, notification.isRead)}
            >
              <div className="flex gap-4">
                <div className="text-2xl flex-shrink-0">
                  {getNotificationIcon(notification)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-semibold">{notification.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <Badge className="flex-shrink-0">Unread</Badge>
                    )}
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                    <span>{formatDate(notification.createdAt)}</span>
                    <span className="capitalize">{notification.notificationType}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                {showUnreadOnly ? 'No unread notifications' : 'No notifications'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
