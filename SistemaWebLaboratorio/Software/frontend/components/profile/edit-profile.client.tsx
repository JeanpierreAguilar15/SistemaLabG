"use client";
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../lib/api';
import { showToast } from '../../lib/toast-store';
import { useSessionStore } from '../../lib/session-store';
import { Button } from '../ui/button';

// Validación de cédula ecuatoriana
const validateCedula = (cedula: string): boolean => {
  if (!/^\d{10}$/.test(cedula)) return false;
  const digits = cedula.split('').map(Number);
  const province = parseInt(cedula.substring(0, 2));
  if (province < 1 || province > 24) return false;

  const coef = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let val = digits[i] * coef[i];
    if (val > 9) val -= 9;
    sum += val;
  }
  const verifier = sum % 10 === 0 ? 0 : 10 - (sum % 10);
  return verifier === digits[9];
};

// Validación de teléfono ecuatoriano
const validatePhone = (phone: string): boolean => {
  // Formato: 09XXXXXXXX (celular) o 02XXXXXXX (convencional)
  return /^(09\d{8}|0[2-7]\d{7})$/.test(phone);
};

const schema = z.object({
  nombres: z.string()
    .min(2, 'Ingresa al menos 2 caracteres')
    .max(100, 'Maximo 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo letras y espacios'),
  apellidos: z.string()
    .min(2, 'Ingresa al menos 2 caracteres')
    .max(100, 'Maximo 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo letras y espacios'),
  email: z.string()
    .email('Formato de correo invalido')
    .min(5, 'Correo muy corto')
    .max(100, 'Correo muy largo')
    .toLowerCase(),
  telefono: z.string()
    .refine(validatePhone, 'Formato: 09XXXXXXXX o 02XXXXXXX'),
  direccion: z.string()
    .min(5, 'Direccion muy corta')
    .max(200, 'Maximo 200 caracteres')
    .optional().or(z.literal('')),
  contacto_emergencia_nombre: z.string()
    .min(2, 'Nombre muy corto')
    .max(100, 'Maximo 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/, 'Solo letras y espacios')
    .optional().or(z.literal('')),
  contacto_emergencia_telefono: z.string()
    .refine((val) => !val || validatePhone(val), 'Formato: 09XXXXXXXX o 02XXXXXXX')
    .optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

export function EditProfileForm(){
  const { register, handleSubmit, formState:{ errors, isSubmitting, touchedFields, dirtyFields }, setValue, watch, trigger } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange' // Enable real-time validation
  });
  const { accessToken } = useSessionStore();
  const [loading, setLoading] = useState(true);

  // Watch all fields for real-time validation feedback
  const watchedFields = watch();

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
      finally{
        setLoading(false);
      }
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

  // Helper to get validation state class
  const getValidationClass = (fieldName: keyof FormValues) => {
    const isTouched = touchedFields[fieldName];
    const hasError = errors[fieldName];
    const value = watchedFields[fieldName];

    if (!isTouched || !value) return 'form-input';
    return hasError ? 'form-input is-invalid' : 'form-input is-valid';
  };

  if (loading) {
    return (
      <div className="panel">
        <div className="space-y-4">
          <div className="skeleton h-8 w-48"></div>
          <div className="skeleton h-4 w-full"></div>
          <div className="skeleton h-4 w-full"></div>
          <div className="skeleton h-10 w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <form id="edit-profile-form" className="panel" aria-label="Editar datos personales" onSubmit={onSubmit}>
      <div className="panel-heading">Datos personales</div>
      <div className="panel-sub">Mantener tus datos al dia ayuda a agilizar las entregas y notificaciones.</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Nombres */}
        <div className="form-group">
          <label className="form-label required">Nombres</label>
          <input
            {...register('nombres')}
            aria-invalid={!!errors.nombres}
            aria-describedby={errors.nombres ? 'error-nombres' : undefined}
            placeholder="Juan Carlos"
            className={getValidationClass('nombres')}
          />
          {errors.nombres && (
            <span id="error-nombres" className="form-error">{errors.nombres.message}</span>
          )}
        </div>

        {/* Apellidos */}
        <div className="form-group">
          <label className="form-label required">Apellidos</label>
          <input
            {...register('apellidos')}
            aria-invalid={!!errors.apellidos}
            aria-describedby={errors.apellidos ? 'error-apellidos' : undefined}
            placeholder="Perez Garcia"
            className={getValidationClass('apellidos')}
          />
          {errors.apellidos && (
            <span id="error-apellidos" className="form-error">{errors.apellidos.message}</span>
          )}
        </div>

        {/* Email */}
        <div className="form-group">
          <label className="form-label required">Correo electronico</label>
          <input
            type="email"
            inputMode="email"
            {...register('email')}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'error-email' : undefined}
            placeholder="correo@ejemplo.com"
            className={getValidationClass('email')}
          />
          {errors.email && (
            <span id="error-email" className="form-error">{errors.email.message}</span>
          )}
          {!errors.email && touchedFields.email && watchedFields.email && (
            <span className="form-hint">Correo valido</span>
          )}
        </div>

        {/* Telefono */}
        <div className="form-group">
          <label className="form-label required">Telefono</label>
          <input
            type="tel"
            inputMode="tel"
            {...register('telefono')}
            aria-invalid={!!errors.telefono}
            aria-describedby={errors.telefono ? 'error-telefono' : undefined}
            placeholder="0999999999"
            className={getValidationClass('telefono')}
          />
          {errors.telefono && (
            <span id="error-telefono" className="form-error">{errors.telefono.message}</span>
          )}
          {!errors.telefono && (
            <span className="form-hint">Celular: 09XXXXXXXX | Fijo: 02XXXXXXX</span>
          )}
        </div>

        {/* Direccion */}
        <div className="form-group md:col-span-2">
          <label className="form-label">Direccion</label>
          <input
            {...register('direccion')}
            aria-invalid={!!errors.direccion}
            aria-describedby={errors.direccion ? 'error-direccion' : undefined}
            placeholder="Av. Siempre Viva 123, Quito"
            className={getValidationClass('direccion')}
          />
          {errors.direccion && (
            <span id="error-direccion" className="form-error">{errors.direccion.message}</span>
          )}
        </div>
      </div>

      {/* Contacto de emergencia section */}
      <div className="panel-divider" />
      <div className="panel-heading text-base">Contacto de emergencia</div>
      <div className="panel-sub">Persona a contactar en caso de necesidad</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Contacto emergencia nombre */}
        <div className="form-group">
          <label className="form-label">Nombre completo</label>
          <input
            {...register('contacto_emergencia_nombre')}
            aria-invalid={!!errors.contacto_emergencia_nombre}
            aria-describedby={errors.contacto_emergencia_nombre ? 'error-contacto-nombre' : undefined}
            placeholder="Maria Lopez"
            className={getValidationClass('contacto_emergencia_nombre')}
          />
          {errors.contacto_emergencia_nombre && (
            <span id="error-contacto-nombre" className="form-error">{errors.contacto_emergencia_nombre.message}</span>
          )}
        </div>

        {/* Contacto emergencia telefono */}
        <div className="form-group">
          <label className="form-label">Telefono</label>
          <input
            type="tel"
            inputMode="tel"
            {...register('contacto_emergencia_telefono')}
            aria-invalid={!!errors.contacto_emergencia_telefono}
            aria-describedby={errors.contacto_emergencia_telefono ? 'error-contacto-telefono' : undefined}
            placeholder="0991234567"
            className={getValidationClass('contacto_emergencia_telefono')}
          />
          {errors.contacto_emergencia_telefono && (
            <span id="error-contacto-telefono" className="form-error">{errors.contacto_emergencia_telefono.message}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-6">
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
        </Button>
        {Object.keys(dirtyFields).length > 0 && !isSubmitting && (
          <span className="text-sm text-[var(--text-muted)]">
            Tienes cambios sin guardar
          </span>
        )}
      </div>
    </form>
  );
}

