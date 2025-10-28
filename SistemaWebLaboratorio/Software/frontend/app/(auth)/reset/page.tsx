"use client";
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../../lib/api';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import { Suspense } from 'react';
import { Toast } from '../../../components/ui/toast';

const schema = z.object({ token: z.string().min(10), new_password: z.string().min(8) });

function ResetInner(){
  const sp = useSearchParams();
  const preset = sp.get('token') ?? '';
  const { register, handleSubmit, formState:{ errors, isSubmitting } } = useForm<{token:string; new_password:string}>({ resolver: zodResolver(schema), defaultValues:{ token: preset } });
  const [toast, setToast] = React.useState<{open:boolean; title:string; message:string; variant:'success'|'error'|'info'}>({open:false,title:'',message:'',variant:'info'});
  const onSubmit = handleSubmit(async (data) => {
    try{
      await api(`/auth/password/confirm`, { method:'POST', body: JSON.stringify(data) });
      setToast({ open:true, title:'Listo', message:'Contrasena actualizada. Redirigiendo...', variant:'success' });
      setTimeout(()=>{ location.href = '/login'; }, 1000);
    }catch{ setToast({ open:true, title:'No se pudo', message:'No fue posible actualizar la contrasena', variant:'error' }); }
  });
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EEF3FF] to-[#FFF1F2] p-4">
      <section className="card w-full max-w-lg shadow-xl">
        <div className="flex flex-col items-center">
          <div aria-hidden className="w-14 h-14 rounded-xl mb-2" style={{ background:'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' }} />
          <h1 className="heading-lg">Restablecer contrasena</h1>
          <p className="body-muted">Ingresa el token recibido y tu nueva contrasena.</p>
        </div>
        <form onSubmit={(e)=>{ e.preventDefault(); onSubmit(); }} className="mt-3">
          <label className="space-y-1">
            <span>Token</span>
            <input aria-invalid={!!errors.token} {...register('token')} className="block w-full rounded-md p-2 border border-[var(--border-soft)]" />
            {errors.token && <small className="subtitle">{errors.token.message}</small>}
          </label>
          <label className="space-y-1 mt-2 block">
            <span>Nueva contrasena</span>
            <input type="password" aria-invalid={!!errors.new_password} {...register('new_password')} className="block w-full rounded-md p-2 border border-[var(--border-soft)]" />
          </label>
          <Button variant="brand" className="mt-4 w-full" disabled={isSubmitting} type="submit">Guardar</Button>
          <div className="mt-3 text-center">
            <Link href="/login" className="text-[var(--brand-secondary)] text-sm">Volver al inicio de sesion</Link>
          </div>
        </form>
      </section>
      <Toast open={toast.open} onClose={()=>setToast(s=>({ ...s, open:false }))} title={toast.title} variant={toast.variant} autoCloseMs={3000}>{toast.message}</Toast>
    </div>
  );
}

export default function Page(){
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando…</div>}>
      <ResetInner />
    </Suspense>
  );
}
