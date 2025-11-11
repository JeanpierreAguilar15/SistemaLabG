"use client";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../lib/api';
import { showToast } from '../../lib/toast-store';
import { useSessionStore } from '../../lib/session-store';
import { Button } from '../ui/button';
import { EyeIcon, EyeOffIcon, LockIcon } from '../ui/icons';

const passwordSchema = z.object({
  current_password: z.string()
    .min(1, 'Ingresa tu contraseña actual'),
  new_password: z.string()
    .min(8, 'Minimo 8 caracteres')
    .max(100, 'Maximo 100 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayuscula')
    .regex(/[a-z]/, 'Debe contener al menos una minuscula')
    .regex(/[0-9]/, 'Debe contener al menos un numero')
    .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un caracter especial'),
  confirm_password: z.string()
    .min(1, 'Confirma tu nueva contraseña'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm_password'],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function ChangePasswordForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting, touchedFields }, watch, reset } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    mode: 'onChange'
  });
  const { accessToken } = useSessionStore();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const watchedFields = watch();

  const onSubmit = handleSubmit(async (data) => {
    try {
      await api('/profile/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: data.current_password,
          new_password: data.new_password,
        })
      }, accessToken);

      showToast('Contraseña actualizada correctamente', { title: 'Listo', variant: 'success' });
      reset(); // Clear form
    } catch (e: any) {
      const msg = String(e?.message || 'Error al cambiar la contraseña');
      showToast(msg, { title: 'Error', variant: 'error' });
    }
  });

  const getValidationClass = (fieldName: keyof PasswordFormValues) => {
    const isTouched = touchedFields[fieldName];
    const hasError = errors[fieldName];
    const value = watchedFields[fieldName];

    if (!isTouched || !value) return 'form-input';
    return hasError ? 'form-input is-invalid' : 'form-input is-valid';
  };

  // Password strength indicator
  const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
    if (!password) return { score: 0, label: 'Ninguna', color: 'var(--text-muted)' };

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score: 1, label: 'Debil', color: 'var(--accent-danger)' };
    if (score <= 4) return { score: 2, label: 'Media', color: 'var(--accent-warning)' };
    return { score: 3, label: 'Fuerte', color: 'var(--accent-success)' };
  };

  const strength = getPasswordStrength(watchedFields.new_password || '');

  return (
    <form className="panel" onSubmit={onSubmit}>
      <div className="flex items-center gap-2 mb-3">
        <LockIcon className="w-5 h-5 text-[var(--brand-primary)]" />
        <div className="panel-heading">Cambiar contraseña</div>
      </div>
      <div className="panel-sub mb-4">
        Actualiza tu contraseña periódicamente para mantener tu cuenta segura
      </div>

      <div className="space-y-4">
        {/* Current Password */}
        <div className="form-group">
          <label className="form-label required">Contraseña actual</label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              {...register('current_password')}
              aria-invalid={!!errors.current_password}
              aria-describedby={errors.current_password ? 'error-current-password' : undefined}
              placeholder="••••••••"
              className={getValidationClass('current_password')}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              aria-label={showCurrent ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showCurrent ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            </button>
          </div>
          {errors.current_password && (
            <span id="error-current-password" className="form-error">{errors.current_password.message}</span>
          )}
        </div>

        {/* New Password */}
        <div className="form-group">
          <label className="form-label required">Nueva contraseña</label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              {...register('new_password')}
              aria-invalid={!!errors.new_password}
              aria-describedby={errors.new_password ? 'error-new-password' : undefined}
              placeholder="••••••••"
              className={getValidationClass('new_password')}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              aria-label={showNew ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showNew ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            </button>
          </div>
          {errors.new_password && (
            <span id="error-new-password" className="form-error">{errors.new_password.message}</span>
          )}

          {/* Password strength indicator */}
          {watchedFields.new_password && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[var(--text-muted)]">Seguridad:</span>
                <span className="text-xs font-semibold" style={{ color: strength.color }}>
                  {strength.label}
                </span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3].map((level) => (
                  <div
                    key={level}
                    className="h-1 flex-1 rounded-full transition-all"
                    style={{
                      backgroundColor: level <= strength.score ? strength.color : 'var(--border-soft)'
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mt-2 text-xs text-[var(--text-muted)] space-y-1">
            <div className="flex items-center gap-1">
              <span className={watchedFields.new_password?.length >= 8 ? 'text-[var(--accent-success)]' : ''}>
                • Minimo 8 caracteres
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className={/[A-Z]/.test(watchedFields.new_password || '') ? 'text-[var(--accent-success)]' : ''}>
                • Una letra mayuscula
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className={/[a-z]/.test(watchedFields.new_password || '') ? 'text-[var(--accent-success)]' : ''}>
                • Una letra minuscula
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className={/[0-9]/.test(watchedFields.new_password || '') ? 'text-[var(--accent-success)]' : ''}>
                • Un numero
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className={/[^A-Za-z0-9]/.test(watchedFields.new_password || '') ? 'text-[var(--accent-success)]' : ''}>
                • Un caracter especial (!@#$%^&*)
              </span>
            </div>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="form-group">
          <label className="form-label required">Confirmar nueva contraseña</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              {...register('confirm_password')}
              aria-invalid={!!errors.confirm_password}
              aria-describedby={errors.confirm_password ? 'error-confirm-password' : undefined}
              placeholder="••••••••"
              className={getValidationClass('confirm_password')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showConfirm ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirm_password && (
            <span id="error-confirm-password" className="form-error">{errors.confirm_password.message}</span>
          )}
        </div>
      </div>

      <Button type="submit" variant="primary" className="mt-6" disabled={isSubmitting}>
        {isSubmitting ? 'Actualizando...' : 'Cambiar contraseña'}
      </Button>

      {/* Security tip */}
      <div className="mt-4 p-3 rounded-lg bg-[#F0F6FF] border border-[#BFDBFE]">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-[var(--brand-primary)] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-[var(--text-secondary)]">
            Te recomendamos usar una contraseña unica que no utilices en otros sitios.
          </p>
        </div>
      </div>
    </form>
  );
}
