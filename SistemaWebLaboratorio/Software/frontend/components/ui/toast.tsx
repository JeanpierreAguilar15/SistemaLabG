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

export function Toast({ open, onClose, title, children, variant = 'info', autoCloseMs = 3000 }: Props){
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);
  const DURATION = 220; // ms

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), DURATION);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => handleClose(), autoCloseMs);
    return () => clearTimeout(t);
  }, [open, autoCloseMs]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, DURATION);
  };

  if (!mounted) return null;
  const color = variant === 'error' ? 'bg-[var(--danger-bg)] text-[var(--danger-fg)]'
    : variant === 'warning' ? 'bg-[var(--warning-bg)] text-[var(--warning-fg)]'
    : variant === 'success' ? 'bg-[var(--success-bg)] text-[var(--success-fg)]'
    : 'bg-[var(--info-bg)] text-[var(--info-fg)]';

  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-0 z-[60] flex items-end justify-end">
      <div className={`m-4 w-[min(92vw,380px)] pointer-events-auto`}>
        <div className={`rounded-lg border border-[var(--border-soft)] bg-white shadow-xl transition-all duration-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          {title && <div className={`m-3 inline-block rounded px-2 py-1 text-xs font-medium ${color}`}>{title}</div>}
          <div className="px-4 pb-3 text-sm text-[var(--text-main)] whitespace-pre-line">{children}</div>
          <div className="px-3 pb-3 flex justify-end">
            <button className="icon" onClick={handleClose} aria-label="cerrar">cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

