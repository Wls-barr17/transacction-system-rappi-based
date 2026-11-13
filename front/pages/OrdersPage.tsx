import { useMemo } from 'react';
import type { Order } from '../types';

interface OrdersPageProps {
  orders: Order[];
  onChangeOrders: (orders: Order[]) => void;
}

const statusOptions: Order['status'][] = ['Creado', 'Preparando', 'En camino', 'Entregado', 'Cancelado'];

export function OrdersPage({ orders, onChangeOrders }: OrdersPageProps) {
  const handleStatusChange = (id: number, status: Order['status']) => {
    onChangeOrders(orders.map((order) => (order.id === id ? { ...order, status } : order)));
  };

  const metrics = useMemo(
    () => ({
      created: orders.filter((order) => order.status === 'Creado').length,
      preparing: orders.filter((order) => order.status === 'Preparando').length,
      onTheWay: orders.filter((order) => order.status === 'En camino').length,
      delivered: orders.filter((order) => order.status === 'Entregado').length,
      canceled: orders.filter((order) => order.status === 'Cancelado').length,
    }),
    [orders],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/30 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Pedidos Globales</h2>
          <p className="mt-1 text-sm text-slate-400">Supervisa todos los pedidos y actualiza estados desde aquí.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
            <p className="text-xs uppercase text-slate-500">Creado</p>
            <p className="mt-1 text-lg font-semibold text-white">{metrics.created}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
            <p className="text-xs uppercase text-slate-500">Preparando</p>
            <p className="mt-1 text-lg font-semibold text-white">{metrics.preparing}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
            <p className="text-xs uppercase text-slate-500">En camino</p>
            <p className="mt-1 text-lg font-semibold text-white">{metrics.onTheWay}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
            <p className="text-xs uppercase text-slate-500">Entregado</p>
            <p className="mt-1 text-lg font-semibold text-white">{metrics.delivered}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
            <p className="text-xs uppercase text-slate-500">Cancelado</p>
            <p className="mt-1 text-lg font-semibold text-white">{metrics.canceled}</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/30">
        <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr>
              {['# Pedido', 'Cliente', 'Comercio', 'Repartidor', 'Total $', 'Pago', 'Estado', 'Creado'].map((heading) => (
                <th key={heading} className="border-b border-slate-800 pb-3 pr-4 text-slate-400">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-slate-800 last:border-b-0">
                <td className="py-4 pr-4 text-slate-300">#{order.id}</td>
                <td className="py-4 pr-4 text-white">{order.customer}</td>
                <td className="py-4 pr-4 text-slate-300">{order.merchant}</td>
                <td className="py-4 pr-4 text-slate-300">{order.driverAssigned}</td>
                <td className="py-4 pr-4 text-white">$ {order.total.toLocaleString('es-CO')}</td>
                <td className="py-4 pr-4 text-slate-300">{order.paymentMethod}</td>
                <td className="py-4 pr-4">
                  <select
                    value={order.status}
                    onChange={(event) => handleStatusChange(order.id, event.target.value as Order['status'])}
                    className="rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-4 pr-4 text-slate-300">{new Date(order.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
