import { useEffect, useState } from 'react';
import { AlertTriangle, Minus, Plus } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import Button from '../../components/ui/AppButton';
import { ErrorState, Loading, PageHeader } from '../../components/ui/States';

function Row({ p, onSaved }) {
  const toast = useToast();
  const [stock, setStock] = useState(String(p.stock));
  useEffect(() => setStock(String(p.stock)), [p.stock]);
  const n = Number(stock);
  const invalid = stock === '' || !Number.isInteger(n) || n < 0;
  const dirty = !invalid && n !== p.stock;
  const save = async () => { try { await api.patch(`/my/products/${p.id}/stock`, { stock: n }); toast.success(`Stock de ${p.name} actualizado`); onSaved(); } catch (e) { toast.error(e.message); } };

  return (
    <tr className="border-t border-slate-100" data-testid="inventory-row">
      <td className="p-3 font-semibold"><span aria-hidden="true">{p.emoji} </span>{p.name}</td>
      <td className="p-3">
        {p.stock === 0 ? <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-100 px-2 py-0.5 text-xs font-bold text-red-900">Agotado</span>
          : p.stock <= 5 ? <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900"><AlertTriangle className="h-3 w-3" aria-hidden="true" />Stock bajo</span>
          : <span className="text-slate-700">Disponible</span>}
      </td>
      <td className="p-3">
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setStock(String(Math.max(0, n - 1 || 0)))} aria-label={`Restar una unidad a ${p.name}`} className="rounded-lg border border-slate-300 p-1.5"><Minus className="h-4 w-4" /></button>
          <input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} aria-label={`Stock de ${p.name}`} aria-invalid={invalid}
            className={`w-20 rounded-lg border px-2 py-1.5 text-center ${invalid ? 'border-red-600' : 'border-slate-300'}`} data-testid="stock-input" />
          <button type="button" onClick={() => setStock(String((n || 0) + 1))} aria-label={`Sumar una unidad a ${p.name}`} className="rounded-lg border border-slate-300 p-1.5"><Plus className="h-4 w-4" /></button>
        </div>
        {invalid && <p role="alert" className="mt-1 text-xs text-red-700">Número entero, mínimo 0</p>}
      </td>
      <td className="p-3"><Button size="sm" disabled={!dirty} onClick={save} data-testid="stock-save">Guardar</Button></td>
    </tr>
  );
}

export default function MerchantInventory() {
  const { data, loading, error, reload } = useFetch('/my/products');
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  return (
    <div data-testid="merchant-inventory">
      <PageHeader title="Inventario" subtitle="Ajusta el stock disponible. Los productos en 0 aparecen como agotados." />
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Inventario</caption>
          <thead className="bg-slate-50 text-slate-700"><tr><th className="p-3">Producto</th><th className="p-3">Estado</th><th className="p-3">Stock</th><th className="p-3"><span className="sr-only">Guardar</span></th></tr></thead>
          <tbody>{data.map((p) => <Row key={p.id} p={p} onSaved={reload} />)}</tbody>
        </table>
      </div>
    </div>
  );
}
