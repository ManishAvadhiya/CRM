import {
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
import { Activity, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { DashboardCard, StatCard, DataTable, ProgressBar } from './DashboardCard';
import type { ActivityAnalytics } from '@/types';

interface ActivityAnalyticsSectionProps {
  data: ActivityAnalytics;
}

const TYPE_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export function ActivityAnalyticsSection({ data }: ActivityAnalyticsSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Activity className="w-5 h-5 text-pink-600" />
        Sales Activity & Productivity
      </h3>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Activities"
          value={data.totalActivities}
          sub={`${data.completedActivities} completed`}
          icon={<Activity className="w-5 h-5" />}
          accent="bg-pink-50 text-pink-600"
        />
        <StatCard
          label="Completion Rate"
          value={`${data.completionRate.toFixed(1)}%`}
          sub={`${data.pendingActivities} pending`}
          icon={<CheckCircle className="w-5 h-5" />}
          accent="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Overdue"
          value={data.overdueActivities}
          sub="Needs attention"
          icon={<AlertCircle className="w-5 h-5" />}
          accent="bg-red-50 text-red-600"
        />
        <StatCard
          label="Per Lead"
          value={data.averageActivitiesPerLead.toFixed(1)}
          sub={`${data.averageActivitiesPerCustomer.toFixed(1)} per customer`}
          icon={<Clock className="w-5 h-5" />}
          accent="bg-blue-50 text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <DashboardCard title="Activity Type Breakdown" subtitle="Distribution by type">
          <div className="flex gap-4">
            <div className="w-1/2 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.activityTypeBreakdown}
                    dataKey="count"
                    nameKey="type"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {data.activityTypeBreakdown.map((entry, index) => (
                      <Cell key={entry.type} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {data.activityTypeBreakdown.map((activity, index) => (
                <div key={activity.type} className="p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[index % TYPE_COLORS.length] }} />
                      <span className="text-xs font-medium text-gray-700">{activity.type}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-900">{activity.count}</span>
                  </div>
                  <ProgressBar
                    value={activity.completionRate}
                    color={`bg-[${TYPE_COLORS[index % TYPE_COLORS.length]}]`}
                    showLabel={false}
                  />
                  <p className="text-[10px] text-gray-500 mt-1">{activity.completed} completed · {activity.completionRate.toFixed(0)}%</p>
                </div>
              ))}
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Weekly Activity Trend" subtitle="Last 8 weeks">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.weeklyTrend}>
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="planned" name="Planned" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="completed" name="Completed" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="cancelled" name="Cancelled" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>
      </div>

      <DashboardCard title="User Productivity" subtitle="Activity completion by team member">
        <div className="max-h-64 overflow-y-auto">
          <DataTable headers={['User', 'Activities', 'Completed', 'Completion Rate']}>
            {data.userProductivity.map((user) => (
              <tr key={user.userId} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2 px-3 font-medium text-gray-900">{user.userName}</td>
                <td className="py-2 px-3 text-gray-600">{user.totalActivities}</td>
                <td className="py-2 px-3 text-emerald-600 font-semibold">{user.completedActivities}</td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={user.completionRate} showLabel={false} color="bg-emerald-500" />
                    <span className="text-xs font-semibold text-gray-700">{user.completionRate.toFixed(0)}%</span>
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
