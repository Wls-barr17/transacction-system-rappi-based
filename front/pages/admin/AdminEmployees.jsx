import { useState } from 'react';
import { Trash2, UserPlus } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import Button from '../../components/ui/AppButton';
import Input, { selectCls } from '../../components/ui/Input';
import { ErrorState, Loading, PageHeader } from '../../components/ui/States';

export default function AdminEmployees() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch('/admin/employees');
  const [f, setF] = useState({ name: '', type: 'DIRECTO', position: '', document: '' });
  const [touched, setTouched] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const errs = { name: f.name.trim().length < 3 ? 'Escribe el nombre o razón social' : '', position: !f.position.trim() ? 'Indica el cargo o servicio' : '', document: !/^\d{5,15}$/.test(f.document) ? 'Documento o NIT: solo números (5 a 15 dígitos)' : '' };

  const save = async () => {
    setTouched(true);
    if (Object.values(errs).some(Boolean)) return;
    try { await api.post('/admin/employees', f); toast.success('Empleado registrado'); setF({ name: '', type: 'DIRECTO', position: '', document: '' }); setTouched(false); reload(); } catch (e) { toast.error(e.message); }
  };
  const remove = async (e) => { if (!window.confirm(`¿Eliminar a ${e.name}?`)) return; await api.del(`/admin/employees/${e.id}`); reload(); };

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-8" data-testid="admin-employees">
      <PageHeader title="Empleados" subtitle="Registra personal directo (contratado) e indirecto (terceros)." />
      <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="h-new">
        <h2 id="h-new" className="mb-3 text-lg font-bold">Registrar empleado</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <Input label="Nombre / razón social" value={f.name} onChange={set('name')} error={touched && errs.name} data-testid="emp-name" />
          <div><label htmlFor="emp-type" className="mb-1 block text-sm font-semibold">Tipo</label>
            <select id="emp-type" className={selectCls} value={f.type} onChange={set('type')} data-testid="emp-type"><option value="DIRECTO">Directo</option><option value="INDIRECTO">Indirecto</option></select></div>
          <Input label="Cargo / servicio" value={f.position} onChange={set('position')} error={touched && errs.position} data-testid="emp-position" />
          <Input label="Documento / NIT" inputMode="numeric" value={f.document} onChange={set('document')} error={touched && errs.document} data-testid="emp-document" />
        </div>
        <Button className="mt-4" icon={UserPlus} onClick={save} data-testid="emp-save">Registrar</Button>
      </section>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Empleados</caption>
          <thead className="bg-slate-50 text-slate-700"><tr><th className="p-3">Nombre</th><th className="p-3">Tipo</th><th className="p-3">Cargo</th><th className="p-3">Documento</th><th className="p-3"><span className="sr-only">Acciones</span></th></tr></thead>
          <tbody>
            {data.map((e) => (
              <tr key={e.id} className="border-t border-slate-100" data-testid="employee-row">
                <td className="p-3 font-semibold">{e.name}</td>
                <td className="p-3"><span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${e.type === 'DIRECTO' ? 'border-blue-300 bg-blue-100 text-blue-900' : 'border-violet-300 bg-violet-100 text-violet-900'}`}>{e.type === 'DIRECTO' ? 'Directo' : 'Indirecto'}</span></td>
                <td className="p-3">{e.position}</td><td className="p-3">{e.document}</td>
                <td className="p-3"><button type="button" onClick={() => remove(e)} aria-label={`Eliminar ${e.name}`} className="rounded-lg p-2 text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
