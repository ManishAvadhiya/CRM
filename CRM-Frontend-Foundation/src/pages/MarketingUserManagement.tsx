import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { usersApi } from '../services';
import { User } from '../types';
import { Plus, Edit, Trash2, Lock, Unlock, Search, Users, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const inputCls =
  'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder:text-gray-400';

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</label>
    {children}
  </div>
);

function SlidePanel({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </>
  );
}

function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel, danger }: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; message: string; confirmLabel: string; danger?: boolean;
}) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-sm p-6">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-red-50' : 'bg-amber-50'}`}>
            <AlertTriangle className={`w-5 h-5 ${danger ? 'text-red-500' : 'text-amber-500'}`} />
          </div>
          <h3 className="text-base font-semibold text-gray-900 text-center mb-1">{title}</h3>
          <p className="text-sm text-gray-500 text-center mb-6">{message}</p>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2 text-sm text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={onConfirm} className={`flex-1 py-2 text-sm text-white rounded-xl ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

interface FormData {
  name: string;
  email: string;
  phone?: string;
  password?: string;
}

function avatarColor(name: string) {
  const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % colors.length;
  return colors[h];
}

export const MarketingUserManagement = () => {
  const [partners, setPartners] = useState<User[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEnableDisableConfirm, setShowEnableDisableConfirm] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState<number | null>(null);
  const [deletePartnerId, setDeletePartnerId] = useState<number | null>(null);
  const [enableDisablePartnerId, setEnableDisablePartnerId] = useState<number | null>(null);
  const [enableDisableAction, setEnableDisableAction] = useState<'enable' | 'disable'>('enable');
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', phone: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const { data: allUsers, isLoading, error, refetch } = useQuery({
    queryKey: ['my-partners'],
    queryFn: () => usersApi.getMyPartners(),
  });

  useEffect(() => { if (allUsers) setPartners(allUsers); }, [allUsers]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => usersApi.createPartner({ name: data.name, email: data.email, phone: data.phone, password: data.password || '' }),
    onSuccess: () => { toast.success('Partner created!'); setShowCreateForm(false); setFormData({ name: '', email: '', phone: '', password: '' }); refetch(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Create failed'),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => usersApi.update(editingPartnerId!, { name: data.name, email: data.email, phone: data.phone }),
    onSuccess: () => { toast.success('Partner updated!'); setShowEditForm(false); setEditingPartnerId(null); setFormData({ name: '', email: '', phone: '', password: '' }); refetch(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Update failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => { toast.success('Partner deleted.'); setShowDeleteConfirm(false); setDeletePartnerId(null); refetch(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Delete failed'),
  });

  const disableMutation = useMutation({
    mutationFn: (id: number) => usersApi.disable(id),
    onSuccess: () => { toast.success('Partner disabled.'); setShowEnableDisableConfirm(false); setEnableDisablePartnerId(null); refetch(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const enableMutation = useMutation({
    mutationFn: (id: number) => usersApi.enable(id),
    onSuccess: () => { toast.success('Partner enabled.'); setShowEnableDisableConfirm(false); setEnableDisablePartnerId(null); refetch(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const handleCreateSubmit = (e: React.FormEvent) => { e.preventDefault(); createMutation.mutate(formData); };
  const handleEditSubmit = (e: React.FormEvent) => { e.preventDefault(); updateMutation.mutate(formData); };
  const handleStartEdit = (p: User) => { setEditingPartnerId(p.userId); setFormData({ name: p.name, email: p.email, phone: p.phone || '', password: '' }); setShowEditForm(true); };
  const handleDeleteConfirm = (id: number) => { setDeletePartnerId(id); setShowDeleteConfirm(true); };
  const handleDeletionConfirmed = () => { if (deletePartnerId) deleteMutation.mutate(deletePartnerId); };
  const handleDisableToggle = (id: number, isActive: boolean) => { setEnableDisablePartnerId(id); setEnableDisableAction(isActive ? 'disable' : 'enable'); setShowEnableDisableConfirm(true); };
  const handleEnableDisableConfirmed = () => {
    if (!enableDisablePartnerId) return;
    if (enableDisableAction === 'disable') disableMutation.mutate(enableDisablePartnerId);
    else enableMutation.mutate(enableDisablePartnerId);
  };

  const filteredPartners = partners.filter(
    (p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen p-6 lg:p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Partners</h1>
            <p className="text-sm text-gray-500 mt-0.5">{filteredPartners.length} partner{filteredPartners.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Partner
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search partners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Users className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No partners found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Partner', 'Email', 'Phone', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPartners.map((partner) => {
                  const initials = partner.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
                  return (
                    <tr key={partner.userId} className="group hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 ${avatarColor(partner.name)}`}>
                            {initials}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{partner.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4"><span className="text-sm text-gray-500">{partner.email}</span></td>
                      <td className="px-4 py-4"><span className="text-sm text-gray-500">{partner.phone || '—'}</span></td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${partner.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                          {partner.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleStartEdit(partner)} className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDisableToggle(partner.userId, partner.isActive)} className={`p-1.5 rounded-lg transition-colors ${partner.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`} title={partner.isActive ? 'Disable' : 'Enable'}>
                            {partner.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </button>
                          <button onClick={() => handleDeleteConfirm(partner.userId)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Panel */}
      <SlidePanel open={showCreateForm} onClose={() => { setShowCreateForm(false); setFormData({ name: '', email: '', phone: '' }); }} title="Create Partner">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Field label="Name *"><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputCls} required /></Field>
          <Field label="Email *"><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputCls} required /></Field>
          <Field label="Phone"><input type="tel" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={inputCls} /></Field>
          <Field label="Password *"><input type="password" value={formData.password || ''} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={inputCls} placeholder="Minimum 6 characters" required /></Field>
          <button type="submit" disabled={createMutation.isPending} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
            {createMutation.isPending ? 'Creating...' : 'Create Partner'}
          </button>
        </form>
      </SlidePanel>

      {/* Edit Panel */}
      <SlidePanel open={showEditForm} onClose={() => { setShowEditForm(false); setEditingPartnerId(null); setFormData({ name: '', email: '', phone: '', password: '' }); }} title="Edit Partner">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Field label="Name *"><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputCls} required /></Field>
          <Field label="Email">
            <input type="email" value={formData.email} className={inputCls + ' opacity-60 cursor-not-allowed'} disabled />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </Field>
          <Field label="Phone"><input type="tel" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={inputCls} /></Field>
          <button type="submit" disabled={updateMutation.isPending} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
            {updateMutation.isPending ? 'Updating...' : 'Update Partner'}
          </button>
        </form>
      </SlidePanel>

      {/* Delete Confirm */}
      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeletePartnerId(null); }}
        onConfirm={handleDeletionConfirmed}
        title="Delete Partner"
        message="Are you sure you want to delete this partner? This action cannot be undone."
        confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
        danger
      />

      {/* Enable/Disable Confirm */}
      <ConfirmModal
        open={showEnableDisableConfirm}
        onClose={() => { setShowEnableDisableConfirm(false); setEnableDisablePartnerId(null); }}
        onConfirm={handleEnableDisableConfirmed}
        title={enableDisableAction === 'disable' ? 'Disable Partner' : 'Enable Partner'}
        message={`Are you sure you want to ${enableDisableAction} this partner?`}
        confirmLabel={disableMutation.isPending || enableMutation.isPending ? 'Processing...' : enableDisableAction === 'disable' ? 'Disable' : 'Enable'}
        danger={enableDisableAction === 'disable'}
      />
    </div>
  );
};

export default MarketingUserManagement;
