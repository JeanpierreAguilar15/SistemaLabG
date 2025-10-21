import { useState } from 'react';
import Logo from './Logo';

type Props = { children: React.ReactNode; title?: string; forceIcon?: boolean };

export default function AuthLayout({ children, title = process.env.NEXT_PUBLIC_BRAND_NAME || 'Laboratorio Franz', forceIcon = false }: Props) {
  const logoSrc = process.env.NEXT_PUBLIC_LOGO_SRC || '/logo_lab.png';
  const [imgOk, setImgOk] = useState(true);
  return (
    <div className="auth">
      <div className="auth-hero">
        {forceIcon || !imgOk ? (
          <Logo size={40} />
        ) : (
          <img src={logoSrc} alt="" aria-hidden className="auth-logo" width={40} height={40} onError={() => setImgOk(false)} />
        )}
        <div className="auth-brand">{title}</div>
      </div>
      <div className="auth-card">{children}</div>
    </div>
  );
}

