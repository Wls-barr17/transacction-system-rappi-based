import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, MapPin, Ticket, XCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useFetch } from '../../hooks/useFetch';
import { api } from '../../lib/api';
import { COUPON_RE, money } from '../../lib/format';
import Button from '../../components/ui/AppButton';
import Input from '../../components/ui/Input';
import DeliveryAddressMap from '../../components/ui/DeliveryAddressMap';
import { EmptyState, Loading, PageHeader } from '../../components/ui/States';

export default function Checkout() {
  const { cart, remove, clear, setCoupon, subtotal, discount, fee, total } = useCart();
  const nav = useNavigate();
  const toast = useToast();
  const addrs = useFetch('/addresses');
  const [addressId, setAddressId] = useState(null);
  const [outOfStock, setOut] = useState([]);
  const [code, setCode] = useState(cart.coupon?.code || '');
  const [couponMsg, setCouponMsg] = useState(cart.coupon ? { ok: true, text: 'Cupón aplicado' } : null);

  const payload = cart.items.map((i) => ({ productId: i.productId, qty: i.qty }));

  useEffect(() => {
    if (addrs.data && !addressId) setAddressId((addrs.data.find((a) => a.isDefault) || addrs.data[0])?.id || null);
  }, [addrs.data, addressId]);

  // Revisar stock apenas se abre el checkout
  useEffect(() => {
    if (!cart.items.length) return;
    api.post('/cart/validate', { items: payload }).then((r) => setOut(r.outOfStock)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!cart.items.length) return <EmptyState title="No hay nada que pagar" text="Agrega productos al carrito primero."><Link to="/cliente" className="mt-2 font-semibold text-brand-800 underline">Ver comercios</Link></EmptyState>;
  if (addrs.loading) return <Loading />;

  // Validación en tiempo real del cupón antes de llamar al servidor
  const formatErr = code && !COUPON_RE.test(code) ? 'Usa de 4 a 15 letras o números, sin espacios' : '';
  const applyCoupon = async () => {
    try {
      const r = await api.get(`/coupons/validate?code=${encodeURIComponent(code)}&subtotal=${subtotal}&merchantId=${cart.merchant.id}`);
      if (r.valid) { setCoupon({ code: r.code, type: r.type, value: r.value, min: r.min }); setCouponMsg({ ok: true, text: r.message }); }
      else { setCoupon(null); setCouponMsg({ ok: false, text: r.message }); }
    } catch (e) { setCouponMsg({ ok: false, text: e.message }); }
  };
  const removeCoupon = () => { setCoupon(null); setCode(''); setCouponMsg(null); };

  const outIds = new Map(outOfStock.map((o) => [o.productId, o]));
  const selectedAddress = addrs.data.find((address) => address.id === addressId);
  const canConfirm = addressId && outOfStock.length === 0;

  const confirm = async () => {
    try {
      const order = await api.post('/orders', { merchantId: cart.merchant.id, items: payload, addressId, coupon: cart.coupon?.code || null, paymentMethod: 'TARJETA' });
      clear();
      nav(`/cliente/pago/${order.id}`);
    } catch (e) {
      if (e.status === 409 && e.data?.outOfStock) setOut(e.data.outOfStock);
      toast.error(e.message);
    }
  };

  return (
    <div data-testid="checkout-page">
      <PageHeader title="Confirmar pedido" subtitle={cart.merchant.name} />
      <div className="grid gap-6 lg:grid-cols-[1fr_21rem]">
        <div className="space-y-6">
          {outOfStock.length > 0 && (
            <div role="alert" data-testid="stock-alert" className="flex items-start gap-3 rounded-xl border-2 border-red-700 bg-red-50 p-4 text-red-900">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <p className="font-semibold">Algunos productos se agotaron. Quítalos de tu pedido para poder continuar.</p>
            </div>
          )}

          <section aria-labelledby="h-items" className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 id="h-items" className="mb-3 text-lg font-bold">Tu pedido</h2>
            <ul className="space-y-2">
              {cart.items.map((i) => {
                const out = outIds.get(i.productId);
                return (
                  <li key={i.productId} data-testid={out ? 'item-out-of-stock' : 'checkout-item'} className={`rounded-xl border p-3 ${out ? 'border-2 border-red-700 bg-red-50' : 'border-slate-200'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold"><span aria-hidden="true">{i.emoji} </span>{i.qty} × {i.name}</p>
                      <p className="font-bold">{money(i.price * i.qty)}</p>
                    </div>
                    {out && (
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-red-900">
                        <span className="flex items-center gap-1.5"><XCircle className="h-4 w-4" aria-hidden="true" />{out.available === 0 ? 'Producto agotado.' : `Solo quedan ${out.available}.`} Debe ser removido.</span>
                        <Button size="sm" variant="danger" onClick={() => { remove(i.productId); setOut((o) => o.filter((x) => x.productId !== i.productId)); }} data-testid="remove-out-of-stock">Quitar del pedido</Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <fieldset className="rounded-2xl border border-slate-200 bg-white p-5">
            <legend className="px-1 text-lg font-bold">Dirección de entrega</legend>
            {addrs.data.length === 0 ? (
              <p className="text-sm">No tienes direcciones. <Link to="/perfil" className="font-bold text-brand-800 underline">Agrega una en tu perfil</Link>.</p>
            ) : (
              <div className="space-y-2">
                {addrs.data.map((a) => (
                  <label key={a.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${addressId === a.id ? 'border-brand-700 bg-brand-50' : 'border-slate-200'}`}>
                    <input type="radio" name="address" checked={addressId === a.id} onChange={() => setAddressId(a.id)} className="mt-1" data-testid={`address-${a.id}`} />
                    <span><span className="flex items-center gap-1 font-bold"><MapPin className="h-4 w-4" aria-hidden="true" />{a.label}</span><span className="text-sm">{a.street}{a.neighborhood ? `, ${a.neighborhood}` : ''}, {a.city}</span></span>
                  </label>
                ))}
                {selectedAddress && <DeliveryAddressMap latitude={selectedAddress.latitude} longitude={selectedAddress.longitude} address={`${selectedAddress.street}, ${selectedAddress.neighborhood ? `${selectedAddress.neighborhood}, ` : ''}${selectedAddress.city}`} />}
              </div>
            )}
          </fieldset>

          <section aria-labelledby="h-coupon" className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 id="h-coupon" className="mb-3 flex items-center gap-2 text-lg font-bold"><Ticket className="h-5 w-5" aria-hidden="true" />Cupón o promoción</h2>
            {cart.coupon ? (
              <div className="flex items-center justify-between rounded-xl border border-green-400 bg-green-50 p-3 text-green-900">
                <span className="flex items-center gap-2 font-semibold" data-testid="coupon-applied"><CheckCircle2 className="h-5 w-5" aria-hidden="true" />{cart.coupon.code} aplicado</span>
                <Button size="sm" variant="secondary" onClick={removeCoupon}>Quitar</Button>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <Input className="flex-1" aria-label="Código del cupón" placeholder="Ej: BIENVENIDO10" value={code} error={formatErr || (couponMsg && !couponMsg.ok ? couponMsg.text : '')}
                  onChange={(e) => { setCode(e.target.value.toUpperCase().trim()); setCouponMsg(null); }} data-testid="coupon-input" />
                <Button variant="secondary" disabled={!code || !!formatErr} onClick={applyCoupon} data-testid="coupon-apply">Aplicar</Button>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="wompi-payment-heading">
            <h2 id="wompi-payment-heading" className="text-lg font-bold">Pago seguro con Wompi</h2>
            <p className="mt-1 text-sm text-slate-600">En el checkout Sandbox eliges uno de los métodos habilitados para pruebas, como tarjeta o PSE.</p>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5" aria-label="Resumen del pago">
          <h2 className="text-lg font-bold">Resumen</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>
            {discount > 0 && <div className="flex justify-between text-green-800"><dt>Descuento</dt><dd>-{money(discount)}</dd></div>}
            <div className="flex justify-between"><dt>Envío</dt><dd>{money(fee)}</dd></div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-extrabold"><dt>Total</dt><dd data-testid="checkout-total">{money(total)}</dd></div>
          </dl>
          <Button size="lg" className="mt-5 w-full" disabled={!canConfirm} onClick={confirm} data-testid="confirm-order">Confirmar pedido</Button>
          {!canConfirm && <p className="mt-2 text-xs text-slate-700">{outOfStock.length ? 'Quita los productos agotados para continuar.' : 'Selecciona una dirección de entrega.'}</p>}
        </aside>
      </div>
    </div>
  );
}
