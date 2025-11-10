"use client";
import { useEffect, useState } from 'react';
import { useSessionStore } from '../../../lib/session-store';
import { isAdminish } from '../../../lib/auth-helpers';
import { api } from '../../../lib/api';

interface BillingConfig {
  iva_percentage: number;
  default_tax_rate: number;
}

export default function BillingConfigPage() {
  const { accessToken, roles } = useSessionStore();
  const isAdmin = isAdminish(roles);
  const [config, setConfig] = useState<BillingConfig>({ iva_percentage: 12, default_tax_rate: 0 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin || !accessToken) return;
    loadConfig();
  }, [isAdmin, accessToken]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await api<BillingConfig>('/admin/billing/config', { method: 'GET' }, accessToken);
      setConfig(data);
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api('/admin/billing/config', { 
        method: 'POST', 
        body: JSON.stringify(config),
        headers: { 'Content-Type': 'application/json' }
      }, accessToken);
      alert('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof BillingConfig, value: string) => {
    const numValue = parseFloat(value) || 0;
    setConfig(prev => ({ ...prev, [field]: numValue }));
  };

  if (!isAdmin) return <div className="card">Acceso denegado</div>;

  if (loading) return <div className="card">Cargando configuración...</div>;

  return (
    <section>
      <div className="card">
        <div className="title">Configuración de Facturación</div>
        <div className="subtitle">Administrar parámetros de facturación y cotización</div>
      </div>

      <div className="card mt-4">
        <div className="heading-sm mb-4">Parámetros de Facturación</div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Porcentaje de IVA (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={config.iva_percentage}
              onChange={(e) => handleChange('iva_percentage', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="12.00"
            />
            <p className="text-sm text-gray-500 mt-1">
              Porcentaje de IVA que se aplicará a las cotizaciones y facturas
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tasa de impuesto adicional (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={config.default_tax_rate}
              onChange={(e) => handleChange('default_tax_rate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
            <p className="text-sm text-gray-500 mt-1">
              Tasa adicional de impuestos (ej. impuesto municipal, etc.)
            </p>
          </div>

          <div className="border-t pt-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Resumen de configuración:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>IVA:</span>
                  <span className="font-medium">{config.iva_percentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Impuesto adicional:</span>
                  <span className="font-medium">{config.default_tax_rate}%</span>
                </div>
                <div className="flex justify-between border-t pt-1 mt-2">
                  <span>Total impuestos:</span>
                  <span className="font-medium">{config.iva_percentage + config.default_tax_rate}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : 'Guardar configuración'}
            </button>
            <button
              onClick={loadConfig}
              disabled={saving}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Restablecer
            </button>
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="heading-sm mb-4">Información</div>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• Los cambios en la configuración afectarán a las nuevas cotizaciones y facturas.</p>
          <p>• Las cotizaciones y facturas existentes mantendrán los valores que tenían al momento de creación.</p>
          <p>• El IVA se calcula sobre el subtotal de los servicios.</p>
          <p>• El impuesto adicional se calcula sobre el subtotal + IVA.</p>
        </div>
      </div>
    </section>
  );
}