import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { ordersApi, customersApi, productVariantsApi, subscriptionsApi } from '@/services';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import {
  UserLicenseTypeEnum,
  PaymentStatusMap,
  OrderTypeEnum,
  getOrderStatusString,
  getUserLicenseTypeString,
  getOrderTypeString,
} from '@/lib/enum-mappings';
import type { Order, Subscription } from '@/types';
import {
  ShoppingCart, Plus, Search, Eye, CheckCircle, XCircle, Clock,
  Truck, FileText, X, ChevronRight, Filter, RefreshCw,
} from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/PaginationControls';

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
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
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
      </div>
    </>
  );
}

function ConfirmActionModal({
  open,
  title,
  message,
  confirmText,
  isLoading,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-2">{message}</p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isLoading ? 'Confirming...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const showAuditColumns = user?.role === 'ManagementAdmin' || user?.role === 'Marketing';
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [confirmOrder, setConfirmOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountFrom, setAmountFrom] = useState('');
  const [amountTo, setAmountTo] = useState('');
  const [renewalMode, setRenewalMode] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
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

  const { data: renewableSubscriptions } = useQuery({
    queryKey: ['renewable-subscriptions'],
    queryFn: () => subscriptionsApi.getRenewable(),
    enabled: renewalMode || isCreateOpen,
  });

  // Handle incoming navigation state from SubscriptionsPage
  useEffect(() => {
    const state = location.state as { renewalMode?: boolean; subscriptionId?: number } | null;
    if (state?.renewalMode) {
      setRenewalMode(true);
      setIsCreateOpen(true);
      if (state.subscriptionId && renewableSubscriptions) {
        const sub = renewableSubscriptions.find(s => s.subscriptionId === state.subscriptionId);
        if (sub) {
          setSelectedSubscription(sub);
          setFormData({
            customerId: sub.customerId,
            variantId: sub.variantId,
            userLicenseType: 'SingleUser',
            quantity: 1,
            discountPercent: 0,
            taxPercent: 18,
          });
        }
      }
      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state, renewableSubscriptions]);

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
      setRenewalMode(false);
      setSelectedSubscription(null);
      setFormData({ userLicenseType: 'SingleUser', quantity: 1, discountPercent: 0, taxPercent: 18 });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (id: number) => ordersApi.confirm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['renewable-subscriptions'] });
      setConfirmOrder(null);
      setSelectedOrder(null);
      setIsDetailOpen(false);
    },
  });

  const handleCreate = () => {
    if (renewalMode) {
      if (!selectedSubscription) {
        alert('Please select a subscription to renew');
        return;
      }
      const userLicenseType = (formData.userLicenseType || 'SingleUser') as 'SingleUser' | 'MultiUser';
      const licenseTypeEnum = UserLicenseTypeEnum[userLicenseType];
      const orderData: any = {
        customerId: selectedSubscription.customerId,
        variantId: formData.variantId || selectedSubscription.variantId,
        orderType: OrderTypeEnum.Renew,
        renewedSubscriptionId: selectedSubscription.subscriptionId,
        userLicenseType: licenseTypeEnum,
        quantity: 1,
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
    } else {
      if (!formData.customerId || !formData.variantId || !formData.quantity) {
        alert('Please fill in all required fields');
        return;
      }
      const userLicenseType = (formData.userLicenseType || 'SingleUser') as 'SingleUser' | 'MultiUser';
      const licenseTypeEnum = UserLicenseTypeEnum[userLicenseType];
      const orderData: any = {
        customerId: Number(formData.customerId),
        variantId: Number(formData.variantId),
        orderType: OrderTypeEnum.New,
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
    }
  };

  const handleConfirm = (order: Order) => {
    setConfirmOrder(order);
  };

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    let filtered = orders;

    // Search filter
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(s) ||
          o.customer?.companyName?.toLowerCase().includes(s) ||
          o.productVariant?.variantName?.toLowerCase().includes(s)
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((o) => getOrderStatusString(o.status) === statusFilter);
    }

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter((o) => new Date(o.createdAt) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((o) => new Date(o.createdAt) <= toDate);
    }

    // Amount range filter
    if (amountFrom) {
      const minAmount = Number(amountFrom);
      filtered = filtered.filter((o) => (o.totalAmount || 0) >= minAmount);
    }
    if (amountTo) {
      const maxAmount = Number(amountTo);
      filtered = filtered.filter((o) => (o.totalAmount || 0) <= maxAmount);
    }

    return filtered;
  }, [orders, searchTerm, statusFilter, dateFrom, dateTo, amountFrom, amountTo]);

  const pagination = usePagination(filteredOrders, 10);

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
            className="btn-vibrant-primary inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Order
          </button>
        </div>

        {/* Search */}
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Status</label>
                <select
                  value={statusFilter || ''}
                  onChange={(e) => setStatusFilter(e.target.value || undefined)}
                  className={inputCls}
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Amount Range */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Amount</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={amountFrom}
                    onChange={(e) => setAmountFrom(e.target.value)}
                    className={`${inputCls} flex-1`}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={amountTo}
                    onChange={(e) => setAmountTo(e.target.value)}
                    className={`${inputCls} flex-1`}
                  />
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            {(statusFilter || dateFrom || dateTo || amountFrom || amountTo) && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => {
                    setStatusFilter(undefined);
                    setDateFrom('');
                    setDateTo('');
                    setAmountFrom('');
                    setAmountTo('');
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  Clear Filters
                </button>
              </div>
            )}
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
                  {['Order #', 'Type', 'Customer', 'Product', 'Details', 'Amount', 'Status', 'Date'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                  {showAuditColumns && (
                    <>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Created By</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Updated</th>
                    </>
                  )}
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pagination.paginatedItems.map((order) => (
                  <tr key={order.orderId} className="group hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-4">
                      <span className="text-sm font-semibold text-indigo-600">{order.orderNumber}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        getOrderTypeString(order.orderType ?? 0) === 'Renew'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {getOrderTypeString(order.orderType ?? 0)}
                      </span>
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
                    {showAuditColumns && (
                      <>
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-600">{order.createdByUser?.name || `User #${order.createdBy}`}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-500">{formatDate(order.updatedAt)}</span>
                        </td>
                      </>
                    )}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        {!isNonEditable(order.status) && (
                          <button
                            onClick={() => handleConfirm(order)}
                            disabled={confirmMutation.isPending}
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 transition-colors font-bold"
                            title="Confirm Order"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleViewDetail(order)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-950/50 dark:text-blue-300 transition-colors font-bold"
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

          {/* Pagination */}
          {filteredOrders.length > 0 && (
            <div className="px-5 py-4 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between flex-col sm:flex-row gap-4">
              <p className="text-sm text-gray-500">
                Showing <span className="font-semibold">{(pagination.currentPage - 1) * pagination.itemsPerPage + 1}</span> to <span className="font-semibold">{Math.min(pagination.currentPage * pagination.itemsPerPage, filteredOrders.length)}</span> of <span className="font-semibold">{filteredOrders.length}</span> orders
              </p>
              <PaginationControls
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                itemsPerPage={pagination.itemsPerPage}
                totalItems={filteredOrders.length}
                onPageChange={pagination.goToPage}
                onItemsPerPageChange={pagination.setItemsPerPage}
                pageNumbers={pagination.pageNumbers}
                hasNextPage={pagination.currentPage < pagination.totalPages}
                hasPreviousPage={pagination.currentPage > 1}
              />
            </div>
          )}
        </div>
      </div>

      {/* Create Order Slide Panel */}
      <SlidePanel
        open={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setRenewalMode(false);
          setSelectedSubscription(null);
          setFormData({ userLicenseType: 'SingleUser', quantity: 1, discountPercent: 0, taxPercent: 18 });
        }}
        title={renewalMode ? 'Renew Subscription' : 'New Order'}
      >
        <div className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => {
                setRenewalMode(false);
                setSelectedSubscription(null);
                setFormData({ userLicenseType: 'SingleUser', quantity: 1, discountPercent: 0, taxPercent: 18 });
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${!renewalMode ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600'}`}
            >
              New Order
            </button>
            <button
              onClick={() => {
                setRenewalMode(true);
                setFormData({ userLicenseType: 'SingleUser', quantity: 1, discountPercent: 0, taxPercent: 18 });
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${renewalMode ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600'}`}
            >
              <RefreshCw className="w-4 h-4" />
              Renewal
            </button>
          </div>

          {renewalMode ? (
            <>
              {/* Subscription Selector */}
              <Field label="Select Subscription to Renew *">
                <select
                  value={selectedSubscription?.subscriptionId || ''}
                  onChange={(e) => {
                    const sub = renewableSubscriptions?.find(s => s.subscriptionId === Number(e.target.value));
                    setSelectedSubscription(sub || null);
                    if (sub) {
                      setFormData({
                        ...formData,
                        customerId: sub.customerId,
                        variantId: sub.variantId,
                      });
                    }
                  }}
                  className={inputCls}
                >
                  <option value="">Select subscription</option>
                  {renewableSubscriptions?.map((sub) => (
                    <option key={sub.subscriptionId} value={sub.subscriptionId}>
                      {sub.subscriptionNumber} - {sub.customer?.companyName} ({sub.status})
                    </option>
                  ))}
                </select>
              </Field>

              {selectedSubscription && (
                <>
                  {/* Current Subscription Info */}
                  <div className="bg-indigo-50 rounded-2xl p-4 space-y-2">
                    <p className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">Current Subscription</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Customer:</span>
                        <span className="ml-2 font-medium text-gray-900">{selectedSubscription.customer?.companyName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Product:</span>
                        <span className="ml-2 font-medium text-gray-900">{selectedSubscription.productVariant?.variantName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Expires:</span>
                        <span className="ml-2 font-medium text-gray-900">{formatDate(selectedSubscription.currentPeriodEnd)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Renewals:</span>
                        <span className="ml-2 font-medium text-gray-900">{selectedSubscription.renewalCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Optional: Upgrade Product */}
                  <Field label="Product (Change to upgrade)">
                    <select
                      value={formData.variantId || selectedSubscription.variantId}
                      onChange={(e) => setFormData({ ...formData, variantId: Number(e.target.value) })}
                      className={inputCls}
                    >
                      {variants?.map((v) => (
                        <option key={v.variantId} value={v.variantId}>
                          {v.variantName} {v.variantId === selectedSubscription.variantId ? '(Current)' : ''}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
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
                  </div>

                  {/* Live Pricing Summary */}
                  {selectedVariant && (
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Renewal Amount</p>
                      <div className="flex justify-between text-gray-600">
                        <span>Base price</span>
                        <span>{formatCurrency(baseAmount)}</span>
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
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {createMutation.isPending ? 'Creating...' : 'Create Renewal Order'}
                  </button>
                </>
              )}
            </>
          ) : (
            <>
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
            </>
          )}
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
              {showAuditColumns && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Created By</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{selectedOrder.createdByUser?.name || `User #${selectedOrder.createdBy}`}</p>
                </div>
              )}
              {showAuditColumns && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Last Updated</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{formatDate(selectedOrder.updatedAt)}</p>
                </div>
              )}
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
                onClick={() => handleConfirm(selectedOrder)}
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

      <ConfirmActionModal
        open={confirmOrder !== null}
        title="Confirm Order"
        message={
          confirmOrder
            ? getOrderTypeString(confirmOrder.orderType ?? 0) === 'Renew'
              ? `Confirm ${confirmOrder.orderNumber}? This will renew the subscription.`
              : `Confirm ${confirmOrder.orderNumber}? This will create a subscription automatically.`
            : 'Confirm selected order?'
        }
        confirmText="Confirm"
        isLoading={confirmMutation.isPending}
        onCancel={() => setConfirmOrder(null)}
        onConfirm={() => {
          if (confirmOrder) {
            confirmMutation.mutate(confirmOrder.orderId);
          }
        }}
      />
    </div>
  );
}
