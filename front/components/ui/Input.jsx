import { forwardRef, useId } from 'react';
import { AlertCircle } from 'lucide-react';

export const selectCls =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-200';

const Input = forwardRef(function Input({ label, error, hint, right, className = '', ...props }, ref) {
  const id = useId();
  const errId = `${id}-err`;
  const hintId = `${id}-hint`;
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="mb-1 block text-sm font-semibold text-slate-800">{label}</label>}
      <div className="relative">
        <input id={id} ref={ref} aria-invalid={!!error} aria-describedby={error ? errId : hint ? hintId : undefined}
          className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 ${error ? 'border-red-600 focus:ring-red-200' : 'border-slate-300 focus:border-brand-600 focus:ring-brand-200'} ${right ? 'pr-11' : ''}`}
          {...props} />
        {right && <div className="absolute inset-y-0 right-2 flex items-center">{right}</div>}
      </div>
      {error ? (
        <p id={errId} role="alert" className="mt-1 flex items-center gap-1 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />{error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1 text-xs text-slate-600">{hint}</p>
      ) : null}
    </div>
  );
});
export default Input;
