import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Users, Heart, TrendingUp, Award } from 'lucide-react';
import { DashboardCard, StatCard, DataTable, ProgressBar } from './DashboardCard';
import { formatCurrency } from '@/lib/utils';
import type { CustomerAnalytics } from '@/types';

interface CustomerAnalyticsSectionProps {
  data: CustomerAnalytics;
}

const SEGMENT_COLORS = ['#8b5cf6', '#f59e0b', '#6366f1', '#94a3b8'];
const HEALTH_COLORS = { Healthy: '#10b981', 'At Risk': '#f59e0b', New: '#3b82f6' };

export function CustomerAnalyticsSection({ data }: CustomerAnalyticsSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Users className="w-5 h-5 text-indigo-600" />
        Customer Lifetime Value & Retention
      </h3>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Customers"
          value={data.totalCustomers}
          sub={`${data.newCustomersThisMonth} new this month`}
          icon={<Users className="w-5 h-5" />}
          accent="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          label="Avg CLV"
          value={formatCurrency(data.averageCustomerLifetimeValue)}
          sub={`Median: ${formatCurrency(data.medianCustomerLifetimeValue)}`}
          icon={<TrendingUp className="w-5 h-5" />}
          accent="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Retention Rate"
          value={`${data.customerRetentionRate.toFixed(1)}%`}
          sub={`Churn: ${data.churnRate.toFixed(1)}%`}
          icon={<Heart className="w-5 h-5" />}
          accent="bg-rose-50 text-rose-600"
        />
        <StatCard
          label="Repeat Purchase"
          value={`${data.repeatPurchaseRate.toFixed(1)}%`}
          sub={`Avg age: ${data.averageCustomerAgeMonths.toFixed(1)} months`}
          icon={<Award className="w-5 h-5" />}
          accent="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <DashboardCard title="Customer Health" subtitle="Active vs Dormant customers">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-emerald-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-emerald-600">{data.activeCustomers}</p>
                <p className="text-xs text-emerald-700 font-medium">Active</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-xl text-center">
                <p className="text-2xl font-bold text-gray-600">{data.dormantCustomers}</p>
                <p className="text-xs text-gray-500 font-medium">Dormant</p>
              </div>
            </div>
            <ProgressBar
              value={data.activeCustomers}
              max={data.totalCustomers}
              color="bg-emerald-500"
              label="Active Customer Rate"
            />
          </div>
        </DashboardCard>

        <DashboardCard title="Customer Segments" subtitle="Revenue tier distribution" className="xl:col-span-2">
          <div className="h-56 flex">
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie
                  data={data.customerSegments}
                  dataKey="count"
                  nameKey="segment"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                >
                  {data.customerSegments.map((entry, index) => (
                    <Cell key={entry.segment} fill={SEGMENT_COLORS[index % SEGMENT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2 pl-4">
              {data.customerSegments.map((segment, index) => (
                <div key={segment.segment} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SEGMENT_COLORS[index % SEGMENT_COLORS.length] }} />
                    <span className="text-xs font-medium text-gray-700">{segment.segment}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-gray-900">{segment.count} customers</p>
                    <p className="text-[10px] text-gray-500">{formatCurrency(segment.totalRevenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <DashboardCard title="Top Customers by Revenue" subtitle="Highest value accounts">
          <div className="max-h-72 overflow-y-auto">
            <DataTable headers={['Company', 'Revenue', 'Orders', 'Health']}>
              {data.topCustomersByRevenue.slice(0, 8).map((customer) => (
                <tr key={customer.customerId} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3">
                    <p className="font-medium text-gray-900 text-sm">{customer.companyName}</p>
                    <p className="text-[10px] text-gray-400">Since {customer.customerSince}</p>
                  </td>
                  <td className="py-2 px-3 font-semibold text-gray-900">{formatCurrency(customer.totalRevenue)}</td>
                  <td className="py-2 px-3 text-gray-600">{customer.totalOrders}</td>
                  <td className="py-2 px-3">
                    <span
                      className="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                      style={{
                        backgroundColor: `${HEALTH_COLORS[customer.healthScore as keyof typeof HEALTH_COLORS] || '#94a3b8'}20`,
                        color: HEALTH_COLORS[customer.healthScore as keyof typeof HEALTH_COLORS] || '#94a3b8',
                      }}
                    >
                      {customer.healthScore}
                    </span>
                  </td>
                </tr>
              ))}
            </DataTable>
          </div>
        </DashboardCard>

        <DashboardCard title="Revenue by Industry" subtitle="Top performing sectors">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.industryBreakdown.slice(0, 6)} layout="vertical">
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="industry" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="totalRevenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
