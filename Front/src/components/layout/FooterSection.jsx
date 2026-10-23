import { Link } from 'react-router-dom';
import { Bike } from 'lucide-react';

// Inspirado en "footer-section" de 21st.dev
export default function FooterSection() {
  const cols = [
    { title: 'Plataforma', links: [['Comercios', '/login'], ['Repartidores', '/login'], ['Crear cuenta', '/registro']] },
    { title: 'Ayuda', links: [['Iniciar sesión', '/login'], ['Estado de mi pedido', '/login']] },
  ];
  return (
    <footer className="border-t border-slate-200 bg-white" data-testid="footer">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link to="/" className="inline-flex items-center gap-2 font-display text-xl font-extrabold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-700 text-white"><Bike className="h-5 w-5" aria-hidden="true" /></span>
            DomiFlow
          </Link>
          <p className="mt-3 max-w-sm text-sm text-slate-600">Pide a los comercios de tu zona y sigue cada paso del domicilio hasta tu puerta.</p>
        </div>
        {cols.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h2 className="text-sm font-bold">{c.title}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {c.links.map(([label, to]) => <li key={label}><Link className="text-slate-700 underline-offset-2 hover:underline" to={to}>{label}</Link></li>)}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-600">© {new Date().getFullYear()} DomiFlow. Proyecto académico.</div>
    </footer>
  );
}
