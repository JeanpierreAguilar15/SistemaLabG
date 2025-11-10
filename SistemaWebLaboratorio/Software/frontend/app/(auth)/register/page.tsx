"use client";
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../../lib/api';
import { showToast } from '../../../lib/toast-store';
import { isCedulaEcuador } from '../../../lib/ecuador';
import Link from 'next/link';

const schema = z.object({
  cedula: z
    .string()
    .regex(/^\d{10}$/, 'deben ser 10 digitos')
    .refine((v) => isCedulaEcuador(v), 'cedula ecuatoriana invalida'),
  nombres: z.string().min(1),
  apellidos: z.string().min(1),
  email: z.string().email(),
  telefono: z.string().optional(),
  password: z.string().min(8),
});

export default function Page(){
  const { register, handleSubmit, formState:{ errors, isSubmitting } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const onSubmit = handleSubmit(async (data) => {
    try{
      const payload = {
        cedula: data.cedula.trim(),
        nombres: data.nombres.trim(),
        apellidos: data.apellidos.trim(),
        email: data.email.trim().toLowerCase(),
        telefono: data.telefono?.trim() || undefined,
        password: data.password,
      };
      await api(`/auth/register`, { method:'POST', body: JSON.stringify(payload) });
      location.href = '/login';
    }catch(e:any){
      showToast(e?.message || 'No se pudo crear la cuenta', { title:'Error', variant:'error' });
    }
  });
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface-page)] p-4">
      <section className="card w-full max-w-2xl">
        <div className="flex flex-col items-center">
          <div aria-hidden className="w-14 h-14 rounded-xl mb-2" style={{ background:'var(--brand-secondary)' }} />
          <h1 className="heading-lg">Crear cuenta</h1>
          <p className="body-muted">Registrate para acceder al portal de pacientes</p>
        </div>
        <form aria-busy={isSubmitting} onSubmit={onSubmit} className="mt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <label className="space-y-1">
              <span>Cedula</span>
              <input aria-invalid={!!errors.cedula} {...register('cedula')} className="block w-full rounded-md p-2 border border-[var(--border-soft)]" />
              {errors.cedula && <small className="subtitle">{errors.cedula.message}</small>}
            </label>
            <label className="space-y-1">
              <span>Email</span>
              <input aria-invalid={!!errors.email} {...register('email')} className="block w-full rounded-md p-2 border border-[var(--border-soft)]" />
              {errors.email && <small className="subtitle">{errors.email.message}</small>}
            </label>
            <label className="space-y-1">
              <span>Nombres</span>
              <input aria-invalid={!!errors.nombres} {...register('nombres')} className="block w-full rounded-md p-2 border border-[var(--border-soft)]" />
              {errors.nombres && <small className="subtitle">{errors.nombres.message}</small>}
            </label>
            <label className="space-y-1">
              <span>Apellidos</span>
              <input aria-invalid={!!errors.apellidos} {...register('apellidos')} className="block w-full rounded-md p-2 border border-[var(--border-soft)]" />
              {errors.apellidos && <small className="subtitle">{errors.apellidos.message}</small>}
            </label>
            <label className="space-y-1">
              <span>Telefono</span>
              <input aria-invalid={!!errors.telefono} {...register('telefono')} className="block w-full rounded-md p-2 border border-[var(--border-soft)]" />
              {errors.telefono && <small className="subtitle">{errors.telefono.message}</small>}
            </label>
            <label className="space-y-1">
              <span>Contrasena</span>
              <input type="password" aria-invalid={!!errors.password} {...register('password')} className="block w-full rounded-md p-2 border border-[var(--border-soft)]" />
              {errors.password && <small className="subtitle">{errors.password.message}</small>}
            </label>
          </div>
          <button className="mt-4 w-full rounded-md px-4 py-2 text-white" style={{ background:'var(--brand-primary)' }} disabled={isSubmitting}>Crear cuenta</button>
        </form>
        <div className="subtitle mt-3 text-center">
          <Link href="/login">Ya tengo cuenta</Link>
        </div>
      </section>
    </div>
  );
}
