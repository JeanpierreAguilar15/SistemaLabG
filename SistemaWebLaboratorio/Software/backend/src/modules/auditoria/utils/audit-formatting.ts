import { AdminEventPayload } from '../../admin/admin-events.service';

type JsonObject = Record<string, unknown>;

const ENTITY_LABELS: Record<string, string> = {
  user: 'usuario',
  role: 'rol',
  exam: 'examen',
  category: 'categoria de examen',
  inventory: 'inventario',
  inventory_item: 'item de inventario',
  stock_movement: 'movimiento de stock',
  supplier: 'proveedor',
  purchase_order: 'orden de compra',
  resultado: 'resultado',
  config: 'configuracion',
};

const ACTION_LABELS: Record<string, string> = {
  created: 'Creacion de',
  updated: 'Actualizacion de',
  deleted: 'Eliminacion de',
  status_changed: 'Cambio de estado de',
  emitted: 'Emision de',
  received: 'Recepcion de',
  cancelled: 'Cancelacion de',
  validated: 'Validacion de',
  pdf_uploaded: 'Carga de PDF de',
  insumos_deducted: 'Descuento de insumos de',
  insumos_failed: 'Fallo en descuento de insumos de',
};

const DETAIL_KEYS = [
  'nombre',
  'codigo_interno',
  'email',
  'cedula',
  'rol',
  'estado',
  'estado_anterior',
  'estado_nuevo',
  'razon_social',
  'numero_orden',
  'tipo_movimiento',
  'cantidad',
  'stock_anterior',
  'stock_nuevo',
  'examen',
  'movimientos',
  'mensaje',
  'error',
];

export interface ParsedAuditDescription {
  resumen: string | null;
  detalle: unknown;
  evento?: string | null;
}

export function getAuditEntityLabel(entityType?: string | null): string {
  if (!entityType) return 'registro';
  return ENTITY_LABELS[entityType] || entityType.replace(/_/g, ' ');
}

export function getAuditActionCategory(accion?: string | null): string {
  const value = (accion || '').toLowerCase();

  if (value.includes('cre') || value.includes('created')) return 'created';
  if (value.includes('actual') || value.includes('updated')) return 'updated';
  if (value.includes('elim') || value.includes('deleted')) return 'deleted';
  if (value.includes('login')) return 'login';
  if (value.includes('error') || value.includes('fall')) return 'error';

  return 'other';
}

export function getEventActionKey(
  action?: string,
  eventType?: string | null,
): string {
  const suffix = eventType?.split('.').pop();
  if (suffix && ACTION_LABELS[suffix]) {
    return suffix;
  }

  return action && ACTION_LABELS[action] ? action : 'updated';
}

export function formatAuditAction(
  entityType?: string | null,
  action?: string,
  eventType?: string | null,
): string {
  const actionKey = getEventActionKey(action, eventType);
  const verb = ACTION_LABELS[actionKey] || 'Registro actividad en';
  return `${verb} ${getAuditEntityLabel(entityType)}`;
}

export function buildAuditDescription(
  payload: AdminEventPayload & { eventType?: string },
): string {
  const resumen = buildPayloadSummary(payload);
  const descripcion = {
    resumen,
    evento: payload.eventType || null,
    entidad: payload.entityType,
    codigo_entidad: payload.entityId,
    detalle: sanitizeDetail(payload.data || {}),
  };

  return JSON.stringify(descripcion);
}

export function parseAuditDescription(description?: string | null): ParsedAuditDescription {
  if (!description) {
    return { resumen: null, detalle: null, evento: null };
  }

  try {
    const parsed = JSON.parse(description);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const value = parsed as JsonObject;
      return {
        resumen: typeof value.resumen === 'string' ? value.resumen : summarizeObject(value),
        detalle: value.detalle ?? parsed,
        evento: typeof value.evento === 'string' ? value.evento : null,
      };
    }

    return { resumen: String(parsed), detalle: parsed, evento: null };
  } catch {
    return { resumen: description, detalle: null, evento: null };
  }
}

export function formatAuditActivityLog<T extends JsonObject>(log: T): T & JsonObject {
  const parsed = parseAuditDescription(log.descripcion as string | null | undefined);
  const entityLabel = getAuditEntityLabel(log.entidad as string | null | undefined);
  const actionLabel = normalizeStoredAction(
    log.accion as string | null | undefined,
    log.entidad as string | null | undefined,
  );
  const resumen = parsed.resumen || `${actionLabel} #${log.codigo_entidad || 'N/D'}`;

  return {
    ...log,
    accion_legible: actionLabel,
    entidad_legible: entityLabel,
    resumen,
    detalle: parsed.detalle,
    evento: parsed.evento,
    criticidad: getActivitySeverity(log.accion as string | null | undefined),
    usuario_nombre: formatUserName(log.usuario as JsonObject | null | undefined),
  };
}

export function formatAuditErrorLog<T extends JsonObject>(log: T): T & JsonObject {
  const nivel = String(log.nivel || 'ERROR').toUpperCase();
  const mensaje = String(log.mensaje || 'Error sin mensaje');

  return {
    ...log,
    resumen: mensaje.length > 160 ? `${mensaje.slice(0, 157)}...` : mensaje,
    origen: [log.metodo, log.endpoint].filter(Boolean).join(' ') || 'Sistema',
    criticidad: nivel === 'CRITICAL' || nivel === 'ERROR' ? 'Alta' : 'Media',
    usuario_nombre: formatUserName(log.usuario as JsonObject | null | undefined),
  };
}

export function stringifyAuditDetail(detail: unknown): string {
  if (!detail) return 'Sin detalle adicional';

  if (typeof detail === 'string') return detail;

  if (typeof detail !== 'object') return String(detail);

  const entries = Object.entries(detail as JsonObject)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .slice(0, 8);

  if (entries.length === 0) return 'Sin detalle adicional';

  return entries
    .map(([key, value]) => `${humanizeKey(key)}: ${formatValue(value)}`)
    .join(' | ');
}

function buildPayloadSummary(payload: AdminEventPayload & { eventType?: string }): string {
  const action = formatAuditAction(payload.entityType, payload.action, payload.eventType);
  const parts = [`${action} #${payload.entityId}`];
  const data = sanitizeDetail(payload.data || {}) as JsonObject;

  if (payload.eventType?.endsWith('.validated') && data.examen) {
    parts.push(`Examen: ${data.examen}`);
  }

  if (payload.eventType?.endsWith('.insumos_deducted')) {
    if (data.movimientos) parts.push(`Movimientos: ${data.movimientos}`);
    if (data.mensaje) parts.push(String(data.mensaje));
  }

  if (payload.eventType?.endsWith('.insumos_failed') && data.error) {
    parts.push(`Error: ${data.error}`);
  }

  for (const key of DETAIL_KEYS) {
    if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
      const rendered = `${humanizeKey(key)}: ${formatValue(data[key])}`;
      if (!parts.includes(rendered)) parts.push(rendered);
      if (parts.length >= 5) break;
    }
  }

  return parts.join(' | ');
}

function sanitizeDetail(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data || {};

  const redactedKeys = new Set(['password', 'contrasena', 'token', 'refreshToken', 'accessToken']);
  const sanitized: JsonObject = {};

  for (const [key, value] of Object.entries(data as JsonObject)) {
    sanitized[key] = redactedKeys.has(key) ? '[OCULTO]' : value;
  }

  return sanitized;
}

function normalizeStoredAction(accion?: string | null, entidad?: string | null): string {
  const category = getAuditActionCategory(accion);

  if (category === 'created' || category === 'updated' || category === 'deleted') {
    return formatAuditAction(entidad, category);
  }

  return accion || 'Registro actividad';
}

function getActivitySeverity(accion?: string | null): string {
  const category = getAuditActionCategory(accion);
  if (category === 'deleted' || category === 'error') return 'Alta';
  if (category === 'updated') return 'Media';
  return 'Informativa';
}

function summarizeObject(value: JsonObject): string | null {
  const summary = stringifyAuditDetail(value);
  return summary === 'Sin detalle adicional' ? null : summary;
}

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function formatUserName(usuario?: JsonObject | null): string {
  if (!usuario) return 'Sistema';
  const nombres = [usuario.nombres, usuario.apellidos].filter(Boolean).join(' ').trim();
  return nombres || String(usuario.email || 'Usuario sin nombre');
}
