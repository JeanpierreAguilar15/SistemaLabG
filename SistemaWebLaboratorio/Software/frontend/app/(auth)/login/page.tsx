"use client";
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSessionStore } from '../../../lib/session-store';
import { api } from '../../../lib/api';
import Link from 'next/link';
import { useState } from 'react';
import { Toast } from '../../../components/ui/toast';

const schema = z.object({
  cedula: z.string().min(3, 'Ingresa tu cédula'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export default function Page(){
  const { register, handleSubmit, formState:{ errors, isSubmitting } } = useForm<{cedula:string; password:string}>({ resolver: zodResolver(schema) });
  const setSession = useSessionStore(s=>s.setSession);
  const [role, setRole] = useState<'PACIENTE'|'PERSONAL_LAB'>('PACIENTE');
  const [toast, setToast] = useState<{ open:boolean; title:string; message:string; variant:'error'|'warning'|'info' }>(()=>({ open:false, title:'', message:'', variant:'info' }));
  const onSubmit = handleSubmit(async (data) => {
    try{
      const res = await api<{ access_token:string; refresh_token:string; roles:string[] }>(`/auth/login`, {
        method:'POST', body: JSON.stringify({ ...data, user_agent: navigator.userAgent, ip: '' })
      });
      setSession({ accessToken: res.access_token, roles: res.roles });
      location.href = '/dashboard';
    }catch(e:any){
      const raw = String(e?.message || '');
      const friendly = raw.toLowerCase().includes('credenciales') || raw.includes('401')
        ? 'Credenciales incorrectas. Revisa tu cédula y contraseña.'
        : 'No pudimos iniciar sesión. Inténtalo nuevamente.';
      setToast({ open:true, title:'Error de inicio de sesión', message:friendly, variant:'error' });
    }
  });
  const showZodErrors = () => {
    const msgs = [errors.cedula?.message, errors.password?.message].filter(Boolean).join(' \n');
    if (msgs) setToast({ open:true, title:'Revisa los campos', message: msgs, variant:'warning' });
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EEF3FF] to-[#FFF1F2] p-4">
      <section className="card w-full max-w-2xl shadow-xl">
        <div className="flex flex-col items-center">
          <div aria-hidden className="w-14 h-14 rounded-xl mb-2" style={{ background:'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' }} />
          <h1 className="heading-lg">Laboratorio Clínico Franz</h1>
          <p className="body-muted">Sistema de gestión médica</p>
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm" role="tablist" aria-label="tipo de usuario">
          <button className={`flex-1 border rounded-full px-3 py-1 ${role==='PACIENTE' ? 'bg-[#eef2ff] border-[var(--brand-secondary)]' : 'border-[var(--border-soft)] bg-white'}`} onClick={()=>setRole('PACIENTE')} role="tab" aria-selected={role==='PACIENTE'}>Paciente</button>
          <button className={`flex-1 border rounded-full px-3 py-1 ${role==='PERSONAL_LAB' ? 'bg-[#eef2ff] border-[var(--brand-secondary)]' : 'border-[var(--border-soft)] bg-white'}`} onClick={()=>setRole('PERSONAL_LAB')} role="tab" aria-selected={role==='PERSONAL_LAB'}>Laboratorista</button>
        </div>
        <form onSubmit={(e)=>{ e.preventDefault(); showZodErrors(); onSubmit(); }} className="mt-3">
          <label className="space-y-1">
            <span>Cédula</span>
            <input aria-invalid={!!errors.cedula} {...register('cedula')} placeholder="1234567890" className="block w-full rounded-md p-2 border border-[var(--border-soft)]" />
          </label>
          <label className="space-y-1 mt-2 block">
            <span>Contraseña</span>
            <input type="password" aria-invalid={!!errors.password} {...register('password')} placeholder="••••••••" className="block w-full rounded-md p-2 border border-[var(--border-soft)]" />
          </label>
          <button className="mt-4 w-full rounded-md px-4 py-2 text-white" style={{ background:'var(--brand-primary)' }} disabled={isSubmitting}>{`Iniciar sesión como ${role === 'PACIENTE' ? 'Paciente' : 'Laboratorista'}`}</button>
          <div className="mt-2 text-right">
            <Link href="/forgot-password" className="text-[var(--brand-secondary)] text-sm">¿Olvidaste tu contraseña?</Link>
          </div>
        </form>
        <div className="body-muted mt-2 text-center">
          ¿No tienes cuenta? <Link href="/register" className="text-[var(--brand-secondary)]">Registrarse</Link>
        </div>
      </section>
      <Toast open={toast.open} onClose={()=>setToast(s=>({ ...s, open:false }))} title={toast.title} variant={toast.variant} autoCloseMs={3500}>{toast.message}</Toast>
    </div>
  );
}





