import { Link } from 'react-router-dom';
import { Bike, ChefHat, ShieldCheck, ShoppingBag } from 'lucide-react';
import GradientBarHero from '../../components/layout/GradientBarHero';
import FooterSection from '../../components/layout/FooterSection';
import { useAuth } from '../../context/AuthContext';
import { homeFor } from '../../lib/constants';

const ROLES = [
  { icon: ShoppingBag, title: 'Clientes', text: 'Elige un comercio, arma tu carrito, paga y mira el estado del pedido en tiempo real.' },
  { icon: ChefHat, title: 'Comercios', text: 'Recibe pedidos, controla tu inventario y avisa cuando todo está listo para recoger.' },
  { icon: Bike, title: 'Repartidores', text: 'Activa tu disponibilidad, toma entregas y actualiza el estado en un par de clics.' },
  { icon: ShieldCheck, title: 'Administradores', text: 'Gestiona usuarios, comercios y supervisa cada entrega de la operación.' },
];

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-white">
      <header className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 text-white">
          <span className="flex items-center gap-2 font-display text-xl font-extrabold">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600"><Bike className="h-5 w-5" aria-hidden="true" /></span>DomiFlow
          </span>
          <nav className="flex items-center gap-2 text-sm font-semibold">
            {user ? (
              <Link to={homeFor(user.role)} className="rounded-xl bg-white px-4 py-2 text-slate-900">Ir a mi panel</Link>
            ) : (
              <>
                <Link to="/login" className="rounded-xl px-4 py-2 hover:bg-white/10">Iniciar sesión</Link>
                <Link to="/registro" className="rounded-xl bg-white px-4 py-2 text-slate-900 hover:bg-slate-100">Crear cuenta</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <GradientBarHero>
        <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">Pide hoy, recibe en minutos.</h1>
        <p className="mt-5 max-w-xl text-lg text-slate-200">Pizzas, sushi, hamburguesas y más de los comercios de tu zona, con seguimiento paso a paso hasta tu puerta.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to={user ? homeFor(user.role) : '/registro'} className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-500" data-testid="hero-cta">Empezar a pedir</Link>
          <Link to="/login" className="rounded-xl border border-white/40 px-6 py-3 font-semibold hover:bg-white/10">Ya tengo cuenta</Link>
        </div>
      </GradientBarHero>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-extrabold">Una plataforma, cuatro formas de usarla</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-2xl border border-slate-200 p-5">
              <Icon className="h-7 w-7 text-brand-700" aria-hidden="true" />
              <h3 className="mt-3 text-lg font-bold">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>
      <FooterSection />
    </div>
  );
}
