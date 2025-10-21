import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { apiPost } from '../lib/api';
import Logo from '../components/Logo';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);

  const [formErrors, setFormErrors] = useState<{ correo?: string; contrasena?: string }>({});

  const validate = () => {
    const errors: { correo?: string; contrasena?: string } = {};
    if (!email) errors.correo = 'El correo es obligatorio';
    else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(email)) errors.correo = 'Correo inválido';
    if (!password) errors.contrasena = 'La contraseña es obligatoria';
    else if (password.length < 6) errors.contrasena = 'Mínimo 6 caracteres';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    try {
      const res = await apiPost('/auth/login', { correo: email, contrasena: password });
      localStorage.setItem('token', res.access_token ?? '');
      router.push('/dashboard');
    } catch (err: any) {
      setError('Login falló');
    }
  };

  const logoSrc = process.env.NEXT_PUBLIC_LOGO_SRC || '/logo_lab.png';
  const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || 'Laboratorio Franz';
  const [logoOk, setLogoOk] = useState(true);

  return (
    <>
      <Head>
        <title>{`Ingresar | ${process.env.NEXT_PUBLIC_BRAND_NAME || 'Laboratorio Franz'}`}</title>
      </Head>
      <div className="login-grid">
        <section className="login-hero">
          <div className="login-hero-inner">
            {/* Imagen de logo a pantalla completa; oculta si falla la carga */}
            <img
              src={logoSrc}
              alt=""
              aria-hidden
              className="hero-logo-bg"
              onError={() => setLogoOk(false)}
              style={{ display: logoOk ? 'block' : 'none' }}
            />
            {!logoOk && (
              <div className="hero-logo-fallback" aria-hidden>
                <Logo size={120} />
              </div>
            )}
            <div className="hero-caption">
              <div className="brand-title">{brandName}</div>
              <div className="brand-sub">Gestión de laboratorio clínico</div>
            </div>
          </div>
          <div className="hero-waves" aria-hidden />
        </section>
        <section className="login-form-wrap">
          <div className="login-card" style={{ maxWidth: 340 }}>
            <h1 className="login-title">Iniciar sesión</h1>
            <form onSubmit={onSubmit} style={{ maxWidth: 300, margin: '0 auto' }}>
              <Input label="Correo" value={email} onChange={(e) => setEmail(e.target.value)} />
              {formErrors.correo && <Alert type="error">{formErrors.correo}</Alert>}
              <Input label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              {formErrors.contrasena && <Alert type="error">{formErrors.contrasena}</Alert>}
              <Button type="submit">Ingresar</Button>
            </form>
            <p style={{ marginTop: 12 }}>
              ¿Olvidaste tu contraseña?{' '}
              <a className="link" onClick={() => router.push('/recuperar')}>Recuperar contraseña</a>
              {' '}·{' '}
              <a className="link" onClick={() => router.push('/register')}>Crear cuenta</a>
            </p>
            {error && <Alert type="error">Login falló</Alert>}
          </div>
        </section>
      </div>
    </>
  );
}
