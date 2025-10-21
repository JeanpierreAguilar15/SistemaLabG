import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { apiPost } from '../lib/api';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';

export default function Restablecer() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [pass, setPass] = useState('');
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = (router.query.token as string) || '';
    if (t) setToken(t);
  }, [router.query]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOk(null); setError(null);
    try {
      const res = await apiPost('/auth/restablecer', { token, nuevaContrasena: pass });
      setOk(res.mensaje || 'Restablecida');
      setTimeout(() => router.push('/login'), 1200);
    } catch (err: any) {
      setError('No se pudo restablecer la contraseña');
    }
  };

  return (
    <AuthLayout forceIcon title={process.env.NEXT_PUBLIC_BRAND_NAME || 'Laboratorio Franz'}>
      <Head>
        <title>{`Restablecer contraseña | ${process.env.NEXT_PUBLIC_BRAND_NAME || 'Laboratorio Franz'}`}</title>
      </Head>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <h1 style={{marginTop:0}}>Restablecer contraseña</h1>
        <form onSubmit={onSubmit}>
          <Input label="Token" value={token} onChange={(e) => setToken(e.target.value)} />
          <Input label="Nueva contraseña" type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
          <Button type="submit" disabled={!token || pass.length < 6}>Cambiar</Button>
        </form>
        {ok && <Alert type="success">{ok}</Alert>}
        {error && <Alert type="error">{error}</Alert>}
      </div>
    </AuthLayout>
  );
}
