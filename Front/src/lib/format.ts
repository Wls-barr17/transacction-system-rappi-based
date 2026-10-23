// Helpers de formato y validación usados en toda la app.
export { cn } from './utils.ts';

export const money = (n: number | null | undefined): string =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

export const fmtDate = (iso: string | number | Date): string =>
  new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

export const dayKey = (d: string | number | Date): string => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const COUPON_RE = /^[A-Z0-9]{4,15}$/;
