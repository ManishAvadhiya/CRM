import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { leadsApi } from '../services/leadsService';
import { ordersApi } from '../services';
import { Lead, Order } from '../types';
import { getOrderStatusString } from '../lib/enum-mappings';

export const PartnerDashboard = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'leads' | 'orders'>('leads');

  // Fetch all leads - will be filtered by backend to only show partner's leads
  const { data: allLeads, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => leadsApi.getAll(),
  });

  // Fetch all orders - will be filtered by backend to only show partner's orders
  const { data: allOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.getAll(),
  });

  useEffect(() => {
    if (allLeads) {
      setLeads(allLeads);
    }
  }, [allLeads]);

  useEffect(() => {
    if (allOrders) {
      setOrders(allOrders);
    }
  }, [allOrders]);

  const leadsStats = {
    total: leads.length,
    active: leads.filter(l => l.status === 'New' || l.status === 'Demo').length,
    converted: leads.filter(l => l.status === 'Converted').length,
    lost: leads.filter(l => l.status === 'Lost').length,
  };

  const ordersStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'Pending' || o.status === 1).length,
    confirmed: orders.filter(o => o.status === 'Confirmed' || o.status === 2).length,
    completed: orders.filter(o => o.status === 'Delivered' || o.status === 3).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-600 mt-1">View your leads and orders</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Leads Stats */}
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total Leads</p>
          <p className="text-2xl font-bold text-gray-900">{leadsStats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Active Leads</p>
          <p className="text-2xl font-bold text-blue-600">{leadsStats.active}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">{ordersStats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Completed Orders</p>
          <p className="text-2xl font-bold text-green-600">{ordersStats.completed}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('leads')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'leads'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            My Leads ({leads.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'orders'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            My Orders ({orders.length})
          </button>
        </div>
      </div>

      {/* Leads Section */}
      {activeTab === 'leads' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Company</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leadsLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Loading leads...
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No leads found
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.leadId} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-900">{lead.contactName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{lead.companyName || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{lead.email || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-white text-xs font-medium ${
                          lead.status === 'New' || lead.status === 'Demo' ? 'bg-blue-600' :
                          lead.status === 'Converted' ? 'bg-green-600' :
                          'bg-red-600'
                        }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-white text-xs font-medium ${
                          lead.rating === 'Hot' ? 'bg-red-600' :
                          lead.rating === 'Warm' ? 'bg-yellow-600' :
                          'bg-green-600'
                        }`}>
                          {lead.rating || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders Section */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Customer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Order Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ordersLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Loading orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.orderId} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-900">#{order.orderId}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{order.customerId}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        ${order.totalAmount?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-white text-xs font-medium ${
                          getOrderStatusString(order.status) === 'Pending' ? 'bg-yellow-600' :
                          getOrderStatusString(order.status) === 'Confirmed' ? 'bg-blue-600' :
                          'bg-green-600'
                        }`}>
                          {getOrderStatusString(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerDashboard;
