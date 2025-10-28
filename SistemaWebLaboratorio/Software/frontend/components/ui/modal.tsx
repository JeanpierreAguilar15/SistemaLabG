"use client";
import { ReactNode, useEffect, useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  variant?: 'error' | 'info' | 'warning' | 'success';
  autoCloseMs?: number;
};

export function Modal({ open, onClose, title, children, variant = 'info', autoCloseMs }: Props){
  // Mount control to allow fade-out before unmount
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);
  const DURATION = 220; // ms

  // Handle external open changes
  useEffect(() => {
    if (open) {
      setMounted(true);
      // next tick show to trigger transition
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), DURATION);
      return () => clearTimeout(t);
    }
  }, [open]);

  // ESC to close (with fade)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Auto-close after a short time (fade-out)
  useEffect(() => {
    if (!open || !autoCloseMs) return;
    const t = setTimeout(() => handleClose(), autoCloseMs);
    return () => clearTimeout(t);
  }, [open, autoCloseMs]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose(), DURATION);
  };
  if (!mounted) return null;
  const color = variant === 'error' ? 'bg-[var(--danger-bg)] text-[var(--danger-fg)]' : variant === 'warning' ? 'bg-[var(--warning-bg)] text-[var(--warning-fg)]' : variant === 'success' ? 'bg-[var(--success-bg)] text-[var(--success-fg)]' : 'bg-[var(--info-bg)] text-[var(--info-fg)]';
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
      <div className={`absolute inset-0 bg-black/30 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`} onClick={handleClose} />
      <div className={`relative z-10 w-[90%] max-w-md rounded-lg border border-[var(--border-soft)] bg-white p-4 shadow-xl transform transition-all duration-200 ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'}`}>
        {title && <div className={`mb-2 inline-block rounded px-2 py-1 text-sm ${color}`}>{title}</div>}
        <div className="text-sm text-[var(--text-main)]">{children}</div>
        <div className="mt-4 flex justify-end">
          <button className="icon" onClick={handleClose} aria-label="cerrar">cerrar</button>
        </div>
      </div>
    </div>
  );
}
