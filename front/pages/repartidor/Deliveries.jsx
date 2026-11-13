import { useState } from 'react';
import { MapPin, Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { DELIVERY_FLOW } from '../../lib/constants';
import { fmtDate, money } from '../../lib/format';
import Button from '../../components/ui/AppButton';
import OrderStepper from '../../components/ui/OrderStepper';
import StatusBadge from '../../components/ui/StatusBadge';
import Switch from '../../components/ui/Switch';
import { EmptyState, ErrorState, Loading, PageHeader } from '../../components/ui/States';

// Un solo clic para avanzar; entregar y cancelar piden confirmación (máximo 2 clics).
const NEXT = {
  ASIGNADA: { to: 'RECOGIDA', label: 'Marcar como recogida', variant: 'primary' },
  RECOGIDA: { to: 'EN_CAMINO', label: 'Salir en camino', variant: 'primary' },
  EN_CAMINO: { to: 'ENTREGADA', label: 'Confirmar entrega', variant: 'success', confirm: true },
};

function ActiveDelivery({ d, onChanged }) {
  const toast = useToast();
  const [confirming, setConfirming] = useState(null);
  const o = d.order;
  const next = NEXT[d.status];
  const waiting = d.status === 'ASIGNADA' && o.status !== 'LISTO_PARA_RECOGER';

  const change = async (to) => {
    try { await api.patch(`/deliveries/${d.id}/status`, { status: to }); setConfirming(null); onChanged(); } catch (e) { toast.error(e.message); }
  };

  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-5" data-testid="active-delivery">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-lg font-bold">Pedido #{o.code}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm"><Store className="h-4 w-4" aria-hidden="true" />Recoger en {o.merchantName}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm"><MapPin className="h-4 w-4" aria-hidden="true" />{o.address}</p>
        </div>
        <StatusBadge status={d.status} />
      </div>
      <div className="mt-4"><OrderStepper status={d.status} flow={DELIVERY_FLOW} /></div>
      <p className="mt-3 text-sm text-slate-700">Cliente: {o.customerName} · Total {money(o.total)}</p>

      {waiting && <p role="status" className="mt-3 rounded-lg bg-sky-50 p-2 text-sm font-medium text-sky-900">Esperando que el comercio marque el pedido como listo para recoger.</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {next && confirming !== next.to && (
          <Button variant={next.variant} size="lg" disabled={waiting} data-testid={`delivery-${next.to}`}
            onClick={() => (next.confirm ? setConfirming(next.to) : change(next.to))}>{next.label}</Button>
        )}
        {confirming === 'ENTREGADA' && (
          <div role="alertdialog" aria-label="Confirmar entrega" className="flex flex-wrap items-center gap-2 rounded-xl border border-green-400 bg-green-50 p-3">
            <p className="text-sm font-semibold text-green-900">¿Entregaste el pedido al cliente?</p>
            <Button variant="success" onClick={() => change('ENTREGADA')} data-testid="confirm-delivered">Sí, entregado</Button>
            <Button variant="secondary" onClick={() => setConfirming(null)}>Volver</Button>
          </div>
        )}
        {confirming === 'CANCELADA' ? (
          <div role="alertdialog" aria-label="Confirmar cancelación" className="flex flex-wrap items-center gap-2 rounded-xl border border-red-400 bg-red-50 p-3">
            <p className="text-sm font-semibold text-red-900">¿Cancelar esta entrega?</p>
            <Button variant="danger" onClick={() => change('CANCELADA')} data-testid="confirm-cancel">Sí, cancelar</Button>
            <Button variant="secondary" onClick={() => setConfirming(null)}>Volver</Button>
          </div>
        ) : confirming === null && <Button variant="ghost" onClick={() => setConfirming('CANCELADA')} data-testid="delivery-cancel">Cancelar entrega</Button>}
      </div>
    </li>
  );
}

export default function Deliveries() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const { data, loading, error, reload } = useFetch('/deliveries', { interval: 7000 });
  const [saving, setSaving] = useState(false);

  const setAvail = async (available) => {
    setSaving(true);
    try { setUser(await api.patch('/courier/availability', { available })); reload(); } catch (e) { toast.error(e.message); } finally { setSaving(false); }
  };
  const take = async (id) => { try { await api.post(`/deliveries/${id}/take`); toast.success('Entrega asignada a ti'); reload(); } catch (e) { toast.error(e.message); reload(); } };

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const active = data.mine.filter((d) => ['ASIGNADA', 'RECOGIDA', 'EN_CAMINO'].includes(d.status));
  const done = data.mine.filter((d) => ['ENTREGADA', 'CANCELADA'].includes(d.status));

  return (
    <div className="space-y-8" data-testid="courier-page">
      <PageHeader title="Mis entregas" subtitle="Activa tu disponibilidad para recibir y tomar entregas." />

      <section className={`flex items-center justify-between gap-4 rounded-2xl border-2 p-5 ${user.available ? 'border-green-700 bg-green-50' : 'border-slate-300 bg-white'}`}>
        <div>
          <h2 className="text-lg font-bold">{user.available ? 'Estás disponible' : 'No estás disponible'}</h2>
          <p className="text-sm text-slate-700">{user.available ? 'Verás las entregas pendientes y podrás tomarlas.' : 'No recibirás nuevas entregas.'}</p>
        </div>
        <Switch checked={!!user.available} onChange={setAvail} disabled={saving} label="Disponibilidad" />
      </section>

      <section aria-labelledby="h-act">
        <h2 id="h-act" className="mb-3 text-xl font-bold">En curso</h2>
        {active.length === 0 ? <EmptyState title="No tienes entregas en curso" text="Toma una de las disponibles o espera a que el administrador te asigne una." /> : (
          <ul className="space-y-4">{active.map((d) => <ActiveDelivery key={d.id} d={d} onChanged={reload} />)}</ul>
        )}
      </section>

      {user.available && (
        <section aria-labelledby="h-av">
          <h2 id="h-av" className="mb-3 text-xl font-bold">Disponibles para tomar</h2>
          {data.available.length === 0 ? <p className="text-sm text-slate-600">No hay entregas pendientes por ahora.</p> : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {data.available.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4" data-testid="available-delivery">
                  <div><p className="font-bold">#{d.order.code} · {d.order.merchantName}</p><p className="text-sm text-slate-600">{d.order.address}</p></div>
                  <Button size="sm" onClick={() => take(d.id)} data-testid="take-delivery">Tomar entrega</Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {done.length > 0 && (
        <section aria-labelledby="h-done">
          <h2 id="h-done" className="mb-3 text-xl font-bold">Historial</h2>
          <ul className="space-y-2">
            {done.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
                <span className="font-semibold">#{d.order.code} · {d.order.merchantName}</span>
                <span className="hidden text-slate-600 sm:block">{fmtDate(d.history[d.history.length - 1].at)}</span>
                <StatusBadge status={d.status} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
