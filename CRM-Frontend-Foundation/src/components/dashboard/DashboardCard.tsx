import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function DashboardCard({
  title,
  subtitle,
  icon,
  children,
  className,
  action,
}: DashboardCardProps) {
  return (
    <div className={cn('bg-white rounded-2xl border border-gray-100 shadow-sm p-5', className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            {icon && <span className="text-gray-400">{icon}</span>}
            <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          </div>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  accent?: string;
  trend?: {
    value: number;
    label?: string;
  };
}

export function StatCard({ label, value, sub, icon, accent, trend }: StatCardProps) {
  const trendColor = trend && trend.value >= 0 ? 'text-emerald-600' : 'text-red-600';
  const trendIcon = trend && trend.value >= 0 ? '↑' : '↓';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      {icon && (
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', accent)}>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
          {trend && (
            <span className={cn('text-xs font-medium', trendColor)}>
              {trendIcon} {Math.abs(trend.value).toFixed(1)}%
              {trend.label && <span className="text-gray-400 ml-1">{trend.label}</span>}
            </span>
          )}
        </div>
        {sub && <p className="text-xs text-gray-400 mt-1 truncate">{sub}</p>}
      </div>
    </div>
  );
}

interface MiniStatProps {
  label: string;
  value: string | number;
  color?: string;
}

export function MiniStat({ label, value, color = 'text-gray-900' }: MiniStatProps) {
  return (
    <div className="text-center p-3 bg-gray-50 rounded-xl">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={cn('text-lg font-bold mt-0.5', color)}>{value}</p>
    </div>
  );
}

interface AlertBadgeProps {
  count: number;
  severity: 'critical' | 'warning' | 'info';
  label: string;
}

export function AlertBadge({ count, severity, label }: AlertBadgeProps) {
  const colors = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  return (
    <div className={cn('px-3 py-1.5 rounded-lg border text-xs font-medium', colors[severity])}>
      {count} {label}
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  showLabel?: boolean;
  label?: string;
}

export function ProgressBar({
  value,
  max = 100,
  color = 'bg-indigo-500',
  showLabel = true,
  label,
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex justify-between text-xs mb-1">
          {label && <span className="text-gray-600">{label}</span>}
          {showLabel && <span className="text-gray-500 font-medium">{percentage.toFixed(0)}%</span>}
        </div>
      )}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface DataTableProps {
  headers: string[];
  children: ReactNode;
}

export function DataTable({ headers, children }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {headers.map((header, index) => (
              <th
                key={index}
                className="text-left py-2 px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
