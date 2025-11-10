export function isAdminish(roles: string[] | undefined | null): boolean {
  const r = Array.isArray(roles) ? roles : [];
  return r.includes('ADMIN') || r.includes('PERSONAL_LAB');
}

export function getHomePath(roles: string[] | undefined | null, accessToken?: string): string {
  const hasToken = !!accessToken;
  const hasRoles = Array.isArray(roles) && roles.length > 0;
  if (!hasToken || !hasRoles) return '/login';
  return isAdminish(roles) ? '/admin' : '/dashboard';
}

export function hasRole(roles: string[] | undefined | null, role: string): boolean {
  const r = Array.isArray(roles) ? roles : [];
  return r.includes(role);
}
