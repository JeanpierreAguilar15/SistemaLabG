export default function Card({ children, max = 520 }: { children: React.ReactNode; max?: number }) {
  return (
    <div className="card" style={{ maxWidth: max }}>
      {children}
    </div>
  );
}

