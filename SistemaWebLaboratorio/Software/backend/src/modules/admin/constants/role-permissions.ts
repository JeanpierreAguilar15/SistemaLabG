import { APP_ROLES, normalizeRoleName } from '../../auth/constants/roles.constants';

export interface RolePermissions {
  nivel: number;
  nombre: string;
  nombre_sugerido: string;
  descripcion: string;
  permisos: string[];
}

export const ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  [APP_ROLES.ADMINISTRADOR]: {
    nivel: 3,
    nombre: APP_ROLES.ADMINISTRADOR,
    nombre_sugerido: APP_ROLES.ADMINISTRADOR,
    descripcion: 'Acceso total al sistema administrativo.',
    permisos: [
      'Gestionar usuarios',
      'Gestionar roles',
      'Gestionar configuracion',
      'Gestionar examenes',
      'Gestionar resultados',
      'Validar resultados',
      'Subir PDFs de resultados',
      'Gestionar inventario',
      'Gestionar reactivos',
      'Gestionar proveedores y ordenes de compra',
      'Revisar alertas',
      'Revisar auditoria',
    ],
  },
  [APP_ROLES.PERSONAL_LABORATORIO]: {
    nivel: 2,
    nombre: APP_ROLES.PERSONAL_LABORATORIO,
    nombre_sugerido: APP_ROLES.PERSONAL_LABORATORIO,
    descripcion: 'Personal operativo de laboratorio sin acceso a inventario ni configuracion critica.',
    permisos: [
      'Ver dashboard operativo',
      'Consultar pacientes',
      'Crear pacientes',
      'Gestionar catalogo de examenes',
      'Crear muestras',
      'Crear resultados',
      'Editar resultados',
      'Subir PDFs de resultados',
      'Validar resultados',
      'Descargar resultados',
    ],
  },
  [APP_ROLES.PACIENTE]: {
    nivel: 1,
    nombre: APP_ROLES.PACIENTE,
    nombre_sugerido: APP_ROLES.PACIENTE,
    descripcion: 'Paciente con acceso exclusivo a su portal y resultados propios.',
    permisos: [
      'Ver resultados propios',
      'Descargar PDFs propios',
      'Actualizar perfil propio',
      'Actualizar consentimientos',
    ],
  },
};

export const CANONICAL_ROLE_NAMES = [
  APP_ROLES.ADMINISTRADOR,
  APP_ROLES.PERSONAL_LABORATORIO,
  APP_ROLES.PACIENTE,
];

export function getAccessLevelForRole(role: string): number {
  const normalized = normalizeRoleName(role);
  if (normalized === APP_ROLES.ADMINISTRADOR) return 3;
  if (normalized === APP_ROLES.PERSONAL_LABORATORIO) return 2;
  if (normalized === APP_ROLES.PACIENTE) return 1;
  return 1;
}

export function getPermissionsForRole(role: string): RolePermissions | null {
  return ROLE_PERMISSIONS[normalizeRoleName(role)] ?? null;
}

export function getPermissionsForLevel(nivel: number): RolePermissions | null {
  const byLevel: Record<number, string> = {
    3: APP_ROLES.ADMINISTRADOR,
    2: APP_ROLES.PERSONAL_LABORATORIO,
    1: APP_ROLES.PACIENTE,
  };

  return byLevel[nivel] ? ROLE_PERMISSIONS[byLevel[nivel]] : null;
}

export function getAllRoleLevels(): RolePermissions[] {
  return CANONICAL_ROLE_NAMES.map((role) => ROLE_PERMISSIONS[role]);
}

export function isValidRoleName(role: string): boolean {
  return (CANONICAL_ROLE_NAMES as string[]).includes(role);
}

export function getPermissionsSummary(roleOrLevel: string | number): string {
  const permissions = typeof roleOrLevel === 'number'
    ? getPermissionsForLevel(roleOrLevel)
    : getPermissionsForRole(roleOrLevel);

  if (!permissions) {
    return 'Rol invalido';
  }

  return `${permissions.nombre} (${permissions.permisos.length} permisos)`;
}
