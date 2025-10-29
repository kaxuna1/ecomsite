import { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';
import AdminLayout from './components/AdminLayout';
import AuthGuard from './components/AuthGuard';
import ProtectedRoute from './components/ProtectedRoute';

const HomePage = lazy(() => import('./pages/CMSHomePage'));
const CMSPage = lazy(() => import('./pages/CMSPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const NewArrivalsPage = lazy(() => import('./pages/NewArrivalsPage'));
const BestSellersPage = lazy(() => import('./pages/BestSellersPage'));
const SalePage = lazy(() => import('./pages/SalePage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'));

// Auth pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));

// Account pages
const ProfilePage = lazy(() => import('./pages/account/ProfilePage'));
const OrdersPage = lazy(() => import('./pages/account/OrdersPage'));
const FavoritesPage = lazy(() => import('./pages/account/FavoritesPage'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminPromoCodes = lazy(() => import('./pages/admin/AdminPromoCodes'));
const AdminCMS = lazy(() => import('./pages/admin/AdminCMS'));
const AdminCMSPageEditor = lazy(() => import('./pages/admin/AdminCMSPageEditor'));
const AdminCMSInlineEditor = lazy(() => import('./pages/admin/AdminCMSInlineEditor'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const RegularUsers = lazy(() => import('./pages/admin/RegularUsers'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminTranslations = lazy(() => import('./pages/admin/AdminTranslations'));
const AdminCMSTranslations = lazy(() => import('./pages/admin/AdminCMSTranslations'));
const AdminNavigation = lazy(() => import('./pages/admin/AdminNavigation'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminAttributes = lazy(() => import('./pages/admin/AdminAttributes'));
const AdminVariantOptions = lazy(() => import('./pages/admin/AdminVariantOptions'));

// Language wrapper component to sync i18n with URL
function LanguageWrapper() {
  const { lang } = useParams<{ lang: string }>();
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    if (lang && ['en', 'ka'].includes(lang) && i18n.language !== lang) {
      i18n.changeLanguage(lang);
    } else if (lang && !['en', 'ka'].includes(lang)) {
      // Invalid language, redirect to English
      navigate('/en', { replace: true });
    }
  }, [lang, i18n, navigate]);

  return null;
}

// Component to redirect non-language-prefixed URLs
function LanguageRedirect() {
  const location = useLocation();
  const pathname = location.pathname;

  // Check if path is already language-prefixed (starts with /en or /ka)
  const isLanguagePrefixed = /^\/(en|ka)/.test(pathname);

  // If path doesn't start with /admin and isn't already language-prefixed
  if (!pathname.startsWith('/admin') && !isLanguagePrefixed) {
    return <Navigate to={`/en${pathname}`} replace />;
  }

  return null;
}

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Redirect root to default language */}
        <Route path="/" element={<Navigate to="/en" replace />} />

        {/* Language-prefixed routes */}
        <Route path="/:lang">
          {/* Public routes with layout */}
          <Route element={<><LanguageWrapper /><Layout /></>}>
            <Route index element={<HomePage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="new-arrivals" element={<NewArrivalsPage />} />
            <Route path="best-sellers" element={<BestSellersPage />} />
            <Route path="sale" element={<SalePage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="order-success" element={<OrderSuccessPage />} />

            {/* Protected account routes with layout */}
            <Route
              path="account/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/orders"
              element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/favorites"
              element={
                <ProtectedRoute>
                  <FavoritesPage />
                </ProtectedRoute>
              }
            />

            {/* Dynamic CMS pages - must be last to avoid conflicts */}
            <Route path=":slug" element={<CMSPage />} />
          </Route>

          {/* Auth routes without layout */}
          <Route path="login" element={<><LanguageWrapper /><LoginPage /></>} />
          <Route path="signup" element={<><LanguageWrapper /><SignupPage /></>} />
        </Route>

        {/* Admin routes - not language-specific */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AuthGuard>
              <AdminLayout />
            </AuthGuard>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="attributes" element={<AdminAttributes />} />
          <Route path="variant-options" element={<AdminVariantOptions />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="promo-codes" element={<AdminPromoCodes />} />
          <Route path="cms" element={<AdminCMS />} />
          <Route path="cms/edit/:id" element={<AdminCMSPageEditor />} />
          <Route path="cms/inline-edit/:id" element={<AdminCMSInlineEditor />} />
          <Route path="admin-users" element={<AdminUsers />} />
          <Route path="customers" element={<RegularUsers />} />
          <Route path="navigation" element={<AdminNavigation />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="translations" element={<AdminTranslations />} />
          <Route path="cms-translations" element={<AdminCMSTranslations />} />
        </Route>

        {/* Catch-all: redirect any non-language-prefixed paths to /en/{path} */}
        <Route path="*" element={<LanguageRedirect />} />
      </Routes>
    </Suspense>
  );
}

export default App;
