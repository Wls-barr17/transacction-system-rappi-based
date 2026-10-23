import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { fmtDate } from '../../lib/format';
import StatusBadge from '../../components/ui/StatusBadge';
import { selectCls } from '../../components/ui/Input';
import { EmptyState, ErrorState, Loading, PageHeader } from '../../components/ui/States';

export default function AdminDeliveries() {
  const toast = useToast();
  const deliveries = useFetch('/admin/deliveries', { interval: 8000 });
  const couriers = useFetch('/admin/couriers');

  if (deliveries.loading || couriers.loading) return <Loading />;
  if (deliveries.error) return <ErrorState error={deliveries.error} onRetry={deliveries.reload} />;

  const assign = async (d, courierId) => {
    if (!courierId) return;
    try { await api.post(`/admin/deliveries/${d.id}/assign`, { courierId }); toast.success('Repartidor asignado'); deliveries.reload(); } catch (e) { toast.error(e.message); deliveries.reload(); }
  };

  return (
    <div data-testid="admin-deliveries">
      <PageHeader title="Entregas" subtitle="Supervisa y asigna repartidores manualmente." />
      {deliveries.data.length === 0 ? <EmptyState title="No hay entregas todavía" text="Aparecen cuando un comercio confirma un pedido." /> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Entregas</caption>
            <thead className="bg-slate-50 text-slate-700"><tr><th className="p-3">Pedido</th><th className="p-3">Comercio → Dirección</th><th className="p-3">Creada</th><th className="p-3">Estado</th><th className="p-3">Repartidor</th></tr></thead>
            <tbody>
              {deliveries.data.map((d) => {
                const canAssign = ['PENDIENTE', 'ASIGNADA'].includes(d.status);
                return (
                  <tr key={d.id} className="border-t border-slate-100" data-testid="delivery-row">
                    <td className="p-3 font-semibold">#{d.order.code}</td>
                    <td className="p-3">{d.order.merchantName}<br /><span className="text-slate-600">{d.order.address}</span></td>
                    <td className="p-3">{fmtDate(d.history[0].at)}</td>
                    <td className="p-3"><StatusBadge status={d.status} /></td>
                    <td className="p-3">
                      {canAssign ? (
                        <select aria-label={`Asignar repartidor al pedido ${d.order.code}`} className={`${selectCls} max-w-[13rem]`} value={d.courierId || ''} onChange={(e) => assign(d, e.target.value)} data-testid="assign-select">
                          <option value="">Sin asignar</option>
                          {(couriers.data || []).map((c) => <option key={c.id} value={c.id}>{c.name}{c.available ? '' : ' (no disponible)'}</option>)}
                        </select>
                      ) : (d.courierName || '—')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
