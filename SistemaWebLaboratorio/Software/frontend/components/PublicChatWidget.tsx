'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Bot, Phone, FileText, Loader2, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

interface Message {
    id: string;
    content: string;
    sender: 'user' | 'bot' | 'system';
    timestamp: Date;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Widget autenticado para interpretar resultados de laboratorio con IA
 * y recuperar el historial de conversacion del usuario.
 */
export default function PublicChatWidget() {
    const { isAuthenticated, accessToken, user } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Informacion del laboratorio
    const LAB_PHONE = '(+591) 3-3456789';
    const LAB_WHATSAPP = '+591 70012345';

    const addMessage = (msg: Message) => {
        setMessages((prev) => [...prev, msg]);
    };

    useEffect(() => {
        if (!isAuthenticated || !user || typeof window === 'undefined') {
            setIsOpen(false);
            setMessages([]);
            setSessionId(null);
            return;
        }

        const storageKey = `chatbot-session-${user.codigo_usuario}`;
        const savedSessionId = localStorage.getItem(storageKey);
        const nextSessionId = savedSessionId || `chat-${user.codigo_usuario}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        if (!savedSessionId) {
            localStorage.setItem(storageKey, nextSessionId);
        }
        setSessionId(nextSessionId);
    }, [isAuthenticated, user]);

    useEffect(() => {
        if (!isAuthenticated || !accessToken || !sessionId) return;

        let cancelled = false;
        const activeSessionId = sessionId;

        async function loadHistory() {
            try {
                const response = await fetch(`${API_URL}/chatbot/history?sessionId=${encodeURIComponent(activeSessionId)}`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                if (!response.ok) return;

                const data = await response.json();
                if (cancelled || !Array.isArray(data.messages)) return;

                setMessages(data.messages.map((message: any) => ({
                    id: message.id,
                    content: message.content,
                    sender: message.sender,
                    timestamp: new Date(message.timestamp),
                })));
            } catch (error) {
                console.error('Error loading chatbot history:', error);
            }
        }

        loadHistory();

        return () => {
            cancelled = true;
        };
    }, [accessToken, isAuthenticated, sessionId]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!accessToken || !sessionId) return;

        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            addMessage({
                id: Date.now().toString(),
                content: 'Por favor, sube un archivo PDF con tus resultados de laboratorio.',
                sender: 'bot',
                timestamp: new Date(),
            });
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            addMessage({
                id: Date.now().toString(),
                content: 'El archivo es muy grande. El tamano maximo es 10MB.',
                sender: 'bot',
                timestamp: new Date(),
            });
            return;
        }

        setIsUploadingFile(true);

        addMessage({
            id: Date.now().toString(),
            content: `Subiendo: ${file.name}`,
            sender: 'user',
            timestamp: new Date(),
        });

        try {
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result as string;
                    const base64Data = result.split(',')[1];
                    resolve(base64Data);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            addMessage({
                id: (Date.now() + 1).toString(),
                content: 'Analizando tus resultados con inteligencia artificial...',
                sender: 'bot',
                timestamp: new Date(),
            });

            const response = await fetch(`${API_URL}/chatbot/interpret-results`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    file: base64,
                    mimeType: 'application/pdf',
                    sessionId,
                }),
            });

            const data = await response.json();

            if (data.success) {
                addMessage({
                    id: (Date.now() + 2).toString(),
                    content: data.chatMessage,
                    sender: 'bot',
                    timestamp: new Date(),
                });
            } else {
                addMessage({
                    id: (Date.now() + 2).toString(),
                    content: data.error || 'No pude analizar el documento. Asegurate de que sea un PDF legible con resultados de laboratorio.',
                    sender: 'bot',
                    timestamp: new Date(),
                });
            }

        } catch (error) {
            console.error('Error uploading file:', error);
            addMessage({
                id: (Date.now() + 2).toString(),
                content: 'Hubo un error al procesar el archivo. Por favor intenta de nuevo.',
                sender: 'bot',
                timestamp: new Date(),
            });
        } finally {
            setIsUploadingFile(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const showContactInfo = () => {
        addMessage({
            id: Date.now().toString(),
            content: `Para comunicarte con nosotros:\n\nTelefono: ${LAB_PHONE}\nWhatsApp: ${LAB_WHATSAPP}\n\nHorario de atencion:\nLunes a Viernes: 7:00 - 19:00\nSabados: 7:00 - 13:00`,
            sender: 'bot',
            timestamp: new Date(),
        });
    };

    const resetConversation = () => {
        if (user && typeof window !== 'undefined') {
            const nextSessionId = `chat-${user.codigo_usuario}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            localStorage.setItem(`chatbot-session-${user.codigo_usuario}`, nextSessionId);
            setSessionId(nextSessionId);
        }
        setMessages([]);
    };

    if (!isAuthenticated || !accessToken || !user || !sessionId) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {isOpen && (
                <div
                    className="mb-4 w-[350px] sm:w-[400px] h-[550px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-200"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center justify-between text-white">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-full">
                                <Bot size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold">Laboratorio Franz</h3>
                                <p className="text-xs opacity-80">Interpretacion de Resultados con IA</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={resetConversation}
                                className="hover:bg-white/20 p-1.5 rounded-full transition-colors"
                                title="Nueva conversacion"
                                aria-label="Nueva conversación"
                            >
                                <RefreshCw size={18} />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="hover:bg-white/20 p-1.5 rounded-full transition-colors"
                                aria-label="Cerrar asistente"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Actions area */}
                    <div className="sticky top-0 z-10 bg-gray-50 p-3 border-b border-gray-200">
                        {/* Hidden file input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept="application/pdf"
                            className="hidden"
                        />

                        {messages.length === 0 && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploadingFile}
                                className="w-full flex items-center justify-center gap-3 p-3 mb-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
                            >
                                {isUploadingFile ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <FileText size={20} />
                                )}
                                <div className="text-left">
                                    <p className="font-semibold text-sm">Interpretar mis Resultados</p>
                                    <p className="text-xs opacity-80">Sube tu PDF y te lo explico</p>
                                </div>
                            </button>
                        )}

                        <div className="grid grid-cols-2 gap-1">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploadingFile}
                                className="flex items-center justify-center gap-1 p-2 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-xs text-gray-700 hover:text-blue-600 disabled:opacity-50"
                            >
                                <span className="text-blue-500"><FileText size={16} /></span>
                                <span>Subir PDF</span>
                            </button>
                            <button
                                onClick={showContactInfo}
                                className="flex items-center justify-center gap-1 p-2 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-xs text-gray-700 hover:text-blue-600"
                            >
                                <span className="text-blue-500"><Phone size={16} /></span>
                                <span>Contacto</span>
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center text-gray-500 mt-4">
                                <Bot size={48} className="mx-auto mb-3 text-blue-400" />
                                <p className="text-sm font-medium mb-1">Hola! Soy el asistente virtual</p>
                                <p className="text-xs text-gray-400 mb-4">
                                    Puedo interpretar tus resultados de laboratorio usando inteligencia artificial.
                                    Sube un PDF para comenzar.
                                </p>
                            </div>
                        )}

                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${
                                    msg.sender === 'user' ? 'justify-end' :
                                    msg.sender === 'system' ? 'justify-center' : 'justify-start'
                                }`}
                            >
                                {msg.sender === 'system' ? (
                                    <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1.5 rounded-full max-w-[80%] text-center">
                                        {msg.content}
                                    </div>
                                ) : (
                                    <div
                                        className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                                            msg.sender === 'user'
                                                ? 'bg-blue-600 text-white rounded-br-md'
                                                : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'
                                        }`}
                                    >
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                        <span className={`text-[10px] mt-1 block ${
                                            msg.sender === 'user' ? 'text-blue-200' : 'text-gray-400'
                                        }`}>
                                            {msg.timestamp.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="p-3 bg-white border-t border-gray-100">
                        <div className="text-center">
                            <p className="text-[10px] text-gray-400">
                                Laboratorio Clinico Franz - Interpretacion de Resultados con IA
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? 'Cerrar asistente' : 'Abrir asistente'}
                className={`${
                    isOpen ? 'bg-gray-600' : 'bg-blue-600'
                } text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center`}
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
            </button>
        </div>
    );
}
