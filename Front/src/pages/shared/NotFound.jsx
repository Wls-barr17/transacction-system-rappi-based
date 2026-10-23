import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

// Inspirado en "not-found-page-1" de 21st.dev
export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4 text-center text-white" data-testid="not-found">
      <div>
        <Compass className="mx-auto h-12 w-12 text-brand-400" aria-hidden="true" />
        <p className="mt-4 bg-gradient-to-b from-brand-300 to-rose-500 bg-clip-text font-display text-[8rem] font-extrabold leading-none text-transparent sm:text-[11rem]">404</p>
        <h1 className="mt-2 text-2xl font-bold">Esta página no existe</h1>
        <p className="mx-auto mt-2 max-w-sm text-slate-300">Revisa la dirección o vuelve al inicio para seguir pidiendo.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/" className="rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-500">Ir al inicio</Link>
          <Link to="/login" className="rounded-xl border border-slate-500 px-5 py-3 font-semibold hover:bg-slate-800">Iniciar sesión</Link>
        </div>
      </div>
    </main>
  );
}
