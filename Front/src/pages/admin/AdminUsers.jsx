import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { EMAIL_RE } from '../../lib/format';
import { ROLES } from '../../lib/constants';
import Button from '../../components/ui/AppButton';
import Input, { selectCls } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { ErrorState, Loading, PageHeader } from '../../components/ui/States';

function NewUser({ onSaved, onCancel }) {
  const toast = useToast();
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'CLIENTE' });
  const [touched, setTouched] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const errs = { name: f.name.trim().length < 3 ? 'Escribe el nombre completo' : '', email: !EMAIL_RE.test(f.email) ? 'Correo no válido' : '', password: f.password.length < 8 ? 'Mínimo 8 caracteres' : '' };
  const save = async () => {
    setTouched(true);
    if (Object.values(errs).some(Boolean)) return;
    try { await api.post('/admin/users', f); toast.success('Usuario creado'); onSaved(); } catch (e) { toast.error(e.message); }
  };
  return (
    <div className="space-y-3" data-testid="new-user-form">
      <Input label="Nombre" value={f.name} onChange={set('name')} error={touched && errs.name} />
      <Input label="Correo" type="email" value={f.email} onChange={set('email')} error={touched && errs.email} />
      <Input label="Contraseña inicial" type="password" value={f.password} onChange={set('password')} error={touched && errs.password} />
      <div><label htmlFor="nu-role" className="mb-1 block text-sm font-semibold">Rol</label>
        <select id="nu-role" className={selectCls} value={f.role} onChange={set('role')}>{Object.values(ROLES).map((r) => <option key={r}>{r}</option>)}</select></div>
      <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" onClick={onCancel}>Cancelar</Button><Button onClick={save} data-testid="new-user-save">Crear usuario</Button></div>
    </div>
  );
}

export default function AdminUsers() {
  const { user: me } = useAuth();
  const toast = useToast();
  const { data, loading, error, reload } = useFetch('/admin/users');
  const [open, setOpen] = useState(false);
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const changeRole = async (u, role) => {
    if (role === u.role) return;
    if (!window.confirm(`¿Cambiar el rol de ${u.name} a ${role}?`)) { reload(); return; }
    try { await api.patch(`/admin/users/${u.id}/role`, { role }); toast.success('Rol actualizado'); reload(); } catch (e) { toast.error(e.message); reload(); }
  };

  return (
    <div data-testid="admin-users">
      <PageHeader title="Usuarios y roles" subtitle="Asigna el rol de cada persona en la plataforma.">
        <Button icon={UserPlus} onClick={() => setOpen(true)} data-testid="new-user">Nuevo usuario</Button>
      </PageHeader>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Usuarios</caption>
          <thead className="bg-slate-50 text-slate-700"><tr><th className="p-3">Nombre</th><th className="p-3">Correo</th><th className="p-3">Rol</th></tr></thead>
          <tbody>
            {data.map((u) => (
              <tr key={u.id} className="border-t border-slate-100" data-testid="user-row">
                <td className="p-3 font-semibold">{u.name}</td><td className="p-3">{u.email}</td>
                <td className="p-3">
                  <select aria-label={`Rol de ${u.name}`} className={`${selectCls} max-w-[12rem]`} value={u.role} disabled={u.id === me.id} onChange={(e) => changeRole(u, e.target.value)}>
                    {Object.values(ROLES).map((r) => <option key={r}>{r}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo usuario"><NewUser onCancel={() => setOpen(false)} onSaved={() => { setOpen(false); reload(); }} /></Modal>
    </div>
  );
}
