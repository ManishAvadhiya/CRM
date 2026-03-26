import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { usersApi } from '@/services';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Lock, Unlock, Search, Copy, X, Eye, EyeOff } from 'lucide-react';
import type { User } from '@/types';

const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition';
const AVATAR_COLORS = ['bg-violet-500','bg-blue-500','bg-emerald-500','bg-amber-500','bg-rose-500'];
function avatarColor(name: string) { let h = 0; for (const c of name) h += c.charCodeAt(0); return AVATAR_COLORS[h % AVATAR_COLORS.length]; }
function initials(name: string) { return name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase(); }

interface FormData { name: string; email: string; phone: string; password: string; role: 'Marketing' | 'Partner'; }

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

function DeleteModal({ user, onConfirm, onCancel, isPending }: { user: User; onConfirm: () => void; onCancel: () => void; isPending: boolean }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-base font-bold text-gray-900 text-center mb-1">Delete User</h3>
          <p className="text-sm text-gray-500 text-center mb-6">Are you sure you want to delete <span className="font-semibold text-gray-700">{user.name}</span>? This cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
            <button onClick={onConfirm} disabled={isPending} className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors">
              {isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function CredentialsModal({ credentials, onClose }: { credentials: any; onClose: () => void }) {
  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success('Copied!'); };
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Eye className="w-6 h-6 text-emerald-500" />
        </div>
        <h3 className="text-base font-bold text-gray-900 text-center mb-1">User Created!</h3>
        <p className="text-xs text-gray-500 text-center mb-5">Share these credentials — they're shown once only.</p>
        <div className="space-y-3">
          {[{ label: 'Login ID', value: credentials.loginId }, { label: 'Password', value: credentials.password }].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm text-gray-900 break-all">{value}</code>
                <button onClick={() => copy(value)} className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors">
                  <Copy className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="w-full mt-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors">Done</button>
      </div>
    </div>
  );
}

const FILTER_ROLES = ['All', 'Marketing', 'Partner', 'ManagementAdmin'];

interface UserFormFieldsProps {
  isEdit: boolean;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  handleEditSubmit: (e: React.FormEvent) => void;
  handleCreateSubmit: (e: React.FormEvent) => void;
  createMutation: { isPending: boolean };
  updateMutation: { isPending: boolean };
  onCancel: () => void;
}

function UserFormFields({
  isEdit,
  formData,
  setFormData,
  showPassword,
  setShowPassword,
  handleEditSubmit,
  handleCreateSubmit,
  createMutation,
  updateMutation,
  onCancel
}: UserFormFieldsProps) {
  return (
    <form onSubmit={isEdit ? handleEditSubmit : handleCreateSubmit} className="space-y-4">
      <Field label="Full Name" required>
        <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputCls} required />
      </Field>
      <Field label="Email" required>
        <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={`${inputCls} ${isEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`} disabled={isEdit} required />
        {isEdit && <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>}
      </Field>
      <Field label="Phone">
        <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className={inputCls} />
      </Field>
      {!isEdit && (
        <>
          <Field label="Password" required>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className={inputCls} placeholder="Min. 6 characters" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>
          <Field label="Role" required>
            <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as 'Marketing' | 'Partner' })} className={inputCls}>
              <option value="Marketing">Marketing</option>
              <option value="Partner">Partner</option>
            </select>
          </Field>
        </>
      )}
      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50 transition-colors">
          {(createMutation.isPending || updateMutation.isPending) ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create User')}
        </button>
        <button type="button" onClick={onCancel} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-2.5 rounded-xl transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function AdminUserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('All');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', phone: '', password: '', role: 'Marketing' });
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [credentials, setCredentials] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => usersApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => data.role === 'Marketing' ? usersApi.createMarketing(data) : usersApi.createPartner(data),
    onSuccess: (response: any) => {
      setCredentials({ loginId: response.Email || response.email || response.LoginId || response.loginId, password: response.Password || response.password, role: response.Role || response.role });
      toast.success('User created successfully!');
      setIsCreateOpen(false);
      setFormData({ name: '', email: '', phone: '', password: '', role: 'Marketing' });
      refetch();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to create user'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; userData: Omit<FormData, 'password' | 'role'> }) => usersApi.update(data.id, data.userData),
    onSuccess: () => { toast.success('User updated!'); setIsEditOpen(false); setEditingUserId(null); setFormData({ name: '', email: '', phone: '', password: '', role: 'Marketing' }); refetch(); },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to update user'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => { toast.success('User deleted!'); setDeleteUser(null); refetch(); },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to delete user'),
  });

  const disableMutation = useMutation({
    mutationFn: (id: number) => usersApi.disable(id),
    onSuccess: () => { toast.success('User disabled!'); refetch(); },
  });

  const enableMutation = useMutation({
    mutationFn: (id: number) => usersApi.enable(id),
    onSuccess: () => { toast.success('User enabled!'); refetch(); },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.password) createMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUserId && formData.name && formData.email)
      updateMutation.mutate({ id: editingUserId, userData: { name: formData.name, email: formData.email, phone: formData.phone } });
  };

  const startEdit = (user: User) => {
    setEditingUserId(user.userId);
    setFormData({ name: user.name, email: user.email, phone: user.phone || '', password: '', role: user.role === 'Marketing' ? 'Marketing' : 'Partner' });
    setIsEditOpen(true);
  };

  const filteredUsers = users.filter((u: User) => {
    const matchSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === 'All' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const roleCls = (role: string) => {
    const m: Record<string, string> = { ManagementAdmin: 'bg-red-50 text-red-700 border-red-200', Marketing: 'bg-blue-50 text-blue-700 border-blue-200', Partner: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    return m[role] || 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const handleCancelForm = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setEditingUserId(null);
    setFormData({ name: '', email: '', phone: '', password: '', role: 'Marketing' });
  };

  if (error) return <div className="p-6 text-sm text-red-600 bg-red-50 rounded-2xl m-6">Error loading users.</div>;

  return (
    <div className="bg-gray-50 min-h-screen p-6 lg:p-8">
      {credentials && <CredentialsModal credentials={credentials} onClose={() => setCredentials(null)} />}
      {deleteUser && <DeleteModal user={deleteUser} onConfirm={() => deleteMutation.mutate(deleteUser.userId)} onCancel={() => setDeleteUser(null)} isPending={deleteMutation.isPending} />}

      <SlidePanel open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create User" subtitle="Add a new team member">
        <UserFormFields
          isEdit={false}
          formData={formData}
          setFormData={setFormData}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          handleEditSubmit={handleEditSubmit}
          handleCreateSubmit={handleCreateSubmit}
          createMutation={createMutation}
          updateMutation={updateMutation}
          onCancel={handleCancelForm}
        />
      </SlidePanel>
      <SlidePanel open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit User" subtitle={formData.name}>
        <UserFormFields
          isEdit={true}
          formData={formData}
          setFormData={setFormData}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          handleEditSubmit={handleEditSubmit}
          handleCreateSubmit={handleCreateSubmit}
          createMutation={createMutation}
          updateMutation={updateMutation}
          onCancel={handleCancelForm}
        />
      </SlidePanel>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Management</h1>
            <p className="text-sm text-gray-400 mt-0.5">{users.length} users total</p>
          </div>
          <button
            onClick={() => { setIsCreateOpen(true); setIsEditOpen(false); setEditingUserId(null); setFormData({ name: '', email: '', phone: '', password: '', role: 'Marketing' }); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create User
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition" />
          </div>
          <div className="flex gap-2">
            {FILTER_ROLES.map(r => (
              <button key={r} onClick={() => setFilterRole(r)} className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${filterRole === r ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
                {r === 'ManagementAdmin' ? 'Admin' : r}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['User', 'Email', 'Phone', 'Role', 'Status', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-400">Loading...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-400">No users found</td></tr>
              ) : filteredUsers.map((user: User) => (
                <tr key={user.userId} className="group hover:bg-gray-50/70 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl ${avatarColor(user.name)} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-[11px] font-bold text-white">{initials(user.name)}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">{user.email}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{user.phone || '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-lg border ${roleCls(user.role)}`}>{user.role}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-lg border ${user.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                      {user.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => startEdit(user)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors font-bold" title="Edit">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => user.isActive ? disableMutation.mutate(user.userId) : enableMutation.mutate(user.userId)} className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors font-bold ${user.isActive ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`} title={user.isActive ? 'Disable' : 'Enable'}>
                        {user.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => setDeleteUser(user)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors font-bold" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
