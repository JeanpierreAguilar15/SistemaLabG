export async function api<T>(path: string, opts: RequestInit = {}, accessToken?: string): Promise<T> {
  const res = await fetch(process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}${path}` : `http://localhost:3001/api${path}` , {
    ...opts,
    headers: {
      'content-type': 'application/json',
      ...(opts.headers || {}),
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const body: any = await res.json();
      msg = body?.message || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}
