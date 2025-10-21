import { useEffect, useState } from 'react';
import Logo from './Logo';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    // Evitar mismatch de hidratación: calcular en cliente después de montar
    try {
      setShowLogout(!!localStorage.getItem('token'));
    } catch {}
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div>
      <header className="header">
        <div className="brand">
          <Logo size={22} />
          <span className="brand-name">LabCare</span>
        </div>
        <nav className="nav">
          <a href="/login">Inicio</a>
          <a href="/recuperar">Recuperar</a>
          {showLogout ? (
            <button className="btn-secondary" onClick={logout}>Salir</button>
          ) : null}
        </nav>
      </header>
      <main className="page">{children}</main>
    </div>
  );
}
