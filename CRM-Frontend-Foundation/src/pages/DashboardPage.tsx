import { useEffect, useMemo, useState } from 'react';
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
  CalendarRange,
  Clock,
  DollarSign,
  Filter,
  ShoppingCart,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { customersApi, dashboardApi, ordersApi, usersApi } from '@/services';
import { leadsApi } from '@/services/leadsService';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Activity as ActivityType, Customer, Lead, Order, User } from '@/types';

type RangePreset = 'week' | 'month' | 'year' | 'custom';

type DateRange = {
  from: Date;
  to: Date;
};

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

function getWishMessage(name?: string) {
  const hour = new Date().getHours();
  const firstName = (name || 'there').split(' ')[0];

  if (hour < 12) return `Good morning, ${firstName}`;
  if (hour < 17) return `Good afternoon, ${firstName}`;
  return `Good evening, ${firstName}`;
}

function formatInputDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseInputDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function getPresetRange(preset: Exclude<RangePreset, 'custom'>): DateRange {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (preset === 'week') {
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    return { from, to };
  }

  if (preset === 'month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    return { from, to };
  }

  const from = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
  return { from, to };
}

function getActivityIcon(activity: ActivityType) {
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
}

function isSuccessfulOrder(status: string | number | undefined) {
  return status === 'Confirmed' || status === 'Delivered' || status === 2 || status === 3;
}

function isPendingOrder(status: string | number | undefined) {
  return status === 'Pending' || status === 1;
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isPartner = user?.role === 'Partner';

  const [preset, setPreset] = useState<RangePreset>('month');
  const initialRange = useMemo(() => getPresetRange('month'), []);
  const [fromDate, setFromDate] = useState(formatInputDate(initialRange.from));
  const [toDate, setToDate] = useState(formatInputDate(initialRange.to));

  useEffect(() => {
    if (preset === 'custom') return;
    const range = getPresetRange(preset);
    setFromDate(formatInputDate(range.from));
    setToDate(formatInputDate(range.to));
  }, [preset]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: () => dashboardApi.getRecentActivities(12),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: ordersApi.getAll,
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => leadsApi.getAll(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      try {
        return await customersApi.getAll();
      } catch {
        return [] as Customer[];
      }
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        return await usersApi.getAll();
      } catch {
        return [] as User[];
      }
    },
  });

  const range = useMemo(() => {
    const from = parseInputDate(fromDate);
    const to = parseInputDate(toDate);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }, [fromDate, toDate]);

  const isInRange = (dateLike?: string) => {
    if (!dateLike) return false;
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return false;
    return d >= range.from && d <= range.to;
  };

  const filteredOrders = useMemo(() => (orders as Order[]).filter((o) => isInRange(o.orderDate)), [orders, range]);
  const filteredLeads = useMemo(() => (leads as Lead[]).filter((l) => isInRange(l.createdAt)), [leads, range]);
  const filteredCustomers = useMemo(
    () => (customers as Customer[]).filter((c) => isInRange(c.createdAt)),
    [customers, range]
  );
  const filteredUsers = useMemo(() => (users as User[]).filter((u) => isInRange(u.createdAt)), [users, range]);

  const convRate = filteredLeads.length
    ? Math.round((filteredLeads.filter((l) => l.status === 'Converted').length / filteredLeads.length) * 100)
    : 0;

  const deliveredRate = filteredOrders.length
    ? Math.round((filteredOrders.filter((o) => o.status === 'Delivered' || o.status === 3).length / filteredOrders.length) * 100)
    : 0;

  const winRate = filteredOrders.length
    ? Math.round((filteredOrders.filter((o) => isSuccessfulOrder(o.status)).length / filteredOrders.length) * 100)
    : 0;

  const realizedRevenue = filteredOrders
    .filter((o) => isSuccessfulOrder(o.status))
    .reduce((acc, o) => acc + Number(o.totalAmount || 0), 0);

  const pendingRevenue = filteredOrders
    .filter((o) => isPendingOrder(o.status))
    .reduce((acc, o) => acc + Number(o.totalAmount || 0), 0);

  const lostLeads = filteredLeads.filter((l) => l.status === 'Lost');
  const lostAmount = lostLeads.reduce((acc, l) => acc + Number(l.estimatedValue || 0), 0);

  const now = new Date();
  const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const thisYearStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);

  const customersThisWeek = (customers as Customer[]).filter((c) => new Date(c.createdAt) >= thisWeekStart).length;
  const customersThisMonth = (customers as Customer[]).filter((c) => new Date(c.createdAt) >= thisMonthStart).length;
  const usersThisMonth = (users as User[]).filter((u) => new Date(u.createdAt) >= thisMonthStart).length;
  const leadsThisWeek = (leads as Lead[]).filter((l) => new Date(l.createdAt) >= thisWeekStart).length;
  const leadsThisMonth = (leads as Lead[]).filter((l) => new Date(l.createdAt) >= thisMonthStart).length;
  const revenueThisYear = (orders as Order[])
    .filter((o) => new Date(o.orderDate) >= thisYearStart && isSuccessfulOrder(o.status))
    .reduce((acc, o) => acc + Number(o.totalAmount || 0), 0);

  const selectedYear = range.to.getFullYear();

  const monthlySeries = useMemo(() => {
    const months = Array.from({ length: 12 }).map((_, idx) => ({
      monthIdx: idx,
      month: new Date(selectedYear, idx, 1).toLocaleString('en-US', { month: 'short' }),
      revenue: 0,
      orders: 0,
      leads: 0,
      customers: 0,
    }));

    filteredOrders.forEach((o) => {
      const d = new Date(o.orderDate);
      if (d.getFullYear() !== selectedYear) return;
      const row = months[d.getMonth()];
      row.orders += 1;
      if (isSuccessfulOrder(o.status)) row.revenue += Number(o.totalAmount || 0);
    });

    filteredLeads.forEach((l) => {
      const d = new Date(l.createdAt);
      if (d.getFullYear() !== selectedYear) return;
      months[d.getMonth()].leads += 1;
    });

    filteredCustomers.forEach((c) => {
      const d = new Date(c.createdAt);
      if (d.getFullYear() !== selectedYear) return;
      months[d.getMonth()].customers += 1;
    });

    return months.map((m) => ({
      ...m,
      revenue: Math.round(m.revenue),
    }));
  }, [filteredOrders, filteredLeads, filteredCustomers, selectedYear]);

  const yearlySeries = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }).map((_, idx) => currentYear - (4 - idx));
    const base = years.map((y) => ({ year: String(y), revenue: 0, leads: 0, orders: 0 }));

    (orders as Order[]).forEach((o) => {
      const y = new Date(o.orderDate).getFullYear();
      const slot = base.find((row) => Number(row.year) === y);
      if (!slot) return;
      slot.orders += 1;
      if (isSuccessfulOrder(o.status)) slot.revenue += Number(o.totalAmount || 0);
    });

    (leads as Lead[]).forEach((l) => {
      const y = new Date(l.createdAt).getFullYear();
      const slot = base.find((row) => Number(row.year) === y);
      if (!slot) return;
      slot.leads += 1;
    });

    return base.map((row) => ({
      ...row,
      revenue: Math.round(row.revenue),
    }));
  }, [orders, leads]);

  const leadStatusData = useMemo(() => {
    const statsByStatus = {
      New: 0,
      Demo: 0,
      Converted: 0,
      Lost: 0,
    };

    filteredLeads.forEach((lead) => {
      if (lead.status in statsByStatus) {
        statsByStatus[lead.status as keyof typeof statsByStatus] += 1;
      }
    });

    return [
      { name: 'New', value: statsByStatus.New, color: '#3b82f6' },
      { name: 'Demo', value: statsByStatus.Demo, color: '#8b5cf6' },
      { name: 'Converted', value: statsByStatus.Converted, color: '#10b981' },
      { name: 'Lost', value: statsByStatus.Lost, color: '#f43f5e' },
    ];
  }, [filteredLeads]);

  const periodLabel = useMemo(() => {
    if (preset === 'week') return 'This Week';
    if (preset === 'month') return 'This Month';
    if (preset === 'year') return 'This Year';
    return `${fromDate} to ${toDate}`;
  }, [preset, fromDate, toDate]);

  const insights = useMemo(() => {
    const renewalSoon = stats?.upcomingRenewals30Days ?? 0;

    return [
      {
        title: 'Conversion Health',
        value:
          convRate >= 30
            ? `${periodLabel}: strong lead conversion at ${convRate}%.`
            : `${periodLabel}: conversion is ${convRate}%. Prioritize lead qualification.`,
        tone: (convRate >= 30 ? 'good' : 'warn') as 'good' | 'warn' | 'info',
      },
      {
        title: 'Revenue Exposure',
        value:
          pendingRevenue > 0
            ? `${formatCurrency(pendingRevenue)} is pending confirmation.`
            : 'No pending revenue exposure in selected period.',
        tone: (pendingRevenue > 0 ? 'warn' : 'good') as 'good' | 'warn' | 'info',
      },
      {
        title: 'Retention Watch',
        value:
          renewalSoon > 0
            ? `${renewalSoon} renewals due in next 30 days.`
            : 'No near-term renewal risk detected.',
        tone: (renewalSoon > 0 ? 'info' : 'good') as 'good' | 'warn' | 'info',
      },
      {
        title: 'Lost Opportunity',
        value:
          lostLeads.length > 0
            ? `${lostLeads.length} lost leads totaling ${formatCurrency(lostAmount)}.`
            : 'No lost opportunities in selected range.',
        tone: (lostLeads.length > 0 ? 'warn' : 'good') as 'good' | 'warn' | 'info',
      },
    ];
  }, [stats, convRate, pendingRevenue, periodLabel, lostLeads.length, lostAmount]);

  const wishMessage = useMemo(() => getWishMessage(user?.name), [user?.name]);

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
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-100 text-indigo-700 text-lg sm:text-3xl font-bold tracking-tight mb-2 shadow-sm">
              {wishMessage}
            </p>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {isPartner ? 'Partner Performance Dashboard' : 'Revenue Intelligence Dashboard'}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Filter analytics by week, month, year, or custom range to inspect conversion and revenue behavior.
            </p>
          </div>
          <div className="text-xs text-gray-400 mt-1">Live insights</div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Analytics Filters</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {(['week', 'month', 'year', 'custom'] as RangePreset[]).map((key) => (
              <button
                key={key}
                onClick={() => setPreset(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  preset === key
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {key === 'week' ? 'This Week' : key === 'month' ? 'This Month' : key === 'year' ? 'This Year' : 'Custom'}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 mb-1">From</p>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setPreset('custom');
                  setFromDate(e.target.value);
                }}
                className="h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700"
              />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 mb-1">To</p>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setPreset('custom');
                  setToDate(e.target.value);
                }}
                className="h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700"
              />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-xs text-gray-600">
              <CalendarRange className="w-3.5 h-3.5" />
              {periodLabel}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label={isPartner ? 'My Leads' : 'Leads in Range'}
            value={filteredLeads.length}
            sub={`${filteredLeads.filter((l) => l.status === 'Converted').length} converted · ${convRate}% conversion`}
            icon={Users}
            accent="bg-indigo-50 text-indigo-600"
          />
          <StatCard
            label={isPartner ? 'My Revenue' : 'Profit (Realized)'}
            value={formatCurrency(realizedRevenue)}
            sub={`${formatCurrency(pendingRevenue)} pending pipeline`}
            icon={DollarSign}
            accent="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            label={isPartner ? 'My Orders' : 'Order Win Rate'}
            value={isPartner ? filteredOrders.length : `${winRate}%`}
            sub={`${filteredOrders.filter((o) => isPendingOrder(o.status)).length} pending · ${deliveredRate}% delivered`}
            icon={ShoppingCart}
            accent="bg-blue-50 text-blue-600"
          />
          <StatCard
            label={isPartner ? 'My Earnings' : 'Lost Opportunity'}
            value={formatCurrency(lostAmount)}
            sub={`${lostLeads.length} lost leads in selected period`}
            icon={Target}
            accent="bg-rose-50 text-rose-600"
          />
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Users Added"
            value={filteredUsers.length}
            sub={`${usersThisMonth} added this month`}
            icon={Users}
            accent="bg-violet-50 text-violet-600"
          />
          <StatCard
            label="Customers Added"
            value={filteredCustomers.length}
            sub={`${customersThisWeek} this week · ${customersThisMonth} this month`}
            icon={Users}
            accent="bg-cyan-50 text-cyan-600"
          />
          <StatCard
            label="Lead Inflow"
            value={leadsThisWeek}
            sub={`${leadsThisMonth} leads this month`}
            icon={TrendingUp}
            accent="bg-amber-50 text-amber-600"
          />
          <StatCard
            label="Revenue This Year"
            value={formatCurrency(revenueThisYear)}
            sub={`${formatCurrency(stats?.totalRevenue ?? 0)} lifetime tracked`}
            icon={DollarSign}
            accent="bg-lime-50 text-lime-700"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Month-wise Trend ({selectedYear})</h2>
                <p className="text-xs text-gray-400 mt-0.5">Revenue, orders, leads, and customers by month</p>
              </div>
              <TrendingUp className="w-4 h-4 text-gray-300" />
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlySeries}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name === 'revenue' ? [formatCurrency(value), 'Revenue'] : [value, name[0].toUpperCase() + name.slice(1)]
                    }
                    contentStyle={{ borderRadius: 10, borderColor: '#e2e8f0' }}
                  />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#059669" fill="url(#revGrad)" strokeWidth={2.2} />
                  <Line yAxisId="right" type="monotone" dataKey="orders" name="orders" stroke="#2563eb" strokeWidth={2.2} dot={{ r: 2 }} activeDot={{ r: 6 }} />
                  <Line yAxisId="right" type="monotone" dataKey="leads" name="leads" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                  <Line yAxisId="right" type="monotone" dataKey="customers" name="customers" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Lead Outcome Mix</h2>
                <p className="text-xs text-gray-400 mt-0.5">Distribution for selected range</p>
              </div>
              <Target className="w-4 h-4 text-gray-300" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={leadStatusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={82} paddingAngle={3}>
                    {leadStatusData.map((entry) => (
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
                <h2 className="text-sm font-semibold text-gray-900">Year-wise Business Trend</h2>
                <p className="text-xs text-gray-400 mt-0.5">Last 5 years: revenue, leads, and orders</p>
              </div>
              <CalendarRange className="w-4 h-4 text-gray-300" />
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlySeries}>
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                  <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name === 'revenue' ? [formatCurrency(value), 'Revenue'] : [value, name[0].toUpperCase() + name.slice(1)]
                    }
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" fill="#059669" radius={[8, 8, 0, 0]} activeBar={{ fill: '#047857' }} />
                  <Bar yAxisId="right" dataKey="leads" fill="#3b82f6" radius={[8, 8, 0, 0]} activeBar={{ fill: '#2563eb' }} />
                  <Bar yAxisId="right" dataKey="orders" fill="#8b5cf6" radius={[8, 8, 0, 0]} activeBar={{ fill: '#7c3aed' }} />
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
              <h2 className="text-sm font-semibold text-gray-900">Lead Velocity (Range)</h2>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlySeries}>
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="leads" name="Leads" stroke="#3b82f6" strokeWidth={2.2} dot={{ r: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="customers" name="Customers" stroke="#10b981" strokeWidth={2.2} dot={{ r: 2 }} activeDot={{ r: 6 }} />
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
