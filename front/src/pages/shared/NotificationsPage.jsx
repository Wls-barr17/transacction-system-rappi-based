import { Bell, BellOff, CheckCheck } from 'lucide-react';
import { useNotifications } from '../../context/NotificationsContext';
import { EmptyState, PageHeader } from '../../components/ui/States';
import Button from '../../components/ui/AppButton';
import { fmtDate } from '../../lib/format';

export default function NotificationsPage() {
  const { items, unread, markAll, markRead } = useNotifications();
  return (
    <div data-testid="notifications-page">
      <PageHeader title="Notificaciones" subtitle={unread ? `Tienes ${unread} sin leer` : 'Estás al día'}>
        {unread > 0 && <Button variant="secondary" icon={CheckCheck} onClick={markAll}>Marcar todas como leídas</Button>}
      </PageHeader>
      {items.length === 0 ? (
        <EmptyState title="Sin notificaciones" text="Cuando haya novedades de tus pedidos aparecerán aquí." />
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n.id} data-testid="notification-item" className={`flex items-start gap-3 rounded-xl border p-4 ${n.read ? 'border-slate-200 bg-white' : 'border-brand-300 bg-brand-50'}`}>
              {n.read ? <BellOff className="mt-0.5 h-5 w-5 text-slate-500" aria-hidden="true" /> : <Bell className="mt-0.5 h-5 w-5 text-brand-700" aria-hidden="true" />}
              <div className="flex-1">
                <p className="font-medium">{n.text}</p>
                <p className="text-xs text-slate-600">{fmtDate(n.createdAt)}{!n.read && ' · Nueva'}</p>
              </div>
              {!n.read && <button type="button" onClick={() => markRead(n.id)} className="text-sm font-semibold text-brand-800 underline">Marcar leída</button>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
