import { useState } from 'react';
import { MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useFetch } from '../../hooks/useFetch';
import { api } from '../../lib/api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/AppButton';
import Modal from '../../components/ui/Modal';
import { EmptyState, ErrorState, Loading, PageHeader } from '../../components/ui/States';

function AddressForm({ initial, onSaved, onCancel }) {
  const toast = useToast();
  const [f, setF] = useState(initial || { label: '', street: '', city: 'Bogotá', notes: '' });
  const [touched, setTouched] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const errs = { label: !f.label.trim() ? 'Ponle un nombre (Casa, Trabajo…)' : '', street: f.street.trim().length < 5 ? 'Escribe la dirección completa' : '', city: !f.city.trim() ? 'Indica la ciudad' : '' };
  const save = async () => {
    setTouched(true);
    if (Object.values(errs).some(Boolean)) return;
    try {
      if (initial?.id) await api.put(`/addresses/${initial.id}`, f); else await api.post('/addresses', f);
      toast.success('Dirección guardada');
      onSaved();
    } catch (e) { toast.error(e.message); }
  };
  return (
    <div className="space-y-3" data-testid="address-form">
      <Input label="Nombre" value={f.label} onChange={set('label')} error={touched && errs.label} data-testid="address-label" />
      <Input label="Dirección" value={f.street} onChange={set('street')} error={touched && errs.street} data-testid="address-street" />
      <Input label="Ciudad" value={f.city} onChange={set('city')} error={touched && errs.city} />
      <Input label="Indicaciones (opcional)" value={f.notes} onChange={set('notes')} />
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button onClick={save} data-testid="address-save">Guardar dirección</Button>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const isClient = user.role === 'CLIENTE';
  const addrs = useFetch('/addresses', { enabled: isClient });
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [modal, setModal] = useState(null); // null | {} | address

  const nameErr = name.trim().length < 3 ? 'Escribe tu nombre completo' : '';
  const saveProfile = async () => {
    if (nameErr) return;
    try { setUser(await api.put('/profile', { name: name.trim(), phone })); toast.success('Perfil actualizado'); } catch (e) { toast.error(e.message); }
  };
  const makeDefault = async (id) => { await api.patch(`/addresses/${id}/default`); addrs.reload(); };
  const remove = async (id) => { if (!window.confirm('¿Eliminar esta dirección?')) return; await api.del(`/addresses/${id}`); addrs.reload(); };

  return (
    <div className="space-y-10" data-testid="profile-page">
      <section>
        <PageHeader title="Mi perfil" subtitle={`${user.email} · ${user.role.toLowerCase()}`} />
        <div className="grid max-w-xl gap-4 rounded-2xl border border-slate-200 bg-white p-5">
          <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} error={nameErr} data-testid="profile-name" />
          <Input label="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="profile-phone" />
          <div><Button onClick={saveProfile} data-testid="profile-save">Guardar cambios</Button></div>
        </div>
      </section>

      {isClient && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-extrabold">Direcciones de entrega</h2>
            <Button icon={Plus} onClick={() => setModal({})} data-testid="address-add">Nueva dirección</Button>
          </div>
          {addrs.loading ? <Loading /> : addrs.error ? <ErrorState error={addrs.error} onRetry={addrs.reload} /> :
            addrs.data.length === 0 ? <EmptyState title="Aún no tienes direcciones" text="Agrega una para poder hacer tu primer pedido." /> : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {addrs.data.map((a) => (
                  <li key={a.id} data-testid="address-item" className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="flex items-center gap-2 font-bold"><MapPin className="h-4 w-4 text-brand-700" aria-hidden="true" />{a.label}
                          {a.isDefault && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-900">Predeterminada</span>}</p>
                        <p className="mt-1 text-sm">{a.street}, {a.city}</p>
                        {a.notes && <p className="text-sm text-slate-600">{a.notes}</p>}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {!a.isDefault && <Button size="sm" variant="secondary" icon={Star} onClick={() => makeDefault(a.id)}>Hacer predeterminada</Button>}
                      <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setModal(a)}>Editar</Button>
                      <Button size="sm" variant="ghost" icon={Trash2} onClick={() => remove(a.id)} aria-label={`Eliminar ${a.label}`}>Eliminar</Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Editar dirección' : 'Nueva dirección'}>
            <AddressForm initial={modal?.id ? modal : null} onCancel={() => setModal(null)} onSaved={() => { setModal(null); addrs.reload(); }} />
          </Modal>
        </section>
      )}
    </div>
  );
}
