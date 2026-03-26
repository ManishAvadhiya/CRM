import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MapPin, Globe, Building2 } from 'lucide-react';
import { DashboardCard, DataTable } from './DashboardCard';
import { formatCurrency } from '@/lib/utils';
import type { GeographicAnalytics } from '@/types';

interface GeographicAnalyticsSectionProps {
  data: GeographicAnalytics;
}

export function GeographicAnalyticsSection({ data }: GeographicAnalyticsSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-teal-600" />
        Geographic & Industry Insights
      </h3>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <DashboardCard title="Revenue by State" subtitle="Top performing regions" icon={<MapPin className="w-4 h-4" />}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueByState.slice(0, 8)} layout="vertical">
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="state" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="totalRevenue" fill="#14b8a6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 max-h-40 overflow-y-auto">
            <DataTable headers={['State', 'Customers', 'Orders', 'Avg Value']}>
              {data.revenueByState.slice(0, 6).map((state) => (
                <tr key={state.state} className="border-b border-gray-50">
                  <td className="py-2 px-3 font-medium text-gray-900">{state.state}</td>
                  <td className="py-2 px-3 text-gray-600">{state.customerCount}</td>
                  <td className="py-2 px-3 text-gray-600">{state.orderCount}</td>
                  <td className="py-2 px-3 font-semibold text-gray-900">{formatCurrency(state.averageOrderValue)}</td>
                </tr>
              ))}
            </DataTable>
          </div>
        </DashboardCard>

        <DashboardCard title="Top Cities" subtitle="Highest revenue generating cities" icon={<Building2 className="w-4 h-4" />}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topCities.slice(0, 8)} layout="vertical">
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="city" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="totalRevenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 max-h-40 overflow-y-auto">
            <DataTable headers={['City', 'State', 'Customers', 'Revenue']}>
              {data.topCities.slice(0, 6).map((city) => (
                <tr key={`${city.city}-${city.state}`} className="border-b border-gray-50">
                  <td className="py-2 px-3 font-medium text-gray-900">{city.city}</td>
                  <td className="py-2 px-3 text-gray-500 text-xs">{city.state}</td>
                  <td className="py-2 px-3 text-gray-600">{city.customerCount}</td>
                  <td className="py-2 px-3 font-semibold text-gray-900">{formatCurrency(city.totalRevenue)}</td>
                </tr>
              ))}
            </DataTable>
          </div>
        </DashboardCard>
      </div>

      {data.revenueByCountry.length > 1 && (
        <DashboardCard title="Revenue by Country" subtitle="International distribution" icon={<Globe className="w-4 h-4" />}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.revenueByCountry.map((country) => (
              <div key={country.country} className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-lg font-bold text-gray-900">{formatCurrency(country.totalRevenue)}</p>
                <p className="text-sm font-medium text-gray-700 mt-1">{country.country}</p>
                <p className="text-xs text-gray-500">{country.customerCount} customers</p>
              </div>
            ))}
          </div>
        </DashboardCard>
      )}
    </div>
  );
}
