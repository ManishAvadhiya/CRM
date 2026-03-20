import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '@/services';
import { formatDate } from '@/lib/utils';
import type { Customer, CustomerType } from '@/types';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Building2,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Hash,
  Globe,
  UserCircle,
  Store,
  X,
  ChevronRight,
} from 'lucide-react';

// ─── helpers ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-violet-500','bg-blue-500','bg-emerald-500','bg-amber-500',
  'bg-rose-500','bg-indigo-500','bg-teal-500','bg-orange-500',
];
function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

// ─── tiny shared field ───────────────────────────────────────────────────────

interface FieldProps { label: string; required?: boolean; children: React.ReactNode; }
function Field({ label, required, children }: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}
const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder-gray-300';

// ─── slide-in panel ───────────────────────────────────────────────────────────

interface PanelProps { open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode; }
function SlidePanel({ open, onClose, title, subtitle, children }: PanelProps) {
  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} />
      <div className={`fixed right-0 top-0 h-full w-full max-w-[520px] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </>
  );
}

// ─── customer form ────────────────────────────────────────────────────────────

interface CustomerFormProps { data: Partial<Customer>; onChange: (d: Partial<Customer>) => void; onSubmit: () => void; isPending: boolean; mode: 'create' | 'edit'; }
function CustomerForm({ data, onChange, onSubmit, isPending, mode }: CustomerFormProps) {
  const set = (patch: Partial<Customer>) => onChange({ ...data, ...patch });
  return (
    <div className="space-y-7">
      <section className="space-y-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Basic Info</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Company Name" required>
            <input className={inputCls} placeholder="Acme Corp" value={data.companyName || ''} onChange={e => set({ companyName: e.target.value })} />
          </Field>
          <Field label="Contact Person" required>
            <input className={inputCls} placeholder="John Doe" value={data.contactPerson || ''} onChange={e => set({ contactPerson: e.target.value })} />
          </Field>
        </div>
        <Field label="Customer Type">
          <select className={inputCls} value={data.customerType as string || 'Business'} onChange={e => set({ customerType: e.target.value as CustomerType })}>
            <option value="Business">Business</option>
            <option value="Individual">Individual</option>
          </select>
        </Field>
        <Field label="Industry">
          <input className={inputCls} placeholder="e.g. Technology, Finance" value={data.industry || ''} onChange={e => set({ industry: e.target.value })} />
        </Field>
      </section>
      <section className="space-y-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contact</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email"><input type="email" className={inputCls} placeholder="contact@co.com" value={data.email || ''} onChange={e => set({ email: e.target.value })} /></Field>
          <Field label="Phone"><input type="tel" className={inputCls} placeholder="+91 XXXXX XXXXX" value={data.phone || ''} onChange={e => set({ phone: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Alternate Phone"><input type="tel" className={inputCls} placeholder="+91 XXXXX XXXXX" value={data.alternatePhone || ''} onChange={e => set({ alternatePhone: e.target.value })} /></Field>
          <Field label="Website"><input className={inputCls} placeholder="www.company.com" value={data.website || ''} onChange={e => set({ website: e.target.value })} /></Field>
        </div>
      </section>
      <section className="space-y-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Billing Address</p>
        <Field label="Address"><textarea className={inputCls} rows={2} placeholder="Street address" value={data.billingAddress || ''} onChange={e => set({ billingAddress: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="City"><input className={inputCls} placeholder="Mumbai" value={data.billingCity || ''} onChange={e => set({ billingCity: e.target.value })} /></Field>
          <Field label="State"><input className={inputCls} placeholder="Maharashtra" value={data.billingState || ''} onChange={e => set({ billingState: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Postal Code"><input className={inputCls} placeholder="400001" value={data.billingPostalCode || ''} onChange={e => set({ billingPostalCode: e.target.value })} /></Field>
          <Field label="Country"><input className={inputCls} value={data.billingCountry || 'India'} onChange={e => set({ billingCountry: e.target.value })} /></Field>
        </div>
      </section>
      <section className="space-y-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tax Info</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="GST Number"><input className={inputCls} placeholder="22AAAAA0000A1Z5" value={data.gstNumber || ''} onChange={e => set({ gstNumber: e.target.value })} /></Field>
          <Field label="PAN Number"><input className={inputCls} placeholder="AAAAA0000A" value={data.panNumber || ''} onChange={e => set({ panNumber: e.target.value })} /></Field>
        </div>
      </section>
      <button
        onClick={onSubmit}
        disabled={isPending}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition
          ${mode === 'create' ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800' : 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700'}
          disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {isPending ? (
          <><div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{mode === 'create' ? 'Creating…' : 'Saving…'}</>
        ) : (
          <>{mode === 'create' ? <Plus className="h-4 w-4" /> : <Edit className="h-4 w-4" />}{mode === 'create' ? 'Create Customer' : 'Save Changes'}</>
        )}
      </button>
    </div>
  );
}

// ─── delete confirmation modal ────────────────────────────────────────────────

interface DeleteModalProps { customer: Customer | null; onConfirm: () => void; onCancel: () => void; isPending: boolean; }
function DeleteModal({ customer, onConfirm, onCancel, isPending }: DeleteModalProps) {
  if (!customer) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto">
          <Trash2 className="h-6 w-6 text-red-500" />
        </div>
        <div className="text-center">
          <h3 className="text-base font-semibold text-gray-900">Delete Customer</h3>
          <p className="text-sm text-gray-500 mt-1">Are you sure you want to delete <span className="font-medium text-gray-700">{customer.companyName}</span>? This cannot be undone.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={onConfirm} disabled={isPending} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition disabled:opacity-60">{isPending ? 'Deleting…' : 'Delete'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── constants ───────────────────────────────────────────────────────────────

const EMPTY_FORM: Partial<Customer> = {
  customerType: 'Business',
  billingCountry: 'India',
  shippingCountry: 'India',
};

// ─── main page ────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [formData, setFormData] = useState<Partial<Customer>>(EMPTY_FORM);

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: customersApi.getAll,
    staleTime: 30000,
  });

  const createMutation = useMutation({
    mutationFn: (d: Partial<Customer>) => customersApi.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setCreateOpen(false);
      setFormData(EMPTY_FORM);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (d: Partial<Customer>) => customersApi.update(editCustomer!.customerId, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setEditCustomer(null);
      setFormData(EMPTY_FORM);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => customersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setDeleteTarget(null);
    },
  });

  const stats = useMemo(() => {
    if (!customers) return { total: 0, business: 0, individual: 0, thisMonth: 0 };
    const now = new Date();
    return {
      total: customers.length,
      business: customers.filter(c => c.customerType === 1 || c.customerType === 'Business').length,
      individual: customers.filter(c => c.customerType === 0 || c.customerType === 'Individual').length,
      thisMonth: customers.filter(c => {
        const d = new Date(c.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length,
    };
  }, [customers]);

  const filtered = useMemo(() => {
    if (!customers) return [];
    let list = customers;
    if (typeFilter) {
      const val = typeFilter === 'Business' ? 1 : 0;
      list = list.filter(c => c.customerType === val || c.customerType === typeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.companyName?.toLowerCase().includes(q) ||
        c.contactPerson?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q),
      );
    }
    return list;
  }, [customers, typeFilter, search]);

  const handleCreate = () => {
    if (!formData.companyName || !formData.contactPerson) return;
    createMutation.mutate({ ...formData, customerType: (formData.customerType === 'Individual' ? 0 : 1) as any });
  };

  const handleUpdate = () => {
    if (!formData.companyName || !formData.contactPerson) return;
    updateMutation.mutate({ ...formData, customerType: (formData.customerType === 'Individual' ? 0 : 1) as any });
  };

  const openEdit = (c: Customer) => {
    setEditCustomer(c);
    setFormData({ ...c, customerType: c.customerType === 1 ? 'Business' : 'Individual' });
  };

  const statCards = [
    { label: 'Total Customers', value: stats.total,      icon: Users,     color: 'text-indigo-600', bg: 'bg-indigo-50',   active: typeFilter === undefined,   onClick: () => setTypeFilter(undefined) },
    { label: 'Business',        value: stats.business,   icon: Store,     color: 'text-blue-600',   bg: 'bg-blue-50',     active: typeFilter === 'Business',   onClick: () => setTypeFilter(t => t === 'Business'   ? undefined : 'Business') },
    { label: 'Individual',      value: stats.individual, icon: UserCircle,color: 'text-violet-600', bg: 'bg-violet-50',   active: typeFilter === 'Individual', onClick: () => setTypeFilter(t => t === 'Individual' ? undefined : 'Individual') },
    { label: 'New This Month',  value: stats.thisMonth,  icon: Building2, color: 'text-emerald-600',bg: 'bg-emerald-50',  active: false,                      onClick: undefined },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Loading customers…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6 lg:p-8">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Customers</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {stats.total} total · {filtered.length} shown
            </p>
          </div>
          <button
            onClick={() => { setFormData(EMPTY_FORM); setCreateOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(card => {
            const Icon = card.icon;
            return (
              <button
                key={card.label}
                onClick={card.onClick as any}
                disabled={!card.onClick}
                className={[
                  'flex items-start gap-4 p-5 bg-white rounded-2xl border-2 transition text-left w-full',
                  card.active ? 'border-indigo-300 shadow-md shadow-indigo-100' : 'border-transparent hover:border-gray-200 hover:shadow-sm',
                  !card.onClick ? 'cursor-default' : 'cursor-pointer',
                ].join(' ')}
              >
                <div className={["w-10 h-10", card.bg, "rounded-xl flex items-center justify-center flex-shrink-0"].join(' ')}>
                  <Icon className={[card.color, "h-5 w-5"].join(' ')} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-0.5 leading-none">{card.value}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Table card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* search bar */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
              <input
                type="text"
                placeholder="Search customers…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-gray-50 placeholder-gray-300"
              />
            </div>
            {typeFilter && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                {typeFilter}
                <button onClick={() => setTypeFilter(undefined)} className="hover:text-indigo-900">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <span className="ml-auto text-xs text-gray-400">{filtered.length} records</span>
          </div>

          {/* table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-[28%]">Customer</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Contact Info</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Industry</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Location</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Created</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length > 0 ? (
                  filtered.map(customer => {
                    const isBusiness = customer.customerType === 1 || customer.customerType === 'Business';
                    const loc = [customer.billingCity, customer.billingState].filter(Boolean).join(', ');
                    return (
                      <tr key={customer.customerId} className="group hover:bg-gray-50/70 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={["w-9 h-9", avatarColor(customer.companyName || 'C'), "rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"].join(' ')}>
                              {initials(customer.companyName || 'C')}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 leading-tight">{customer.companyName}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{customer.contactPerson}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            {customer.email && <div className="flex items-center gap-1.5 text-xs text-gray-500"><Mail className="h-3 w-3 text-gray-300 flex-shrink-0" /><span className="truncate max-w-[170px]">{customer.email}</span></div>}
                            {customer.phone && <div className="flex items-center gap-1.5 text-xs text-gray-500"><Phone className="h-3 w-3 text-gray-300 flex-shrink-0" />{customer.phone}</div>}
                            {!customer.email && !customer.phone && <span className="text-xs text-gray-300">—</span>}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {customer.industry
                            ? <div className="flex items-center gap-1.5 text-xs text-gray-600"><Briefcase className="h-3 w-3 text-gray-300" />{customer.industry}</div>
                            : <span className="text-xs text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-4">
                          {loc
                            ? <div className="flex items-center gap-1.5 text-xs text-gray-600"><MapPin className="h-3 w-3 text-gray-300" />{loc}</div>
                            : customer.billingCountry
                              ? <div className="flex items-center gap-1.5 text-xs text-gray-600"><Globe className="h-3 w-3 text-gray-300" />{customer.billingCountry}</div>
                              : <span className="text-xs text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-4">
                          {isBusiness
                            ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100"><Store className="h-3 w-3" />Business</span>
                            : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100"><UserCircle className="h-3 w-3" />Individual</span>}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs text-gray-400">{formatDate(customer.createdAt)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(customer)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition" title="Edit">
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setDeleteTarget(customer)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition" title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            <ChevronRight className="h-3.5 w-3.5 text-gray-300 ml-1" />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
                          <Users className="h-7 w-7 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-400">No customers found</p>
                        <button
                          onClick={() => { setFormData(EMPTY_FORM); setCreateOpen(true); }}
                          className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-semibold mt-1"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add your first customer
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of{' '}
                <span className="font-semibold text-gray-600">{stats.total}</span> customers
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Hash className="h-3 w-3" />
                NexCRM · Customers
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create panel */}
      <SlidePanel
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add Customer"
        subtitle="Fill in the details to create a new customer record"
      >
        <CustomerForm data={formData} onChange={setFormData} onSubmit={handleCreate} isPending={createMutation.isPending} mode="create" />
      </SlidePanel>

      {/* Edit panel */}
      <SlidePanel
        open={!!editCustomer}
        onClose={() => { setEditCustomer(null); setFormData(EMPTY_FORM); }}
        title="Edit Customer"
        subtitle={editCustomer?.companyName}
      >
        <CustomerForm data={formData} onChange={setFormData} onSubmit={handleUpdate} isPending={updateMutation.isPending} mode="edit" />
      </SlidePanel>

      {/* Delete modal */}
      <DeleteModal
        customer={deleteTarget}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.customerId)}
        onCancel={() => setDeleteTarget(null)}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
