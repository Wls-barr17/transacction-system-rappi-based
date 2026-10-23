import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Bike, UserPlus } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/AppButton';
import { useAuth } from '../../context/AuthContext';
import { homeFor } from '../../lib/constants';
import { EMAIL_RE } from '../../lib/format';

export default function Register() {
  const { user, register } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [f, setF] = useState({ name: '', email: loc.state?.email || '', phone: '', password: '', confirm: '' });
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  if (user) return <Navigate to={homeFor(user.role)} replace />;

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));
  const errs = {
    name: f.name.trim().length < 3 ? 'Escribe tu nombre completo' : '',
    email: !EMAIL_RE.test(f.email) ? 'Escribe un correo válido' : '',
    phone: f.phone && !/^\d{7,10}$/.test(f.phone) ? 'Usa solo números (7 a 10 dígitos)' : '',
    password: f.password.length < 8 ? 'Mínimo 8 caracteres' : !/\d/.test(f.password) ? 'Incluye al menos un número' : '',
    confirm: f.confirm !== f.password ? 'Las contraseñas no coinciden' : '',
  };
  const show = (k) => (touched[k] || f[k]) && errs[k];

  const submit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true, password: true, confirm: true });
    if (Object.values(errs).some(Boolean)) return;
    setLoading(true);
    setError('');
    try {
      const u = await register({ name: f.name.trim(), email: f.email, phone: f.phone, password: f.password });
      nav(homeFor(u.role), { replace: true });
    } catch (ex) {
      setError(ex.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <form onSubmit={submit} noValidate className="w-full max-w-md" data-testid="register-form">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 font-display text-xl font-extrabold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-700 text-white"><Bike className="h-5 w-5" aria-hidden="true" /></span>DomiFlow
        </Link>
        <h1 className="text-3xl font-extrabold">Crea tu cuenta</h1>
        <p className="mt-1 text-slate-600">Tu cuenta es de cliente. Si eres comercio o repartidor, el administrador te asigna el rol.</p>
        {error && (
          <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{error}
          </div>
        )}
        <div className="mt-5 space-y-4">
          <Input label="Nombre completo" value={f.name} onChange={set('name')} onBlur={blur('name')} error={show('name')} autoComplete="name" data-testid="register-name" />
          <Input label="Correo electrónico" type="email" value={f.email} onChange={set('email')} onBlur={blur('email')} error={show('email')} autoComplete="email" data-testid="register-email" />
          <Input label="Teléfono (opcional)" inputMode="numeric" value={f.phone} onChange={set('phone')} onBlur={blur('phone')} error={show('phone')} autoComplete="tel" data-testid="register-phone" />
          <Input label="Contraseña" type="password" value={f.password} onChange={set('password')} onBlur={blur('password')} error={show('password')} autoComplete="new-password" hint="Mínimo 8 caracteres y un número" data-testid="register-password" />
          <Input label="Confirmar contraseña" type="password" value={f.confirm} onChange={set('confirm')} onBlur={blur('confirm')} error={show('confirm')} autoComplete="new-password" data-testid="register-confirm" />
        </div>
        <Button type="submit" size="lg" loading={loading} icon={UserPlus} className="mt-6 w-full" data-testid="register-submit">Crear cuenta</Button>
        <p className="mt-4 text-center text-sm">¿Ya tienes cuenta? <Link to="/login" className="font-bold text-brand-700 underline">Inicia sesión</Link></p>
      </form>
    </div>
  );
}
