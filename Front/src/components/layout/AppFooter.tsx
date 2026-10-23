import { Bike, Facebook, Instagram, Youtube } from 'lucide-react';
import { Footer, type FooterSectionData } from '@/components/ui/footer-section';

// Solo enlaces a páginas que existen en la app
const SECTIONS: FooterSectionData[] = [
  {
    label: 'Plataforma',
    links: [
      { title: 'Para clientes', href: '/registro' },
      { title: 'Para comercios', href: '/login' },
      { title: 'Para repartidores', href: '/login' },
    ],
  },
  {
    label: 'Cuenta',
    links: [
      { title: 'Iniciar sesión', href: '/login' },
      { title: 'Crear cuenta', href: '/registro' },
      { title: 'Mi perfil', href: '/perfil' },
    ],
  },
  {
    label: 'Redes sociales',
    links: [
      { title: 'Instagram', href: '#', icon: Instagram },
      { title: 'Facebook', href: '#', icon: Facebook },
      { title: 'YouTube', href: '#', icon: Youtube },
    ],
  },
];

export default function AppFooter() {
  return (
    <Footer
      brand="DomiFlow"
      logo={
        <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Bike className="size-5" aria-hidden="true" />
        </span>
      }
      sections={SECTIONS}
      className="mt-12"
    />
  );
}
