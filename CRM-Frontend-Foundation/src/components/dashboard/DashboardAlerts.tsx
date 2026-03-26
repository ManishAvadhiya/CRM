import { AlertTriangle, Bell, Clock, CreditCard, XCircle, ChevronRight } from 'lucide-react';
import { DashboardCard, AlertBadge } from './DashboardCard';
import { formatCurrency } from '@/lib/utils';
import type { DashboardAlerts, AlertItem } from '@/types';

interface DashboardAlertsSectionProps {
  data: DashboardAlerts;
}

function AlertItemCard({ alert, icon }: { alert: AlertItem; icon: React.ReactNode }) {
  const severityColors = {
    Critical: 'border-red-200 bg-red-50',
    Warning: 'border-amber-200 bg-amber-50',
    Info: 'border-blue-200 bg-blue-50',
  };

  const severityIconColors = {
    Critical: 'text-red-500',
    Warning: 'text-amber-500',
    Info: 'text-blue-500',
  };

  return (
    <div className={`p-3 rounded-xl border ${severityColors[alert.severity as keyof typeof severityColors] || severityColors.Info}`}>
      <div className="flex items-start gap-3">
        <div className={severityIconColors[alert.severity as keyof typeof severityIconColors] || severityIconColors.Info}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{alert.title}</p>
          <p className="text-xs text-gray-600 mt-0.5">{alert.description}</p>
          {alert.amount !== undefined && alert.amount > 0 && (
            <p className="text-xs font-semibold text-gray-700 mt-1">{formatCurrency(alert.amount)}</p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </div>
    </div>
  );
}

export function DashboardAlertsSection({ data }: DashboardAlertsSectionProps) {
  const totalAlerts = data.criticalAlertCount + data.warningAlertCount + data.infoAlertCount;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Bell className="w-5 h-5 text-red-600" />
          Alerts & Action Items
        </h3>
        <div className="flex items-center gap-2">
          {data.criticalAlertCount > 0 && (
            <AlertBadge count={data.criticalAlertCount} severity="critical" label="Critical" />
          )}
          {data.warningAlertCount > 0 && (
            <AlertBadge count={data.warningAlertCount} severity="warning" label="Warning" />
          )}
          {data.infoAlertCount > 0 && (
            <AlertBadge count={data.infoAlertCount} severity="info" label="Info" />
          )}
        </div>
      </div>

      {totalAlerts === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Bell className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="text-lg font-semibold text-emerald-800">All Clear!</p>
          <p className="text-sm text-emerald-600 mt-1">No critical alerts or action items at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <DashboardCard
            title="Expiring Subscriptions"
            subtitle={`${data.expiringSubscriptions.length} requiring attention`}
            icon={<Clock className="w-4 h-4" />}
          >
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.expiringSubscriptions.length > 0 ? (
                data.expiringSubscriptions.map((alert, index) => (
                  <AlertItemCard key={index} alert={alert} icon={<Clock className="w-4 h-4" />} />
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No expiring subscriptions</p>
              )}
            </div>
          </DashboardCard>

          <DashboardCard
            title="Overdue Payments"
            subtitle={`${data.overduePayments.length} pending collection`}
            icon={<CreditCard className="w-4 h-4" />}
          >
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.overduePayments.length > 0 ? (
                data.overduePayments.map((alert, index) => (
                  <AlertItemCard key={index} alert={alert} icon={<CreditCard className="w-4 h-4" />} />
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No overdue payments</p>
              )}
            </div>
          </DashboardCard>

          <DashboardCard
            title="Stale Leads"
            subtitle={`${data.staleLeads.length} need follow-up`}
            icon={<AlertTriangle className="w-4 h-4" />}
          >
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.staleLeads.length > 0 ? (
                data.staleLeads.map((alert, index) => (
                  <AlertItemCard key={index} alert={alert} icon={<AlertTriangle className="w-4 h-4" />} />
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No stale leads</p>
              )}
            </div>
          </DashboardCard>

          <DashboardCard
            title="Overdue Activities"
            subtitle={`${data.overdueActivities.length} past due`}
            icon={<XCircle className="w-4 h-4" />}
          >
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.overdueActivities.length > 0 ? (
                data.overdueActivities.map((alert, index) => (
                  <AlertItemCard key={index} alert={alert} icon={<XCircle className="w-4 h-4" />} />
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No overdue activities</p>
              )}
            </div>
          </DashboardCard>
        </div>
      )}
    </div>
  );
}
