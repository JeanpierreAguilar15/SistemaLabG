"use client";
import { useState } from 'react';

type Props = {
  content: string;
  children: React.ReactNode;
};

export function Tooltip({ content, children }: Props){
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block" onMouseEnter={()=>setOpen(true)} onMouseLeave={()=>setOpen(false)} onFocus={()=>setOpen(true)} onBlur={()=>setOpen(false)}>
      {children}
      <span role="tooltip" className={`pointer-events-none absolute left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap rounded-md border border-[var(--border-soft)] bg-white px-2 py-1 text-xs text-[var(--text-main)] shadow ${open ? 'opacity-100' : 'opacity-0'} transition-opacity duration-150`}>{content}</span>
    </span>
  );
}

