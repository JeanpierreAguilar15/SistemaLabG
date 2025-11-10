"use client";
import { ReactNode, useEffect, useRef, useState, useId } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  variant?: 'error' | 'info' | 'warning' | 'success';
  autoCloseMs?: number;
  hideDefaultClose?: boolean;
};

export function Modal({ open, onClose, title, children, variant = 'info', autoCloseMs, hideDefaultClose }: Props){
  // Mount control to allow fade-out before unmount
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);
  const DURATION = 220; // ms
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

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

  // Focus trap and initial focus
  useEffect(() => {
    if (!mounted) return;
    const root = dialogRef.current;
    if (!root) return;
    const selectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');
    const focusables = Array.from(root.querySelectorAll<HTMLElement>(selectors));
    (focusables[0] || root).focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (focusables.length === 0) { e.preventDefault(); return; }
      const idx = focusables.indexOf(document.activeElement as HTMLElement);
      const next = e.shiftKey ? (idx <= 0 ? focusables.length - 1 : idx - 1) : (idx === focusables.length - 1 ? 0 : idx + 1);
      focusables[next].focus();
      e.preventDefault();
    };
    root.addEventListener('keydown', onKeyDown);
    return () => root.removeEventListener('keydown', onKeyDown);
  }, [mounted, visible]);

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
    <div role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} aria-label={title ? undefined : 'Diálogo'} className="fixed inset-0 z-50 flex items-center justify-center">
      <div className={`absolute inset-0 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`} style={{ background: 'var(--overlay-scrim)' }} onClick={handleClose} />
      <div ref={dialogRef} tabIndex={-1} className={`relative z-10 w-[90%] max-w-3xl rounded-lg border border-[var(--border-soft)] bg-white p-4 transform transition-all duration-200 ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'} max-h-[85vh] overflow-auto`}>
        {title && <div id={titleId} className={`mb-2 inline-block rounded px-2 py-1 text-sm ${color}`}>{title}</div>}
        <div className="text-sm text-[var(--text-main)]">{children}</div>
        {!hideDefaultClose && (
          <div className="mt-4 flex justify-end">
            <button className="icon" onClick={handleClose} aria-label="cerrar">cerrar</button>
          </div>
        )}
      </div>
    </div>
  );
}
