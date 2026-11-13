import { useState } from 'react';
import { Store } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { EMAIL_RE, money } from '../../lib/format';
import Button from '../../components/ui/AppButton';
import Input from '../../components/ui/Input';
import { ErrorState, Loading, PageHeader } from '../../components/ui/States';

const EMPTY = { name: '', category: '', emoji: '🍽️', description: '', deliveryFee: 3000, ownerName: '', ownerEmail: '', ownerPassword: '' };

export default function AdminMerchants() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch('/admin/merchants');
  const [f, setF] = useState(EMPTY);
  const [touched, setTouched] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const errs = {
    name: f.name.trim().length < 3 ? 'Nombre del comercio obligatorio' : '', category: !f.category.trim() ? 'Indica la categoría (Pizza, Sushi…)' : '',
    ownerName: f.ownerName.trim().length < 3 ? 'Nombre del propietario obligatorio' : '', ownerEmail: !EMAIL_RE.test(f.ownerEmail) ? 'Correo no válido' : '',
    ownerPassword: f.ownerPassword.length < 8 ? 'Mínimo 8 caracteres' : '',
  };
  const save = async () => {
    setTouched(true);
    if (Object.values(errs).some(Boolean)) return;
    try { await api.post('/admin/merchants', f); toast.success('Comercio y propietario registrados'); setF(EMPTY); setTouched(false); reload(); } catch (e) { toast.error(e.message); }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-8" data-testid="admin-merchants">
      <PageHeader title="Comercios" subtitle="Incorpora nuevos comercios junto con su propietario." />
      <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="h-nm">
        <h2 id="h-nm" className="mb-3 text-lg font-bold">Registrar comercio</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Input label="Nombre del comercio" value={f.name} onChange={set('name')} error={touched && errs.name} data-testid="m-name" />
          <Input label="Categoría" value={f.category} onChange={set('category')} error={touched && errs.category} data-testid="m-category" />
          <Input label="Costo de envío (COP)" type="number" min="0" value={f.deliveryFee} onChange={set('deliveryFee')} />
          <Input label="Descripción" value={f.description} onChange={set('description')} className="md:col-span-2" />
          <Input label="Emoji" value={f.emoji} onChange={set('emoji')} maxLength={4} />
          <Input label="Propietario" value={f.ownerName} onChange={set('ownerName')} error={touched && errs.ownerName} data-testid="m-owner" />
          <Input label="Correo del propietario" type="email" value={f.ownerEmail} onChange={set('ownerEmail')} error={touched && errs.ownerEmail} data-testid="m-owner-email" />
          <Input label="Contraseña inicial" type="password" value={f.ownerPassword} onChange={set('ownerPassword')} error={touched && errs.ownerPassword} data-testid="m-owner-password" />
        </div>
        <Button className="mt-4" icon={Store} onClick={save} data-testid="m-save">Registrar comercio</Button>
      </section>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((m) => (
          <li key={m.id} className="rounded-2xl border border-slate-200 bg-white p-4" data-testid="merchant-row">
            <p className="text-lg font-bold"><span aria-hidden="true">{m.emoji} </span>{m.name}</p>
            <p className="text-sm text-slate-700">{m.category} · Envío {money(m.deliveryFee)}</p>
            <p className="mt-2 text-sm">Propietario: {m.ownerName}<br /><span className="text-slate-600">{m.ownerEmail}</span></p>
            <p className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${m.open ? 'bg-green-100 text-green-900' : 'bg-slate-200 text-slate-800'}`}>{m.open ? 'Recibiendo pedidos' : 'No recibe pedidos'}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
