import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { LogOut, Moon, Sun, User } from 'lucide-react';
import { authApi } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { getCurrentTheme, setTheme } from '@/lib/theme';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Sidebar from './Sidebar';
import NotificationCenter from '@/components/NotificationCenter';

export default function DashboardLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    setIsDarkMode(getCurrentTheme() === 'dark');
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Clear client auth state even if backend logout fails.
    }

    logout();
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar (full height, fixed left column) */}
      <div className="h-screen sticky top-0 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Right column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-900 sticky top-0 z-30 h-16 flex items-center justify-between px-6 shadow-sm shrink-0">
          <div />
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const nextMode = !isDarkMode;
                setIsDarkMode(nextMode);
                setTheme(nextMode ? 'dark' : 'light');
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <NotificationCenter />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-xl flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-slate-200">
                    {user?.name || 'User'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
