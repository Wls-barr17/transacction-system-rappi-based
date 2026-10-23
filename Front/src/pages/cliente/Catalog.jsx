import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Star } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import GlowingSearchBar from '../../components/ui/GlowingSearchBar';
import { EmptyState, ErrorState, Loading, PageHeader } from '../../components/ui/States';
import { money } from '../../lib/format';

export default function Catalog() {
  const [cat, setCat] = useState('Todas');
  const [q, setQ] = useState('');
  const cats = useFetch('/categories');
  const { data, loading, error, reload } = useFetch(`/merchants${cat === 'Todas' ? '' : `?category=${encodeURIComponent(cat)}`}`, { interval: 15000 });
  const term = q.trim().toLowerCase();
  const list = (data || []).filter((m) => !term || m.name.toLowerCase().includes(term) || m.description.toLowerCase().includes(term) || m.category.toLowerCase().includes(term));

  return (
    <div data-testid="catalog-page">
      <PageHeader title="¿Qué se te antoja hoy?" subtitle="Elige un comercio por categoría o búscalo por nombre." />
      <GlowingSearchBar value={q} onChange={setQ} placeholder="Busca pizza, sushi, hamburguesas…" />

      <div role="group" aria-label="Categorías" className="mt-5 flex flex-wrap gap-2">
        {['Todas', ...(cats.data || [])].map((c) => (
          <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)} data-testid={`category-${c}`}
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${cat === c ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`}>{c}</button>
        ))}
      </div>

      <div className="mt-6">
        {loading ? <Loading /> : error ? <ErrorState error={error} onRetry={reload} /> : list.length === 0 ? (
          <EmptyState title="No encontramos comercios" text="Prueba con otra palabra o cambia la categoría." />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((m) => (
              <li key={m.id}>
                <Link to={`/cliente/comercio/${m.id}`} data-testid="merchant-card" className="block h-full rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-brand-400 hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <span className="text-5xl" aria-hidden="true">{m.emoji}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${m.open ? 'bg-green-100 text-green-900' : 'bg-slate-200 text-slate-800'}`}>{m.open ? 'Abierto' : 'Cerrado'}</span>
                  </div>
                  <h2 className="mt-3 text-xl font-bold">{m.name}</h2>
                  <p className="text-sm text-slate-600">{m.description}</p>
                  <p className="mt-3 flex items-center gap-4 text-sm font-medium">
                    <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-500" aria-hidden="true" />{m.rating}</span>
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" aria-hidden="true" />Envío {money(m.deliveryFee)}</span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
