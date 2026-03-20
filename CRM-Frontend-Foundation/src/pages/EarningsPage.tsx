import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Banknote, Receipt, Percent, CircleDollarSign } from 'lucide-react';
import { ordersApi } from '@/services';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

export default function EarningsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const user = useAuthStore((s) => s.user);
  const isPartner = user?.role === 'Partner';

  const { data: earnings, isLoading } = useQuery({
    queryKey: ['partner-earnings'],
    queryFn: ordersApi.getEarnings,
  });

  const filteredEarnings = useMemo(() => {
    if (!earnings) return [];
    if (!searchTerm) return earnings;
    const s = searchTerm.toLowerCase();
    return earnings.filter(
      (row) =>
        row.orderNumber?.toLowerCase().includes(s) ||
        row.customerName?.toLowerCase().includes(s) ||
        row.status?.toLowerCase().includes(s)
    );
  }, [earnings, searchTerm]);

  const totals = useMemo(() => {
    const rows = filteredEarnings;
    const totalSales = rows.reduce((sum, row) => sum + (row.orderAmount || 0), 0);
    const totalEarnings = rows.reduce((sum, row) => sum + (row.earningAmount || 0), 0);
    const avgRate = rows.length > 0
      ? rows.reduce((sum, row) => sum + (row.commissionRate || 0), 0) / rows.length
      : 0;
    return { totalSales, totalEarnings, avgRate, count: rows.length };
  }, [filteredEarnings]);

  return (
    <div className="bg-gray-50 min-h-screen p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {isPartner ? 'My Earnings' : 'Partner Earnings'}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Earnings calculated per order based on commission rate
            </p>
          </div>
          <div className="text-xs text-gray-400 mt-1">Live data</div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <CircleDollarSign className="w-5 h-5" />
            </div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total Earnings</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totals.totalEarnings)}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Banknote className="w-5 h-5" />
            </div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total Sales</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totals.totalSales)}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Receipt className="w-5 h-5" />
            </div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Orders Count</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totals.count}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-3">
              <Percent className="w-5 h-5" />
            </div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Avg Commission</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totals.avgRate.toFixed(2)}%</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Earnings by Order</h2>
            <div className="relative w-full max-w-xs">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search order/customer"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Order</th>
                  <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3.5 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Order Amount</th>
                  <th className="px-4 py-3.5 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Commission</th>
                  <th className="px-4 py-3.5 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Earning</th>
                  <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                      <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                      <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                      <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                      <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                      <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                      <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    </tr>
                  ))
                ) : filteredEarnings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">No earnings found</td>
                  </tr>
                ) : (
                  filteredEarnings.map((row) => (
                    <tr key={row.orderId} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                      <td className="px-4 py-4 text-sm font-semibold text-gray-800">{row.orderNumber}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{row.customerName}</td>
                      <td className="px-4 py-4 text-sm text-gray-500">{formatDate(row.orderDate)}</td>
                      <td className="px-4 py-4 text-sm text-gray-700 text-right">{formatCurrency(row.orderAmount)}</td>
                      <td className="px-4 py-4 text-sm text-gray-700 text-right">{row.commissionRate}%</td>
                      <td className="px-4 py-4 text-sm font-semibold text-emerald-700 text-right">{formatCurrency(row.earningAmount)}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-50 text-gray-700 border border-gray-200">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
