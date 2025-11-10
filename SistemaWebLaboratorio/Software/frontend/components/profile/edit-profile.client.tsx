"use client";
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../lib/api';
import { showToast } from '../../lib/toast-store';
import { useSessionStore } from '../../lib/session-store';
import { Button } from '../ui/button';

const schema = z.object({
  nombres: z.string().min(2, 'Ingresa tus nombres').optional(),
  apellidos: z.string().min(2, 'Ingresa tus apellidos').optional(),
  email: z.string().email('Correo invalido').optional(),
  telefono: z.string().min(7, 'Ingresa un telefono valido').optional(),
  direccion: z.string().optional(),
  contacto_emergencia_nombre: z.string().optional(),
  contacto_emergencia_telefono: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function EditProfileForm(){
  const { register, handleSubmit, formState:{ errors, isSubmitting }, setValue } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const { accessToken } = useSessionStore();

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
      }catch{/* ignore */}
    })();
  }, [accessToken, setValue]);

  const onSubmit = handleSubmit(async (data) => {
    try{
      await api(`/profile/me`, { method:'PATCH', body: JSON.stringify(data) }, accessToken);
      showToast('Perfil actualizado correctamente', { title:'Listo', variant:'success' });
    }catch(e:any){
      const msg = String(e?.message || 'Error actualizando perfil');
      showToast(msg, { title:'Error', variant:'error' });
    }
  });

  return (
    <form id="edit-profile-form" className="panel" aria-label="Editar datos personales" onSubmit={onSubmit}>
      <div className="panel-heading">Datos personales</div>
      <div className="panel-sub">Mantener tus datos al dia ayuda a agilizar las entregas y notificaciones.</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <label className="block text-sm font-medium text-[var(--text-main)]">
          Nombres
          <input {...register('nombres')} aria-invalid={!!errors.nombres} placeholder="Nombres" className="mt-1 w-full rounded-md border border-[var(--border-soft)] bg-[#f7f8fa] px-3 py-2" />
        </label>
        <label className="block text-sm font-medium text-[var(--text-main)]">
          Apellidos
          <input {...register('apellidos')} aria-invalid={!!errors.apellidos} placeholder="Apellidos" className="mt-1 w-full rounded-md border border-[var(--border-soft)] bg-[#f7f8fa] px-3 py-2" />
        </label>
        <label className="block text-sm font-medium text-[var(--text-main)]">
          Correo electronico
          <input type="email" inputMode="email" {...register('email')} aria-invalid={!!errors.email} placeholder="correo@ejemplo.com" className="mt-1 w-full rounded-md border border-[var(--border-soft)] bg-[#f7f8fa] px-3 py-2" />
          {errors.email && <small className="subtitle">{errors.email.message}</small>}
        </label>
        <label className="block text-sm font-medium text-[var(--text-main)]">
          Telefono
          <input type="tel" inputMode="tel" {...register('telefono')} aria-invalid={!!errors.telefono} placeholder="0999999999" className="mt-1 w-full rounded-md border border-[var(--border-soft)] bg-[#f7f8fa] px-3 py-2" />
          {errors.telefono && <small className="subtitle">{errors.telefono.message}</small>}
        </label>
        <label className="block text-sm font-medium text-[var(--text-main)] md:col-span-2">
          Direccion
          <input {...register('direccion')} aria-invalid={!!errors.direccion} placeholder="Av. Siempre Viva 123, Quito" className="mt-1 w-full rounded-md border border-[var(--border-soft)] bg-[#f7f8fa] px-3 py-2" />
        </label>
        <label className="block text-sm font-medium text-[var(--text-main)]">
          Contacto de emergencia
          <input {...register('contacto_emergencia_nombre')} aria-invalid={!!errors.contacto_emergencia_nombre} placeholder="Nombre de contacto" className="mt-1 w-full rounded-md border border-[var(--border-soft)] bg-[#f7f8fa] px-3 py-2" />
        </label>
        <label className="block text-sm font-medium text-[var(--text-main)]">
          Telefono de emergencia
          <input type="tel" inputMode="tel" {...register('contacto_emergencia_telefono')} aria-invalid={!!errors.contacto_emergencia_telefono} placeholder="0991234567" className="mt-1 w-full rounded-md border border-[var(--border-soft)] bg-[#f7f8fa] px-3 py-2" />
        </label>
      </div>
      <Button type="submit" className="mt-4" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar cambios'}</Button>
    </form>
  );
}

