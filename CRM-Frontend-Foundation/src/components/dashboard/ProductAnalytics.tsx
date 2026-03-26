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
import { Package, Percent, Tag } from 'lucide-react';
import { DashboardCard, StatCard, DataTable, ProgressBar } from './DashboardCard';
import { formatCurrency } from '@/lib/utils';
import type { ProductAnalytics } from '@/types';

interface ProductAnalyticsSectionProps {
  data: ProductAnalytics;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export function ProductAnalyticsSection({ data }: ProductAnalyticsSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Package className="w-5 h-5 text-violet-600" />
        Product & Variant Analysis
      </h3>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Active Products"
          value={data.activeProducts}
          sub={`${data.totalProducts} total variants`}
          icon={<Package className="w-5 h-5" />}
          accent="bg-violet-50 text-violet-600"
        />
        <StatCard
          label="Customization Revenue"
          value={formatCurrency(data.totalCustomizationRevenue)}
          sub="Additional services"
          icon={<Tag className="w-5 h-5" />}
          accent="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Avg Discount"
          value={`${data.averageDiscountPercent.toFixed(1)}%`}
          sub={`Total: ${formatCurrency(data.totalDiscountGiven)}`}
          icon={<Percent className="w-5 h-5" />}
          accent="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="Total Discounts"
          value={formatCurrency(data.totalDiscountGiven)}
          sub="Across all orders"
          icon={<Percent className="w-5 h-5" />}
          accent="bg-rose-50 text-rose-600"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <DashboardCard title="Product Performance" subtitle="Revenue and orders by variant">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.productPerformance} layout="vertical">
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="variantName" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={100} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="totalRevenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>

        <DashboardCard title="License Type Distribution" subtitle="Single vs Multi-user breakdown">
          <div className="flex items-center gap-4 h-56">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.licenseTypeDistribution}
                    dataKey="count"
                    nameKey="licenseType"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {data.licenseTypeDistribution.map((entry, index) => (
                      <Cell key={entry.licenseType} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              {data.licenseTypeDistribution.map((license, index) => (
                <div key={license.licenseType} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="font-semibold text-gray-900">{license.licenseType}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{license.count} orders</span>
                    <span className="font-medium text-gray-700">{formatCurrency(license.revenue)}</span>
                  </div>
                  <ProgressBar value={license.percentage} showLabel={false} color={`bg-[${COLORS[index % COLORS.length]}]`} />
                </div>
              ))}
            </div>
          </div>
        </DashboardCard>
      </div>

      <DashboardCard title="Product Details" subtitle="Complete variant analysis">
        <div className="max-h-80 overflow-y-auto">
          <DataTable headers={['Product', 'Code', 'Orders', 'Revenue', 'Avg Value', 'Market Share']}>
            {data.productPerformance.map((product) => (
              <tr key={product.variantId} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2 px-3">
                  <p className="font-medium text-gray-900">{product.variantName}</p>
                  <p className="text-[10px] text-gray-400">{product.activeSubscriptions} active subs</p>
                </td>
                <td className="py-2 px-3 text-gray-600 font-mono text-xs">{product.variantCode}</td>
                <td className="py-2 px-3 text-gray-900 font-semibold">{product.totalOrders}</td>
                <td className="py-2 px-3 text-gray-900 font-semibold">{formatCurrency(product.totalRevenue)}</td>
                <td className="py-2 px-3 text-gray-600">{formatCurrency(product.averageOrderValue)}</td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={product.marketShare} showLabel={false} color="bg-indigo-500" />
                    <span className="text-xs font-semibold text-gray-700">{product.marketShare.toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      </DashboardCard>
    </div>
  );
}
