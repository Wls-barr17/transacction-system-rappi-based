import { useMemo, useState } from 'react';
import { Bike, Receipt, Store, Users, Wallet } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { ORDER_FLOW } from '../../lib/constants';
import { dayKey, fmtDate, money } from '../../lib/format';
import Calendar from '../../components/ui/Calendar';
import StatusBadge from '../../components/ui/StatusBadge';
import { selectCls } from '../../components/ui/Input';
import { EmptyState, ErrorState, Loading, PageHeader } from '../../components/ui/States';

export default function AdminDashboard() {
  const stats = useFetch('/admin/stats', { interval: 10000 });
  const orders = useFetch('/orders', { interval: 10000 });
  const [day, setDay] = useState(null);
  const [status, setStatus] = useState('');
  const marked = useMemo(() => [...new Set((orders.data || []).map((o) => dayKey(o.createdAt)))], [orders.data]);

  if (stats.loading || orders.loading) return <Loading />;
  if (stats.error || orders.error) return <ErrorState error={stats.error || orders.error} onRetry={() => { stats.reload(); orders.reload(); }} />;

  const s = stats.data;
  const cards = [[Users, 'Usuarios', s.users], [Store, 'Comercios', s.merchants], [Receipt, 'Pedidos', s.orders], [Bike, 'Entregas activas', s.activeDeliveries], [Wallet, 'Ingresos entregados', money(s.revenue)]];
  const list = orders.data.filter((o) => (!day || dayKey(o.createdAt) === dayKey(day)) && (!status || o.status === status));

  return (
    <div className="space-y-8" data-testid="admin-dashboard">
      <PageHeader title="Panel general" subtitle="Estado global y historial de operaciones." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([Icon, label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4" data-testid="stat-card">
            <Icon className="h-5 w-5 text-brand-700" aria-hidden="true" />
            <p className="mt-2 text-2xl font-extrabold">{value}</p>
            <p className="text-sm text-slate-700">{label}</p>
          </div>
        ))}
      </div>
      {s.pendingDeliveries > 0 && <p role="status" className="rounded-xl border border-amber-300 bg-amber-100 p-3 text-sm font-semibold text-amber-900">Hay {s.pendingDeliveries} entrega(s) sin repartidor. Asígnalas en la sección Entregas.</p>}

      <section aria-labelledby="h-hist" className="grid gap-6 md:grid-cols-[20rem_1fr]">
        <div className="space-y-4">
          <h2 id="h-hist" className="text-xl font-bold">Historial de operaciones</h2>
          <Calendar selected={day} onSelect={setDay} marked={marked} />
          <div>
            <label htmlFor="f-status" className="mb-1 block text-sm font-semibold">Estado del pedido</label>
            <select id="f-status" className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)} data-testid="filter-status">
              <option value="">Todos</option>
              {[...ORDER_FLOW, 'CANCELADO', 'RECHAZADO'].map((st) => <option key={st} value={st}>{st.replaceAll('_', ' ').toLowerCase()}</option>)}
            </select>
          </div>
        </div>
        {list.length === 0 ? <EmptyState title="Sin resultados" text="Cambia la fecha o el estado del filtro." /> : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Historial de pedidos</caption>
              <thead className="bg-slate-50 text-slate-700"><tr><th className="p-3">Pedido</th><th className="p-3">Cliente</th><th className="p-3">Comercio</th><th className="p-3">Repartidor</th><th className="p-3">Total</th><th className="p-3">Fecha</th><th className="p-3">Estado</th></tr></thead>
              <tbody>
                {list.map((o) => (
                  <tr key={o.id} className="border-t border-slate-100" data-testid="admin-order-row">
                    <td className="p-3 font-semibold">#{o.code}</td><td className="p-3">{o.customerName}</td><td className="p-3">{o.merchantName}</td>
                    <td className="p-3">{o.courierName || '—'}</td><td className="p-3">{money(o.total)}</td><td className="p-3">{fmtDate(o.createdAt)}</td><td className="p-3"><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
