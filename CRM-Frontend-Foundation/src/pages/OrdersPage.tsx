import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi, customersApi, productVariantsApi } from '@/services';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  UserLicenseTypeEnum,
  PaymentStatusMap,
  getOrderStatusString,
  getUserLicenseTypeString,
} from '@/lib/enum-mappings';
import type { Order } from '@/types';
import {
  ShoppingCart, Plus, Search, Eye, CheckCircle, XCircle, Clock,
  Truck, FileText, X, ChevronRight,
} from 'lucide-react';

const inputCls =
  'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent ' +
  'placeholder:text-gray-400';

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
      {label}
    </label>
    {children}
  </div>
);

function SlidePanel({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </>
  );
}

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<Order>>({
    userLicenseType: 'SingleUser',
    quantity: 1,
    discountPercent: 0,
    taxPercent: 18,
  });

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

  // Pricing calculations
  const selectedVariant = useMemo(
    () => variants?.find((v) => v.variantId === formData.variantId),
    [formData.variantId, variants]
  );

  const basePrice = useMemo(() => {
    if (!selectedVariant) return 0;
    return formData.userLicenseType === 'SingleUser'
      ? selectedVariant.basePriceSingleUser || 0
      : selectedVariant.basePriceMultiUser || 0;
  }, [selectedVariant, formData.userLicenseType]);

  const baseAmount = basePrice * (formData.quantity || 1);
  const customizationAmount = formData.customizationAmount || 0;
  const subTotal = baseAmount + customizationAmount;
  const discountPercent = formData.discountPercent || 0;
  const discountAmount = subTotal * (discountPercent / 100);
  const afterDiscount = subTotal - discountAmount;
  const taxPercent = formData.taxPercent || 0;
  const taxAmount = afterDiscount * (taxPercent / 100);
  const totalAmount = afterDiscount + taxAmount;

  const createMutation = useMutation({
    mutationFn: (data: Partial<Order>) => ordersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setIsCreateOpen(false);
      setFormData({ userLicenseType: 'SingleUser', quantity: 1, discountPercent: 0, taxPercent: 18 });
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
    const userLicenseType = (formData.userLicenseType || 'SingleUser') as 'SingleUser' | 'MultiUser';
    const licenseTypeEnum = UserLicenseTypeEnum[userLicenseType];
    const orderData: any = {
      customerId: Number(formData.customerId),
      variantId: Number(formData.variantId),
      userLicenseType: licenseTypeEnum,
      quantity: Number(formData.quantity) || 1,
      baseAmount: Number(baseAmount.toFixed(2)),
      customizationAmount: Number((formData.customizationAmount || 0).toFixed(2)),
      discountPercent: Number((formData.discountPercent || 0).toFixed(2)),
      discountAmount: Number(discountAmount.toFixed(2)),
      subTotal: Number(subTotal.toFixed(2)),
      taxPercent: Number((formData.taxPercent || 18).toFixed(2)),
      taxAmount: Number(taxAmount.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2)),
      notes: formData.notes || '',
    };
    createMutation.mutate(orderData);
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

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    if (!searchTerm) return orders;
    const s = searchTerm.toLowerCase();
    return orders.filter(
      (o) =>
        o.orderNumber?.toLowerCase().includes(s) ||
        o.customer?.companyName?.toLowerCase().includes(s) ||
        o.productVariant?.variantName?.toLowerCase().includes(s)
    );
  }, [orders, searchTerm]);

  const getStatusBadge = (status: number | string) => {
    const t = getOrderStatusString(status);
    const map: Record<string, { icon: React.ReactNode; cls: string }> = {
      Delivered: { icon: <Truck className="w-3 h-3" />, cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
      Confirmed: { icon: <CheckCircle className="w-3 h-3" />, cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
      Pending:   { icon: <Clock className="w-3 h-3" />,       cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
      Cancelled: { icon: <XCircle className="w-3 h-3" />,     cls: 'bg-red-50 text-red-700 border border-red-200' },
    };
    const d = map[t] || { icon: <FileText className="w-3 h-3" />, cls: 'bg-gray-50 text-gray-600 border border-gray-200' };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${d.cls}`}>
        {d.icon}{t || 'Draft'}
      </span>
    );
  };

  const getPaymentBadge = (status: string | number) => {
    const s = typeof status === 'number' ? PaymentStatusMap[status] || 'Pending' : status;
    const map: Record<string, string> = {
      Paid:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
      Partial: 'bg-amber-50 text-amber-700 border border-amber-200',
      Pending: 'bg-gray-50 text-gray-600 border border-gray-200',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${map[s] || map.Pending}`}>
        {s}
      </span>
    );
  };

  const isNonEditable = (status: number | string) => {
    const t = getOrderStatusString(status);
    return t === 'Confirmed' || t === 'Delivered' || t === 'Cancelled';
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6 lg:p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Orders</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Order
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <ShoppingCart className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No orders found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Order #', 'Customer', 'Product', 'Details', 'Amount', 'Status', 'Date', ''].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.map((order) => (
                  <tr key={order.orderId} className="group hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-4">
                      <span className="text-sm font-semibold text-indigo-600">{order.orderNumber}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-900">{order.customer?.companyName || '—'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-700">{order.productVariant?.variantName || '—'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600">
                        {order.quantity} × {getUserLicenseTypeString(order.userLicenseType)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</span>
                    </td>
                    <td className="px-4 py-4">{getStatusBadge(order.status)}</td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-500">{formatDate(order.orderDate)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        {!isNonEditable(order.status) && (
                          <button
                            onClick={() => handleConfirm(order.orderId)}
                            disabled={confirmMutation.isPending}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Confirm Order"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleViewDetail(order)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                          title="View Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Order Slide Panel */}
      <SlidePanel open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Order">
        <div className="space-y-4">
          <Field label="Customer *">
            <select
              value={formData.customerId || ''}
              onChange={(e) => setFormData({ ...formData, customerId: Number(e.target.value) })}
              className={inputCls}
            >
              <option value="">Select customer</option>
              {customers?.map((c) => (
                <option key={c.customerId} value={c.customerId}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Product Variant *">
            <select
              value={formData.variantId || ''}
              onChange={(e) => setFormData({ ...formData, variantId: Number(e.target.value) })}
              className={inputCls}
            >
              <option value="">Select variant</option>
              {variants?.map((v) => (
                <option key={v.variantId} value={v.variantId}>
                  {v.variantName}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="License Type">
              <select
                value={formData.userLicenseType || 'SingleUser'}
                onChange={(e) => setFormData({ ...formData, userLicenseType: e.target.value as any })}
                className={inputCls}
              >
                <option value="SingleUser">Single User</option>
                <option value="MultiUser">Multi User</option>
              </select>
            </Field>
            <Field label="Quantity *">
              <input
                type="number"
                min={1}
                value={formData.quantity || 1}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Customization (₹)">
              <input
                type="number"
                min={0}
                value={formData.customizationAmount || 0}
                onChange={(e) => setFormData({ ...formData, customizationAmount: Number(e.target.value) })}
                className={inputCls}
              />
            </Field>
            <Field label="Discount (%)">
              <input
                type="number"
                min={0}
                max={100}
                value={formData.discountPercent || 0}
                onChange={(e) => setFormData({ ...formData, discountPercent: Number(e.target.value) })}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Tax (%)">
            <input
              type="number"
              min={0}
              max={100}
              value={formData.taxPercent || 18}
              onChange={(e) => setFormData({ ...formData, taxPercent: Number(e.target.value) })}
              className={inputCls}
            />
          </Field>

          {/* Live Pricing Summary */}
          {selectedVariant && (
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Price Breakdown</p>
              <div className="flex justify-between text-gray-600">
                <span>Base price × {formData.quantity || 1}</span>
                <span>{formatCurrency(baseAmount)}</span>
              </div>
              {customizationAmount > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Customization</span>
                  <span>+ {formatCurrency(customizationAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Sub-total</span>
                <span>{formatCurrency(subTotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount ({discountPercent}%)</span>
                  <span>− {formatCurrency(discountAmount)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Tax ({taxPercent}%)</span>
                  <span>+ {formatCurrency(taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2 mt-2">
                <span>Total</span>
                <span className="text-indigo-700">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          )}

          <Field label="Notes">
            <textarea
              rows={3}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes..."
              className={inputCls}
            />
          </Field>

          <button
            onClick={handleCreate}
            disabled={createMutation.isPending}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Order'}
          </button>
        </div>
      </SlidePanel>

      {/* Detail Slide Panel */}
      <SlidePanel
        open={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedOrder(null); }}
        title="Order Details"
      >
        {selectedOrder && (
          <div className="space-y-5">
            {/* Order number + status */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Order #</p>
                <p className="text-lg font-bold text-indigo-700 mt-0.5">{selectedOrder.orderNumber}</p>
              </div>
              {getStatusBadge(selectedOrder.status)}
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Customer</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{selectedOrder.customer?.companyName || '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Order Date</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{formatDate(selectedOrder.orderDate)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Product</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{selectedOrder.productVariant?.variantName || '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">License</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{getUserLicenseTypeString(selectedOrder.userLicenseType)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Quantity</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{selectedOrder.quantity}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Payment</p>
                <div className="mt-0.5">{getPaymentBadge(selectedOrder.paymentStatus)}</div>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Price Breakdown</p>
              <div className="flex justify-between text-gray-600">
                <span>Base amount</span>
                <span>{formatCurrency(selectedOrder.baseAmount)}</span>
              </div>
              {selectedOrder.customizationAmount > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Customization</span>
                  <span>+ {formatCurrency(selectedOrder.customizationAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Sub-total</span>
                <span>{formatCurrency(selectedOrder.subTotal)}</span>
              </div>
              {selectedOrder.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount ({selectedOrder.discountPercent}%)</span>
                  <span>− {formatCurrency(selectedOrder.discountAmount)}</span>
                </div>
              )}
              {selectedOrder.taxAmount > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Tax ({selectedOrder.taxPercent}%)</span>
                  <span>+ {formatCurrency(selectedOrder.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2 mt-2">
                <span className="text-gray-900">Total</span>
                <span className="text-indigo-700">{formatCurrency(selectedOrder.totalAmount)}</span>
              </div>
            </div>

            {selectedOrder.notes && (
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm text-gray-700">{selectedOrder.notes}</p>
              </div>
            )}

            {!isNonEditable(selectedOrder.status) && (
              <button
                onClick={() => handleConfirm(selectedOrder.orderId)}
                disabled={confirmMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                {confirmMutation.isPending ? 'Confirming...' : 'Confirm Order & Create Subscription'}
              </button>
            )}
          </div>
        )}
      </SlidePanel>
    </div>
  );
}
