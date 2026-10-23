import { Loader2 } from 'lucide-react';

export default function Spinner({ className = 'h-5 w-5', label = 'Cargando' }) {
  return <Loader2 role="status" aria-label={label} className={`animate-spin ${className}`} />;
}
