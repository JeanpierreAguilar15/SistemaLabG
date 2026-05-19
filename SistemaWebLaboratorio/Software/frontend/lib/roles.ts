export const APP_ROLES = {
  ADMINISTRADOR: 'Administrador',
  PERSONAL_LABORATORIO: 'Personal_Laboratorio',
  PACIENTE: 'Paciente',
} as const

const ROLE_ALIASES: Record<string, string> = {
  ADMIN: APP_ROLES.ADMINISTRADOR,
  ADMINISTRADOR: APP_ROLES.ADMINISTRADOR,
  PERSONAL_LAB: APP_ROLES.PERSONAL_LABORATORIO,
  PERSONAL_LABORATORIO: APP_ROLES.PERSONAL_LABORATORIO,
  RECEPCION: APP_ROLES.PERSONAL_LABORATORIO,
  MEDICO: APP_ROLES.PERSONAL_LABORATORIO,
  PACIENTE: APP_ROLES.PACIENTE,
}

export function normalizeRole(role?: string | null) {
  if (!role) return ''
  const key = role.trim().replace(/\s+/g, '_').toUpperCase()
  return ROLE_ALIASES[key] ?? role.trim()
}

export function hasRole(role: string | null | undefined, allowedRoles: string[]) {
  const normalizedRole = normalizeRole(role)
  return allowedRoles.some((allowedRole) => normalizeRole(allowedRole) === normalizedRole)
}

export function isAdminRole(role?: string | null) {
  return hasRole(role, [APP_ROLES.ADMINISTRADOR])
}

export function isAdminAreaRole(role?: string | null) {
  return hasRole(role, [APP_ROLES.ADMINISTRADOR, APP_ROLES.PERSONAL_LABORATORIO])
}

export function isPatientRole(role?: string | null) {
  return hasRole(role, [APP_ROLES.PACIENTE])
}
