import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const Ctx = createContext(null);
export const useNotifications = () => useContext(Ctx);

// Polling cada 8 s al endpoint /notifications para refrescar alertas visuales
export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const seen = useRef(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const list = await api.get('/notifications');
      if (seen.current) list.filter((n) => !seen.current.has(n.id) && !n.read).forEach((n) => toast.info(n.text));
      seen.current = new Set(list.map((n) => n.id));
      setItems(list);
    } catch { /* se reintenta en el próximo ciclo */ }
  }, [user, toast]);

  useEffect(() => {
    seen.current = null;
    if (!user) { setItems([]); return undefined; }
    refresh();
    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
  }, [user, refresh]);

  const markAll = async () => { await api.patch('/notifications/read-all'); refresh(); };
  const markRead = async (id) => { await api.patch(`/notifications/${id}/read`); refresh(); };
  const unread = items.filter((n) => !n.read).length;

  return <Ctx.Provider value={{ items, unread, markAll, markRead, refresh }}>{children}</Ctx.Provider>;
}
