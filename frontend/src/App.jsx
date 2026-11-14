import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { ChatProvider } from '@/context/ChatContext';
import { ToastProvider } from '@/context/ToastContext';
import { Navbar } from '@/components/common/Navbar';
import { Footer } from '@/components/common/Footer';
import { MarketplaceLayout } from '@/layouts/MarketplaceLayout';
import { SellerLayout } from '@/layouts/SellerLayout';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleRoute } from '@/components/auth/RoleRoute';
import { OnboardingModal } from '@/components/auth/OnboardingModal';
import { PageTransition } from '@/components/motion/PageTransition';
import Home from '@/pages/Home';

// Route-level code splitting for enhanced performance & reduced initial bundle
const Assistant = lazy(() => import('@/pages/Assistant'));
const Results = lazy(() => import('@/pages/Results'));
const Product = lazy(() => import('@/pages/Product'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const OrderSuccess = lazy(() => import('@/pages/OrderSuccess'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const AccountSettings = lazy(() => import('@/pages/AccountSettings'));
const BecomeSeller = lazy(() => import('@/pages/BecomeSeller'));
const SellerRegistration = lazy(() => import('@/pages/SellerRegistration'));
const SellerVerification = lazy(() => import('@/pages/SellerVerification'));
const SellerDashboard = lazy(() => import('@/pages/SellerDashboard'));
const SellerProfile = lazy(() => import('@/pages/SellerProfile'));
const StoreSettings = lazy(() => import('@/pages/StoreSettings'));
const SellerProducts = lazy(() => import('@/pages/SellerProducts'));
const ProductForm = lazy(() => import('@/pages/ProductForm'));
const SellerInventory = lazy(() => import('@/pages/SellerInventory'));
const SellerCategories = lazy(() => import('@/pages/SellerCategories'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function RouteFallback() {
  return (
    <div
      className="flex min-h-[50vh] items-center justify-center p-8"
      role="status"
      aria-label="Loading page"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#172554] border-t-transparent" />
      <span className="sr-only">Loading page...</span>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Suspense fallback={<RouteFallback />}>
        <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <Home />
            </PageTransition>
          }
        />
        <Route
          path="/assistant"
          element={
            <PageTransition>
              <Assistant />
            </PageTransition>
          }
        />
        <Route
          path="/search"
          element={
            <PageTransition>
              <Assistant />
            </PageTransition>
          }
        />
        <Route
          path="/results"
          element={
            <PageTransition>
              <Results />
            </PageTransition>
          }
        />
        <Route
          path="/product/:id"
          element={
            <PageTransition>
              <Product />
            </PageTransition>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <PageTransition>
                <Checkout />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-success"
          element={
            <ProtectedRoute>
              <PageTransition>
                <OrderSuccess />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PageTransition>
              <Login />
            </PageTransition>
          }
        />
        <Route
          path="/register"
          element={
            <PageTransition>
              <Register />
            </PageTransition>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PageTransition>
              <ForgotPassword />
            </PageTransition>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <PageTransition>
                <AccountSettings />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sell"
          element={
            <PageTransition>
              <BecomeSeller />
            </PageTransition>
          }
        />
        <Route
          path="/seller/register"
          element={
            <ProtectedRoute>
              <PageTransition>
                <SellerRegistration />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/verification"
          element={
            <ProtectedRoute>
              <SellerLayout>
                <PageTransition>
                  <SellerVerification />
                </PageTransition>
              </SellerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/dashboard"
          element={
            <RoleRoute allowedRoles={['SELLER', 'ADMIN']}>
              <SellerLayout>
                <PageTransition>
                  <SellerDashboard />
                </PageTransition>
              </SellerLayout>
            </RoleRoute>
          }
        />
        <Route
          path="/seller"
          element={
            <RoleRoute allowedRoles={['SELLER', 'ADMIN']}>
              <SellerLayout>
                <PageTransition>
                  <SellerDashboard />
                </PageTransition>
              </SellerLayout>
            </RoleRoute>
          }
        />
        {/* Product Management Routes */}
        <Route
          path="/seller/products"
          element={
            <RoleRoute allowedRoles={['SELLER', 'ADMIN']}>
              <SellerLayout>
                <PageTransition>
                  <SellerProducts />
                </PageTransition>
              </SellerLayout>
            </RoleRoute>
          }
        />
        <Route
          path="/seller/products/new"
          element={
            <RoleRoute allowedRoles={['SELLER', 'ADMIN']}>
              <SellerLayout>
                <PageTransition>
                  <ProductForm />
                </PageTransition>
              </SellerLayout>
            </RoleRoute>
          }
        />
        <Route
          path="/seller/products/:id/edit"
          element={
            <RoleRoute allowedRoles={['SELLER', 'ADMIN']}>
              <SellerLayout>
                <PageTransition>
                  <ProductForm />
                </PageTransition>
              </SellerLayout>
            </RoleRoute>
          }
        />
        <Route
          path="/seller/inventory"
          element={
            <RoleRoute allowedRoles={['SELLER', 'ADMIN']}>
              <SellerLayout>
                <PageTransition>
                  <SellerInventory />
                </PageTransition>
              </SellerLayout>
            </RoleRoute>
          }
        />
        <Route
          path="/seller/categories"
          element={
            <RoleRoute allowedRoles={['SELLER', 'ADMIN']}>
              <SellerLayout>
                <PageTransition>
                  <SellerCategories />
                </PageTransition>
              </SellerLayout>
            </RoleRoute>
          }
        />

        {/* Profile & Store Settings Routes */}
        <Route
          path="/seller/profile"
          element={
            <RoleRoute allowedRoles={['SELLER', 'ADMIN']}>
              <SellerLayout>
                <PageTransition>
                  <SellerProfile />
                </PageTransition>
              </SellerLayout>
            </RoleRoute>
          }
        />
        <Route
          path="/seller/security"
          element={
            <RoleRoute allowedRoles={['SELLER', 'ADMIN']}>
              <SellerLayout>
                <PageTransition>
                  <SellerProfile />
                </PageTransition>
              </SellerLayout>
            </RoleRoute>
          }
        />
        <Route
          path="/seller/store-settings"
          element={
            <RoleRoute allowedRoles={['SELLER', 'ADMIN']}>
              <SellerLayout>
                <PageTransition>
                  <StoreSettings />
                </PageTransition>
              </SellerLayout>
            </RoleRoute>
          }
        />
        <Route
          path="/seller/settings"
          element={
            <RoleRoute allowedRoles={['SELLER', 'ADMIN']}>
              <SellerLayout>
                <PageTransition>
                  <StoreSettings />
                </PageTransition>
              </SellerLayout>
            </RoleRoute>
          }
        />

        {/* Orders & Financials Routes */}
        <Route
          path="/seller/orders"
          element={
            <RoleRoute allowedRoles={['SELLER', 'ADMIN']}>
              <SellerLayout>
                <PageTransition>
                  <SellerDashboard defaultTab="orders" />
                </PageTransition>
              </SellerLayout>
            </RoleRoute>
          }
        />
        <Route
          path="/seller/sales"
          element={
            <RoleRoute allowedRoles={['SELLER', 'ADMIN']}>
              <SellerLayout>
                <PageTransition>
                  <SellerDashboard defaultTab="sales" />
                </PageTransition>
              </SellerLayout>
            </RoleRoute>
          }
        />
        <Route
          path="/seller/transactions"
          element={
            <RoleRoute allowedRoles={['SELLER', 'ADMIN']}>
              <SellerLayout>
                <PageTransition>
                  <SellerDashboard defaultTab="transactions" />
                </PageTransition>
              </SellerLayout>
            </RoleRoute>
          }
        />
        <Route
          path="/seller/revenue"
          element={
            <RoleRoute allowedRoles={['SELLER', 'ADMIN']}>
              <SellerLayout>
                <PageTransition>
                  <SellerDashboard defaultTab="revenue" />
                </PageTransition>
              </SellerLayout>
            </RoleRoute>
          }
        />
        <Route
          path="/seller/settlements"
          element={
            <RoleRoute allowedRoles={['SELLER', 'ADMIN']}>
              <SellerLayout>
                <PageTransition>
                  <SellerDashboard defaultTab="settlements" />
                </PageTransition>
              </SellerLayout>
            </RoleRoute>
          }
        />
        <Route
          path="/seller/analytics"
          element={
            <RoleRoute allowedRoles={['SELLER', 'ADMIN']}>
              <SellerLayout>
                <PageTransition>
                  <SellerDashboard defaultTab="sales" />
                </PageTransition>
              </SellerLayout>
            </RoleRoute>
          }
        />
        <Route
          path="/seller/corridors"
          element={
            <RoleRoute allowedRoles={['SELLER', 'ADMIN']}>
              <SellerLayout>
                <PageTransition>
                  <SellerDashboard defaultTab="customers" />
                </PageTransition>
              </SellerLayout>
            </RoleRoute>
          }
        />
        <Route
          path="/seller/shipping"
          element={
            <RoleRoute allowedRoles={['SELLER', 'ADMIN']}>
              <SellerLayout>
                <PageTransition>
                  <SellerDashboard defaultTab="shipping" />
                </PageTransition>
              </SellerLayout>
            </RoleRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <PageTransition>
                <AdminDashboard />
              </PageTransition>
            </RoleRoute>
          }
        />
        <Route
          path="*"
          element={
            <PageTransition>
              <NotFound />
            </PageTransition>
          }
        />
      </Routes>
    </Suspense>
  </AnimatePresence>
);
}

function AppShell() {
  const location = useLocation();
  const isSellerPortal =
    location.pathname.startsWith('/seller') &&
    location.pathname !== '/seller/register';

  if (isSellerPortal) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F8F9FA] text-[#17202F]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#172554] focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none"
        >
          Skip to main content
        </a>
        <ScrollToTop />
        <main id="main-content" className="flex-1" tabIndex={-1}>
          <AnimatedRoutes />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F8FA] text-[#17202F]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#172554] focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>
      <ScrollToTop />
      <Navbar />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        <AnimatedRoutes />
      </main>
      <CartDrawer />
      <OnboardingModal />
      <Footer />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <CurrencyProvider>
          <AppProvider>
            <AuthProvider>
              <CartProvider>
                <ChatProvider>
                  <AppShell />
                </ChatProvider>
              </CartProvider>
            </AuthProvider>
          </AppProvider>
        </CurrencyProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;