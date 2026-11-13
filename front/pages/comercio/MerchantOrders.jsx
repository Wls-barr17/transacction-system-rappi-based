import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { fmtDate, money } from '../../lib/format';
import Button from '../../components/ui/AppButton';
import StatusBadge from '../../components/ui/StatusBadge';
import { EmptyState, ErrorState, Loading, PageHeader } from '../../components/ui/States';

// Solo se muestran las acciones válidas para cada estado: la UI impide saltos inválidos.
const ACTIONS = {
  PENDIENTE: [{ to: 'CONFIRMADO', label: 'Aceptar pedido', variant: 'success' }, { to: 'RECHAZADO', label: 'Rechazar', variant: 'danger', confirm: '¿Rechazar este pedido?' }],
  CONFIRMADO: [{ to: 'EN_PREPARACION', label: 'Iniciar preparación', variant: 'primary' }],
  EN_PREPARACION: [{ to: 'LISTO_PARA_RECOGER', label: 'Marcar listo para recoger', variant: 'primary' }],
};
const ACTIVE = ['PENDIENTE', 'CONFIRMADO', 'EN_PREPARACION', 'LISTO_PARA_RECOGER', 'EN_CAMINO'];

export default function MerchantOrders() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch('/orders', { interval: 8000 });
  const [tab, setTab] = useState('active');

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const list = data.filter((o) => (tab === 'active' ? ACTIVE.includes(o.status) : !ACTIVE.includes(o.status)));
  const change = async (o, a) => {
    if (a.confirm && !window.confirm(a.confirm)) return;
    try { await api.patch(`/orders/${o.id}/status`, { status: a.to }); toast.success(`Pedido #${o.code}: ${a.label.toLowerCase()}`); reload(); } catch (e) { toast.error(e.message); }
  };

  return (
    <div data-testid="merchant-orders">
      <PageHeader title="Pedidos" subtitle="Se actualiza automáticamente cada pocos segundos." />
      <div role="tablist" aria-label="Filtrar pedidos" className="mb-5 flex gap-2">
        {[['active', 'En curso'], ['history', 'Historial']].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${tab === k ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 bg-white'}`}>{l}</button>
        ))}
      </div>
      {list.length === 0 ? <EmptyState title="No hay pedidos aquí" text="Cuando entren pedidos nuevos los verás en esta lista." /> : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {list.map((o) => (
            <li key={o.id} className="rounded-2xl border border-slate-200 bg-white p-5" data-testid="merchant-order">
              <div className="flex items-start justify-between gap-2">
                <div><p className="text-lg font-bold">#{o.code} · {o.customerName}</p><p className="text-sm text-slate-600">{fmtDate(o.createdAt)}</p></div>
                <StatusBadge status={o.status} />
              </div>
              <ul className="mt-3 space-y-1 text-sm">{o.items.map((i) => <li key={i.productId}>{i.qty} × {i.name}</li>)}</ul>
              <p className="mt-3 flex items-center gap-2 text-sm">Pago: <StatusBadge status={o.paymentStatus} /> · Total <strong>{money(o.total)}</strong></p>
              {o.courierName && <p className="mt-1 text-sm">Repartidor: {o.courierName}</p>}

              {ACTIONS[o.status] && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {ACTIONS[o.status].map((a) => (
                    <Button key={a.to} variant={a.variant} onClick={() => change(o, a)} disabled={a.to === 'CONFIRMADO' && o.paymentStatus !== 'APROBADO'} data-testid={`action-${a.to}`}>{a.label}</Button>
                  ))}
                </div>
              )}
              {o.status === 'PENDIENTE' && o.paymentStatus !== 'APROBADO' && <p className="mt-2 text-xs font-medium text-amber-900">Podrás aceptarlo cuando el pago esté aprobado.</p>}
              {o.status === 'LISTO_PARA_RECOGER' && <p className="mt-3 text-sm font-medium text-sky-900">Esperando al repartidor para la recogida.</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
