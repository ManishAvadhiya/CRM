import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '@/services';
import { Bell, X, Check, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import type { Notification } from '@/types';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll(false),
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'OrderCreated':
      case 'OrderConfirmed':
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case 'LeadAssigned':
      case 'LeadStatusChanged':
        return <Info className="w-5 h-5 text-purple-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'OrderCreated':
      case 'OrderConfirmed':
        return 'border-l-4 border-blue-500 bg-blue-50';
      case 'LeadAssigned':
      case 'LeadStatusChanged':
        return 'border-l-4 border-purple-500 bg-purple-50';
      case 'Error':
        return 'border-l-4 border-red-500 bg-red-50';
      default:
        return 'border-l-4 border-gray-300 bg-gray-50';
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
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Notification Drawer */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 max-h-96 bg-white border border-slate-200 rounded-lg shadow-xl z-50 flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white">
            <h3 className="font-semibold text-slate-900">Notifications</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-slate-500">
                <div className="text-center">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No notifications</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.notificationId}
                    className={`p-3 hover:bg-slate-50 transition-colors ${getNotificationColor(notification.notificationType)}`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.notificationType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">
                          {notification.title}
                        </p>
                        <p className="text-sm text-slate-600 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {/* {displayNotifications.length > 0 && (
            <div className="p-3 border-t border-slate-200 bg-slate-50">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-slate-600"
                onClick={() => {
                  // Mark all as read
                  setIsOpen(false);
                }}
              >
                <Check className="w-3 h-3 mr-1" />
                Mark all as read
              </Button>
            </div>
          )} */}
        </div>
      )}
    </div>
  );
}
