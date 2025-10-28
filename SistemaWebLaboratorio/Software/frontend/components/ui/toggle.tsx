"use client";
import { useEffect, useState } from 'react';

type Props = {
  checked?: boolean;
  onChange?: (v: boolean) => void;
  ariaLabel?: string;
  disabled?: boolean;
};

export function Toggle({ checked = false, onChange, ariaLabel, disabled }: Props){
  const [on, setOn] = useState(checked);
  useEffect(() => setOn(checked), [checked]);
  const toggle = () => { if (disabled) return; const v = !on; setOn(v); onChange?.(v); };
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      onClick={toggle}
      className={`h-6 w-10 rounded-full border transition-colors ${disabled?'opacity-60 cursor-not-allowed':'cursor-pointer'} ${on ? 'bg-[var(--brand-secondary)] border-[var(--brand-secondary)]' : 'bg-white border-[var(--border-soft)]'}`}
    >
      <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform translate-x-[2px] ${on ? 'translate-x-[22px]' : ''}`} />
    </button>
  );
}

