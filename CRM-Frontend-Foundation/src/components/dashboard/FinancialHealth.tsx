import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DollarSign, AlertTriangle, TrendingUp, CreditCard } from 'lucide-react';
import { DashboardCard, StatCard, DataTable } from './DashboardCard';
import { formatCurrency } from '@/lib/utils';
import type { FinancialHealth } from '@/types';

interface FinancialHealthSectionProps {
  data: FinancialHealth;
}

const AGING_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export function FinancialHealthSection({ data }: FinancialHealthSectionProps) {
  const agingData = [
    { name: '0-30 Days', value: data.outstandingWithin30Days, color: AGING_COLORS[0] },
    { name: '30-60 Days', value: data.outstanding30To60Days, color: AGING_COLORS[1] },
    { name: '60+ Days', value: data.outstandingOver60Days, color: AGING_COLORS[2] },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-green-600" />
        Financial Health Indicators
      </h3>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Outstanding Amount"
          value={formatCurrency(data.totalOutstandingAmount)}
          sub="Pending payments"
          icon={<DollarSign className="w-5 h-5" />}
          accent="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="Revenue at Risk"
          value={formatCurrency(data.revenueAtRisk)}
          sub="Expiring without auto-renew"
          icon={<AlertTriangle className="w-5 h-5" />}
          accent="bg-red-50 text-red-600"
        />
        <StatCard
          label="Tax Collected"
          value={formatCurrency(data.totalTaxCollected)}
          sub="Total GST/Tax"
          icon={<TrendingUp className="w-5 h-5" />}
          accent="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Discounts Given"
          value={formatCurrency(data.totalDiscountsGiven)}
          sub="Total discount amount"
          icon={<CreditCard className="w-5 h-5" />}
          accent="bg-violet-50 text-violet-600"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <DashboardCard title="Outstanding by Aging" subtitle="Payment aging breakdown">
          <div className="flex items-center gap-4">
            <div className="w-1/2 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={agingData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {agingData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              {agingData.map((aging) => (
                <div key={aging.name} className="p-3 rounded-xl" style={{ backgroundColor: `${aging.color}15` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: aging.color }} />
                      <span className="text-sm font-medium text-gray-700">{aging.name}</span>
                    </div>
                    <span className="font-bold text-gray-900">{formatCurrency(aging.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Cash Flow Projection" subtitle="Expected inflow by period">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.cashFlowProjection}>
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="renewalRevenue" name="Renewals" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="newBusinessRevenue" name="New Business" stackId="a" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {data.cashFlowProjection.map((proj) => (
              <div key={proj.period} className="p-2 bg-gray-50 rounded-lg text-center">
                <p className="text-[10px] font-semibold text-gray-400 uppercase">{proj.period}</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{formatCurrency(proj.expectedInflow)}</p>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>

      <DashboardCard title="Top Outstanding Customers" subtitle="Accounts with pending payments">
        <div className="max-h-64 overflow-y-auto">
          <DataTable headers={['Company', 'Outstanding', 'Orders', 'Days']}>
            {data.topOutstandingCustomers.map((customer) => (
              <tr key={customer.customerId} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2 px-3 font-medium text-gray-900">{customer.companyName}</td>
                <td className="py-2 px-3 font-semibold text-amber-600">{formatCurrency(customer.outstandingAmount)}</td>
                <td className="py-2 px-3 text-gray-600">{customer.pendingOrderCount}</td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    customer.daysOutstanding > 60 ? 'bg-red-100 text-red-700' :
                    customer.daysOutstanding > 30 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {customer.daysOutstanding}d
                  </span>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      </DashboardCard>
    </div>
  );
}
