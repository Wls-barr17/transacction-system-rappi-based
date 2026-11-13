import { Search, X } from 'lucide-react';

// Inspirada en "animated-glowing-search-bar" de 21st.dev
export default function GlowingSearchBar({ value, onChange, placeholder = 'Buscar…' }) {
  return (
    <div className="glow-wrap" data-testid="search-bar">
      <div className="glow-inner flex items-center gap-2 px-4">
        <Search className="h-5 w-5 shrink-0 text-slate-600" aria-hidden="true" />
        <input type="search" aria-label={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} data-testid="search-input"
          className="h-12 w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none [&::-webkit-search-cancel-button]:hidden" />
        {value && (
          <button type="button" onClick={() => onChange('')} aria-label="Limpiar búsqueda" className="rounded-full p-1 text-slate-600 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
