import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/services/authService';
import { exportApi } from '@/services';
import { useAuthStore } from '@/store/authStore';
import { User, Mail, Phone, LogOut, Lock, ShieldCheck, Download, Loader2 } from 'lucide-react';
import { getCurrentTheme, setTheme } from '@/lib/theme';

const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export function AccountDetailsPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [exportingPreset, setExportingPreset] = useState<null | 'generic' | 'zoho' | 'hubspot' | 'salesforce'>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    loadProfile();
    setIsDarkMode(getCurrentTheme() === 'dark');
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const data = await authApi.getCurrentUser();
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(''); setPasswordSuccess('');
    if (passwordData.newPassword !== passwordData.confirmPassword) { setPasswordError('New passwords do not match'); return; }
    if (passwordData.newPassword.length < 6) { setPasswordError('New password must be at least 6 characters'); return; }
    try {
      setIsChangingPassword(true);
      await authApi.changePassword({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword });
      setPasswordSuccess('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (error: any) {
      setPasswordError(error.response?.data?.message || 'Error changing password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const ROLE_MAP: Record<string, string> = { ManagementAdmin: 'Management Admin', Marketing: 'Marketing', Partner: 'Partner' };
  const ROLE_COLORS: Record<string, string> = {
    ManagementAdmin: 'bg-red-50 text-red-700 border-red-200',
    Marketing: 'bg-blue-50 text-blue-700 border-blue-200',
    Partner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const handleExportProfile = async (preset: 'generic' | 'zoho' | 'hubspot' | 'salesforce') => {
    try {
      setExportingPreset(preset);
      const { blob, fileName } = await exportApi.downloadPartnerProfile(preset);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting profile:', error);
      alert('Unable to export profile right now. Please try again.');
    } finally {
      setExportingPreset(null);
    }
  };

  if (isLoading) {
    return <div className="bg-gray-50 min-h-screen flex items-center justify-center"><div className="text-sm text-gray-400">Loading profile...</div></div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Account Details</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your profile and security settings</p>
        </div>

        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-4 pb-4 border-b border-gray-50">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <User className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{profile?.name}</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${ROLE_COLORS[profile?.role] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                <ShieldCheck className="w-3 h-3 mr-1" />
                {ROLE_MAP[profile?.role] || profile?.role}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Email</p>
                <p className="text-sm font-medium text-gray-900">{profile?.email}</p>
              </div>
            </div>
            {profile?.phone && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{profile.phone}</p>
                </div>
              </div>
            )}
          </div>
          {profile?.createdAt && (
            <p className="text-xs text-gray-400">Member since {new Date(profile.createdAt).toLocaleDateString()}</p>
          )}
        </div>

        {/* Security card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">Security</h2>
            </div>
            {!showPasswordForm && (
              <button onClick={() => setShowPasswordForm(true)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                Change Password
              </button>
            )}
          </div>
          {showPasswordForm ? (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <Field label="Current Password">
                <input type="password" value={passwordData.currentPassword} onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })} className={inputCls} placeholder="Enter current password" required />
              </Field>
              <Field label="New Password">
                <input type="password" value={passwordData.newPassword} onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} className={inputCls} placeholder="At least 6 characters" required />
              </Field>
              <Field label="Confirm New Password">
                <input type="password" value={passwordData.confirmPassword} onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} className={inputCls} placeholder="Confirm new password" required />
              </Field>
              {passwordError && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-sm text-red-600">{passwordError}</div>}
              {passwordSuccess && <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 text-sm text-emerald-600">{passwordSuccess}</div>}
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={isChangingPassword} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50 transition-colors">
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </button>
                <button type="button" onClick={() => { setShowPasswordForm(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); setPasswordError(''); }} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-2.5 rounded-xl transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-gray-500">Keep your account secure by updating your password periodically.</p>
          )}
        </div>

        {/* Appearance card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Appearance</h2>
          <p className="text-sm text-gray-500 mb-4">Use dark mode across your CRM workspace.</p>

          <button
            type="button"
            onClick={() => {
              const nextMode = !isDarkMode;
              setIsDarkMode(nextMode);
              setTheme(nextMode ? 'dark' : 'light');
            }}
            className="w-full sm:w-auto inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm font-semibold text-gray-800">Dark Mode</span>
            <span
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isDarkMode ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  isDarkMode ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </span>
          </button>
        </div>

        {/* CRM Export card for Partner */}
        {profile?.role === 'Partner' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">CRM Data Export</h2>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                Partner
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Download your full CRM profile as a ZIP containing CSV files (leads, customers, orders, subscriptions, products, earnings) with preset headers for your target CRM.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => handleExportProfile('generic')}
                disabled={exportingPreset !== null}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-gray-800 hover:bg-gray-900 text-white rounded-xl disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {exportingPreset === 'generic' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {exportingPreset === 'generic' ? 'Exporting Generic...' : 'Export Generic CSV'}
              </button>
              <button
                onClick={() => handleExportProfile('zoho')}
                disabled={exportingPreset !== null}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {exportingPreset === 'zoho' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {exportingPreset === 'zoho' ? 'Exporting Zoho...' : 'Export Zoho Preset'}
              </button>
              <button
                onClick={() => handleExportProfile('hubspot')}
                disabled={exportingPreset !== null}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {exportingPreset === 'hubspot' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {exportingPreset === 'hubspot' ? 'Exporting HubSpot...' : 'Export HubSpot Preset'}
              </button>
              <button
                onClick={() => handleExportProfile('salesforce')}
                disabled={exportingPreset !== null}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-xl disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {exportingPreset === 'salesforce' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {exportingPreset === 'salesforce' ? 'Exporting Salesforce...' : 'Export Salesforce Preset'}
              </button>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="flex justify-end">
          <button onClick={() => { logout(); navigate('/login'); }} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
