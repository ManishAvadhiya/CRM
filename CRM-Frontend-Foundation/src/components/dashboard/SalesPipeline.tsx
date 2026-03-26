import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Target, TrendingUp, Clock, XCircle } from 'lucide-react';
import { DashboardCard, StatCard, DataTable, ProgressBar } from './DashboardCard';
import { formatCurrency } from '@/lib/utils';
import type { SalesPipeline } from '@/types';

interface SalesPipelineSectionProps {
  data: SalesPipeline;
}

const STAGE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f43f5e'];
const SOURCE_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export function SalesPipelineSection({ data }: SalesPipelineSectionProps) {
  const funnelData = data.pipelineStages.map((stage, index) => ({
    name: stage.stage,
    value: stage.count,
    fill: STAGE_COLORS[index % STAGE_COLORS.length],
  }));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Target className="w-5 h-5 text-blue-600" />
        Sales Performance & Pipeline
      </h3>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Pipeline Value"
          value={formatCurrency(data.totalPipelineValue)}
          sub={`${data.totalLeadsInPipeline} leads in pipeline`}
          icon={<Target className="w-5 h-5" />}
          accent="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Win Rate"
          value={`${data.winRate.toFixed(1)}%`}
          sub={`Loss rate: ${data.lossRate.toFixed(1)}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          accent="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Avg Deal Size"
          value={formatCurrency(data.averageDealSize)}
          sub="Per converted lead"
          icon={<Target className="w-5 h-5" />}
          accent="bg-violet-50 text-violet-600"
        />
        <StatCard
          label="Sales Cycle"
          value={`${data.averageSalesCycleDays.toFixed(0)} days`}
          sub="Lead to conversion"
          icon={<Clock className="w-5 h-5" />}
          accent="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <DashboardCard title="Sales Funnel" subtitle="Lead progression stages">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip formatter={(value: number, name: string) => [value, name]} />
                <Funnel
                  dataKey="value"
                  data={funnelData}
                  isAnimationActive
                >
                  <LabelList position="center" fill="#fff" stroke="none" dataKey="name" fontSize={12} />
                  {funnelData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>

        <DashboardCard title="Pipeline Stages" subtitle="Lead count and value by stage" className="xl:col-span-2">
          <div className="space-y-3">
            {data.pipelineStages.map((stage, index) => (
              <div key={stage.stage} className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STAGE_COLORS[index % STAGE_COLORS.length] }} />
                    <span className="font-semibold text-gray-900">{stage.stage}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{stage.count} leads</span>
                    <span className="text-xs text-gray-500 ml-2">{formatCurrency(stage.value)}</span>
                  </div>
                </div>
                {stage.conversionToNext > 0 && (
                  <ProgressBar
                    value={stage.conversionToNext}
                    color={STAGE_COLORS[index % STAGE_COLORS.length].replace('#', 'bg-[')}
                    label={`Conversion: ${stage.conversionToNext.toFixed(1)}%`}
                  />
                )}
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <DashboardCard title="Lead Source Performance" subtitle="Conversion by acquisition channel">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.leadSourcePerformance}>
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis dataKey="source" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="leadCount" name="Leads" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="convertedCount" name="Converted" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 max-h-40 overflow-y-auto">
            <DataTable headers={['Source', 'Conversion', 'Revenue', 'Cycle']}>
              {data.leadSourcePerformance.map((source) => (
                <tr key={source.source} className="border-b border-gray-50">
                  <td className="py-2 px-3 font-medium text-gray-900">{source.source}</td>
                  <td className="py-2 px-3">
                    <span className={`font-semibold ${source.conversionRate >= 30 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {source.conversionRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2 px-3 text-gray-700">{formatCurrency(source.totalRevenue)}</td>
                  <td className="py-2 px-3 text-gray-500">{source.averageSalesCycleDays.toFixed(0)}d</td>
                </tr>
              ))}
            </DataTable>
          </div>
        </DashboardCard>

        <DashboardCard title="Lost Opportunity Analysis" subtitle="Understanding why deals are lost">
          <div className="flex gap-4">
            <div className="w-1/2 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.lostReasonAnalysis}
                    dataKey="count"
                    nameKey="reason"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {data.lostReasonAnalysis.map((_, index) => (
                      <Cell key={index} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {data.lostReasonAnalysis.slice(0, 5).map((reason, index) => (
                <div key={reason.reason} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SOURCE_COLORS[index % SOURCE_COLORS.length] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{reason.reason || 'Not specified'}</p>
                    <p className="text-[10px] text-gray-500">{reason.count} leads · {formatCurrency(reason.lostValue)}</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-600">{reason.percentage.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 p-3 bg-amber-50 rounded-xl flex items-start gap-2">
            <XCircle className="w-4 h-4 text-amber-600 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-800">Demo to Conversion Rate</p>
              <p className="text-lg font-bold text-amber-700">{data.demoToConversionRate.toFixed(1)}%</p>
            </div>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
