import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bike } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { fmtDate, money } from '../../lib/format';
import { STATUS_META } from '../../lib/constants';
import Button from '../../components/ui/AppButton';
import OrderStepper from '../../components/ui/OrderStepper';
import StarRating from '../../components/ui/StarRating';
import StatusBadge from '../../components/ui/StatusBadge';
import { ErrorState, Loading } from '../../components/ui/States';

export default function OrderTracking() {
  const { id } = useParams();
  const toast = useToast();
  const { data: o, loading, error, reload } = useFetch(`/orders/${id}`, { interval: 6000 });
  const [merchantStars, setMerchantStars] = useState(0);
  const [courierStars, setCourierStars] = useState(0);
  const [comment, setComment] = useState('');

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const cancel = async () => {
    if (!window.confirm('¿Seguro que quieres cancelar el pedido?')) return;
    try { await api.patch(`/orders/${id}/status`, { status: 'CANCELADO' }); reload(); } catch (e) { toast.error(e.message); }
  };
  const rate = async () => {
    if (!merchantStars || !courierStars) { toast.error('Califica al comercio y al repartidor con al menos 1 estrella'); return; }
    try { await api.post(`/orders/${id}/rating`, { merchant: merchantStars, courier: courierStars, comment }); toast.success('¡Gracias por tu calificación!'); reload(); } catch (e) { toast.error(e.message); }
  };

  return (
    <div data-testid="tracking-page" className="space-y-6">
      <Link to="/cliente/pedidos" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-800 underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Mis pedidos</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Pedido #{o.code}</h1>
          <p className="text-slate-600">{o.merchantName} · {fmtDate(o.createdAt)}</p>
        </div>
        <StatusBadge status={o.status} className="text-sm" />
      </div>

      <OrderStepper status={o.status} />

      {o.courierName && (
        <p className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 font-medium"><Bike className="h-5 w-5 text-brand-700" aria-hidden="true" />Tu repartidor es {o.courierName}</p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="h-det">
          <h2 id="h-det" className="text-lg font-bold">Detalle</h2>
          <ul className="mt-3 space-y-1 text-sm">{o.items.map((i) => <li key={i.productId} className="flex justify-between"><span>{i.qty} × {i.name}</span><span>{money(i.price * i.qty)}</span></li>)}</ul>
          <dl className="mt-3 space-y-1 border-t border-slate-200 pt-3 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(o.subtotal)}</dd></div>
            {o.discount > 0 && <div className="flex justify-between text-green-800"><dt>Descuento ({o.coupon})</dt><dd>-{money(o.discount)}</dd></div>}
            <div className="flex justify-between"><dt>Envío</dt><dd>{money(o.deliveryFee)}</dd></div>
            <div className="flex justify-between text-base font-extrabold"><dt>Total</dt><dd>{money(o.total)}</dd></div>
          </dl>
          <p className="mt-3 text-sm text-slate-700">Entrega en: {o.address}</p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="h-hist">
          <h2 id="h-hist" className="text-lg font-bold">Historial</h2>
          <ol className="mt-3 space-y-2 text-sm">
            {[...o.history].reverse().map((h, i) => (
              <li key={i} className="flex items-center justify-between gap-2"><StatusBadge status={h.status} /><span className="text-slate-600">{fmtDate(h.at)}</span></li>
            ))}
          </ol>
          {o.paymentStatus !== 'APROBADO' && o.status === 'PENDIENTE' && (
            <Link to={`/cliente/pago/${o.id}`} className="mt-4 block rounded-xl bg-amber-400 py-2.5 text-center font-semibold text-slate-900">Completar el pago</Link>
          )}
          {o.status === 'PENDIENTE' && <Button variant="danger" className="mt-3 w-full" onClick={cancel} data-testid="cancel-order">Cancelar pedido</Button>}
        </section>
      </div>

      {o.status === 'ENTREGADO' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="h-rate" data-testid="rating-section">
          <h2 id="h-rate" className="text-lg font-bold">¿Cómo fue tu experiencia?</h2>
          {o.rating ? (
            <p className="mt-2 text-sm" data-testid="rating-done">Calificaste al comercio con {o.rating.merchant}/5 y al repartidor con {o.rating.courier}/5. ¡Gracias!</p>
          ) : (
            <div className="mt-3 space-y-4">
              <div className="flex flex-wrap gap-8">
                <StarRating label="Comercio" value={merchantStars} onChange={setMerchantStars} />
                <StarRating label="Repartidor" value={courierStars} onChange={setCourierStars} />
              </div>
              <label className="block text-sm font-semibold">Comentario (opcional)
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm font-normal" />
              </label>
              <Button onClick={rate} data-testid="rating-submit">Enviar calificación</Button>
            </div>
          )}
        </section>
      )}
      <p className="sr-only" aria-live="polite">Estado actual: {STATUS_META[o.status].label}</p>
    </div>
  );
}
