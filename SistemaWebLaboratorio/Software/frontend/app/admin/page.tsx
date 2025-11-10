"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Page(){
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-pulse text-[var(--text-muted)]">Cargando...</div>
    </div>
  );
}

