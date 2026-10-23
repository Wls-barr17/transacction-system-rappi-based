import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { homeFor } from './lib/constants';
import { Loading } from './components/ui/States';
import AppShell from './components/layout/AppShell';

import Landing from './pages/shared/Landing';
import { NotFoundPage } from '@/components/ui/not-found-page';
import NotificationsPage from './pages/shared/NotificationsPage';
import Profile from './pages/shared/Profile';
import SignIn from './pages/auth/SignIn';
import Register from './pages/auth/Register';

import Catalog from './pages/cliente/Catalog';
import MerchantDetail from './pages/cliente/MerchantDetail';
import Cart from './pages/cliente/Cart';
import Checkout from './pages/cliente/Checkout';
import Payment from './pages/cliente/Payment';
import Orders from './pages/cliente/Orders';
import OrderTracking from './pages/cliente/OrderTracking';

import MerchantDashboard from './pages/comercio/Dashboard';
import MerchantProducts from './pages/comercio/Products';
import MerchantInventory from './pages/comercio/Inventory';
import MerchantOrders from './pages/comercio/MerchantOrders';

import Deliveries from './pages/repartidor/Deliveries';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminEmployees from './pages/admin/AdminEmployees';
import AdminMerchants from './pages/admin/AdminMerchants';
import AdminDeliveries from './pages/admin/AdminDeliveries';

function RequireAuth() {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Loading label="Cargando tu sesión…" />;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return <Outlet />;
}

function RoleGate({ role }) {
  const { user } = useAuth();
  return user.role === role ? <Outlet /> : <Navigate to={homeFor(user.role)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<SignIn />} />
      <Route path="/registro" element={<Register />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/notificaciones" element={<NotificationsPage />} />
          <Route path="/perfil" element={<Profile />} />

          <Route element={<RoleGate role="CLIENTE" />}>
            <Route path="/cliente" element={<Catalog />} />
            <Route path="/cliente/comercio/:id" element={<MerchantDetail />} />
            <Route path="/cliente/carrito" element={<Cart />} />
            <Route path="/cliente/checkout" element={<Checkout />} />
            <Route path="/cliente/pago/:orderId" element={<Payment />} />
            <Route path="/cliente/pedidos" element={<Orders />} />
            <Route path="/cliente/pedidos/:id" element={<OrderTracking />} />
          </Route>

          <Route element={<RoleGate role="COMERCIO" />}>
            <Route path="/comercio" element={<MerchantDashboard />} />
            <Route path="/comercio/productos" element={<MerchantProducts />} />
            <Route path="/comercio/inventario" element={<MerchantInventory />} />
            <Route path="/comercio/pedidos" element={<MerchantOrders />} />
          </Route>

          <Route element={<RoleGate role="REPARTIDOR" />}>
            <Route path="/repartidor" element={<Deliveries />} />
          </Route>

          <Route element={<RoleGate role="ADMINISTRADOR" />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/usuarios" element={<AdminUsers />} />
            <Route path="/admin/empleados" element={<AdminEmployees />} />
            <Route path="/admin/comercios" element={<AdminMerchants />} />
            <Route path="/admin/entregas" element={<AdminDeliveries />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
