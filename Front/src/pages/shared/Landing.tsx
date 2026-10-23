import { useNavigate } from 'react-router-dom';
import { Bike, ChefHat, Facebook, Instagram, ShieldCheck, ShoppingBag, Youtube } from 'lucide-react';
import { Component as GradientBarHero } from '@/components/ui/gradient-bar-hero-section';
import AppFooter from '@/components/layout/AppFooter';
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
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <GradientBarHero
        brand="DomiFlow"
        navLinks={[
          { label: 'Roles', href: '#roles' },
          { label: 'Iniciar sesión', href: '/login' },
        ]}
        onNavigate={(href) => nav(href)}
        navCta={
          user
            ? { label: 'Ir a mi panel', onClick: () => nav(homeFor(user.role)) }
            : { label: 'Crear cuenta', onClick: () => nav('/registro') }
        }
        badgeText="Comercios y repartidores de tu zona"
        badgeCount=""
        titleTop="Tu comida favorita,"
        titleBottom="hasta tu puerta."
        subtitleLines={['Pide a los comercios de tu zona y sigue cada paso.', 'Crea tu cuenta y haz tu primer pedido hoy.']}
        emailPlaceholder="Tu correo electrónico"
        submitLabel="Crear mi cuenta"
        onSubmitEmail={(email) => nav(user ? homeFor(user.role) : '/registro', { state: { email } })}
        socials={[
          { icon: Instagram, href: '#', label: 'Instagram' },
          { icon: Facebook, href: '#', label: 'Facebook' },
          { icon: Youtube, href: '#', label: 'YouTube' },
        ]}
      />

      <section id="roles" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-extrabold">Una plataforma, cuatro formas de usarla</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-2xl border border-slate-200 p-5">
              <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
              <h3 className="mt-3 text-lg font-bold">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>
      <AppFooter />
    </div>
  );
}
