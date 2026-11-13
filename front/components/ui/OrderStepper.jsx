import { Ban, Check } from 'lucide-react';
import { ORDER_FLOW, STATUS_META } from '../../lib/constants';

// Muestra la secuencia estricta de estados; cancelado/rechazado se muestran como aviso aparte.
export default function OrderStepper({ status, flow = ORDER_FLOW }) {
  if (status === 'CANCELADO' || status === 'RECHAZADO' || status === 'CANCELADA') {
    return (
      <div role="alert" className="flex items-center gap-3 rounded-xl border border-red-300 bg-red-50 p-4 font-semibold text-red-900" data-testid="stepper-cancelled">
        <Ban className="h-6 w-6" aria-hidden="true" />
        {STATUS_META[status].label}: este pedido ya no continuará.
      </div>
    );
  }
  const current = flow.indexOf(status);
  return (
    <ol className="grid gap-2 sm:grid-cols-6" data-testid="order-stepper">
      {flow.map((s, i) => {
        const done = i < current, active = i === current;
        return (
          <li key={s} aria-current={active ? 'step' : undefined}
            className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-bold sm:flex-col sm:text-center ${active ? 'border-brand-700 bg-brand-50 text-brand-900' : done ? 'border-green-300 bg-green-50 text-green-900' : 'border-slate-200 bg-white text-slate-600'}`}>
            <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs ${active ? 'bg-brand-700 text-white' : done ? 'bg-green-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
            </span>
            <span>{STATUS_META[s].label}{active && <span className="sr-only"> (estado actual)</span>}</span>
          </li>
        );
      })}
    </ol>
  );
}
