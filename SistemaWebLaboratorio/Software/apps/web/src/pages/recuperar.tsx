import { useState } from 'react';
import Head from 'next/head';
import { apiPost } from '../lib/api';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';

export default function Recuperar() {
  const [correo, setCorreo] = useState('admin@demo.com');
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null); setToken(null); setError(null);
    try {
      const res = await apiPost('/auth/recuperar', { correo });
      setMensaje(res.mensaje || 'Solicitud enviada');
      if (res.token) setToken(res.token);
    } catch (err: any) {
      setError('No se pudo solicitar la recuperación');
    }
  };

  return (
    <AuthLayout forceIcon title={process.env.NEXT_PUBLIC_BRAND_NAME || 'Laboratorio Franz'}>
      <Head>
        <title>{`Recuperar contraseña | ${process.env.NEXT_PUBLIC_BRAND_NAME || 'Laboratorio Franz'}`}</title>
      </Head>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <h1 style={{marginTop:0}}>Recuperar contraseña</h1>
        <form onSubmit={onSubmit}>
          <Input label="Correo" value={correo} onChange={(e) => setCorreo(e.target.value)} />
          <Button type="submit">Enviar enlace</Button>
        </form>
        {mensaje && <Alert type="info">{mensaje}</Alert>}
        {token && (
          <Alert type="info">Token (solo desarrollo): <code>{token}</code></Alert>
        )}
        {error && <Alert type="error">No se pudo solicitar la recuperación</Alert>}
      </div>
    </AuthLayout>
  );
}
