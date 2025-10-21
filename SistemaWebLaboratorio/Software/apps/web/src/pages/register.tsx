import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import AuthSplitLayout from '../components/AuthLayout' /* fallback simple header */;
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';
import { apiPost } from '../lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [correo, setCorreo] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [cedula, setCedula] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const validate = () => {
    if (!correo.match(/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/)) return 'Correo inválido';
    if (contrasena.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    if (contrasena !== confirmar) return 'Las contraseñas no coinciden';
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setOk(null);
    const v = validate();
    if (v) { setError(v); return; }
    try {
      const res = await apiPost('/auth/register', { correo, contrasena, nombre, apellido, cedula, telefono, fecha_nacimiento: fechaNacimiento });
      if (res?.access_token) {
        localStorage.setItem('token', res.access_token);
        setOk('Cuenta creada correctamente');
        router.push('/dashboard');
      } else {
        setOk('Cuenta creada');
      }
    } catch (err: any) {
      setError('No se pudo registrar. Inténtalo nuevamente.');
    }
  };

  return (
    <>
      <Head>
        <title>{`Crear cuenta | ${process.env.NEXT_PUBLIC_BRAND_NAME || 'Laboratorio Franz'}`}</title>
      </Head>
      <div className="login-grid">
        <section className="login-hero">
          <div className="login-hero-inner">
            <div className="hero-caption">
              <div className="brand-title">{process.env.NEXT_PUBLIC_BRAND_NAME || 'Laboratorio Franz'}</div>
              <div className="brand-sub">Crea tu cuenta para continuar</div>
            </div>
          </div>
          <div className="hero-waves" aria-hidden />
        </section>
        <section className="login-form-wrap">
          <div className="login-card">
            <h1 className="login-title">Crear cuenta</h1>
            <form onSubmit={onSubmit} style={{ maxWidth: 420, margin: '0 auto' }}>
              <Input label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
              <Input label="Apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} />
              <Input label="Correo" value={correo} onChange={(e) => setCorreo(e.target.value)} />
              <Input label="Cédula / DNI" value={cedula} onChange={(e) => setCedula(e.target.value)} />
              <Input label="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
              <Input label="Fecha de nacimiento" type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} />
              <Input label="Contraseña" type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
              <Input label="Confirmar contraseña" type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
              <Button type="submit">Registrarme</Button>
            </form>
            {ok && <Alert type="success">{ok}</Alert>}
            {error && <Alert type="error">{error}</Alert>}
          </div>
        </section>
      </div>
    </>
  );
}
