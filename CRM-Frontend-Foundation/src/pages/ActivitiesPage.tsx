import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Phone, Mail, Calendar, Plus, Trash2 } from 'lucide-react';
import { activitiesApi } from '@/services';
import { leadsApi } from '@/services/leadsService';
import type { ActivityListItem, CreateActivityRequest } from '@/types';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/PaginationControls';

const activityTypeMap: Record<string, number> = {
  Call: 0,
  Meeting: 1,
  Email: 2,
  Task: 3,
  Note: 4,
};

const activityTypeReverseMap: Record<number, string> = {
  0: 'Call',
  1: 'Meeting',
  2: 'Email',
  3: 'Task',
  4: 'Note',
};

const relatedTypeMap: Record<string, number> = {
  Lead: 0,
};

const relatedTypeReverseMap: Record<number, string> = {
  0: 'Lead',
  1: 'Customer',
  2: 'Order',
  3: 'Subscription',
};

function normalizeType(value: string | number): string {
  if (typeof value === 'string') return value;
  return activityTypeReverseMap[value] ?? 'Call';
}

function normalizeRelatedType(value: string | number): string {
  if (typeof value === 'string') return value;
  return relatedTypeReverseMap[value] ?? 'Lead';
}

function typeIcon(type: string) {
  if (type === 'Call') return <Phone className="h-4 w-4 text-blue-600" />;
  if (type === 'Email') return <Mail className="h-4 w-4 text-amber-600" />;
  return <Calendar className="h-4 w-4 text-emerald-600" />;
}

export default function ActivitiesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [nameSearch, setNameSearch] = useState('');
  const [formData, setFormData] = useState({
    relatedToType: 'Lead',
    relatedToId: '',
    activityType: 'Call',
    description: '',
    outcome: '',
    date: '',
    nextFollowUp: '',
  });

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activitiesApi.getAll(),
  });

  const { data: leads } = useQuery({
    queryKey: ['leads'],
    queryFn: () => leadsApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateActivityRequest) => activitiesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setShowCreate(false);
      setFormData({
        relatedToType: 'Lead',
        relatedToId: '',
        activityType: 'Call',
        description: '',
        outcome: '',
        date: '',
        nextFollowUp: '',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => activitiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });

  const nameOptions = useMemo(() => {
    return (leads ?? []).map((lead) => ({ id: lead.leadId, label: `${lead.companyName} (${lead.contactName})` }));
  }, [leads]);

  const filteredActivities = useMemo(() => {
    const list = activities ?? [];
    if (!nameSearch.trim()) return list;

    const term = nameSearch.toLowerCase();
    return list.filter((item) => item.name.toLowerCase().includes(term));
  }, [activities, nameSearch]);

  const pagination = usePagination(filteredActivities, 10);

  const submitCreate = () => {
    if (!formData.relatedToId || !formData.date || !formData.description.trim()) {
      alert('Name, description and date are required');
      return;
    }

    createMutation.mutate({
      relatedToType: relatedTypeMap[formData.relatedToType],
      relatedToId: Number(formData.relatedToId),
      activityType: activityTypeMap[formData.activityType],
      description: formData.description.trim(),
      outcome: formData.outcome.trim() || undefined,
      activityDate: new Date(formData.date).toISOString(),
      dueDate: formData.nextFollowUp ? new Date(formData.nextFollowUp).toISOString() : undefined,
      status: 0,
      priority: 1,
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Activities</h1>
            <p className="text-sm text-gray-500 mt-0.5">Calls, emails and meetings tracked for leads and customers.</p>
          </div>
          <button
            onClick={() => setShowCreate((prev) => !prev)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Activity
          </button>
        </div>

        {showCreate && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Create Activity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Name Source</label>
                <select
                  value={formData.relatedToType}
                  onChange={(e) => setFormData((prev) => ({ ...prev, relatedToType: e.target.value, relatedToId: '' }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="Lead">Lead</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Name</label>
                <select
                  value={formData.relatedToId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, relatedToId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="">Select Name</option>
                  {nameOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Type</label>
                <select
                  value={formData.activityType}
                  onChange={(e) => setFormData((prev) => ({ ...prev, activityType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="Call">Call</option>
                  <option value="Email">Email</option>
                  <option value="Meeting">Meeting</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Date</label>
                <input
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Next Follow-up</label>
                <input
                  type="datetime-local"
                  value={formData.nextFollowUp}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nextFollowUp: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Outcome</label>
                <input
                  type="text"
                  value={formData.outcome}
                  onChange={(e) => setFormData((prev) => ({ ...prev, outcome: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="Interested / Callback required / Closed"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  rows={3}
                  placeholder="Write activity notes"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={submitCreate}
                disabled={createMutation.isPending}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
              >
                {createMutation.isPending ? 'Saving...' : 'Save Activity'}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <input
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              placeholder="Search by lead/customer name"
              className="w-full sm:max-w-sm px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Sr No', 'Name', 'Type', 'Description', 'Outcome', 'Date', 'Next Follow-up', 'Created By', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-400">Loading activities...</td>
                  </tr>
                ) : filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-400">No activities found</td>
                  </tr>
                ) : (
                  pagination.paginatedItems.map((activity: ActivityListItem, index: number) => {
                    const activityType = normalizeType(activity.type);
                    const relatedType = normalizeRelatedType(activity.relatedToType);
                    const rowNumber = (pagination.currentPage - 1) * pagination.itemsPerPage + index + 1;
                    return (
                      <tr key={activity.activityId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-700">{rowNumber}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{activity.name}</p>
                          <p className="text-xs text-gray-400">{relatedType}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-gray-200 text-xs text-gray-700 bg-gray-50">
                            {typeIcon(activityType)}
                            {activityType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 max-w-[280px] truncate">{activity.description || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{activity.outcome || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{new Date(activity.date).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{activity.nextFollowUp ? new Date(activity.nextFollowUp).toLocaleString() : '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{activity.createdBy}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => deleteMutation.mutate(activity.activityId)}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50"
                            title="Delete activity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredActivities.length > 0 && (
            <div className="px-5 py-4 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between flex-col sm:flex-row gap-4">
              <p className="text-sm text-gray-500">
                Showing <span className="font-semibold">{(pagination.currentPage - 1) * pagination.itemsPerPage + 1}</span> to <span className="font-semibold">{Math.min(pagination.currentPage * pagination.itemsPerPage, filteredActivities.length)}</span> of <span className="font-semibold">{filteredActivities.length}</span> activities
              </p>
              <PaginationControls
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                itemsPerPage={pagination.itemsPerPage}
                totalItems={filteredActivities.length}
                onPageChange={pagination.goToPage}
                onItemsPerPageChange={pagination.setItemsPerPage}
                pageNumbers={pagination.pageNumbers}
                hasNextPage={pagination.currentPage < pagination.totalPages}
                hasPreviousPage={pagination.currentPage > 1}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
