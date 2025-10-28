"use client";
import { StatusBadge } from '../ui/status-badge';
import type { StatusKind } from '../../app/design/tokens';

export type PaymentItem = {
  numero_factura: number;
  descripcion?: string;
  monto_total: number;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  estado: 'PENDIENTE' | 'PAGADO' | 'VENCIDO';
};

type Props = {
  items: PaymentItem[];
  onPay?: (numero_factura: number) => void;
  onReceipt?: (numero_factura: number) => void;
};

export function PaymentsTable({ items, onPay, onReceipt }: Props){
  const toStatus = (e: PaymentItem['estado']): StatusKind => (e === 'PAGADO' ? 'pagado' : e === 'VENCIDO' ? 'vencido' : 'pendiente');
  return (
    <div className="card" role="region" aria-label="historial de pagos">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th scope="col" className="text-left font-semibold text-sm border-b border-border-soft p-2">ID Factura</th>
            <th scope="col" className="text-left font-semibold text-sm border-b border-border-soft p-2">Descripcion</th>
            <th scope="col" className="text-left font-semibold text-sm border-b border-border-soft p-2">Monto</th>
            <th scope="col" className="text-left font-semibold text-sm border-b border-border-soft p-2">Emision</th>
            <th scope="col" className="text-left font-semibold text-sm border-b border-border-soft p-2">Vencimiento</th>
            <th scope="col" className="text-left font-semibold text-sm border-b border-border-soft p-2">Estado</th>
            <th scope="col" className="text-left font-semibold text-sm border-b border-border-soft p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((f) => (
            <tr key={f.numero_factura} className="align-top">
              <td className="border-b border-border-soft p-2">{f.numero_factura}</td>
              <td className="border-b border-border-soft p-2">{f.descripcion ?? '-'}</td>
              <td className="border-b border-border-soft p-2">${f.monto_total.toFixed(2)}</td>
              <td className="border-b border-border-soft p-2">{f.fecha_emision}</td>
              <td className="border-b border-border-soft p-2">{f.fecha_vencimiento ?? '-'}</td>
              <td className="border-b border-border-soft p-2"><StatusBadge status={toStatus(f.estado)} /></td>
              <td className="border-b border-border-soft p-2">
                <div className="flex gap-2">
                  {f.estado !== 'PAGADO' && (<button className="icon" aria-label="Pagar" onClick={() => onPay?.(f.numero_factura)}>Pagar</button>)}
                  {f.estado === 'PAGADO' && (<button className="icon" aria-label="Descargar Comprobante" onClick={() => onReceipt?.(f.numero_factura)}>Descargar</button>)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

