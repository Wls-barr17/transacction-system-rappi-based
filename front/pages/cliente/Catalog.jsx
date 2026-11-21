import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock3, Heart, MapPin, Search, Star, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { useCart } from '../../context/CartContext';
import { EmptyState, ErrorState, Loading } from '../../components/ui/States';
import { money } from '../../lib/format';
import SmartImage from '../../components/ui/SmartImage';

const CATEGORIES = [
  { label: 'Todo', icon: '✨', key: 'Todas' },
  { label: 'Restaurantes', icon: '🍽️', key: 'Restaurantes' },
  { label: 'Mercado', icon: '🥑', key: 'Mercado' },
  { label: 'Farmacia', icon: '🩹', key: 'Farmacia' },
];
const categoryOf = (m) => ['Mercado', 'Farmacia'].includes(m.category) ? m.category : 'Restaurantes';
const FAVORITES_KEY = 'domiflow_favorites_v1';

export default function Catalog() {
  const [cat, setCat] = useState('Todas');
  const [q, setQ] = useState('');
  const [area, setArea] = useState('Todas las zonas');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favorites, setFavorites] = useState(() => { try { return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || []; } catch { return []; } });
  const { count } = useCart();
  const { data, loading, error, reload } = useFetch('/merchants', { interval: 15000 });
  const { data: addresses } = useFetch('/addresses');
  const merchants = data || [];
  const deliveryAddress = addresses?.find((address) => address.isDefault) || addresses?.[0];
  const term = q.trim().toLowerCase();
  const areas = useMemo(() => ['Todas las zonas', ...new Set(['Chapinero', 'Usaquén', 'Cedritos', ...merchants.map((m) => m.area).filter(Boolean)])], [merchants]);
  const list = merchants.filter((m) => (!term || [m.name, m.description, m.category, m.area].some((v) => v?.toLowerCase().includes(term)))
    && (cat === 'Todas' || categoryOf(m) === cat)
    && (area === 'Todas las zonas' || !m.area || m.area === area)
    && (!onlyFavorites || favorites.includes(m.id)));
  const toggleFavorite = (id) => setFavorites((old) => {
    const next = old.includes(id) ? old.filter((x) => x !== id) : [...old, id];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    return next;
  });

  return (
    <div className="space-y-9" data-testid="catalog-page">
      <section className="market-intro" aria-labelledby="market-title">
        <p className="mb-2 flex items-center gap-2 text-sm font-bold text-[#bd482d]"><MapPin size={16} /> {deliveryAddress ? `${deliveryAddress.street}${deliveryAddress.neighborhood ? `, ${deliveryAddress.neighborhood}` : ''}, ${deliveryAddress.city}` : 'Agrega tu dirección de entrega en Perfil'} <Link to="/perfil" className="rounded-full bg-white/70 px-2.5 py-1 text-xs text-[#66564e] underline">Cambiar</Link></p>
        <h1 id="market-title">Lo que necesitas,<br className="hidden sm:block" /> a la puerta de tu casa.</h1>
        <p className="mt-3">Comida rica, mercado y bienestar cerca de ti. Fácil de pedir, fácil de seguir.</p>
      </section>

      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
        <label className="market-search" aria-label="Buscar comercios o productos"><Search size={20} className="shrink-0 text-[#897e77]" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="¿Qué se te antoja? Busca un plato o comercio" data-testid="catalog-search" /></label>
        <label className="sr-only" htmlFor="catalog-area">Zona de entrega</label>
        <select id="catalog-area" className="h-[52px] rounded-2xl border border-[#eee5df] bg-white px-4 text-sm font-semibold text-[#554b46]" value={area} onChange={(e) => setArea(e.target.value)}>
          {areas.map((a) => <option key={a}>{a}</option>)}
        </select>
        <button type="button" className={`market-chip inline-flex h-[52px] items-center justify-center gap-2 ${onlyFavorites ? 'border-[#ff5a36] text-[#b73d22]' : ''}`} aria-pressed={onlyFavorites} onClick={() => setOnlyFavorites(!onlyFavorites)}><Heart size={17} fill={onlyFavorites ? 'currentColor' : 'none'} />Favoritos</button>
      </div>

      <aside className="market-promo" aria-label="Promoción disponible">
        <div><p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#bd806e]">Un antojo cae mejor con descuento</p><p className="mt-1 text-lg font-extrabold">Ahorra 10% en tu pedido</p><p className="mt-1 text-sm text-[#766b65]">Usa este código al confirmar tu compra.</p></div>
        <span className="market-promo-code">BIENVENIDO10</span>
      </aside>

      <section aria-labelledby="categories-heading">
        <div className="market-section-title mb-4"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-[#bd806e]">Explora</p><h2 id="categories-heading" className="mt-1 text-2xl">¿Qué necesitas hoy?</h2></div><SlidersHorizontal size={20} className="text-[#897e77]" aria-hidden="true" /></div>
        <div className="flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Filtrar por categoría">
          {CATEGORIES.map((c) => <button key={c.key} type="button" className="market-category" aria-pressed={cat === c.key} onClick={() => setCat(c.key)}><span className="market-category-icon" aria-hidden="true">{c.icon}</span><span>{c.label}</span></button>)}
        </div>
      </section>

      <section aria-labelledby="nearby-heading">
        <div className="market-section-title mb-4"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-[#bd806e]">Selección local · comercios de demostración</p><h2 id="nearby-heading" className="mt-1 text-2xl">Cerca de ti</h2></div><span className="hidden text-sm text-[#897e77] sm:block">Calificación y tiempos ilustrativos</span></div>
        {loading ? <Loading label="Buscando lugares cerca de ti…" /> : error ? <ErrorState error={error} onRetry={reload} /> : list.length === 0 ? <EmptyState title={onlyFavorites ? 'Aún no guardas favoritos' : 'No encontramos opciones'} text={onlyFavorites ? 'Toca el corazón de un comercio para guardarlo aquí.' : 'Prueba con otra búsqueda, zona o categoría.'} /> : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((m) => <li key={m.id} className="market-card" data-testid="merchant-card">
              <div className="relative"><SmartImage src={m.imageUrl} alt={`Foto de ${m.name}`} fallback={m.emoji} className="merchant-cover" /><button type="button" className="favorite-toggle absolute right-3 top-3" aria-label={`${favorites.includes(m.id) ? 'Quitar de' : 'Agregar a'} favoritos: ${m.name}`} aria-pressed={favorites.includes(m.id)} onClick={() => toggleFavorite(m.id)}><Heart size={18} fill={favorites.includes(m.id) ? 'currentColor' : 'none'} /></button>{!m.open && <span className="absolute bottom-3 left-3 rounded-full bg-[#25211f]/85 px-3 py-1 text-xs font-bold text-white">Cerrado</span>}</div>
              <div className="px-1 pb-1 pt-4">
                <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-[#bd806e]">{categoryOf(m)}{m.name.includes('Demo') ? ' · ficticio' : ''}</p><h3 className="mt-1 text-lg font-extrabold leading-snug">{m.name.replace(' · Demo', '')}</h3></div><span className="flex items-center gap-1 rounded-lg bg-[#fff8e9] px-2 py-1 text-sm font-extrabold"><Star size={14} fill="#e9a93a" color="#e9a93a" />{m.rating}</span></div>
                <p className="mt-1 line-clamp-2 min-h-10 text-sm text-[#756a64]">{m.description}</p>
                <p className="merchant-location mt-3 flex items-center gap-3"><span className="inline-flex items-center gap-1"><MapPin size={14} />{m.area || 'Chapinero'}</span><span className="inline-flex items-center gap-1"><Clock3 size={14} />{m.eta || '25–35 min'}</span><span>Envío {money(m.deliveryFee)}</span></p>
                <Link to={`/cliente/comercio/${m.id}`} className="mt-4 flex items-center justify-between rounded-xl bg-[#fff3ef] px-4 py-3 text-sm font-extrabold text-[#ad3d22] transition hover:bg-[#ffe5dc]">Ver productos <ChevronRight size={17} /></Link>
              </div>
            </li>)}
          </ul>
        )}
      </section>
      {count > 0 && <Link to="/cliente/carrito" className="fixed bottom-5 right-5 z-30 rounded-full bg-[#25211f] px-5 py-3 font-bold text-white shadow-xl sm:hidden">Ver carrito · {count}</Link>}
    </div>
  );
}
