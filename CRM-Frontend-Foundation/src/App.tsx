import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/authStore';

// Pages
import LoginPage from './pages/LoginPage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import LeadsPage from './pages/LeadsPage.tsx';
import CustomersPage from './pages/CustomersPage.tsx';
import OrdersPage from './pages/OrdersPage.tsx';
import SubscriptionsPage from './pages/SubscriptionsPage.tsx';
import ProductVariantsPage from './pages/ProductVariantsPage.tsx';
import NotificationsPage from './pages/NotificationsPage.tsx';

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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="products" element={<ProductVariantsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
