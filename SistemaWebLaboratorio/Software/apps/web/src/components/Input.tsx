import React from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label?: string };

export default function Input({ label, id, ...props }: Props) {
  const inputId = id || `id_${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className="form-group">
      {label && (
        <label className="label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input id={inputId} className="input" {...props} />
    </div>
  );
}

