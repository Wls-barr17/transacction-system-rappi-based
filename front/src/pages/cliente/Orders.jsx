import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import Calendar from '../../components/ui/Calendar';
import StatusBadge from '../../components/ui/StatusBadge';
import { EmptyState, ErrorState, Loading, PageHeader } from '../../components/ui/States';
import { dayKey, fmtDate, money } from '../../lib/format';

export default function Orders() {
  const { data, loading, error, reload } = useFetch('/orders', { interval: 10000 });
  const [day, setDay] = useState(null);
  const marked = useMemo(() => [...new Set((data || []).map((o) => dayKey(o.createdAt)))], [data]);
  const list = (data || []).filter((o) => !day || dayKey(o.createdAt) === dayKey(day));

  return (
    <div data-testid="orders-page">
      <PageHeader title="Mis pedidos" subtitle="Historial y seguimiento. Se actualiza solo." />
      {loading ? <Loading /> : error ? <ErrorState error={error} onRetry={reload} /> : (
        <div className="grid gap-6 md:grid-cols-[20rem_1fr]">
          <Calendar selected={day} onSelect={setDay} marked={marked} />
          {list.length === 0 ? (
            <EmptyState title={day ? 'No hiciste pedidos ese día' : 'Aún no tienes pedidos'} text="Cuando pidas algo lo verás aquí." />
          ) : (
            <ul className="space-y-3">
              {list.map((o) => (
                <li key={o.id}>
                  <Link to={`/cliente/pedidos/${o.id}`} data-testid="order-row" className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 hover:border-brand-400">
                    <span className="text-3xl" aria-hidden="true">{o.merchantEmoji}</span>
                    <div className="flex-1">
                      <p className="font-bold">#{o.code} · {o.merchantName}</p>
                      <p className="text-sm text-slate-600">{fmtDate(o.createdAt)} · {money(o.total)}</p>
                    </div>
                    <StatusBadge status={o.status} />
                    <ChevronRight className="h-5 w-5 text-slate-500" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
