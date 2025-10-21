import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' };

export default function Button({ variant = 'primary', children, className = '', ...props }: Props) {
  const cls =
    variant === 'secondary'
      ? 'btn-secondary'
      : variant === 'ghost'
      ? 'btn-ghost'
      : 'btn-primary';
  return (
    <button {...props} className={`${cls} ${className}`.trim()}>
      {children}
    </button>
  );
}

