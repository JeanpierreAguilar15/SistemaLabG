import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    const inputId = id || (label ? `${label.replace(/\s+/g, '-').toLowerCase()}-input` : undefined);
    return (
      <label className="block w-full">
        {label && <span className="block mb-1 text-sm text-[var(--text-main)]">{label}</span>}
        <input
          ref={ref}
          id={inputId}
          className={`block w-full rounded-md p-2 border border-[var(--border-soft)] bg-white ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <small id={`${inputId}-error`} className="block mt-1 text-xs text-[var(--text-muted)]">
            {error}
          </small>
        )}
      </label>
    );
  }
);
Input.displayName = 'Input';

