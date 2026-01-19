import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { SystemHealthPage } from '@/features/system/pages/SystemHealthPage'
import { PlaceholderPage } from '@/components/shared/PlaceholderPage'
import { UsersPage } from '@/features/users/pages/UsersPage'
import { UserDetailPage } from '@/features/users/pages/UserDetailPage'
import { CompaniesPage } from '@/features/companies/pages/CompaniesPage'
import { CompanyDetailPage } from '@/features/companies/pages/CompanyDetailPage'
import { KycQueuePage } from '@/features/kyc/pages/KycQueuePage'
import { TradesPage } from '@/features/trades/pages/TradesPage'
import { TradeDetailPage } from '@/features/trades/pages/TradeDetailPage'
import { DisputesPage } from '@/features/disputes/pages/DisputesPage'
import { DisputeDetailPage } from '@/features/disputes/pages/DisputeDetailPage'
import { ContentPage } from '@/features/content/pages/ContentPage'
import { CurrenciesPage } from '@/features/content/pages/CurrenciesPage'
import { CountriesPage } from '@/features/content/pages/CountriesPage'
import { PortsPage } from '@/features/content/pages/PortsPage'
import { HSNCodesPage } from '@/features/content/pages/HSNCodesPage'
import { CategoriesPage } from '@/features/content/pages/CategoriesPage'
import { IncotermsPage } from '@/features/content/pages/IncotermsPage'
import { UnitsPage } from '@/features/content/pages/UnitsPage'
// Note: CommoditiesPage removed - commodity classification merged into CategoriesPage
import { AnalyticsPage } from '@/features/analytics/pages/AnalyticsPage'
import { ActivityPage } from '@/features/activity/pages/ActivityPage'
import { ProductsPage } from '@/features/products/pages/ProductsPage'
import { ProductDetailPage } from '@/features/products/pages/ProductDetailPage'
import { AlertsPage } from '@/features/alerts/pages/AlertsPage'
import { SecurityPage } from '@/features/security/pages/SecurityPage'
import { BlogListPage } from '@/features/blog/pages/BlogListPage'
import { BlogEditorPage } from '@/features/blog/pages/BlogEditorPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Get basename for production (served at /admin/)
const basename = import.meta.env.PROD ? '/admin' : ''

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="admin-theme">
        <BrowserRouter basename={basename}>
          <Routes>
            {/* Public route - Login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />

              {/* User Management (Phase 3) */}
              <Route path="users" element={<UsersPage />} />
              <Route path="users/:id" element={<UserDetailPage />} />

              {/* Company & KYC Management (Phase 4) */}
              <Route path="companies" element={<CompaniesPage />} />
              <Route path="companies/:id" element={<CompanyDetailPage />} />
              <Route path="kyc" element={<KycQueuePage />} />

              {/* Trade Management (Phase 5) */}
              <Route path="trades" element={<TradesPage />} />
              <Route path="trades/:id" element={<TradeDetailPage />} />
              <Route path="disputes" element={<DisputesPage />} />
              <Route path="disputes/:id" element={<DisputeDetailPage />} />
              {/* Product Management (Phase 8) */}
              <Route path="products" element={<ProductsPage />} />
              <Route path="products/:id" element={<ProductDetailPage />} />
              <Route path="system" element={<SystemHealthPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />

              {/* Content Management (Phase 6) */}
              <Route path="content" element={<ContentPage />}>
                <Route path="currencies" element={<CurrenciesPage />} />
                <Route path="countries" element={<CountriesPage />} />
                <Route path="ports" element={<PortsPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="hsn-codes" element={<HSNCodesPage />} />
                <Route path="incoterms" element={<IncotermsPage />} />
                {/* Note: commodities route removed - classification merged into categories */}
                <Route path="units" element={<UnitsPage />} />
              </Route>

              {/* Blog Management (Marketplace) */}
              <Route path="blog" element={<BlogListPage />} />
              <Route path="blog/new" element={<BlogEditorPage />} />
              <Route path="blog/:id/edit" element={<BlogEditorPage />} />

              {/* Alerts System (Phase 8) */}
              <Route path="alerts" element={<AlertsPage />} />
              {/* Security Module (Phase 8) */}
              <Route path="security" element={<SecurityPage />} />
              <Route path="settings" element={<PlaceholderPage title="Settings" description="Settings page coming soon" />} />
              {/* Activity Log (Phase 8) */}
              <Route path="activity" element={<ActivityPage />} />
            </Route>

            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
