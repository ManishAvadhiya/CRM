import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Users, Award, TrendingUp, DollarSign } from 'lucide-react';
import { DashboardCard, StatCard, DataTable } from './DashboardCard';
import { formatCurrency } from '@/lib/utils';
import type { PartnerPerformance } from '@/types';

interface PartnerPerformanceSectionProps {
  data: PartnerPerformance;
}

const ACTIVITY_COLORS = { High: 'bg-emerald-100 text-emerald-700', Medium: 'bg-amber-100 text-amber-700', Low: 'bg-gray-100 text-gray-600' };

export function PartnerPerformanceSection({ data }: PartnerPerformanceSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Users className="w-5 h-5 text-cyan-600" />
        Partner Performance
      </h3>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Partners"
          value={data.totalPartners}
          sub={`${data.activePartners} active`}
          icon={<Users className="w-5 h-5" />}
          accent="bg-cyan-50 text-cyan-600"
        />
        <StatCard
          label="Partner Revenue"
          value={formatCurrency(data.totalPartnerRevenue)}
          sub="Total contribution"
          icon={<DollarSign className="w-5 h-5" />}
          accent="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Commissions Paid"
          value={formatCurrency(data.totalCommissionsPaid)}
          sub="10% commission rate"
          icon={<TrendingUp className="w-5 h-5" />}
          accent="bg-violet-50 text-violet-600"
        />
        <StatCard
          label="Top Partner"
          value={data.topPartners[0]?.name || 'N/A'}
          sub={data.topPartners[0] ? formatCurrency(data.topPartners[0].totalRevenue) : ''}
          icon={<Award className="w-5 h-5" />}
          accent="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <DashboardCard title="Partner Leaderboard" subtitle="Top performers by revenue">
          <div className="max-h-80 overflow-y-auto">
            <DataTable headers={['Rank', 'Partner', 'Leads', 'Conv %', 'Revenue', 'Commission']}>
              {data.topPartners.map((partner) => (
                <tr key={partner.userId} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      partner.rank === 1 ? 'bg-amber-100 text-amber-700' :
                      partner.rank === 2 ? 'bg-gray-200 text-gray-700' :
                      partner.rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {partner.rank}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <p className="font-medium text-gray-900">{partner.name}</p>
                    <p className="text-[10px] text-gray-400">{partner.email}</p>
                  </td>
                  <td className="py-2 px-3 text-gray-600">
                    {partner.leadsConverted}/{partner.leadsCreated}
                  </td>
                  <td className="py-2 px-3">
                    <span className={`font-semibold ${partner.conversionRate >= 30 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {partner.conversionRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2 px-3 font-semibold text-gray-900">{formatCurrency(partner.totalRevenue)}</td>
                  <td className="py-2 px-3 text-emerald-600 font-medium">{formatCurrency(partner.totalCommission)}</td>
                </tr>
              ))}
            </DataTable>
          </div>
        </DashboardCard>

        <DashboardCard title="Partner Activity" subtitle="Current month performance">
          <div className="max-h-80 overflow-y-auto">
            <DataTable headers={['Partner', 'Leads', 'Orders', 'Revenue', 'Status']}>
              {data.partnerActivity.map((partner) => (
                <tr key={partner.userId} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3">
                    <p className="font-medium text-gray-900">{partner.name}</p>
                    <p className="text-[10px] text-gray-400">
                      Last: {partner.lastActivityDate ? new Date(partner.lastActivityDate).toLocaleDateString() : 'Never'}
                    </p>
                  </td>
                  <td className="py-2 px-3 text-gray-600">{partner.leadsThisMonth}</td>
                  <td className="py-2 px-3 text-gray-600">{partner.ordersThisMonth}</td>
                  <td className="py-2 px-3 font-semibold text-gray-900">{formatCurrency(partner.revenueThisMonth)}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${ACTIVITY_COLORS[partner.activityLevel as keyof typeof ACTIVITY_COLORS] || ACTIVITY_COLORS.Low}`}>
                      {partner.activityLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </DataTable>
          </div>
        </DashboardCard>
      </div>

      <DashboardCard title="Monthly Partner Revenue Trend" subtitle="Last 12 months">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.monthlyPartnerRevenue}>
              <defs>
                <linearGradient id="partnerRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
              <XAxis dataKey="monthName" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Area type="monotone" dataKey="totalRevenue" name="Revenue" stroke="#06b6d4" fill="url(#partnerRevenueGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="totalCommission" name="Commission" stroke="#8b5cf6" fill="none" strokeWidth={2} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </DashboardCard>
    </div>
  );
}
