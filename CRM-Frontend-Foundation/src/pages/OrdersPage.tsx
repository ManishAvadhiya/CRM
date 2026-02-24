import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi, customersApi, productVariantsApi } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Order, Customer, ProductVariant } from '@/types';

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Order>>({});

  // Enum mappings for backend numeric enums
  const orderStatusMap: Record<number, string> = {
    0: 'Draft',
    1: 'Pending',
    2: 'Confirmed',
    3: 'Delivered',
    4: 'Cancelled',
  };

  const paymentStatusMap: Record<number, string> = {
    0: 'Pending',
    1: 'Partial',
    2: 'Paid',
  };

  const getOrderStatusDisplay = (value: any) => orderStatusMap[Number(value)] || 'Unknown';
  const getPaymentStatusDisplay = (value: any) => paymentStatusMap[Number(value)] || 'Unknown';

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: ordersApi.getAll,
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: customersApi.getAll,
  });

  const { data: variants } = useQuery({
    queryKey: ['product-variants'],
    queryFn: () => productVariantsApi.getAll(true),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Order>) => ordersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setIsCreateOpen(false);
      setFormData({});
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (id: number) => ordersApi.confirm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setSelectedOrder(null);
      setIsDetailOpen(false);
    },
  });

  const handleCreate = () => {
    if (!formData.customerId || !formData.variantId || !formData.quantity) {
      alert('Please fill in all required fields');
      return;
    }
    createMutation.mutate({
      ...formData,
      quantity: Number(formData.quantity),
    });
  };

  const handleConfirm = (id: number) => {
    if (confirm('Confirm this order? This will create a subscription automatically.')) {
      confirmMutation.mutate(id);
    }
  };

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  if (isLoading) {
    return <div className="p-8">Loading orders...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage sales orders</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>+ Create Order</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <select
                value={formData.customerId || ''}
                onChange={(e) =>
                  setFormData({ ...formData, customerId: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Customer</option>
                {customers?.map((c) => (
                  <option key={c.customerId} value={c.customerId}>
                    {c.companyName}
                  </option>
                ))}
              </select>

              <select
                value={formData.variantId || ''}
                onChange={(e) =>
                  setFormData({ ...formData, variantId: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Product Variant</option>
                {variants?.map((v) => (
                  <option key={v.variantId} value={v.variantId}>
                    {v.variantName} - {formatCurrency(v.basePriceSingleUser)}
                  </option>
                ))}
              </select>

              <select
                value={formData.userLicenseType || 'SingleUser'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    userLicenseType: e.target.value as Order['userLicenseType'],
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="SingleUser">Single User</option>
                <option value="MultiUser">Multi User</option>
              </select>

              <input
                type="number"
                placeholder="Quantity"
                min="1"
                value={formData.quantity || 1}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />

              <input
                type="number"
                placeholder="Discount %"
                min="0"
                max="100"
                value={formData.discountPercent || 0}
                onChange={(e) =>
                  setFormData({ ...formData, discountPercent: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />

              <input
                type="number"
                placeholder="Tax %"
                min="0"
                max="100"
                value={formData.taxPercent || 0}
                onChange={(e) =>
                  setFormData({ ...formData, taxPercent: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />

              <textarea
                placeholder="Notes"
                value={formData.notes || ''}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
              />

              <Button onClick={handleCreate} className="w-full">
                Create Order
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {orders?.map((order) => (
          <Card key={order.orderId}>
            <CardHeader className="flex flex-row justify-between items-start">
              <div>
                <CardTitle>{order.orderNumber}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {order.customer?.companyName}
                </p>
              </div>
              <span className={`px-3 py-1 text-xs rounded-full font-semibold ${
                order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                order.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {getOrderStatusDisplay(order.status)}
              </span>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="text-muted-foreground">Amount: </span>
                  <span className="font-semibold">{formatCurrency(order.totalAmount)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Product: </span>
                  {order.productVariant?.variantName}
                </div>
                <div>
                  <span className="text-muted-foreground">Quantity: </span>
                  {order.quantity}
                </div>
                <div>
                  <span className="text-muted-foreground">Date: </span>
                  {formatDate(order.orderDate)}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Dialog open={isDetailOpen && selectedOrder?.orderId === order.orderId} onOpenChange={setIsDetailOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetail(order)}
                    >
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Order Details</DialogTitle>
                    </DialogHeader>
                    {selectedOrder && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-semibold">Order #:</span>
                            <p>{selectedOrder.orderNumber}</p>
                          </div>
                          <div>
                            <span className="font-semibold">Status:</span>
                            <p>{getOrderStatusDisplay(selectedOrder.status)}</p>
                          </div>
                          <div>
                            <span className="font-semibold">Customer:</span>
                            <p>{selectedOrder.customer?.companyName}</p>
                          </div>
                          <div>
                            <span className="font-semibold">Product:</span>
                            <p>{selectedOrder.productVariant?.variantName}</p>
                          </div>
                          <div>
                            <span className="font-semibold">Base Amount:</span>
                            <p>{formatCurrency(selectedOrder.baseAmount)}</p>
                          </div>
                          <div>
                            <span className="font-semibold">Discount:</span>
                            <p>-{formatCurrency(selectedOrder.discountAmount)}</p>
                          </div>
                          <div>
                            <span className="font-semibold">Tax:</span>
                            <p>{formatCurrency(selectedOrder.taxAmount)}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-lg">Total:</span>
                            <p className="font-bold text-lg">
                              {formatCurrency(selectedOrder.totalAmount)}
                            </p>
                          </div>
                        </div>
                        {selectedOrder.notes && (
                          <div>
                            <span className="font-semibold">Notes:</span>
                            <p className="text-sm">{selectedOrder.notes}</p>
                          </div>
                        )}
                        {selectedOrder.status !== 'Confirmed' &&
                          selectedOrder.status !== 'Delivered' && (
                            <Button
                              onClick={() => handleConfirm(selectedOrder.orderId)}
                              className="w-full"
                            >
                              Confirm Order
                            </Button>
                          )}
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
