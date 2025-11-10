"use client";
import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'danger' | 'outline' | 'ghost' | 'brand';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  ariaLabel?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
};

export function Button({ children, onClick, variant = 'primary', size = 'md', className = '', ariaLabel, type = 'button', disabled }: Props){
  const base = 'inline-flex items-center justify-center rounded-xl font-semibold focus:outline-none transition-all duration-150 active:scale-[.99]';
  const sizes = {
    sm: 'h-8 px-3 text-xs rounded-lg',
    md: 'h-11 px-4 text-sm',
    lg: 'h-12 px-5 text-base',
  } as const;
  const styles = {
    primary: 'bg-[var(--brand-secondary)] text-white hover:opacity-95',
    danger: 'bg-[#dc2626] text-white hover:opacity-95',
    outline: 'border border-[var(--border-soft)] text-[var(--text-main)] bg-white hover:bg-[#f3f4f6]',
    ghost: 'text-[var(--brand-secondary)] hover:bg-[#eef2ff]',
    brand: 'bg-[var(--brand-primary)] text-white hover:opacity-95'
  } as const;
  return (
    <button type={type} aria-label={ariaLabel} aria-disabled={disabled} disabled={disabled} onClick={onClick} className={`${base} ${sizes[size]} ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}
