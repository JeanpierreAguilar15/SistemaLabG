import { redirect } from 'next/navigation';

export default function Page(){
  // redirigir a login por defecto; puedes cambiar a '/dashboard' si ya manejas sesión
  redirect('/login');
}

