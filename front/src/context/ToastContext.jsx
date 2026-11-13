import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, Info, XCircle } from 'lucide-react';

const Ctx = createContext(null);
export const useToast = () => useContext(Ctx);

const STYLES = {
  success: { box: 'border-green-700 bg-green-50 text-green-900', Icon: CheckCircle2 },
  error: { box: 'border-red-700 bg-red-50 text-red-900', Icon: XCircle },
  info: { box: 'border-slate-400 bg-white text-slate-900', Icon: Info },
};

export function ToastProvider({ children }) {
  const [list, setList] = useState([]);
  const push = useCallback((message, type) => {
    const id = Math.random();
    setList((l) => [...l, { id, message, type }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 4500);
  }, []);
  const toast = useMemo(
    () => ({ success: (m) => push(m, 'success'), error: (m) => push(m, 'error'), info: (m) => push(m, 'info') }),
    [push],
  );
  return (
    <Ctx.Provider value={toast}>
      {children}
      <div aria-live="polite" className="fixed bottom-4 right-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {list.map((t) => {
          const { box, Icon } = STYLES[t.type];
          return (
            <div key={t.id} role={t.type === 'error' ? 'alert' : 'status'} data-testid={`toast-${t.type}`}
              className={`flex items-start gap-2 rounded-xl border-l-4 p-3 text-sm shadow-lg ${box}`}>
              <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{t.message}</span>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}
