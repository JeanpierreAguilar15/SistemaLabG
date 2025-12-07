'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, Clock, MapPin, DollarSign, FlaskConical, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

interface Message {
    id: string;
    content: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    intent?: string;
}

interface QuickAction {
    icon: React.ReactNode;
    label: string;
    message: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * PublicChatWidget - Widget de chat accesible para todos los usuarios
 * Cumple con HU-23: Acceso al agente virtual desde la página principal
 */
export default function PublicChatWidget() {
    const { user, isAuthenticated } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [sessionId, setSessionId] = useState<string>('');
    const [showQuickActions, setShowQuickActions] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Quick actions for FAQ
    const quickActions: QuickAction[] = [
        { icon: <DollarSign size={16} />, label: 'Precios', message: '¿Cuáles son los precios de los exámenes?' },
        { icon: <MapPin size={16} />, label: 'Sedes', message: '¿Dónde están ubicadas sus sedes?' },
        { icon: <Clock size={16} />, label: 'Horarios', message: '¿Cuál es el horario de atención?' },
        { icon: <FlaskConical size={16} />, label: 'Servicios', message: '¿Qué servicios ofrecen?' },
    ];

    // Initialize session ID
    useEffect(() => {
        let storedSession = localStorage.getItem('chatbot-public-session');
        if (!storedSession) {
            storedSession = `anon-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            localStorage.setItem('chatbot-public-session', storedSession);
        }
        // If user is authenticated, use their ID
        if (isAuthenticated && user) {
            storedSession = `user-${user.codigo_usuario}-${Date.now()}`;
        }
        setSessionId(storedSession);
    }, [isAuthenticated, user]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const addMessage = (msg: Message) => {
        setMessages((prev) => [...prev, msg]);
        if (msg.sender === 'user') {
            setShowQuickActions(false);
        }
    };

    const sendMessage = async (content: string) => {
        if (!content.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            content,
            sender: 'user',
            timestamp: new Date(),
        };

        addMessage(userMsg);
        setInputValue('');
        setIsTyping(true);

        try {
            const response = await fetch(`${API_URL}/chatbot/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId,
                    content,
                }),
            });

            const data = await response.json();

            setIsTyping(false);
            addMessage({
                id: (Date.now() + 1).toString(),
                content: data.text || 'Lo siento, no pude procesar tu mensaje.',
                sender: 'bot',
                timestamp: new Date(),
                intent: data.intent,
            });

        } catch (error) {
            console.error('Error sending message:', error);
            setIsTyping(false);
            addMessage({
                id: (Date.now() + 1).toString(),
                content: 'Lo siento, hubo un error de conexión. Por favor intenta de nuevo.',
                sender: 'bot',
                timestamp: new Date(),
            });
        }
    };

    const handleSend = () => {
        sendMessage(inputValue);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleQuickAction = (action: QuickAction) => {
        sendMessage(action.message);
    };

    const resetConversation = () => {
        setMessages([]);
        setShowQuickActions(true);
        const newSession = `anon-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        localStorage.setItem('chatbot-public-session', newSession);
        setSessionId(newSession);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 w-[350px] sm:w-[400px] h-[550px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-full">
                                    <Bot size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold">AgenteVLab</h3>
                                    <p className="text-xs text-blue-100">
                                        {isAuthenticated ? `Hola, ${user?.nombres}` : 'Asistente Virtual'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={resetConversation}
                                    className="hover:bg-white/20 p-1.5 rounded-full transition-colors"
                                    title="Nueva conversación"
                                >
                                    <RefreshCw size={18} />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="hover:bg-white/20 p-1.5 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center text-gray-500 mt-4">
                                    <Bot size={48} className="mx-auto mb-3 text-blue-400" />
                                    <p className="text-sm font-medium mb-1">¡Hola! Soy el asistente virtual</p>
                                    <p className="text-xs text-gray-400 mb-4">
                                        Puedo ayudarte con información sobre nuestros servicios
                                    </p>
                                </div>
                            )}

                            {/* Quick Actions */}
                            {showQuickActions && messages.length === 0 && (
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {quickActions.map((action, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleQuickAction(action)}
                                            className="flex items-center gap-2 p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-sm text-gray-700 hover:text-blue-600"
                                        >
                                            <span className="text-blue-500">{action.icon}</span>
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
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
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-white p-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100 flex items-center gap-1">
                                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-gray-100">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Escribe tu consulta..."
                                    className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-400"
                                    disabled={isTyping}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!inputValue.trim() || isTyping}
                                    className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                            <div className="text-center mt-2">
                                <p className="text-[10px] text-gray-400">
                                    Laboratorio Clínico Franz - Asistente Virtual
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Toggle Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`${
                    isOpen ? 'bg-gray-600' : 'bg-blue-600'
                } text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center`}
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
            </motion.button>
        </div>
    );
}
