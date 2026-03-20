import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/authStore';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import LeadsPage from './pages/LeadsPage.tsx';
import CustomersPage from './pages/CustomersPage.tsx';
import OrdersPage from './pages/OrdersPage.tsx';
import SubscriptionsPage from './pages/SubscriptionsPage.tsx';
import ProductVariantsPage from './pages/ProductVariantsPage.tsx';
import NotificationsPage from './pages/NotificationsPage.tsx';
import { AccountDetailsPage } from './pages/AccountDetailsPage';
import { LeadDetailPage } from './pages/LeadDetailPage';
import AdminUserManagement from './pages/AdminUserManagement';
import MarketingUserManagement from './pages/MarketingUserManagement';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function RoleBasedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function UserManagementWrapper() {
  const user = useAuthStore((state) => state.user);
  
  if (user?.role === 'ManagementAdmin') {
    return <AdminUserManagement />;
  } else if (user?.role === 'Marketing') {
    return <MarketingUserManagement />;
  }
  
  return <Navigate to="/" replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="leads/:id" element={<LeadDetailPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="products" element={<ProductVariantsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="account" element={<AccountDetailsPage />} />
            
            {/* User Management Routes */}
            <Route
              path="users"
              element={
                <RoleBasedRoute allowedRoles={['ManagementAdmin', 'Marketing']}>
                  <UserManagementWrapper />
                </RoleBasedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
