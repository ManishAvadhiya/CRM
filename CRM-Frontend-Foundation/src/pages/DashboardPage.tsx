import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertCircle,
  ArrowUpRight,
  Clock,
  DollarSign,
  ShoppingCart,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { dashboardApi, ordersApi } from '@/services';
import { leadsApi } from '@/services/leadsService';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Activity as ActivityType, Lead, Order } from '@/types';

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-400 mt-1 truncate">{sub}</p>
      </div>
    </div>
  );
}

function InsightsCard({ title, value, tone }: { title: string; value: string; tone: 'good' | 'warn' | 'info' }) {
  const toneMap = {
    good: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    warn: 'bg-amber-50 text-amber-700 border-amber-100',
    info: 'bg-blue-50 text-blue-700 border-blue-100',
  };

  return (
    <div className={`rounded-xl border p-3 ${toneMap[tone]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider">{title}</p>
      <p className="text-sm font-medium mt-1">{value}</p>
    </div>
  );
}

function buildLast6Months() {
  const months: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('en-US', { month: 'short' });
    months.push({ key, label });
  }
  return months;
}

function getMonthKey(dateLike?: string) {
  if (!dateLike) return '';
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isPartner = user?.role === 'Partner';

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: () => dashboardApi.getRecentActivities(10),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: ordersApi.getAll,
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => leadsApi.getAll(),
  });

  const convRate = stats ? Math.round((stats.convertedLeads / Math.max(stats.totalLeads, 1)) * 100) : 0;
  const deliveredRate = stats ? Math.round((stats.deliveredOrders / Math.max(stats.totalOrders, 1)) * 100) : 0;
  const winRate = stats ? Math.round((stats.confirmedOrders / Math.max(stats.totalOrders, 1)) * 100) : 0;

  const monthSeries = useMemo(() => {
    const months = buildLast6Months();
    const base = new Map(
      months.map((m) => [m.key, { month: m.label, revenue: 0, orders: 0, leads: 0, converted: 0 }])
    );

    (orders as Order[]).forEach((o) => {
      const key = getMonthKey(o.orderDate);
      const slot = base.get(key);
      if (!slot) return;
      slot.orders += 1;
      if (o.status === 'Confirmed' || o.status === 'Delivered' || o.status === 2 || o.status === 3) {
        slot.revenue += Number(o.totalAmount || 0);
      }
    });

    (leads as Lead[]).forEach((l) => {
      const key = getMonthKey(l.createdAt);
      const slot = base.get(key);
      if (!slot) return;
      slot.leads += 1;
      if (l.status === 'Converted') slot.converted += 1;
    });

    return months.map((m) => {
      const row = base.get(m.key)!;
      return {
        ...row,
        revenue: Math.round(row.revenue),
      };
    });
  }, [orders, leads]);

  const funnelData = useMemo(
    () => [
      { name: 'New', value: stats?.newLeads ?? 0, color: '#3b82f6' },
      { name: 'Demo', value: stats?.demoLeads ?? 0, color: '#8b5cf6' },
      { name: 'Converted', value: stats?.convertedLeads ?? 0, color: '#10b981' },
      { name: 'Lost', value: stats?.lostLeads ?? 0, color: '#f43f5e' },
    ],
    [stats]
  );

  const orderMixData = useMemo(
    () => [
      { name: 'Pending', value: stats?.pendingOrders ?? 0, color: '#f59e0b' },
      { name: 'Confirmed', value: stats?.confirmedOrders ?? 0, color: '#3b82f6' },
      { name: 'Delivered', value: stats?.deliveredOrders ?? 0, color: '#10b981' },
    ],
    [stats]
  );

  const insights = useMemo(() => {
    const renewalsSoon = stats?.upcomingRenewals30Days ?? 0;
    const pendingOrders = stats?.pendingOrders ?? 0;
    const lostLeads = stats?.lostLeads ?? 0;
    const totalLeads = stats?.totalLeads ?? 0;

    return [
      {
        title: 'Conversion Health',
        value:
          convRate >= 30
            ? `Strong conversion at ${convRate}%. Keep current demo process.`
            : `Conversion at ${convRate}%. Improve qualification and follow-ups.`,
        tone: (convRate >= 30 ? 'good' : 'warn') as 'good' | 'warn' | 'info',
      },
      {
        title: 'Pipeline Risk',
        value:
          pendingOrders > 0
            ? `${pendingOrders} pending orders are slowing revenue recognition.`
            : 'No pending orders blocking revenue flow.',
        tone: (pendingOrders > 0 ? 'warn' : 'good') as 'good' | 'warn' | 'info',
      },
      {
        title: 'Retention Watch',
        value:
          renewalsSoon > 0
            ? `${renewalsSoon} renewals due in 30 days. Prioritize retention campaigns.`
            : 'No near-term renewals risk in next 30 days.',
        tone: (renewalsSoon > 0 ? 'info' : 'good') as 'good' | 'warn' | 'info',
      },
      {
        title: 'Lead Quality',
        value:
          totalLeads > 0 && lostLeads / totalLeads > 0.25
            ? 'Lost lead ratio is high. Audit lead-source quality and handoff.'
            : 'Lead quality is stable based on current lost ratio.',
        tone: (totalLeads > 0 && lostLeads / totalLeads > 0.25 ? 'warn' : 'good') as 'good' | 'warn' | 'info',
      },
    ];
  }, [stats, convRate]);

  const getActivityIcon = (activity: ActivityType) => {
    switch (activity.activityType as string) {
      case 'LeadCreated':
        return '📝';
      case 'LeadConverted':
        return '✅';
      case 'OrderCreated':
        return '📦';
      case 'OrderConfirmed':
        return '✔️';
      case 'SubscriptionCreated':
        return '🔄';
      default:
        return '📌';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen p-6 lg:p-8">
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded-xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-72 bg-gray-200 rounded-2xl" />
            <div className="h-72 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {isPartner ? 'Partner Performance Dashboard' : 'Revenue Intelligence Dashboard'}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {isPartner
                ? 'Track your conversion, sales performance, and renewal opportunities.'
                : 'Track funnel efficiency, sales outcomes, and retention risks across the CRM.'}
            </p>
          </div>
          <div className="text-xs text-gray-400 mt-1">Live insights</div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label={isPartner ? 'My Leads' : 'Total Leads'}
            value={stats?.totalLeads ?? 0}
            sub={`${stats?.convertedLeads ?? 0} converted · ${convRate}% conversion`}
            icon={Users}
            accent="bg-indigo-50 text-indigo-600"
          />
          <StatCard
            label={isPartner ? 'My Sales' : 'Total Revenue'}
            value={formatCurrency(stats?.totalRevenue ?? 0)}
            sub={`${stats?.confirmedOrders ?? 0} confirmed deals`}
            icon={DollarSign}
            accent="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            label={isPartner ? 'My Orders' : 'Order Win Rate'}
            value={isPartner ? stats?.totalOrders ?? 0 : `${winRate}%`}
            sub={`${stats?.pendingOrders ?? 0} pending · ${stats?.deliveredOrders ?? 0} delivered`}
            icon={ShoppingCart}
            accent="bg-blue-50 text-blue-600"
          />
          <StatCard
            label={isPartner ? 'My Earnings' : 'Delivery Rate'}
            value={isPartner ? formatCurrency(stats?.totalEarnings ?? 0) : `${deliveredRate}%`}
            sub={`${stats?.upcomingRenewals30Days ?? 0} renewals due in 30 days`}
            icon={Target}
            accent="bg-violet-50 text-violet-600"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">6-Month Revenue and Deal Trend</h2>
                <p className="text-xs text-gray-400 mt-0.5">Revenue recognized from confirmed and delivered orders</p>
              </div>
              <TrendingUp className="w-4 h-4 text-gray-300" />
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthSeries}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name === 'revenue' ? [formatCurrency(value), 'Revenue'] : [value, 'Orders']
                    }
                    labelStyle={{ color: '#0f172a', fontWeight: 600 }}
                  />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#059669" fill="url(#revGrad)" strokeWidth={2.2} />
                  <Line yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="#2563eb" strokeWidth={2.2} dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Order Outcome Mix</h2>
                <p className="text-xs text-gray-400 mt-0.5">Current distribution by stage</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={orderMixData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={2}>
                    {orderMixData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Lead Funnel Performance</h2>
                <p className="text-xs text-gray-400 mt-0.5">Stage conversion quality and leakage points</p>
              </div>
              <Users className="w-4 h-4 text-gray-300" />
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData}>
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {funnelData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-gray-900">Actionable Insights</h2>
            </div>
            <div className="space-y-2.5">
              {insights.map((item) => (
                <InsightsCard key={item.title} title={item.title} value={item.value} tone={item.tone} />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Lead Velocity (6 Months)</h2>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthSeries}>
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="leads" name="New Leads" stroke="#3b82f6" strokeWidth={2.2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="converted" name="Converted" stroke="#10b981" strokeWidth={2.2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Recent Activity Feed</h2>
            </div>
            {activitiesLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-9 bg-gray-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (activities?.length ?? 0) === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-gray-400">No recent activity</div>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                {(activities ?? []).map((activity: ActivityType) => (
                  <div key={activity.activityId} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                    <span className="text-base leading-none mt-0.5">{getActivityIcon(activity)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-800 truncate">{activity.description}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(activity.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
