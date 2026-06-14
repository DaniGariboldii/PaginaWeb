import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { initAnalytics, trackPageView } from './lib/analytics';
import { MainLayout } from './components/layout/MainLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { GuestRoute } from './routes/GuestRoute';
import { PageSpinner } from './components/ui/Spinner';

// Helper: React.lazy con exports nombrados
const named = (factory, name) => lazy(() => factory().then((m) => ({ default: m[name] })));

// Públicas
const HomePage = named(() => import('./pages/public/HomePage'), 'HomePage');
const ProductsPage = named(() => import('./pages/public/ProductsPage'), 'ProductsPage');
const ProductDetailPage = named(() => import('./pages/public/ProductDetailPage'), 'ProductDetailPage');
const ContactPage = named(() => import('./pages/public/ContactPage'), 'ContactPage');
const FaqPage = named(() => import('./pages/public/FaqPage'), 'FaqPage');
const TermsPage = named(() => import('./pages/public/TermsPage'), 'TermsPage');
const PrivacyPage = named(() => import('./pages/public/PrivacyPage'), 'PrivacyPage');
const RetractionPage = named(() => import('./pages/public/RetractionPage'), 'RetractionPage');
const NotFoundPage = named(() => import('./pages/public/NotFoundPage'), 'NotFoundPage');

// Auth
const LoginPage = named(() => import('./pages/auth/LoginPage'), 'LoginPage');
const RegisterPage = named(() => import('./pages/auth/RegisterPage'), 'RegisterPage');
const ForgotPasswordPage = named(() => import('./pages/auth/ForgotPasswordPage'), 'ForgotPasswordPage');
const ResetPasswordPage = named(() => import('./pages/auth/ResetPasswordPage'), 'ResetPasswordPage');
const VerifyEmailPage = named(() => import('./pages/auth/VerifyEmailPage'), 'VerifyEmailPage');

// Cliente
const CartPage = named(() => import('./pages/client/CartPage'), 'CartPage');
const CheckoutPage = named(() => import('./pages/client/CheckoutPage'), 'CheckoutPage');
const MyOrdersPage = named(() => import('./pages/client/MyOrdersPage'), 'MyOrdersPage');
const OrderDetailPage = named(() => import('./pages/client/OrderDetailPage'), 'OrderDetailPage');
const AddressesPage = named(() => import('./pages/client/AddressesPage'), 'AddressesPage');
const WishlistPage = named(() => import('./pages/client/WishlistPage'), 'WishlistPage');
const ProfilePage = named(() => import('./pages/client/ProfilePage'), 'ProfilePage');
const PaymentResultPage = named(() => import('./pages/client/PaymentResultPage'), 'PaymentResultPage');

// Admin (chunk separado del bundle público)
const AdminDashboard = named(() => import('./pages/admin/AdminDashboard'), 'AdminDashboard');
const AdminProductsPage = named(() => import('./pages/admin/AdminProductsPage'), 'AdminProductsPage');
const AdminProductFormPage = named(() => import('./pages/admin/AdminProductFormPage'), 'AdminProductFormPage');
const AdminCategoriesPage = named(() => import('./pages/admin/AdminCategoriesPage'), 'AdminCategoriesPage');
const AdminOrdersPage = named(() => import('./pages/admin/AdminOrdersPage'), 'AdminOrdersPage');
const AdminUsersPage = named(() => import('./pages/admin/AdminUsersPage'), 'AdminUsersPage');
const AdminStockPage = named(() => import('./pages/admin/AdminStockPage'), 'AdminStockPage');
const AdminReportsPage = named(() => import('./pages/admin/AdminReportsPage'), 'AdminReportsPage');
const AdminCouponsPage = named(() => import('./pages/admin/AdminCouponsPage'), 'AdminCouponsPage');
const AdminShippingPage = named(() => import('./pages/admin/AdminShippingPage'), 'AdminShippingPage');

const App = () => {
  const location = useLocation();

  // Inicializa GA4 / Meta Pixel una vez
  useEffect(() => { initAnalytics(); }, []);
  // Dispara page_view en cada cambio de ruta (SPA)
  useEffect(() => { trackPageView(location.pathname + location.search); }, [location.pathname, location.search]);

  return (
  <Suspense fallback={<PageSpinner />}>
    <Routes>
      {/* ── Públicas ──────────────────────────────────────────────────────── */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/productos" element={<ProductsPage />} />
        <Route path="/productos/:slug" element={<ProductDetailPage />} />

        {/* ── Solo invitados (redirige al inicio si hay sesión) ──────────── */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/recuperar" element={<ForgotPasswordPage />} />
          <Route path="/restablecer" element={<ResetPasswordPage />} />
        </Route>

        <Route path="/contacto" element={<ContactPage />} />
        <Route path="/preguntas-frecuentes" element={<FaqPage />} />
        <Route path="/terminos" element={<TermsPage />} />
        <Route path="/privacidad" element={<PrivacyPage />} />
        <Route path="/arrepentimiento" element={<RetractionPage />} />
        <Route path="/verificar" element={<VerifyEmailPage />} />

        {/* ── Carrito / checkout / resultado de pago (también para invitados) ── */}
        <Route path="/carrito" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/pago/exitoso" element={<PaymentResultPage type="exitoso" />} />
        <Route path="/pago/pendiente" element={<PaymentResultPage type="pendiente" />} />
        <Route path="/pago/rechazado" element={<PaymentResultPage type="rechazado" />} />

        {/* ── Cliente autenticado ───────────────────────────────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route path="/mis-pedidos" element={<MyOrdersPage />} />
          <Route path="/mis-pedidos/:id" element={<OrderDetailPage />} />
          <Route path="/direcciones" element={<AddressesPage />} />
          <Route path="/favoritos" element={<WishlistPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* ── Admin ─────────────────────────────────────────────────────────── */}
      <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/productos" element={<AdminProductsPage />} />
          <Route path="/admin/productos/nuevo" element={<AdminProductFormPage />} />
          <Route path="/admin/productos/:id/editar" element={<AdminProductFormPage />} />
          <Route path="/admin/categorias" element={<AdminCategoriesPage />} />
          <Route path="/admin/pedidos" element={<AdminOrdersPage />} />
          <Route path="/admin/usuarios" element={<AdminUsersPage />} />
          <Route path="/admin/stock" element={<AdminStockPage />} />
          <Route path="/admin/cupones" element={<AdminCouponsPage />} />
          <Route path="/admin/envios" element={<AdminShippingPage />} />
          <Route path="/admin/reportes" element={<AdminReportsPage />} />
        </Route>
      </Route>
    </Routes>
  </Suspense>
  );
};

export default App;
