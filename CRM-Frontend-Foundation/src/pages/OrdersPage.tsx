import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi, customersApi, productVariantsApi } from '@/services';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Order, Customer, ProductVariant } from '@/types';
import { 
  ShoppingCart, 
  Plus, 
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Calendar,
  Package,
  Users,
  FileText,
  Tag,
  Percent,
  Receipt,
  DollarSign
} from 'lucide-react';

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [formData, setFormData] = useState<Partial<Order>>({
    userLicenseType: 'SingleUser',
    quantity: 1,
    discountPercent: 0,
    taxPercent: 18,
  });

  // Status mapping function - defined BEFORE it's used
  const getOrderStatus = (id: number) => {
    if(id == 0) return 'Draft';
    else if(id == 1) return 'Pending';
    else if(id == 2) return 'Confirmed';
    else if(id == 3) return 'Delivered';
    else if(id == 4) return 'Cancelled';
    else return 'Unknown';
  }

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

  // Calculate order counts by status - now getOrderStatus is defined
  const orderCounts = useMemo(() => {
    if (!orders) return { Draft: 0, Pending: 0, Confirmed: 0, Delivered: 0, Cancelled: 0, total: 0 };
    
    return {
      Draft: orders.filter(o => getOrderStatus(o.status || 0) === 'Draft').length,
      Pending: orders.filter(o => getOrderStatus(o.status || 0) === 'Pending').length,
      Confirmed: orders.filter(o => getOrderStatus(o.status || 0) === 'Confirmed').length,
      Delivered: orders.filter(o => getOrderStatus(o.status || 0) === 'Delivered').length,
      Cancelled: orders.filter(o => getOrderStatus(o.status || 0) === 'Cancelled').length,
      total: orders.length
    };
  }, [orders]);

  const statusCards = [
    { 
      status: 'All', 
      count: orderCounts.total, 
      icon: ShoppingCart, 
      bgColor: 'bg-gray-600',
      iconColor: 'text-white',
      textColor: 'text-white',
      countColor: 'text-white',
      borderColor: 'border-gray-700',
      activeBorderColor: 'ring-4 ring-gray-400 ring-offset-2'
    },
    { 
      status: 'Draft', 
      count: orderCounts.Draft, 
      icon: FileText, 
      bgColor: 'bg-gray-600',
      iconColor: 'text-white',
      textColor: 'text-white',
      countColor: 'text-white',
      borderColor: 'border-gray-700',
      activeBorderColor: 'ring-4 ring-gray-400 ring-offset-2'
    },
    { 
      status: 'Pending', 
      count: orderCounts.Pending, 
      icon: Clock, 
      bgColor: 'bg-yellow-600',
      iconColor: 'text-white',
      textColor: 'text-white',
      countColor: 'text-white',
      borderColor: 'border-yellow-700',
      activeBorderColor: 'ring-4 ring-yellow-300 ring-offset-2'
    },
    { 
      status: 'Confirmed', 
      count: orderCounts.Confirmed, 
      icon: CheckCircle, 
      bgColor: 'bg-blue-600',
      iconColor: 'text-white',
      textColor: 'text-white',
      countColor: 'text-white',
      borderColor: 'border-blue-700',
      activeBorderColor: 'ring-4 ring-blue-300 ring-offset-2'
    },
    { 
      status: 'Delivered', 
      count: orderCounts.Delivered, 
      icon: Truck, 
      bgColor: 'bg-green-600',
      iconColor: 'text-white',
      textColor: 'text-white',
      countColor: 'text-white',
      borderColor: 'border-green-700',
      activeBorderColor: 'ring-4 ring-green-300 ring-offset-2'
    },
    { 
      status: 'Cancelled', 
      count: orderCounts.Cancelled, 
      icon: XCircle, 
      bgColor: 'bg-red-600',
      iconColor: 'text-white',
      textColor: 'text-white',
      countColor: 'text-white',
      borderColor: 'border-red-700',
      activeBorderColor: 'ring-4 ring-red-300 ring-offset-2'
    },
  ];

  // Calculate pricing based on form data
  const selectedVariant = useMemo(() => {
    return variants?.find((v) => v.variantId === formData.variantId);
  }, [formData.variantId, variants]);

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
      setFormData({
        userLicenseType: 'SingleUser',
        quantity: 1,
        discountPercent: 0,
        taxPercent: 18,
      });
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
    
    const licenseTypeEnum = (formData.userLicenseType || 'SingleUser') === 'SingleUser' ? 0 : 1;
    
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

  const handleStatusFilterClick = (status: string) => {
    if (status === 'All') {
      if (statusFilter === undefined) return;
      setStatusFilter(undefined);
    } else {
      if (statusFilter === status) return;
      setStatusFilter(status);
    }
  };

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    
    let filtered = orders;
    
    if (statusFilter) {
      filtered = filtered.filter(o => getOrderStatus(o.status || 0) === statusFilter);
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderNumber?.toLowerCase().includes(searchLower) ||
        order.customer?.companyName?.toLowerCase().includes(searchLower) ||
        order.productVariant?.variantName?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [orders, statusFilter, searchTerm]);

  const getStatusBadge = (status: number) => {
    const statusText = getOrderStatus(status);
    switch (statusText) {
      case 'Delivered':
        return <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
          <Truck className="h-3 w-3" />
          Delivered
        </Badge>;
      case 'Confirmed':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Confirmed
        </Badge>;
      case 'Pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>;
      case 'Cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Cancelled
        </Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200 flex items-center gap-1">
          <FileText className="h-3 w-3" />
          Draft
        </Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Paid
        </Badge>;
      case 'Partial':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Partial
        </Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in fade-in duration-500">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Orders
            </h1>
            <p className="text-gray-600 mt-2 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Create and manage sales orders
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                <Plus className="h-4 w-4 mr-2" />
                New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <Plus className="h-6 w-6 text-blue-600" />
                  Create New Order
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-1 h-4 bg-red-500 rounded-full"></span>
                    Required Information
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Customer <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.customerId || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, customerId: Number(e.target.value) })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">Select a customer</option>
                        {customers?.map((c) => (
                          <option key={c.customerId} value={c.customerId}>
                            {c.companyName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Product Variant <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.variantId || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, variantId: Number(e.target.value) })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">Select a product variant</option>
                        {variants?.map((v) => (
                          <option key={v.variantId} value={v.variantId}>
                            {v.variantName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* License Type & Quantity */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                    License & Quantity
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                        License Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.userLicenseType || 'SingleUser'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            userLicenseType: e.target.value as Order['userLicenseType'],
                          })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="SingleUser">Single User</option>
                        <option value="MultiUser">Multi User</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.quantity || 1}
                        onChange={(e) =>
                          setFormData({ ...formData, quantity: Number(e.target.value) })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                    Pricing Details
                  </h3>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          Base Price ({formData.userLicenseType}):
                        </span>
                        <span className="font-semibold">{formatCurrency(basePrice)}</span>
                      </div>
                      <div className="flex justify-between pb-2 border-b border-gray-200">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          Base Amount ({formData.quantity}x):
                        </span>
                        <span className="font-semibold">{formatCurrency(baseAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Receipt className="h-3 w-3" />
                          Sub Total:
                        </span>
                        <span className="font-semibold">{formatCurrency(subTotal)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Customization Amount
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.customizationAmount || 0}
                        onChange={(e) =>
                          setFormData({ ...formData, customizationAmount: Number(e.target.value) })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                        <Percent className="h-3 w-3 inline mr-1" />
                        Discount (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.discountPercent || 0}
                        onChange={(e) =>
                          setFormData({ ...formData, discountPercent: Number(e.target.value) })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Tax (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.taxPercent || 18}
                      onChange={(e) =>
                        setFormData({ ...formData, taxPercent: Number(e.target.value) })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Amount Summary */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                    Amount Summary
                  </h3>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Discount Amount (-{discountPercent}%):</span>
                      <span className="text-sm font-semibold text-red-600">-{formatCurrency(discountAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">After Discount:</span>
                      <span className="text-sm font-semibold">{formatCurrency(afterDiscount)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b-2 border-blue-200">
                      <span className="text-sm text-gray-600">Tax Amount ({taxPercent}%):</span>
                      <span className="text-sm font-semibold text-green-600">+{formatCurrency(taxAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                      <span className="text-2xl font-bold text-blue-600">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-1 h-4 bg-yellow-500 rounded-full"></span>
                    Additional Information
                  </h3>
                  
                  <textarea
                    placeholder="Order notes (optional)"
                    value={formData.notes || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    rows={2}
                  />
                </div>

                {/* Submit Button */}
                <Button 
                  onClick={handleCreate} 
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold h-11 rounded-lg transition-all duration-200 mt-6" 
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Order
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Status Cards */}
        {/* <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {statusCards.map((card) => {
            const Icon = card.icon;
            const isActive = card.status === 'All' 
              ? statusFilter === undefined 
              : statusFilter === card.status;
            
            return (
              <Card
                key={card.status}
                className={`
                  relative overflow-hidden cursor-pointer transition-all duration-200
                  ${card.bgColor} border-2 ${card.borderColor}
                  hover:scale-105 hover:shadow-xl
                  ${isActive ? card.activeBorderColor : 'hover:brightness-110'}
                `}
                onClick={() => handleStatusFilterClick(card.status)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/20 text-white">
                      {card.count}
                    </span>
                  </div>
                  <p className={`text-sm font-medium ${card.textColor} opacity-90`}>
                    {card.status}
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${card.countColor}`}>
                    {card.count}
                  </p>
                </div>
              </Card>
            );
          })}
        </div> */}

        {/* Search Bar */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders by order number, customer, or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </Card>

        {/* Orders Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order #</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  {/* <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment</th> */}
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders && filteredOrders.length > 0 ? (
                  filteredOrders.map((order, idx) => (
                    <tr 
                      key={order.orderId} 
                      className={`transition-all duration-200 hover:bg-blue-50 group ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                            #{order.orderNumber?.slice(-4)}
                          </div>
                          <span className="font-semibold text-gray-900">{order.orderNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{order.customer?.companyName || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{order.productVariant?.variantName || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          <p>{order.quantity} x {order.userLicenseType == 0 ? 'Single User' : 'Multi User'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-blue-600">{formatCurrency(order.totalAmount)}</span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(order.status || 0)}
                      </td>
                      {/* <td className="px-6 py-4">
                        {getPaymentStatusBadge(order.paymentStatus || 'Pending')}
                      </td> */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="h-3 w-3" />
                          {formatDate(order.orderDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Dialog open={isDetailOpen && selectedOrder?.orderId === order.orderId} onOpenChange={setIsDetailOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetail(order)}
                                className="hover:bg-blue-100 hover:text-blue-600"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[700px]">
                              <DialogHeader>
                                <DialogTitle className="text-2xl flex items-center gap-2">
                                  <Eye className="h-6 w-6 text-blue-600" />
                                  Order Details - {selectedOrder?.orderNumber}
                                </DialogTitle>
                              </DialogHeader>
                              {selectedOrder && (
                                <div className="space-y-6">
                                  {/* Order Header */}
                                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200">
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Order Number</p>
                                      <p className="text-base font-bold text-gray-900 mt-1">{selectedOrder.orderNumber}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</p>
                                      <div className="mt-1">{getStatusBadge(selectedOrder.status || 0)}</div>
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</p>
                                      <p className="text-base text-gray-900 mt-1">{selectedOrder.customer?.companyName}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Order Date</p>
                                      <p className="text-base text-gray-900 mt-1 flex items-center gap-1">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        {formatDate(selectedOrder.orderDate)}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Product Details */}
                                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200">
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Product</p>
                                      <p className="text-base text-gray-900 mt-1 flex items-center gap-1">
                                        <Package className="h-4 w-4 text-gray-400" />
                                        {selectedOrder.productVariant?.variantName}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">License Type</p>
                                      <p className="text-base text-gray-900 mt-1">{selectedOrder.userLicenseType == 0 ? 'Single User' : 'Multi User'}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</p>
                                      <p className="text-base text-gray-900 mt-1">{selectedOrder.quantity}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Base Price</p>
                                      <p className="text-base text-gray-900 mt-1">{formatCurrency(selectedOrder.baseAmount)}</p>
                                    </div>
                                  </div>

                                  {/* Pricing Summary */}
                                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-gray-600">Base Amount:</span>
                                      <span className="font-semibold">{formatCurrency(selectedOrder.baseAmount)}</span>
                                    </div>
                                    {selectedOrder.customizationAmount > 0 && (
                                      <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Customization:</span>
                                        <span className="font-semibold">+{formatCurrency(selectedOrder.customizationAmount)}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between items-center text-sm pb-2 border-b border-blue-200">
                                      <span className="text-gray-600">Subtotal:</span>
                                      <span className="font-semibold">{formatCurrency((selectedOrder.baseAmount || 0) + (selectedOrder.customizationAmount || 0))}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-red-600">Discount ({selectedOrder.discountPercent}%):</span>
                                      <span className="font-semibold text-red-600">-{formatCurrency(selectedOrder.discountAmount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-green-600">Tax ({selectedOrder.taxPercent || 0}%):</span>
                                      <span className="font-semibold text-green-600">+{formatCurrency(selectedOrder.taxAmount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t-2 border-blue-300">
                                      <span className="text-lg font-bold text-gray-900">Total:</span>
                                      <span className="text-2xl font-bold text-blue-600">{formatCurrency(selectedOrder.totalAmount)}</span>
                                    </div>
                                  </div>

                                  {/* Payment Status */}
                                  {/* <div className="pb-4 border-b border-gray-200">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Payment Status</p>
                                    <div className="flex items-center gap-2">
                                      {getPaymentStatusBadge(selectedOrder.paymentStatus || 'Pending')}
                                      <span className="text-sm text-gray-600">
                                        {selectedOrder.paymentStatus || 'Pending'}
                                      </span>
                                    </div>
                                  </div> */}

                                  {selectedOrder.notes && (
                                    <div className="pb-4 border-b border-gray-200">
                                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Notes</p>
                                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedOrder.notes}</p>
                                    </div>
                                  )}

                                  {/* {getOrderStatus(selectedOrder.status) !== 'Confirmed' && 
                                   getOrderStatus(selectedOrder.status) !== 'Delivered' && 
                                   getOrderStatus(selectedOrder.status) !== 'Cancelled' && (
                                    <Button
                                      onClick={() => handleConfirm(selectedOrder.orderId)}
                                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold h-11 rounded-lg transition-all duration-200"
                                      disabled={confirmMutation.isPending}
                                    >
                                      {confirmMutation.isPending ? (
                                        <>
                                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                                          Confirming...
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Confirm Order & Create Subscription
                                        </>
                                      )}
                                    </Button>
                                  )} */}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <ShoppingCart className="h-12 w-12 text-gray-300" />
                        <p className="text-gray-500">No orders found</p>
                        <Button
                          variant="outline"
                          onClick={() => setIsCreateOpen(true)}
                          className="mt-2"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create your first order
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}