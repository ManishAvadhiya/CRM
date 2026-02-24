import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subscriptionsApi } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Subscription } from '@/types';

export default function SubscriptionsPage() {
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showRenewals, setShowRenewals] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  // Enum mappings for backend numeric enums
  const subscriptionStatusMap: Record<number, string> = {
    0: 'Active',
    1: 'Expired',
    2: 'Cancelled',
    3: 'Suspended',
    4: 'PendingRenewal',
  };

  const getSubscriptionStatusDisplay = (value: any) => subscriptionStatusMap[Number(value)] || 'Unknown';

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['subscriptions', statusFilter],
    queryFn: () => subscriptionsApi.getAll(statusFilter),
  });

  const { data: upcomingRenewals, isLoading: renewalsLoading } = useQuery({
    queryKey: ['upcoming-renewals'],
    queryFn: () => subscriptionsApi.getUpcomingRenewals(30),
  });

  const handleViewDetail = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setIsDetailOpen(true);
  };

  const getDaysUntilRenewal = (renewalDate: string): number => {
    const renewal = new Date(renewalDate);
    const today = new Date();
    const diffTime = renewal.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return <div className="p-8">Loading subscriptions...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground">Manage active subscriptions</p>
        </div>
        {(upcomingRenewals?.length || 0) > 0 && (
          <Button
            onClick={() => setShowRenewals(!showRenewals)}
            className="bg-orange-500 hover:bg-orange-600"
          >
            📅 {upcomingRenewals?.length} Renewals in 30 Days
          </Button>
        )}
      </div>

      {showRenewals && upcomingRenewals && upcomingRenewals.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-orange-900 mb-3">
            ⚠️ Upcoming Renewals (Next 30 Days)
          </h3>
          <div className="space-y-2">
            {upcomingRenewals.map((sub) => (
              <div
                key={sub.subscriptionId}
                className="flex justify-between items-center bg-white p-2 rounded"
              >
                <div>
                  <p className="font-medium">{sub.subscriptionNumber}</p>
                  <p className="text-sm text-gray-600">{sub.customer?.companyName}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {getDaysUntilRenewal(sub.renewalDate)} days
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDate(sub.renewalDate)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant={statusFilter === undefined ? 'default' : 'outline'}
          onClick={() => setStatusFilter(undefined)}
        >
          All
        </Button>
        {['Active', 'Expired', 'Cancelled'].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            onClick={() => setStatusFilter(status)}
          >
            {status}
          </Button>
        ))}
      </div>

      <div className="grid gap-4">
        {subscriptions?.map((subscription) => {
          const daysUntilRenewal = getDaysUntilRenewal(subscription.renewalDate);
          const isRenewalSoon = daysUntilRenewal <= 30 && daysUntilRenewal > 0;

          return (
            <Card
              key={subscription.subscriptionId}
              className={isRenewalSoon ? 'border-orange-300 bg-orange-50' : ''}
            >
              <CardHeader className="flex flex-row justify-between items-start">
                <div>
                  <CardTitle>{subscription.subscriptionNumber}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {subscription.customer?.companyName}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 text-xs rounded-full font-semibold ${
                    subscription.status === 'Active'
                      ? 'bg-green-100 text-green-800'
                      : subscription.status === 'Expired'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {getSubscriptionStatusDisplay(subscription.status)}
                  </span>
                  {isRenewalSoon && (
                    <p className="text-xs text-orange-700 font-semibold mt-1">
                      ⚠️ Renewal in {daysUntilRenewal} days
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-muted-foreground">Annual Fee: </span>
                    <span className="font-semibold">
                      {formatCurrency(subscription.annualFee)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Renewal Date: </span>
                    {formatDate(subscription.renewalDate)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Start Date: </span>
                    {formatDate(subscription.startDate)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Auto Renew: </span>
                    {subscription.autoRenew ? '✓ Yes' : '✗ No'}
                  </div>
                </div>
                <Dialog open={isDetailOpen && selectedSubscription?.subscriptionId === subscription.subscriptionId} onOpenChange={setIsDetailOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetail(subscription)}
                    >
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Subscription Details</DialogTitle>
                    </DialogHeader>
                    {selectedSubscription && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-semibold">Subscription #:</span>
                            <p>{selectedSubscription.subscriptionNumber}</p>
                          </div>
                          <div>
                            <span className="font-semibold">Status:</span>
                            <p>{getSubscriptionStatusDisplay(selectedSubscription.status)}</p>
                          </div>
                          <div>
                            <span className="font-semibold">Customer:</span>
                            <p>{selectedSubscription.customer?.companyName}</p>
                          </div>
                          <div>
                            <span className="font-semibold">Product:</span>
                            <p>{selectedSubscription.productVariant?.variantName}</p>
                          </div>
                          <div>
                            <span className="font-semibold">Annual Fee:</span>
                            <p className="font-bold">
                              {formatCurrency(selectedSubscription.annualFee)}
                            </p>
                          </div>
                          <div>
                            <span className="font-semibold">Start Date:</span>
                            <p>{formatDate(selectedSubscription.startDate)}</p>
                          </div>
                          <div>
                            <span className="font-semibold">Current Period:</span>
                            <p>
                              {formatDate(selectedSubscription.currentPeriodStart)} to{' '}
                              {formatDate(selectedSubscription.currentPeriodEnd)}
                            </p>
                          </div>
                          <div>
                            <span className="font-semibold">Renewal Date:</span>
                            <p>{formatDate(selectedSubscription.renewalDate)}</p>
                          </div>
                          <div>
                            <span className="font-semibold">Auto Renew:</span>
                            <p>{selectedSubscription.autoRenew ? '✓ Yes' : '✗ No'}</p>
                          </div>
                          {selectedSubscription.order && (
                            <div>
                              <span className="font-semibold">Related Order:</span>
                              <p>{selectedSubscription.order.orderNumber}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
