import React, { useState } from 'react';
import { Github, Instagram, Linkedin, Menu, X, type LucideIcon } from 'lucide-react';

// ---------- Tipos ----------
type AvatarProps = { imageSrc: string; delay: number };
type NavLink = { label: string; href: string };
type Social = { icon: LucideIcon; href: string; label: string };

export interface GradientBarHeroProps {
  brand?: string;
  navLinks?: NavLink[];
  navCta?: { label: string; onClick: () => void };
  onNavigate?: (href: string) => void;
  avatars?: string[];
  badgeCount?: string;
  badgeText?: string;
  titleTop?: string;
  titleBottom?: string;
  subtitleLines?: string[];
  emailPlaceholder?: string;
  submitLabel?: string;
  successText?: string;
  /** Si lo pasas, se llama con el correo; si no, se simula el envío como en el original. */
  onSubmitEmail?: (email: string) => void;
  socials?: Social[];
}

const DEFAULT_AVATARS = [
  'https://cdn.21st.dev/assets/mirror/ab/ab0f647dba1091b070028d8de5ab3cc388a593a06d99153be51753ea9b49fc22.jpg',
  'https://cdn.21st.dev/assets/mirror/9f/9fd3d91f1e05859a3508c169fbb76247a2b14bccc89d087a3ef85dc7261cde44.jpg',
  'https://cdn.21st.dev/assets/mirror/44/44202b1e265b1b96e590728d05f064b1153b415c1093c7149cd2ab7dee0b6514.jpg',
  'https://cdn.21st.dev/assets/mirror/a2/a2e0a98aefcafd49b7824cb6291a81a99638ccbe510d9aff6142faf023f5bbe2.jpg',
];

const Avatar: React.FC<AvatarProps> = ({ imageSrc, delay }) => (
  <div
    className="relative h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 rounded-full overflow-hidden border-2 border-gray-700 shadow-lg animate-fadeIn"
    style={{ animationDelay: `${delay}ms` }}
  >
    <img src={imageSrc} alt="" className="h-full w-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
  </div>
);

const TrustElements: React.FC<{ avatars: string[]; count?: string; text: string }> = ({ avatars, count, text }) => (
  <div className="inline-flex items-center space-x-3 bg-gray-900/60 backdrop-blur-sm rounded-full py-2 px-3 sm:py-2 sm:px-4 text-xs sm:text-sm">
    <div className="flex -space-x-2 sm:-space-x-3">
      {avatars.map((avatar, index) => (
        <Avatar key={index} imageSrc={avatar} delay={index * 200} />
      ))}
    </div>
    <p className="text-white animate-fadeIn whitespace-nowrap font-space" style={{ animationDelay: '800ms' }}>
      {count && <span className="text-white font-semibold">{count} </span>}
      {text}
    </p>
  </div>
);

const WaitlistForm: React.FC<{
  placeholder: string;
  submitLabel: string;
  successText: string;
  onSubmitEmail?: (email: string) => void;
}> = ({ placeholder, submitLabel, successText, onSubmitEmail }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    if (onSubmitEmail) {
      setIsSubmitting(true); // evita doble clic
      onSubmitEmail(email);
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setEmail('');
      setTimeout(() => setIsSubmitted(false), 3000);
    }, 1500);
  };

  return (
    <div className="relative z-10 w-full">
      {!isSubmitted ? (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            autoComplete="email"
            className="flex-1 px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-gray-900/60 border border-gray-700 focus:border-white outline-none text-white placeholder:text-gray-400 text-sm sm:text-base shadow-[0_0_15px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-all duration-300 font-space"
            required
            data-testid="hero-email"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            data-testid="hero-submit"
            className={`px-6 sm:px-8 py-3 sm:py-4 rounded-full transition-all duration-300 transform hover:scale-105 whitespace-nowrap text-sm sm:text-base font-space ${
              isSubmitting ? 'bg-gray-600 text-gray-300 cursor-not-allowed' : 'bg-white hover:bg-gray-100 text-black'
            }`}
          >
            {isSubmitting ? (
              <div role="status" aria-label="Enviando" className="mx-auto h-4 w-4 sm:h-5 sm:w-5 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
            ) : (
              submitLabel
            )}
          </button>
        </form>
      ) : (
        <div role="status" className="bg-green-500/20 border border-green-500/30 text-green-300 rounded-full px-6 sm:px-8 py-3 sm:py-4 text-center animate-fadeIn text-sm sm:text-base font-space">
          {successText}
        </div>
      )}
    </div>
  );
};

const GradientBars: React.FC = () => {
  const numBars = 15;

  const calculateHeight = (index: number, total: number) => {
    const position = index / (total - 1);
    const maxHeight = 100;
    const minHeight = 30;
    const distanceFromCenter = Math.abs(position - 0.5);
    const heightPercentage = Math.pow(distanceFromCenter * 2, 1.2);
    return minHeight + (maxHeight - minHeight) * heightPercentage;
  };

  return (
    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div
        className="hero-bars flex h-full"
        style={{ width: '100%', transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
      >
        {Array.from({ length: numBars }).map((_, index) => {
          const h = calculateHeight(index, numBars) / 100;
          return (
            <div
              key={index}
              style={
                {
                  flex: '1 0 calc(100% / 15)',
                  maxWidth: 'calc(100% / 15)',
                  height: '100%',
                  background: 'linear-gradient(to top, rgb(255, 60, 0), transparent)',
                  '--h': h,
                  transform: `scaleY(${h})`,
                  transformOrigin: 'bottom',
                  animation: 'pulseBar 2s ease-in-out infinite alternate',
                  animationDelay: `${index * 0.1}s`,
                  outline: '1px solid rgba(0, 0, 0, 0)',
                  boxSizing: 'border-box',
                } as React.CSSProperties
              }
            />
          );
        })}
      </div>
    </div>
  );
};

const Navbar: React.FC<{
  brand: string;
  links: NavLink[];
  cta?: { label: string; onClick: () => void };
  onNavigate?: (href: string) => void;
}> = ({ brand, links, cta, onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const go = (e: React.MouseEvent, href: string) => {
    if (href.startsWith('/') && onNavigate) {
      e.preventDefault();
      setIsMenuOpen(false);
      onNavigate(href);
    }
  };

  return (
    <nav aria-label="Principal" className="fixed top-0 left-0 right-0 z-50 bg-transparent py-6 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <span className="text-white font-bold text-xl tracking-tighter font-space">{brand}</span>

          <div className="hidden md:flex items-center space-x-8">
            {links.map((l) => (
              <a key={l.label} href={l.href} onClick={(e) => go(e, l.href)} className="text-gray-300 hover:text-white transition-colors duration-300 font-space">
                {l.label}
              </a>
            ))}
            {cta && (
              <button onClick={cta.onClick} className="bg-white hover:bg-gray-100 text-black px-5 py-2 rounded-full transition-all duration-300 transform hover:scale-105 font-space">
                {cta.label}
              </button>
            )}
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white" aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={isMenuOpen}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden mt-4 bg-gray-900 bg-opacity-95 backdrop-blur-sm rounded-lg p-4 animate-fadeIn">
            <div className="flex flex-col space-y-4">
              {links.map((l) => (
                <a key={l.label} href={l.href} onClick={(e) => go(e, l.href)} className="text-gray-300 hover:text-white transition-colors duration-300 py-2 font-space">
                  {l.label}
                </a>
              ))}
              {cta && (
                <button onClick={cta.onClick} className="bg-white hover:bg-gray-100 text-black px-5 py-2 rounded-full transition-all duration-300 w-full font-space">
                  {cta.label}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export const Component: React.FC<GradientBarHeroProps> = ({
  brand = 'Preplex',
  navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Vision', href: '#vision' },
    { label: 'Press', href: '#press' },
    { label: 'Contact', href: '#contact' },
  ],
  navCta = { label: 'Join The Waitlist', onClick: () => {} },
  onNavigate,
  avatars = DEFAULT_AVATARS,
  badgeCount = '2.4K',
  badgeText = 'currently on the waitlist',
  titleTop = "Redefining What's Possible,",
  titleBottom = 'One Experience at a Time.',
  subtitleLines = ['Be the first to know when we launch.', 'Join the waitlist and get exclusive early access.'],
  emailPlaceholder = 'Enter Your Email',
  submitLabel = 'Join The Waitlist',
  successText = "Thanks! We'll notify you when we launch.",
  onSubmitEmail,
  socials = [
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Github, href: '#', label: 'GitHub' },
  ],
}) => {
  return (
    <section className="relative min-h-screen flex flex-col items-center px-6 sm:px-8 md:px-12 overflow-hidden" data-testid="hero">
      <div className="absolute inset-0 bg-gray-950"></div>
      <GradientBars />
      <Navbar brand={brand} links={navLinks} cta={navCta} onNavigate={onNavigate} />

      <div className="relative z-10 text-center w-full max-w-4xl mx-auto flex flex-col items-center justify-center min-h-screen py-8 sm:py-16">
        <div className="mb-6 sm:mb-8">
          <TrustElements avatars={avatars} count={badgeCount} text={badgeText} />
        </div>

        <h1 className="w-full text-white leading-tight tracking-tight mb-6 sm:mb-8 animate-fadeIn px-4">
          <span className="block font-inter font-medium text-[clamp(1.5rem,6vw,3.75rem)] whitespace-nowrap">{titleTop}</span>
          <span className="block font-instrument italic text-[clamp(1.5rem,6vw,3.75rem)] whitespace-nowrap">{titleBottom}</span>
        </h1>

        <div className="mb-6 sm:mb-10 px-4">
          {subtitleLines.map((line, i) => (
            <p key={i} className={`text-[clamp(1rem,3vw,1.5rem)] text-gray-400 leading-relaxed animate-fadeIn font-space ${i === 0 ? 'animation-delay-200' : 'animation-delay-300'}`}>
              {line}
            </p>
          ))}
        </div>

        <div className="w-full max-w-2xl mb-6 sm:mb-8 px-4">
          <WaitlistForm placeholder={emailPlaceholder} submitLabel={submitLabel} successText={successText} onSubmitEmail={onSubmitEmail} />
        </div>

        <div className="flex justify-center space-x-6">
          {socials.map(({ icon: Icon, href, label }) => (
            <a key={label} href={href} aria-label={label} className="text-gray-400 hover:text-gray-200 transition-colors duration-300">
              <Icon size={20} className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export { Component as GradientBarHero };
