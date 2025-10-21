import { useState } from 'react';
import Logo from './Logo';

type Props = {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function AuthSplitLayout({ title = 'Laboratorio Franz', subtitle = 'Ingreso al sistema', children }: Props) {
  const src = process.env.NEXT_PUBLIC_LOGO_SRC || '/Logo_Lab.png';
  const [ok, setOk] = useState(true);
  return (
    <div className="auth-split">
      <section className="auth-left">
        <div className="auth-left-content">
          {ok ? (
            <img
              src={src}
              alt=""
              aria-hidden
              className="auth-logo"
              onError={() => setOk(false)}
            />
          ) : (
            <Logo size={56} />
          )}
          <h1>{title}</h1>
          <p>Gestión integrada de laboratorio clínico.</p>
        </div>
        <div className="auth-waves" aria-hidden />
      </section>
      <section className="auth-right">
        <div className="auth-card">{children}</div>
      </section>
    </div>
  );
}
