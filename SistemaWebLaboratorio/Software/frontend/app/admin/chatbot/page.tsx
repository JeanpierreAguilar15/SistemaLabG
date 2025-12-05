'use client';

import React, { useState, useEffect } from 'react';
import { Save, Bot, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { api, ApiError } from '@/lib/api';

interface ChatbotConfig {
    codigo_configuracion: number;
    activo: boolean;
    nombre_agente: string;
    mensaje_bienvenida: string;
    disclaimer_legal: string;
    umbral_confianza: number;
    permitir_acceso_resultados: boolean;
    mensaje_fallo: string;
    contacto_soporte: string;
}

export default function ChatbotConfigPage() {
    const [config, setConfig] = useState<ChatbotConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const token = localStorage.getItem('token') || '';
            const data = await api.get<ChatbotConfig>('/chatbot/config', { token });
            setConfig(data);
        } catch (error) {
            console.error(error);
            const message = error instanceof ApiError ? error.message : 'No se pudo cargar la configuración.';
            setMessage({ type: 'error', text: message });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!config) return;
        setSaving(true);
        setMessage(null);

        try {
            const token = localStorage.getItem('token') || '';
            await api.put('/chatbot/config', config, { token });
            setMessage({ type: 'success', text: 'Configuración guardada exitosamente.' });
        } catch (error) {
            const message = error instanceof ApiError ? error.message : 'Error al guardar los cambios.';
            setMessage({ type: 'error', text: message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    if (!config) return null;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                        <Bot size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Asistente Virtual</h1>
                        <p className="text-gray-500">Configuración del chatbot de atención al paciente</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    {saving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                    Guardar Cambios
                </button>
            </div>

            {message && (
                <div
                    className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}
                >
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Panel de Control Principal */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-2">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${config.activo ? 'bg-green-500' : 'bg-red-500'}`} />
                        Estado del Servicio
                    </h2>
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                        <div>
                            <p className="font-medium text-gray-900">Activar Asistente Virtual</p>
                            <p className="text-sm text-gray-500">
                                Si se desactiva, el widget desaparecerá del portal de pacientes.
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={config.activo}
                                onChange={(e) => setConfig({ ...config, activo: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>

                {/* Identidad */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4">Identidad</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Agente</label>
                            <input
                                type="text"
                                value={config.nombre_agente}
                                onChange={(e) => setConfig({ ...config, nombre_agente: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje de Bienvenida</label>
                            <textarea
                                rows={3}
                                value={config.mensaje_bienvenida}
                                onChange={(e) => setConfig({ ...config, mensaje_bienvenida: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Seguridad e IA */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4">Seguridad e IA</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Umbral de Confianza ({config.umbral_confianza})
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={config.umbral_confianza}
                                onChange={(e) => setConfig({ ...config, umbral_confianza: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Nivel mínimo de certeza para responder automáticamente.
                            </p>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-sm font-medium text-gray-700">Acceso a Resultados Reales</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.permitir_acceso_resultados}
                                    onChange={(e) => setConfig({ ...config, permitir_acceso_resultados: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Textos Legales y Fallback */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-2">
                    <h2 className="text-lg font-semibold mb-4">Textos Legales y Soporte</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Disclaimer Legal</label>
                            <textarea
                                rows={3}
                                value={config.disclaimer_legal}
                                onChange={(e) => setConfig({ ...config, disclaimer_legal: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje de Fallo / Error</label>
                            <textarea
                                rows={3}
                                value={config.mensaje_fallo}
                                onChange={(e) => setConfig({ ...config, mensaje_fallo: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contacto de Soporte (WhatsApp/Tel)</label>
                            <input
                                type="text"
                                value={config.contacto_soporte || ''}
                                onChange={(e) => setConfig({ ...config, contacto_soporte: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
