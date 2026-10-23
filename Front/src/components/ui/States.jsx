import { AlertTriangle, Inbox } from 'lucide-react';
import Spinner from './Spinner';
import Button from './AppButton';

export const Loading = ({ label = 'Cargando…' }) => (
  <div className="flex items-center justify-center gap-3 py-16 text-slate-600" data-testid="loading">
    <Spinner className="h-6 w-6" /> {label}
  </div>
);

export const ErrorState = ({ error, onRetry }) => (
  <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-900" data-testid="error-state">
    <AlertTriangle className="h-8 w-8" aria-hidden="true" />
    <p className="font-semibold">{error?.message || 'No pudimos cargar la información'}</p>
    {onRetry && <Button variant="secondary" onClick={onRetry}>Reintentar</Button>}
  </div>
);

export const EmptyState = ({ title, text, children }) => (
  <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center" data-testid="empty-state">
    <Inbox className="h-9 w-9 text-slate-500" aria-hidden="true" />
    <p className="font-bold">{title}</p>
    {text && <p className="max-w-sm text-sm text-slate-600">{text}</p>}
    {children}
  </div>
);

export const PageHeader = ({ title, subtitle, children }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-slate-600">{subtitle}</p>}
    </div>
    {children}
  </div>
);
