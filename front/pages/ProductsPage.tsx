import { useMemo, useState } from 'react';
import type { Commerce, Product } from '../types';

interface ProductsPageProps {
  products: Product[];
  commerces: Commerce[];
  onChangeProducts: (products: Product[]) => void;
}

const emptyProduct = {
  name: '',
  description: '',
  price: 0,
  commerce: '',
  category: '',
  imageUrl: '',
  inStock: true,
};

export function ProductsPage({ products, commerces, onChangeProducts }: ProductsPageProps) {
  const [filterCommerce, setFilterCommerce] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productForm, setProductForm] = useState(emptyProduct);

  const filteredProducts = useMemo(
    () => products.filter((product) => (filterCommerce ? product.commerce === filterCommerce : true)),
    [products, filterCommerce],
  );

  const commerceOptions = useMemo(() => commerces.map((commerce) => commerce.name), [commerces]);

  const handleToggleStock = (id: number) => {
    onChangeProducts(
      products.map((product) => (product.id === id ? { ...product, inStock: !product.inStock } : product)),
    );
  };

  const handleSaveProduct = () => {
    if (!productForm.name || !productForm.commerce || !productForm.category || !productForm.description) {
      return;
    }

    const nextId = Math.max(0, ...products.map((item) => item.id)) + 1;
    onChangeProducts([...products, { id: nextId, ...productForm }]);
    setProductForm(emptyProduct);
    setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    onChangeProducts(products.filter((product) => product.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/30 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Productos</h2>
          <p className="mt-1 text-sm text-slate-400">Gestiona el catálogo de productos y su disponibilidad.</p>
        </div>
        <button type="button" onClick={() => setIsModalOpen(true)} className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-400">
          + Crear Producto
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <select
          value={filterCommerce}
          onChange={(event) => setFilterCommerce(event.target.value)}
          className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
        >
          <option value="">Todos los comercios</option>
          {commerceOptions.map((commerceName) => (
            <option key={commerceName} value={commerceName}>
              {commerceName}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {filteredProducts.map((product) => (
          <div key={product.id} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/30">
            <div className="flex items-center gap-4">
              <img src={product.imageUrl} alt={product.name} className="h-20 w-20 rounded-3xl object-cover" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                <p className="mt-1 text-sm text-slate-400">{product.description}</p>
                <p className="mt-2 text-sm text-slate-300">{product.category} · {product.commerce}</p>
              </div>
              <span className="text-lg font-semibold text-white">$ {product.price.toLocaleString('es-CO')}</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${product.inStock ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-300'}`}>
                {product.inStock ? 'En stock' : 'Agotado'}
              </span>
              <button
                type="button"
                onClick={() => handleToggleStock(product.id)}
                className="rounded-2xl bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
              >
                Cambiar disponibilidad
              </button>
              <button
                type="button"
                onClick={() => handleDelete(product.id)}
                className="rounded-2xl bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {!filteredProducts.length && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 text-center text-slate-400">No hay productos registrados para el comercio seleccionado.</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">Crear Producto</h3>
                <p className="mt-1 text-sm text-slate-400">Agrega un producto nuevo al catálogo.</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-full border border-slate-700 px-3 py-2 text-slate-300 hover:bg-slate-800">
                Cerrar
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-300">
                Nombre del producto
                <input
                  value={productForm.name}
                  onChange={(event) => setProductForm({ ...productForm, name: event.target.value })}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  placeholder="Ej. Combo Burger"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                Comercio
                <select
                  value={productForm.commerce}
                  onChange={(event) => setProductForm({ ...productForm, commerce: event.target.value })}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="">Seleccionar comercio</option>
                  {commerceOptions.map((commerceName) => (
                    <option key={commerceName} value={commerceName}>
                      {commerceName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
                Descripción
                <textarea
                  value={productForm.description}
                  onChange={(event) => setProductForm({ ...productForm, description: event.target.value })}
                  className="h-24 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none resize-none"
                  placeholder="Descripción del producto"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                Categoría
                <input
                  value={productForm.category}
                  onChange={(event) => setProductForm({ ...productForm, category: event.target.value })}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  placeholder="Ej. Fast Food"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                Precio
                <input
                  type="number"
                  value={productForm.price}
                  onChange={(event) => setProductForm({ ...productForm, price: Number(event.target.value) })}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  placeholder="0"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
                Imagen URL
                <input
                  value={productForm.imageUrl}
                  onChange={(event) => setProductForm({ ...productForm, imageUrl: event.target.value })}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  placeholder="https://..."
                />
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={productForm.inStock}
                  onChange={(event) => setProductForm({ ...productForm, inStock: event.target.checked })}
                  className="h-5 w-5 rounded border-slate-700 bg-slate-950 text-orange-500"
                />
                Disponible en stock
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={handleSaveProduct} className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-400">
                Guardar Producto
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
