import { useMemo, useState } from 'react';
import type { Promocion } from '../types';

interface PromotionsPageProps {
  promotions: Promocion[];
  onChangePromotions: (promotions: Promocion[]) => void;
}

export function PromotionsPage({ promotions, onChangePromotions }: PromotionsPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState<Promocion>({
    id: 0,
    code: '',
    discount: 0,
    discountType: '%',
    startDate: '',
    endDate: '',
    usageLimit: 0,
    minOrderValue: 0,
    active: true,
  });

  const sortedPromotions = useMemo(
    () => [...promotions].sort((a, b) => b.id - a.id),
    [promotions],
  );

  const handleSavePromotion = () => {
    if (!formState.code || !formState.startDate || !formState.endDate) {
      return;
    }

    const nextId = Math.max(0, ...promotions.map((item) => item.id)) + 1;
    onChangePromotions([...promotions, { ...formState, id: nextId }]);
    setFormState({ ...formState, code: '', discount: 0, startDate: '', endDate: '', usageLimit: 0, minOrderValue: 0, active: true });
    setIsModalOpen(false);
  };

  const toggleActive = (id: number) => {
    onChangePromotions(promotions.map((promotion) => (promotion.id === id ? { ...promotion, active: !promotion.active } : promotion)));
  };

  const handleDelete = (id: number) => {
    onChangePromotions(promotions.filter((promotion) => promotion.id !== id));
  };

  const isExpired = (endDate: string) => new Date(`${endDate}T23:59:59`).getTime() < Date.now();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/30 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Promociones y Cupones</h2>
          <p className="mt-1 text-sm text-slate-400">Crea cupones y controla su vigencia en tiempo real.</p>
        </div>
        <button type="button" onClick={() => setIsModalOpen(true)} className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-400">
          + Crear Cupón
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {sortedPromotions.map((promotion) => (
          <div key={promotion.id} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/30">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-white">{promotion.code}</h3>
                <p className="mt-1 text-sm text-slate-400">Descuento {promotion.discountType === '%' ? `${promotion.discount}%` : `$ ${promotion.discount.toLocaleString('es-CO')}`}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${promotion.active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-300'}`}>
                {promotion.active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-slate-300">
              <p>Expira: {promotion.endDate}</p>
              <p>Límite de usos: {promotion.usageLimit}</p>
              <p>Pedido mínimo: $ {promotion.minOrderValue.toLocaleString('es-CO')}</p>
              <p className="text-xs text-slate-500">{isExpired(promotion.endDate) ? 'Expiró' : 'Vigente'}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggleActive(promotion.id)}
                className="rounded-2xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
              >
                {promotion.active ? 'Desactivar' : 'Activar'}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(promotion.id)}
                className="rounded-2xl bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {!sortedPromotions.length && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 text-center text-slate-400">Aún no hay cupones registrados.</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">Crear Cupón</h3>
                <p className="mt-1 text-sm text-slate-400">Define el descuento y vigencia del cupón.</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-full border border-slate-700 px-3 py-2 text-slate-300 hover:bg-slate-800">
                Cerrar
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-300">
                Código del cupón
                <input
                  value={formState.code}
                  onChange={(event) => setFormState({ ...formState, code: event.target.value })}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  placeholder="RAPPI20"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                Tipo de descuento
                <select
                  value={formState.discountType}
                  onChange={(event) => setFormState({ ...formState, discountType: event.target.value as Promocion['discountType'] })}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="%">% Porcentaje</option>
                  <option value="$">Monto fijo</option>
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                Monto de descuento
                <input
                  type="number"
                  value={formState.discount}
                  onChange={(event) => setFormState({ ...formState, discount: Number(event.target.value) })}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  placeholder="10"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                Fecha de expiración
                <input
                  type="date"
                  value={formState.endDate}
                  onChange={(event) => setFormState({ ...formState, endDate: event.target.value })}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                Límite de usos
                <input
                  type="number"
                  value={formState.usageLimit}
                  onChange={(event) => setFormState({ ...formState, usageLimit: Number(event.target.value) })}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  placeholder="500"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                Pedido mínimo
                <input
                  type="number"
                  value={formState.minOrderValue}
                  onChange={(event) => setFormState({ ...formState, minOrderValue: Number(event.target.value) })}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  placeholder="25000"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={handleSavePromotion} className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-400">
                Guardar Cupón
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
