import { useState } from 'react';
import { CheckCircle2, Clock3, CreditCard, ExternalLink, XCircle } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { money } from '../../lib/format';
import Button from '../../components/ui/AppButton';
import StatusBadge from '../../components/ui/StatusBadge';
import { ErrorState, Loading, PageHeader } from '../../components/ui/States';

function redirectToWompi(checkout) {
  const fields = [
    ['public-key', checkout.publicKey],
    ['currency', checkout.currency],
    ['amount-in-cents', checkout.amountInCents],
    ['reference', checkout.reference],
    ['signature:integrity', checkout.integritySignature],
    ['redirect-url', checkout.redirectUrl],
    ['customer-data:email', checkout.customerData.email],
    ['customer-data:full-name', checkout.customerData.fullName],
    ['customer-data:phone-number', checkout.customerData.phoneNumber],
    ['customer-data:phone-number-prefix', checkout.customerData.phoneNumberPrefix],
    ['customer-data:email', checkout.customerData.email],
    ['customer-data:full-name', checkout.customerData.fullName],
    ['shipping-address:address-line-1', checkout.shippingAddress?.addressLine1],
    ['shipping-address:country', checkout.shippingAddress?.country],
    ['shipping-address:city', checkout.shippingAddress?.city],
    ['shipping-address:phone-number', checkout.shippingAddress?.phoneNumber],
    ['shipping-address:region', checkout.shippingAddress?.region],
  ];
  const form = document.createElement('form');
  form.method = 'GET';
  form.action = 'https://checkout.wompi.co/p/';
  form.hidden = true;
  fields.forEach(([name, value]) => {
    if (value == null || value === '') return;
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = String(value);
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}

const transactionMessages = {
  APROBADO: ['Pago aprobado por Wompi.', 'success'],
  RECHAZADO: ['Wompi rechazó el pago. Puedes iniciar un nuevo intento.', 'error'],
  PENDIENTE: ['Wompi está confirmando el pago; esta pantalla se actualizará automáticamente.', 'pending'],
};

export default function Payment() {
  const { orderId } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const { data: order, loading, error, reload } = useFetch(`/orders/${orderId}`, { interval: 4000 });
  const provider = useFetch('/payments/provider');
  const [busy, setBusy] = useState(false);

  if (loading || provider.loading) return <Loading />;
  if (error || provider.error) return <ErrorState error={error || provider.error} onRetry={() => { reload(); provider.reload(); }} />;

  const startPayment = async () => {
    setBusy(true);
    try {
      const checkoutData = await api.post(`/orders/${orderId}/payments/wompi/session`, {});
      redirectToWompi(checkoutData);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!window.confirm('¿Cancelar este pedido?')) return;
    try { await api.patch(`/orders/${orderId}/status`, { status: 'CANCELADO' }); nav('/cliente/pedidos'); }
    catch (e) { toast.error(e.message); }
  };

  const attempts = order.paymentAttempts || [];
  const isApproved = order.paymentStatus === 'APROBADO';
  const transactionMessage = attempts.length ? transactionMessages[order.paymentStatus] : null;

  return (
    <div className="mx-auto max-w-2xl" data-testid="payment-page">
      <PageHeader title="Paga con Wompi" subtitle={`Pedido #${order.code} · ${order.merchantName}`} />
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <p className="text-slate-700">Total del pedido</p>
          <p className="text-3xl font-extrabold" data-testid="payment-total">{money(order.total)}</p>
        </div>
        <p className="mt-2 flex items-center gap-2 text-sm">Estado: <StatusBadge status={order.paymentStatus} /></p>
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-950">
          <CreditCard className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-sm">Estás usando <strong>Wompi Sandbox</strong>. El checkout usa datos de prueba y no cobra dinero real. La confirmación final llega al servidor por webhook.</p>
        </div>
        {!provider.data.configured && <p role="alert" className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">Faltan las llaves Sandbox en <code>backend/.env</code>. Completa <code>WOMPI_PUBLIC_KEY</code>, <code>WOMPI_INTEGRITY_SECRET</code> y <code>WOMPI_EVENTS_SECRET</code>, y reinicia Spring.</p>}
        {transactionMessage && <p role="status" className={`mt-4 flex items-center gap-2 rounded-lg p-3 text-sm font-semibold ${transactionMessage[1] === 'success' ? 'bg-green-100 text-green-900' : transactionMessage[1] === 'error' ? 'bg-red-100 text-red-900' : 'bg-amber-100 text-amber-950'}`}>
          {transactionMessage[1] === 'success' ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : transactionMessage[1] === 'error' ? <XCircle className="h-4 w-4" aria-hidden="true" /> : <Clock3 className="h-4 w-4" aria-hidden="true" />}{transactionMessage[0]}
        </p>}

        {attempts.length > 0 && <section className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4" aria-labelledby="payment-history-heading">
          <h2 id="payment-history-heading" className="font-bold">Historial de intentos Wompi</h2>
          <ul className="mt-2 space-y-2 text-sm">{attempts.map((attempt) => <li key={attempt.attemptNumber} className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-2"><span>Intento {attempt.attemptNumber} · {attempt.paymentMethodType || attempt.method} · {money(attempt.amount)}</span><span className="font-semibold">{attempt.status} · <span className="font-mono text-xs">{attempt.providerTransactionId || attempt.transactionReference}</span></span></li>)}</ul>
        </section>}

        {!isApproved ? <div className="mt-6 space-y-3">
          <Button variant="primary" size="lg" icon={CreditCard} loading={busy} disabled={!provider.data.configured || order.status !== 'PENDIENTE'} onClick={startPayment} className="w-full" data-testid="pay-wompi">{busy ? 'Conectando con Wompi…' : 'Continuar a Wompi Sandbox'}</Button>
          <p className="text-center text-xs text-slate-600">Al continuar, se abrirá el checkout seguro de Wompi. Elige allí un método de prueba habilitado para tu cuenta.</p>
          <button type="button" onClick={cancel} className="block text-sm font-semibold text-red-800 underline" data-testid="cancel-order">Cancelar pedido</button>
        </div> : <Link to={`/cliente/pedidos/${order.id}`} data-testid="track-order" className="mt-6 block rounded-xl bg-brand-700 py-3 text-center font-semibold text-white hover:bg-brand-800">Seguir mi pedido</Link>}
        <a href="https://docs.wompi.co/docs/colombia/datos-de-prueba-en-sandbox/" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-brand-800 underline">Ver datos de prueba oficiales de Wompi <ExternalLink className="h-3 w-3" aria-hidden="true" /></a>
      </div>
    </div>
  );
}
