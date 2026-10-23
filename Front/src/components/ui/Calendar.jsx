import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { dayKey } from '../../lib/format';

const DOW = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

// Calendario para filtrar por fecha. `marked` = lista de 'YYYY-MM-DD' con actividad.
export default function Calendar({ selected, onSelect, marked = [] }) {
  const [view, setView] = useState(() => { const d = selected ? new Date(selected) : new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const markedSet = useMemo(() => new Set(marked), [marked]);
  const cells = useMemo(() => {
    const y = view.getFullYear(), m = view.getMonth();
    const offset = (new Date(y, m, 1).getDay() + 6) % 7;
    const days = new Date(y, m + 1, 0).getDate();
    return [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => new Date(y, m, i + 1))];
  }, [view]);
  const sel = selected ? dayKey(selected) : null;
  const today = dayKey(new Date());
  const title = view.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  const go = (n) => setView(new Date(view.getFullYear(), view.getMonth() + n, 1));

  return (
    <div data-testid="calendar" className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => go(-1)} aria-label="Mes anterior" className="rounded-lg p-1.5 hover:bg-slate-100"><ChevronLeft className="h-5 w-5" /></button>
        <p className="font-bold capitalize" aria-live="polite">{title}</p>
        <button type="button" onClick={() => go(1)} aria-label="Mes siguiente" className="rounded-lg p-1.5 hover:bg-slate-100"><ChevronRight className="h-5 w-5" /></button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-600">
        {DOW.map((d) => <div key={d} className="py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const k = dayKey(d);
          const isSel = sel === k;
          return (
            <button key={k} type="button" onClick={() => onSelect(isSel ? null : d)} aria-pressed={isSel}
              aria-label={d.toLocaleDateString('es-CO', { dateStyle: 'full' }) + (markedSet.has(k) ? ', con pedidos' : '')}
              className={`relative aspect-square rounded-lg text-sm font-medium ${isSel ? 'bg-brand-700 text-white' : 'text-slate-900 hover:bg-slate-100'} ${k === today && !isSel ? 'ring-1 ring-brand-700' : ''}`}>
              {d.getDate()}
              {markedSet.has(k) && <span className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${isSel ? 'bg-white' : 'bg-brand-700'}`} />}
            </button>
          );
        })}
      </div>
      {selected && (
        <button type="button" onClick={() => onSelect(null)} className="mt-3 text-sm font-semibold text-brand-700 underline">Quitar filtro de fecha</button>
      )}
    </div>
  );
}
