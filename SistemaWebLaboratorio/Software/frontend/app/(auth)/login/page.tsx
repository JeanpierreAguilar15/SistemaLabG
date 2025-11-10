"use client";
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSessionStore } from '../../../lib/session-store';
import { getHomePath } from '../../../lib/auth-helpers';
import { api } from '../../../lib/api';
import { isCedulaEcuador } from '../../../lib/ecuador';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Toast } from '../../../components/ui/toast';

const schema = z.object({
  cedula: z
    .string()
    .regex(/^\d{10}$/, 'La cédula debe tener 10 dígitos')
    .refine((v) => isCedulaEcuador(v), 'Cédula ecuatoriana inválida'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export default function Page(){
  const { register, handleSubmit, formState:{ errors, isSubmitting } } = useForm<{cedula:string; password:string}>({ resolver: zodResolver(schema) });
  const setSession = useSessionStore(s=>s.setSession);
  const router = useRouter();
  const [toast, setToast] = useState<{ open:boolean; title:string; message:string; variant:'error'|'warning'|'info' }>(()=>({ open:false, title:'', message:'', variant:'info' }));
  const onSubmit = handleSubmit(async (data) => {
    try{
      const res = await api<{ access_token:string; refresh_token:string; roles:string[] }>(`/auth/login`, {
        method:'POST', body: JSON.stringify({ ...data, user_agent: navigator.userAgent, ip: '' })
      });
      setSession({ accessToken: res.access_token, roles: res.roles });
      const home = getHomePath(res.roles, res.access_token);
      // Navegar sin recargar para conservar el estado en memoria
      router.replace(home);
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
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface-page)] p-4">
      <section className="card w-full max-w-2xl">
        <div className="flex flex-col items-center">
          <div aria-hidden className="w-14 h-14 rounded-xl mb-2" style={{ background:'var(--brand-secondary)' }} />
          <h1 className="heading-lg">Laboratorio Clínico Franz</h1>
        </div>
        <p className="body-muted mt-1 text-center">Ingresa con tu cédula y contraseña. Tu rol se detecta automáticamente.</p>
        <form aria-busy={isSubmitting} onSubmit={(e)=>{ e.preventDefault(); showZodErrors(); onSubmit(); }} className="mt-3">
          <label className="space-y-1" htmlFor="cedula">
            <span>Cédula</span>
            <input id="cedula" aria-invalid={!!errors.cedula} aria-describedby={errors.cedula ? 'cedula-error' : undefined} {...register('cedula')} placeholder="1234567890" inputMode="numeric" pattern="\d{10}" autoComplete="username" className="block w-full rounded-md p-2 border border-[var(--border-soft)]" />
            {errors.cedula && <small id="cedula-error" className="subtitle">{errors.cedula.message}</small>}
          </label>
          <label className="space-y-1 mt-2 block" htmlFor="password">
            <span>Contraseña</span>
            <input id="password" type="password" aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : undefined} {...register('password')} autoComplete="current-password" className="block w-full rounded-md p-2 border border-[var(--border-soft)]" />
            {errors.password && <small id="password-error" className="subtitle">{errors.password.message}</small>}
          </label>
          <button className="mt-4 w-full rounded-md px-4 py-2 text-white" style={{ background:'var(--brand-primary)' }} disabled={isSubmitting}>Iniciar sesión</button>
          <div className="mt-2 text-right">
            <Link href="/forgot-password" className="text-[var(--brand-secondary)] text-sm">¿Olvidaste tu contraseña?</Link>
          </div>
        </form>
        <div className="body-muted mt-2 text-center">
          ¿No tienes cuenta? <Link href="/register" className="text-[var(--brand-secondary)]">Registrarse</Link>
        </div>
      </section>
      <Toast open={toast.open} onClose={()=>setToast(s=>({ ...s, open:false }))} title={toast.title} variant={toast.variant as any} autoCloseMs={3500}>{toast.message}</Toast>
    </div>
  );
}
