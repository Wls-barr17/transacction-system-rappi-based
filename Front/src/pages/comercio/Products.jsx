import { useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { money } from '../../lib/format';
import Button from '../../components/ui/AppButton';
import Input, { selectCls } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { EmptyState, ErrorState, Loading, PageHeader } from '../../components/ui/States';

function ProductForm({ initial, categories, onSaved, onCancel }) {
  const toast = useToast();
  const [f, setF] = useState(initial || { name: '', price: '', category: categories[0] || '', emoji: '🍽️', stock: 10, active: true });
  const [touched, setTouched] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const errs = {
    name: f.name.trim().length < 2 ? 'Escribe el nombre del producto' : '',
    price: !(Number(f.price) > 0) ? 'El precio debe ser mayor a 0' : '',
    category: !f.category ? 'Elige una categoría' : '',
    stock: !(Number(f.stock) >= 0) || f.stock === '' ? 'El stock no puede ser negativo' : '',
  };
  const save = async () => {
    setTouched(true);
    if (Object.values(errs).some(Boolean)) return;
    try {
      if (initial?.id) await api.put(`/my/products/${initial.id}`, f); else await api.post('/my/products', f);
      toast.success('Producto guardado');
      onSaved();
    } catch (e) { toast.error(e.message); }
  };
  return (
    <div className="space-y-3" data-testid="product-form">
      <Input label="Nombre" value={f.name} onChange={set('name')} error={touched && errs.name} data-testid="product-name" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Precio (COP)" type="number" min="0" value={f.price} onChange={set('price')} error={touched && errs.price} data-testid="product-price" />
        <Input label="Stock" type="number" min="0" value={f.stock} onChange={set('stock')} error={touched && errs.stock} data-testid="product-stock" />
      </div>
      <div className="grid grid-cols-[1fr_6rem] gap-3">
        <div>
          <label htmlFor="pcat" className="mb-1 block text-sm font-semibold">Categoría</label>
          <select id="pcat" className={selectCls} value={f.category} onChange={set('category')} data-testid="product-category">
            <option value="">Selecciona…</option>{categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          {touched && errs.category && <p role="alert" className="mt-1 text-sm text-red-700">{errs.category}</p>}
        </div>
        <Input label="Emoji" value={f.emoji} onChange={set('emoji')} maxLength={4} />
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={f.active} onChange={(e) => setF((s) => ({ ...s, active: e.target.checked }))} />Visible para los clientes</label>
      <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" onClick={onCancel}>Cancelar</Button><Button onClick={save} data-testid="product-save">Guardar producto</Button></div>
    </div>
  );
}

export default function MerchantProducts() {
  const toast = useToast();
  const merchant = useFetch('/my/merchant');
  const products = useFetch('/my/products');
  const [modal, setModal] = useState(null);
  const [newCat, setNewCat] = useState('');

  if (merchant.loading || products.loading) return <Loading />;
  if (merchant.error || products.error) return <ErrorState error={merchant.error || products.error} onRetry={() => { merchant.reload(); products.reload(); }} />;

  const cats = merchant.data.categories;
  const addCat = async () => {
    try { await api.post('/my/categories', { name: newCat }); setNewCat(''); merchant.reload(); } catch (e) { toast.error(e.message); }
  };
  const delCat = async (c) => { try { await api.del(`/my/categories/${encodeURIComponent(c)}`); merchant.reload(); } catch (e) { toast.error(e.message); } };
  const delProduct = async (p) => { if (!window.confirm(`¿Eliminar ${p.name}?`)) return; await api.del(`/my/products/${p.id}`); products.reload(); };

  return (
    <div className="space-y-8" data-testid="merchant-products">
      <PageHeader title="Categorías y productos" subtitle="Administra tu catálogo y precios.">
        <Button icon={Plus} onClick={() => setModal({})} disabled={cats.length === 0} data-testid="product-add">Nuevo producto</Button>
      </PageHeader>

      <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="h-cats">
        <h2 id="h-cats" className="text-lg font-bold">Categorías</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {cats.map((c) => (
            <li key={c} className="flex items-center gap-1 rounded-full border border-slate-300 bg-slate-50 py-1 pl-3 pr-1 text-sm font-semibold">
              {c} <span className="text-slate-600">({products.data.filter((p) => p.category === c).length})</span>
              <button type="button" onClick={() => delCat(c)} aria-label={`Eliminar categoría ${c}`} className="rounded-full p-1 hover:bg-slate-200"><X className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex max-w-sm items-start gap-2">
          <Input className="flex-1" aria-label="Nueva categoría" placeholder="Nueva categoría" value={newCat} onChange={(e) => setNewCat(e.target.value)} data-testid="category-input" />
          <Button variant="secondary" disabled={!newCat.trim()} onClick={addCat} data-testid="category-add">Agregar</Button>
        </div>
      </section>

      {products.data.length === 0 ? <EmptyState title="Aún no tienes productos" text="Crea el primero para que aparezca en el catálogo." /> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Productos</caption>
            <thead className="bg-slate-50 text-slate-700"><tr><th className="p-3">Producto</th><th className="p-3">Categoría</th><th className="p-3">Precio</th><th className="p-3">Stock</th><th className="p-3">Estado</th><th className="p-3"><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody>
              {products.data.map((p) => (
                <tr key={p.id} className="border-t border-slate-100" data-testid="product-row">
                  <td className="p-3 font-semibold"><span aria-hidden="true">{p.emoji} </span>{p.name}</td>
                  <td className="p-3">{p.category}</td>
                  <td className="p-3">{money(p.price)}</td>
                  <td className="p-3">{p.stock}</td>
                  <td className="p-3">{p.active ? 'Visible' : 'Oculto'}</td>
                  <td className="p-3"><div className="flex gap-1">
                    <button type="button" onClick={() => setModal(p)} aria-label={`Editar ${p.name}`} className="rounded-lg p-2 hover:bg-slate-100"><Pencil className="h-4 w-4" /></button>
                    <button type="button" onClick={() => delProduct(p)} aria-label={`Eliminar ${p.name}`} className="rounded-lg p-2 text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Editar producto' : 'Nuevo producto'}>
        <ProductForm initial={modal?.id ? modal : null} categories={cats} onCancel={() => setModal(null)} onSaved={() => { setModal(null); products.reload(); }} />
      </Modal>
    </div>
  );
}
