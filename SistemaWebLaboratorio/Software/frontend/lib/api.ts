export async function api<T>(path: string, opts: RequestInit = {}, accessToken?: string): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}` : `http://localhost:3001/api`;
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      ...opts,
      headers: {
        'content-type': 'application/json',
        ...(opts.headers || {}),
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      },
      cache: 'no-store',
    });
  } catch (e) {
    throw new Error('Error de red o CORS');
  }
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const body: any = await res.json();
        const raw = body?.message;
        msg = Array.isArray(raw) ? raw.join(' | ') : (raw || msg);
      } else {
        const text = await res.text();
        msg = text || msg;
      }
    } catch {}
    throw new Error(msg);
  }
  try {
    return await res.json() as T;
  } catch {
    // Algunas respuestas 204/empty
    return undefined as unknown as T;
  }
}
