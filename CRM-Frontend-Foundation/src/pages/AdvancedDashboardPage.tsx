import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Users,
  Target,
  Package,
  UserCheck,
  RefreshCw,
  Activity,
  MapPin,
  Calendar,
  CreditCard,
  Bell,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { dashboardApi } from '@/services';
import { useAuthStore } from '@/store/authStore';
import {
  RevenueAnalyticsSection,
  CustomerAnalyticsSection,
  SalesPipelineSection,
  ProductAnalyticsSection,
  PartnerPerformanceSection,
  SubscriptionAnalyticsSection,
  ActivityAnalyticsSection,
  GeographicAnalyticsSection,
  TimeBasedAnalyticsSection,
  FinancialHealthSection,
  DashboardAlertsSection,
} from '@/components/dashboard';

type TabKey =
  | 'overview'
  | 'revenue'
  | 'customers'
  | 'pipeline'
  | 'products'
  | 'partners'
  | 'subscriptions'
  | 'activities'
  | 'geographic'
  | 'time'
  | 'financial'
  | 'alerts';

interface TabConfig {
  key: TabKey;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const TABS: TabConfig[] = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'revenue', label: 'Revenue', icon: TrendingUp },
  { key: 'customers', label: 'Customers', icon: Users },
  { key: 'pipeline', label: 'Pipeline', icon: Target },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'partners', label: 'Partners', icon: UserCheck, adminOnly: true },
  { key: 'subscriptions', label: 'Subscriptions', icon: RefreshCw },
  { key: 'activities', label: 'Activities', icon: Activity },
  { key: 'geographic', label: 'Geographic', icon: MapPin },
  { key: 'time', label: 'Time Insights', icon: Calendar },
  // { key: 'financial', label: 'Financial', icon: CreditCard },
  // { key: 'alerts', label: 'Alerts', icon: Bell },
];

function getWishMessage(name?: string) {
  const hour = new Date().getHours();
  const firstName = (name || 'there').split(' ')[0];

  let greeting = '';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';
  else greeting = 'Good evening';

  return { greeting, name: firstName };
}

export default function AdvancedDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isPartner = user?.role === 'Partner';
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const { data: advancedStats, isLoading, error } = useQuery({
    queryKey: ['advanced-dashboard-stats'],
    queryFn: dashboardApi.getAdvancedStats,
    staleTime: 10 * 60 * 1000, // Data stays fresh for 10 minutes
    gcTime: 30 * 60 * 1000, // Cache data for 30 minutes
    refetchInterval: 5 * 60 * 1000, // Background refresh every 5 minutes
    refetchOnMount: false, // Don't refetch if data is fresh
  });

  const wishMessage = useMemo(() => getWishMessage(user?.name), [user?.name]);

  const availableTabs = useMemo(() => {
    return TABS.filter((tab) => {
      if (tab.adminOnly && isPartner) return false;
      return true;
    });
  }, [isPartner]);

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen p-6 lg:p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
            <p className="text-gray-500 mt-4">Loading advanced analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !advancedStats) {
    return (
      <div className="bg-gray-50 min-h-screen p-6 lg:p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Bell className="w-12 h-12 text-red-400 mx-auto" />
            <p className="text-red-600 mt-4 font-medium">Failed to load analytics</p>
            <p className="text-gray-500 text-sm mt-1">Please try refreshing the page</p>
          </div>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            <RevenueAnalyticsSection data={advancedStats.revenue} />
            <CustomerAnalyticsSection data={advancedStats.customers} />
            <SalesPipelineSection data={advancedStats.pipeline} />
            {/* {advancedStats.alerts && ( */}
              {/* <DashboardAlertsSection data={advancedStats.alerts} /> */}
            {/* )} */}
          </div>
        );
      case 'revenue':
        return <RevenueAnalyticsSection data={advancedStats.revenue} />;
      case 'customers':
        return <CustomerAnalyticsSection data={advancedStats.customers} />;
      case 'pipeline':
        return <SalesPipelineSection data={advancedStats.pipeline} />;
      case 'products':
        return <ProductAnalyticsSection data={advancedStats.products} />;
      case 'partners':
        return <PartnerPerformanceSection data={advancedStats.partners} />;
      case 'subscriptions':
        return <SubscriptionAnalyticsSection data={advancedStats.subscriptions} />;
      case 'activities':
        return <ActivityAnalyticsSection data={advancedStats.activities} />;
      case 'geographic':
        return <GeographicAnalyticsSection data={advancedStats.geographic} />;
      case 'time':
        return <TimeBasedAnalyticsSection data={advancedStats.timeBased} />;
      case 'financial':
        return <FinancialHealthSection data={advancedStats.financialHealth} />;
      case 'alerts':
        return <DashboardAlertsSection data={advancedStats.alerts} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="px-6 lg:px-8 py-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-100 text-indigo-700 text-lg sm:text-2xl font-bold tracking-tight mb-2 shadow-sm">
                <span>{wishMessage.greeting},</span>
                <span className="font-display">{wishMessage.name}</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                {isPartner ? 'Partner Analytics Dashboard' : 'Business Intelligence Dashboard'}
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                Comprehensive insights into your business performance
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Last updated</p>
              <p className="text-sm font-medium text-gray-600">
                {new Date(advancedStats.generatedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 lg:px-8 pb-0 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {availableTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                    isActive
                      ? 'bg-gray-50 text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 lg:p-8">
        {renderTabContent()}
      </div>
    </div>
  );
}
