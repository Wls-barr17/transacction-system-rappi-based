import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ClipboardList, Package, Wallet } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import Switch from '../../components/ui/Switch';
import StatusBadge from '../../components/ui/StatusBadge';
import { ErrorState, Loading, PageHeader } from '../../components/ui/States';
import { dayKey, fmtDate, money } from '../../lib/format';

export default function MerchantDashboard() {
  const toast = useToast();
  const merchant = useFetch('/my/merchant');
  const orders = useFetch('/orders', { interval: 8000 });
  const products = useFetch('/my/products', { interval: 15000 });
  const [saving, setSaving] = useState(false);

  if (merchant.loading || orders.loading || products.loading) return <Loading />;
  if (merchant.error) return <ErrorState error={merchant.error} onRetry={merchant.reload} />;

  const m = merchant.data;
  const toggle = async (open) => {
    setSaving(true);
    try { await api.patch('/my/merchant', { open }); await merchant.reload(); toast.success(open ? 'Ahora recibes pedidos' : 'Dejaste de recibir pedidos'); } catch (e) { toast.error(e.message); } finally { setSaving(false); }
  };

  const list = orders.data || [];
  const pending = list.filter((o) => o.status === 'PENDIENTE').length;
  const inProgress = list.filter((o) => ['CONFIRMADO', 'EN_PREPARACION', 'LISTO_PARA_RECOGER'].includes(o.status)).length;
  const salesToday = list.filter((o) => o.status === 'ENTREGADO' && dayKey(o.createdAt) === dayKey(new Date())).reduce((s, o) => s + o.subtotal - o.discount, 0);
  const low = (products.data || []).filter((p) => p.stock <= 5);

  return (
    <div data-testid="merchant-dashboard" className="space-y-8">
      <PageHeader title={`${m.emoji} ${m.name}`} subtitle="Panel del negocio" />

      <section className={`flex items-center justify-between gap-4 rounded-2xl border-2 p-5 ${m.open ? 'border-green-700 bg-green-50' : 'border-slate-300 bg-white'}`} aria-labelledby="h-open">
        <div>
          <h2 id="h-open" className="text-lg font-bold">{m.open ? 'Estás recibiendo pedidos' : 'No estás recibiendo pedidos'}</h2>
          <p className="text-sm text-slate-700">Los clientes {m.open ? 'pueden' : 'no pueden'} hacer pedidos en tu comercio.</p>
        </div>
        <Switch checked={m.open} onChange={toggle} disabled={saving} label="Recibir pedidos" />
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {[[ClipboardList, 'Por aceptar', pending], [Package, 'En proceso', inProgress], [Wallet, 'Ventas entregadas hoy', money(salesToday)]].map(([Icon, label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5" data-testid="stat-card">
            <Icon className="h-6 w-6 text-brand-700" aria-hidden="true" />
            <p className="mt-2 text-3xl font-extrabold">{value}</p>
            <p className="text-sm text-slate-700">{label}</p>
          </div>
        ))}
      </div>

      {low.length > 0 && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-900" role="status">
          <h2 className="flex items-center gap-2 font-bold"><AlertTriangle className="h-5 w-5" aria-hidden="true" />Stock bajo</h2>
          <p className="mt-1 text-sm">{low.map((p) => `${p.name} (${p.stock})`).join(', ')}. <Link to="/comercio/inventario" className="font-bold underline">Ir al inventario</Link></p>
        </section>
      )}

      <section aria-labelledby="h-recent">
        <div className="mb-3 flex items-center justify-between"><h2 id="h-recent" className="text-xl font-bold">Últimos pedidos</h2><Link to="/comercio/pedidos" className="text-sm font-bold text-brand-800 underline">Gestionar pedidos</Link></div>
        <ul className="space-y-2">
          {list.slice(0, 5).map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
              <span className="font-semibold">#{o.code} · {o.customerName}</span>
              <span className="hidden text-sm text-slate-600 sm:block">{fmtDate(o.createdAt)}</span>
              <StatusBadge status={o.status} />
            </li>
          ))}
          {list.length === 0 && <li className="text-sm text-slate-600">Aún no has recibido pedidos.</li>}
        </ul>
      </section>
    </div>
  );
}
