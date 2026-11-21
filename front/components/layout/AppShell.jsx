import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Bell, Bike, LogOut, MapPin, ShoppingCart, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotifications } from '../../context/NotificationsContext';
import { useFetch } from '../../hooks/useFetch';
import { api } from '../../lib/api';
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

const ROLE_LABELS = {
  CLIENTE: 'Tu DomiFlow',
  COMERCIO: 'Centro del comercio',
  REPARTIDOR: 'Panel de repartidor',
  ADMINISTRADOR: 'CRM · Administración',
};

export default function AppShell() {
  const { user, logout } = useAuth();
  const { unread } = useNotifications();
  const { count, clear } = useCart();
  const [addressMenuOpen, setAddressMenuOpen] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const addresses = useFetch('/addresses', { enabled: user.role === 'CLIENTE' });
  const links = NAV[user.role] || [];
  const currentAddress = addresses.data?.find((address) => address.isDefault) || addresses.data?.[0];

  const selectAddress = async (address) => {
    if (address.isDefault) { setAddressMenuOpen(false); return; }
    setSavingAddress(true);
    try {
      await api.patch(`/addresses/${address.id}/default`);
      await addresses.reload();
      setAddressMenuOpen(false);
    } catch {
      await addresses.reload();
    } finally {
      setSavingAddress(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-semibold">Saltar al contenido</a>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur" data-testid="app-header">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to={homeFor(user.role)} className="flex items-center gap-2 font-display text-lg font-extrabold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-700 text-white"><Bike className="h-5 w-5" aria-hidden="true" /></span>
            DomiFlow
          </Link>
          {user.role === 'CLIENTE' && <div className="relative min-w-0">
            <button type="button" aria-haspopup="listbox" aria-expanded={addressMenuOpen} onClick={() => setAddressMenuOpen((open) => !open)} className="flex max-w-40 items-center gap-2 rounded-2xl bg-[#fff3ef] px-2 py-2 text-left text-xs font-bold text-[#57463f] hover:bg-[#ffe9e1] sm:max-w-56 sm:px-3 sm:text-sm lg:max-w-64" data-testid="delivery-address-selector">
              <MapPin className="h-4 w-4 shrink-0 text-[#ed5331]" />
              <span className="min-w-0"><small className="block text-[10px] font-semibold uppercase tracking-wide text-[#897e77]">Entregar en · cambiar</small><span className="block truncate">{currentAddress ? `${currentAddress.street}${currentAddress.neighborhood ? `, ${currentAddress.neighborhood}` : ''}` : 'Elige una dirección'}</span></span>
            </button>
            {addressMenuOpen && <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl" role="listbox" aria-label="Direcciones de entrega">
              {addresses.loading && <p className="px-3 py-2 text-sm text-slate-600">Cargando direcciones…</p>}
              {!addresses.loading && addresses.data?.length > 0 && addresses.data.map((address) => <button type="button" role="option" aria-selected={Boolean(address.isDefault)} key={address.id} disabled={savingAddress} onClick={() => selectAddress(address)} className="block w-full rounded-xl px-3 py-2 text-left hover:bg-orange-50 disabled:opacity-60">
                <span className="block text-sm font-bold text-slate-900">{address.label}{address.isDefault ? ' · Actual' : ''}</span>
                <span className="mt-0.5 block text-xs text-slate-600">{address.street}{address.neighborhood ? `, ${address.neighborhood}` : ''}, {address.city}</span>
              </button>)}
              {!addresses.loading && !addresses.data?.length && <p className="px-3 py-2 text-sm text-slate-600">Aún no tienes direcciones guardadas.</p>}
              <Link to="/perfil" onClick={() => setAddressMenuOpen(false)} className="mt-1 block rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-brand-800 hover:bg-orange-50">+ Agregar o administrar direcciones</Link>
            </div>}
          </div>}
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
      <div className={`role-strip role-strip-${user.role.toLowerCase()}`} aria-label={ROLE_LABELS[user.role]}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
          <span>{ROLE_LABELS[user.role]}</span>
          <span className="hidden sm:inline">{user.role === 'CLIENTE' ? 'Bogotá, Colombia' : user.name}</span>
        </div>
      </div>
      <main id="main" className={`app-main app-main-${user.role.toLowerCase()} mx-auto w-full max-w-6xl flex-1 px-4 py-8`}><Outlet /></main>
      <AppFooter />
    </div>
  );
}
