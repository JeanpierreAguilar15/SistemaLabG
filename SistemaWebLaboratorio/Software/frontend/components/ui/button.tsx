"use client";
import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'danger' | 'outline' | 'ghost' | 'brand';
  className?: string;
  ariaLabel?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
};

export function Button({ children, onClick, variant = 'primary', className = '', ariaLabel, type = 'button', disabled }: Props){
  const base = 'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium focus:outline-none transition-all duration-200 active:scale-[.99]';
  const styles = {
    primary: 'bg-[var(--brand-secondary)] text-white hover:opacity-95',
    danger: 'bg-[#dc2626] text-white hover:opacity-95',
    outline: 'border border-[var(--border-soft)] text-[var(--text-main)] bg-white hover:bg-[#f3f4f6]',
    ghost: 'text-[var(--brand-secondary)] hover:bg-[#eef2ff]',
    brand: 'bg-[var(--brand-primary)] text-white hover:opacity-95'
  } as const;
  return (
    <button type={type} aria-label={ariaLabel} disabled={disabled} onClick={onClick} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}
