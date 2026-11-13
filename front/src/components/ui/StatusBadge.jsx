import { Ban, CheckCheck, CheckCircle2, ChefHat, Clock, Package, PackageCheck, Truck, UserCheck, XCircle } from 'lucide-react';
import { STATUS_META } from '../../lib/constants';

const TONES = {
  amber: 'bg-amber-100 text-amber-900 border-amber-300',
  blue: 'bg-blue-100 text-blue-900 border-blue-300',
  violet: 'bg-violet-100 text-violet-900 border-violet-300',
  sky: 'bg-sky-100 text-sky-900 border-sky-300',
  indigo: 'bg-indigo-100 text-indigo-900 border-indigo-300',
  green: 'bg-green-100 text-green-900 border-green-300',
  red: 'bg-red-100 text-red-900 border-red-300',
  gray: 'bg-slate-100 text-slate-900 border-slate-300',
};
const ICONS = {
  PENDIENTE: Clock, CONFIRMADO: CheckCircle2, EN_PREPARACION: ChefHat, LISTO_PARA_RECOGER: PackageCheck,
  EN_CAMINO: Truck, ENTREGADO: CheckCheck, ENTREGADA: CheckCheck, CANCELADO: XCircle, CANCELADA: XCircle,
  RECHAZADO: Ban, ASIGNADA: UserCheck, RECOGIDA: Package, APROBADO: CheckCircle2,
};

// Siempre icono + texto (nunca solo color) y contraste >= 4.5:1
export default function StatusBadge({ status, className = '' }) {
  const meta = STATUS_META[status] || { label: status, tone: 'gray' };
  const Icon = ICONS[status] || Clock;
  return (
    <span data-testid={`status-badge-${status}`} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${TONES[meta.tone]} ${className}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {meta.label}
    </span>
  );
}
