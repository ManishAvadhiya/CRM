import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Calendar, TrendingUp, Clock } from 'lucide-react';
import { DashboardCard, StatCard, DataTable } from './DashboardCard';
import { formatCurrency } from '@/lib/utils';
import type { TimeBasedAnalytics } from '@/types';

interface TimeBasedAnalyticsSectionProps {
  data: TimeBasedAnalytics;
}

export function TimeBasedAnalyticsSection({ data }: TimeBasedAnalyticsSectionProps) {
  const quarterlyData = data.quarterlyPerformance.map((q) => ({
    ...q,
    quarter: `Q${q.quarter} ${q.year}`,
  }));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-orange-600" />
        Time-Based Insights
      </h3>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Time to First Order"
          value={`${data.averageTimeToFirstOrderDays.toFixed(0)} days`}
          sub="From customer creation"
          icon={<Clock className="w-5 h-5" />}
          accent="bg-orange-50 text-orange-600"
        />
        <StatCard
          label="Order Fulfillment"
          value={`${data.averageOrderFulfillmentDays.toFixed(0)} days`}
          sub="Average delivery time"
          icon={<Clock className="w-5 h-5" />}
          accent="bg-blue-50 text-blue-600"
        />
        {data.yearOverYearComparison.find((y) => y.metric === 'Revenue') && (
          <StatCard
            label="YoY Revenue Growth"
            value={`${(data.yearOverYearComparison.find((y) => y.metric === 'Revenue')?.growthPercent || 0).toFixed(1)}%`}
            sub="vs last year"
            icon={<TrendingUp className="w-5 h-5" />}
            accent={(data.yearOverYearComparison.find((y) => y.metric === 'Revenue')?.growthPercent || 0) >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}
          />
        )}
        {data.yearOverYearComparison.find((y) => y.metric === 'Leads') && (
          <StatCard
            label="YoY Lead Growth"
            value={`${(data.yearOverYearComparison.find((y) => y.metric === 'Leads')?.growthPercent || 0).toFixed(1)}%`}
            sub="vs last year"
            icon={<TrendingUp className="w-5 h-5" />}
            accent={(data.yearOverYearComparison.find((y) => y.metric === 'Leads')?.growthPercent || 0) >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}
          />
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <DashboardCard title="Quarterly Performance" subtitle="Revenue and activity by quarter">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quarterlyData}>
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value: number, name: string) => name === 'revenue' ? formatCurrency(value) : value} />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="orderCount" name="Orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>

        <DashboardCard title="Day of Week Performance" subtitle="Best days for sales activity">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dayOfWeekPerformance}>
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis dataKey="dayOfWeek" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="leadCount" name="Leads" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="orderCount" name="Orders" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="conversionCount" name="Conversions" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>
      </div>

      <DashboardCard title="Year-over-Year Comparison" subtitle="Current year vs previous year">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.yearOverYearComparison.map((comparison) => (
            <div key={comparison.metric} className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs font-semibold text-gray-400 uppercase">{comparison.metric}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-xl font-bold text-gray-900">
                  {comparison.metric === 'Revenue' ? formatCurrency(comparison.currentYearValue) : comparison.currentYearValue}
                </p>
                <span className={`text-xs font-semibold ${comparison.growthPercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {comparison.growthPercent >= 0 ? '↑' : '↓'} {Math.abs(comparison.growthPercent).toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Last year: {comparison.metric === 'Revenue' ? formatCurrency(comparison.previousYearValue) : comparison.previousYearValue}
              </p>
            </div>
          ))}
        </div>
      </DashboardCard>
    </div>
  );
}
