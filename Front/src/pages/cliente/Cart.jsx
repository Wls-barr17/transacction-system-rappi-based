import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import Button from '../../components/ui/AppButton';
import { EmptyState, PageHeader } from '../../components/ui/States';
import { money } from '../../lib/format';

export default function Cart() {
  const { cart, setQty, remove, clear, subtotal, discount, fee, total } = useCart();

  if (!cart.items.length) {
    return (
      <EmptyState title="Tu carrito está vacío" text="Elige un comercio y agrega lo que se te antoje.">
        <Link to="/cliente" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-700 px-5 py-2.5 font-semibold text-white hover:bg-brand-800"><ShoppingBag className="h-4 w-4" aria-hidden="true" />Ver comercios</Link>
      </EmptyState>
    );
  }

  return (
    <div data-testid="cart-page">
      <PageHeader title="Tu carrito" subtitle={`Pedido para ${cart.merchant.name}`}>
        <Button variant="secondary" icon={Trash2} onClick={() => { if (window.confirm('¿Vaciar el carrito?')) clear(); }} data-testid="cart-clear">Vaciar carrito</Button>
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <ul className="space-y-3">
          {cart.items.map((i) => (
            <li key={i.productId} data-testid="cart-item" className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-4xl" aria-hidden="true">{i.emoji}</span>
              <div className="flex-1">
                <p className="font-bold">{i.name}</p>
                <p className="text-sm text-slate-700">{money(i.price)} c/u</p>
              </div>
              <div className="flex items-center gap-1" role="group" aria-label={`Cantidad de ${i.name}`}>
                <button type="button" onClick={() => setQty(i.productId, i.qty - 1)} aria-label={`Quitar una unidad de ${i.name}`} data-testid="qty-minus" className="rounded-lg border border-slate-300 p-2 hover:bg-slate-50"><Minus className="h-4 w-4" /></button>
                <span className="w-8 text-center font-bold" aria-live="polite" data-testid="qty-value">{i.qty}</span>
                <button type="button" onClick={() => setQty(i.productId, i.qty + 1)} disabled={i.qty >= i.stock} aria-label={`Agregar una unidad de ${i.name}`} data-testid="qty-plus" className="rounded-lg border border-slate-300 p-2 hover:bg-slate-50 disabled:opacity-50"><Plus className="h-4 w-4" /></button>
              </div>
              <p className="w-24 text-right font-bold">{money(i.price * i.qty)}</p>
              <button type="button" onClick={() => remove(i.productId)} aria-label={`Eliminar ${i.name}`} data-testid="cart-remove" className="rounded-lg p-2 text-red-700 hover:bg-red-50"><Trash2 className="h-5 w-5" /></button>
            </li>
          ))}
        </ul>
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5" aria-label="Resumen">
          <h2 className="text-lg font-bold">Resumen</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd data-testid="cart-subtotal">{money(subtotal)}</dd></div>
            {discount > 0 && <div className="flex justify-between text-green-800"><dt>Descuento</dt><dd>-{money(discount)}</dd></div>}
            <div className="flex justify-between"><dt>Envío</dt><dd>{money(fee)}</dd></div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-extrabold"><dt>Total</dt><dd data-testid="cart-total">{money(total)}</dd></div>
          </dl>
          <Link to="/cliente/checkout" data-testid="go-checkout" className="mt-5 block rounded-xl bg-brand-700 py-3 text-center font-semibold text-white hover:bg-brand-800">Ir al checkout</Link>
        </aside>
      </div>
    </div>
  );
}
