"use client";
import { useEffect, useState } from 'react';
import { useSessionStore } from '../../../lib/session-store';
import { isAdminish } from '../../../lib/auth-helpers';
import { api } from '../../../lib/api';

type Row = { 
  numero_factura: number; 
  numero_cotizacion: number; 
  cedula: string; 
  estado: string; 
  monto_total: number; 
  fecha_emision: string; 
  fecha_vencimiento: string; 
  fecha_pago: string | null;
};

export default function Page(){
  const { accessToken, roles } = useSessionStore();
  const isAdmin = isAdminish(roles);
  const [items, setItems] = useState<Row[]>([]);
  const [filter, setFilter] = useState('');
  
  const load = async (estado?: string) => {
    if(!accessToken || !isAdmin) return;
    try {
      const res = await api<{items:Row[]}>(`/billing/facturas${estado ? `?estado=${estado}` : ''}`, { method:'GET' }, accessToken);
      setItems(res.items||[]);
    } catch (error) {
      console.error('Error cargando facturas:', error);
      setItems([]);
    }
  };
  
  useEffect(()=>{ load(); }, [accessToken, isAdmin]);
  
  if(!isAdmin) return <div className="card">acceso denegado</div>;
  
  const filteredItems = items.filter(item => 
    !filter || 
    item.cedula.toLowerCase().includes(filter.toLowerCase()) ||
    item.numero_factura.toString().includes(filter) ||
    item.estado.toLowerCase().includes(filter.toLowerCase())
  );
  
  return (
    <section>
      <div className="card">
        <div className="heading-sm">Facturas</div>
        <div className="mt-4 flex items-center gap-4">
          <input 
            value={filter} 
            onChange={(e)=>setFilter(e.target.value)} 
            placeholder="Buscar por cédula, #factura o estado" 
            className="flex-1" 
          />
          <select onChange={(e)=>load(e.target.value)} className="px-3 py-2 border rounded">
            <option value="">Todas</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="PAGADA">Pagadas</option>
            <option value="ANULADA">Anuladas</option>
          </select>
          <button className="icon" onClick={()=>load()}>Actualizar</button>
        </div>
        
        <table className="w-full border-collapse table-hover mt-4">
          <thead>
            <tr>
              <th className="p-2 text-left border-b border-border-soft"># Factura</th>
              <th className="p-2 text-left border-b border-border-soft"># Cotización</th>
              <th className="p-2 text-left border-b border-border-soft">Cédula</th>
              <th className="p-2 text-left border-b border-border-soft">Estado</th>
              <th className="p-2 text-left border-b border-border-soft">Monto</th>
              <th className="p-2 text-left border-b border-border-soft">Emisión</th>
              <th className="p-2 text-left border-b border-border-soft">Vencimiento</th>
              <th className="p-2 text-left border-b border-border-soft">Pago</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(factura => (
              <tr key={factura.numero_factura}>
                <td className="p-2 border-b border-border-soft">{factura.numero_factura}</td>
                <td className="p-2 border-b border-border-soft">{factura.numero_cotizacion}</td>
                <td className="p-2 border-b border-border-soft">{factura.cedula}</td>
                <td className="p-2 border-b border-border-soft">
                  <span className={`px-2 py-1 rounded text-xs ${
                    factura.estado === 'PAGADA' ? 'bg-green-100 text-green-800' :
                    factura.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                    factura.estado === 'ANULADA' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {factura.estado}
                  </span>
                </td>
                <td className="p-2 border-b border-border-soft">${factura.monto_total?.toFixed(2)}</td>
                <td className="p-2 border-b border-border-soft">{new Date(factura.fecha_emision).toLocaleDateString()}</td>
                <td className="p-2 border-b border-border-soft">{new Date(factura.fecha_vencimiento).toLocaleDateString()}</td>
                <td className="p-2 border-b border-border-soft">{factura.fecha_pago ? new Date(factura.fecha_pago).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">No hay facturas registradas</div>
        )}
      </div>
    </section>
  );
}