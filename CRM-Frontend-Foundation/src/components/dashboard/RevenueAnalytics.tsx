import {
  Area,
  AreaChart,
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
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Target } from 'lucide-react';
import { DashboardCard, StatCard, MiniStat } from './DashboardCard';
import { formatCurrency } from '@/lib/utils';
import type { RevenueAnalytics } from '@/types';

interface RevenueAnalyticsSectionProps {
  data: RevenueAnalytics;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export function RevenueAnalyticsSection({ data }: RevenueAnalyticsSectionProps) {
  const growthIcon = data.revenueGrowthMoM >= 0 ? (
    <TrendingUp className="w-5 h-5" />
  ) : (
    <TrendingDown className="w-5 h-5" />
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-emerald-600" />
        Revenue Analysis & Forecasting
      </h3>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(data.totalRevenue)}
          sub="All time"
          icon={<DollarSign className="w-5 h-5" />}
          accent="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="This Month"
          value={formatCurrency(data.revenueThisMonth)}
          sub={`Last month: ${formatCurrency(data.revenueLastMonth)}`}
          icon={growthIcon}
          accent={data.revenueGrowthMoM >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}
          trend={{ value: data.revenueGrowthMoM, label: 'MoM' }}
        />
        <StatCard
          label="Avg Order Value"
          value={formatCurrency(data.averageOrderValue)}
          sub="Per confirmed order"
          icon={<CreditCard className="w-5 h-5" />}
          accent="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Pending Revenue"
          value={formatCurrency(data.pendingRevenue)}
          sub="Awaiting confirmation"
          icon={<Target className="w-5 h-5" />}
          accent="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <DashboardCard
          title="Recurring Revenue"
          subtitle="Subscription-based income"
          className="xl:col-span-1"
        >
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="MRR" value={formatCurrency(data.monthlyRecurringRevenue)} color="text-emerald-600" />
            <MiniStat label="ARR" value={formatCurrency(data.annualRecurringRevenue)} color="text-blue-600" />
          </div>
          {/* <div className="mt-4 p-3 bg-indigo-50 rounded-xl">
            <p className="text-xs font-medium text-indigo-700">Revenue Forecast</p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">30 Days</span>
                <span className="font-semibold text-indigo-700">{formatCurrency(data.projectedRevenue30Days)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">90 Days</span>
                <span className="font-semibold text-indigo-700">{formatCurrency(data.projectedRevenue90Days)}</span>
              </div>
            </div>
          </div> */}
        </DashboardCard>

        <DashboardCard
          title="Monthly Revenue Trend"
          subtitle="Last 12 months"
          className="xl:col-span-2"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyRevenue}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis dataKey="monthName" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  contentStyle={{ borderRadius: 10, borderColor: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revenueGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <DashboardCard title="Payment Status Breakdown" subtitle="By payment collection status">
          <div className="h-56 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.paymentBreakdown}
                  dataKey="amount"
                  nameKey="status"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {data.paymentBreakdown.map((entry, index) => (
                    <Cell key={entry.status} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>

        <DashboardCard title="Growth Analysis" subtitle="Year-over-year comparison">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs font-semibold text-gray-400 uppercase">This Quarter</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(data.revenueThisQuarter)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs font-semibold text-gray-400 uppercase">This Year</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(data.revenueThisYear)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl ${data.revenueGrowthMoM >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <p className="text-xs font-semibold text-gray-500 uppercase">Month-over-Month</p>
                <p className={`text-xl font-bold mt-1 ${data.revenueGrowthMoM >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {data.revenueGrowthMoM >= 0 ? '+' : ''}{data.revenueGrowthMoM.toFixed(1)}%
                </p>
              </div>
              <div className={`p-4 rounded-xl ${data.revenueGrowthYoY >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <p className="text-xs font-semibold text-gray-500 uppercase">Year-over-Year</p>
                <p className={`text-xl font-bold mt-1 ${data.revenueGrowthYoY >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {data.revenueGrowthYoY >= 0 ? '+' : ''}{data.revenueGrowthYoY.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
