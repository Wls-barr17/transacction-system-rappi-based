import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Bike, Eye, EyeOff, LogIn } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { homeFor } from '../../lib/constants';
import { EMAIL_RE } from '../../lib/utils';

const DEMOS = [['Cliente', 'cliente@demo.com'], ['Comercio', 'comercio@demo.com'], ['Repartidor', 'repartidor@demo.com'], ['Admin', 'admin@demo.com']];

// Inspirado en "sign-in" de 21st.dev
export default function SignIn() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  // Validación en tiempo real
  const emailErr = (touched.email || email) && !EMAIL_RE.test(email) && email.length > 0 ? 'Escribe un correo válido, por ejemplo nombre@correo.com' : touched.email && !email ? 'El correo es obligatorio' : '';
  const passErr = (touched.password || password) && password.length < 8 && (password.length > 0 || touched.password) ? 'La contraseña tiene mínimo 8 caracteres' : '';

  const submit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!EMAIL_RE.test(email) || password.length < 8) return;
    setLoading(true);
    setError('');
    try {
      const u = await login(email, password);
      nav(loc.state?.from || homeFor(u.role), { replace: true });
    } catch (ex) {
      setError(ex.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-10">
        <form onSubmit={submit} noValidate className="w-full max-w-sm" data-testid="signin-form">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 font-display text-xl font-extrabold">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-700 text-white"><Bike className="h-5 w-5" aria-hidden="true" /></span>DomiFlow
          </Link>
          <h1 className="text-3xl font-extrabold">Inicia sesión</h1>
          <p className="mt-1 text-slate-600">Entra para pedir, atender o repartir.</p>

          {error && (
            <div role="alert" data-testid="signin-error" className="mt-4 flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{error}
            </div>
          )}

          <div className="mt-5 space-y-4">
            <Input label="Correo electrónico" type="email" autoComplete="email" value={email} error={emailErr}
              onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, email: true }))} data-testid="signin-email" />
            <Input label="Contraseña" type={show ? 'text' : 'password'} autoComplete="current-password" value={password} error={passErr}
              onChange={(e) => setPassword(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, password: true }))} data-testid="signin-password"
              right={<button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="rounded-full p-1.5 text-slate-600 hover:bg-slate-100">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>} />
          </div>

          <Button type="submit" size="lg" loading={loading} icon={LogIn} className="mt-6 w-full" data-testid="signin-submit">Entrar</Button>
          <p className="mt-4 text-center text-sm text-slate-700">¿No tienes cuenta? <Link to="/registro" className="font-bold text-brand-700 underline">Regístrate</Link></p>

          <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-4">
            <p className="text-sm font-semibold">Cuentas de prueba (contraseña: Demo1234)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DEMOS.map(([label, mail]) => (
                <button key={mail} type="button" onClick={() => { setEmail(mail); setPassword('Demo1234'); }}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold hover:bg-slate-50">{label}</button>
              ))}
            </div>
          </div>
        </form>
      </div>
      <div className="relative hidden overflow-hidden bg-slate-950 lg:block" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,.55),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(244,63,94,.45),transparent_50%)]" />
        <div className="relative flex h-full flex-col justify-end p-12 text-white">
          <p className="font-display text-5xl font-extrabold leading-tight">Cada pedido,<br />un paso a la vez.</p>
        </div>
      </div>
    </div>
  );
}
