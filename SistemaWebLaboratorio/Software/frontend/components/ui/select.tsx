import React from 'react';

type Option = { value: string; label: string };

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  options?: Option[];
  placeholder?: string;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, id, options, placeholder, children, ...props }, ref) => {
    const selectId = id || (label ? `${label.replace(/\s+/g, '-').toLowerCase()}-select` : undefined);
    return (
      <label className="block w-full">
        {label && <span className="block mb-1 text-sm text-[var(--text-main)]">{label}</span>}
        <select
          ref={ref}
          id={selectId}
          className={`block w-full rounded-md p-2 border border-[var(--border-soft)] bg-white ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : undefined}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
          {children}
        </select>
        {error && (
          <small id={`${selectId}-error`} className="block mt-1 text-xs text-[var(--text-muted)]">
            {error}
          </small>
        )}
      </label>
    );
  }
);
Select.displayName = 'Select';

