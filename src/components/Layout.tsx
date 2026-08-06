import { Bell, ChevronDown, LayoutDashboard, Package2, Percent, ShoppingBag, Sparkles, Truck } from 'lucide-react';
import type { ReactNode } from 'react';
import { adminMock } from '../services/mockData';
import type { AppTab } from '../types';

const navItems: Array<{ key: AppTab; label: string; icon: typeof LayoutDashboard }> = [
  { key: 'dashboard', label: 'Dashboard / Métricas', icon: LayoutDashboard },
  { key: 'comercios', label: 'Comercios', icon: ShoppingBag },
  { key: 'productos', label: 'Productos', icon: Package2 },
  { key: 'promociones', label: 'Promociones', icon: Percent },
  { key: 'repartidores', label: 'Repartidores', icon: Truck },
  { key: 'pedidos', label: 'Pedidos Globales', icon: Sparkles },
];

interface LayoutProps {
  children: ReactNode;
  activeTab: AppTab;
  onChangeTab: (tab: AppTab) => void;
}

export function Layout({ children, activeTab, onChangeTab }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="w-full border-b border-slate-800 bg-slate-900/80 p-4 lg:w-72 lg:border-b-0 lg:border-r">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-lg font-semibold text-white">
              R
            </div>
            <div>
              <p className="text-sm text-slate-400">Admin Panel</p>
              <h2 className="text-lg font-semibold">Rappi Ops</h2>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => onChangeTab(key)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${
                  activeTab === key
                    ? 'bg-orange-500/15 text-orange-400 shadow-inner'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1">
          <header className="border-b border-slate-800 bg-slate-900/70 px-4 py-4 backdrop-blur sm:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-slate-400">Supervisión global</p>
                <h1 className="text-2xl font-semibold text-white">Panel de Administración</h1>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  Sistema conectado
                </div>
                <button className="rounded-full border border-slate-700 p-2 text-slate-300">
                  <Bell size={18} />
                </button>
                <div className="flex items-center gap-3 rounded-full bg-slate-800 px-3 py-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 font-semibold text-white">
                    {adminMock.avatar}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-white">{adminMock.name}</p>
                    <p className="text-xs text-slate-400">{adminMock.role}</p>
                  </div>
                  <ChevronDown size={16} className="text-slate-400" />
                </div>
              </div>
            </div>
          </header>

          <section className="p-4 sm:p-6">{children}</section>
        </main>
      </div>
    </div>
  );
}
