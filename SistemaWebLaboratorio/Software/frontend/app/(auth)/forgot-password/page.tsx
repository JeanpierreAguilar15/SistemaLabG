"use client";
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../../lib/api';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import { Toast } from '../../../components/ui/toast';

const schema = z.object({ email: z.string().email('Ingresa un correo valido') });

export default function Page(){
  const { register, handleSubmit, formState:{ errors, isSubmitting } } = useForm<{email:string}>({ resolver: zodResolver(schema) });
  const [toast, setToast] = useState<{open:boolean; title:string; message:string; variant:'info'|'error'|'success'}>({open:false,title:'',message:'',variant:'info'});
  const onSubmit = handleSubmit(async (data) => {
    try{
      const res = await api<{ ok:boolean; link_dev?:string }>(`/auth/password/request`, { method:'POST', body: JSON.stringify({ email: data.email }) });
      const msg = res.link_dev ? `Enlace de prueba: ${res.link_dev}` : 'Si el correo existe, te enviaremos un enlace para restablecer la contrasena.';
      setToast({ open:true, title:'Solicitud enviada', message:msg, variant:'success' });
    }catch{ setToast({ open:true, title:'No pudimos procesarlo', message:'Intentalo nuevamente.', variant:'error' }); }
  });
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EEF3FF] to-[#FFF1F2] p-4">
      <section className="card w-full max-w-lg shadow-xl">
        <div className="flex flex-col items-center">
          <div aria-hidden className="w-14 h-14 rounded-xl mb-2" style={{ background:'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' }} />
          <h1 className="heading-lg">Recuperar contraseña</h1>
          <p className="body-muted">Te enviaremos un enlace de restablecimiento al correo indicado.</p>
        </div>
        <form onSubmit={(e)=>{ e.preventDefault(); onSubmit(); }} className="mt-3">
          <label className="space-y-1">
            <span>Correo electronico</span>
            <input aria-invalid={!!errors.email} {...register('email')} placeholder="tu@correo.com" className="block w-full rounded-md p-2 border border-[var(--border-soft)]" />
            {errors.email && <small className="subtitle">{errors.email.message}</small>}
          </label>
          <Button variant="brand" className="mt-4 w-full" disabled={isSubmitting} type="submit">Enviar enlace</Button>
        </form>
        <div className="mt-3 text-center">
          <Link href="/login" className="text-[var(--brand-secondary)] text-sm">Volver a iniciar sesion</Link>
        </div>
      </section>
      <Toast open={toast.open} onClose={()=>setToast(s=>({ ...s, open:false }))} title={toast.title} variant={toast.variant as any} autoCloseMs={4000}>{toast.message}</Toast>
    </div>
  );
}
