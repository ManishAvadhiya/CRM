import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  ShoppingCart,
  RefreshCw,
  Package,
  Bell,
} from 'lucide-react';
import { notificationsApi } from '@/services';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', to: '/', icon: LayoutDashboard },
  { name: 'Leads', to: '/leads', icon: UserPlus },
  { name: 'Customers', to: '/customers', icon: Users },
  { name: 'Orders', to: '/orders', icon: ShoppingCart },
  { name: 'Subscriptions', to: '/subscriptions', icon: RefreshCw },
  { name: 'Products', to: '/products', icon: Package },
  { name: 'Notifications', to: '/notifications', icon: Bell },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const { data: notifications } = useQuery({
    queryKey: ['notifications', true],
    queryFn: () => notificationsApi.getAll(true),
  });

  const unreadCount = notifications?.length || 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm">
      {/* Logo */}
      {/* <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            CRM Pro
          </h1>
        </div>
      </div> */}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isNotifications = item.to === '/notifications';
          return (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group relative',
                  isActive
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )
              }
            >
              <item.icon className={cn(
                'w-5 h-5 flex-shrink-0',
                'transition-transform group-hover:scale-110'
              )} />
              <span className="font-medium text-sm flex-1">{item.name}</span>
              {isNotifications && unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="ml-auto h-5 px-2 text-xs font-semibold"
                >
                  {unreadCount}
                </Badge>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-200">
        <Button
          variant="outline"
          className="w-full justify-center text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all duration-200"
          onClick={handleLogout}
        >
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
