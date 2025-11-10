"use client";
import { useEffect, useState } from 'react';
import { useToastStore, ToastVariant } from '../../lib/toast-store';

function colorClasses(variant?: ToastVariant) {
  switch (variant) {
    case 'success':
      return 'bg-[var(--success-bg)] text-[var(--success-fg)]';
    case 'error':
      return 'bg-[var(--danger-bg)] text-[var(--danger-fg)]';
    case 'warning':
      return 'bg-[var(--warning-bg)] text-[var(--warning-fg)]';
    default:
      return 'bg-[var(--info-bg)] text-[var(--info-fg)]';
  }
}

function ToastInline({ title, children, variant = 'info', autoCloseMs = 3000, onClose }: {
  title?: string; children: any; variant?: ToastVariant; autoCloseMs?: number; onClose: () => void;
}){
  const [visible, setVisible] = useState(true);
  useEffect(() => { const t = setTimeout(() => { setVisible(false); setTimeout(onClose, 220); }, autoCloseMs); return () => clearTimeout(t); }, [autoCloseMs, onClose]);
  return (
    <div className={`pointer-events-auto rounded-lg border border-[var(--border-soft)] bg-white transition-all duration-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      {title && <div className={`m-3 inline-block rounded px-2 py-1 text-xs font-medium ${colorClasses(variant)}`}>{title}</div>}
      <div className="px-4 pb-3 text-sm text-[var(--text-main)] whitespace-pre-line">{children}</div>
    </div>
  );
}

export function Toaster(){
  const items = useToastStore((s)=>s.items);
  const remove = useToastStore((s)=>s.remove);
  if (!items.length) return null;
  return (
    <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-[60] flex flex-col gap-2 w-[min(92vw,380px)]">
      {items.map(t => (
        <ToastInline key={t.id} title={t.title} variant={t.variant} autoCloseMs={t.autoCloseMs ?? 3000} onClose={() => remove(t.id)}>{t.message}</ToastInline>
      ))}
    </div>
  );
}
