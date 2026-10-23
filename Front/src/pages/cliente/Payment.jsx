import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { money } from '../../lib/format';
import Button from '../../components/ui/AppButton';
import StatusBadge from '../../components/ui/StatusBadge';
import { ErrorState, Loading, PageHeader } from '../../components/ui/States';

const RESULTS = {
  APROBADO: { variant: 'success', icon: CheckCircle2, text: 'Pago aprobado', help: 'El comercio ya puede confirmar tu pedido.' },
  RECHAZADO: { variant: 'danger', icon: XCircle, text: 'Pago rechazado', help: 'Tu banco no autorizó el pago. Prueba de nuevo o cancela el pedido.' },
  PENDIENTE: { variant: 'warning', icon: Clock, text: 'Pago pendiente', help: 'Estamos esperando la confirmación del pago.' },
};

// Módulo Simulador de Pagos
export default function Payment() {
  const { orderId } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const { data: order, loading, error, reload } = useFetch(`/orders/${orderId}`);
  const [last, setLast] = useState(null);

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const simulate = async (result) => {
    try { await api.post('/payments/simulate', { orderId, result }); setLast(result); reload(); } catch (e) { toast.error(e.message); }
  };
  const cancel = async () => {
    if (!window.confirm('¿Cancelar este pedido?')) return;
    try { await api.patch(`/orders/${orderId}/status`, { status: 'CANCELADO' }); nav('/cliente/pedidos'); } catch (e) { toast.error(e.message); }
  };

  const status = order.paymentStatus;
  const res = RESULTS[last || status];
  const approved = status === 'APROBADO';

  return (
    <div className="mx-auto max-w-2xl" data-testid="payment-page">
      <PageHeader title="Pago del pedido" subtitle={`Pedido #${order.code} · ${order.merchantName}`} />
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <p className="text-slate-700">Total a pagar</p>
          <p className="text-3xl font-extrabold" data-testid="payment-total">{money(order.total)}</p>
        </div>
        <p className="mt-2 flex items-center gap-2 text-sm">Estado del pago: <StatusBadge status={status} /></p>

        {res && (
          <div role="status" data-testid="payment-result" className={`mt-5 flex items-start gap-3 rounded-xl border p-4 ${last === 'RECHAZADO' || (!last && status === 'RECHAZADO') ? 'border-red-300 bg-red-50 text-red-900' : (last || status) === 'APROBADO' ? 'border-green-300 bg-green-50 text-green-900' : 'border-amber-300 bg-amber-50 text-amber-900'}`}>
            <res.icon className="mt-0.5 h-6 w-6 shrink-0" aria-hidden="true" />
            <div><p className="font-bold">{res.text}</p><p className="text-sm">{res.help}</p></div>
          </div>
        )}

        {!approved ? (
          <>
            <p className="mt-6 text-sm font-semibold text-slate-800">Simula la respuesta de la pasarela de pagos:</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              <Button variant="success" size="lg" icon={CheckCircle2} onClick={() => simulate('APROBADO')} data-testid="pay-approved">Aprobar</Button>
              <Button variant="danger" size="lg" icon={XCircle} onClick={() => simulate('RECHAZADO')} data-testid="pay-rejected">Rechazar</Button>
              <Button variant="warning" size="lg" icon={Clock} onClick={() => simulate('PENDIENTE')} data-testid="pay-pending">Dejar pendiente</Button>
            </div>
            <button type="button" onClick={cancel} className="mt-4 text-sm font-semibold text-red-800 underline" data-testid="cancel-order">Cancelar pedido</button>
          </>
        ) : (
          <Link to={`/cliente/pedidos/${order.id}`} data-testid="track-order" className="mt-6 block rounded-xl bg-brand-700 py-3 text-center font-semibold text-white hover:bg-brand-800">Seguir mi pedido</Link>
        )}
      </div>
    </div>
  );
}
