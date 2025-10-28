"use client";
import { useEffect, useState } from 'react';
import { PaymentsTable } from '../tables/payments-table';
import { useSessionStore } from '../../lib/session-store';
import { api } from '../../lib/api';
import { showToast } from '../../lib/toast-store';

type PaymentRow = {
  numero_factura: number;
  descripcion?: string;
  monto_total: number;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  estado: 'PENDIENTE' | 'PAGADO' | 'VENCIDO';
};

export const PaymentsSection = () => {
  const { accessToken } = useSessionStore();
  const [items, setItems] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleFetch = async () => {
      if (!accessToken) { setLoading(false); setError('Inicia sesiÃ³n para ver pagos.'); return; }
      try {
        setLoading(true);
        const res = await api<{ items: PaymentRow[] }>(`/billing/facturas`, { method: 'GET' }, accessToken);
        setItems(res.items || []);
      } catch {
        setError('No se pudieron cargar las facturas.');
      } finally {
        setLoading(false);
      }
    };
    handleFetch();
  }, [accessToken]);

  const handlePay = async (numero_factura: number) => {
    if (!accessToken) return;
    try {
      const res = await api<{ referencia: string; url_pasarela: string }>(`/billing/pagar`, {
        method: 'POST',
        body: JSON.stringify({ numero_factura }),
      }, accessToken);
      if (res?.url_pasarela) window.open(res.url_pasarela, '_blank', 'noopener');
    } catch {
      showToast('No fue posible iniciar el pago.', { title:'Error', variant:'error' });
    }
  };

  const handleReceipt = (numero_factura: number) => {
    // Endpoint de comprobante no implementado todavÃ­a en backend
    alert(`Comprobante para la factura ${numero_factura} aÃºn no disponible.`);
  };

  if (loading) return <div className="card" aria-busy="true">Cargando pagosâ€¦</div>;
  if (error) return <div className="card text-[color:var(--danger-fg)]">{error}</div>;
  if (!items.length) return <div className="card">No hay facturas registradas.</div>;

  return (
    <PaymentsTable items={items} onPay={handlePay} onReceipt={handleReceipt} />
  );
};


