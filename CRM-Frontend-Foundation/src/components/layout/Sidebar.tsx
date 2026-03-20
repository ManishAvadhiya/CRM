import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  ShoppingCart,
  RefreshCw,
  Package,
  Bell,
  User,
  ChevronLeft,
  LogOut,
} from 'lucide-react';
import { notificationsApi } from '@/services';
import { cn } from '@/lib/utils';

const fullNavigation = [
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', to: '/dashboard/leads', icon: UserPlus },
  { name: 'Customers', to: '/dashboard/customers', icon: Users },
  { name: 'Orders', to: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Subscriptions', to: '/dashboard/subscriptions', icon: RefreshCw },
  { name: 'Products', to: '/dashboard/products', icon: Package },
  { name: 'Notifications', to: '/dashboard/notifications', icon: Bell },
  { name: 'User Management', to: '/dashboard/users', icon: Users },
  { name: 'Account', to: '/dashboard/account', icon: User },
];

const marketingNavigation = [
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', to: '/dashboard/leads', icon: UserPlus },
  { name: 'Customers', to: '/dashboard/customers', icon: Users },
  { name: 'Orders', to: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Subscriptions', to: '/dashboard/subscriptions', icon: RefreshCw },
  { name: 'Products', to: '/dashboard/products', icon: Package },
  { name: 'Notifications', to: '/dashboard/notifications', icon: Bell },
  { name: 'My Partners', to: '/dashboard/users', icon: Users },
  { name: 'Account', to: '/dashboard/account', icon: User },
];

const partnerNavigation = [
  { name: 'My Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { name: 'My Leads', to: '/dashboard/leads', icon: UserPlus },
  { name: 'My Orders', to: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Account', to: '/dashboard/account', icon: User },
];

function Tooltip({
  label,
  children,
  disabled = false,
}: {
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const showTooltip = (element: HTMLElement) => {
    if (disabled) return;
    const rect = element.getBoundingClientRect();
    setPosition({
      top: rect.top + rect.height / 2,
      left: rect.right + 10,
    });
  };

  const hideTooltip = () => setPosition(null);

  return (
    <div
      className="relative"
      onMouseEnter={(e) => showTooltip(e.currentTarget)}
      onMouseLeave={hideTooltip}
      onFocus={(e) => showTooltip(e.currentTarget)}
      onBlur={hideTooltip}
    >
      {children}
      {!disabled && position && (
        <div
          className="fixed z-[80] pointer-events-none"
          style={{ top: position.top, left: position.left }}
        >
          <div className="relative -translate-y-1/2 ml-2">
            <span className="relative z-10 bg-gray-900 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl ring-1 ring-gray-800/60">
              {label}
            </span>
            <span className="absolute left-0 top-1/2 -translate-x-[5px] -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 rounded-[1px]" />
          </div>
        </div>
      )}
    </div>
  );
}

function avatarColor(name: string) {
  const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-rose-500'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % colors.length;
  return colors[h];
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuthStore();

  const navigation =
    user?.role === 'Marketing'
      ? marketingNavigation
      : user?.role === 'Partner'
      ? partnerNavigation
      : fullNavigation;

  const { data: notifications } = useQuery({
    queryKey: ['notifications', true],
    queryFn: () => notificationsApi.getAll(true),
  });
  const unreadCount = notifications?.length || 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : 'U';

  return (
    <aside
      className={cn(
        'relative flex flex-col h-full bg-white border-r border-gray-100 transition-all duration-300 ease-in-out shrink-0',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          'flex items-center h-16 border-b border-gray-100 shrink-0',
          collapsed ? 'justify-center px-0' : 'px-5 gap-3'
        )}
      >
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
          <span className="text-white font-black text-sm">N</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-gray-900 font-bold text-[15px] leading-tight tracking-tight">NexCRM</p>
            <p className="text-gray-400 text-[10px] font-medium uppercase tracking-widest">Platform</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        <div className={cn('space-y-0.5', collapsed ? 'px-2' : 'px-3')}>
          {navigation.map((item) => {
            const isNotif = item.to === '/dashboard/notifications';
            const linkCls = (isActive: boolean) =>
              cn(
                'flex items-center rounded-xl transition-all duration-150 relative',
                collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              );

            const inner = (isActive: boolean) => (
              <>
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                {!collapsed && (
                  <span className="text-[13px] font-medium flex-1 truncate">{item.name}</span>
                )}
                {!collapsed && isNotif && unreadCount > 0 && (
                  <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
                {collapsed && isNotif && unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </>
            );

            const link = (
              <NavLink
                key={item.name}
                to={item.to}
                end={item.to === '/dashboard'}
                className={({ isActive }) => linkCls(isActive)}
              >
                {({ isActive }) => inner(isActive)}
              </NavLink>
            );

            return (
              <Tooltip key={item.name} label={item.name} disabled={!collapsed}>
                {link}
              </Tooltip>
            );
          })}
        </div>
      </nav>

      {/* Divider */}
      <div className="mx-3 h-px bg-gray-100" />

      {/* Footer — User + Logout */}
      <div className={cn('shrink-0 py-3 space-y-0.5', collapsed ? 'px-2' : 'px-3')}>
        {collapsed ? (
          <>
            <Tooltip label={user?.name || 'Account'}>
              <button
                onClick={() => navigate('/dashboard/account')}
                className={cn(
                  'w-full flex justify-center p-2.5 rounded-xl hover:bg-gray-50 transition-colors'
                )}
              >
                <div
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shrink-0',
                    avatarColor(user?.name || 'U')
                  )}
                >
                  {initials}
                </div>
              </button>
            </Tooltip>
            <Tooltip label="Sign Out">
              <button
                onClick={handleLogout}
                className="w-full flex justify-center p-2.5 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-[18px] h-[18px]" />
              </button>
            </Tooltip>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate('/dashboard/account')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
            >
              <div
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shrink-0',
                  avatarColor(user?.name || 'U')
                )}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-900 truncate leading-tight">
                  {user?.name || 'User'}
                </p>
                <p className="text-[11px] text-gray-400 truncate">{user?.role}</p>
              </div>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-[18px] h-[18px] shrink-0" />
              <span className="text-[13px] font-medium">Sign Out</span>
            </button>
          </>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[68px] w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-md hover:border-indigo-300 hover:bg-indigo-50 transition-all z-10"
      >
        <ChevronLeft
          className={cn(
            'w-3.5 h-3.5 text-gray-400 transition-transform duration-300',
            collapsed && 'rotate-180'
          )}
        />
      </button>
    </aside>
  );
}
