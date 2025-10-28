"use client";
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../lib/api';
import { useSessionStore } from '../../lib/session-store';

const schema = z.object({
  nombres: z.string().min(2, 'Ingresa nombres').optional(),
  apellidos: z.string().min(2, 'Ingresa apellidos').optional(),
  email: z.string().email('Correo inválido').optional(),
  telefono: z.string().min(7, 'Ingresa teléfono válido').optional(),
  direccion: z.string().optional(),
  contacto_emergencia_nombre: z.string().optional(),
  contacto_emergencia_telefono: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function EditProfileForm(){
  const { register, handleSubmit, formState:{ errors, isSubmitting }, setValue } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const { accessToken } = useSessionStore();
  // cargar datos actuales una sola vez
  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      try{
        const me: any = await api('/profile/me', { method:'GET' }, accessToken);
        setValue('nombres', me?.nombres ?? '');
        setValue('apellidos', me?.apellidos ?? '');
        setValue('email', me?.email ?? '');
        setValue('telefono', me?.telefono ?? '');
        setValue('direccion', me?.direccion ?? '');
        setValue('contacto_emergencia_nombre', me?.contacto_emergencia_nombre ?? '');
        setValue('contacto_emergencia_telefono', me?.contacto_emergencia_telefono ?? '');
      }catch{}
    })();
  }, [accessToken, setValue]);
  const onSubmit = handleSubmit(async (data) => {
    try{
      await api(`/profile/me`, { method:'PATCH', body: JSON.stringify(data) }, accessToken);
      alert('Perfil actualizado');
    }catch{ alert('Error actualizando perfil'); }
  });
  return (
    <form id="edit-profile-form" className="card" aria-label="Editar datos personales" onSubmit={onSubmit}>
      <div className="title">Datos Personales</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
        <label>
          <span className="sr-only">Nombres</span>
          <input {...register('nombres')} aria-invalid={!!errors.nombres} placeholder="Nombres" className="w-full rounded-md border border-[var(--border-soft)] bg-[#f7f8fa] px-3 py-2" />
        </label>
        <label>
          <span className="sr-only">Apellidos</span>
          <input {...register('apellidos')} aria-invalid={!!errors.apellidos} placeholder="Apellidos" className="w-full rounded-md border border-[var(--border-soft)] bg-[#f7f8fa] px-3 py-2" />
        </label>
        <label>
          <span className="sr-only">Correo electrónico</span>
          <input {...register('email')} aria-invalid={!!errors.email} placeholder="Correo electrónico" className="w-full rounded-md border border-[var(--border-soft)] bg-[#f7f8fa] px-3 py-2" />
          {errors.email && <small className="subtitle">{errors.email.message}</small>}
        </label>
        <label>
          <span className="sr-only">Teléfono</span>
          <input {...register('telefono')} aria-invalid={!!errors.telefono} placeholder="Teléfono" className="w-full rounded-md border border-[var(--border-soft)] bg-[#f7f8fa] px-3 py-2" />
          {errors.telefono && <small className="subtitle">{errors.telefono.message}</small>}
        </label>
        <label className="md:col-span-2">
          <span className="sr-only">Dirección</span>
          <input {...register('direccion')} aria-invalid={!!errors.direccion} placeholder="Dirección" className="w-full rounded-md border border-[var(--border-soft)] bg-[#f7f8fa] px-3 py-2" />
        </label>
        <label>
          <span className="sr-only">Contacto de emergencia</span>
          <input {...register('contacto_emergencia_nombre')} aria-invalid={!!errors.contacto_emergencia_nombre} placeholder="Contacto de emergencia (Nombre)" className="w-full rounded-md border border-[var(--border-soft)] bg-[#f7f8fa] px-3 py-2" />
        </label>
        <label>
          <span className="sr-only">Teléfono de emergencia</span>
          <input {...register('contacto_emergencia_telefono')} aria-invalid={!!errors.contacto_emergencia_telefono} placeholder="Teléfono de emergencia" className="w-full rounded-md border border-[var(--border-soft)] bg-[#f7f8fa] px-3 py-2" />
        </label>
      </div>
      <button className="primary" disabled={isSubmitting} style={{ marginTop:'1rem' }}>Guardar cambios</button>
    </form>
  );
}

