import { useState } from 'react';
import type { Repartidor } from '../types';

interface DriversPageProps {
  drivers: Repartidor[];
  onChangeDrivers: (drivers: Repartidor[]) => void;
}

const emptyDriver = {
  name: '',
  phone: '',
  vehicle: 'Moto' as Repartidor['vehicle'],
  status: 'Disponible' as Repartidor['status'],
  zone: '',
  rating: 4.5,
  currentOrder: 'Ninguno',
};

export function DriversPage({ drivers, onChangeDrivers }: DriversPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState(emptyDriver);

  const handleSaveDriver = () => {
    if (!formState.name || !formState.phone || !formState.zone) {
      return;
    }
    const nextId = Math.max(0, ...drivers.map((item) => item.id)) + 1;
    onChangeDrivers([...drivers, { id: nextId, ...formState }]);
    setFormState(emptyDriver);
    setIsModalOpen(false);
  };

  const handleStatusChange = (id: number, status: Repartidor['status']) => {
    onChangeDrivers(drivers.map((driver) => (driver.id === id ? { ...driver, status } : driver)));
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span key={index} className={index < Math.round(rating) ? 'text-amber-400' : 'text-slate-600'}>&#9733;</span>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/30 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Repartidores</h2>
          <p className="mt-1 text-sm text-slate-400">Registra repartidores y gestiona sus estados de entrega.</p>
        </div>
        <button type="button" onClick={() => setIsModalOpen(true)} className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-400">
          + Registrar Repartidor
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {drivers.map((driver) => (
          <div key={driver.id} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/30">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-500 text-xl font-semibold text-white">
                {driver.name
                  .split(' ')
                  .map((word) => word[0])
                  .join('')}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{driver.name}</h3>
                <p className="text-sm text-slate-400">{driver.vehicle} · {driver.zone}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-slate-300">
              <p>Tel: {driver.phone}</p>
              <p>Pedido actual: {driver.currentOrder}</p>
              <p>Calificación: <span className="text-amber-400">{renderStars(driver.rating)}</span></p>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <select
                value={driver.status}
                onChange={(event) => handleStatusChange(driver.id, event.target.value as Repartidor['status'])}
                className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="Disponible">Disponible</option>
                <option value="En entrega">En entrega</option>
                <option value="Inactivo">Inactivo</option>
              </select>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                driver.status === 'Disponible'
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : driver.status === 'En entrega'
                  ? 'bg-cyan-500/15 text-cyan-300'
                  : 'bg-slate-800 text-slate-300'
              }`}>
                {driver.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">Registrar Repartidor</h3>
                <p className="mt-1 text-sm text-slate-400">Agrega un nuevo repartidor al equipo.</p>
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
                  placeholder="Nombre completo"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                Teléfono
                <input
                  value={formState.phone}
                  onChange={(event) => setFormState({ ...formState, phone: event.target.value })}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  placeholder="3001234567"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                Vehículo
                <select
                  value={formState.vehicle}
                  onChange={(event) => setFormState({ ...formState, vehicle: event.target.value as Repartidor['vehicle'] })}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="Moto">Moto</option>
                  <option value="Bici">Bici</option>
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                Zona
                <input
                  value={formState.zone}
                  onChange={(event) => setFormState({ ...formState, zone: event.target.value })}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  placeholder="Norte"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                Estado inicial
                <select
                  value={formState.status}
                  onChange={(event) => setFormState({ ...formState, status: event.target.value as Repartidor['status'] })}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="Disponible">Disponible</option>
                  <option value="En entrega">En entrega</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                Calificación
                <input
                  type="number"
                  min={1}
                  max={5}
                  step={0.1}
                  value={formState.rating}
                  onChange={(event) => setFormState({ ...formState, rating: Number(event.target.value) })}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
                Pedido actual
                <input
                  value={formState.currentOrder}
                  onChange={(event) => setFormState({ ...formState, currentOrder: event.target.value })}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  placeholder="Pedido #9005 o Ninguno"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={handleSaveDriver} className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-400">
                Guardar Repartidor
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
