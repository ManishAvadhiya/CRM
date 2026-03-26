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
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { DashboardCard, StatCard, DataTable, ProgressBar } from './DashboardCard';
import { formatCurrency } from '@/lib/utils';
import type { SubscriptionAnalytics } from '@/types';

interface SubscriptionAnalyticsSectionProps {
  data: SubscriptionAnalytics;
}

const STATUS_COLORS = {
  Active: '#10b981',
  Expired: '#f59e0b',
  Cancelled: '#ef4444',
  Suspended: '#6b7280',
  'Pending Renewal': '#3b82f6',
};

export function SubscriptionAnalyticsSection({ data }: SubscriptionAnalyticsSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <RefreshCw className="w-5 h-5 text-blue-600" />
        Subscription Insights
      </h3>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Active Subscriptions"
          value={data.activeSubscriptions}
          sub={`${data.totalSubscriptions} total`}
          icon={<CheckCircle className="w-5 h-5" />}
          accent="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Renewal Rate"
          value={`${data.subscriptionRenewalRate.toFixed(1)}%`}
          sub={`Churn: ${data.churnRate.toFixed(1)}%`}
          icon={<RefreshCw className="w-5 h-5" />}
          accent="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Avg Annual Fee"
          value={formatCurrency(data.averageAnnualFee)}
          sub={`Total: ${formatCurrency(data.totalSubscriptionRevenue)}`}
          icon={<Clock className="w-5 h-5" />}
          accent="bg-violet-50 text-violet-600"
        />
        <StatCard
          label="At Risk"
          value={data.renewalForecast[1]?.atRiskCount || 0}
          sub="No auto-renew in 30 days"
          icon={<AlertTriangle className="w-5 h-5" />}
          accent="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <DashboardCard title="Status Breakdown" subtitle="Current subscription states">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.statusBreakdown}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                >
                  {data.statusBreakdown.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="p-2 bg-emerald-50 rounded-lg text-center">
              <p className="text-lg font-bold text-emerald-600">{data.autoRenewEnabled}</p>
              <p className="text-[10px] text-emerald-700">Auto-renew ON</p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg text-center">
              <p className="text-lg font-bold text-gray-600">{data.autoRenewDisabled}</p>
              <p className="text-[10px] text-gray-500">Auto-renew OFF</p>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Renewal Forecast" subtitle="Upcoming renewals by period" className="xl:col-span-2">
          <div className="space-y-3">
            {data.renewalForecast.map((forecast) => (
              <div key={forecast.period} className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">{forecast.period}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{forecast.subscriptionCount} subs</span>
                    <span className="text-sm font-semibold text-emerald-600">{formatCurrency(forecast.expectedRevenue)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ProgressBar
                    value={forecast.subscriptionCount - forecast.atRiskCount}
                    max={forecast.subscriptionCount || 1}
                    color="bg-emerald-500"
                    showLabel={false}
                  />
                  {forecast.atRiskCount > 0 && (
                    <span className="text-xs text-amber-600 font-medium whitespace-nowrap">
                      {forecast.atRiskCount} at risk
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-xl">
            <p className="text-xs font-medium text-blue-700">Average Subscription Duration</p>
            <p className="text-xl font-bold text-blue-800">{data.averageSubscriptionDuration.toFixed(1)} years</p>
          </div>
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <DashboardCard title="Cancellation Reasons" subtitle="Why subscriptions are cancelled">
          {data.cancellationReasons.length > 0 ? (
            <div className="space-y-2">
              {data.cancellationReasons.map((reason, index) => (
                <div key={reason.reason || index} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-gray-700">{reason.reason || 'Not specified'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900">{reason.count}</span>
                    <span className="text-xs text-gray-500 ml-2">({reason.percentage.toFixed(0)}%)</span>
                  </div>
                </div>
              ))}
              <div className="p-3 bg-red-100 rounded-xl mt-3">
                <p className="text-xs font-medium text-red-700">Lost Revenue from Cancellations</p>
                <p className="text-lg font-bold text-red-800">
                  {formatCurrency(data.cancellationReasons.reduce((acc, r) => acc + r.lostRevenue, 0))}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400">
              No cancellations recorded
            </div>
          )}
        </DashboardCard>

        <DashboardCard title="Renewal Distribution" subtitle="Number of times renewed">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.renewalDistribution}>
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis
                  dataKey="renewalCount"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}x`}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: number, name: string) => [value, name === 'subscriptionCount' ? 'Subscriptions' : name]}
                  labelFormatter={(label) => `Renewed ${label} times`}
                />
                <Bar dataKey="subscriptionCount" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
