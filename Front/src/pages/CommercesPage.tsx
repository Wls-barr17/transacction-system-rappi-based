import { useMemo, useState } from 'react';
import type { Commerce } from '../types';

interface CommercesPageProps {
  commerces: Commerce[];
  onChangeCommerces: (commerces: Commerce[]) => void;
}

const emptyForm = {
  name: '',
  category: '',
  city: '',
  agreementStatus: 'Activo' as Commerce['agreementStatus'],
  status: 'Activo' as Commerce['status'],
};

export function CommercesPage({ commerces, onChangeCommerces }: CommercesPageProps) {
  const [filterName, setFilterName] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCommerceId, setSelectedCommerceId] = useState<number | null>(null);
  const [formState, setFormState] = useState(emptyForm);

  const categories = useMemo(() => Array.from(new Set(commerces.map((commerce) => commerce.category))), [commerces]);
  const cities = useMemo(() => Array.from(new Set(commerces.map((commerce) => commerce.city))), [commerces]);

  const filteredCommerces = useMemo(
    () =>
      commerces.filter((commerce) => {
        const matchesName = commerce.name.toLowerCase().includes(filterName.toLowerCase());
        const matchesCategory = filterCategory ? commerce.category === filterCategory : true;
        const matchesCity = filterCity ? commerce.city === filterCity : true;
        return matchesName && matchesCategory && matchesCity;
      }),
    [commerces, filterName, filterCategory, filterCity],
  );

  const openNewCommerceModal = () => {
    setSelectedCommerceId(null);
    setFormState(emptyForm);
    setIsModalOpen(true);
  };

  const openEditCommerceModal = (commerce: Commerce) => {
    setSelectedCommerceId(commerce.id);
    setFormState({
      name: commerce.name,
      category: commerce.category,
      city: commerce.city,
      agreementStatus: commerce.agreementStatus,
      status: commerce.status,
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formState.name || !formState.category || !formState.city) {
      return;
    }

    if (selectedCommerceId) {
      onChangeCommerces(
        commerces.map((commerce) =>
          commerce.id === selectedCommerceId ? { ...commerce, ...formState } : commerce,
        ),
      );
    } else {
      const nextId = Math.max(0, ...commerces.map((item) => item.id)) + 1;
      onChangeCommerces([...commerces, { id: nextId, ...formState }]);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    onChangeCommerces(commerces.filter((commerce) => commerce.id !== id));
  };

  const toggleAgreement = (id: number) => {
    onChangeCommerces(
      commerces.map((commerce) =>
        commerce.id === id
          ? {
              ...commerce,
              agreementStatus: commerce.agreementStatus === 'Activo' ? 'Inactivo' : 'Activo',
              status: commerce.agreementStatus === 'Activo' ? 'Inactivo' : 'Activo',
            }
          : commerce,
      ),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/30 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Comercios</h2>
          <p className="mt-1 text-sm text-slate-400">Administra comercios, convenios y estados de afinidad.</p>
        </div>
        <button type="button" onClick={openNewCommerceModal} className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-400">
          + Nuevo Comercio
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <input
          value={filterName}
          onChange={(event) => setFilterName(event.target.value)}
          className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
          placeholder="Buscar por nombre"
        />
        <select
          value={filterCategory}
          onChange={(event) => setFilterCategory(event.target.value)}
          className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
        >
          <option value="">Todas las categorías</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <select
          value={filterCity}
          onChange={(event) => setFilterCity(event.target.value)}
          className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
        >
          <option value="">Todas las ciudades</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/30">
        <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr>
              {['ID', 'Nombre del Comercio', 'Categoría', 'Ciudad', 'Estado Convenio', 'Acciones'].map((heading) => (
                <th key={heading} className="border-b border-slate-800 pb-3 pr-4 text-slate-400">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredCommerces.map((commerce) => (
              <tr key={commerce.id} className="border-b border-slate-800 last:border-b-0">
                <td className="py-4 pr-4 text-slate-300">{commerce.id}</td>
                <td className="py-4 pr-4 text-white">{commerce.name}</td>
                <td className="py-4 pr-4 text-slate-300">{commerce.category}</td>
                <td className="py-4 pr-4 text-slate-300">{commerce.city}</td>
                <td className="py-4 pr-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      commerce.agreementStatus === 'Activo' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {commerce.agreementStatus}
                  </span>
                </td>
                <td className="py-4 pr-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleAgreement(commerce.id)}
                      className="rounded-2xl bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
                    >
                      {commerce.agreementStatus === 'Activo' ? 'Marcar Inactivo' : 'Marcar Activo'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditCommerceModal(commerce)}
                      className="rounded-2xl bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(commerce.id)}
                      className="rounded-2xl bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!filteredCommerces.length && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No hay comercios que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">{selectedCommerceId ? 'Editar Comercio' : 'Nuevo Comercio'}</h3>
                <p className="mt-1 text-sm text-slate-400">Llena los datos y guarda la información del comercio.</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-full border border-slate-700 px-3 py-2 text-slate-300 hover:bg-slate-800">
                Cerrar
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-300">
                Nombre
                <input
                  value={formState.name}
                  onChange={(event) => setFormState({ ...formState, name: event.target.value })}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  placeholder="Nombre del comercio"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                Categoría
                <input
                  value={formState.category}
                  onChange={(event) => setFormState({ ...formState, category: event.target.value })}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  placeholder="Ej. Fast Food"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                Ciudad
                <input
                  value={formState.city}
                  onChange={(event) => setFormState({ ...formState, city: event.target.value })}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  placeholder="Ciudad"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                Estado de Convenio
                <select
                  value={formState.agreementStatus}
                  onChange={(event) => setFormState({ ...formState, agreementStatus: event.target.value as Commerce['agreementStatus'] })}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                Estatus del Comercio
                <select
                  value={formState.status}
                  onChange={(event) => setFormState({ ...formState, status: event.target.value as Commerce['status'] })}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={handleSave} className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-400">
                Guardar Comercio
              </button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-2xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
