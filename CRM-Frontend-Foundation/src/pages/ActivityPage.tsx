import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activitiesApi } from '@/services';
import { leadsApi } from '@/services/leadsService';
import { formatDate } from '@/lib/utils';
import type { ActivityListItem, ActivityType, ActivityPriority, ActivityStatus } from '@/types';
import {
  Plus,
  Search,
  Trash2,
  Phone,
  Mail,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Eye,
} from 'lucide-react';

// ─── helpers ─────────────────────────────────────────────────────────────────

const ACTIVITY_TYPES_DATA = [
  { type: 'Call', icon: Phone, color: 'bg-blue-500', label: 'Calls' },
  { type: 'Email', icon: Mail, color: 'bg-purple-500', label: 'Emails' },
  { type: 'Meeting', icon: Users, color: 'bg-green-500', label: 'Meetings' },
];

function getActivityTypeIcon(type: ActivityType | number) {
  const typeStr = getActivityTypeLabel(type);
  return ACTIVITY_TYPES_DATA.find(a => a.type === typeStr);
}

function getActivityTypeLabel(type: ActivityType | number) {
  if (typeof type === 'string') return type;
  return ActivityTypeMapReverse[type] ?? `Type ${type}`;
}

function getStatusBadgeColors(status: ActivityStatus | number) {
  const statusStr = typeof status === 'string' ? status : Object.values(ActivityStatus)[status as number];
  const colors: Record<string, string> = {
    'Planned': 'bg-gray-100 text-gray-700 border-gray-200',
    'InProgress': 'bg-blue-100 text-blue-700 border-blue-200',
    'Completed': 'bg-green-100 text-green-700 border-green-200',
    'Cancelled': 'bg-red-100 text-red-700 border-red-200',
  };
  return colors[statusStr] || colors['Planned'];
}

function getPriorityBadgeColors(priority: ActivityPriority | number) {
  const prioStr = typeof priority === 'string' ? priority : Object.values(ActivityPriority)[priority as number];
  const colors: Record<string, string> = {
    'Low': 'bg-gray-100 text-gray-700',
    'Medium': 'bg-blue-100 text-blue-700',
    'High': 'bg-orange-100 text-orange-700',
    'Urgent': 'bg-red-100 text-red-700',
  };
  return colors[prioStr] || colors['Medium'];
}

// ─── slide-in panel ───────────────────────────────────────────────────────────

interface PanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function SlidePanel({ open, onClose, title, subtitle, children }: PanelProps) {
  if (!open) return null;
  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        </div>
      </div>
    </>
  );
}

// ─── delete confirmation modal ─────────────────────────────────────────────────

interface DeleteModalProps {
  open: boolean;
  activity: ActivityListItem | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

function DeleteModal({ open, activity, onConfirm, onCancel, isLoading }: DeleteModalProps) {
  if (!open) return null;

  return (
    <>
      <div
        onClick={onCancel}
        className="fixed inset-0 bg-black/40 z-50 transition-opacity opacity-100 pointer-events-auto"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
        <div
          className="bg-white rounded-lg shadow-lg max-w-sm w-full mx-4 transition-transform scale-100"
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900">Delete Activity</h3>
            <p className="text-gray-500 mt-2">
              Are you sure you want to delete this activity? This action cannot be undone.
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">{activity?.name}</span> - {activity ? getActivityTypeLabel(activity.type as any) : '-'}
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition disabled:opacity-50"
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function ActivityPage() {
  const queryClient = useQueryClient();

  // State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedType, setSelectedType] = useState<string | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<ActivityListItem | null>(null);
  const [deleteActivity, setDeleteActivity] = useState<ActivityListItem | null>(null);
  const [createForm, setCreateForm] = useState({
    relatedToId: '',
    activityType: 'Call',
    description: '',
    outcome: '',
    activityDate: '',
    nextFollowUp: '',
  });

  // Queries
  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activitiesApi.getAll(),
    staleTime: 30000,
  });

  const { data: leads } = useQuery({
    queryKey: ['leads'],
    queryFn: () => leadsApi.getAll(),
    staleTime: 30000,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: () => {
      return activitiesApi.create({
        relatedToType: 0, // Always Lead
        relatedToId: Number(createForm.relatedToId),
        activityType: ActivityTypeMap[createForm.activityType] ?? 0,
        description: createForm.description.trim(),
        outcome: createForm.outcome.trim() || undefined,
        activityDate: new Date(createForm.activityDate).toISOString(),
        dueDate: createForm.nextFollowUp
          ? new Date(createForm.nextFollowUp).toISOString()
          : undefined,
        status: 0,
        priority: 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setShowCreateForm(false);
      setCreateForm({
        relatedToId: '',
        activityType: 'Call',
        description: '',
        outcome: '',
        activityDate: '',
        nextFollowUp: '',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => activitiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setDeleteActivity(null);
    },
  });

  // Filtering and search
  const filteredActivities = useMemo(() => {
    if (!activities) return [];

    let filtered = activities;

    // Filter by type
    if (selectedType) {
      filtered = filtered.filter(a => getActivityTypeLabel(a.type as any) === selectedType);
    }

    // Filter by search term
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.name?.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        a.outcome?.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [activities, selectedType, searchTerm]);

  // Count activities by type
  const typeCounts = useMemo(() => {
    if (!activities) return {};
    return Object.fromEntries(
      ACTIVITY_TYPES_DATA.map(({ type }) => [
        type,
        activities.filter(a => getActivityTypeLabel(a.type as any) === type).length
      ])
    );
  }, [activities]);


  const handleCreateActivity = () => {
    if (!createForm.relatedToId || !createForm.activityDate || !createForm.description.trim()) {
      alert('Name, Date, and Description are required.');
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6 lg:p-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track all calls, emails, and meetings with your leads and customers</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Activity
        </button>
      </div>

      {/* ACTIVITY TYPE FILTER CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {ACTIVITY_TYPES_DATA.map(({ type, icon: Icon, color, label }) => (
          <button
            key={type}
            onClick={() => setSelectedType(selectedType === type ? undefined : type)}
            className={`p-4 rounded-xl border-2 transition ${
              selectedType === type
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-2 text-white`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-gray-900">{label}</p>
            <p className="text-xs text-gray-500 mt-1">{typeCounts[type] || 0} activities</p>
          </button>
        ))}
      </div>

      {/* SEARCH */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search activities by name, description, or outcome..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1220px] text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Sr No</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Name</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Type</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Description</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Outcome</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Date</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Next Follow-up</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Created By</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    Loading activities...
                  </td>
                </tr>
              ) : filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    {activities && activities.length === 0
                      ? 'No activities found. Start by creating your first activity.'
                      : 'No activities match your filters.'}
                  </td>
                </tr>
              ) : (
                filteredActivities.map((activity, index) => {
                  const typeInfo = getActivityTypeIcon(activity.type);
                  const TypeIcon = typeInfo?.icon;
                  return (
                    <tr key={activity.activityId} className="hover:bg-gray-50/70 transition">
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{index + 1}</td>
                      <td className="px-6 py-4 min-w-[220px]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xs">
                            {activity.name?.charAt(0) || 'A'}
                          </div>
                          <span className="font-medium text-gray-900 whitespace-nowrap">{activity.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 min-w-[140px] whitespace-nowrap">
                        {TypeIcon && (
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded ${typeInfo?.color} flex items-center justify-center text-white`}>
                              <TypeIcon className="w-3 h-3" />
                            </div>
                            <span className="font-medium text-gray-700">{typeInfo?.type}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600 min-w-[270px] max-w-[340px]">{activity.description || '—'}</td>
                      <td className="px-6 py-4 text-gray-600 min-w-[220px] max-w-[280px]">{activity.outcome || '—'}</td>
                      <td className="px-6 py-4 font-medium text-gray-700 whitespace-nowrap">{formatDate(activity.date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {activity.nextFollowUp ? (
                          <span className="text-gray-700">{formatDate(activity.nextFollowUp)}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600 min-w-[180px]">{activity.createdBy}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedActivity(activity)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors font-bold"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteActivity(activity)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors font-bold"
                            title="Delete activity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      <DeleteModal
        open={deleteActivity !== null}
        activity={deleteActivity}
        onConfirm={() => deleteActivity && deleteMutation.mutate(deleteActivity.activityId)}
        onCancel={() => setDeleteActivity(null)}
        isLoading={deleteMutation.isPending}
      />

      <SlidePanel
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Create Activity"
      >
        <div className="space-y-6">
          {/* Basic Information Section */}
          <section className="space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Basic Information</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Lead <span className="text-red-400">*</span>
                </label>
                <select
                  value={createForm.relatedToId}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, relatedToId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                >
                  <option value="">Select lead</option>
                  {(leads ?? []).map((lead) => (
                    <option key={lead.leadId} value={lead.leadId}>
                      {lead.companyName} ({lead.contactName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Activity Type <span className="text-red-400">*</span>
                </label>
                <select
                  value={createForm.activityType}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, activityType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                >
                  <option value="Call">Call</option>
                  <option value="Email">Email</option>
                  <option value="Meeting">Meeting</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={createForm.activityDate}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, activityDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Next Follow-up</label>
                <input
                  type="datetime-local"
                  value={createForm.nextFollowUp}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, nextFollowUp: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Details Section */}
          <section className="space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Details</p>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                rows={3}
                placeholder="Write activity notes..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Outcome</label>
              <input
                type="text"
                value={createForm.outcome}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, outcome: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                placeholder="Interested / Callback required / Closed"
              />
            </div>
          </section>

          {/* Submit Button */}
          <button
            onClick={handleCreateActivity}
            disabled={createMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
          >
            {createMutation.isPending ? (
              <><div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving...</>
            ) : (
              <><Plus className="h-4 w-4" />Save Activity</>
            )}
          </button>
        </div>
      </SlidePanel>

      {/* DETAIL PANEL */}
      <SlidePanel
        open={selectedActivity !== null}
        onClose={() => setSelectedActivity(null)}
        title="Activity Details"
      >
        {selectedActivity && (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Name</p>
              <p className="text-gray-900 font-medium">{selectedActivity.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Type</p>
                <p className="text-gray-900">{getActivityTypeLabel(selectedActivity.type as any)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Created By</p>
                <p className="text-gray-900">{selectedActivity.createdBy}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description</p>
              <p className="text-gray-700">{selectedActivity.description || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Outcome</p>
              <p className="text-gray-700">{selectedActivity.outcome || '—'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Date</p>
                <p className="text-gray-900">{formatDate(selectedActivity.date)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Next Follow-up</p>
                <p className="text-gray-900">{selectedActivity.nextFollowUp ? formatDate(selectedActivity.nextFollowUp) : '—'}</p>
              </div>
            </div>
          </div>
        )}
      </SlidePanel>
    </div>
  );
}

// TypeScript enum refs (for type-safe typing)
const ActivityType = {
  Call: 'Call',
  Meeting: 'Meeting',
  Email: 'Email',
  Task: 'Task',
  Note: 'Note',
} as const;

const ActivityStatus = {
  Planned: 'Planned',
  InProgress: 'InProgress',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
} as const;

const ActivityPriority = {
  Low: 'Low',
  Medium: 'Medium',
  High: 'High',
  Urgent: 'Urgent',
} as const;

const ActivityTypeMap: Record<string, number> = {
  Call: 0,
  Meeting: 1,
  Email: 2,
  Task: 3,
  Note: 4,
};

const ActivityTypeMapReverse: Record<number, string> = {
  0: 'Call',
  1: 'Meeting',
  2: 'Email',
  3: 'Task',
  4: 'Note',
};
