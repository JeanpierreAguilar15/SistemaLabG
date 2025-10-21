import { useEffect, useState } from 'react';
import Head from 'next/head';
import { apiGetAuth } from '../lib/api';
import Layout from '../components/Layout';
import Card from '../components/Card';

export default function Dashboard() {
  const [me, setMe] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGetAuth('/auth/me')
      .then(setMe)
      .catch(() => setError('No autenticado'));
  }, []);
  useEffect(() => {
    if (error) {
      window.location.href = '/login';
    }
  }, [error]);

  return (
    <Layout>
      <Head>
        <title>Panel | LabCare</title>
      </Head>
      <Card max={720}>
        <h1 style={{marginTop:0}}>Panel</h1>
        {me && (
          <div>
            <p>Bienvenido/a, <strong>{me.correo}</strong></p>
            <p>Roles: {(me.roles || []).join(', ') || 'N/A'}</p>
          </div>
        )}
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </Card>
    </Layout>
  );
}
