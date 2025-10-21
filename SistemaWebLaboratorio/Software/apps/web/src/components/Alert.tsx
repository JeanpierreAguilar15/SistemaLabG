export default function Alert({ type = 'error', children }: { type?: 'error' | 'success' | 'info'; children: React.ReactNode }) {
  const cls = type === 'success' ? 'alert-success' : type === 'info' ? 'alert-info' : 'alert-error';
  return <div className={`alert ${cls}`}>{children}</div>;
}

