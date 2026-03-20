import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LeadHistoryTimeline } from '@/components/ui/LeadHistoryTimeline';
import { leadsService } from '@/services/leadsService';
import { customersApi } from '@/services';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import {
  ArrowLeft, MessageSquare, CheckCircle, User, Mail, Phone,
  Building2, Globe, Calendar, Clock, Edit3, X, Save,
  AlertCircle, FileText, MapPin, Tag, Briefcase,
} from 'lucide-react';

const inputCls =
  'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder:text-gray-400';

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</label>
    {children}
  </div>
);

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [lead, setLead] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showStatusChange, setShowStatusChange] = useState(false);
  const [showConvertForm, setShowConvertForm] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [customerFormData, setCustomerFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    alternatePhone: '',
    website: '',
    industry: '',
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
  });

  const leadStatuses = ['New', 'Demo', 'Converted', 'Lost'];

  useEffect(() => { loadLeadDetails(); }, [id]);

  const loadLeadDetails = async () => {
    try {
      setIsLoading(true);
      if (id) {
        const data = await leadsService.getWithHistory(parseInt(id));
        setLead(data);
        setHistory(data.history || []);
        setNewStatus(data.status || '');
      }
    } catch (err) {
      console.error('Error loading lead:', err);
      setError('Failed to load lead details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || !id) return;
    setError(''); setSuccess('');
    try {
      setIsSubmitting(true);
      await leadsService.addNote(parseInt(id), noteText);
      setNoteText('');
      setShowAddNote(false);
      setSuccess('Note added successfully');
      await loadLeadDetails();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error adding note');
    } finally { setIsSubmitting(false); }
  };

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus || !id) return;
    if (newStatus === lead?.status) { setShowStatusChange(false); return; }
    setError(''); setSuccess('');
    try {
      setIsSubmitting(true);
      await leadsService.updateStatus(parseInt(id), { status: newStatus });
      setShowStatusChange(false);
      setSuccess('Lead status updated successfully');
      await loadLeadDetails();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error updating status');
    } finally { setIsSubmitting(false); }
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError(''); setSuccess('');
    try {
      setIsSubmitting(true);
      const customerTypeEnum = (customerFormData.customerType || 'Business') === 'Individual' ? 0 : 1;
      const customerData = {
        leadId: parseInt(id),
        companyName: customerFormData.companyName || lead.companyName,
        contactPerson: customerFormData.contactPerson || lead.contactName,
        email: customerFormData.email || lead.email,
        phone: customerFormData.phone || lead.phone,
        website: customerFormData.website || lead.website,
        industry: customerFormData.industry || lead.industry,
        alternatePhone: customerFormData.alternatePhone,
        customerType: customerTypeEnum as any,
        billingAddress: customerFormData.billingAddress,
        billingCity: customerFormData.billingCity,
        billingState: customerFormData.billingState,
        billingCountry: customerFormData.billingCountry,
        billingPostalCode: customerFormData.billingPostalCode,
        shippingAddress: customerFormData.shippingAddress,
        shippingCity: customerFormData.shippingCity,
        shippingState: customerFormData.shippingState,
        shippingCountry: customerFormData.shippingCountry,
        shippingPostalCode: customerFormData.shippingPostalCode,
        gstNumber: customerFormData.gstNumber,
        panNumber: customerFormData.panNumber,
      };
      await customersApi.create(customerData);
      await leadsService.updateStatus(parseInt(id), { status: 'Converted' });
      setShowConvertForm(false);
      setSuccess('Lead converted to customer successfully');
      await loadLeadDetails();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error converting lead');
    } finally { setIsSubmitting(false); }
  };

  const statusStyles: Record<string, string> = {
    New: 'bg-blue-50 text-blue-700 border border-blue-200',
    Demo: 'bg-violet-50 text-violet-700 border border-violet-200',
    Converted: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    Lost: 'bg-red-50 text-red-700 border border-red-200',
  };

  const canEdit = user?.role === 'ManagementAdmin' || lead?.createdBy === user?.userId;
  const canConvert = canEdit && lead?.status !== 'Converted' && lead?.status !== 'Lost';

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
          <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-4">Lead not found</p>
          <button
            onClick={() => navigate('/leads')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Leads
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6 lg:p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/leads')}
            className="p-2 rounded-xl text-gray-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{lead.name}</h1>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyles[lead.status] || 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
                {lead.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{lead.companyName || 'No company'}</p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm text-emerald-700">
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lead Info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-5 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                Lead Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                {[
                  { icon: Mail, label: 'Email', value: lead.email },
                  { icon: Phone, label: 'Phone', value: lead.phone },
                  { icon: Building2, label: 'Company', value: lead.companyName },
                  { icon: Briefcase, label: 'Industry', value: lead.industry },
                  { icon: Globe, label: 'Website', value: lead.website },
                  { icon: Tag, label: 'Lead Source', value: lead.leadSource },
                ].map(({ icon: Icon, label, value }) =>
                  value ? (
                    <div key={label} className="flex items-start gap-3">
                      <Icon className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                        <p className="text-sm text-gray-800 mt-0.5">{value}</p>
                      </div>
                    </div>
                  ) : null
                )}
              </div>
              {lead.notes && (
                <div className="mt-5 pt-5 border-t border-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-300" />
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Notes</p>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
                </div>
              )}

              {/* Actions */}
              {canEdit && (
                <div className="mt-5 pt-5 border-t border-gray-50 flex flex-wrap gap-2">
                  <button
                    onClick={() => { setShowAddNote(true); setShowStatusChange(false); setShowConvertForm(false); }}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Add Note
                  </button>
                  <button
                    onClick={() => { setShowStatusChange(true); setShowAddNote(false); setShowConvertForm(false); }}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-xl transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Change Status
                  </button>
                  {canConvert && (
                    <button
                      onClick={() => { setShowConvertForm(true); setShowAddNote(false); setShowStatusChange(false); }}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Convert to Customer
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Add Note Panel */}
            {showAddNote && canEdit && (
              <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    Add Note
                  </h3>
                  <button onClick={() => setShowAddNote(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleAddNote} className="space-y-3">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Write your note here..."
                    className={inputCls}
                    rows={4}
                    required
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || !noteText.trim()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {isSubmitting ? 'Saving...' : 'Add Note'}
                    </button>
                    <button type="button" onClick={() => setShowAddNote(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Status Change Panel */}
            {showStatusChange && canEdit && (
              <div className="bg-white rounded-2xl border border-violet-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-violet-600" />
                    Change Status
                  </h3>
                  <button onClick={() => setShowStatusChange(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleStatusChange} className="space-y-3">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Select a status</option>
                    {leadStatuses.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || !newStatus || newStatus === lead.status}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {isSubmitting ? 'Updating...' : 'Update Status'}
                    </button>
                    <button type="button" onClick={() => setShowStatusChange(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Convert to Customer Panel */}
            {showConvertForm && canConvert && (
              <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Convert to Customer
                  </h3>
                  <button onClick={() => setShowConvertForm(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleConvert} className="space-y-5">
                  {/* Basic Info */}
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <User className="w-3 h-3" /> Basic Information
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Company Name">
                        <input type="text" value={customerFormData.companyName || lead.companyName || ''} onChange={(e) => setCustomerFormData({ ...customerFormData, companyName: e.target.value })} placeholder="Company name" className={inputCls} />
                      </Field>
                      <Field label="Contact Person">
                        <input type="text" value={customerFormData.contactPerson || lead.contactName || ''} onChange={(e) => setCustomerFormData({ ...customerFormData, contactPerson: e.target.value })} placeholder="Contact person" className={inputCls} />
                      </Field>
                      <Field label="Email">
                        <input type="email" value={customerFormData.email || lead.email || ''} onChange={(e) => setCustomerFormData({ ...customerFormData, email: e.target.value })} placeholder="Email" className={inputCls} />
                      </Field>
                      <Field label="Phone">
                        <input type="tel" value={customerFormData.phone || lead.phone || ''} onChange={(e) => setCustomerFormData({ ...customerFormData, phone: e.target.value })} placeholder="Phone" className={inputCls} />
                      </Field>
                    </div>
                  </div>

                  {/* Billing */}
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" /> Billing Address
                    </p>
                    <div className="space-y-3">
                      <Field label="Address">
                        <textarea rows={2} value={customerFormData.billingAddress} onChange={(e) => setCustomerFormData({ ...customerFormData, billingAddress: e.target.value })} placeholder="Billing address" className={inputCls} />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="City">
                          <input type="text" value={customerFormData.billingCity} onChange={(e) => setCustomerFormData({ ...customerFormData, billingCity: e.target.value })} placeholder="City" className={inputCls} />
                        </Field>
                        <Field label="State">
                          <input type="text" value={customerFormData.billingState} onChange={(e) => setCustomerFormData({ ...customerFormData, billingState: e.target.value })} placeholder="State" className={inputCls} />
                        </Field>
                        <Field label="Postal Code">
                          <input type="text" value={customerFormData.billingPostalCode} onChange={(e) => setCustomerFormData({ ...customerFormData, billingPostalCode: e.target.value })} placeholder="Postal Code" className={inputCls} />
                        </Field>
                        <Field label="GST Number">
                          <input type="text" value={customerFormData.gstNumber} onChange={(e) => setCustomerFormData({ ...customerFormData, gstNumber: e.target.value })} placeholder="GST Number" className={inputCls} />
                        </Field>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-gray-50">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {isSubmitting ? 'Converting...' : 'Convert to Customer'}
                    </button>
                    <button type="button" onClick={() => setShowConvertForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Details
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyles[lead.status] || 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
                    {lead.status}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Created</p>
                  <p className="text-sm font-medium text-gray-900">{format(new Date(lead.createdAt), 'MMM d, yyyy')}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{format(new Date(lead.createdAt), 'h:mm a')}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Created By</p>
                  <p className="text-sm font-medium text-gray-900">{lead.createdByName || 'Unknown'}</p>
                </div>
                {lead.updatedAt && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Last Updated</p>
                    <p className="text-sm font-medium text-gray-900">{format(new Date(lead.updatedAt), 'MMM d, yyyy')}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{format(new Date(lead.updatedAt), 'h:mm a')}</p>
                  </div>
                )}
                {lead.rating && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Rating</p>
                    <p className="text-sm font-medium text-gray-900">{lead.rating}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* History Timeline */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            Lead History
          </h2>
          {history && history.length > 0 ? (
            <LeadHistoryTimeline history={history} />
          ) : (
            <div className="text-center py-10 text-gray-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No history events yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
