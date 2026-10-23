import { Activity, Banknote, ShoppingCart, Users2 } from 'lucide-react';
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { KpiCard } from '../components/KpiCard';
import type { Order } from '../types';

const salesData = [
  { day: 'L', sales: 1800000 },
  { day: 'M', sales: 2400000 },
  { day: 'M', sales: 2100000 },
  { day: 'J', sales: 2850000 },
  { day: 'V', sales: 3200000 },
  { day: 'S', sales: 3900000 },
  { day: 'D', sales: 3550000 },
];

interface DashboardPageProps {
  totalSales: number;
  activeOrders: number;
  activeCommerces: number;
  availableDrivers: number;
  recentOrders: Order[];
}

export function DashboardPage({ totalSales, activeOrders, activeCommerces, availableDrivers, recentOrders }: DashboardPageProps) {
  const ordersToday = recentOrders.filter((order) => order.createdAt.startsWith('2026-08-01')).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total Ventas del día"
          value={`$ ${totalSales.toLocaleString('es-CO')}`}
          subtitle="Actualizado en tiempo real"
          icon={<Banknote size={18} />}
        />
        <KpiCard
          title="Pedidos Activos"
          value={String(activeOrders)}
          subtitle="En preparación y en camino"
          icon={<ShoppingCart size={18} />}
          accent="from-cyan-500 to-sky-400"
        />
        <KpiCard
          title="Comercios Activos"
          value={String(activeCommerces)}
          subtitle="Convenios vigentes"
          icon={<Activity size={18} />}
          accent="from-emerald-500 to-lime-400"
        />
        <KpiCard
          title="Repartidores Disponibles"
          value={String(availableDrivers)}
          subtitle="Listos para asignación"
          icon={<Users2 size={18} />}
          accent="from-violet-500 to-fuchsia-400"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.8fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/30">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Ventas de la semana</h2>
              <p className="text-sm text-slate-400">Proyección y desempeño operativo</p>
            </div>
            <span className="rounded-full bg-orange-500/10 px-3 py-1 text-sm text-orange-300">+18.2%</span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="sales" fill="#f97316" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/30">
          <h2 className="mb-4 text-lg font-semibold text-white">Resumen operativo</h2>
          <div className="space-y-3">
            {[
              { label: 'Pedidos hoy', value: String(ordersToday), detail: 'Actualizados desde el flujo de pedidos' },
              { label: 'Tiempo promedio', value: '22 min', detail: 'Bajo monitoreo activo' },
              { label: 'Comercios activos', value: String(activeCommerces), detail: 'Convenios vigentes' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className="text-xl font-semibold text-white">{item.value}</p>
                <p className="text-xs text-emerald-400">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
