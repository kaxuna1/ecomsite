import { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';
import AdminLayout from './components/AdminLayout';
import AuthGuard from './components/AuthGuard';
import ProtectedRoute from './components/ProtectedRoute';
import { fetchLanguages } from './api/languages';

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
const MyReviews = lazy(() => import('./pages/account/MyReviews'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const ProductEditor = lazy(() => import('./pages/admin/ProductEditor'));
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
const AdminLanguages = lazy(() => import('./pages/admin/AdminLanguages'));
const AdminMedia = lazy(() => import('./pages/admin/AdminMedia'));
const AdminNewsletter = lazy(() => import('./pages/admin/AdminNewsletter'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'));
const AdminStaticTranslations = lazy(() => import('./pages/admin/AdminStaticTranslations'));

// Language wrapper component to sync i18n with URL
function LanguageWrapper() {
  const { lang } = useParams<{ lang: string }>();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch enabled languages
  const { data: languages = [], isLoading } = useQuery({
    queryKey: ['languages'],
    queryFn: () => fetchLanguages(false),
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });

  useEffect(() => {
    if (isLoading || !lang) return;

    const validLanguageCodes = languages.map(l => l.code);
    const defaultLanguage = languages.find(l => l.isDefault)?.code || 'en';

    if (validLanguageCodes.includes(lang)) {
      // Valid language - sync with i18n and store in localStorage
      if (i18n.language !== lang) {
        i18n.changeLanguage(lang);
      }
      // Store the selected language in localStorage
      localStorage.setItem('preferredLanguage', lang);
    } else {
      // Invalid language detected - this means the first segment is not a language code
      // Get preferred language from localStorage, fallback to default
      const preferredLanguage = localStorage.getItem('preferredLanguage') || defaultLanguage;

      // Validate that preferred language is still enabled
      const languageToUse = validLanguageCodes.includes(preferredLanguage)
        ? preferredLanguage
        : defaultLanguage;

      console.log('[LanguageWrapper] Invalid language detected:', lang, '- Redirecting to', languageToUse);
      navigate(`/${languageToUse}${location.pathname}`, { replace: true });
    }
  }, [lang, i18n, navigate, location.pathname, languages, isLoading]);

  return null;
}

// Component to redirect non-language-prefixed URLs
function LanguageRedirect() {
  const location = useLocation();
  const pathname = location.pathname;

  // Fetch enabled languages
  const { data: languages = [], isLoading } = useQuery({
    queryKey: ['languages'],
    queryFn: () => fetchLanguages(false),
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });

  if (isLoading) {
    return <LoadingScreen />;
  }

  const validLanguageCodes = languages.map(l => l.code);
  const defaultLanguage = languages.find(l => l.isDefault)?.code || 'en';

  // Don't redirect admin paths
  if (pathname.startsWith('/admin')) {
    return null;
  }

  // Create regex pattern for valid language codes (must match full segment)
  const languagePattern = new RegExp(`^/(${validLanguageCodes.join('|')})(/|$)`);
  const isLanguagePrefixed = languagePattern.test(pathname);

  // If not already language-prefixed, add the preferred/default language prefix
  if (!isLanguagePrefixed) {
    // Get preferred language from localStorage, fallback to default
    const preferredLanguage = localStorage.getItem('preferredLanguage') || defaultLanguage;

    // Validate that preferred language is still enabled
    const languageToUse = validLanguageCodes.includes(preferredLanguage)
      ? preferredLanguage
      : defaultLanguage;

    console.log('[LanguageRedirect] Redirecting:', pathname, '→', `/${languageToUse}${pathname}`);
    return <Navigate to={`/${languageToUse}${pathname}`} replace />;
  }

  console.log('[LanguageRedirect] Already has language prefix:', pathname);
  return null;
}

// Component to handle root redirect with default language
function RootRedirect() {
  // Fetch enabled languages
  const { data: languages = [], isLoading } = useQuery({
    queryKey: ['languages'],
    queryFn: () => fetchLanguages(false),
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });

  if (isLoading) {
    return <LoadingScreen />;
  }

  const validLanguageCodes = languages.map(l => l.code);
  const defaultLanguage = languages.find(l => l.isDefault)?.code || 'en';

  // Get preferred language from localStorage, fallback to default
  const preferredLanguage = localStorage.getItem('preferredLanguage') || defaultLanguage;

  // Validate that preferred language is still enabled
  const languageToUse = validLanguageCodes.includes(preferredLanguage)
    ? preferredLanguage
    : defaultLanguage;

  console.log('[RootRedirect] Redirecting to:', `/${languageToUse}`);
  return <Navigate to={`/${languageToUse}`} replace />;
}

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Redirect root to default language */}
        <Route path="/" element={<RootRedirect />} />

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
            <Route
              path="account/reviews"
              element={
                <ProtectedRoute>
                  <MyReviews />
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
          <Route path="products/new" element={<ProductEditor />} />
          <Route path="products/:id/edit" element={<ProductEditor />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="attributes" element={<AdminAttributes />} />
          <Route path="variant-options" element={<AdminVariantOptions />} />
          <Route path="media" element={<AdminMedia />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="promo-codes" element={<AdminPromoCodes />} />
          <Route path="cms" element={<AdminCMS />} />
          <Route path="cms/edit/:id" element={<AdminCMSPageEditor />} />
          <Route path="cms/inline-edit/:id" element={<AdminCMSInlineEditor />} />
          <Route path="admin-users" element={<AdminUsers />} />
          <Route path="customers" element={<RegularUsers />} />
          <Route path="navigation" element={<AdminNavigation />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="languages" element={<AdminLanguages />} />
          <Route path="translations" element={<AdminTranslations />} />
          <Route path="cms-translations" element={<AdminCMSTranslations />} />
          <Route path="static-translations" element={<AdminStaticTranslations />} />
          <Route path="newsletter" element={<AdminNewsletter />} />
        </Route>

        {/* Catch-all: redirect any non-language-prefixed paths to /en/{path} */}
        <Route path="*" element={<LanguageRedirect />} />
      </Routes>
    </Suspense>
  );
}

export default App;
