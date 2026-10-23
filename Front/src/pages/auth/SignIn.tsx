import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { SignInPage, type Testimonial } from '@/components/ui/sign-in';
import { EMAIL_RE } from '@/lib/format';
import { useAuth } from '../../context/AuthContext';
import { homeFor } from '../../lib/constants';

const DEMOS: [string, string][] = [
  ['Cliente', 'cliente@demo.com'],
  ['Comercio', 'comercio@demo.com'],
  ['Repartidor', 'repartidor@demo.com'],
  ['Admin', 'admin@demo.com'],
];

// Textos de ejemplo: cámbialos por testimonios reales cuando los tengas
const TESTIMONIALS: Testimonial[] = [
  { avatarSrc: 'https://cdn.21st.dev/assets/mirror/9f/9f797e4acee1a4de4f9b4c3aa1cc4e89d7c9efd5dbff1c463d88374ed601d719.jpg', name: 'Sara Chen', handle: '@sarapide', text: 'Ver cada paso del pedido en tiempo real me da mucha tranquilidad.' },
  { avatarSrc: 'https://cdn.21st.dev/assets/mirror/8d/8d9a61a581c43fe2088f221b7692c95db4b3ad5c0da0c856400c0e5acdcdcea8.jpg', name: 'Marcos Jiménez', handle: '@marcoscomercio', text: 'Controlo mi inventario y los pedidos desde un solo panel.' },
  { avatarSrc: 'https://cdn.21st.dev/assets/mirror/a6/a634d4f02fe5b77804943c1d74b8d70e35ffe26454e0e9af9717432a2c72bfde.jpg', name: 'David Martínez', handle: '@davidreparte', text: 'Cambiar el estado de una entrega me toma un par de clics.' },
];

export default function SignIn() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  // Validación en tiempo real
  const errors = {
    email: values.email && !EMAIL_RE.test(values.email)
      ? 'Escribe un correo válido, por ejemplo nombre@correo.com'
      : touched && !values.email ? 'El correo es obligatorio' : '',
    password: values.password && values.password.length < 8
      ? 'La contraseña tiene mínimo 8 caracteres'
      : touched && !values.password ? 'La contraseña es obligatoria' : '',
  };

  const onSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched(true);
    if (!EMAIL_RE.test(values.email) || values.password.length < 8) return;
    setLoading(true);
    setError('');
    try {
      const u = await login(values.email, values.password);
      nav((loc.state as { from?: string } | null)?.from || homeFor(u.role), { replace: true });
    } catch (ex) {
      setError((ex as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignInPage
      title={<span className="font-light tracking-tighter">Inicia sesión</span>}
      description="Entra para pedir, atender o repartir."
      heroImageSrc="https://cdn.21st.dev/assets/mirror/ec/ecff1664e7fc3185d0e947571f984ea5fa3de9580fb0e73a03cd9c9b3461cb09.jpg"
      testimonials={TESTIMONIALS}
      labels={{
        email: 'Correo electrónico', emailPlaceholder: 'Escribe tu correo',
        password: 'Contraseña', passwordPlaceholder: 'Escribe tu contraseña',
        showPassword: 'Mostrar contraseña', hidePassword: 'Ocultar contraseña',
        submit: 'Entrar', newHere: '¿No tienes cuenta?', create: 'Regístrate',
      }}
      values={values}
      onValuesChange={setValues}
      errors={errors}
      error={error}
      loading={loading}
      showRememberMe={false}
      onSignIn={onSignIn}
      onCreateAccount={() => nav('/registro')}
      footerSlot={
        <div className="rounded-2xl border border-dashed border-border p-4">
          <p className="text-sm font-semibold">Cuentas de prueba (contraseña: Demo1234)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DEMOS.map(([label, email]) => (
              <button key={email} type="button" onClick={() => setValues({ email, password: 'Demo1234' })}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold hover:bg-secondary">
                {label}
              </button>
            ))}
          </div>
        </div>
      }
    />
  );
}
