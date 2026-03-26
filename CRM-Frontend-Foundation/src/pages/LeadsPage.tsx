import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '@/services/leadsService';
import { customersApi } from '@/services';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import type { Lead } from '@/types';
import { Users, Plus, Search, Eye, Edit, Trash2, UserPlus, TrendingUp, CheckCircle, Clock, XCircle, X } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/PaginationControls';

// ─── design helpers ──────────────────────────────────────────────────────────
const AVATAR_COLORS = ['bg-violet-500','bg-blue-500','bg-emerald-500','bg-amber-500','bg-rose-500'];
function avatarColor(name: string) { let h = 0; for (const c of name) h += c.charCodeAt(0); return AVATAR_COLORS[h % AVATAR_COLORS.length]; }
function initials(name: string) { return name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase(); }
const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function SlidePanel({ open, onClose, title, subtitle, children }: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </div>
      </div>
    </>
  );
}

function ConvertLeadModal({
  open,
  lead,
  formData,
  onChange,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean;
  lead: Lead | null;
  formData: Record<string, string>;
  onChange: (patch: Record<string, string>) => void;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  if (!open || !lead) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[88vh] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">Convert Lead to Customer</h3>
            <p className="text-xs text-gray-400 mt-0.5">Fill details and confirm conversion for {lead.companyName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="space-y-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Basic Information</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Company Name" required>
                <input
                  type="text"
                  value={formData.companyName || ''}
                  onChange={e => onChange({ companyName: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Contact Person" required>
                <input
                  type="text"
                  value={formData.contactPerson || ''}
                  onChange={e => onChange({ contactPerson: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={e => onChange({ email: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Phone">
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={e => onChange({ phone: e.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Billing Address</p>
            <Field label="Address">
              <textarea
                value={formData.billingAddress || ''}
                onChange={e => onChange({ billingAddress: e.target.value })}
                className={inputCls}
                rows={2}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City">
                <input type="text" value={formData.billingCity || ''} onChange={e => onChange({ billingCity: e.target.value })} className={inputCls} />
              </Field>
              <Field label="State">
                <input type="text" value={formData.billingState || ''} onChange={e => onChange({ billingState: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Postal Code">
                <input type="text" value={formData.billingPostalCode || ''} onChange={e => onChange({ billingPostalCode: e.target.value })} className={inputCls} />
              </Field>
              <Field label="GST Number">
                <input type="text" value={formData.gstNumber || ''} onChange={e => onChange({ gstNumber: e.target.value })} className={inputCls} />
              </Field>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 p-4 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isPending} className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {isPending ? 'Converting...' : 'Confirm Conversion'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ lead, onConfirm, onCancel, isPending }: { lead: Lead; onConfirm: () => void; onCancel: () => void; isPending: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-base font-bold text-gray-900 text-center mb-1">Delete Lead</h3>
        <p className="text-sm text-gray-500 text-center mb-6">Delete <span className="font-semibold text-gray-700">{lead.companyName}</span>? This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
          <button onClick={onConfirm} disabled={isPending} className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors">
            {isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── badge helpers ────────────────────────────────────────────────────────────
function statusBadgeCls(statusStr: string) {
  switch (statusStr) {
    case 'Converted': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Demo': return 'bg-violet-50 text-violet-700 border-violet-200';
    case 'Lost': return 'bg-red-50 text-red-600 border-red-200';
    default: return 'bg-blue-50 text-blue-700 border-blue-200';
  }
}
function ratingBadge(ratingStr: string) {
  switch (ratingStr) {
    case 'Hot': return '🔥';
    case 'Warm': return '🌡️';
    case 'Cold': return '❄️';
    default: return '';
  }
}

// ─── lead form ────────────────────────────────────────────────────────────────
function LeadForm({ data, onChange, onSubmit, isPending, mode }: {
  data: Partial<Lead>; onChange: (d: Partial<Lead>) => void; onSubmit: () => void; isPending: boolean; mode: 'create' | 'edit';
}) {
  const up = (patch: Partial<Lead>) => onChange({ ...data, ...patch });
  const isStatusLocked = mode === 'edit' && (data.status as unknown as string) === 'Lost';
  return (
    <div className="space-y-5">
      {/* Required */}
      <div className="space-y-3">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Required</p>
        <Field label="Company Name" required>
          <input type="text" value={data.companyName || ''} onChange={e => up({ companyName: e.target.value })} className={inputCls} placeholder="Acme Corp" />
        </Field>
        <Field label="Contact Person" required>
          <input type="text" value={data.contactName || ''} onChange={e => up({ contactName: e.target.value })} className={inputCls} placeholder="Jane Doe" />
        </Field>
      </div>

      {/* Contact */}
      <div className="space-y-3">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Contact Info</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email">
            <input type="email" value={data.email || ''} onChange={e => up({ email: e.target.value })} className={inputCls} placeholder="john@acme.com" />
          </Field>
          <Field label="Phone">
            <input type="tel" value={data.phone || ''} onChange={e => up({ phone: e.target.value })} className={inputCls} placeholder="+91 ..." />
          </Field>
        </div>
        <Field label="Website">
          <input type="text" value={data.website || ''} onChange={e => up({ website: e.target.value })} className={inputCls} placeholder="www.acme.com" />
        </Field>
      </div>

      {/* Business */}
      <div className="space-y-3">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Business</p>
        <Field label="Industry">
          <input type="text" value={data.industry || ''} onChange={e => up({ industry: e.target.value })} className={inputCls} placeholder="Technology" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Lead Source">
            <select value={(data.leadSource as unknown as string) || ''} onChange={e => up({ leadSource: (e.target.value || undefined) as any })} className={inputCls}>
              <option value="">Select</option>
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="ColdCall">Cold Call</option>
              <option value="Campaign">Campaign</option>
              <option value="SocialMedia">Social Media</option>
              <option value="Other">Other</option>
            </select>
          </Field>
          <Field label="Rating">
            <select value={(data.rating as unknown as string) || ''} onChange={e => up({ rating: (e.target.value || undefined) as any })} className={inputCls}>
              <option value="">Select</option>
              <option value="Hot">🔥 Hot</option>
              <option value="Warm">🌡️ Warm</option>
              <option value="Cold">❄️ Cold</option>
            </select>
          </Field>
        </div>
      </div>

      {/* Pipeline */}
      <div className="space-y-3">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pipeline</p>
        <Field label="Status">
          <select
            value={(data.status as unknown as string) || 'New'}
            onChange={e => up({ status: e.target.value as any })}
            className={inputCls}
            disabled={isStatusLocked}
            title={isStatusLocked ? 'Lost leads cannot change status' : undefined}
          >
            <option value="New">New</option>
            <option value="Demo">Demo</option>
            <option value="Converted">Converted</option>
            <option value="Lost">Lost</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Estimated Value (₹)">
            <input type="number" value={data.estimatedValue || ''} onChange={e => up({ estimatedValue: e.target.value ? Number(e.target.value) : undefined })} className={inputCls} placeholder="0" />
          </Field>
          <Field label="Close Date">
            <input type="date" value={data.expectedCloseDate ? data.expectedCloseDate.split('T')[0] : ''} onChange={e => up({ expectedCloseDate: e.target.value ? `${e.target.value}T00:00:00Z` : undefined })} className={inputCls} />
          </Field>
        </div>
      </div>

      {/* Notes */}
      <Field label="Notes">
        <textarea value={data.notes || ''} onChange={e => up({ notes: e.target.value })} className={inputCls} rows={3} placeholder="Additional notes..." />
      </Field>

      <button
        onClick={onSubmit}
        disabled={isPending}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50 transition-colors"
      >
        {isPending ? (mode === 'create' ? 'Creating...' : 'Saving...') : (mode === 'create' ? 'Create Lead' : 'Save Changes')}
      </button>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
const STATUS_FILTERS = ['All', 'New', 'Demo', 'Converted', 'Lost'];

export default function LeadsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const showAuditColumns = user?.role === 'ManagementAdmin' || user?.role === 'Marketing';
  const queryClient = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteLead, setDeleteLead] = useState<Lead | null>(null);
  const [convertLead, setConvertLead] = useState<Lead | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [convertFormData, setConvertFormData] = useState<Record<string, string>>({});

  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => leadsApi.getAll(),
    staleTime: 30000,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Lead>) => leadsApi.create(data),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['leads'] }); 
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsCreateOpen(false); 
      setFormData({}); 
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Lead>) => leadsApi.update(selectedLead!.leadId, data),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsEditOpen(false); 
      setSelectedLead(null); 
      setFormData({}); 
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => leadsApi.delete(id),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setDeleteLead(null); 
      setSelectedLead(null); 
    },
  });

  const convertMutation = useMutation({
    mutationFn: async ({ leadId, customerData }: { leadId: number; customerData: any }) => {
      await customersApi.create(customerData);
      await leadsApi.updateStatus(leadId, { status: 'Converted' });
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['leads'] }); 
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setSelectedLead(null);
      setConvertLead(null);
      setConvertFormData({});
    },
  });

  // Enum mappings
  const statusMap: Record<string, number> = { 'New': 0, 'Demo': 1, 'Converted': 2, 'Lost': 3 };
  const statusReverseMap: Record<number, string> = { 0: 'New', 1: 'Demo', 2: 'Converted', 3: 'Lost' };
  const leadSourceMap: Record<string, number> = { 'Website': 0, 'Referral': 1, 'ColdCall': 2, 'Campaign': 3, 'SocialMedia': 4, 'Other': 5 };
  const leadSourceReverseMap: Record<number, string> = { 0: 'Website', 1: 'Referral', 2: 'ColdCall', 3: 'Campaign', 4: 'SocialMedia', 5: 'Other' };
  const ratingMap: Record<string, number> = { 'Hot': 0, 'Warm': 1, 'Cold': 2 };
  const ratingReverseMap: Record<number, string> = { 0: 'Hot', 1: 'Warm', 2: 'Cold' };

  const getStatusDisplay = (value: any) => statusReverseMap[Number(value)] || 'Unknown';
  const getSourceDisplay = (value: any) => leadSourceReverseMap[Number(value)] || 'N/A';
  const getRatingDisplay = (value: any) => ratingReverseMap[Number(value)] || 'N/A';

  const leadCounts = useMemo(() => {
    if (!leads) return { New: 0, Demo: 0, Converted: 0, Lost: 0, total: 0 };
    return {
      New: leads.filter(l => getStatusDisplay(l.status) === 'New').length,
      Demo: leads.filter(l => getStatusDisplay(l.status) === 'Demo').length,
      Converted: leads.filter(l => getStatusDisplay(l.status) === 'Converted').length,
      Lost: leads.filter(l => getStatusDisplay(l.status) === 'Lost').length,
      total: leads.length,
    };
  }, [leads]);

  const handleCreate = () => {
    if (!formData.companyName?.trim() || !formData.contactName?.trim()) { alert('Company Name and Contact Name are required'); return; }
    createMutation.mutate({
      companyName: formData.companyName.trim(),
      contactName: formData.contactName.trim(),
      email: formData.email?.trim() || undefined,
      phone: formData.phone?.trim() || undefined,
      website: formData.website?.trim() || undefined,
      industry: formData.industry?.trim() || undefined,
      status: statusMap[(formData.status as unknown as string) || 'New'] as unknown as Lead['status'],
      notes: formData.notes?.trim() || undefined,
      leadSource: formData.leadSource ? leadSourceMap[formData.leadSource as unknown as string] as unknown as Lead['leadSource'] : undefined,
      rating: formData.rating ? ratingMap[formData.rating as unknown as string] as unknown as Lead['rating'] : undefined,
      assignedTo: formData.assignedTo,
      estimatedValue: formData.estimatedValue,
      expectedCloseDate: formData.expectedCloseDate,
    });
  };

  const handleUpdate = () => {
    if (!formData.companyName?.trim() || !formData.contactName?.trim()) { alert('Company Name and Contact Name are required'); return; }
    updateMutation.mutate({
      companyName: formData.companyName.trim(),
      contactName: formData.contactName.trim(),
      email: formData.email?.trim() || undefined,
      phone: formData.phone?.trim() || undefined,
      website: formData.website?.trim() || undefined,
      industry: formData.industry?.trim() || undefined,
      status: statusMap[(formData.status as unknown as string) || 'New'] as unknown as Lead['status'],
      notes: formData.notes?.trim() || undefined,
      leadSource: formData.leadSource ? leadSourceMap[formData.leadSource as unknown as string] as unknown as Lead['leadSource'] : undefined,
      rating: formData.rating ? ratingMap[formData.rating as unknown as string] as unknown as Lead['rating'] : undefined,
      assignedTo: formData.assignedTo,
      estimatedValue: formData.estimatedValue,
      expectedCloseDate: formData.expectedCloseDate,
    });
  };

  const handleEdit = (lead: Lead) => {
    setSelectedLead(lead);
    setFormData({
      ...lead,
      status: getStatusDisplay(lead.status) as any,
      leadSource: getSourceDisplay(lead.leadSource) as any,
      rating: getRatingDisplay(lead.rating) as any,
    });
    setIsEditOpen(true);
  };

  const openConvertModal = (lead: Lead) => {
    setConvertLead(lead);
    setConvertFormData({
      companyName: lead.companyName || '',
      contactPerson: lead.contactName || '',
      email: lead.email || '',
      phone: lead.phone || '',
      website: lead.website || '',
      industry: lead.industry || '',
      customerType: 'Business',
      billingAddress: '',
      billingCity: '',
      billingState: '',
      billingCountry: 'India',
      billingPostalCode: '',
      shippingAddress: '',
      shippingCity: '',
      shippingState: '',
      shippingCountry: 'India',
      shippingPostalCode: '',
      gstNumber: '',
      panNumber: '',
      alternatePhone: '',
    });
  };

  const handleConfirmConvert = () => {
    if (!convertLead) return;
    if (!convertFormData.companyName?.trim() || !convertFormData.contactPerson?.trim()) {
      alert('Company Name and Contact Person are required');
      return;
    }

    const customerData = {
      leadId: convertLead.leadId,
      companyName: convertFormData.companyName.trim(),
      contactPerson: convertFormData.contactPerson.trim(),
      email: convertFormData.email?.trim() || undefined,
      phone: convertFormData.phone?.trim() || undefined,
      website: convertFormData.website?.trim() || undefined,
      industry: convertFormData.industry?.trim() || undefined,
      alternatePhone: convertFormData.alternatePhone?.trim() || undefined,
      customerType: convertFormData.customerType === 'Individual' ? 0 : 1,
      billingAddress: convertFormData.billingAddress?.trim() || undefined,
      billingCity: convertFormData.billingCity?.trim() || undefined,
      billingState: convertFormData.billingState?.trim() || undefined,
      billingCountry: convertFormData.billingCountry?.trim() || 'India',
      billingPostalCode: convertFormData.billingPostalCode?.trim() || undefined,
      shippingAddress: convertFormData.shippingAddress?.trim() || undefined,
      shippingCity: convertFormData.shippingCity?.trim() || undefined,
      shippingState: convertFormData.shippingState?.trim() || undefined,
      shippingCountry: convertFormData.shippingCountry?.trim() || 'India',
      shippingPostalCode: convertFormData.shippingPostalCode?.trim() || undefined,
      gstNumber: convertFormData.gstNumber?.trim() || undefined,
      panNumber: convertFormData.panNumber?.trim() || undefined,
    };

    convertMutation.mutate({ leadId: convertLead.leadId, customerData });
  };

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    let filtered = leads;
    if (statusFilter) filtered = filtered.filter(l => getStatusDisplay(l.status) === statusFilter);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(l => l.companyName?.toLowerCase().includes(q) || l.contactName?.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q));
    }
    return filtered;
  }, [leads, statusFilter, searchTerm]);

  const pagination = usePagination(filteredLeads, 10);

  const statusCounts: Record<string, number> = { All: leadCounts.total, New: leadCounts.New, Demo: leadCounts.Demo, Converted: leadCounts.Converted, Lost: leadCounts.Lost };

  return (
    <div className="bg-gray-50 min-h-screen p-6 lg:p-8">
      {/* Modals */}
      {deleteLead && (
        <DeleteModal lead={deleteLead} onConfirm={() => deleteMutation.mutate(deleteLead.leadId)} onCancel={() => setDeleteLead(null)} isPending={deleteMutation.isPending} />
      )}
      <SlidePanel open={isCreateOpen} onClose={() => { setIsCreateOpen(false); setFormData({}); }} title="New Lead" subtitle="Fill in the lead details">
        <LeadForm data={formData} onChange={setFormData} onSubmit={handleCreate} isPending={createMutation.isPending} mode="create" />
      </SlidePanel>
      <SlidePanel open={isEditOpen} onClose={() => { setIsEditOpen(false); setSelectedLead(null); setFormData({}); }} title="Edit Lead" subtitle={selectedLead?.companyName}>
        <LeadForm data={formData} onChange={setFormData} onSubmit={handleUpdate} isPending={updateMutation.isPending} mode="edit" />
      </SlidePanel>
      <ConvertLeadModal
        open={!!convertLead}
        lead={convertLead}
        formData={convertFormData}
        onChange={(patch) => setConvertFormData(prev => ({ ...prev, ...patch }))}
        onClose={() => { setConvertLead(null); setConvertFormData({}); }}
        onConfirm={handleConfirmConvert}
        isPending={convertMutation.isPending}
      />

      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Leads</h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage and track your sales pipeline</p>
          </div>
          <button
            onClick={() => { setIsCreateOpen(true); setFormData({}); }}
            className="btn-vibrant-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Lead
          </button>
        </div>

        {/* Status filter cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {STATUS_FILTERS.map(s => {
            const count = statusCounts[s] ?? 0;
            const isActive = s === 'All' ? statusFilter === undefined : statusFilter === s;
            const ICONS: Record<string, React.ElementType> = { All: Users, New: Clock, Demo: TrendingUp, Converted: CheckCircle, Lost: XCircle };
            const COLORS: Record<string, string> = { All: 'from-gray-700 to-gray-800', New: 'from-blue-500 to-blue-600', Demo: 'from-violet-500 to-violet-600', Converted: 'from-emerald-500 to-emerald-600', Lost: 'from-red-500 to-red-600' };
            const Icon = ICONS[s];
            return (
              <button
                key={s}
                onClick={() => { if (s === 'All') setStatusFilter(undefined); else setStatusFilter(statusFilter === s ? undefined : s); }}
                className={`relative overflow-hidden rounded-2xl p-4 text-left bg-gradient-to-br ${COLORS[s]} text-white transition-all hover:scale-105 hover:shadow-lg ${isActive ? 'ring-4 ring-white/40 ring-offset-2 ring-offset-gray-50' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-5 h-5 text-white/80" />
                  <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">{count}</span>
                </div>
                <p className="text-xs text-white/80 font-medium">{s}</p>
                <p className="text-2xl font-bold mt-0.5">{count}</p>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            type="text"
            placeholder="Search by company, contact or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition shadow-sm"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Company</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Contact</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Rating</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Source</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Created</th>
                  {showAuditColumns && (
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Created By</th>
                  )}
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr><td colSpan={showAuditColumns ? 8 : 7} className="py-12 text-center text-sm text-gray-400">Loading leads...</td></tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={showAuditColumns ? 8 : 7} className="py-16 text-center">
                      <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No leads found</p>
                    </td>
                  </tr>
                ) : pagination.paginatedItems.map(lead => {
                  const statusStr = getStatusDisplay(lead.status);
                  const ratingStr = getRatingDisplay(lead.rating);
                  const sourceStr = getSourceDisplay(lead.leadSource);
                  const isConverted = statusStr === 'Converted';
                  const isLost = statusStr === 'Lost';
                  const isConvertDisabled = isConverted || isLost;
                  return (
                    <tr key={lead.leadId} className="group hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl ${avatarColor(lead.companyName || '')} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-[10px] font-bold text-white">{initials(lead.companyName || '')}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{lead.companyName}</p>
                            {lead.industry && <p className="text-xs text-gray-400">{lead.industry}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-700">{lead.contactName}</p>
                        {lead.email && <p className="text-xs text-gray-400">{lead.email}</p>}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-lg border ${statusBadgeCls(statusStr)}`}>{statusStr}</span>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        {ratingStr !== 'N/A' ? <span>{ratingBadge(ratingStr)} {ratingStr}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">{sourceStr !== 'N/A' ? sourceStr : <span className="text-gray-300">—</span>}</td>
                      <td className="px-5 py-4 text-sm text-gray-400">{formatDate(lead.createdAt)}</td>
                      {showAuditColumns && (
                        <td className="px-5 py-4 text-sm text-gray-600">{lead.createdByUser?.name || 'Unknown'}</td>
                      )}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => navigate(`/dashboard/leads/${lead.leadId}`)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-950/50 dark:text-blue-300 transition-colors font-bold" title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEdit(lead)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-950/50 dark:text-amber-300 transition-colors font-bold" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openConvertModal(lead)}
                            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors font-bold ${isConvertDisabled ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700/40 dark:text-gray-600' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300'}`}
                            title={isConverted ? "Already converted" : isLost ? "Lost leads cannot be converted" : "Convert to Customer"}
                            disabled={isConvertDisabled || convertMutation.isPending}
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteLead(lead)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950/50 dark:text-red-300 transition-colors font-bold" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold">{filteredLeads.length === 0 ? 0 : (pagination.currentPage - 1) * pagination.itemsPerPage + 1}</span> to <span className="font-semibold">{Math.min(pagination.currentPage * pagination.itemsPerPage, filteredLeads.length)}</span> of <span className="font-semibold">{filteredLeads.length}</span>
          </p>
          <PaginationControls
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            itemsPerPage={pagination.itemsPerPage}
            totalItems={filteredLeads.length}
            onPageChange={pagination.goToPage}
            onItemsPerPageChange={pagination.setItemsPerPage}
            pageNumbers={pagination.pageNumbers}
            hasNextPage={pagination.currentPage < pagination.totalPages}
            hasPreviousPage={pagination.currentPage > 1}
          />
        </div>
      </div>
    </div>
  );
}
