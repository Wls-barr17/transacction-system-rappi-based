import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, ShoppingCart } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/AppButton';
import { ErrorState, Loading } from '../../components/ui/States';
import { money } from '../../lib/format';

export default function MerchantDetail() {
  const { id } = useParams();
  const { data: m, loading, error, reload } = useFetch(`/merchants/${id}`, { interval: 20000 });
  const { cart, add, count, total } = useCart();
  const toast = useToast();

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const inCart = (pid) => cart.items.find((i) => i.productId === pid)?.qty || 0;
  const groups = (m.categories || []).map((c) => [c, m.products.filter((p) => p.category === c)]).filter(([, ps]) => ps.length);

  return (
    <div data-testid="merchant-detail" className="pb-24">
      <Link to="/cliente" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-800 underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Volver a comercios</Link>
      <div className="flex items-center gap-4">
        <span className="text-6xl" aria-hidden="true">{m.emoji}</span>
        <div>
          <h1 className="text-3xl font-extrabold">{m.name}</h1>
          <p className="text-slate-600">{m.description} · Envío {money(m.deliveryFee)}</p>
        </div>
      </div>

      {!m.open && <p role="status" className="mt-4 rounded-xl border border-amber-300 bg-amber-100 p-3 font-semibold text-amber-900">Este comercio no está recibiendo pedidos en este momento.</p>}

      {groups.map(([cat, products]) => (
        <section key={cat} className="mt-8" aria-labelledby={`cat-${cat}`}>
          <h2 id={`cat-${cat}`} className="mb-3 text-xl font-bold">{cat}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {products.map((p) => (
              <li key={p.id} data-testid="product-card" className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                <span className="text-4xl" aria-hidden="true">{p.emoji}</span>
                <div className="flex-1">
                  <p className="font-bold">{p.name}</p>
                  <p className="text-sm text-slate-700">{money(p.price)}</p>
                  {p.stock === 0 ? <p className="text-sm font-bold text-red-700">Agotado</p> : p.stock <= 5 && <p className="text-sm font-semibold text-amber-900">Quedan {p.stock}</p>}
                </div>
                <Button size="sm" icon={Plus} disabled={!m.open || p.stock === 0 || inCart(p.id) >= p.stock}
                  onClick={() => { if (add(m, p)) toast.success(`${p.name} agregado al carrito`); }} data-testid={`add-${p.id}`}
                  aria-label={`Agregar ${p.name} al carrito`}>{inCart(p.id) ? `Agregar (${inCart(p.id)})` : 'Agregar'}</Button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {count > 0 && cart.merchant?.id === m.id && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white p-3 shadow-2xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-1">
            <p className="font-semibold">{count} producto{count > 1 ? 's' : ''} · {money(total)}</p>
            <Link to="/cliente/carrito" data-testid="go-cart" className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-5 py-2.5 font-semibold text-white hover:bg-brand-800"><ShoppingCart className="h-4 w-4" aria-hidden="true" />Ver carrito</Link>
          </div>
        </div>
      )}
    </div>
  );
}
