export const APP_ROLES = {
  ADMINISTRADOR: 'Administrador',
  PERSONAL_LABORATORIO: 'Personal_Laboratorio',
  PACIENTE: 'Paciente',
} as const;

export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES];

const ROLE_ALIASES: Record<string, AppRole> = {
  ADMIN: APP_ROLES.ADMINISTRADOR,
  ADMINISTRADOR: APP_ROLES.ADMINISTRADOR,
  PERSONAL_LAB: APP_ROLES.PERSONAL_LABORATORIO,
  PERSONAL_LABORATORIO: APP_ROLES.PERSONAL_LABORATORIO,
  PERSONAL: APP_ROLES.PERSONAL_LABORATORIO,
  LABORATORISTA: APP_ROLES.PERSONAL_LABORATORIO,
  RECEPCION: APP_ROLES.PERSONAL_LABORATORIO,
  RECEPCIONISTA: APP_ROLES.PERSONAL_LABORATORIO,
  MEDICO: APP_ROLES.PERSONAL_LABORATORIO,
  PACIENTE: APP_ROLES.PACIENTE,
};

export function normalizeRoleName(role?: string | null): string {
  if (!role) {
    return '';
  }

  const normalizedKey = role.trim().replace(/\s+/g, '_').toUpperCase();
  return ROLE_ALIASES[normalizedKey] ?? role.trim();
}

export function isRole(role: string | null | undefined, expected: string): boolean {
  return normalizeRoleName(role) === normalizeRoleName(expected);
}

export function isAnyRole(role: string | null | undefined, expectedRoles: string[]): boolean {
  const normalized = normalizeRoleName(role);
  return expectedRoles.some((expected) => normalizeRoleName(expected) === normalized);
}

export function isAdminRoleName(role?: string | null): boolean {
  return isRole(role, APP_ROLES.ADMINISTRADOR);
}
