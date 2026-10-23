import { Link, NavLink, Outlet } from 'react-router-dom';
import { Bell, Bike, LogOut, ShoppingCart, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotifications } from '../../context/NotificationsContext';
import { homeFor } from '../../lib/constants';
import AppFooter from './AppFooter';

const NAV = {
  CLIENTE: [['/cliente', 'Comercios', true], ['/cliente/pedidos', 'Mis pedidos']],
  COMERCIO: [['/comercio', 'Panel', true], ['/comercio/pedidos', 'Pedidos'], ['/comercio/productos', 'Productos'], ['/comercio/inventario', 'Inventario']],
  REPARTIDOR: [['/repartidor', 'Mis entregas', true]],
  ADMINISTRADOR: [['/admin', 'Panel general', true], ['/admin/usuarios', 'Usuarios'], ['/admin/empleados', 'Empleados'], ['/admin/comercios', 'Comercios'], ['/admin/entregas', 'Entregas']],
};

const linkCls = ({ isActive }) =>
  `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? 'bg-brand-100 text-brand-900' : 'text-slate-700 hover:bg-slate-100'}`;

export default function AppShell() {
  const { user, logout } = useAuth();
  const { unread } = useNotifications();
  const { count, clear } = useCart();
  const links = NAV[user.role] || [];

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-semibold">Saltar al contenido</a>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur" data-testid="app-header">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to={homeFor(user.role)} className="flex items-center gap-2 font-display text-lg font-extrabold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-700 text-white"><Bike className="h-5 w-5" aria-hidden="true" /></span>
            DomiFlow
          </Link>
          <nav aria-label="Principal" className="ml-4 hidden flex-1 gap-1 md:flex">
            {links.map(([to, label, end]) => <NavLink key={to} to={to} end={end} className={linkCls}>{label}</NavLink>)}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            {user.role === 'CLIENTE' && (
              <Link to="/cliente/carrito" aria-label={`Carrito, ${count} productos`} data-testid="nav-cart" className="relative rounded-full p-2.5 hover:bg-slate-100">
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                {count > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-700 px-1 text-xs font-bold text-white">{count}</span>}
              </Link>
            )}
            <Link to="/notificaciones" aria-label={`Notificaciones, ${unread} sin leer`} data-testid="nav-notifications" className="relative rounded-full p-2.5 hover:bg-slate-100">
              <Bell className="h-5 w-5" aria-hidden="true" />
              {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-700 px-1 text-xs font-bold text-white">{unread}</span>}
            </Link>
            <Link to="/perfil" className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold hover:bg-slate-100 sm:flex" data-testid="nav-profile">
              <User className="h-5 w-5" aria-hidden="true" />{user.name.split(' ')[0]}
            </Link>
            <button type="button" onClick={() => { clear(); logout(); }} aria-label="Cerrar sesión" data-testid="logout" className="rounded-full p-2.5 text-slate-700 hover:bg-slate-100">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
        <nav aria-label="Principal móvil" className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
          {links.map(([to, label, end]) => <NavLink key={to} to={to} end={end} className={linkCls}>{label}</NavLink>)}
          <NavLink to="/perfil" className={linkCls}>Perfil</NavLink>
        </nav>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8"><Outlet /></main>
      <AppFooter />
    </div>
  );
}
