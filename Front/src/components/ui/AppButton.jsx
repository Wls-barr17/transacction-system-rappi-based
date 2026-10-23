import { useRef, useState } from 'react';
import Spinner from './Spinner';

const VARIANTS = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800',
  secondary: 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50',
  danger: 'bg-red-700 text-white hover:bg-red-800',
  success: 'bg-green-700 text-white hover:bg-green-800',
  warning: 'bg-amber-400 text-slate-900 hover:bg-amber-300',
  ghost: 'text-slate-700 hover:bg-slate-100',
};
const SIZES = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base' };

/**
 * Previene el doble clic: al hacer clic se deshabilita de inmediato y muestra
 * un spinner hasta que la promesa de onClick termine.
 */
export default function Button({ variant = 'primary', size = 'md', loading = false, disabled, onClick, icon: Icon, children, className = '', type = 'button', ...rest }) {
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);

  const handle = async (e) => {
    if (lock.current || loading || disabled || !onClick) return;
    lock.current = true;
    setBusy(true);
    try { await onClick(e); } finally { lock.current = false; setBusy(false); }
  };

  const isLoading = loading || busy;
  return (
    <button type={type} onClick={handle} disabled={disabled || isLoading} aria-busy={isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}>
      {isLoading ? <Spinner className="h-4 w-4" label="Procesando" /> : Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
      {children}
    </button>
  );
}
