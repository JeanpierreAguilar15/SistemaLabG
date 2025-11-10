"use client";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PaymentsTable } from '../tables/payments-table';
import { useSessionStore } from '../../lib/session-store';
import { api } from '../../lib/api';
import { showToast } from '../../lib/toast-store';

export type PaymentRow = {
  numero_factura: number;
  descripcion?: string;
  monto_total: number;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  estado: 'PENDIENTE' | 'PAGADO' | 'VENCIDO';
};

export const usePaymentsData = () => {
  const { accessToken } = useSessionStore();
  const [items, setItems] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accessToken) { setItems([]); setLoading(false); return; }
    setLoading(true);
    try{
      const res = await api<{ items: PaymentRow[] }>(`/billing/facturas`, { method: 'GET' }, accessToken);
      setItems(res.items || []);
      setError(null);
    }catch{
      setError('No se pudieron cargar las facturas.');
    }finally{
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { refresh(); }, [refresh]);

  const pay = useCallback(async (numero_factura: number) => {
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
  }, [accessToken]);

  const receipt = useCallback((numero_factura: number) => {
    showToast(`Comprobante para la factura ${numero_factura} aun no disponible.`, { title:'Aviso', variant:'info' });
  }, []);

  const stats = useMemo(() => {
    const pending = items.filter(i => i.estado === 'PENDIENTE');
    const paid = items.filter(i => i.estado === 'PAGADO');
    const total = items.reduce((acc, item)=> acc + Number(item.monto_total || 0), 0);
    const pendingTotal = pending.reduce((acc, item)=> acc + Number(item.monto_total || 0), 0);
    const paidTotal = paid.reduce((acc, item)=> acc + Number(item.monto_total || 0), 0);
    return {
      pendingCount: pending.length,
      pendingTotal,
      paidCount: paid.length,
      paidTotal,
      total,
    };
  }, [items]);

  return { items, loading, error, refresh, pay, receipt, stats };
};

type SectionProps = {
  items: PaymentRow[];
  loading: boolean;
  error: string | null;
  onPay: (numero_factura: number) => void;
  onReceipt: (numero_factura: number) => void;
};

export const PaymentsSection = ({ items, loading, error, onPay, onReceipt }: SectionProps) => {
  if (loading) return <div className="panel" aria-busy="true">Cargando pagos...</div>;
  if (error) return <div className="panel text-[color:var(--danger-fg)]">{error}</div>;
  if (!items.length) return <div className="panel">No hay facturas registradas.</div>;

  return (
    <div className="panel" role="region" aria-label="historial de pagos">
      <div className="panel-heading">Facturas y pagos</div>
      <div className="panel-sub">Revisa el estado de tus pagos pendientes y completados.</div>
      <div className="mt-3 overflow-auto">
        <PaymentsTable items={items} onPay={onPay} onReceipt={onReceipt} />
      </div>
    </div>
  );
};

