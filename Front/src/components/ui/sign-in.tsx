import React, { useId, useState } from 'react';
import { AlertTriangle, Eye, EyeOff, Loader2 } from 'lucide-react';

// --- HELPER COMPONENTS (ICONS) ---

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
    </svg>
);

// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

const DEFAULT_LABELS = {
  email: 'Email Address',
  emailPlaceholder: 'Enter your email address',
  password: 'Password',
  passwordPlaceholder: 'Enter your password',
  showPassword: 'Show password',
  hidePassword: 'Hide password',
  remember: 'Keep me signed in',
  reset: 'Reset password',
  submit: 'Sign In',
  or: 'Or continue with',
  google: 'Continue with Google',
  newHere: 'New to our platform?',
  create: 'Create Account',
};

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
  /** Textos (para traducir). */
  labels?: Partial<typeof DEFAULT_LABELS>;
  /** Estado controlado opcional (permite validar en tiempo real). */
  values?: { email: string; password: string };
  onValuesChange?: (values: { email: string; password: string }) => void;
  errors?: { email?: string; password?: string };
  /** Error general (ej. credenciales incorrectas). */
  error?: string;
  /** Deshabilita el botón y muestra spinner (evita doble clic). */
  loading?: boolean;
  showRememberMe?: boolean;
  /** Contenido extra bajo el formulario (ej. cuentas de prueba). */
  footerSlot?: React.ReactNode;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children, invalid }: { children: React.ReactNode; invalid?: boolean }) => (
  <div className={`rounded-2xl border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-primary/70 focus-within:bg-primary/5 ${invalid ? 'border-destructive' : 'border-border'}`}>
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial, delay: string }) => (
  <div className={`animate-testimonial ${delay} flex items-start gap-3 rounded-3xl bg-slate-950/60 text-white backdrop-blur-xl border border-white/10 p-5 w-64`}>
    <img src={testimonial.avatarSrc} className="h-10 w-10 object-cover rounded-2xl" alt="" />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-medium">{testimonial.name}</p>
      <p className="text-white/70">{testimonial.handle}</p>
      <p className="mt-1 text-white/90">{testimonial.text}</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light text-foreground tracking-tighter">Welcome</span>,
  description = "Access your account and continue your journey with us",
  heroImageSrc,
  testimonials = [],
  onSignIn,
  onGoogleSignIn,
  onResetPassword,
  onCreateAccount,
  labels,
  values,
  onValuesChange,
  errors,
  error,
  loading = false,
  showRememberMe = true,
  footerSlot,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const t = { ...DEFAULT_LABELS, ...labels };
  const uid = useId();
  const controlled = !!values && !!onValuesChange;

  const field = (name: 'email' | 'password') =>
    controlled
      ? { value: values![name], onChange: (e: React.ChangeEvent<HTMLInputElement>) => onValuesChange!({ ...values!, [name]: e.target.value }) }
      : {};

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row font-geist w-full bg-background text-foreground">
      {/* Left column: sign-in form */}
      <section className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">{title}</h1>
            <p className="animate-element animate-delay-200 text-muted-foreground">{description}</p>

            {error && (
              <div role="alert" data-testid="signin-error" className="flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{error}
              </div>
            )}

            <form className="space-y-5" onSubmit={onSignIn} noValidate data-testid="signin-form">
              <div className="animate-element animate-delay-300">
                <label htmlFor={`${uid}-email`} className="text-sm font-medium text-muted-foreground">{t.email}</label>
                <GlassInputWrapper invalid={!!errors?.email}>
                  <input id={`${uid}-email`} name="email" type="email" autoComplete="email" placeholder={t.emailPlaceholder}
                    aria-invalid={!!errors?.email} aria-describedby={errors?.email ? `${uid}-email-err` : undefined}
                    data-testid="signin-email" className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none" {...field('email')} />
                </GlassInputWrapper>
                {errors?.email && <p id={`${uid}-email-err`} role="alert" className="mt-1 text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="animate-element animate-delay-400">
                <label htmlFor={`${uid}-pass`} className="text-sm font-medium text-muted-foreground">{t.password}</label>
                <GlassInputWrapper invalid={!!errors?.password}>
                  <div className="relative">
                    <input id={`${uid}-pass`} name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder={t.passwordPlaceholder}
                      aria-invalid={!!errors?.password} aria-describedby={errors?.password ? `${uid}-pass-err` : undefined}
                      data-testid="signin-password" className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none" {...field('password')} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? t.hidePassword : t.showPassword} className="absolute inset-y-0 right-3 flex items-center">
                      {showPassword ? <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /> : <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />}
                    </button>
                  </div>
                </GlassInputWrapper>
                {errors?.password && <p id={`${uid}-pass-err`} role="alert" className="mt-1 text-sm text-destructive">{errors.password}</p>}
              </div>

              {(showRememberMe || onResetPassword) && (
                <div className="animate-element animate-delay-500 flex items-center justify-between text-sm">
                  {showRememberMe ? (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" name="rememberMe" className="custom-checkbox" />
                      <span className="text-foreground/90">{t.remember}</span>
                    </label>
                  ) : <span />}
                  {onResetPassword && (
                    <a href="#" onClick={(e) => { e.preventDefault(); onResetPassword(); }} className="hover:underline text-primary transition-colors">{t.reset}</a>
                  )}
                </div>
              )}

              <button type="submit" disabled={loading} aria-busy={loading} data-testid="signin-submit"
                className="animate-element animate-delay-600 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:opacity-70">
                {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {t.submit}
              </button>
            </form>

            {onGoogleSignIn && (
              <>
                <div className="animate-element animate-delay-700 relative flex items-center justify-center">
                  <span className="w-full border-t border-border"></span>
                  <span className="px-4 text-sm text-muted-foreground bg-background absolute">{t.or}</span>
                </div>
                <button onClick={onGoogleSignIn} className="animate-element animate-delay-800 w-full flex items-center justify-center gap-3 border border-border rounded-2xl py-4 hover:bg-secondary transition-colors">
                  <GoogleIcon />
                  {t.google}
                </button>
              </>
            )}

            {onCreateAccount && (
              <p className="animate-element animate-delay-900 text-center text-sm text-muted-foreground">
                {t.newHere} <a href="#" onClick={(e) => { e.preventDefault(); onCreateAccount(); }} className="font-semibold text-primary hover:underline transition-colors">{t.create}</a>
              </p>
            )}

            {footerSlot}
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4" aria-hidden="true">
          <div className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center" style={{ backgroundImage: `url(${heroImageSrc})` }}></div>
          {testimonials.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
              <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-1000" />
              {testimonials[1] && <div className="hidden xl:flex"><TestimonialCard testimonial={testimonials[1]} delay="animate-delay-1200" /></div>}
              {testimonials[2] && <div className="hidden 2xl:flex"><TestimonialCard testimonial={testimonials[2]} delay="animate-delay-1400" /></div>}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
